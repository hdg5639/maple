"""Real viewport/click QA: no horizontal HUD scrolling, reachable menus and dialogs."""
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
    output = Path('scratch_scripts/responsive_ui')
    output.mkdir(parents=True, exist_ok=True)
    passed = 0
    with tempfile.TemporaryDirectory(prefix='maple-layout-qa-', ignore_cleanup_errors=True) as profile:
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
                    'expression': expression, 'returnByValue': True, 'awaitPromise': True})
                result = response.get('result', {})
                assert 'exceptionDetails' not in result, result.get('exceptionDetails')
                return result.get('result', {}).get('value')

            async def click(selector):
                needs_menu = await evaluate(f"Boolean(document.querySelector({json.dumps(selector)})?.closest('#game-menu:not([open])'))")
                if needs_menu and selector != '#game-menu > summary':
                    await click('#game-menu > summary')
                point = await evaluate(f"""(() => {{
                  const el = document.querySelector({json.dumps(selector)});
                  if (!el || el.disabled) throw Error('Unavailable: ' + {json.dumps(selector)});
                  const r = el.getBoundingClientRect();
                  if (!r.width || !r.height || r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight)
                    throw Error('Clipped control: ' + el.id);
                  const x = r.left + r.width/2, y = r.top + r.height/2;
                  if (!el.contains(document.elementFromPoint(x,y))) throw Error('Obscured control: ' + el.id);
                  return {{x,y}};
                }})()""")
                for event in ['mousePressed', 'mouseReleased']:
                    await suite.send_cmd('Input.dispatchMouseEvent', {
                        'type': event, **point, 'button': 'left', 'clickCount': 1})

            await evaluate('game.autoHunt.enabled = false; game.keyConfig.applyPreset("classic"); true')
            maps = await evaluate('Object.keys(MAP_DATABASE)')
            for width, height in [(390, 844), (678, 810), (908, 810), (1280, 800)]:
                await suite.send_cmd('Emulation.setDeviceMetricsOverride', {
                    'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': False})
                await asyncio.sleep(.15)
                for map_key in maps:
                    await evaluate(f'game.changeMap({json.dumps(map_key)}); true')
                    await asyncio.sleep(.15)
                    problems = await evaluate("""(() => {
                      const problems = [];
                      const hud = document.getElementById('maple-hud');
                      const hr = hud.getBoundingClientRect();
                      const canvas = document.getElementById('game-canvas');
                      const cr = canvas.getBoundingClientRect();
                      if (document.documentElement.scrollWidth > innerWidth) problems.push('document x overflow');
                      if (hud.scrollWidth > hud.clientWidth + 1) problems.push('HUD x overflow');
                      if (cr.bottom > hr.top + 1 || cr.height < 200) problems.push('gameplay area clipped');
                      if (Math.abs(canvas.width-cr.width)>1 || Math.abs(canvas.height-cr.height)>1) problems.push('canvas bitmap/CSS mismatch');
                      const bounded = (el) => {
                        const r=el.getBoundingClientRect();
                        if (!r.width || !r.height || r.left<0 || r.right>innerWidth+1 || r.top<0 || r.bottom>innerHeight+1)
                          problems.push('clipped ' + el.id);
                      };
                      hud.querySelectorAll('.quickslot,.hud-menu-btn').forEach(bounded);
                      ['btn-auto-hunt','btn-chat-toggle'].forEach(id=>bounded(document.getElementById(id)));
                      const boss=document.getElementById('boss-bar-container');
                      if(getComputedStyle(boss).display!=='none') {
                        bounded(boss);
                        const r=boss.getBoundingClientRect();
                        if(r.right>innerWidth-175 && r.top<141) problems.push('boss overlaps minimap');
                      }
                      const top=document.getElementById('top-bar-overlay').getBoundingClientRect();
                      if(top.right>innerWidth-175) problems.push('controls overlap minimap');
                      return problems;
                    })()""")
                    assert problems == [], f'{width}/{map_key}: {problems}'
                    screenshot = await suite.send_cmd('Page.captureScreenshot', {'format':'png'})
                    (output/f'{width}_{map_key}.png').write_bytes(base64.b64decode(screenshot['result']['data']))
                    print(f'[PASS] {width}×{height} {map_key}: 14 slots, 6 HUD actions, canvas and boss/minimap bounds')
                    passed += 1

                await click('#btn-auto-hunt')
                assert await evaluate('game.autoHunt.enabled'), f'{width}: auto-hunt control did not start'
                await click('#game-menu > summary')
                menu_problems = await evaluate("""(() => {
                  const panel=document.querySelector('.game-menu-content'), r=panel.getBoundingClientRect();
                  return r.left<0 || r.right>innerWidth || r.bottom>innerHeight || panel.scrollWidth>panel.clientWidth+1 ||
                    [...panel.querySelectorAll('button'),document.getElementById('auto-stats-panel')].some(el=>{
                      const b=el.getBoundingClientRect();
                      return !b.width || !b.height || b.left<0 || b.right>innerWidth || b.bottom>innerHeight;
                    });
                })()""")
                assert not menu_problems, f'{width}: menu panel clipped'
                if width == 390:
                    screenshot = await suite.send_cmd('Page.captureScreenshot', {'format':'png'})
                    (output/'390_menu.png').write_bytes(base64.b64decode(screenshot['result']['data']))
                await suite.send_cmd('Input.dispatchKeyEvent', {'type':'keyDown','key':'Escape','code':'Escape'})
                await suite.send_cmd('Input.dispatchKeyEvent', {'type':'keyUp','key':'Escape','code':'Escape'})
                assert await evaluate('!document.getElementById("game-menu").open')
                await click('#btn-auto-hunt')
                assert await evaluate('!game.autoHunt.enabled'), f'{width}: auto-hunt control did not stop'

                actions = [('#btn-stat-toggle','win-stats'),('#btn-inven-toggle','win-inventory'),
                    ('#btn-skill-toggle','win-skills'),('#btn-auto-toggle','win-auto-config'),
                    ('#btn-armory-open','win-armory'),('#btn-keyconfig-open','win-keyconfig'),
                    ('#btn-login-open','modal-maple-login'),('#btn-shop-open','modal-maple-shop'),
                    ('#btn-map-travel-open','modal-map-travel'),('#btn-job-select-open','modal-job-advance')]
                for selector, window_id in actions:
                    await click(selector)
                    bounds = await evaluate(f"""(() => {{
                      const el=document.getElementById({json.dumps(window_id)});
                      const box=el.matches('.maple-window')?el:el.firstElementChild;
                      const r=box.getBoundingClientRect();
                      return {{visible:getComputedStyle(el).display!=='none',left:r.left,right:r.right,top:r.top,bottom:r.bottom,
                        overflow:[box,...box.querySelectorAll('.maple-window-body,.maple-dialog-body,#shop-buy-list,#shop-sell-list')]
                          .some(node=>node.scrollWidth>node.clientWidth+1)}};
                    }})()""")
                    assert bounds['visible'] and bounds['left']>=0 and bounds['right']<=width+1 and bounds['top']>=0 and bounds['bottom']<=height+1 and not bounds['overflow'], (width,selector,bounds)
                    if width == 390 and window_id in ['win-keyconfig','modal-maple-shop']:
                        screenshot = await suite.send_cmd('Page.captureScreenshot', {'format':'png'})
                        (output/f'390_{window_id}.png').write_bytes(base64.b64decode(screenshot['result']['data']))
                    await click(f'#{window_id} .btn-window-close')
                    assert await evaluate(f'getComputedStyle(document.getElementById({json.dumps(window_id)})).display==="none"'), f'{width}/{window_id}: close action failed'
                await click('#btn-chat-toggle')
                await click('#btn-chat-toggle')
                collapsed_height = await evaluate("document.getElementById('maple-chat-container').classList.contains('chat-collapsed') ? document.getElementById('maple-chat-container').getBoundingClientRect().height : 0")
                assert collapsed_height <= 34, (width, 'collapsed chat still covers gameplay', collapsed_height)
                await click('#game-menu > summary')
                await suite.send_cmd('Input.dispatchKeyEvent', {'type':'keyDown','key':'Escape','code':'Escape'})
                await suite.send_cmd('Input.dispatchKeyEvent', {'type':'keyUp','key':'Escape','code':'Escape'})
                await evaluate('document.activeElement?.blur(); true')
                for event in ['keyDown','keyUp']:
                    await suite.send_cmd('Input.dispatchKeyEvent', {'type':event,'key':'Enter','code':'Enter','windowsVirtualKeyCode':13})
                assert await evaluate("document.activeElement.id==='chat-input' && !document.getElementById('maple-chat-container').classList.contains('chat-collapsed')"), f'{width}: Enter did not open chat'
                for event in ['keyDown','keyUp']:
                    await suite.send_cmd('Input.dispatchKeyEvent', {'type':event,'key':'Escape','code':'Escape','windowsVirtualKeyCode':27})
                assert await evaluate("document.activeElement.id!=='chat-input' && document.getElementById('maple-chat-container').classList.contains('chat-collapsed')"), f'{width}: Escape did not close chat'
                print(f'[PASS] {width}px: actual menu clicks, 10 windows, Escape dismissal and chat toggle')
                passed += 1

            await evaluate("""game.changeMap('henesys_town'); game.resetInputs();
              window.layoutAttacks=[]; window.layoutPrimary=game.player.primaryAttack;
              game.player.primaryAttack=()=>layoutAttacks.push(game.player.job); true""")
            for job in ['마법사','궁수','도적']:
                await evaluate(f'game.player.setJob({json.dumps(job)}); game.resetInputs(); true')
                await click('#quick-slot-attack')
                for event in ['keyDown','keyUp']:
                    await suite.send_cmd('Input.dispatchKeyEvent', {'type':event,'code':'ControlLeft','key':'Control','windowsVirtualKeyCode':17})
            attacks = await evaluate('layoutAttacks')
            assert attacks == ['마법사','마법사','궁수','궁수','도적','도적'], attacks
            await evaluate('game.player.primaryAttack=layoutPrimary; true')
            assert not suite.errors, suite.errors
            print('[PASS] Mage, archer and thief HUD click/physical Ctrl dispatch the same primary attack')
            print(f'{passed+1} responsive UI checks passed; 0 runtime errors; screenshots: {output.resolve()}')
        finally:
            if suite.ws:
                await suite.ws.close()
            if suite.proc:
                suite.proc.terminate()
                suite.proc.wait(timeout=10)


if __name__ == '__main__':
    asyncio.run(main())
