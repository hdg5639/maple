import asyncio
import json
import websockets
import urllib.request
import subprocess
import os

async def test():
    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    file_url = 'file:///' + os.path.abspath('index.html').replace('\\', '/')

    proc = subprocess.Popen([
        chrome_path,
        '--headless=new',
        '--remote-debugging-port=9222',
        '--window-size=1280,800',
        '--disable-gpu',
        file_url
    ])
    await asyncio.sleep(2)
    try:
        req = urllib.request.urlopen('http://localhost:9222/json')
        tabs = json.loads(req.read())
        target = next((t for t in tabs if 'openmaple' in t.get('url', '') or 'index.html' in t.get('url', '')), None)
        if not target:
            print("Tab not found")
            return
        ws = await websockets.connect(target['webSocketDebuggerUrl'])
        msg_id = 0
        async def ev(expr):
            nonlocal msg_id
            msg_id += 1
            curr_id = msg_id
            await ws.send(json.dumps({'id': curr_id, 'method': 'Runtime.evaluate', 'params': {'expression': expr, 'returnByValue': True}}))
            while True:
                r = json.loads(await ws.recv())
                if r.get('id') == curr_id:
                    return r.get('result', {}).get('result', {}).get('value')

        print("Initial str:", await ev("window.game.player.str"))
        await ev("document.getElementById('btn-add-str').click()")
        print("After click str:", await ev("window.game.player.str"))
        print("DOM text after click:", await ev("document.getElementById('stat-win-str').innerText"))
        await ev("window.game.player.str = 25; window.game.player.calcDerivedStats(); window.game.ui.updateStatsWindow();")
        print("DOM text after manual 25:", await ev("document.getElementById('stat-win-str').innerText"))

        await ws.close()
    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(test())

if __name__ == '__main__':
    asyncio.run(test())
