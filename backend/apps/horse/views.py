from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import HorseOwner, Horse
from .serializers import HorseOwnerSerializer, HorseSerializer

PAGE_SIZE = 10


class HorseOwnerListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Dynamically seed/ensure the Company Owned system-owned profile exists
        HorseOwner.objects.get_or_create(
            owner_type='Company Owned',
            defaults={
                'name': 'Company Owned',
                'phone': 'N/A',
                'email': 'company@stable.com',
                'cnic': 'N/A',
                'joined_date': '2026-01-01',
                'address': 'Internal Stable'
            }
        )

        qs = HorseOwner.objects.all()

        # By default, exclude the system-owned profile from standard Owners Management listings
        include_company = request.query_params.get('include_company', 'false').lower() == 'true'
        if not include_company:
            qs = qs.exclude(owner_type='Company Owned')

        # General Search
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(address__icontains=search)
            )

        # Specific Filters
        name = request.query_params.get('name', '').strip()
        if name:
            qs = qs.filter(name__icontains=name)

        email = request.query_params.get('email', '').strip()
        if email:
            qs = qs.filter(email__icontains=email)

        address = request.query_params.get('address', '').strip()
        if address:
            qs = qs.filter(address__icontains=address)

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
            'results': HorseOwnerSerializer(results, many=True).data,
        })

    def post(self, request):
        s = HorseOwnerSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)


class HorseOwnerDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_object(self, pk):
        try:
            return HorseOwner.objects.get(pk=pk)
        except HorseOwner.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(HorseOwnerSerializer(obj).data)

    def put(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = HorseOwnerSerializer(obj, data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def patch(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = HorseOwnerSerializer(obj, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class HorseListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Horse.objects.all()

        # General Search
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(horse_name__icontains=search) |
                Q(owner__name__icontains=search) |
                Q(owner__email__icontains=search) |
                Q(color__icontains=search) |
                Q(breed__icontains=search) |
                Q(gender__iexact=search)
            )

        # Specific Filters
        owner_name = request.query_params.get('owner_name', '').strip()
        if owner_name:
            qs = qs.filter(owner__name__icontains=owner_name)

        owner_email = request.query_params.get('owner_email', '').strip()
        if owner_email:
            qs = qs.filter(owner__email__icontains=owner_email)

        color = request.query_params.get('color', '').strip()
        if color:
            qs = qs.filter(color__icontains=color)

        breed = request.query_params.get('breed', '').strip()
        if breed:
            qs = qs.filter(breed__icontains=breed)

        horse_name = request.query_params.get('horse_name', '').strip()
        if horse_name:
            qs = qs.filter(horse_name__icontains=horse_name)

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
            'results': HorseSerializer(results, many=True).data,
        })

    def post(self, request):
        s = HorseSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)


class HorseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_object(self, pk):
        try:
            return Horse.objects.get(pk=pk)
        except Horse.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(HorseSerializer(obj).data)

    def put(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = HorseSerializer(obj, data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def patch(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        s = HorseSerializer(obj, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        obj = self._get_object(pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
