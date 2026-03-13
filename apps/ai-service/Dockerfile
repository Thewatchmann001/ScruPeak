FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Production: Use Gunicorn with Uvicorn workers
# - 1 worker (Cloud Run scales horizontally, not vertically)
# - 8 threads (for I/O concurrency)
# - 0 timeout (let Cloud Run handle scaling)
# - Preload to catch startup errors early
CMD exec gunicorn app.main:app \
    --bind :${PORT:-8000} \
    --workers 1 \
    --threads 8 \
    --timeout 0 \
    --worker-class uvicorn.workers.UvicornWorker \
    --preload \
    --access-logfile - \
    --error-logfile -
