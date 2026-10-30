FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# HTTP (static files) and WebSocket (multiplayer; browser expects HTTP port + 1)
EXPOSE 8000 8001

CMD ["python", "server.py", "--no-browser"]
