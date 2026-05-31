from django.urls import path
from .views import (
    DashboardSummaryView,
    RevenueTrendView,
    LatestHorsesView,
    LatestStudentsView,
)

urlpatterns = [
    path('summary/',         DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('revenue-trend/',   RevenueTrendView.as_view(),     name='dashboard-revenue-trend'),
    path('latest-horses/',   LatestHorsesView.as_view(),     name='dashboard-latest-horses'),
    path('latest-students/', LatestStudentsView.as_view(),   name='dashboard-latest-students'),
]
