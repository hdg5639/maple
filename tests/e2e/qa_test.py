import subprocess
import time
import urllib.request
import json
import base64
import asyncio

try:
    import websockets
except ImportError:
    pass

# We can use standard python asyncio or simple websocket client
import sys

def test_qa():
    import socket

    proc = subprocess.Popen([
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        '--headless=new',
        '--remote-debugging-port=9222',
        '--disable-gpu',
        r'file:///c:/Users/SSAFY/Desktop/openmaple/index.html'
    ])

    time.sleep(2.5)

    try:
        req = urllib.request.urlopen('http://localhost:9222/json')
        tabs = json.loads(req.read())
        target_tab = None
        for t in tabs:
            if 'openmaple' in t.get('url', ''):
                target_tab = t
                break
        
        if not target_tab:
            print("Target tab not found!")
            return False

        ws_url = target_tab['webSocketDebuggerUrl']
        print("Connected to Tab WS:", ws_url)
        return ws_url
    finally:
        pass

if __name__ == '__main__':
    test_qa()
