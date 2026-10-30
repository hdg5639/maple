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

        # Test skills for beginner
        skills = ['power_strike', 'slash_blast', 'magic_claw', 'flash_jump']
        for sk in skills:
            res = await ev(f"window.game.player.useSkill('{sk}', window.game)")
            print(f"Beginner skill '{sk}' used:", res)
            await asyncio.sleep(0.3)

        # Advance to Warrior and test
        await ev("window.game.changePlayerJob('전사')")
        for sk in ['power_strike', 'slash_blast', 'iron_body']:
            res = await ev(f"window.game.player.useSkill('{sk}', window.game)")
            print(f"Warrior skill '{sk}' used:", res)
            await asyncio.sleep(0.3)

        # Advance to Mage and test
        await ev("window.game.changePlayerJob('마법사')")
        for sk in ['energy_bolt', 'magic_claw', 'teleport']:
            res = await ev(f"window.game.player.useSkill('{sk}', window.game)")
            print(f"Mage skill '{sk}' used:", res)
            await asyncio.sleep(0.3)

        # Advance to Bowman and test
        await ev("window.game.changePlayerJob('궁수')")
        for sk in ['arrow_blow', 'double_shot', 'focus']:
            res = await ev(f"window.game.player.useSkill('{sk}', window.game)")
            print(f"Bowman skill '{sk}' used:", res)
            await asyncio.sleep(0.3)

        # Advance to Thief and test
        await ev("window.game.changePlayerJob('도적')")
        for sk in ['lucky_seven', 'double_stab', 'flash_jump', 'haste']:
            res = await ev(f"window.game.player.useSkill('{sk}', window.game)")
            print(f"Thief skill '{sk}' used:", res)
            await asyncio.sleep(0.3)

        # Check monsters health and count
        monsters = await ev("window.game.monsters.map(m => ({ name: m.name, hp: m.hp, maxHp: m.maxHp, isAlive: m.isAlive() }))")
        print("Total monsters count:", len(monsters))
        print("First 3 monsters:", monsters[:3])

        await ws.close()
    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(test())
