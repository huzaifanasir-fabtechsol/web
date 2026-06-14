from django.urls import path
from .views import StudentListCreateView, StudentDetailView, StudentBulkStatusView
from apps.course.views import StudentEnrollmentsView

urlpatterns = [
    path('', StudentListCreateView.as_view(), name='student-list-create'),
    path('bulk-status/', StudentBulkStatusView.as_view(), name='student-bulk-status'),
    path('<int:student_id>/enrollments/', StudentEnrollmentsView.as_view(), name='student-enrollments'),
    path('<int:pk>/', StudentDetailView.as_view(), name='student-detail'),
]
