import datetime

from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.students.models import StudentProfile
from apps.course.models import Course, CourseEnrollment
from .models import Attendance
from .serializers import (
    AttendanceSerializer,
    AttendanceListSerializer,
    AttendanceLogSerializer,
)

PAGE_SIZE = 20


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_attendance(pk):
    try:
        return Attendance.objects.select_related('student', 'course').get(pk=pk)
    except Attendance.DoesNotExist:
        return None


# ── List / Create ─────────────────────────────────────────────────────────────

class AttendanceListCreateView(APIView):
    """
    GET  /api/attendance/          → paginated attendance list
    POST /api/attendance/          → create single attendance record
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Attendance.objects.select_related('student', 'course').all()

        # ── Filters ─────────────────────────────────────────────────────────
        course_id = request.query_params.get('course_id', '').strip()
        if course_id:
            qs = qs.filter(course_id=course_id)

        student_id = request.query_params.get('student_id', '').strip()
        if student_id:
            qs = qs.filter(student_id=student_id)

        att_status = request.query_params.get('status', '').strip()
        if att_status:
            qs = qs.filter(status=att_status)

        # Month / year — default to current month
        now = datetime.date.today()
        try:
            month = int(request.query_params.get('month', now.month))
        except (ValueError, TypeError):
            month = now.month
        try:
            year  = int(request.query_params.get('year',  now.year))
        except (ValueError, TypeError):
            year = now.year

        # Only apply month/year if not overridden by an explicit date param
        date_exact = request.query_params.get('date', '').strip()
        if date_exact:
            qs = qs.filter(date=date_exact)
        else:
            qs = qs.filter(date__year=year, date__month=month)

        # Search by student name / cnic
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(student__name__icontains=search) |
                Q(student__cnic__icontains=search) |
                Q(course__name__icontains=search)
            )

        # ── Pagination ───────────────────────────────────────────────────────
        page      = max(int(request.query_params.get('page', 1)), 1)
        page_size = int(request.query_params.get('page_size', PAGE_SIZE))
        total     = qs.count()
        start     = (page - 1) * page_size
        end       = start + page_size
        results   = qs[start:end]

        return Response({
            'count':       total,
            'page':        page,
            'page_size':   page_size,
            'total_pages': (total + page_size - 1) // page_size if total else 1,
            'month':       month,
            'year':        year,
            'results': AttendanceListSerializer(
                results, many=True, context={'request': request}
            ).data,
        })

    def post(self, request):
        s = AttendanceSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)


# ── Detail ────────────────────────────────────────────────────────────────────

class AttendanceDetailView(APIView):
    """
    GET    /api/attendance/<pk>/   → retrieve
    PATCH  /api/attendance/<pk>/   → partial update
    PUT    /api/attendance/<pk>/   → full update
    DELETE /api/attendance/<pk>/   → delete
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        obj = _get_attendance(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AttendanceListSerializer(obj, context={'request': request}).data)

    def put(self, request, pk):
        obj = _get_attendance(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = AttendanceSerializer(obj, data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def patch(self, request, pk):
        obj = _get_attendance(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = AttendanceSerializer(obj, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        obj = _get_attendance(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Bulk Log ──────────────────────────────────────────────────────────────────

class AttendanceLogView(APIView):
    """
    POST /api/attendance/log/
    Upserts attendance for every student in the payload for the given course+date.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = AttendanceLogSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data

        course_id  = data['course_id']
        att_date   = data['date']
        entries    = data['attendance']

        # Validate course exists
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response({'detail': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Collect student ids and validate
        student_ids = [e['student_id'] for e in entries]
        students_qs = StudentProfile.objects.filter(pk__in=student_ids)
        found_ids   = set(students_qs.values_list('pk', flat=True))
        missing     = set(student_ids) - found_ids
        if missing:
            return Response(
                {'detail': f'Students not found: {sorted(missing)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for entry in entries:
                obj, created = Attendance.objects.update_or_create(
                    student_id=entry['student_id'],
                    course=course,
                    date=att_date,
                    defaults={
                        'status':  entry['status'],
                        'remarks': entry.get('remarks', ''),
                    },
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        return Response({
            'detail':  'Attendance saved successfully.',
            'created': created_count,
            'updated': updated_count,
            'course':  course.name,
            'date':    str(att_date),
            'total':   created_count + updated_count,
        }, status=status.HTTP_200_OK)


# ── Students for a Course ─────────────────────────────────────────────────────

class CourseStudentsForAttendanceView(APIView):
    """
    GET /api/attendance/course-students/?course_id=<id>&date=<YYYY-MM-DD>

    Returns all students for a course, with their existing attendance record
    for the given date pre-populated (if any).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        course_id = request.query_params.get('course_id', '').strip()
        date_str  = request.query_params.get('date', '').strip()

        if not course_id:
            return Response({'detail': 'course_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response({'detail': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Parse date (default today)
        if date_str:
            try:
                att_date = datetime.date.fromisoformat(date_str)
            except ValueError:
                return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            att_date = datetime.date.today()

        # Only active students enrolled in this course
        enrolled_ids = CourseEnrollment.objects.filter(
            course=course
        ).values_list('student_id', flat=True)
        students = StudentProfile.objects.filter(
            pk__in=enrolled_ids, is_active=True
        ).order_by('name')

        # Existing attendance records for this course/date (one query)
        existing = {
            a.student_id: a
            for a in Attendance.objects.filter(course=course, date=att_date)
        }

        result = []
        for student in students:
            att = existing.get(student.pk)
            pic_url = None
            if student.profile_picture:
                pic_url = request.build_absolute_uri(student.profile_picture.url)
            result.append({
                'student_id':       student.pk,
                'student_id_display': f'STU-{student.pk:03d}',
                'name':             student.name,
                'profile_picture':  pic_url,
                'attendance_id':    att.pk if att else None,
                'status':           att.status if att else None,
                'remarks':          att.remarks if att else '',
            })

        return Response({
            'course_id':   course.pk,
            'course_name': course.name,
            'date':        str(att_date),
            'students':    result,
        })
