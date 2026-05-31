from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class SystemSettings(models.Model):
    profile_picture = models.ImageField(upload_to="settings/", blank=True, null=True)
    school_name = models.CharField(max_length=255, default="EquiManage Riding School")
    contact_email = models.EmailField(default="contact@equimanage.com")
    contact_phone = models.CharField(max_length=50, default="+92 300 1234567")
    tax_vat_id = models.CharField(max_length=50, blank=True, default="")
    business_address = models.TextField(default="123 Riding Club Road, Lahore, Pakistan")

    smtp_host = models.CharField(max_length=255, default="smtp.gmail.com")
    smtp_port = models.IntegerField(default=587)
    smtp_username = models.CharField(max_length=255, blank=True, default="")
    smtp_password = models.CharField(max_length=255, blank=True, default="")
    default_from_email = models.EmailField(default="noreply@equimanage.com")

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(id=1)
        return obj

    def __str__(self):
        return "System Settings"

    class Meta:
        verbose_name = "System Settings"
        verbose_name_plural = "System Settings"

