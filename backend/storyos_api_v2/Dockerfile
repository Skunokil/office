FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy contents as storyos_api_v2/ package so relative imports work
COPY . ./storyos_api_v2

EXPOSE 8002

CMD ["uvicorn", "storyos_api_v2.main:app", "--host", "0.0.0.0", "--port", "8002"]
