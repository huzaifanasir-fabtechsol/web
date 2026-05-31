from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Worker
from .serializers import WorkerSerializer

PAGE_SIZE = 10


class WorkerListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Worker.objects.all()

        # General Search (name, email, cnic)
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(cnic__icontains=search)
            )

        # Filter by gender
        gender = request.query_params.get('gender', '').strip()
        if gender:
            qs = qs.filter(gender__iexact=gender)

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
            'results': WorkerSerializer(results, many=True, context={'request': request}).data,
        })

    def post(self, request):
        s = WorkerSerializer(data=request.data, context={'request': request})
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)


class WorkerDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_object(self, pk):
        try:
            return Worker.objects.get(pk=pk)
        except Worker.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(WorkerSerializer(obj, context={'request': request}).data)

    def put(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = WorkerSerializer(obj, data=request.data, context={'request': request})
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def patch(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = WorkerSerializer(obj, data=request.data, partial=True, context={'request': request})
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
