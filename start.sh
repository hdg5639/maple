#!/bin/sh
python server.py --no-browser --port 8080 --ws-port 8001 &
exec caddy run --config /app/Caddyfile --adapter caddyfile
