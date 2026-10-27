# server.py - LAN-Enabled Web Server for OpenMaple Classic
import http.server
import socketserver
import socket
import webbrowser
import os
import sys
import argparse

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

DEFAULT_PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_lan_ips():
    ips = []
    # 1. Primary routable outbound IP
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        primary = s.getsockname()[0]
        s.close()
        if primary and not primary.startswith('127.'):
            ips.append(primary)
    except Exception:
        pass

    # 2. Hostname lookups
    try:
        host = socket.gethostname()
        for ip in socket.gethostbyname_ex(host)[2]:
            if not ip.startswith('127.') and ip not in ips:
                ips.append(ip)
    except Exception:
        pass

    return ips

class NoCacheHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Force no-cache so LAN clients always get latest JS/CSS
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        sys.stdout.write(f"[{self.log_date_time_string()}] {format % args}\n")
        sys.stdout.flush()

def run(start_port=DEFAULT_PORT, open_browser=True):
    port = start_port
    lan_ips = get_lan_ips()
    primary_lan = lan_ips[0] if lan_ips else "127.0.0.1"

    while port < start_port + 20:
        try:
            # Bind to 0.0.0.0 to allow LAN access
            with socketserver.TCPServer(("0.0.0.0", port), NoCacheHTTPHandler) as httpd:
                local_url = f"http://localhost:{port}"
                lan_url = f"http://{primary_lan}:{port}"

                print("=" * 64)
                print("🍁 클래식 메이플스토리 웹 (OpenMaple Classic) LAN 서버 배포")
                print("=" * 64)
                print(f"💻 로컬(내 PC) 접속 주소   : {local_url}")
                print(f"📱 스마트폰 / LAN 접속 주소 : {lan_url}")
                if len(lan_ips) > 1:
                    for alt_ip in lan_ips[1:]:
                        print(f"   (보조 네트워크 IP: http://{alt_ip}:{port})")
                print("-" * 64)
                print("⚡ 동일한 Wi-Fi나 공유기에 연결된 스마트폰, 태블릿, 다른 PC에서")
                print(f"   위 LAN 주소({lan_url})로 접속하시면 즉시 게임을 플레이할 수 있습니다.")
                print("🛑 서버를 종료하려면 Ctrl + C 를 누르세요.")
                print("=" * 64)
                sys.stdout.flush()

                if open_browser:
                    try:
                        webbrowser.open(local_url)
                    except Exception:
                        pass

                httpd.serve_forever()
                break
        except OSError:
            port += 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OpenMaple Classic LAN Server")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port to listen on")
    parser.add_argument("--no-browser", action="store_true", help="Do not automatically open web browser")
    args = parser.parse_args()

    try:
        run(start_port=args.port, open_browser=not args.no_browser)
    except KeyboardInterrupt:
        print("\n[OpenMaple] 서버가 정상적으로 종료되었습니다.")
