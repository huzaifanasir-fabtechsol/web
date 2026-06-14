import calendar
from datetime import date

from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone

from apps.students.models import StudentProfile


def add_months(start, months):
    """Return ``start`` (a date) advanced by ``months`` calendar months.

    Clamps the day to the last valid day of the target month (e.g. Jan 31 + 1
    month -> Feb 28). Used to compute an enrollment's end date from its course
    duration without pulling in python-dateutil.
    """
    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    day = min(start.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


WEEKDAY_CHOICES = [
    ('Monday', 'Monday'),
    ('Tuesday', 'Tuesday'),
    ('Wednesday', 'Wednesday'),
    ('Thursday', 'Thursday'),
    ('Friday', 'Friday'),
    ('Saturday', 'Saturday'),
    ('Sunday', 'Sunday'),
]


class Course(models.Model):
    name = models.CharField(max_length=200)
    duration_months = models.PositiveIntegerField(help_text="Duration in months")
    fee = models.DecimalField(max_digits=10, decimal_places=2)
    class_time = models.TimeField()
    class_days = models.JSONField(default=list, help_text="List of weekdays e.g. ['Monday', 'Wednesday']")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if not is_new:
            from apps.attendance.models import Attendance
            days_to_keep = {d.strip().title() for d in (self.class_days or []) if d}
            attendances = Attendance.objects.filter(course=self)
            to_delete_ids = []
            for att in attendances:
                weekday_name = att.date.strftime('%A')
                if weekday_name not in days_to_keep:
                    to_delete_ids.append(att.pk)
            if to_delete_ids:
                Attendance.objects.filter(pk__in=to_delete_ids).delete()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class CourseEnrollment(models.Model):
    """Pivot table linking a Course to a Student (enrollment)."""

    STATUS_ACTIVE = 'active'
    STATUS_PASSED = 'passed'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_PASSED, 'Passed'),
    ]

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    start_date = models.DateField(
        default=timezone.localdate,
        help_text="Date the enrollment begins; end date is start_date + course duration.",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
        db_index=True,
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('course', 'student')]
        ordering = ['-assigned_at']
        indexes = [
            models.Index(fields=['course', 'student']),
        ]

    def __str__(self):
        return f'{self.student.name} → {self.course.name}'

    @property
    def end_date(self):
        """Enrollment end date = start_date + the course's duration (in months)."""
        return add_months(self.start_date, self.course.duration_months)

    def is_due(self, as_of=None):
        """True when the course duration has elapsed (end date is today or past)."""
        as_of = as_of or timezone.localdate()
        return self.end_date <= as_of

    def effective_status(self, as_of=None):
        """Status derived from dates, so reads are correct even between cron runs.

        Once persisted as 'passed' it stays passed; otherwise it is 'passed' as
        soon as the duration has elapsed, else 'active'.
        """
        if self.status == self.STATUS_PASSED:
            return self.STATUS_PASSED
        return self.STATUS_PASSED if self.is_due(as_of) else self.STATUS_ACTIVE
