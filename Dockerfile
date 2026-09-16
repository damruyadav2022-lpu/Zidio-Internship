# Multi-stage Production Dockerfile for RetailPulse B2B Enterprise SaaS Platform

# Stage 1: Build Frontend SPA
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Runtime
FROM python:3.11-slim AS runtime
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir uvicorn[standard] psycopg2-binary redis pydantic-settings

# Create dedicated non-root application user
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

# Copy application source directories
COPY backend/ ./backend/
COPY src/ ./src/
COPY models/ ./models/
COPY data/ ./data/
COPY run_pipeline.py .
COPY .env.example .

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set permissions for non-root execution
RUN chown -R appuser:appuser /app

# Switch to non-privileged user
USER appuser

# Expose HTTP port
EXPOSE 8000

# Set production environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    ENVIRONMENT=production

# Healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Start Uvicorn production server with dynamic port support for cloud hosting
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
