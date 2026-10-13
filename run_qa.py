import subprocess
import time
import urllib.request
import json
import base64
import asyncio
import websockets
import os

async def main():
    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    file_url = 'file:///' + os.path.abspath('index.html').replace('\\', '/')
    print(f"Launching Chrome with URL: {file_url}")

    proc = subprocess.Popen([
        chrome_path,
        '--headless=new',
        '--remote-debugging-port=9222',
        '--window-size=1280,800',
        '--disable-gpu',
        file_url
    ])

    await asyncio.sleep(2.5)

    try:
        req = urllib.request.urlopen('http://localhost:9222/json')
        tabs = json.loads(req.read())
        target_tab = next((t for t in tabs if 'openmaple' in t.get('url', '') or 'index.html' in t.get('url', '')), None)
        
        if not target_tab:
            print("ERROR: Target tab not found!")
            return

        ws_url = target_tab['webSocketDebuggerUrl']
        print(f"Connecting to CDP: {ws_url}")

        async with websockets.connect(ws_url) as ws:
            # Enable Runtime and Page domains
            await ws.send(json.dumps({'id': 1, 'method': 'Runtime.enable'}))
            await ws.send(json.dumps({'id': 2, 'method': 'Page.enable'}))

            errors = []
            logs = []

            # Listen for initial messages
            msg_id = 10

            async def eval_js(expr):
                nonlocal msg_id
                msg_id += 1
                curr_id = msg_id
                await ws.send(json.dumps({
                    'id': curr_id,
                    'method': 'Runtime.evaluate',
                    'params': {'expression': expr, 'returnByValue': True}
                }))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get('method') == 'Runtime.exceptionThrown':
                        errors.append(resp['params'])
                    elif resp.get('method') == 'Runtime.consoleAPICalled':
                        logs.append(resp['params'])
                    elif resp.get('id') == curr_id:
                        return resp.get('result', {}).get('result', {}).get('value')

            # Check game status
            await asyncio.sleep(1)
            game_exists = await eval_js("typeof window.game !== 'undefined'")
            print(f"1. Game object exists: {game_exists}")

            canvas_dim = await eval_js("({ w: window.game.canvas.width, h: window.game.canvas.height })")
            print(f"2. Canvas dimensions: {canvas_dim}")

            player_info = await eval_js("({ name: window.game.player.name, hp: window.game.player.hp, maxHp: window.game.player.maxHp, level: window.game.player.level, job: window.game.player.job })")
            print(f"3. Player info: {player_info}")

            monsters_count = await eval_js("window.game.monsters.length")
            print(f"4. Monsters count: {monsters_count}")

            # Test toggling Auto-Hunt
            auto_hunt_result = await eval_js("window.game.autoHunt.toggle()")
            print(f"5. Toggle Auto-Hunt (should be true): {auto_hunt_result}")

            # Wait 2 seconds with auto-hunt running to see if actions execute
            await asyncio.sleep(2)
            auto_stats = await eval_js("({ kills: window.game.autoHunt.stats.kills, expGained: window.game.autoHunt.stats.expGained, duration: window.game.autoHunt.stats.duration })")
            print(f"6. Auto-Hunt running stats: {auto_stats}")

            # Test Spawning Boss
            await eval_js("window.game.spawnBoss()")
            boss_alive = await eval_js("window.game.boss !== null && window.game.boss.isAlive()")
            print(f"7. Boss spawned and alive: {boss_alive}")

            # Capture Screenshot
            msg_id += 1
            await ws.send(json.dumps({'id': msg_id, 'method': 'Page.captureScreenshot'}))
            while True:
                resp = json.loads(await ws.recv())
                if resp.get('id') == msg_id:
                    img_data = resp['result']['data']
                    with open('qa_live_screenshot.png', 'wb') as f:
                        f.write(base64.b64decode(img_data))
                    print("8. Screenshot saved to qa_live_screenshot.png (Size:", len(img_data), "bytes)")
                    break

            if errors:
                print("Detected Runtime Exceptions:", errors)
            else:
                print("No runtime exceptions detected!")

    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(main())
