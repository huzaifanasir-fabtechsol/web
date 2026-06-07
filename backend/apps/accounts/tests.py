from django.test import TestCase
from apps.accounts.email_backend import DynamicSMTPBackend
from apps.accounts.models import SystemSettings


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

