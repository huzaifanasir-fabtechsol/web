from datetime import time, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.students.models import StudentProfile
from .models import Course, CourseEnrollment
from .services import mark_due_enrollments_passed


def make_student(name="Test Student", cnic="00000-0000000-0"):
    return StudentProfile.objects.create(
        name=name, age=20, phone_number="0300", cnic=cnic,
        admission_date=timezone.localdate(),
        guardian_name="G", guardian_relation="Parent",
        guardian_contact="0301", guardian_cnic="11111-1111111-1",
    )


def make_course(name="Dressage", months=1):
    return Course.objects.create(
        name=name, duration_months=months, fee="100.00",
        class_time=time(10, 0), class_days=["Monday"],
    )


class MarkPassedServiceTests(TestCase):
    def test_due_enrollment_is_marked_passed(self):
        student = make_student()
        course = make_course(months=1)
        # Started ~2 months ago → 1-month course has elapsed.
        enrollment = CourseEnrollment.objects.create(
            course=course, student=student,
            start_date=timezone.localdate() - timedelta(days=60),
        )

        updated = mark_due_enrollments_passed()

        enrollment.refresh_from_db()
        self.assertEqual(updated, 1)
        self.assertEqual(enrollment.status, CourseEnrollment.STATUS_PASSED)

    def test_active_not_yet_due_is_untouched(self):
        student = make_student()
        course = make_course(months=6)
        enrollment = CourseEnrollment.objects.create(
            course=course, student=student, start_date=timezone.localdate(),
        )

        updated = mark_due_enrollments_passed()

        enrollment.refresh_from_db()
        self.assertEqual(updated, 0)
        self.assertEqual(enrollment.status, CourseEnrollment.STATUS_ACTIVE)

    def test_idempotent_already_passed(self):
        student = make_student()
        course = make_course(months=1)
        CourseEnrollment.objects.create(
            course=course, student=student,
            start_date=timezone.localdate() - timedelta(days=60),
            status=CourseEnrollment.STATUS_PASSED,
        )

        # No active rows remain, so a second run updates nothing.
        self.assertEqual(mark_due_enrollments_passed(), 0)


class StudentEnrollmentsEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        user = get_user_model().objects.create_user(
            email="staff@example.com", password="pass1234",
        )
        self.client.force_authenticate(user=user)

    def test_lists_enrollments_with_end_date_and_status(self):
        student = make_student()
        course = make_course(months=1)
        CourseEnrollment.objects.create(
            course=course, student=student,
            start_date=timezone.localdate() - timedelta(days=60),
        )

        res = self.client.get(f"/api/students/{student.pk}/enrollments/")

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 1)
        row = res.data["results"][0]
        self.assertEqual(row["course_name"], "Dressage")
        self.assertIn("end_date", row)
        # Duration has elapsed → derived status reads 'passed' even before the job runs.
        self.assertEqual(row["status"], CourseEnrollment.STATUS_PASSED)

    def test_unknown_student_returns_404(self):
        res = self.client.get("/api/students/999999/enrollments/")
        self.assertEqual(res.status_code, 404)
