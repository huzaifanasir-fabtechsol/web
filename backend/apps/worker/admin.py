from django.contrib import admin
from .models import Worker


@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = ['name', 'job_role', 'gender', 'email', 'hire_date', 'salary']
    search_fields = ['name', 'email', 'cnic', 'job_role']
    list_filter = ['gender', 'hire_date', 'job_role']
