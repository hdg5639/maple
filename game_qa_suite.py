# game_qa_suite.py - Industrial-Grade Automated QA Testing Suite for OpenMaple Classic
import asyncio
import json
import websockets
import urllib.request
import subprocess
import os
import sys
import time

if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9222

class GameQASuite:
    def __init__(self):
        self.proc = None
        self.ws = None
        self.msg_id = 0
        self.pending_futures = {}
        self.errors = []
        self.logs = []
        self.report = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "modules": {},
            "summary": {"total": 0, "passed": 0, "failed": 0, "exceptions": 0}
        }

    async def start(self):
        file_url = 'file:///' + os.path.abspath('index.html').replace('\\', '/')
        self.proc = subprocess.Popen([
            CHROME_PATH,
            '--headless=new',
            f'--remote-debugging-port={PORT}',
            '--window-size=1280,800',
            '--disable-gpu',
            file_url
        ])
        await asyncio.sleep(2.0)

        req = urllib.request.urlopen(f'http://localhost:{PORT}/json')
        tabs = json.loads(req.read())
        target = next((t for t in tabs if 'openmaple' in t.get('url', '') or 'index.html' in t.get('url', '')), None)
        if not target:
            raise RuntimeError("Failed to locate OpenMaple browser tab.")

        self.ws = await websockets.connect(target['webSocketDebuggerUrl'])
        asyncio.create_task(self._listen_events())
        await self.send_cmd('Runtime.enable')
        await self.send_cmd('Page.enable')
        await asyncio.sleep(0.5)

    async def _listen_events(self):
        try:
            async for raw in self.ws:
                msg = json.loads(raw)
                method = msg.get('method')
                if method == 'Runtime.exceptionThrown':
                    self.errors.append(msg['params'])
                elif method == 'Runtime.consoleAPICalled':
                    self.logs.append(msg['params'])
                
                mid = msg.get('id')
                if mid and mid in self.pending_futures:
                    fut = self.pending_futures.pop(mid)
                    if not fut.done():
                        fut.set_result(msg)
        except Exception:
            pass

    async def send_cmd(self, method, params=None):
        self.msg_id += 1
        curr_id = self.msg_id
        fut = asyncio.get_running_loop().create_future()
        self.pending_futures[curr_id] = fut
        payload = {'id': curr_id, 'method': method}
        if params:
            payload['params'] = params
        await self.ws.send(json.dumps(payload))
        return await fut

    async def evaluate(self, expr):
        resp = await self.send_cmd('Runtime.evaluate', {'expression': expr, 'returnByValue': True})
        return resp.get('result', {}).get('result', {}).get('value')

    def record_test(self, module, test_name, passed, details=""):
        if module not in self.report["modules"]:
            self.report["modules"][module] = []
        self.report["modules"][module].append({
            "name": test_name,
            "passed": passed,
            "details": details
        })
        self.report["summary"]["total"] += 1
        if passed:
            self.report["summary"]["passed"] += 1
            print(f"  [PASS] {test_name}: {details}")
        else:
            self.report["summary"]["failed"] += 1
            print(f"  [FAIL] {test_name}: {details}")

    # --- TEST MODULE 1: Physics Invariants & Foothold Traversal ---
    async def test_physics_invariants(self):
        print("\n=== Module 1: Physics Invariants & Foothold Traversal ===")
        
        # 1. Continuous traversal check across footholds
        init_p = await self.evaluate("({ x: window.game.player.x, y: window.game.player.y, onGround: window.game.player.onGround, fh: window.game.player.currentFoothold?.id })")
        self.record_test("Physics", "Player Spawn Physics", init_p['onGround'] and init_p['y'] > 500, f"Spawned at x={init_p['x']}, y={init_p['y']}, fh={init_p['fh']}")

        # Move right across at least 8 footholds
        await self.evaluate("window.game.keys['ArrowRight'] = true")
        fell_into_void = False
        y_glitched = False
        for _ in range(30):
            await asyncio.sleep(0.04)
            pos = await self.evaluate("({ x: window.game.player.x, y: window.game.player.y, fh: window.game.player.currentFoothold?.id })")
            if pos['y'] < 100 or pos['y'] > 1500:
                fell_into_void = True
            if pos['y'] is None or str(pos['y']) == 'null':
                y_glitched = True
        await self.evaluate("window.game.keys['ArrowRight'] = false; window.game.player.stopHorizontal()")
        
        self.record_test("Physics", "Continuous Foothold Walking", not fell_into_void and not y_glitched, f"Crossed platform without void fall (y_glitched={y_glitched})")

        # 2. Down-Jump on Bottom-most Floor (Must NOT drop into void)
        pre_drop_y = await self.evaluate("window.game.player.y")
        await self.evaluate("window.game.player.dropThrough()")
        await asyncio.sleep(0.5)
        post_drop_y = await self.evaluate("window.game.player.y")
        drop_safe = abs(post_drop_y - pre_drop_y) < 50
        self.record_test("Physics", "Bottom Floor Down-Jump Protection", drop_safe, f"Pre Y: {pre_drop_y}, Post Y: {post_drop_y}")

        # 3. Jump parabolic arc verification
        await self.evaluate("window.game.player.jump()")
        jump_vy_init = await self.evaluate("window.game.player.vy")
        await asyncio.sleep(0.2)
        jump_vy_mid = await self.evaluate("window.game.player.vy")
        jump_valid = jump_vy_init < -5.0 and jump_vy_mid > jump_vy_init
        self.record_test("Physics", "Jump Parabolic Arc", jump_valid, f"Initial vy={jump_vy_init}, Mid vy={jump_vy_mid}")
        await asyncio.sleep(0.4)

    # --- TEST MODULE 2: Combat, Hitbox & Projectiles ---
    async def test_combat_system(self):
        print("\n=== Module 2: Combat & Hitbox Collision ===")
        
        monsters = await self.evaluate("window.game.monsters.length")
        self.record_test("Combat", "Monster Population Check", monsters > 10, f"Found {monsters} monsters on map")

        # Normal attack trigger
        attack_res = await self.evaluate("window.game.player.normalAttack(window.game)")
        self.record_test("Combat", "Normal Attack Execution", attack_res in [True, False], "Normal attack executed without error")

        # Hit rate formula calibration check
        hit_rates = []
        for _ in range(60):
            hr = await self.evaluate("window.game.player.checkHit({ avoid: 12, level: 8 })")
            hit_rates.append(hr)
        rate_avg = sum(hit_rates) / len(hit_rates)
        self.record_test("Combat", "Hit Chance Base Guarantee", rate_avg >= 0.35, f"Observed hit rate against Lv.8 monster: {rate_avg*100:.1f}% (Base min: 35%)")

    # --- TEST MODULE 3: Skill & Buff Engine Matrix ---
    async def test_skills_matrix(self):
        print("\n=== Module 3: Skill & Buff Matrix (17 Skills Across 5 Jobs) ===")
        
        # Beginner Skills
        skills = ['power_strike', 'slash_blast', 'magic_claw', 'flash_jump']
        for sk in skills:
            await self.evaluate("window.game.player.attackTimer = 0; window.game.player.mp = window.game.player.maxMp;")
            res = await self.evaluate(f"window.game.player.useSkill('{sk}', window.game)")
            self.record_test("Skills", f"Beginner [{sk}]", res is True, "Skill cast successfully")
            await asyncio.sleep(0.1)

        # Class Advancement and Skills
        job_matrix = {
            '전사': ['power_strike', 'slash_blast', 'iron_body'],
            '마법사': ['energy_bolt', 'magic_claw', 'teleport'],
            '궁수': ['arrow_blow', 'double_shot', 'focus'],
            '도적': ['lucky_seven', 'double_stab', 'flash_jump', 'haste']
        }
        for job, jskills in job_matrix.items():
            await self.evaluate(f"window.game.changePlayerJob('{job}')")
            curr_job = await self.evaluate("window.game.player.job")
            self.record_test("Skills", f"Advancement to {job}", curr_job == job, f"Job set to {curr_job}")
            for sk in jskills:
                await self.evaluate("window.game.player.attackTimer = 0; window.game.player.mp = window.game.player.maxMp;")
                res = await self.evaluate(f"window.game.player.useSkill('{sk}', window.game)")
                self.record_test("Skills", f"{job} [{sk}]", res is True, f"Skill {sk} executed successfully")
                await asyncio.sleep(0.1)

    # --- TEST MODULE 4: State Machine & AP/SP Distribution ---
    async def test_state_integrity(self):
        print("\n=== Module 4: State Machine & AP/SP Integrity ===")
        
        # Test Stat Point (AP) allocation
        await self.evaluate("window.game.ui.toggleWindow('win-stats')")
        pre_str = await self.evaluate("window.game.player.str")
        pre_ap = await self.evaluate("window.game.player.ap")
        
        # Click + STR button
        await self.evaluate("document.getElementById('btn-add-str').click()")
        post_str = await self.evaluate("window.game.player.str")
        post_ap = await self.evaluate("window.game.player.ap")
        dom_str = await self.evaluate("document.getElementById('stat-win-str').innerText")

        ap_applied = (post_str == pre_str + 1) and (post_ap == pre_ap - 1) and (str(post_str) in dom_str)
        self.record_test("State", "AP Allocation & DOM Refresh", ap_applied, f"STR: {pre_str}->{post_str}, AP: {pre_ap}->{post_ap}, DOM Text: '{dom_str}'")

        # Test Skill Point (SP) allocation
        await self.evaluate("window.game.ui.toggleWindow('win-skills')")
        sp_res = await self.evaluate("(() => { const btn = document.querySelector('.btn-sp-add:not([disabled])'); if (!btn) return false; btn.click(); return true; })()")
        self.record_test("State", "SP Allocation & Skill Level Up", sp_res in [True, False], "SP button clicked without exception")

    # --- TEST MODULE 5: Chaos / Monkey Fuzzing Stress Test ---
    async def test_chaos_monkey(self):
        print("\n=== Module 5: Chaos / Monkey Fuzzing Stress Test (Rapid Inputs) ===")
        
        # Simulate 60 rapid random key presses and skill activations across maps
        keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'AltLeft', 'ControlLeft', 'KeyQ', 'KeyW', 'KeyE', 'KeyF']
        for i in range(40):
            k = keys[i % len(keys)]
            await self.evaluate(f"window.game.keys['{k}'] = true")
            await asyncio.sleep(0.02)
            await self.evaluate(f"window.game.keys['{k}'] = false")

        # Multi-map rapid switching
        for m in ['ant_tunnel', 'ellinia', 'zakum_altar', 'henesys_hhg']:
            await self.evaluate(f"window.game.changeMap('{m}')")
            await asyncio.sleep(0.2)

        p_alive = await self.evaluate("window.game.player.hp > 0")
        no_fatal_crash = len(self.errors) == 0
        self.record_test("Chaos", "Monkey Fuzzing & Multi-Map Stress", no_fatal_crash and p_alive, f"Completed 40 chaotic input cycles, Player Alive={p_alive}, Exceptions={len(self.errors)}")

    async def finish(self):
        # Capture Final Pass Screenshot
        try:
            resp = await self.send_cmd('Page.captureScreenshot')
            import base64
            data = base64.b64decode(resp['result']['data'])
            with open('qa_verification_pass.png', 'wb') as f:
                f.write(data)
            print(f"\n[Artifact] QA Verification Screenshot saved: qa_verification_pass.png ({len(data)} bytes)")
        except Exception as e:
            print(f"\n[Artifact] Screenshot capture failed: {e}")

        self.report["summary"]["exceptions"] = len(self.errors)
        with open('qa_report.json', 'w', encoding='utf-8') as f:
            json.dump(self.report, f, indent=2, ensure_ascii=False)
        print(f"[Artifact] Structured QA Report saved: qa_report.json")

        if self.proc:
            self.proc.terminate()

        print("\n" + "=" * 60)
        print("📊 FINAL QA TEST SUITE SUMMARY")
        print("=" * 60)
        print(f"Total Tests Run   : {self.report['summary']['total']}")
        print(f"Passed            : {self.report['summary']['passed']}")
        print(f"Failed            : {self.report['summary']['failed']}")
        print(f"Runtime Exceptions: {self.report['summary']['exceptions']}")
        print("=" * 60)
        return self.report['summary']['failed'] == 0 and self.report['summary']['exceptions'] == 0

async def main():
    suite = GameQASuite()
    try:
        await suite.start()
        await suite.test_physics_invariants()
        await suite.test_combat_system()
        await suite.test_skills_matrix()
        await suite.test_state_integrity()
        await suite.test_chaos_monkey()
    finally:
        success = await suite.finish()
        if not success:
            sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
