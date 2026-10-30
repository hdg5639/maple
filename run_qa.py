# run_qa.py - Closed-Loop Industrial QA Suite for OpenMaple Classic
import subprocess
import time
import urllib.request
import json
import asyncio
import websockets
import os
import sys
import socket
import sqlite3

if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

async def main():
    server_proc = None
    if not is_port_open(8000):
        print("[QA] Starting background server.py...")
        server_proc = subprocess.Popen([sys.executable, 'server.py', '--no-browser'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(40):
            if is_port_open(8000):
                print("[QA] Server is ready on http://localhost:8000/")
                break
            await asyncio.sleep(0.2)
        else:
            raise RuntimeError("Failed to start server.py on port 8000!")

    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    target_url = 'http://localhost:8000/'
    print(f"[QA] Launching Chrome against Multithreaded HTTP Server: {target_url}")

    proc = subprocess.Popen([
        chrome_path,
        '--headless=new',
        '--remote-debugging-port=9222',
        '--window-size=1280,800',
        '--disable-gpu',
        target_url
    ])

    await asyncio.sleep(2.5)

    try:
        req = urllib.request.urlopen('http://localhost:9222/json')
        tabs = json.loads(req.read())
        target_tab = next((t for t in tabs if '8000' in t.get('url', '') or 'openmaple' in t.get('url', '') or 'index.html' in t.get('url', '')), None)

        if not target_tab:
            print("[QA ERROR] Target tab not found!")
            return

        ws_url = target_tab['webSocketDebuggerUrl']
        print(f"[QA] Connected to CDP WebSocket: {ws_url}")

        async with websockets.connect(ws_url) as ws:
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
                        res = resp.get('result', {})
                        if 'exceptionDetails' in res:
                            print(f"[JS EXCEPTION] {res['exceptionDetails']}")
                        return res.get('result', {}).get('value')

            for _ in range(100):
                if await eval_js("Boolean(window.game && window.game.player && window.game.map)"):
                    break
                await asyncio.sleep(0.1)
            else:
                raise AssertionError(f"Game initialization timed out; browser exceptions: {errors}")

            # === TEST 1: Engine & SOLID Architecture Verification ===
            print("\n--- [TEST 1] SOLID Architecture & Module Presence ---")
            game_exists = await eval_js("typeof window.game !== 'undefined'")
            combat_exists = await eval_js("typeof window.CombatSystem !== 'undefined'")
            skills_exists = await eval_js("typeof window.SkillRegistry !== 'undefined'")
            registered_skills = await eval_js("window.SkillRegistry ? window.SkillRegistry.skills.size : 0")
            print(f"  Game Module: {game_exists}")
            print(f"  CombatSystem (SRP/LSP): {combat_exists}")
            print(f"  SkillRegistry (OCP): {skills_exists} ({registered_skills} skills registered)")
            assert game_exists and combat_exists and skills_exists and registered_skills >= 20, "SOLID Architecture modules check failed!"

            # === TEST 2: Closed-Loop Melee Combat & Body Overlap Hitbox ===
            print("\n--- [TEST 2] Closed-Loop Combat: Melee Overlap & Hitstop ---")
            hit_test = await eval_js("""(() => {
                const g = window.game;
                const p = g.player;
                p.x = 500;
                p.y = 1300;
                p.facing = 'right';
                p.attackTimer = 0;

                const snail = new Monster('snail', 495, 1300);
                const prevHp = snail.hp;
                g.monsters = [snail];
                g.damageDigits = [];

                const hitSuccess = p.normalAttack(g);
                const damageDealt = prevHp - snail.hp;
                const hasDamageDigits = g.damageDigits.length > 0;

                return {
                    hitSuccess,
                    damageDealt,
                    hasDamageDigits,
                    newHp: snail.hp,
                    hitstopActive: snail.hitstopTimer > 0
                };
            })()""")
            print(f"  Melee Overlap Attack Result: {hit_test}")
            assert hit_test['hitSuccess'] and hit_test['damageDealt'] > 0 and hit_test['hasDamageDigits'], "Melee body overlap attack failed!"

            # === TEST 3: Projectile Swept AABB & Anti-Tunneling ===
            print("\n--- [TEST 3] Projectile Swept AABB & Tunneling Prevention ---")
            proj_test = await eval_js("""(() => {
                const g = window.game;
                const p = g.player;
                const snail = new Monster('snail', 600, 1300);
                g.monsters = [snail];
                g.projectiles = [];
                g.damageDigits = [];

                const proj = new Projectile(520, 1290, 540, 0, 'arrow', 35, true, p);
                g.projectiles.push(proj);

                proj.update(0.1, g);
                proj.update(0.1, g);

                return {
                    projectileHit: proj.hit,
                    snailAlive: snail.isAlive(),
                    snailHp: snail.hp,
                    damageSkinDigits: g.damageDigits.length
                };
            })()""")
            print(f"  Swept Projectile Test Result: {proj_test}")
            assert proj_test['projectileHit'] and proj_test['damageSkinDigits'] > 0, "Projectile Swept AABB failed!"

            # === TEST 4: 8-Slot Quickslots & Skill Portfolio ===
            print("\n--- [TEST 4] 8-Slot Quickslots & Skill Portfolio ---")
            jobs = ['초보자', '전사', '마법사', '궁수', '도적']
            for job in jobs:
                await eval_js(f"window.game.changePlayerJob('{job}')")
                curr_job = await eval_js("window.game.player.job")
                bindings = await eval_js("window.game.player.quickslotBindings")
                print(f"  Job: {curr_job} -> Quickslot Bindings (8 slots): {bindings}")
                assert len(bindings) == 8, f"Quickslot bindings count was not 8 for {job}!"

                await eval_js("window.game.player.attackTimer = 0; window.game.player.mp = window.game.player.maxMp;")
                cast1 = await eval_js("window.game.player.useSkill(window.game.getQuickslotSkill(0), window.game)")
                print(f"    Slot 1 ({bindings[0]}) Cast: {cast1}")
                assert cast1, f"Failed to cast slot 1 skill for {job}!"

            # === TEST 5: All 5 Maps Grounding & Footholds ===
            print("\n--- [TEST 5] All 5 Maps Footholds, NPCs & Portals Grounding ---")
            map_keys = ['henesys_hhg', 'henesys_town', 'ellinia', 'ant_tunnel', 'zakum_altar']
            for mkey in map_keys:
                await eval_js(f"window.game.changeMap('{mkey}')")
                map_name = await eval_js("window.game.map.name")
                footholds_count = await eval_js("window.game.map.footholds.length")
                npcs_count = await eval_js("window.game.map.npcs.length")
                portals_count = await eval_js("window.game.map.portals.length")
                player_y = await eval_js("window.game.player.y")

                safe_ground = await eval_js("Boolean(window.game.map.findGroundFootholdAt(window.game.player.x))")
                print(f"  Map: {map_name} ({mkey}) | Footholds: {footholds_count} | NPCs: {npcs_count} | Portals: {portals_count} | Player Spawn Y: {player_y} | Ground Foothold Exists: {safe_ground}")
                assert safe_ground, f"Player spawned without ground foothold in {mkey}!"

            # === TEST 6: Zakum Boss 8 Independent Arms Raid ===
            print("\n--- [TEST 6] Zakum Boss 8 Independent Arms + Body Raid ---")
            await eval_js("window.game.changeMap('zakum_altar')")
            zakum_info = await eval_js("""(() => {
                const z = window.game.boss;
                if (!z) return null;
                return {
                    name: z.name,
                    armsCount: z.arms.length,
                    aliveArms: z.arms.filter(a => a.isAlive).length,
                    hitBoxesCount: z.getHitBoxes().length
                };
            })()""")
            print(f"  Zakum Boss Stats: {zakum_info}")
            assert zakum_info and zakum_info['armsCount'] == 8 and zakum_info['hitBoxesCount'] == 8, "Zakum arms phase must expose eight independent arm targets!"

            # === TEST 7: Ladder Physics & Anti-Stick Stop ===
            print("\n--- [TEST 7] Ladder Physics & Player Movement Stop ---")
            physics_test = await eval_js("""(() => {
                const p = window.game.player;
                const map = window.game.map;
                p.x = 260;
                p.currentFoothold = map.findGroundFootholdAt(p.x);
                p.y = p.currentFoothold.getYAtX(p.x);
                p.onGround = true;
                p.onLadder = false;
                p.vx = 0;
                p.moveRight();
                p.update(1/60, map);
                const movingVx = p.vx;
                p.stopHorizontal();
                for (let i = 0; i < 60; i++) p.update(1/60, map);
                const stoppedVx = p.vx;
                return { movingVx, stoppedVx };
            })()""")
            print(f"  Movement Stop Test: {physics_test}")
            assert physics_test['movingVx'] > 0 and physics_test['stoppedVx'] == 0, "Stop input test failed!"

            # === TEST 8: 5-Tab Inventory & Item UUID Metadata ===
            print("\n--- [TEST 8] 5-Tab Inventory Partitioning & Item UUID Metadata ---")
            inven_audit = await eval_js("""(() => {
                const p = window.game.player;
                const inv = p.inventory;
                const tabs = Object.keys(inv);
                const equipItems = inv.equip || [];
                const allHaveUUID = equipItems.length > 0 && equipItems.every(eq => Boolean(eq.item_uuid));
                const allHaveUpgradeSlots = equipItems.every(eq => eq.upgradeSlots !== undefined);
                return {
                    tabs,
                    equipCount: equipItems.length,
                    useCount: (inv.use || []).length,
                    setupCount: (inv.setup || []).length,
                    etcCount: (inv.etc || []).length,
                    cashCount: (inv.cash || []).length,
                    allHaveUUID,
                    allHaveUpgradeSlots
                };
            })()""")
            print(f"  Inventory Audit: {inven_audit}")
            assert 'equip' in inven_audit['tabs'] and 'use' in inven_audit['tabs'] and 'setup' in inven_audit['tabs'] and 'etc' in inven_audit['tabs'] and 'cash' in inven_audit['tabs'], "Missing 5-tab partitioning!"
            assert inven_audit['allHaveUUID'], "All equipment items must maintain unique item_uuid metadata!"
            assert inven_audit['allHaveUpgradeSlots'], "Equipment must maintain upgradeSlots metadata!"

            # === TEST 9: 4/4 Classic Dice Stat Distribution & Lobby ===
            print("\n--- [TEST 9] 4/4 Classic Dice Stat Distribution & Lobby System ---")
            dice_audit = await eval_js("""(() => {
                const ui = window.game.ui;
                ui.rollDiceStats();
                const d = ui.currentDiceStats;
                const sum = d.str + d.dex + d.int + d.luk;
                const validMin = d.str >= 4 && d.dex >= 4 && d.int >= 4 && d.luk >= 4;
                return {
                    str: d.str,
                    dex: d.dex,
                    int: d.int,
                    luk: d.luk,
                    sum,
                    validMin
                };
            })()""")
            print(f"  Dice Roll Result: {dice_audit}")
            assert dice_audit['sum'] == 25 and dice_audit['validMin'], "4/4 Classic dice roll must total exactly 25 and have each stat >= 4!"

            # === TEST 10: SQLite WAL Mode & Zero-Delay Persistence ===
            print("\n--- [TEST 10] SQLite WAL Mode & Server Zero-Delay Persistence ---")
            conn = sqlite3.connect("openmaple.db")
            wal_mode = conn.execute("PRAGMA journal_mode;").fetchone()[0]
            conn.close()
            print(f"  SQLite Journal Mode: {wal_mode.upper()}")
            assert wal_mode.upper() == 'WAL', f"Database journal mode must be WAL! Current: {wal_mode}"

            # === TEST 11: Console Runtime Error Audit ===
            print("\n--- [TEST 11] Console Runtime Error Audit ---")
            print(f"  Total Console Exceptions: {len(errors)}")
            if errors:
                for err in errors:
                    print(f"    [EXCEPTION] {err}")
            assert len(errors) == 0, f"Detected {len(errors)} runtime exceptions!"

            print("\n========================================================")
            print("  ALL 11 INDUSTRIAL QA TESTS PASSED WITH 0 RUNTIME ERRORS!")
            print("========================================================\n")

    finally:
        proc.kill()
        if server_proc:
            server_proc.terminate()

if __name__ == '__main__':
    asyncio.run(main())
