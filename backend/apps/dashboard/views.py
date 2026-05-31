"""
Dashboard views — all read-only, no models needed.

Endpoints
---------
GET /api/dashboard/summary
GET /api/dashboard/revenue-trend?range=last12Months|lastMonth|thisMonth
GET /api/dashboard/latest-horses
GET /api/dashboard/latest-students
"""
import calendar
import datetime
from decimal import Decimal

from django.db.models import Sum, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.students.models import StudentProfile
from apps.horse.models import Horse
from apps.course.models import Course
from apps.billing.models import Transaction


# ── helpers ───────────────────────────────────────────────────────────────────

def _month_range(year: int, month: int):
    """Return (first_day, last_day) for a given year/month."""
    last = calendar.monthrange(year, month)[1]
    return datetime.date(year, month, 1), datetime.date(year, month, last)


def _prev_month(year: int, month: int):
    """Return (prev_year, prev_month)."""
    if month == 1:
        return year - 1, 12
    return year, month - 1


def _trend(current: int | float | Decimal, previous: int | float | Decimal) -> dict:
    """Compute percentage trend compared to previous period."""
    try:
        current  = float(current)
        previous = float(previous)
    except (TypeError, ValueError):
        current = previous = 0.0

    if previous == 0:
        pct = 100.0 if current > 0 else 0.0
        direction = 'up' if current > 0 else 'neutral'
    else:
        pct = round(((current - previous) / previous) * 100, 1)
        direction = 'up' if pct > 0 else ('down' if pct < 0 else 'neutral')

    return {'value': abs(pct), 'direction': direction}


# ── Summary ───────────────────────────────────────────────────────────────────

class DashboardSummaryView(APIView):
    """
    GET /api/dashboard/summary
    Returns key metrics with month-over-month trends.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = datetime.date.today()
        cur_y, cur_m = today.year, today.month
        pre_y, pre_m = _prev_month(cur_y, cur_m)

        cur_start, cur_end = _month_range(cur_y, cur_m)
        pre_start, pre_end = _month_range(pre_y, pre_m)

        # ── Students ─────────────────────────────────────────────────────────
        total_students = StudentProfile.objects.count()
        prev_students  = StudentProfile.objects.filter(
            created_at__date__lte=pre_end
        ).count()
        cur_students   = StudentProfile.objects.filter(
            created_at__date__lte=cur_end
        ).count()

        # ── Horses ───────────────────────────────────────────────────────────
        total_horses = Horse.objects.count()
        prev_horses  = Horse.objects.filter(created_at__date__lte=pre_end).count()
        cur_horses   = Horse.objects.filter(created_at__date__lte=cur_end).count()

        # ── Courses ──────────────────────────────────────────────────────────
        total_courses = Course.objects.count()
        prev_courses  = Course.objects.filter(created_at__date__lte=pre_end).count()
        cur_courses   = Course.objects.filter(created_at__date__lte=cur_end).count()

        # ── Revenue (current month) ───────────────────────────────────────────
        def _agg(start, end, status_list):
            qs = Transaction.objects.filter(date__range=(start, end))
            if status_list:
                qs = qs.filter(status__in=status_list)
            return qs.aggregate(total=Sum('amount'))['total'] or Decimal('0')

        paid_cur    = _agg(cur_start, cur_end, ['Paid'])
        pending_cur = _agg(cur_start, cur_end, ['Pending'])
        paid_pre    = _agg(pre_start, pre_end, ['Paid'])

        return Response({
            'totalStudents': {
                'count': total_students,
                'trend': _trend(cur_students, prev_students),
            },
            'horses': {
                'count': total_horses,
                'trend': _trend(cur_horses, prev_horses),
            },
            'courses': {
                'count': total_courses,
                'trend': _trend(cur_courses, prev_courses),
            },
            'revenue': {
                'paidAmount':    float(paid_cur),
                'pendingAmount': float(pending_cur),
                'trend':         _trend(paid_cur, paid_pre),
            },
        })


# ── Revenue Trend ─────────────────────────────────────────────────────────────

class RevenueTrendView(APIView):
    """
    GET /api/dashboard/revenue-trend?range=last12Months|lastMonth|thisMonth
    Returns revenue labels + amounts. Expenses are intentionally excluded.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        range_param = request.query_params.get('range', 'last12Months')
        today       = datetime.date.today()
        data        = []

        if range_param == 'last12Months':
            # 12 monthly buckets ending this month
            for i in range(11, -1, -1):
                # Go back i months from today
                month = today.month - i
                year  = today.year
                while month <= 0:
                    month += 12
                    year  -= 1

                start, end = _month_range(year, month)
                total = (
                    Transaction.objects
                    .filter(date__range=(start, end), status='Paid')
                    .aggregate(total=Sum('amount'))['total'] or Decimal('0')
                )
                data.append({
                    'label':   calendar.month_abbr[month],
                    'revenue': float(total),
                })

        elif range_param in ('lastMonth', 'thisMonth'):
            if range_param == 'thisMonth':
                y, m = today.year, today.month
            else:
                y, m = _prev_month(today.year, today.month)

            start, end = _month_range(y, m)
            # Daily buckets
            current_day = start
            while current_day <= end:
                total = (
                    Transaction.objects
                    .filter(date=current_day, status='Paid')
                    .aggregate(total=Sum('amount'))['total'] or Decimal('0')
                )
                data.append({
                    'label':   str(current_day),
                    'revenue': float(total),
                })
                current_day += datetime.timedelta(days=1)

        else:
            return Response(
                {'detail': 'Invalid range. Use last12Months, lastMonth, or thisMonth.'},
                status=400,
            )

        return Response(data)


# ── Latest Horses ─────────────────────────────────────────────────────────────

class LatestHorsesView(APIView):
    """GET /api/dashboard/latest-horses — 10 most recently added horses."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        horses = (
            Horse.objects
            .select_related('owner')
            .order_by('-created_at')[:10]
        )
        data = [
            {
                'id':           h.id,
                'horse_name':   h.horse_name,
                'breed':        h.breed,
                'color':        h.color,
                'gender':       h.gender,
                'arrival_date': str(h.arrival_date),
                'owner_name':   h.owner.name,
                'created_at':   h.created_at.isoformat(),
            }
            for h in horses
        ]
        return Response({'count': len(data), 'results': data})


# ── Latest Students ───────────────────────────────────────────────────────────

class LatestStudentsView(APIView):
    """GET /api/dashboard/latest-students — 10 most recently registered students."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        students = (
            StudentProfile.objects
            .order_by('-created_at')[:10]
        )

        def pic_url(student):
            if student.profile_picture:
                return request.build_absolute_uri(student.profile_picture.url)
            return None

        data = [
            {
                'id':               s.id,
                'student_id':       f'STU-{s.pk:03d}',
                'name':             s.name,
                'phone_number':     s.phone_number,
                'experience_level': s.experience_level,
                'admission_date':   str(s.admission_date),
                'is_active':        s.is_active,
                'profile_picture':  pic_url(s),
                'created_at':       s.created_at.isoformat(),
            }
            for s in students
        ]
        return Response({'count': len(data), 'results': data})
