from django.contrib import admin
from .models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display  = ('student', 'course', 'date', 'status', 'remarks')
    list_filter   = ('status', 'course', 'date')
    search_fields = ('student__name', 'course__name')
    ordering      = ('-date', 'student__name')
    date_hierarchy = 'date'
