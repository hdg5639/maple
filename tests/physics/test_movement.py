import asyncio
import json
import websockets
import urllib.request
import os
import subprocess

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
            print('No tab found')
            return

        async with websockets.connect(target['webSocketDebuggerUrl']) as ws:
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

            await asyncio.sleep(1)
            init_p = await ev("({ x: window.game.player.x, y: window.game.player.y, onGround: window.game.player.onGround, fh: window.game.player.currentFoothold ? window.game.player.currentFoothold.id : null })")
            print("Initial:", init_p)

            # Check footholds around spawn:
            fhs_around = await ev("window.game.map.footholds.filter(f => Math.abs(f.y1 - 1320) < 50 && f.x1 <= 1200 && f.x2 >= 900).map(f => ({ id: f.id, x1: f.x1, x2: f.x2, y1: f.y1, y2: f.y2, drop: f.canDropThrough }))")
            print("Footholds near spawn:", fhs_around)

            # Move player right across boundary
            print("--- Moving Right ---")
            await ev("window.game.keys['ArrowRight'] = true")
            for i in range(40):
                await asyncio.sleep(0.05)
                p = await ev("({ x: Math.round(window.game.player.x), y: Math.round(window.game.player.y), onGround: window.game.player.onGround, fh: window.game.player.currentFoothold ? window.game.player.currentFoothold.id : null })")
                if i % 4 == 0:
                    print(f"Step {i}: {p}")

            # Check jumping
            print("--- Testing Jump ---")
            await ev("window.game.player.jump()")
            for i in range(25):
                await asyncio.sleep(0.05)
                p = await ev("({ x: Math.round(window.game.player.x), y: Math.round(window.game.player.y), vy: window.game.player.vy.toFixed(2), onGround: window.game.player.onGround, fh: window.game.player.currentFoothold ? window.game.player.currentFoothold.id : null })")
                if i % 3 == 0:
                    print(f"Jump Step {i}: {p}")

            # Test ArrowLeft & ladder & dropthrough
            print("--- Testing Dropthrough ---")
            drop_res = await ev("(() => { const p = window.game.player; p.dropThrough(); return { onGround: p.onGround, dropTimer: p.dropThroughTimer, fh: p.currentFoothold ? p.currentFoothold.id : null }; })()")
            print("Drop result:", drop_res)
            for i in range(20):
                await asyncio.sleep(0.05)
                p = await ev("({ y: Math.round(window.game.player.y), vy: window.game.player.vy.toFixed(2), onGround: window.game.player.onGround, fh: window.game.player.currentFoothold ? window.game.player.currentFoothold.id : null })")
                if i % 3 == 0:
                    print(f"Drop Step {i}: {p}")

    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(test())
