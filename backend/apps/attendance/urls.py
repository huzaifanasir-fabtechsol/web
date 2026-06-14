from django.urls import path
from .views import (
    AttendanceListCreateView,
    AttendanceDetailView,
    AttendanceLogView,
    CourseStudentsForAttendanceView,
    StudentMonthlyAttendanceReportView,
)

urlpatterns = [
    path('',               AttendanceListCreateView.as_view(),      name='attendance-list-create'),
    path('<int:pk>/',      AttendanceDetailView.as_view(),           name='attendance-detail'),
    path('log/',           AttendanceLogView.as_view(),              name='attendance-log'),
    path('course-students/', CourseStudentsForAttendanceView.as_view(), name='attendance-course-students'),
    path('student-report/', StudentMonthlyAttendanceReportView.as_view(), name='student-attendance-report'),
]
