from django.db import models
from django.contrib.postgres.fields import ArrayField

from apps.students.models import StudentProfile


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

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class CourseEnrollment(models.Model):
    """Pivot table linking a Course to a Student (enrollment)."""
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
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('course', 'student')]
        ordering = ['-assigned_at']
        indexes = [
            models.Index(fields=['course', 'student']),
        ]

    def __str__(self):
        return f'{self.student.name} → {self.course.name}'
