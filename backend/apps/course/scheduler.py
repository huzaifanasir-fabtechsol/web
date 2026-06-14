"""In-process scheduler that flips due enrollments to 'passed' every 5 minutes.

Started from ``CourseConfig.ready()``. Using APScheduler (rather than Celery
beat) keeps the job running inside the Django process, so it works identically
under Docker/gunicorn and the frozen PyInstaller desktop build with no extra
services (Redis, broker, worker) to deploy.
"""
import logging

from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)

_scheduler = None


def _run_job():
    # Imported lazily so this module can be imported before the app registry is
    # fully ready (e.g. at AppConfig import time).
    from .services import mark_due_enrollments_passed

    try:
        count = mark_due_enrollments_passed()
        if count:
            logger.info("mark_passed_enrollments: marked %s enrollment(s) as passed", count)
    except Exception:  # never let a job error kill the scheduler thread
        logger.exception("mark_passed_enrollments job failed")


def start():
    """Start the background scheduler once per process."""
    global _scheduler
    if _scheduler is not None:
        return

    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(
        _run_job,
        trigger="interval",
        minutes=5,
        id="mark_passed_enrollments",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    _scheduler = scheduler
    logger.info("Enrollment status scheduler started (interval: every 5 minutes).")
