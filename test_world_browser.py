"""Live world/raid/viewport regression audit, complementary to pixel anchors."""
import asyncio
import base64
import json
from pathlib import Path

import game_qa_suite as qa


async def main():
    qa.PORT = 9224
    suite = qa.GameQASuite()
    checks = 0
    output = Path(__file__).resolve().parent / 'scratch_scripts/world_qa'
    output.mkdir(parents=True, exist_ok=True)

    async def verify(expr, label):
        nonlocal checks
        result = await suite.send_cmd('Runtime.evaluate', {'expression': expr, 'returnByValue': True})
        assert 'exceptionDetails' not in result.get('result', {}), result
        value = result.get('result', {}).get('result', {}).get('value')
        assert value is True, (label, value)
        checks += 1
        print('[PASS]', label, flush=True)

    try:
        await suite.start()
        await suite.evaluate('game.autoHunt.enabled=false; game.player.invincibleTimer=9999')
        for key, mid in [('henesys_hhg',104040000), ('henesys_town',100000000),
                         ('ant_tunnel',105050000), ('ellinia',101000000), ('zakum_altar',280030000)]:
            await suite.evaluate(f'game.changeMap({json.dumps(key)})')
            for _ in range(100):
                if await suite.evaluate('game.map.terrainLoaded && Boolean(game.map.minimapCanvas)'):
                    break
                await asyncio.sleep(0.05)
            await verify(f'MAP_DATABASE[game.map.currentKey].mapId === {mid} && game.map.terrainLoaded && Boolean(game.map.minimapCanvas)', f'{key}: pinned source and complete terrain/minimap loaded')
            await verify('game.player.onGround && Math.abs(game.player.currentFoothold.getYAtX(game.player.x)-game.player.y)<0.01', f'{key}: arrival on authored floor')
            await verify('game.map.npcs.concat(game.map.portals).every(p=>Boolean(game.map.findFootholdNear(p.x,p.y,0.01)))', f'{key}: NPC and portal feet attached')
            if key in ('henesys_town','ellinia'):
                await verify('game.map.isTown && game.monsters.length===0', f'{key}: no hostile population')
            elif key != 'zakum_altar':
                await verify('game.monsters.length>0 && game.monsters.every(m=>MAP_DATABASE[game.map.currentKey].mobSpawns.some(s=>s.type===m.type))', f'{key}: correct native monster roster')
            screenshot = await suite.send_cmd('Page.captureScreenshot', {'format':'png'})
            (output/f'{key}.png').write_bytes(base64.b64decode(screenshot['result']['data']))

        await verify('game.boss.arms.length===8 && game.boss.getHitBoxes().length===8 && game.boss.hp===100000', 'Zakum: eight attackable arms guard the body')
        await verify("document.getElementById('maple-chat-container').classList.contains('chat-collapsed')", 'Zakum: normal entry collapses chat so it cannot cover the player')
        await verify('Math.abs(game.boss.getGroundY()-game.map.resolvePosition(600,537).y)<0.01', 'Zakum: body ground matches actual altar surface')
        await suite.evaluate("game.boss.arms.forEach(a=>{a.hp=0;a.isAlive=false}); game.boss.takeDamage(100000,false,1,game)")
        await verify("game.boss.isDying() && game.boss.getHitBoxes().length===0", 'Zakum: death enters non-damageable fade')
        await asyncio.sleep(2)
        await verify("game.boss.state==='dead' && !game.monsters.includes(game.boss) && game.drops.some(d=>d.type==='equip' && d.name.includes('자쿰'))", 'Zakum: fade completes before removal and helmet reward appears')
        await suite.evaluate("game.testHelm=game.drops.find(d=>d.type==='equip'); game.testHelm.canPickUp=()=>true; game.pickUpNearbyDrops()")
        await verify("game.player.inventory.equip.some(e=>e.id==='zakum_helm' && e.type==='hat' && e.str===15 && e.upgradeSlots===10)", 'Zakum: helmet pickup enters usable equipment inventory')

        for width,height in [(1280,800),(800,600),(390,844)]:
            await suite.send_cmd('Emulation.setDeviceMetricsOverride', {'width':width,'height':height,'deviceScaleFactor':1,'mobile':False})
            await suite.evaluate("game.changeMap('zakum_altar')")
            await asyncio.sleep(0.15)
            await verify("""(()=>{
              const menu=document.getElementById('top-bar-overlay').getBoundingClientRect();
              const boss=document.getElementById('boss-bar-container').getBoundingClientRect();
              const hud=document.getElementById('maple-hud').getBoundingClientRect();
              return menu.right<=innerWidth-175 && boss.right<=innerWidth-175 && boss.top>=menu.bottom && hud.bottom<=innerHeight+1;
            })()""", f'{width}x{height}: menus/boss HUD/minimap remain separate and HUD visible')
        assert not suite.errors, suite.errors
        print(f'{checks}/{checks} live world checks passed; 0 runtime exceptions', flush=True)
    finally:
        if suite.ws:
            await suite.ws.close()
        if suite.proc:
            suite.proc.terminate()
            suite.proc.wait(timeout=10)


if __name__ == '__main__':
    asyncio.run(main())
