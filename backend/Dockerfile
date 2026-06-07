# ==========================================
# Stage 1: Build dependencies & wheels
# ==========================================
FROM python:3.12-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies required to build psycopg2 and other packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY req.txt .

# Build wheels into a directory to copy to the next stage
RUN pip install --upgrade pip && \
    pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r req.txt

# ==========================================
# Stage 2: Clean runtime image
# ==========================================
FROM python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/django-user/.local/bin:${PATH}"

# Install runtime system dependencies (libpq5 is needed by psycopg2 at runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy built wheels from builder stage
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/req.txt .

# Install dependencies using the pre-compiled wheels
RUN pip install --upgrade pip && \
    pip install --no-cache /wheels/*

# Create a non-root user for security and configure home directory
RUN useradd --create-home --shell /bin/bash django-user

# Create necessary static and media directories
RUN mkdir -p /app/staticfiles /app/media && \
    chown -R django-user:django-user /app

# Copy project files
COPY --chown=django-user:django-user . .

# Copy and setup entrypoint script permissions
COPY --chown=django-user:django-user dockerentrypoint.sh /app/dockerentrypoint.sh
RUN chmod +x /app/dockerentrypoint.sh

# Switch to the non-root user
USER django-user

# Expose Django backend port
EXPOSE 8000

# Set entrypoint
ENTRYPOINT ["/app/dockerentrypoint.sh"]
