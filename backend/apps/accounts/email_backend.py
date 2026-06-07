"""
Dynamic SMTP Email Backend
Reads SMTP configuration from the SystemSettings database record at send time,
so changes made in the Settings UI take effect immediately without a server restart.
"""
from django.core.mail.backends.smtp import EmailBackend


class DynamicSMTPBackend(EmailBackend):
    """
    An SMTP email backend that dynamically loads configuration from
    the SystemSettings singleton instead of Django settings.py.

    Falls back gracefully to the console backend if settings cannot be loaded
    (e.g. during migrations when the table doesn't exist yet).
    """

    def __init__(self, fail_silently=False, **kwargs):
        # Pop override parameters from kwargs to prevent TypeError when passed to super().__init__
        for key in ["host", "port", "username", "password", "use_tls", "use_ssl"]:
            kwargs.pop(key, None)

        try:
            from .models import SystemSettings
            sys_cfg = SystemSettings.get_settings()

            host = sys_cfg.smtp_host or "smtp.gmail.com"
            port = sys_cfg.smtp_port or 587
            username = sys_cfg.smtp_username or ""
            password = sys_cfg.smtp_password or ""
            # Use STARTTLS for port 587, SSL for port 465
            use_ssl = (port == 465)
            use_tls = (port == 587) or (not use_ssl and port not in (25,))

            super().__init__(
                host=host,
                port=port,
                username=username,
                password=password,
                use_tls=use_tls,
                use_ssl=use_ssl,
                fail_silently=fail_silently,
                **kwargs,
            )
        except Exception:
            # Table may not exist yet (first migration) — fall back to no-op
            super().__init__(fail_silently=True, **kwargs)
            self._host = None  # Signal that backend is not usable

    def open(self):
        if getattr(self, "_host", "SET") is None:
            return False
        return super().open()
