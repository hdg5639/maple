"""Browser entry/navigation and real configured attack-key regression.

No boss HP, part position, player position or map surface is assigned. Each job
first deals damage with ordinary stats; the remaining route uses an explicitly
labelled level-200/high-damage player fixture to keep this gate short. AI moves
the player through native footholds/ropes/jumps, but its attack method is disabled:
every attack comes through CDP keyDown/keyUp and the normal key binding handler.
"""
import asyncio
import base64
import json
import os
from pathlib import Path
import tempfile

import game_qa_suite as qa


async def main():
    qa.PORT = int(os.environ.get('QA_CDP_PORT', '9227'))
    suite = qa.GameQASuite()
    output = Path('scratch_scripts/verification/zakum_playability')
    output.mkdir(parents=True, exist_ok=True)
    report = {'method': __doc__, 'jobs': []}
    with tempfile.TemporaryDirectory(prefix='maple-zakum-play-', ignore_cleanup_errors=True) as profile:
        original = qa.subprocess.Popen
        qa.subprocess.Popen = lambda args, **kwargs: original([*args, f'--user-data-dir={profile}'], **kwargs)
        try:
            await suite.start()
        finally:
            qa.subprocess.Popen = original
        try:
            async def evaluate(expression):
                result = (await suite.send_cmd('Runtime.evaluate', {
                    'expression': expression, 'returnByValue': True, 'awaitPromise': True
                })).get('result', {})
                assert 'exceptionDetails' not in result, result.get('exceptionDetails')
                return result.get('result', {}).get('value')

            async def click(selector):
                if selector != '#game-menu > summary' and await evaluate(f"Boolean(document.querySelector({json.dumps(selector)})?.closest('#game-menu:not([open])'))"):
                    await click('#game-menu > summary')
                point = await evaluate(f"""(() => {{
                  const e = document.querySelector({json.dumps(selector)});
                  if (!e || e.disabled) throw Error('Missing control ' + {json.dumps(selector)});
                  e.scrollIntoView({{block:'nearest'}});
                  const r = e.getBoundingClientRect();
                  if (!r.width || !r.height) throw Error('Hidden control');
                  return {{x:r.left+r.width/2,y:r.top+r.height/2}};
                }})()""")
                for kind in ('mousePressed', 'mouseReleased'):
                    await suite.send_cmd('Input.dispatchMouseEvent', {'type': kind, **point, 'button': 'left', 'clickCount': 1})

            async def attack(code):
                for kind in ('keyDown', 'keyUp'):
                    await suite.send_cmd('Input.dispatchKeyEvent', {'type': kind, 'code': code, 'key': 'Control', 'windowsVirtualKeyCode': 17})

            for index, job in enumerate(('전사', '마법사', '궁수', '도적', '초보자')):
                if index:
                    await evaluate('localStorage.removeItem(StorageManager.KEY); true')
                    await suite.send_cmd('Page.reload', {'ignoreCache': True})
                    await asyncio.sleep(.2)
                    for _ in range(100):
                        if await evaluate("document.readyState === 'complete' && Boolean(window.game?.player)"):
                            break
                        await asyncio.sleep(.05)
                if job != '초보자':
                    await click('#btn-job-select-open')
                    await click(f'.btn-job-choice[data-job="{job}"]')
                await click('#btn-map-travel-open')
                await click('.btn-map-target[data-map="zakum_altar"]')
                entry = await evaluate("""({map:game.map.currentKey,x:game.player.x,y:game.player.y,
                  body:game.boss.hp,arms:game.boss.arms.map(a=>a.hp),job:game.player.job,level:game.player.level})""")
                assert entry['map'] == 'zakum_altar' and entry['job'] == job, entry
                assert entry['level'] == 1, ('baseline inherited another job fixture', entry)
                assert entry['arms'] == [15000] * 8 and entry['body'] == 100000, entry
                # Measure real rendering before deterministic fixed-step advancement.
                fps = await evaluate("""new Promise(resolve => {
                  const g=game, render=g.render.bind(g), frames=[];
                  g.render=function(){frames.push(performance.now());return render();};
                  setTimeout(()=>{g.render=render; resolve((frames.length-1)*1000/(frames.at(-1)-frames[0]));},1800);
                })""")
                assert fps > 45, f'{job}: live RAF below 45 FPS: {fps}'
                await evaluate("""(() => {
                  const g=game,p=g.player,b=g.boss;
                  g.loop=()=>{};
                  window.zakumProbe={wantAttack:false,hits:[],fonts:[],pending:[],ticks:0};
                  const q=zakumProbe,take=b.takeDamage.bind(b),font=g.spawnStaggeredDamage.bind(g);
                  b.takeDamage=function(amount,crit,dir,currentGame,box){
                    const part=box?.type==='arm'?box.target:b;
                    const before=part.hp,body=b.hp,phase=b.phase;
                    const ok=take(amount,crit,dir,currentGame,box),delta=before-part.hp;
                    if(phase==='arms'&&body!==b.hp)throw Error('Shielded body took damage');
                    if(ok){if(!(delta>0))throw Error('Accepted hit did not lower HP');
                      const hit={id:box?.type==='arm'?part.id:'body',before,after:part.hp,delta,
                        x:p.x,y:p.y,onGround:p.onGround,onLadder:p.onLadder,tick:q.ticks};
                      q.hits.push(hit);q.pending.push(hit);}
                    return ok;
                  };
                  g.spawnStaggeredDamage=function(x,y,damage,critical){
                    if(!q.pending.length||!Number.isFinite(x)||!Number.isFinite(y)||!(damage>0))throw Error('Ghost damage font');
                    q.fonts.push({x,y,damage,hit:q.pending.shift()});return font(x,y,damage,critical);
                  };
                  g.autoHunt.config.autoLoot=false;
                  g.autoHunt.triggerAttack=()=>{if(p.attackTimer<=0&&!p.onLadder)q.wantAttack=true;return false;};
                  return true;
                })()""")
                await click('#btn-auto-hunt')
                binding = await evaluate('game.keyConfig.bindings.primarySkill.key')
                async def advance():
                    return await evaluate("""(() => {
                      const q=zakumProbe; q.wantAttack=false;
                      for(let i=0;i<90;i++){
                        if(q.accelerated && game.player.job==='초보자')for(const shot of game.projectiles)shot.damage=100000;
                        game.update(1/60);q.ticks++;
                        if(q.wantAttack||game.boss.phase!=='arms'||game.player.hp<=0)break;
                      }
                      game.render();
                      return {want:q.wantAttack,phase:game.boss.phase,hp:game.player.hp,ticks:q.ticks,
                        hits:q.hits,fonts:q.fonts,arms:game.boss.arms.map(a=>a.hp),x:game.player.x,y:game.player.y,
                        target:game.autoHunt.bossTargetPlan?.part.id,queue:game.autoHunt.commandQueue,
                        foothold:game.player.currentFoothold?.id,vx:game.player.vx,vy:game.player.vy};
                    })()""")

                state = None
                for _ in range(100):
                    state = await advance()
                    assert state['hp'] > 0, (job, 'baseline died', state)
                    if state['hits']:
                        break
                    if state['want']:
                        await attack(binding)
                assert state['hits'], (job, 'ordinary-stat attacks never reduced arm HP', state)
                baseline = state['hits'][0]
                await evaluate("""(() => {
                  const p=game.player;
                  p.level=200;p.calcDerivedStats();p.hp=p.maxHp;p.mp=p.maxMp;zakumProbe.accelerated=true;
                  for(const stat of ['minAtk','maxAtk'])Object.defineProperty(p,stat,{configurable:true,get:()=>100000,set(){}});
                  return true;
                })()""")
                for _ in range(600):
                    state = await advance()
                    assert state['hp'] > 0, (job, 'route died', state)
                    if state['phase'] != 'arms':
                        break
                    if state['want']:
                        await attack(binding)
                ids = sorted(set(hit['id'] for hit in state['hits'] if isinstance(hit['id'], int)))
                assert ids == list(range(1, 9)), (job, 'not all real arm HP changed', state)
                assert state['arms'] == [0] * 8 and state['phase'] in ('body', 'dying'), state
                assert len(state['fonts']) == len(state['hits']), (job, 'damage/font mismatch', state)
                screenshot = await suite.send_cmd('Page.captureScreenshot', {'format': 'png'})
                (output / f'{index}_all_arms.png').write_bytes(base64.b64decode(screenshot['result']['data']))
                report['jobs'].append({'job': job, 'entry': entry, 'liveFps': round(fps, 1),
                    'ordinaryStatsFirstHit': baseline, 'acceleratedDamageTraversal': state})
                print(f'PASS {job}: ordinary-stat hit + configured Ctrl inputs reduced all 8 arms; {state["ticks"]} ticks; {fps:.1f} FPS', flush=True)
            assert not suite.errors, suite.errors
            report['runtimeErrors'] = len(suite.errors)
            (output / 'report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        finally:
            if suite.ws:
                await suite.ws.close()
            if suite.proc:
                suite.proc.terminate()


if __name__ == '__main__':
    asyncio.run(main())
