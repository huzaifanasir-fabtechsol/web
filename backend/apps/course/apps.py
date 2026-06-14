import os
import sys

from django.apps import AppConfig

# Management commands during which the scheduler must NOT start — either the
# schema isn't ready yet (migrate) or the process is short-lived (tests, shell).
_NO_SCHEDULER_COMMANDS = {
    'migrate', 'makemigrations', 'collectstatic', 'shell', 'dbshell',
    'createsuperuser', 'loaddata', 'dumpdata', 'test', 'check', 'flush',
    'showmigrations', 'sqlmigrate',
}


class CourseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.course'

    def ready(self):
        if not self._should_start_scheduler():
            return
        from .scheduler import start
        start()

    @staticmethod
    def _should_start_scheduler():
        # Skip one-off management commands (migrate/test/etc.).
        if len(sys.argv) > 1 and sys.argv[1] in _NO_SCHEDULER_COMMANDS:
            return False
        # Under runserver's autoreloader, ready() runs in both the reloader
        # parent and the worker child — only schedule in the child (RUN_MAIN).
        if 'runserver' in sys.argv and os.environ.get('RUN_MAIN') != 'true':
            return False
        # Escape hatch: set ENABLE_SCHEDULER=False to disable (e.g. to run the
        # job from a single dedicated process instead of every gunicorn worker).
        if os.environ.get('ENABLE_SCHEDULER', 'True').lower() in ('false', '0', 'no'):
            return False
        return True
