"""Browser regressions for keyboard dispatch, focus, ladder jumps and HUD bounds.

Start python server.py --no-browser, then run python test_input_regressions.py.
"""
import asyncio

from game_qa_suite import GameQASuite


CHECKS = r"""(() => {
  const g = window.game;
  const p = g.player;
  const results = [];
  const check = (name, run) => {
    try {
      g.resetInputs();
      document.activeElement?.blur();
      g.keyConfig.applyPreset('classic');
      run();
      results.push({name, passed: true});
    } catch (error) {
      results.push({name, passed: false, error: error.message});
    }
  };
  const expect = (value, message) => { if (!value) throw new Error(message); };
  const key = (code, down = true, target = document.body, repeat = false) =>
    target.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {
      code, bubbles: true, cancelable: true, repeat
    }));
  const original = {
    jump: p.jump, dropThrough: p.dropThrough, useSkill: p.useSkill,
    primaryAttack: p.primaryAttack, toggle: g.autoHunt.toggle,
    toggleWindow: g.ui.toggleWindow, showNpcDialog: g.ui.showNpcDialog,
    spawnBoss: g.spawnBoss
  };
  let jumps = 0, drops = 0, attacks = 0, toggles = 0, windows = 0, dialogs = 0;
  let skills = [];
  p.jump = () => jumps++;
  p.dropThrough = () => drops++;
  p.primaryAttack = () => attacks++;
  p.useSkill = (id) => skills.push(id);
  g.autoHunt.toggle = () => toggles++;
  g.ui.toggleWindow = () => windows++;
  g.ui.showNpcDialog = () => dialogs++;
  try {
    check('one potion per key press', () => {
      p.hp = 1;
      const potion = p.inventory.use.find(item => item.id === 'red_potion');
      potion.count = 10;
      key('Digit1');
      key('Digit1', false);
      expect(potion.count === 9, `used ${10 - potion.count} potions`);
    });
    check('one boss summon per key press', () => {
      let summons = 0;
      g.spawnBoss = () => summons++;
      key('KeyB');
      key('KeyB', false);
      expect(summons === 1, `summoned ${summons} bosses`);
    });
    for (const tag of ['input', 'textarea', 'select', 'div']) {
      check(`editing ${tag} blocks game and UI actions`, () => {
        const input = document.createElement(tag);
        if (tag === 'div') input.contentEditable = 'true';
        document.body.appendChild(input);
        input.focus();
        const before = [jumps, attacks, toggles, windows, skills.length].join();
        const potion = p.inventory.use.find(item => item.id === 'red_potion');
        const count = potion.count;
        try {
          for (const code of ['ArrowLeft', 'AltLeft', 'ControlLeft', 'KeyR', 'KeyI', 'KeyQ', 'Digit1']) {
            key(code, true, input);
          }
          expect(!g.getHorizontalDirection(), 'typing started movement');
          expect(before === [jumps, attacks, toggles, windows, skills.length].join(), 'typing triggered an action');
          expect(potion.count === count, 'typing consumed a potion');
        } finally {
          input.remove();
        }
      });
    }
    check('focus transfer releases a held movement key', () => {
      key('ArrowRight');
      expect(g.getHorizontalDirection() === 1, 'movement did not start');
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      try {
        expect(g.getHorizontalDirection() === 0 && p.vx === 0, 'movement survived text focus');
        key('ArrowRight', false, input);
      } finally { input.remove(); }
    });
    check('last pressed direction wins despite key repeat', () => {
      key('ArrowLeft');
      expect(g.getHorizontalDirection() === -1, 'left did not start');
      key('ArrowRight');
      key('ArrowLeft', true, document.body, true);
      expect(g.getHorizontalDirection() === 1, 'repeat stole direction priority');
      key('ArrowRight', false);
      expect(g.getHorizontalDirection() === -1, 'held left did not resume');
      key('ArrowLeft', false);
      expect(g.getHorizontalDirection() === 0 && p.vx === 0, 'release did not stop');
    });
    check('blur clears keyboard and touch input', () => {
      key('ArrowRight');
      g.touchActions.climbUp = true;
      window.dispatchEvent(new Event('blur'));
      expect(!g.getHorizontalDirection() && !g.isActionPressed('climbUp'), 'input survived blur');
    });
    check('WASD jump does not interact with a nearby NPC', () => {
      g.keyConfig.applyPreset('wasd');
      const npc = g.map.npcs[0];
      p.x = npc.x;
      p.y = npc.y;
      const before = [jumps, dialogs];
      key('Space');
      expect(jumps === before[0] + 1 && dialogs === before[1], 'jump was dispatched as interact');
    });
    check('WASD skill keys do not open inventory or auto-hunt windows', () => {
      g.keyConfig.applyPreset('wasd');
      const beforeWindows = windows;
      const beforeSkills = skills.length;
      const expectedSkills = Number(Boolean(g.getQuickslotSkill(5))) + Number(Boolean(g.getQuickslotSkill(6)));
      key('KeyI');
      key('KeyO');
      expect(windows === beforeWindows && skills.length === beforeSkills + expectedSkills, 'UI also handled bound skill keys');
    });
    check('WASD attack does not cast a legacy skill and R only casts its binding', () => {
      g.keyConfig.applyPreset('wasd');
      const beforeSkills = skills.length;
      const beforeToggles = toggles;
      const beforeAttacks = attacks;
      key('KeyJ');
      key('KeyR');
      expect(attacks === beforeAttacks + 1 && skills.length === beforeSkills + 1, 'attack or skill dispatch duplicated');
      expect(toggles === beforeToggles, 'skill key also toggled auto-hunt');
    });
    check('remapping removes the old key and resolves occupied keys', () => {
      g.keyConfig.bindKey('moveLeft', 'KeyA');
      expect(g.keyConfig.getAction('KeyA') === 'moveLeft', 'occupied key retained old action');
      expect(g.keyConfig.bindings.skill5.key === null, 'old action still claims key');
      key('ArrowLeft');
      expect(!g.getHorizontalDirection(), 'old movement key still moves');
      key('KeyA');
      expect(g.getHorizontalDirection() === -1, 'new movement key does not move');
    });
    check('modifier aliases resolve to one action and stay held independently', () => {
      g.keyConfig.bindKey('moveRight', 'ShiftRight');
      expect(g.keyConfig.bindings.skill1.key === null, 'left shift skill still bound');
      key('ShiftLeft');
      key('ShiftRight');
      key('ShiftRight', false);
      expect(g.getHorizontalDirection() === 1, 'releasing one alias released both');
      key('ShiftLeft', false);
      expect(!g.getHorizontalDirection(), 'modifier remained stuck');
    });
    check('custom climb-down plus jump drops through', () => {
      g.keyConfig.bindKey('climbDown', 'KeyV');
      const before = [drops, jumps];
      key('KeyV');
      key('AltRight');
      expect(drops === before[0] + 1 && jumps === before[1], 'custom down-jump failed');
    });
    check('releasing a modifier restores the last remaining key priority', () => {
      g.keyConfig.bindKey('moveLeft', 'ShiftLeft');
      key('ShiftLeft');
      key('ArrowRight');
      key('ShiftRight');
      key('ShiftRight', false);
      expect(g.getHorizontalDirection() === 1, 'released modifier retained priority');
    });
    check('ladder kick follows custom direction and last-key priority', () => {
      g.keyConfig.bindKey('moveLeft', 'KeyV');
      g.keyConfig.bindKey('moveRight', 'KeyN');
      p.jump = original.jump;
      key('KeyN');
      key('KeyV');
      p.onLadder = true;
      p.currentLadder = g.map.ladders[0];
      key('AltLeft');
      expect(!p.onLadder && p.vx === -3.5 && p.facing === 'left', 'ladder kick ignored custom left priority');
      p.jump = () => jumps++;
    });
    check('touch movement is independent of remapped arrow keys', () => {
      g.keyConfig.applyPreset('wasd');
      const rect = g.canvas.getBoundingClientRect();
      const touch = new Touch({identifier: 1, target: g.canvas,
        clientX: rect.left + rect.width * 0.9, clientY: rect.top + 100});
      g.canvas.dispatchEvent(new TouchEvent('touchstart', {touches: [touch]}));
      expect(g.getHorizontalDirection() === 1, 'touch did not move right');
      const before = [jumps, dialogs];
      g.canvas.dispatchEvent(new TouchEvent('touchcancel', {changedTouches: [touch]}));
      expect(!g.getHorizontalDirection(), 'cancelled touch remained held');
      expect(jumps === before[0] && dialogs === before[1], 'cancelled touch triggered a tap action');
    });
  } finally {
    Object.assign(p, {jump: original.jump, dropThrough: original.dropThrough,
      useSkill: original.useSkill, primaryAttack: original.primaryAttack});
    g.autoHunt.toggle = original.toggle;
    g.ui.toggleWindow = original.toggleWindow;
    g.ui.showNpcDialog = original.showNpcDialog;
    g.spawnBoss = original.spawnBoss;
    g.keyConfig.applyPreset('classic');
    g.resetInputs();
  }
  return results;
})()"""


