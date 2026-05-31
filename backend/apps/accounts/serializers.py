from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, SystemSettings


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data["email"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")
        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {"id": user.id, "email": user.email, "full_name": user.full_name},
        }


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            self.user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email.")
        return value

    def save(self):
        user = self.user
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

        # Use from_email from SystemSettings if available, else fall back to Django setting
        try:
            sys_settings = SystemSettings.get_settings()
            from_email = sys_settings.default_from_email or settings.DEFAULT_FROM_EMAIL
        except Exception:
            from_email = settings.DEFAULT_FROM_EMAIL

        send_mail(
            subject="Password Reset Request",
            message=f"Click the link to reset your password: {reset_url}",
            from_email=from_email,
            recipient_list=[user.email],
        )


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate(self, data):
        try:
            pk = force_str(urlsafe_base64_decode(data["uid"]))
            self.user = User.objects.get(pk=pk)
        except (User.DoesNotExist, ValueError):
            raise serializers.ValidationError("Invalid reset link.")
        if not default_token_generator.check_token(self.user, data["token"]):
            raise serializers.ValidationError("Reset link is expired or invalid.")
        return data

    def save(self):
        self.user.set_password(self.validated_data["new_password"])
        self.user.save()


class ProfileSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "avatar", "current_password", "new_password"]
        read_only_fields = ["id", "email"]

    def validate(self, data):
        current = data.pop("current_password", None)
        new = data.pop("new_password", None)
        if new:
            if not current:
                raise serializers.ValidationError({"current_password": "Required to set a new password."})
            if not self.instance.check_password(current):
                raise serializers.ValidationError({"current_password": "Incorrect password."})
            data["_new_password"] = new
        return data

    def update(self, instance, validated_data):
        new_password = validated_data.pop("_new_password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if new_password:
            instance.set_password(new_password)
        instance.save()
        return instance


class SystemSettingsSerializer(serializers.ModelSerializer):
    # smtp_password is write-only — never returned to the client
    smtp_password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        style={"input_type": "password"},
    )
    # profile_picture URL is readable
    profile_picture_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SystemSettings
        fields = [
            "id",
            "profile_picture",
            "profile_picture_url",
            "school_name",
            "contact_email",
            "contact_phone",
            "tax_vat_id",
            "business_address",
            "smtp_host",
            "smtp_port",
            "smtp_username",
            "smtp_password",
            "default_from_email",
        ]
        read_only_fields = ["id", "profile_picture_url"]
        extra_kwargs = {
            "profile_picture": {"write_only": True, "required": False},
        }

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    def validate_smtp_port(self, value):
        if value is not None and not (1 <= value <= 65535):
            raise serializers.ValidationError("SMTP port must be between 1 and 65535.")
        return value

    def update(self, instance, validated_data):
        # If smtp_password is blank/missing, preserve existing password
        smtp_password = validated_data.get("smtp_password", "")
        if not smtp_password:
            validated_data.pop("smtp_password", None)
        # If no new profile_picture provided, keep existing
        if "profile_picture" not in validated_data or validated_data.get("profile_picture") is None:
            validated_data.pop("profile_picture", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
