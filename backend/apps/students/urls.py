from django.urls import path
from .views import StudentListCreateView, StudentDetailView, StudentBulkStatusView

urlpatterns = [
    path('', StudentListCreateView.as_view(), name='student-list-create'),
    path('bulk-status/', StudentBulkStatusView.as_view(), name='student-bulk-status'),
    path('<int:pk>/', StudentDetailView.as_view(), name='student-detail'),
]
