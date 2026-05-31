from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Transaction
from .serializers import TransactionSerializer, TransactionListSerializer

PAGE_SIZE = 10


class TransactionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Transaction.objects.select_related('student', 'course').all()

        # ── Search ──────────────────────────────────────────────────────────
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(student__name__icontains=search) |
                Q(student__cnic__icontains=search) |
                Q(student__phone_number__icontains=search) |
                Q(course__name__icontains=search)
            )

        # ── Filters ─────────────────────────────────────────────────────────
        course_id = request.query_params.get('course', '').strip()
        if course_id:
            qs = qs.filter(course_id=course_id)

        fee_type = request.query_params.get('fee_type', '').strip()
        if fee_type:
            qs = qs.filter(fee_type=fee_type)

        txn_status = request.query_params.get('status', '').strip()
        if txn_status:
            qs = qs.filter(status=txn_status)

        payment_method = request.query_params.get('payment_method', '').strip()
        if payment_method:
            qs = qs.filter(payment_method=payment_method)

        month = request.query_params.get('month', '').strip()
        if month:
            qs = qs.filter(month=month)

        year = request.query_params.get('year', '').strip()
        if year:
            qs = qs.filter(year=year)

        date_from = request.query_params.get('date_from', '').strip()
        if date_from:
            qs = qs.filter(date__gte=date_from)

        date_to = request.query_params.get('date_to', '').strip()
        if date_to:
            qs = qs.filter(date__lte=date_to)

        # ── Pagination ───────────────────────────────────────────────────────
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
            'results': TransactionListSerializer(results, many=True).data,
        })

    def post(self, request):
        s = TransactionSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)


class TransactionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_object(self, pk):
        try:
            return Transaction.objects.select_related('student', 'course').get(pk=pk)
        except Transaction.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TransactionSerializer(obj).data)

    def put(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = TransactionSerializer(obj, data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def patch(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = TransactionSerializer(obj, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
