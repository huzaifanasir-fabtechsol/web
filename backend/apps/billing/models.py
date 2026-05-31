from django.db import models
from django.core.exceptions import ValidationError

from apps.students.models import StudentProfile
from apps.course.models import Course


FEE_TYPE_CHOICES = [
    ('Registration Fee', 'Registration Fee'),
    ('Course Fee', 'Course Fee'),
]

STATUS_CHOICES = [
    ('Paid', 'Paid'),
    ('Pending', 'Pending'),
    ('Failed', 'Failed'),
]

PAYMENT_METHOD_CHOICES = [
    ('Cash', 'Cash'),
    ('Bank Transfer', 'Bank Transfer'),
    ('Card', 'Card'),
    ('JazzCash', 'JazzCash'),
    ('EasyPaisa', 'EasyPaisa'),
]

MONTH_CHOICES = [
    ('January', 'January'),
    ('February', 'February'),
    ('March', 'March'),
    ('April', 'April'),
    ('May', 'May'),
    ('June', 'June'),
    ('July', 'July'),
    ('August', 'August'),
    ('September', 'September'),
    ('October', 'October'),
    ('November', 'November'),
    ('December', 'December'),
]


def current_year():
    import datetime
    return datetime.date.today().year

class Transaction(models.Model):
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='transactions',
    )
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES)
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
    )
    month = models.CharField(max_length=20, choices=MONTH_CHOICES)
    # Fee year — needed to identify uniqueness per year/month
    year = models.PositiveIntegerField(default=current_year)
    date = models.DateField(help_text='Transaction / payment date')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='Cash')
    card_or_account_number = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'fee_type', 'course', 'month', 'year']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_method']),
            models.Index(fields=['date']),
        ]

    def clean(self):
        # Year limits validation (past 100 years, no future years)
        import datetime
        curr_y = datetime.date.today().year
        min_y = curr_y - 100
        if self.year < min_y or self.year > curr_y:
            raise ValidationError({'year': f'Year must be between {min_y} and {curr_y}.'})

        # course required for Course Fee
        if self.fee_type == 'Course Fee' and not self.course_id:
            raise ValidationError({'course': 'Course is required when fee type is "Course Fee".'})

        # card_or_account_number required for non-cash methods
        if self.payment_method != 'Cash' and not self.card_or_account_number:
            raise ValidationError({
                'card_or_account_number': 'Account / card number is required for non-cash payment methods.'
            })

        # Prevent multiple Registration Fee transactions for the same student
        if self.fee_type == 'Registration Fee':
            qs = Transaction.objects.filter(
                student=self.student,
                fee_type='Registration Fee'
            )
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError({
                    'fee_type': 'A Registration Fee transaction already exists for this student.'
                })

        # Prevent duplicate combination of student, course, month, and year
        if self.course_id:
            qs = Transaction.objects.filter(
                student=self.student,
                course=self.course,
                month=self.month,
                year=self.year,
            )
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError({
                    'course': f'A transaction already exists for this student, course, and {self.month} {self.year}.'
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.student.name} – {self.fee_type} – {self.month} {self.year}'
