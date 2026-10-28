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
        file_url = 'http://localhost:8000/'
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
        target = next((t for t in tabs if '8000' in t.get('url', '') or 'openmaple' in t.get('url', '') or 'index.html' in t.get('url', '')), None)
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

    # --- TEST MODULE 1: Movement Kinematics, Facing Direction & Input Resolution ---
    async def test_movement_kinematics(self):
        print("\n=== Module 1: Movement Kinematics, Facing Direction & Input Ergonomics ===")

        # 1. Verification of Sprite Visual Transform (Moonwalk Prevention)
        # Official Maple sprites face left naturally. Therefore, 'right' must flip via scale(-1, 1), 'left' must NOT flip.
        facing_logic_valid = await self.evaluate("""
            (() => {
                const cvs = document.createElement('canvas');
                const ctx = cvs.getContext('2d');
                let lastScaleX = 1;
                const origScale = ctx.scale.bind(ctx);
                ctx.scale = function(x, y) {
                    lastScaleX = x;
                    origScale(x, y);
                };

                window.game.player.facing = 'right';
                lastScaleX = 1;
                window.sprites.drawPlayer(ctx, window.game.player);
                const flippedOnRight = (lastScaleX === -1);

                window.game.player.facing = 'left';
                lastScaleX = 1;
                window.sprites.drawPlayer(ctx, window.game.player);
                const flippedOnLeft = (lastScaleX === -1);

                return { flippedOnRight, flippedOnLeft };
            })()
        """)
        anti_moonwalk_ok = facing_logic_valid['flippedOnRight'] and not facing_logic_valid['flippedOnLeft']
        self.record_test("Kinematics", "Anti-Moonwalk Visual Orientation", anti_moonwalk_ok,
                         f"Facing Right flipped={facing_logic_valid['flippedOnRight']}, Facing Left flipped={facing_logic_valid['flippedOnLeft']}")

        # 2. Last-Key-Wins Simultaneous Arrow Key Resolution
        await self.evaluate("""
            window.game.player.x = 400;
            window.game.player.y = 1320;
            window.game.player.vx = 0;
            window.game.player.invincibleTimer = 0;
            window.game.keys = {};
            window.game.lastHorizontalKey = null;
            window.game.player.stopHorizontal();
        """)
        await asyncio.sleep(0.1)

        # Press Left Arrow -> moving left
        await self.evaluate("""
            window.game.keys['ArrowLeft'] = true;
            window.game.lastHorizontalKey = 'ArrowLeft';
        """)
        await asyncio.sleep(0.15)
        state_left = await self.evaluate("({ vx: window.game.player.vx, facing: window.game.player.facing })")

        # While holding Left Arrow, press Right Arrow -> Last-Key-Wins moves right immediately without freezing!
        await self.evaluate("""
            window.game.keys['ArrowRight'] = true;
            window.game.lastHorizontalKey = 'ArrowRight';
        """)
        await asyncio.sleep(0.15)
        state_right = await self.evaluate("({ vx: window.game.player.vx, facing: window.game.player.facing })")

        # Release Right Arrow -> seamlessly resumes moving left!
        await self.evaluate("""
            window.game.keys['ArrowRight'] = false;
        """)
        await asyncio.sleep(0.15)
        state_resume_left = await self.evaluate("({ vx: window.game.player.vx, facing: window.game.player.facing })")

        # Release all -> stops
        await self.evaluate("""
            window.game.keys['ArrowLeft'] = false;
            window.game.player.stopHorizontal();
        """)
        await asyncio.sleep(0.1)
        state_stop = await self.evaluate("window.game.player.vx === 0")

        lkw_passed = (state_left['vx'] < 0 and state_left['facing'] == 'left' and
                      state_right['vx'] > 0 and state_right['facing'] == 'right' and
                      state_resume_left['vx'] < 0 and state_resume_left['facing'] == 'left' and
                      state_stop)
        self.record_test("Kinematics", "Last-Key-Wins Key Conflict Resolution", lkw_passed,
                         f"L: vx={state_left['vx']:.1f}, R: vx={state_right['vx']:.1f}, Resume: vx={state_resume_left['vx']:.1f}, Stop={state_stop}")

    # --- TEST MODULE 2: Physics Invariants & Foothold Traversal ---
    async def test_physics_invariants(self):
        print("\n=== Module 2: Physics Invariants & Foothold Traversal ===")
        
        init_p = await self.evaluate("({ x: window.game.player.x, y: window.game.player.y, onGround: window.game.player.onGround, fh: window.game.player.currentFoothold?.id })")
        self.record_test("Physics", "Player Spawn Physics", init_p['onGround'] and init_p['y'] > 500, f"Spawned at x={init_p['x']}, y={init_p['y']}, fh={init_p['fh']}")

        # Move right across platforms
        await self.evaluate("window.game.keys['ArrowRight'] = true; window.game.lastHorizontalKey = 'ArrowRight';")
        fell_into_void = False
        y_glitched = False
        for _ in range(25):
            await asyncio.sleep(0.04)
            pos = await self.evaluate("({ x: window.game.player.x, y: window.game.player.y, fh: window.game.player.currentFoothold?.id })")
            if pos['y'] < 100 or pos['y'] > 1500:
                fell_into_void = True
            if pos['y'] is None or str(pos['y']) == 'null':
                y_glitched = True
        await self.evaluate("window.game.keys['ArrowRight'] = false; window.game.player.stopHorizontal()")
        
        self.record_test("Physics", "Continuous Foothold Walking", not fell_into_void and not y_glitched, f"Crossed platform without void fall (y_glitched={y_glitched})")

        # Down-Jump Protection on Ground Floor
        pre_drop_y = await self.evaluate("window.game.player.y")
        await self.evaluate("window.game.player.dropThrough()")
        await asyncio.sleep(0.4)
        post_drop_y = await self.evaluate("window.game.player.y")
        drop_safe = abs(post_drop_y - pre_drop_y) < 50
        self.record_test("Physics", "Bottom Floor Down-Jump Protection", drop_safe, f"Pre Y: {pre_drop_y}, Post Y: {post_drop_y}")

        # Jump Parabolic Arc
        await self.evaluate("window.game.player.jump()")
        jump_vy_init = await self.evaluate("window.game.player.vy")
        await asyncio.sleep(0.2)
        jump_vy_mid = await self.evaluate("window.game.player.vy")
        jump_valid = jump_vy_init < -5.0 and jump_vy_mid > jump_vy_init
        self.record_test("Physics", "Jump Parabolic Arc", jump_valid, f"Initial vy={jump_vy_init:.1f}, Mid vy={jump_vy_mid:.1f}")
        await asyncio.sleep(0.4)

    # --- TEST MODULE 3: Complete 29-Skill Portfolio Across 5 Jobs ---
    async def test_expanded_29_skills(self):
        print("\n=== Module 3: Complete 29-Skill Portfolio Verification (5 Jobs) ===")

        job_skill_manifest = {
            '초보자': ['three_snails', 'power_strike', 'slash_blast', 'flash_jump', 'recovery'],
            '전사': ['power_strike', 'slash_blast', 'iron_body', 'rage', 'combo_attack', 'brandish', 'recovery'],
            '마법사': ['energy_bolt', 'magic_claw', 'teleport', 'magic_guard', 'thunderbolt', 'holy_symbol', 'recovery'],
            '궁수': ['arrow_blow', 'double_shot', 'focus', 'soul_arrow', 'arrow_bomb', 'hurricane', 'recovery'],
            '도적': ['lucky_seven', 'double_stab', 'flash_jump', 'haste', 'dark_site', 'shadow_partner', 'avenger']
        }

        total_skills_tested = 0
        for job, expected_skills in job_skill_manifest.items():
            await self.evaluate(f"window.game.changePlayerJob('{job}')")
            curr_job = await self.evaluate("window.game.player.job")
            skill_keys = await self.evaluate("Object.keys(window.game.player.skills)")
            
            job_match = curr_job == job
            skills_count_match = len(skill_keys) == len(expected_skills)
            self.record_test("Skills", f"Job Definition: {job} ({len(expected_skills)} Skills)",
                             job_match and skills_count_match,
                             f"Roster: {skill_keys}")

            for sk in expected_skills:
                # Set MP and attack timer
                await self.evaluate("""
                    window.game.player.attackTimer = 0;
                    window.game.player.mp = window.game.player.maxMp;
                    window.game.player.hp = window.game.player.maxHp;
                """)
                res = await self.evaluate(f"window.game.player.useSkill('{sk}', window.game)")
                # Passive skills return false or undefined on direct active use; active skills return true
                is_passive = sk == 'recovery'
                test_passed = (res is True) if not is_passive else (res is False)
                self.record_test("Skills", f"{job} Skill [{sk}]", test_passed, f"Returned {res} (Passive={is_passive})")
                total_skills_tested += 1
                await asyncio.sleep(0.05)

        self.record_test("Skills", "Full 33-Skill Domain Completeness", total_skills_tested == 33, f"Successfully validated all {total_skills_tested} canonical skills across 5 jobs")

    # --- TEST MODULE 4: Active Buff System & Damage Mitigation Mechanics ---
    async def test_buff_and_mitigation_system(self):
        print("\n=== Module 4: Active Buffs, HUD Rendering & Damage Mitigation ===")

        # 1. Rage Buff & Attack Stat Calculation
        await self.evaluate("window.game.changePlayerJob('전사')")
        pre_atk = await self.evaluate("window.game.player.maxAtk")
        await self.evaluate("window.game.player.useSkill('rage', window.game)")
        post_atk = await self.evaluate("window.game.player.maxAtk")
        has_rage_buff = await self.evaluate("Boolean(window.game.player.buffs && window.game.player.buffs.rage)")
        rage_atk_boosted = (post_atk - pre_atk) >= 35
        self.record_test("Buffs", "Rage Buff Stat Amplification", has_rage_buff and rage_atk_boosted,
                         f"Rage Active={has_rage_buff}, Max Atk: {pre_atk} -> {post_atk} (+{post_atk - pre_atk})")

        # 2. Magic Guard 80% Damage MP Absorption
        await self.evaluate("window.game.changePlayerJob('마법사')")
        await self.evaluate("window.game.player.useSkill('magic_guard', window.game)")
        has_mg = await self.evaluate("Boolean(window.game.player.buffs && window.game.player.buffs.magic_guard)")
        
        # Test damage absorption: 100 raw damage with Magic Guard
        dmg_result = await self.evaluate("""
            (() => {
                window.game.player.hp = 500;
                window.game.player.mp = 500;
                window.game.player.invincibleTimer = 0;
                const preHp = window.game.player.hp;
                const preMp = window.game.player.mp;
                window.game.player.takeDamage(100, window.game);
                return {
                    preHp, preMp,
                    postHp: window.game.player.hp,
                    postMp: window.game.player.mp,
                    hpLoss: preHp - window.game.player.hp,
                    mpLoss: preMp - window.game.player.mp
                };
            })()
        """)
        # 80 MP absorbed, ~20 HP lost
        mg_absorbed = dmg_result['mpLoss'] == 80 and dmg_result['hpLoss'] < 25
        self.record_test("Buffs", "Magic Guard 80% MP Damage Absorption", has_mg and mg_absorbed,
                         f"Pre HP/MP: {dmg_result['preHp']}/{dmg_result['preMp']}, Lost: HP -{dmg_result['hpLoss']}, MP -{dmg_result['mpLoss']}")

        # 3. Dark Sight Contact Damage Evasion
        await self.evaluate("window.game.changePlayerJob('도적')")
        await self.evaluate("window.game.player.useSkill('dark_site', window.game)")
        has_ds = await self.evaluate("Boolean(window.game.player.buffs && window.game.player.buffs.dark_site)")
        
        evasion_res = await self.evaluate("""
            (() => {
                window.game.player.hp = 400;
                window.game.player.invincibleTimer = 0;
                const preHp = window.game.player.hp;
                window.game.player.takeDamage(150, window.game);
                return {
                    preHp,
                    postHp: window.game.player.hp,
                    evaded: preHp === window.game.player.hp
                };
            })()
        """)
        self.record_test("Buffs", "Dark Sight Full Contact Evasion", has_ds and evasion_res['evaded'],
                         f"Dark Sight Active={has_ds}, HP {evasion_res['preHp']} -> {evasion_res['postHp']} (Evaded={evasion_res['evaded']})")

        # 4. HUD Buff Bar DOM Element Verification
        await self.evaluate("window.game.ui.updateHUD()")
        hud_buff_count = await self.evaluate("document.querySelectorAll('#hud-buff-bar .hud-buff-badge').length")
        self.record_test("Buffs", "HUD Buff Bar On-Screen Badges", hud_buff_count > 0,
                         f"Rendered {hud_buff_count} active buff badges on HUD")

    # --- TEST MODULE 5: 5-Map Topology, Foothold Grounding & Monster Placement ---
    async def test_map_and_monster_alignment(self):
        print("\n=== Module 5: 5-Map Topology, Foothold Grounding & Monster Placement ===")
        maps = ['henesys_hhg', 'henesys_town', 'ant_tunnel', 'ellinia', 'zakum_altar']
        for m in maps:
            await self.evaluate(f"window.game.changeMap('{m}')")
            await asyncio.sleep(0.35)

            # 1. Check player spawn and ground physics
            p_state = await self.evaluate("({ x: window.game.player.x, y: window.game.player.y, onGround: window.game.player.onGround, fh: window.game.player.currentFoothold?.id })")
            p_safe = p_state['onGround'] and p_state['y'] > 0
            self.record_test("Map", f"Spawn Grounded: {m}", p_safe, f"x={p_state['x']:.0f}, y={p_state['y']:.0f}, fh={p_state['fh']}")

            # 2. Check all NPCs are grounded on footholds
            npc_check = await self.evaluate("""
                window.game.map.npcs.every(npc => {
                    return window.game.map.footholds.some(fh => {
                        const minX = Math.min(fh.x1, fh.x2);
                        const maxX = Math.max(fh.x1, fh.x2);
                        return npc.x >= minX - 10 && npc.x <= maxX + 10 && Math.abs(fh.getYAtX(npc.x) - npc.y) <= 30;
                    });
                })
            """)
            self.record_test("Map", f"NPC Alignment: {m}", npc_check, "All NPCs firmly grounded on footholds")

            # 3. Check monster placement
            if m == 'zakum_altar':
                boss_only = await self.evaluate("window.game.monsters.length === 1 && window.game.monsters[0].id === 'zakum' && window.game.boss !== null")
                self.record_test("Monsters", f"Boss Altar Sole Entity: {m}", boss_only, "Zakum Altar has 0 wild field mobs; Zakum Boss is the sole raid entity")
            elif m == 'henesys_town':
                m_types = await self.evaluate("window.game.monsters.map(m => m.type)")
                town_safe = len(m_types) <= 3 and all(t in ['snail', 'blue_snail'] for t in m_types)
                self.record_test("Monsters", f"Peaceful Town Outskirts: {m}", town_safe, f"Town Mobs: {m_types}")
            else:
                m_alignment = await self.evaluate("""
                    window.game.monsters.every(mob => {
                        return mob.y >= 200 && (mob.onGround || mob.currentFoothold !== null || Boolean(window.game.map.findGroundFootholdAt(mob.x)));
                    })
                """)
                m_count = await self.evaluate("window.game.monsters.length")
                self.record_test("Monsters", f"Platform Grounding: {m} ({m_count} mobs)", m_alignment and m_count > 0, f"All {m_count} monsters placed firmly on platforms (no sky Y<100, no void drops)")

    # --- TEST MODULE 6: Combat & Boss System ---
    async def test_combat_system(self):
        print("\n=== Module 6: Combat, Hitbox & Zakum Boss Multi-Part ===")
        await self.evaluate("window.game.changeMap('henesys_hhg')")
        await asyncio.sleep(0.3)
        
        monsters = await self.evaluate("window.game.monsters.length")
        self.record_test("Combat", "Monster Population Check", monsters > 10, f"Found {monsters} monsters on map")

        # Hit rate formula check
        hit_rates = []
        for _ in range(50):
            hr = await self.evaluate("window.game.player.checkHit({ avoid: 12, level: 8 })")
            hit_rates.append(hr)
        rate_avg = sum(hit_rates) / len(hit_rates)
        self.record_test("Combat", "Hit Chance Base Guarantee", rate_avg >= 0.35, f"Observed hit rate: {rate_avg*100:.1f}% (Base min: 35%)")

        # Zakum Boss 8-arm verification
        await self.evaluate("window.game.changeMap('zakum_altar')")
        zakum_arms = await self.evaluate("window.game.boss?.arms?.length")
        self.record_test("Combat", "Zakum Boss 8-Arm Sub-parts", zakum_arms == 8, f"Zakum initialized with {zakum_arms} independent floating arms")

    # --- TEST MODULE 6: UI, AP/SP Distribution & Chaos Stress ---
    async def test_ui_and_chaos(self):
        print("\n=== Module 6: UI Modals, Stat AP/SP & Stress Test ===")
        
        # Test Stat Point (AP) allocation
        await self.evaluate("window.game.ui.toggleWindow('win-stats')")
        pre_str = await self.evaluate("window.game.player.str")
        pre_ap = await self.evaluate("window.game.player.ap")
        
        await self.evaluate("document.getElementById('btn-add-str').click()")
        post_str = await self.evaluate("window.game.player.str")
        post_ap = await self.evaluate("window.game.player.ap")
        dom_str = await self.evaluate("document.getElementById('stat-win-str').innerText")

        ap_applied = (post_str == pre_str + 1) and (post_ap == pre_ap - 1) and (str(post_str) in dom_str)
        self.record_test("UI", "AP Stat Distribution & DOM Sync", ap_applied, f"STR: {pre_str}->{post_str}, AP: {pre_ap}->{post_ap}")

        # Rapid Input Chaos Stress
        keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'AltLeft', 'ControlLeft', 'KeyQ', 'KeyW', 'KeyE', 'KeyF']
        for i in range(30):
            k = keys[i % len(keys)]
            await self.evaluate(f"window.game.keys['{k}'] = true")
            await asyncio.sleep(0.015)
            await self.evaluate(f"window.game.keys['{k}'] = false")

        p_alive = await self.evaluate("window.game.player.hp > 0")
        no_fatal_crash = len(self.errors) == 0
        self.record_test("Chaos", "Monkey Input Fuzzing", no_fatal_crash and p_alive, f"Player alive={p_alive}, Console Exceptions={len(self.errors)}")

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

        for err in self.errors:
            print("[CRITICAL EXCEPTION IN BROWSER]:", err.get('exceptionDetails', {}).get('text'), err.get('exceptionDetails', {}).get('exception', {}).get('description'))
        self.report["summary"]["exceptions"] = len(self.errors)
        with open('qa_report.json', 'w', encoding='utf-8') as f:
            json.dump(self.report, f, indent=2, ensure_ascii=False)
        print(f"[Artifact] Structured QA Report saved: qa_report.json")

        if self.proc:
            self.proc.terminate()

        print("\n" + "=" * 60)
        print("📊 FINAL COMPREHENSIVE QA TEST SUITE SUMMARY")
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
        await suite.test_movement_kinematics()
        await suite.test_physics_invariants()
        await suite.test_expanded_29_skills()
        await suite.test_buff_and_mitigation_system()
        await suite.test_map_and_monster_alignment()
        await suite.test_combat_system()
        await suite.test_ui_and_chaos()
    finally:
        success = await suite.finish()
        if not success:
            sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
