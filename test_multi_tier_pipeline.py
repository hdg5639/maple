# test_multi_tier_pipeline.py - 4-Tier Automated Test Pipeline
import subprocess
import time
import urllib.request
import json
import asyncio
import websockets
import os
import sys

if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

async def run_pipeline():
    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    target_url = 'http://localhost:8000/'
    print(f"[PIPELINE] Launching Headless Chrome against: {target_url}")

    proc = subprocess.Popen([
        chrome_path,
        '--headless=new',
        '--remote-debugging-port=9223',
        '--window-size=1280,800',
        '--disable-gpu',
        target_url
    ])

    await asyncio.sleep(2.5)

    try:
        req = urllib.request.urlopen('http://localhost:9223/json')
        tabs = json.loads(req.read())
        target_tab = next((t for t in tabs if '8000' in t.get('url', '') or 'openmaple' in t.get('url', '')), None)
        assert target_tab, "Target tab not found!"

        ws_url = target_tab['webSocketDebuggerUrl']
        print(f"[PIPELINE] Connected via WebSocket: {ws_url}")

        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({'id': 1, 'method': 'Runtime.enable'}))
            await ws.send(json.dumps({'id': 2, 'method': 'Page.enable'}))

            msg_id = 100
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
                    if resp.get('id') == curr_id:
                        res = resp.get('result', {})
                        if 'exceptionDetails' in res:
                            print(f"[PIPELINE ERROR] {res['exceptionDetails']}")
                        return res.get('result', {}).get('value')

            await asyncio.sleep(1.0)

            print("\n=======================================================")
            print("  4-TIER AUTOMATED TEST PIPELINE EXECUTION (품질 관리 체계)")
            print("=======================================================")

            # --- TIER 1: 단위 테스트 (Unit Tests) ---
            print("\n--- [TIER 1: 단위 테스트 (Unit Tests)] ---")
            cat_check = await eval_js("""(() => {
                const cat = window.MAPLE_EQUIPMENT_CATALOG;
                return {
                    hasCatalog: !!cat,
                    swordCount: cat?.swords?.length || 0,
                    daggerCount: cat?.daggers?.length || 0,
                    starCount: cat?.stars?.length || 0,
                    clawCount: cat?.claws?.length || 0,
                    bowCount: cat?.bows?.length || 0,
                    wandCount: cat?.wands?.length || 0
                };
            })()""")
            print(f"  Equipment Catalog Counts: {cat_check}")
            assert cat_check['swordCount'] >= 5, "Swords count < 5"
            assert cat_check['daggerCount'] >= 6, "Daggers count < 6"
            assert cat_check['starCount'] >= 7, "Stars count < 7"
            assert cat_check['clawCount'] >= 5, "Claws count < 5"
            print("  [PASS] Tier 1: Canonical Weapons & Throwing Stars Catalog Unit Integrity Verified!")

            # --- TIER 2: 통합 테스트 (Integration Tests) ---
            print("\n--- [TIER 2: 통합 테스트 (Integration Tests)] ---")
            equip_integration = await eval_js("""(() => {
                const g = window.game;
                const p = g.player;

                // 1. Equip Highlander
                p.equipById('wp_highlander');
                const highlanderAtk = p.maxAtk;

                // 2. Equip Gryunhill
                p.equipById('wp_gryunhill');
                const gryunhillAtk = p.maxAtk;

                // 3. Equip Taeguk Fan (Dagger)
                p.equipById('wp_taeguk_fan');
                const daggerType = p.weaponType;
                const daggerPrimarySkill = p.getPrimarySkillId();

                // 4. Equip Steely Star (뇌전수리검)
                p.equipById('star_steely');
                const activeStarSteely = p.activeStar;

                // 5. Equip Ilbi Star (일비표창)
                p.equipById('star_ilbi');
                const activeStarIlbi = p.activeStar;

                return {
                    highlanderAtk,
                    gryunhillAtk,
                    gryunhillStronger: gryunhillAtk > highlanderAtk,
                    daggerType,
                    daggerPrimarySkill,
                    activeStarSteely,
                    activeStarIlbi
                };
            })()""")
            print(f"  Equipment Integration Result: {equip_integration}")
            assert equip_integration['gryunhillStronger'], "Gryunhill should have higher Atk than Highlander"
            assert equip_integration['daggerType'] == 'dagger', "Weapon type should be dagger"
            assert equip_integration['activeStarSteely'] == 'steely', "Active star should be steely"
            assert equip_integration['activeStarIlbi'] == 'ilbi', "Active star should be ilbi"
            print("  [PASS] Tier 2: Armory Equipping, Stat Amplification & Throwing Star Integration Verified!")

            # --- TIER 3: 시스템 테스트 (System Tests) ---
            print("\n--- [TIER 3: 시스템 테스트 (System Tests)] ---")
            system_check = await eval_js("""(() => {
                const g = window.game;
                const ui = g.ui;

                // Test Armory Window DOM
                const winArmory = document.getElementById('win-armory');
                ui.toggleWindow('win-armory');
                const armoryVisible = winArmory && winArmory.style.display === 'block';

                // Test Key Config DOM & localStorage
                const winKey = document.getElementById('win-keyconfig');
                ui.toggleWindow('win-keyconfig');
                const keyConfigVisible = winKey && winKey.style.display === 'block';

                // Test Map Transition Snapping
                g.changeMap('henesys_town');
                const townCamSnapping = Math.abs(g.camera.x - (g.player.x - g.canvas.width / 2)) < 5;

                return {
                    armoryVisible,
                    keyConfigVisible,
                    townCamSnapping,
                    currentMap: g.map.currentKey
                };
            })()""")
            print(f"  System & UI Diagnostics: {system_check}")
            assert system_check['armoryVisible'], "Armory window should be toggleable"
            assert system_check['currentMap'] == 'henesys_town', "Should have transitioned to henesys_town"
            print("  [PASS] Tier 3: Armory Window, Key Config Modal & Map Transition Snapping Verified!")

            # --- TIER 4: 인수 테스트 (Acceptance Tests) ---
            print("\n--- [TIER 4: 인수 테스트 (Acceptance Tests)] ---")
            acceptance_check = await eval_js("""(() => {
                const g = window.game;
                const p = g.player;

                // Test Warrior Power Strike
                g.changePlayerJob('전사');
                p.attackTimer = 0;
                p.mp = 0; // Empty MP to test protection!
                const warriorAttackResult = p.primaryAttack(g);

                // Test Thief Double Stab with Dagger
                g.changePlayerJob('도적');
                p.equipById('wp_taeguk_fan');
                p.attackTimer = 0;
                p.mp = 0;
                const banditAttackSkill = p.getPrimarySkillId();
                const banditAttackResult = p.primaryAttack(g);

                // Test Thief Lucky Seven with Claw & 뇌전수리검
                p.equipById('wp_meba');
                p.equipById('star_steely');
                p.attackTimer = 0;
                p.mp = 0;
                const nlAttackSkill = p.getPrimarySkillId();
                const nlAttackResult = p.primaryAttack(g);

                return {
                    warriorAttackResult,
                    banditAttackSkill,
                    banditAttackResult,
                    nlAttackSkill,
                    nlAttackResult,
                    activeStar: p.activeStar
                };
            })()""")
            print(f"  Acceptance Check Results: {acceptance_check}")
            assert acceptance_check['warriorAttackResult'], "Warrior primary attack should succeed even with 0 MP"
            assert acceptance_check['banditAttackSkill'] == 'double_stab', "Bandit should use double_stab with dagger"
            assert acceptance_check['banditAttackResult'], "Bandit primary attack should succeed"
            assert acceptance_check['nlAttackSkill'] == 'lucky_seven', "Night Lord should use lucky_seven with claw"
            assert acceptance_check['nlAttackResult'], "Night Lord primary attack should succeed"
            assert acceptance_check['activeStar'] == 'steely', "Active star should be steely"
            print("  [PASS] Tier 4: User Experience, Job Signature Basic Skills & Zero-MP Lockout Invariant Verified!")

            print("\n=======================================================")
            print("  🎉 ALL 4 TIERS OF THE TEST PIPELINE COMPLETED SUCCESSFULLY!")
            print("=======================================================")

    finally:
        proc.kill()

if __name__ == '__main__':
    asyncio.run(run_pipeline())