async def main():
    suite = GameQASuite()
    try:
        await suite.start()
        # Game state is reset after these synthetic, synchronous browser events.
        results = await suite.evaluate(CHECKS)
        assert results, 'Regression script failed to execute'
        for width, height in [(1280, 800), (1024, 768), (800, 600), (390, 844)]:
            await suite.send_cmd('Emulation.setDeviceMetricsOverride', {
                'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': False
            })
            await asyncio.sleep(0.05)
            layout = await suite.evaluate(r"""(() => {
              const hud = document.getElementById('maple-hud');
              const bounds = hud.getBoundingClientRect();
              const failures = [];
              if (bounds.top < 0 || bounds.bottom > innerHeight + 1) failures.push('HUD outside viewport');
              for (const element of hud.querySelectorAll('.quickslot, .hud-menu-btn')) {
                element.scrollIntoView({block: 'nearest', inline: 'nearest'});
                const rect = element.getBoundingClientRect();
                if (rect.top < bounds.top || rect.bottom > bounds.bottom + 1 || rect.bottom > innerHeight + 1) {
                  failures.push(`${element.id}: vertical clipping`);
                }
                if (rect.left < -1 || rect.right > innerWidth + 1) {
                  failures.push(`${element.id}: cannot scroll into view`);
                }
              }
              hud.scrollLeft = 0;
              const canvas = document.getElementById('game-canvas').getBoundingClientRect();
              if (canvas.bottom > bounds.top + 1) failures.push('canvas overlaps HUD');
              return failures;
            })()""")
            assert isinstance(layout, list), 'HUD geometry check failed to execute'
            results.append({'name': f'HUD controls remain accessible at {width}x{height}',
                            'passed': not layout, 'error': '; '.join(layout)})
        for result in results:
            print(f"[{'PASS' if result['passed'] else 'FAIL'}] {result['name']}"
                  + (f": {result['error']}" if not result['passed'] else ''))
        failures = [result for result in results if not result['passed']]
        assert not failures, f'{len(failures)}/{len(results)} regressions failed'
        assert not suite.errors, f'{len(suite.errors)} browser runtime exceptions'
        print(f'{len(results)}/{len(results)} passed; 0 browser runtime exceptions')
    finally:
        if suite.ws:
            await suite.ws.close()
        if suite.proc:
            suite.proc.terminate()
            suite.proc.wait(timeout=10)


if __name__ == '__main__':
    asyncio.run(main())
