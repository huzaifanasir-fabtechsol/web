from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import StudentProfile
from .serializers import StudentProfileSerializer, StudentProfileListSerializer

PAGE_SIZE = 10


class StudentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = StudentProfile.objects.all()

        # Search
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(cnic__icontains=search) |
                Q(guardian_name__icontains=search) |
                Q(guardian_contact__icontains=search) |
                Q(guardian_cnic__icontains=search)
            )

        # Filter by active status
        is_active = request.query_params.get('is_active', '').strip().lower()
        if is_active == 'true':
            qs = qs.filter(is_active=True)
        elif is_active == 'false':
            qs = qs.filter(is_active=False)

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
            'results': StudentProfileListSerializer(results, many=True, context={'request': request}).data,
        })

    def post(self, request):
        s = StudentProfileSerializer(data=request.data, context={'request': request})
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)


class StudentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_object(self, pk):
        try:
            return StudentProfile.objects.get(pk=pk)
        except StudentProfile.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(StudentProfileSerializer(obj, context={'request': request}).data)

    def put(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = StudentProfileSerializer(obj, data=request.data, context={'request': request})
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def patch(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = StudentProfileSerializer(obj, data=request.data, partial=True, context={'request': request})
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentBulkStatusView(APIView):
    """
    PATCH /api/students/bulk-status/
    Body: { "student_ids": [1, 2, 3], "is_active": true/false }
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        student_ids = request.data.get('student_ids', [])
        is_active = request.data.get('is_active')

        if not student_ids or not isinstance(student_ids, list):
            return Response(
                {'detail': 'student_ids list is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if is_active is None or not isinstance(is_active, bool):
            return Response(
                {'detail': 'is_active boolean is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = StudentProfile.objects.filter(pk__in=student_ids).update(is_active=is_active)
        action = 'activated' if is_active else 'deactivated'

        return Response({
            'detail': f'{updated} student(s) {action} successfully.',
            'updated': updated,
        })
