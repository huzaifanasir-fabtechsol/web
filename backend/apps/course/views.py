from django.db.models import Q, Count
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Course, CourseEnrollment
from .serializers import CourseSerializer
from apps.students.models import StudentProfile

PAGE_SIZE = 10


class CourseListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Course.objects.annotate(enrolled_count=Count('enrollments'))

        # Search
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(duration_months__icontains=search) |
                Q(fee__icontains=search)
            )

        # Filter by class_days (comma-separated list of days)
        class_days = request.query_params.get('class_days', '').strip()
        if class_days:
            days = [d.strip() for d in class_days.split(',') if d.strip()]
            for day in days:
                qs = qs.filter(class_days__icontains=f'"{day}"')

        # Pagination
        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = int(request.query_params.get('page_size', PAGE_SIZE))
        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        results = qs[start:end]

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size if total else 1,
            'results': CourseSerializer(results, many=True).data,
        })

    def post(self, request):
        s = CourseSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)


class CourseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_object(self, pk):
        try:
            return Course.objects.annotate(enrolled_count=Count('enrollments')).get(pk=pk)
        except Course.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(CourseSerializer(obj).data)

    def put(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = CourseSerializer(obj, data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def patch(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = CourseSerializer(obj, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Course Enrollment Management ──────────────────────────────────────────────

class CourseEnrollmentView(APIView):
    """
    GET    /api/courses/<pk>/enrollment/?tab=assigned|unassigned|all&search=&page=
    POST   /api/courses/<pk>/enrollment/   { "student_ids": [1,2,3] }  → bulk enroll
    DELETE /api/courses/<pk>/enrollment/   { "student_ids": [1,2,3] }  → bulk unenroll
    """
    permission_classes = [IsAuthenticated]

    def _get_course(self, pk):
        try:
            return Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return None

    def get(self, request, pk):
        course = self._get_course(pk)
        if not course:
            return Response({'detail': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        tab = request.query_params.get('tab', 'assigned').strip().lower()
        search = request.query_params.get('search', '').strip()
        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = int(request.query_params.get('page_size', 15))

        enrolled_ids = set(
            CourseEnrollment.objects.filter(course=course).values_list('student_id', flat=True)
        )

        if tab == 'assigned':
            qs = StudentProfile.objects.filter(pk__in=enrolled_ids, is_active=True)
        elif tab == 'unassigned':
            qs = StudentProfile.objects.filter(is_active=True).exclude(pk__in=enrolled_ids)
        else:  # 'all'
            qs = StudentProfile.objects.filter(is_active=True)

        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(cnic__icontains=search) |
                Q(phone_number__icontains=search)
            )

        qs = qs.order_by('name')
        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        students = qs[start:end]

        result = []
        for s in students:
            pic_url = None
            if s.profile_picture:
                pic_url = request.build_absolute_uri(s.profile_picture.url)
            result.append({
                'id': s.pk,
                'name': s.name,
                'cnic': s.cnic,
                'phone_number': s.phone_number,
                'experience_level': s.experience_level,
                'is_active': s.is_active,
                'is_enrolled': s.pk in enrolled_ids,
                'profile_picture': pic_url,
            })

        return Response({
            'course_id': course.pk,
            'course_name': course.name,
            'tab': tab,
            'enrolled_count': len(enrolled_ids),
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size if total else 1,
            'results': result,
        })

    def post(self, request, pk):
        """Bulk enroll students into a course."""
        course = self._get_course(pk)
        if not course:
            return Response({'detail': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        student_ids = request.data.get('student_ids', [])
        if not student_ids or not isinstance(student_ids, list):
            return Response({'detail': 'student_ids list is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate students exist and are active
        valid_students = StudentProfile.objects.filter(pk__in=student_ids, is_active=True)
        valid_ids = set(valid_students.values_list('pk', flat=True))
        invalid_ids = set(student_ids) - valid_ids
        if invalid_ids:
            return Response(
                {'detail': f'Students not found or inactive: {sorted(invalid_ids)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Bulk create (ignore duplicates)
        created_count = 0
        for sid in valid_ids:
            _, created = CourseEnrollment.objects.get_or_create(course=course, student_id=sid)
            if created:
                created_count += 1

        total_enrolled = CourseEnrollment.objects.filter(course=course).count()

        return Response({
            'detail': f'{created_count} student(s) enrolled successfully.',
            'created': created_count,
            'total_enrolled': total_enrolled,
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        """Bulk unenroll students from a course."""
        course = self._get_course(pk)
        if not course:
            return Response({'detail': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        student_ids = request.data.get('student_ids', [])
        if not student_ids or not isinstance(student_ids, list):
            return Response({'detail': 'student_ids list is required.'}, status=status.HTTP_400_BAD_REQUEST)

        deleted_count, _ = CourseEnrollment.objects.filter(
            course=course, student_id__in=student_ids
        ).delete()

        total_enrolled = CourseEnrollment.objects.filter(course=course).count()

        return Response({
            'detail': f'{deleted_count} student(s) removed successfully.',
            'removed': deleted_count,
            'total_enrolled': total_enrolled,
        }, status=status.HTTP_200_OK)
