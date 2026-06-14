from rest_framework import serializers
from .models import Course, CourseEnrollment


class CourseSerializer(serializers.ModelSerializer):
    enrolled_count = serializers.IntegerField(read_only=True, default=0)
    active_count = serializers.SerializerMethodField()
    passed_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'name', 'duration_months', 'fee', 'class_time', 'class_days',
                  'enrolled_count', 'active_count', 'passed_count', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_active_count(self, obj):
        return sum(1 for e in obj.enrollments.filter(student__is_active=True) if e.effective_status() == 'active')

    def get_passed_count(self, obj):
        return sum(1 for e in obj.enrollments.filter(student__is_active=True) if e.effective_status() == 'passed')

    def validate_class_days(self, value):
        valid_days = {'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'}
        if not isinstance(value, list):
            raise serializers.ValidationError("class_days must be a list.")
        for day in value:
            if day not in valid_days:
                raise serializers.ValidationError(f"'{day}' is not a valid weekday.")
        return value


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    """An enrollment from a student's perspective — for the student profile page."""
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_is_active = serializers.BooleanField(source='course.is_active', read_only=True)
    duration_months = serializers.IntegerField(source='course.duration_months', read_only=True)
    fee = serializers.DecimalField(source='course.fee', max_digits=10, decimal_places=2, read_only=True)
    end_date = serializers.DateField(read_only=True)
    status = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = CourseEnrollment
        fields = ['id', 'course', 'course_name', 'course_is_active', 'duration_months', 'fee',
                  'start_date', 'end_date', 'status', 'status_display']

    def get_status(self, obj):
        # Derived on read so the value is correct even between scheduled runs.
        return obj.effective_status()

    def get_status_display(self, obj):
        return dict(CourseEnrollment.STATUS_CHOICES).get(self.get_status(obj), '')


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
