from rest_framework import serializers
from .models import Course, CourseEnrollment


class CourseSerializer(serializers.ModelSerializer):
    enrolled_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Course
        fields = ['id', 'name', 'duration_months', 'fee', 'class_time', 'class_days',
                  'enrolled_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_class_days(self, value):
        valid_days = {'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'}
        if not isinstance(value, list):
            raise serializers.ValidationError("class_days must be a list.")
        for day in value:
            if day not in valid_days:
                raise serializers.ValidationError(f"'{day}' is not a valid weekday.")
        return value


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    experience_level = serializers.CharField(source='student.experience_level', read_only=True)
    is_active = serializers.BooleanField(source='student.is_active', read_only=True)
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = CourseEnrollment
        fields = ['id', 'course', 'student', 'student_name', 'experience_level',
                  'is_active', 'profile_picture', 'assigned_at']
        read_only_fields = ['id', 'assigned_at']

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.student.profile_picture and request:
            return request.build_absolute_uri(obj.student.profile_picture.url)
        return None
