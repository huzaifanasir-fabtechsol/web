from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, SystemSettings


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["email"]
    list_display = ["email", "full_name", "is_staff", "is_active"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Info", {"fields": ("full_name", "phone", "avatar")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {"fields": ("email", "password1", "password2")}),
    )
    search_fields = ["email", "full_name"]
    filter_horizontal = ["groups", "user_permissions"]


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ("School Profile", {
            "fields": ("profile_picture", "school_name", "contact_email", "contact_phone", "tax_vat_id", "business_address"),
        }),
        ("SMTP Configuration", {
            "fields": ("smtp_host", "smtp_port", "smtp_username", "smtp_password", "default_from_email"),
            "classes": ("collapse",),
        }),
    )

    def has_add_permission(self, request):
        # Only one record allowed
        return not SystemSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
