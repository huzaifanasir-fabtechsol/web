# attendance tests placeholder
import datetime
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from apps.students.models import StudentProfile
from apps.course.models import Course, CourseEnrollment
from apps.accounts.models import SystemSettings
from apps.attendance.models import Attendance

User = get_user_model()


class AttendanceEnhancementTests(APITestCase):
    def setUp(self):
        # Create user & auth
        self.user = User.objects.create_user(email="test@example.com", password="password123")
        self.client.force_authenticate(user=self.user)

        # Create Course (3 months duration)
        self.course = Course.objects.create(
            name="Intermediate Riding",
            duration_months=3,
            fee=250.00,
            class_time=datetime.time(10, 0),
            class_days=["Monday", "Wednesday"]
        )

        # Create Students
        self.student_active = StudentProfile.objects.create(
            name="Alice Active",
            cnic="11111-1111111-1",
            phone_number="0300-1111111",
            experience_level="Beginner",
            is_active=True,
            age=20,
            admission_date=datetime.date.today(),
            guardian_name="Guardian Alice",
            guardian_relation="Father",
            guardian_contact="0300-3333333",
            guardian_cnic="11111-1111111-2"
        )
        self.student_expired = StudentProfile.objects.create(
            name="Bob Expired",
            cnic="22222-2222222-2",
            phone_number="0300-2222222",
            experience_level="Intermediate",
            is_active=True,
            age=25,
            admission_date=datetime.date.today() - datetime.timedelta(days=150),
            guardian_name="Guardian Bob",
            guardian_relation="Mother",
            guardian_contact="0300-4444444",
            guardian_cnic="22222-2222222-3"
        )

        # Enroll student_active (started yesterday, active for 3 months)
        self.enroll_active = CourseEnrollment.objects.create(
            course=self.course,
            student=self.student_active,
            start_date=datetime.date.today() - datetime.timedelta(days=1),
            status=CourseEnrollment.STATUS_ACTIVE
        )

        # Enroll student_expired (started 4 months ago, expired)
        self.enroll_expired = CourseEnrollment.objects.create(
            course=self.course,
            student=self.student_expired,
            start_date=datetime.date.today() - datetime.timedelta(days=125),
            status=CourseEnrollment.STATUS_ACTIVE
        )

    def test_enrollment_aware_student_filtering(self):
        # Query course-students endpoint for today
        url = reverse("attendance-course-students")
        response = self.client.get(url, {"course_id": self.course.pk, "date": str(datetime.date.today())})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        students_data = response.data["students"]
        
        # Should only list active enrollment (student_active)
        student_ids = [s["student_id"] for s in students_data]
        self.assertIn(self.student_active.pk, student_ids)
        self.assertNotIn(self.student_expired.pk, student_ids)

    def test_attendance_remap_on_class_days_change(self):
        # Log attendance on Wednesday (which is currently in class_days)
        wednesday_date = datetime.date(2026, 6, 17) # Wednesday
        Attendance.objects.create(
            student=self.student_active,
            course=self.course,
            date=wednesday_date,
            status="present"
        )
        
        # Confirm Wednesday attendance exists
        self.assertTrue(Attendance.objects.filter(course=self.course, date=wednesday_date).exists())
        
        # Change class days to Tuesday/Friday (Wednesday is removed)
        self.course.class_days = ["Tuesday", "Friday"]
        self.course.save()
        
        # Confirm Wednesday attendance record is automatically deleted
        self.assertFalse(Attendance.objects.filter(course=self.course, date=wednesday_date).exists())

    def test_attendance_weekly_off_day_check(self):
        # Set Sunday as weekly off day in settings
        settings_obj = SystemSettings.get_settings()
        settings_obj.weekly_off_days = ["Sunday"]
        settings_obj.save()

        sunday_date = datetime.date(2026, 6, 21) # Sunday
        
        url = reverse("attendance-course-students")
        response = self.client.get(url, {"course_id": self.course.pk, "date": str(sunday_date)})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("is_off_day"))
        self.assertEqual(response.data.get("reason"), "Sunday")

    def test_attendance_holiday_check(self):
        # Add June 25, 2026 as holiday in settings
        holiday_str = "2026-06-25"
        settings_obj = SystemSettings.get_settings()
        settings_obj.holidays = [holiday_str]
        settings_obj.save()

        url = reverse("attendance-course-students")
        response = self.client.get(url, {"course_id": self.course.pk, "date": holiday_str})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("is_off_day"))
        self.assertEqual(response.data.get("reason"), "Holiday")

    def test_holiday_toggle_api(self):
        url = reverse("holiday-toggle")
        
        # Add holiday
        response = self.client.post(url, {"date": "2026-07-04"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("2026-07-04", response.data["holidays"])
        
        # Remove holiday
        response = self.client.delete(url, {"date": "2026-07-04"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("2026-07-04", response.data["holidays"])

    def test_student_monthly_report_generation(self):
        # Mark Alice active as present on June 15 and absent on June 17
        Attendance.objects.create(
            student=self.student_active,
            course=self.course,
            date=datetime.date(2026, 6, 15),
            status="present"
        )
        Attendance.objects.create(
            student=self.student_active,
            course=self.course,
            date=datetime.date(2026, 6, 17),
            status="absent"
        )

        url = reverse("student-attendance-report")
        response = self.client.get(url, {
            "student_id": self.student_active.pk,
            "course_id": self.course.pk,
            "month": 6,
            "year": 2026
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check summary
        self.assertEqual(response.data["summary"]["total_classes"], 2)
        self.assertEqual(response.data["summary"]["days_present"], 1)
        self.assertEqual(response.data["summary"]["days_absent"], 1)
        self.assertEqual(response.data["summary"]["attendance_rate"], 50)

        # Check day view mappings
        day_15 = next(d for d in response.data["day_view"] if d["day"] == 15)
        day_17 = next(d for d in response.data["day_view"] if d["day"] == 17)
        day_1 = next(d for d in response.data["day_view"] if d["day"] == 1)

        self.assertEqual(day_15["status"], "present")
        self.assertEqual(day_17["status"], "absent")
        self.assertEqual(day_1["status"], "no_class")

    def test_student_monthly_report_missing_course_id(self):
        url = reverse("student-attendance-report")
        response = self.client.get(url, {
            "student_id": self.student_active.pk,
            "month": 6,
            "year": 2026
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "course_id is required.")
