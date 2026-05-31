import datetime
from decimal import Decimal
from django.db.models import Sum, Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.students.models import StudentProfile
from apps.course.models import Course
from apps.horse.models import Horse, HorseOwner
from apps.worker.models import Worker
from apps.billing.models import Transaction
from apps.attendance.models import Attendance


def get_filter_date_range(filter_type):
    today = datetime.date.today()
    if filter_type == 'thisMonth':
        start = today.replace(day=1)
        end = today
        return start, end
    elif filter_type == 'lastMonth':
        first_this_month = today.replace(day=1)
        end = first_this_month - datetime.timedelta(days=1)
        start = end.replace(day=1)
        return start, end
    elif filter_type == 'thisYear':
        start = datetime.date(today.year, 1, 1)
        end = today
        return start, end
    elif filter_type == 'lastYear':
        start = datetime.date(today.year - 1, 1, 1)
        end = datetime.date(today.year - 1, 12, 31)
        return start, end
    else:  # allTime
        return None, None


class ReportsDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filter_type = request.query_params.get('filter', 'allTime')
        start_date, end_date = get_filter_date_range(filter_type)

        # ── 1. Summary Cards Logic ──
        students_qs = StudentProfile.objects.all()
        courses_qs = Course.objects.all()
        horses_qs = Horse.objects.all()
        owners_qs = HorseOwner.objects.all()
        workers_qs = Worker.objects.all()
        txns_qs = Transaction.objects.all()

        if start_date and end_date:
            students_qs = students_qs.filter(created_at__date__range=(start_date, end_date))
            courses_qs = courses_qs.filter(created_at__date__range=(start_date, end_date))
            horses_qs = horses_qs.filter(created_at__date__range=(start_date, end_date))
            owners_qs = owners_qs.filter(created_at__date__range=(start_date, end_date))
            workers_qs = workers_qs.filter(created_at__date__range=(start_date, end_date))
            txns_qs = txns_qs.filter(date__range=(start_date, end_date))

        total_students = students_qs.count()
        total_courses = courses_qs.count()
        total_horses = horses_qs.count()
        total_owners = owners_qs.count()
        total_workers = workers_qs.count()

        approved_amt = txns_qs.filter(status='Paid').aggregate(total=Sum('amount'))['total'] or Decimal('0')
        pending_amt = txns_qs.filter(status='Pending').aggregate(total=Sum('amount'))['total'] or Decimal('0')

        summary = {
            'totalStudents': total_students,
            'totalCourses': total_courses,
            'totalHorses': total_horses,
            'totalOwners': total_owners,
            'totalWorkers': total_workers,
            'approvedAmount': float(approved_amt),
            'pendingAmount': float(pending_amt),
        }

        # ── 2. Top Courses ──
        # Top 5 courses by enrolled students
        all_courses = Course.objects.annotate(enrolled_count=Count('enrollments'))
        top_courses = []
        for course in all_courses:
            top_courses.append({
                'id': course.id,
                'name': course.name,
                'fee': float(course.fee),
                'enrolled_count': course.enrolled_count,
            })
        top_courses = sorted(top_courses, key=lambda x: x['enrolled_count'], reverse=True)[:5]

        # ── 3. Latest Transactions ──
        latest_txns = Transaction.objects.select_related('student', 'course').order_by('-date', '-created_at')[:10]
        txns_list = []
        for t in latest_txns:
            txns_list.append({
                'id': t.id,
                'student_name': t.student.name,
                'student_id_display': f'STU-{t.student.pk:03d}',
                'course_name': t.course.name if t.course else 'N/A',
                'fee_type': t.fee_type,
                'month': t.month,
                'year': t.year,
                'date': str(t.date),
                'amount': float(t.amount),
                'status': t.status,
                'payment_method': t.payment_method,
            })

        # ── 4. Consistently Absent Students ──
        # Students absent continuously for the last 3 class days of any course
        consistently_absent = []
        students_pool = StudentProfile.objects.filter(is_active=True)

        for course in all_courses:
            # Find the last 3 distinct dates when attendance was marked for this course
            dates = list(
                Attendance.objects.filter(course=course)
                .order_by('-date')
                .values_list('date', flat=True)
                .distinct()[:3]
            )
            
            if len(dates) == 3:
                # For each student, check if they are absent on all 3 of these dates for this course
                for student in students_pool:
                    absences = Attendance.objects.filter(
                        student=student,
                        course=course,
                        date__in=dates,
                        status='absent'
                    ).count()
                    
                    if absences == 3:
                        pic_url = None
                        if student.profile_picture:
                            pic_url = request.build_absolute_uri(student.profile_picture.url)
                            
                        consistently_absent.append({
                            'student_id': student.id,
                            'student_id_display': f'STU-{student.pk:03d}',
                            'name': student.name,
                            'profile_picture': pic_url,
                            'course_name': course.name,
                            'experience_level': student.experience_level,
                            'last_absent_dates': [str(d) for d in sorted(dates, reverse=True)],
                        })

        return Response({
            'summary': summary,
            'topCourses': top_courses,
            'latestTransactions': txns_list,
            'consistentlyAbsentStudents': consistently_absent,
        })
