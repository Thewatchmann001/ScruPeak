# ============================================================================
# STAGE 1: BUILDER
# ============================================================================
FROM python:3.11-slim as builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml poetry.lock* ./

RUN pip install --upgrade pip && \
    pip install poetry==1.8.3 && \
    poetry config virtualenvs.in-project true && \
    poetry install --only main --no-interaction --no-ansi && \
    ls -la /build/.venv/bin/

# ============================================================================
# STAGE 2: RUNTIME
# ============================================================================
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy venv first
COPY --from=builder /build/.venv /app/.venv

# Then copy app code
COPY . /app/

RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
