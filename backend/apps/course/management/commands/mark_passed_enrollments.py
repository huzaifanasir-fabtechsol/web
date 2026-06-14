"""Mark enrollments whose course duration has elapsed as 'passed'.

Run manually with ``python manage.py mark_passed_enrollments``; the same logic
is invoked every 5 minutes by the in-process scheduler (see apps.course.scheduler).
"""
from django.core.management.base import BaseCommand

from apps.course.services import mark_due_enrollments_passed


class Command(BaseCommand):
    help = "Update enrollments whose duration has elapsed to status='passed'."

    def handle(self, *args, **options):
        count = mark_due_enrollments_passed()
        self.stdout.write(self.style.SUCCESS(f"Marked {count} enrollment(s) as passed."))
