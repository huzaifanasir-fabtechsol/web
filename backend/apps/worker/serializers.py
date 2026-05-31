from rest_framework import serializers
from .models import Worker


class WorkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Worker
        fields = [
            'id', 'name', 'profile_photo', 'date_of_birth', 'cnic',
            'gender', 'email', 'job_role', 'hire_date', 'salary',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
