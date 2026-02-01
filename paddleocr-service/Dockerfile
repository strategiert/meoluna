FROM python:3.10-slim-bookworm

# Disable PaddlePaddle connectivity checks and reduce log noise
ENV PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies for OpenCV, PDF processing, PaddlePaddle
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Download PaddleOCR models on build (German + English)
# Note: PaddleOCR v3+ removed use_gpu and show_log parameters
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(use_angle_cls=True, lang='german')" 2>/dev/null || true

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
