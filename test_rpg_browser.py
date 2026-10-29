"""Real browser clicks for enhancement, shop purchases and save/reload progression."""
import asyncio
import base64
import json
import os
from pathlib import Path
import tempfile

import game_qa_suite as qa_module
from game_qa_suite import GameQASuite


async def main():
    qa_module.PORT = int(os.environ.get('QA_CDP_PORT', '9225'))
    suite = GameQASuite()
    with tempfile.TemporaryDirectory(prefix='maple-rpg-qa-', ignore_cleanup_errors=True) as profile:
        profile_path = Path(profile).resolve()
        assert profile_path.parent == Path(tempfile.gettempdir()).resolve() and profile_path.name.startswith('maple-rpg-qa-')
        # Use an isolated Chrome profile so gameplay saves never touch another QA or user tab.
        original_popen = qa_module.subprocess.Popen
        qa_module.subprocess.Popen = lambda args, **kwargs: original_popen(
            [*args, f'--user-data-dir={profile}'], **kwargs)
        try:
            await suite.start()
        finally:
            qa_module.subprocess.Popen = original_popen
        try:
            async def evaluate(expression):
                response = await suite.send_cmd('Runtime.evaluate', {
                    'expression': expression, 'returnByValue': True, 'awaitPromise': True
                })
                result = response.get('result', {})
                assert 'exceptionDetails' not in result, result.get('exceptionDetails')
                return result.get('result', {}).get('value')

            async def click(selector):
                point = await evaluate(f"""(() => {{
                  const element = document.querySelector({json.dumps(selector)});
                  if (!element || element.disabled) throw new Error('Missing or disabled control: ' + {json.dumps(selector)});
                  element.scrollIntoView({{block: 'nearest', inline: 'nearest'}});
                  const rect = element.getBoundingClientRect();
                  if (!rect.width || !rect.height) throw new Error('Hidden control');
                  return {{x: rect.left + rect.width / 2, y: rect.top + rect.height / 2}};
                }})()""")
                await suite.send_cmd('Input.dispatchMouseEvent', {
                    'type': 'mousePressed', **point, 'button': 'left', 'clickCount': 1
                })
                await suite.send_cmd('Input.dispatchMouseEvent', {
                    'type': 'mouseReleased', **point, 'button': 'left', 'clickCount': 1
                })

            async def reload_game():
                await suite.send_cmd('Page.reload', {'ignoreCache': True})
                await asyncio.sleep(0.25)
                for _ in range(100):
                    if await evaluate("document.readyState === 'complete' && Boolean(window.game?.player)"):
                        await evaluate('game.autoHunt.enabled = false; game.update = () => {}; true')
                        return
                    await asyncio.sleep(0.1)
                raise AssertionError('Game did not restore after reload')

            await evaluate("""(() => {
              const g = game;
              g.changeMap('henesys_town');
              g.autoHunt.enabled = false;
              g.update = () => {};
              g.player.gainExp(67, g);
              g.player.ap = 0;
              g.player.sp = 0;
              g.player.mp = 0;
              g.player.meso = 50000;
              g.ui.updateHUD();
              g.saveProgress();
              return true;
            })()""")
            await click('#btn-inven-toggle')
            before = await evaluate("""(() => {
              const p = game.player, item = game.ui.enhancementTarget;
              return {atk: item.atk, maxAtk: p.maxAtk, slots: item.upgradeSlots,
                meso: p.meso, fee: p.getEnhancementFee(item)};
            })()""")
            await evaluate("""(() => {
              const select = document.getElementById('enhancement-scroll');
              select.value = 'scroll_atk_100'; select.dispatchEvent(new Event('change'));
              return true;
            })()""")
            await click('#btn-enhance-equipment')
            after = await evaluate("""(() => {
              const p = game.player, item = game.ui.enhancementTarget;
              return {atk: item.atk, maxAtk: p.maxAtk, slots: item.upgradeSlots, meso: p.meso,
                result: p.lastEnhancementResult, message: document.getElementById('enhancement-result').textContent};
            })()""")
            assert after['atk'] == before['atk'] + 1 and after['maxAtk'] == before['maxAtk'] + 1, after
            assert after['slots'] == before['slots'] - 1 and after['meso'] == before['meso'] - before['fee'], after
            assert after['result']['success'] and '성공' in after['message'], after
            print('[PASS] Real enhancement button applies one guaranteed scroll and its displayed fee')

            failure_before = await evaluate("""(() => {
              window.rpgOriginalRandom = Math.random; Math.random = () => 0.999;
              const select = document.getElementById('enhancement-scroll');
              select.value = 'scroll_atk_60'; select.dispatchEvent(new Event('change'));
              const p = game.player, item = game.ui.enhancementTarget;
              return {atk: item.atk, slots: item.upgradeSlots, meso: p.meso, fee: p.getEnhancementFee(item)};
            })()""")
            await click('#btn-enhance-equipment')
            failure_after = await evaluate("""(() => {
              Math.random = window.rpgOriginalRandom;
              const p = game.player, item = game.ui.enhancementTarget;
              return {atk: item.atk, slots: item.upgradeSlots, meso: p.meso,
                result: p.lastEnhancementResult, message: document.getElementById('enhancement-result').textContent};
            })()""")
            assert not failure_after['result']['success'] and '실패' in failure_after['message'], failure_after
            assert failure_after['atk'] == failure_before['atk'], failure_after
            assert failure_after['slots'] == failure_before['slots'] - 1, failure_after
            assert failure_after['meso'] == failure_before['meso'] - failure_before['fee'], failure_after
            print('[PASS] Failed enhancement preserves stats while spending exactly one slot and fee')

            defense = await evaluate("""(() => {
              const p = game.player;
              const items = p.inventory.equip.filter(item => Number.isFinite(item.upgradeSlots) && item.type !== 'star');
              const select = document.getElementById('enhancement-equipment');
              select.value = String(items.findIndex(item => item.type === 'hat' && item.equipped));
              select.dispatchEvent(new Event('change'));
              return p.defense;
            })()""")
            await click('#btn-enhance-equipment')
            assert await evaluate('game.player.defense') == defense + 2
            print('[PASS] Armor selection and compatible defense scroll work through the UI')

            await click('#btn-shop-open')
            shop_before = await evaluate('game.player.meso')
            await click('#shop-buy-list .shop-item-row:nth-child(2) .btn-buy')
            shop_after = await evaluate("""(() => {
              const item = game.player.inventory.use.find(item => item.id === 'orange_potion');
              return {meso: game.player.meso, count: item?.count, healHp: item?.healHp};
            })()""")
            assert shop_after == {'meso': shop_before - 160, 'count': 1, 'healHp': 150}, shop_after
            await click('#modal-maple-shop .btn-window-close')
            print('[PASS] Real shop purchase retains potion recovery metadata and deducts the canonical price')

            expected = await evaluate("""(() => {
              game.saveProgress();
              const p = game.player;
              return {level: p.level, exp: p.exp, ap: p.ap, sp: p.sp, mp: p.mp, meso: p.meso,
                maxHp: p.maxHp, maxMp: p.maxMp,
                weapon: p.inventory.equip.find(item => item.id === 'wp_wood_sword'),
                hat: p.inventory.equip.find(item => item.id === 'eq_bandana')};
            })()""")
            assert expected['level'] == 3 and expected['exp'] == 10 and expected['mp'] == 0, expected
            screenshot = await suite.send_cmd('Page.captureScreenshot')
            output = Path(__file__).resolve().parent / 'scratch_scripts' / 'rpg_enhancement.png'
            output.parent.mkdir(exist_ok=True)
            output.write_bytes(base64.b64decode(screenshot['result']['data']))
            await reload_game()
            restored = await evaluate("""(() => {
              const p = game.player;
              return {level: p.level, exp: p.exp, ap: p.ap, sp: p.sp, mp: p.mp, meso: p.meso,
                maxHp: p.maxHp, maxMp: p.maxMp,
                weapon: p.inventory.equip.find(item => item.id === 'wp_wood_sword'),
                hat: p.inventory.equip.find(item => item.id === 'eq_bandana')};
            })()""")
            assert restored == expected, {'expected': expected, 'restored': restored}
            print('[PASS] Reload restores EXP/level, zero AP/SP/MP, meso and enhanced equipment exactly')

            await evaluate('game.player.hp = 0; game.saveProgress(); true')
            await reload_game()
            revived = await evaluate("({hp: game.player.hp, maxHp: game.player.maxHp, mp: game.player.mp, maxMp: game.player.maxMp, map: game.map.currentKey})")
            assert revived['hp'] == revived['maxHp'] and revived['mp'] == revived['maxMp'], revived
            assert revived['map'] == 'henesys_town', revived
            assert not suite.errors, suite.errors
            print('[PASS] A death save reload revives safely in town instead of leaving an unusable tombstone')
            print('[PASS] RPG browser flow completed with 0 runtime exceptions')
            print(f'[Artifact] {output}')
        finally:
            if suite.ws:
                await suite.ws.close()
            if suite.proc:
                suite.proc.terminate()
                suite.proc.wait(timeout=10)


if __name__ == '__main__':
    asyncio.run(main())
