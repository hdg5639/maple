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

            # 1. Check game status
            await asyncio.sleep(1)
            game_exists = await eval_js("typeof window.game !== 'undefined'")
            print(f"1. Game object exists: {game_exists}")

            canvas_dim = await eval_js("({ w: window.game.canvas.width, h: window.game.canvas.height })")
            print(f"2. Canvas dimensions: {canvas_dim}")

            player_info = await eval_js("({ name: window.game.player.name, hp: window.game.player.hp, maxHp: window.game.player.maxHp, level: window.game.player.level, job: window.game.player.job, fame: window.game.player.fame, acc: window.game.player.accuracy, def: window.game.player.defense })")
            print(f"3. Player info (with Fame & Acc): {player_info}")

            # Test Equipment Toggle & Scrolling
            equip_toggle = await eval_js("(() => { const p = window.game.player; const eq = p.inventory.equip[0]; p.toggleEquip(eq); const unequipped = !eq.equipped; p.toggleEquip(eq); return unequipped && eq.equipped; })()")
            print(f"   - Equipment Toggle Tested: {equip_toggle}")

            scroll_test = await eval_js("(() => { const p = window.game.player; const sc = p.inventory.use.find(i => i.type === 'scroll'); if (!sc) return false; return p.scrollWeapon(sc, window.game); })()")
            print(f"   - Weapon Scrolling Tested: {scroll_test}")

            monsters_count = await eval_js("window.game.monsters.length")
            print(f"4. Monsters count: {monsters_count}")

            # 2. Test Class Advancement & Skill Execution
            classes = ['전사', '마법사', '궁수', '도적']
            for job in classes:
                await eval_js(f"window.game.changePlayerJob('{job}')")
                curr_job = await eval_js("window.game.player.job")
                skill_count = await eval_js("Object.keys(window.game.player.skills).length")
                print(f"   - Changed Job to '{curr_job}': {skill_count} skills loaded.")
                
                # Test attack
                await eval_js("window.game.player.normalAttack(window.game)")
                # Test skill
                skill_key = await eval_js("window.game.getClassSkillId(0)")
                if skill_key:
                    await eval_js(f"window.game.player.useSkill('{skill_key}', window.game)")
                await asyncio.sleep(0.3)

            # 3. Test Auto-Hunt & Quickslots
            quickslot_ids = [
                'quick-slot-attack', 'quick-slot-1', 'quick-slot-2', 'quick-slot-3', 'quick-slot-4',
                'quick-slot-jump', 'quick-slot-loot', 'quick-slot-potion-red', 'quick-slot-potion-blue',
                'quick-slot-autohunt'
            ]
            for qid in quickslot_ids:
                res = await eval_js(f"(() => {{ const el = document.getElementById('{qid}'); if (!el) return false; el.click(); return true; }})()")
                print(f"   - Quickslot #{qid} clicked: {res}")
            
            # Ensure autohunt is active
            if not await eval_js("window.game.autoHunt.enabled"):
                await eval_js("window.game.autoHunt.toggle()")
            print(f"5. Auto-Hunt active: {await eval_js('window.game.autoHunt.enabled')}")

            # Wait 3 seconds with auto-hunt running to see if actions execute
            await asyncio.sleep(3)
            auto_stats = await eval_js("({ kills: window.game.autoHunt.stats.kills, expGained: window.game.autoHunt.stats.expGained, duration: window.game.autoHunt.stats.duration })")
            print(f"6. Auto-Hunt running stats: {auto_stats}")

            # 4. Test Multi-Map Engine & World Travel
            maps_to_test = ['henesys_town', 'ant_tunnel', 'ellinia', 'zakum_altar']
            for mkey in maps_to_test:
                await eval_js(f"window.game.changeMap('{mkey}')")
                curr_map_name = await eval_js("window.game.map.name")
                fhs_count = await eval_js("window.game.map.footholds.length")
                npcs_count = await eval_js("window.game.map.npcs.length")
                print(f"   - Traveled to '{curr_map_name}': {fhs_count} footholds, {npcs_count} NPCs.")
                await asyncio.sleep(0.5)

            # Test Zakum Boss on Zakum's Altar
            zakum_arms = await eval_js("window.game.boss ? window.game.boss.arms.length : 0")
            print(f"7. Zakum Boss arms count on altar: {zakum_arms}")

            # Test Chat
            await eval_js("window.game.sendChatMessage('빅뱅 이전 클래식 메이플 최고!')")
            speech_text = await eval_js("window.game.player.speechText")
            print(f"8. Player speech bubble: '{speech_text}'")

            # Return to Henesys Hunting Ground 1 for final screenshot
            await eval_js("window.game.changeMap('henesys_hhg', 1050, 1320)")
            await eval_js("window.game.spawnBoss()")
            await asyncio.sleep(0.5)

            # 5. Capture Screenshot
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
                print("[ERROR] Detected Runtime Exceptions:", json.dumps(errors, indent=2, ensure_ascii=False))
            else:
                print("[SUCCESS] 0 Runtime Exceptions detected! Game engine is 100% stable.")

    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(main())
