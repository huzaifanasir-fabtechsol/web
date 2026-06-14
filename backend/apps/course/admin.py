from django.contrib import admin
from .models import Course, CourseEnrollment


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'duration_months', 'fee', 'class_time', 'is_active', 'created_at']
    search_fields = ['name']
    list_filter = ['is_active', 'duration_months']

@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['course', 'student', 'assigned_at', 'end_date']
    search_fields = ['course__name', 'student__name']
    list_filter = ['course', 'student', 'assigned_at']
 
