from django.db import models

GENDER_CHOICES = [
    ('Stallion', 'Stallion'),
    ('Mare', 'Mare'),
    ('Gelding', 'Gelding'),
]


OWNER_TYPE_CHOICES = [
    ('Horse Care', 'Horse Care'),
    ('Horse Training', 'Horse Training'),
    ('Company Owned', 'Company Owned'),
]


class HorseOwner(models.Model):
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    cnic = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    joined_date = models.DateField()
    owner_type = models.CharField(
        max_length=50,
        choices=OWNER_TYPE_CHOICES,
        default='Horse Care'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


BREED_CHOICES = [
    ('Arabian', 'Arabian'),
    ('Thoroughbred', 'Thoroughbred'),
    ('Mustang', 'Mustang'),
    ('Friesian', 'Friesian'),
    ('Quarter Horse', 'Quarter Horse'),
    ('Mixed Breed', 'Mixed Breed'),
]


class Horse(models.Model):
    horse_name = models.CharField(max_length=200)
    owner = models.ForeignKey(
        HorseOwner,
        on_delete=models.CASCADE,
        related_name='horses'
    )
    arrival_date = models.DateField()
    height = models.CharField(max_length=50, help_text="Height (e.g. 15.2 hh or cm)")
    date_of_birth = models.DateField()
    color = models.CharField(max_length=100)
    breed = models.CharField(max_length=100, choices=BREED_CHOICES)
    gender = models.CharField(max_length=50, choices=GENDER_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.horse_name
