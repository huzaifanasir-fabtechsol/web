from django.db import models
from django.core.exceptions import ValidationError

from apps.students.models import StudentProfile
from apps.course.models import Course


STATUS_CHOICES = [
    ('present', 'Present'),
    ('absent', 'Absent'),
    ('late', 'Late'),
]


class Attendance(models.Model):
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='attendances',
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='attendances',
    )
    date = models.DateField(help_text='Attendance date')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    remarks = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', 'student__name']
        unique_together = [('student', 'course', 'date')]
        indexes = [
            models.Index(fields=['course', 'date']),
            models.Index(fields=['student', 'course']),
            models.Index(fields=['status']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f'{self.student.name} – {self.course.name} – {self.date} – {self.status}'
