#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting EquiManage Docker Entrypoint..."

# Wait for Database connection if database environment variables are set
if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
    echo "Waiting for database at $DB_HOST:$DB_PORT..."
    python << END
import socket
import sys
import time

host = "$DB_HOST"
port = int("$DB_PORT")
retries = 30

while retries > 0:
    try:
        s = socket.create_connection((host, port), timeout=2)
        s.close()
        print("Database is up and reachable!")
        sys.exit(0)
    except Exception as e:
        print(f"Database not ready yet (retries left: {retries}). Waiting...")
        time.sleep(2)
        retries -= 1

print("Error: Database was not reachable in time.")
sys.exit(1)
END
fi

# Run database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start server depending on DEBUG environment variable
if [ "$DEBUG" = "True" ] || [ "$DEBUG" = "true" ] || [ "$DEBUG" = "1" ]; then
    echo "Starting Django Development Server (with auto-reload)..."
    exec python manage.py runserver 0.0.0.0:8000
else
    echo "Starting Gunicorn WSGI Server (production)..."
    exec gunicorn conf.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
fi
