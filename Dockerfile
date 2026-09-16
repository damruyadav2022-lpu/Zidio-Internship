# Multi-stage Production Dockerfile for RetailPulse B2B Enterprise SaaS Platform
# Optimized for Hugging Face Spaces, Render, AWS, and Kubernetes

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

# Create dedicated non-root user with UID 1000 (standard for Hugging Face Spaces)
RUN useradd -m -u 1000 appuser

# Copy application source directories and pre-built artifacts
COPY backend/ ./backend/
COPY src/ ./src/
COPY models/ ./models/
COPY data/ ./data/
COPY retailpulse.db .
COPY run_pipeline.py .
COPY .env.example .

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set permissions for non-root execution and SQLite WAL mode writes
RUN chown -R appuser:appuser /app && chmod -R 777 /app

# Switch to non-privileged user
USER appuser

# Expose HTTP port (7860 is default for Hugging Face Spaces, dynamic on Render)
EXPOSE 7860

# Set production environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=7860 \
    ENVIRONMENT=production

# Healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:${PORT:-7860}/api/health || exit 1

# Start Uvicorn production server with dynamic port support
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-7860} --workers 2"]
