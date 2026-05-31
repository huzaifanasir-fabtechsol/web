from django.contrib import admin
from .models import StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['name', 'age', 'phone_number', 'experience_level', 'is_active', 'admission_date']
    search_fields = ['name', 'phone_number', 'cnic', 'guardian_name']
    list_filter = ['is_active', 'experience_level', 'blood_group']
