from django.db import models
from django.conf import settings


EXPERIENCE_CHOICES = [
    ('Beginner', 'Beginner'),
    ('Intermediate', 'Intermediate'),
    ('Advanced', 'Advanced'),
]

BLOOD_GROUP_CHOICES = [
    ('A+', 'A+'), ('A-', 'A-'),
    ('B+', 'B+'), ('B-', 'B-'),
    ('AB+', 'AB+'), ('AB-', 'AB-'),
    ('O+', 'O+'), ('O-', 'O-'),
]


class StudentProfile(models.Model):
    # User link
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='student_profile',
    )

    # Personal information
    profile_picture = models.ImageField(upload_to='students/pictures/', blank=True, null=True)
    name = models.CharField(max_length=200)
    age = models.PositiveIntegerField()
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, blank=True)
    phone_number = models.CharField(max_length=20)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES, default='Beginner')
    cnic = models.CharField(max_length=20, unique=True)
    admission_date = models.DateField()
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    # Guardian information
    guardian_name = models.CharField(max_length=200)
    guardian_relation = models.CharField(max_length=100)
    guardian_contact = models.CharField(max_length=20)
    guardian_cnic = models.CharField(max_length=20)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name
