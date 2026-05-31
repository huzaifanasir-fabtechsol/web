from django.db import models

GENDER_CHOICES = [
    ('Male', 'Male'),
    ('Female', 'Female'),
    ('Other', 'Other'),
]


class Worker(models.Model):
    name = models.CharField(max_length=200)
    profile_photo = models.ImageField(upload_to='workers/photos/', null=True, blank=True)
    date_of_birth = models.DateField()
    cnic = models.CharField(max_length=20)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES)
    email = models.EmailField()
    job_role = models.CharField(max_length=150)
    hire_date = models.DateField()
    salary = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name
