from rest_framework import serializers
from .models import StudentProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user', 'profile_picture', 'name', 'age', 'blood_group',
            'phone_number', 'experience_level', 'cnic', 'admission_date',
            'address', 'is_active',
            'guardian_name', 'guardian_relation', 'guardian_contact', 'guardian_cnic',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentProfileListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list endpoints."""
    class Meta:
        model = StudentProfile
        fields = [
            'id', 'profile_picture', 'name', 'age', 'phone_number',
            'experience_level', 'cnic', 'admission_date', 'is_active',
            'guardian_name', 'guardian_contact', 'guardian_cnic', 'admission_date',
            'address', 'blood_group', 'guardian_relation'
        ]
