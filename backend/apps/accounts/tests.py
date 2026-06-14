from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.email_backend import DynamicSMTPBackend
from apps.accounts.models import SystemSettings

User = get_user_model()


class DynamicSMTPBackendTest(TestCase):
    def test_backend_initialization_with_overriding_kwargs(self):
        # Ensure system settings exists
        sys_settings = SystemSettings.get_settings()
        sys_settings.smtp_host = "test.smtp.server"
        sys_settings.smtp_port = 587
        sys_settings.smtp_username = "testuser"
        sys_settings.smtp_password = "testpassword"
        sys_settings.save()

        # Simulate how send_mail/get_connection instantiates the backend
        backend = DynamicSMTPBackend(username=None, password=None, fail_silently=False)

        self.assertEqual(backend.host, "test.smtp.server")
        self.assertEqual(backend.port, 587)
        self.assertEqual(backend.username, "testuser")
        self.assertFalse(backend.fail_silently)
        # Ensure it didn't fall back to no-op
        self.assertNotEqual(getattr(backend, "_host", "SET"), None)


class TokenRefreshTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="testuser@example.com",
            password="testpassword123"
        )
        self.refresh = RefreshToken.for_user(self.user)

    def test_token_refresh_success(self):
        url = reverse("token-refresh")
        response = self.client.post(url, {"refresh": str(self.refresh)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_token_refresh_user_does_not_exist(self):
        # Delete user to simulate a non-existent user token
        self.user.delete()
        url = reverse("token-refresh")
        response = self.client.post(url, {"refresh": str(self.refresh)})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["detail"].code, "no_active_account")




