FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    OPENMAPLE_DB=/data/openmaple.db

COPY --from=caddy:2 /usr/bin/caddy /usr/bin/caddy

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh && mkdir -p /data

# 8000: Caddy (HTTP + /ws -> WebSocket), 8001: WebSocket direct (http 접속용)
EXPOSE 8000 8001
VOLUME /data

CMD ["/app/start.sh"]
