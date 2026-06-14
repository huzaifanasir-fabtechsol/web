"""Domain logic for course enrollments that runs outside of request/response.

Kept here (rather than inline in the management command or scheduler) so the
exact same code path is exercised by manual runs, the scheduled job, and tests.
"""
from django.utils import timezone

from .models import CourseEnrollment


def mark_due_enrollments_passed(as_of=None):
    """Persist ``status='passed'`` for every active enrollment whose duration elapsed.

    An enrollment is due once ``start_date + course.duration_months <= as_of``
    (see ``CourseEnrollment.is_due``). The end date is computed in Python via
    ``add_months`` so we evaluate it per-row rather than in a single SQL UPDATE.

    Idempotent: rows already 'passed' are excluded, so repeated runs are safe.

    Returns the number of enrollments updated.
    """
    as_of = as_of or timezone.localdate()
    active = (
        CourseEnrollment.objects
        .filter(status=CourseEnrollment.STATUS_ACTIVE)
        .select_related('course')
    )
    due_ids = [e.pk for e in active if e.is_due(as_of)]
    if not due_ids:
        return 0
    return CourseEnrollment.objects.filter(pk__in=due_ids).update(
        status=CourseEnrollment.STATUS_PASSED
    )
