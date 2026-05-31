from rest_framework import serializers

from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    """Full serializer — used for create/update/retrieve."""

    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'course', 'date', 'status', 'remarks',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        # Enforce unique_together at serializer level for better error messages
        student = attrs.get('student', getattr(self.instance, 'student', None))
        course  = attrs.get('course',  getattr(self.instance, 'course',  None))
        date    = attrs.get('date',    getattr(self.instance, 'date',    None))

        qs = Attendance.objects.filter(student=student, course=course, date=date)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'An attendance record already exists for this student, course, and date.'
            )
        return attrs


class AttendanceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer with nested read-only student/course info."""
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_id_display = serializers.SerializerMethodField()
    course_name = serializers.CharField(source='course.name', read_only=True)
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'student_id_display',
            'profile_picture', 'course', 'course_name',
            'date', 'status', 'remarks',
        ]

    def get_student_id_display(self, obj):
        return f'STU-{obj.student.pk:03d}'

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.student.profile_picture and request:
            return request.build_absolute_uri(obj.student.profile_picture.url)
        return None


# ── Bulk Log ──────────────────────────────────────────────────────────────────

class AttendanceEntrySerializer(serializers.Serializer):
    """Single student entry inside a bulk-log request."""
    student_id = serializers.IntegerField()
    status     = serializers.ChoiceField(choices=['present', 'absent', 'late'])
    remarks    = serializers.CharField(allow_blank=True, default='')


class AttendanceLogSerializer(serializers.Serializer):
    """Bulk attendance log payload."""
    course_id  = serializers.IntegerField()
    date       = serializers.DateField()
    attendance = AttendanceEntrySerializer(many=True, min_length=1)
