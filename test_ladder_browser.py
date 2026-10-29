"""Real CDP key input through the running game's fixed-step loop."""
import asyncio
import base64
import time
from pathlib import Path

from game_qa_suite import GameQASuite


async def main():
    suite = GameQASuite()
    checks = 0

    async def key(code, down=True):
        key_name = {'AltLeft': 'Alt', 'ArrowUp': 'ArrowUp', 'ArrowDown': 'ArrowDown',
                    'ArrowLeft': 'ArrowLeft', 'ArrowRight': 'ArrowRight'}[code]
        await suite.send_cmd('Input.dispatchKeyEvent', {
            'type': 'keyDown' if down else 'keyUp', 'code': code, 'key': key_name,
            'windowsVirtualKeyCode': {'AltLeft': 18, 'ArrowUp': 38, 'ArrowDown': 40,
                                      'ArrowLeft': 37, 'ArrowRight': 39}[code]
        })

    async def expect(expression, label):
        nonlocal checks
        result = await suite.evaluate(expression)
        assert result is True, f'{label}: {result}'
        checks += 1
        print(f'[PASS] {label}', flush=True)

    async def wait_for(expression, label, timeout=5):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if await suite.evaluate(expression):
                return
            await asyncio.sleep(0.05)
        state = await suite.evaluate('({x: game.player.x, y: game.player.y, vy: game.player.vy, onLadder: game.player.onLadder, onGround: game.player.onGround})')
        raise AssertionError(f'{label}: timed out: {state}')

    async def prepare(map_key='henesys_hhg', ladder_index=3):
        result = await suite.evaluate(f"""(() => {{
          const g = game;
          g.changeMap('{map_key}');
          g.resetInputs();
          document.activeElement?.blur();
          g.keyConfig.applyPreset('classic');
          g.autoHunt.enabled = false;
          g.monsters = [];
          g.spawnMonster = () => {{}};
          const p = g.player;
          const l = g.map.ladders[{ladder_index}];
          p.x = l.x; p.y = l.bottom; p.vx = 0; p.vy = 0;
          p.ladderCooldown = 0; p.onLadder = false; p.currentLadder = null;
          p.attackTimer = 0; p.weakenedTimer = 0; p.invincibleTimer = 999;
          p.currentFoothold = Physics.findLadderFoothold(g.map, l, 'bottom');
          p.onGround = Boolean(p.currentFoothold);
          g.testLadder = l;
          g.testTop = Physics.findLadderFoothold(g.map, l, 'top');
          g.testBottom = Physics.findLadderFoothold(g.map, l, 'bottom');
          g.snapCameraToPlayer();
          return true;
        }})()""")
        assert result, 'Failed to prepare browser fixture'

    try:
        await suite.start()
        await prepare()
        await key('ArrowUp')
        await wait_for('game.player.onLadder', 'grab rope')
        await expect('!game.player.onGround && game.player.currentFoothold === null', 'real Up input releases the starting floor')
        await wait_for('game.player.onGround && game.player.currentFoothold === game.testTop', 'reach upper platform')
        await key('ArrowUp', False)
        await asyncio.sleep(0.4)
        await expect('!game.player.onLadder && game.player.onGround && Math.abs(game.player.y - 1020) < 0.001', 'rope top remains at Y=1020 instead of warping to Y=1320')
        screenshot = await suite.send_cmd('Page.captureScreenshot')
        output = Path(__file__).resolve().parent / 'scratch_scripts' / 'rope_top_fixed.png'
        output.parent.mkdir(exist_ok=True)
        output.write_bytes(base64.b64decode(screenshot['result']['data']))

        await key('ArrowDown')
        await wait_for('game.player.onLadder', 'descend rope')
        await wait_for('game.player.onGround && game.player.currentFoothold === game.testBottom', 'reach bottom')
        await key('ArrowDown', False)
        await expect('!game.player.onLadder && Math.abs(game.player.y - 1320) < 0.001', 'real Down input exits exactly at the rope bottom')

        await prepare()
        await key('ArrowUp')
        await asyncio.sleep(0.4)
        await key('ArrowUp', False)
        await suite.evaluate('game.testY = game.player.y; game.testX = game.player.x')
        await key('AltLeft')
        await key('AltLeft', False)
        await asyncio.sleep(0.2)
        await expect('game.player.onLadder && game.player.y === game.testY', 'Jump alone keeps hanging without falling')

        for code, direction in [('ArrowRight', 1), ('ArrowLeft', -1)]:
            await prepare()
            await key('ArrowUp')
            await asyncio.sleep(0.4)
            await key('ArrowUp', False)
            await suite.evaluate('game.testY = game.player.y; game.testX = game.player.x')
            await key(code)
            await key('AltLeft')
            await key('AltLeft', False)
            await asyncio.sleep(0.12)
            await expect(f'!game.player.onLadder && !game.player.onGround && game.player.vy < 0 && game.player.y < game.testY - 10 && (game.player.x - game.testX) * {direction} > 10', f'{code} + Jump rises and kicks away with no floor snap')
            await key(code, False)
            await suite.evaluate('game.testX = game.player.x')
            await asyncio.sleep(0.08)
            await expect(f'(game.player.x - game.testX) * {direction} > 5', f'{code} release preserves airborne momentum')

        for map_key in ['henesys_town', 'ant_tunnel', 'ellinia', 'zakum_altar']:
            await prepare(map_key, 0)
            await key('ArrowUp')
            await wait_for('game.player.onGround && game.player.currentFoothold === game.testTop', f'{map_key} upper exit')
            await key('ArrowUp', False)
            await expect('!game.player.onLadder && game.player.onGround', f'{map_key} ladder works through actual browser key input')

        await expect('game.player.x <= game.map.width', 'map boundaries contain the active ladder')
        assert not suite.errors, suite.errors
        print(f'{checks}/{checks} browser physics checks passed; 0 runtime exceptions', flush=True)
        print(f'[Artifact] {output}', flush=True)
    finally:
        if suite.ws:
            await suite.ws.close()
        if suite.proc:
            suite.proc.terminate()
            suite.proc.wait(timeout=10)


if __name__ == '__main__':
    asyncio.run(main())
