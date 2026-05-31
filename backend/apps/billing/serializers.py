from rest_framework import serializers

from apps.course.models import Course
from apps.students.models import StudentProfile
from .models import Transaction


class StudentMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['id', 'name', 'phone_number', 'cnic']


class CourseMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name', 'fee']


class TransactionSerializer(serializers.ModelSerializer):
    """Full serializer used for create / update / detail."""

    student_detail = StudentMiniSerializer(source='student', read_only=True)
    course_detail = CourseMiniSerializer(source='course', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'student', 'student_detail',
            'fee_type',
            'course', 'course_detail',
            'month', 'year', 'date',
            'amount', 'status',
            'payment_method', 'card_or_account_number',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        # Year limits validation
        import datetime
        curr_y = datetime.date.today().year
        min_y = curr_y - 100
        year = attrs.get('year', getattr(self.instance, 'year', None))
        if year is not None:
            if year < min_y or year > curr_y:
                raise serializers.ValidationError(
                    {'year': f'Year must be between {min_y} and {curr_y}.'}
                )

        fee_type = attrs.get('fee_type', getattr(self.instance, 'fee_type', None))
        course = attrs.get('course', getattr(self.instance, 'course', None))
        payment_method = attrs.get('payment_method', getattr(self.instance, 'payment_method', None))
        card_or_account_number = attrs.get(
            'card_or_account_number', getattr(self.instance, 'card_or_account_number', '')
        )

        if fee_type == 'Course Fee' and not course:
            raise serializers.ValidationError(
                {'course': 'Course is required when fee type is "Course Fee".'}
            )

        if payment_method and payment_method != 'Cash' and not card_or_account_number:
            raise serializers.ValidationError(
                {'card_or_account_number': 'Account / card number is required for non-cash payment methods.'}
            )

        # Prevent multiple Registration Fee transactions for the same student
        if fee_type == 'Registration Fee':
            student = attrs.get('student', getattr(self.instance, 'student', None))
            qs = Transaction.objects.filter(student=student, fee_type='Registration Fee')
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {'fee_type': 'A Registration Fee transaction already exists for this student.'}
                )

        # Prevent duplicate combination of student, course, month, and year
        if course:
            student = attrs.get('student', getattr(self.instance, 'student', None))
            month = attrs.get('month', getattr(self.instance, 'month', None))
            year = attrs.get('year', getattr(self.instance, 'year', None))

            qs = Transaction.objects.filter(
                student=student,
                course=course,
                month=month,
                year=year,
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {'course': f'A transaction already exists for this student, course, and {month} {year}.'}
                )

        return attrs


class TransactionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view."""

    student_name = serializers.CharField(source='student.name', read_only=True)
    student_cnic = serializers.CharField(source='student.cnic', read_only=True)
    student_phone = serializers.CharField(source='student.phone_number', read_only=True)
    course_name = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id',
            'student', 'student_name', 'student_cnic', 'student_phone',
            'fee_type',
            'course', 'course_name',
            'month', 'year', 'date',
            'amount', 'status',
            'payment_method', 'card_or_account_number',
            'created_at',
        ]

    def get_course_name(self, obj):
        return obj.course.name if obj.course else None
