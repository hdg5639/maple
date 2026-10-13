# server.py - Lightweight Local Web Server for OpenMaple Classic
import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run():
    port = PORT
    while port < 8020:
        try:
            with socketserver.TCPServer(("", port), Handler) as httpd:
                url = f"http://localhost:{port}"
                print("=" * 60)
                print("🍁 클래식 메이플스토리 웹 (OpenMaple Classic) 로컬 서버")
                print(f"🌐 서버 주소: {url}")
                print("⚡ 브라우저에서 게임이 자동으로 열립니다.")
                print("🛑 서버를 종료하려면 Ctrl + C 를 누르세요.")
                print("=" * 60)
                webbrowser.open(url)
                httpd.serve_forever()
                break
        except OSError:
            port += 1

if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        print("\n서버가 종료되었습니다.")
