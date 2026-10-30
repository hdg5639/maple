"""Pixel-level sprite contact regression. Requires the local server on port 8000."""
import asyncio
import base64
import json
import os
from pathlib import Path

import game_qa_suite as qa_module
from game_qa_suite import GameQASuite


PIXEL_CHECK = r"""(() => {
  const renderer = window.sprites;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  const failures = [];
  const catalog = window.MONSTER_ASSETS || {};
  const expectedKeys = new Set();
  for (const spritePath of Object.keys(window.SPRITE_FOOT_Y || {})) {
    const match = spritePath.match(/^assets\/player\/([^/]+)\/([^/]+)\.png$/);
    if (match) expectedKeys.add(`player_${match[1]}_${match[2]}`);
  }
  for (const type of Object.keys(renderer.npcs)) expectedKeys.add(`npc_${type}`);
  for (const [type, record] of Object.entries(catalog)) {
    const family = renderer.monsterSprites[type];
    if (!family) { failures.push(`${type}: catalog family was not loaded`); continue; }
    for (const [action, count] of Object.entries(record.frames)) {
      if (family[action]?.length !== count) failures.push(`${type}/${action}: catalog frame count mismatch`);
      for (let index = 0; index < count; index++) {
        const key = `mob_${type}_${action}_${index}`;
        const spritePath = `assets/monsters/${type}/${action}_${index}.png`;
        expectedKeys.add(key);
        if (window.SPRITE_FOOT_Y?.[spritePath] === undefined) failures.push(`${key}: missing foot metadata`);
        if (!renderer.images[key]?.src.endsWith(spritePath)) failures.push(`${key}: wrong source image family`);
      }
    }
  }
  for (const type of Object.keys(renderer.monsterSprites)) {
    if (!catalog[type]) failures.push(`${type}: renderer family absent from catalog`);
  }
  for (const [type, expectedId] of [['zombie_mushroom', 2230101], ['horny_mushroom', 2110200]]) {
    if (catalog[type]?.mobId !== expectedId || !catalog[type]?.source.endsWith('/' + expectedId)) {
      failures.push(`${type}: wrong classic monster identity`);
    }
  }
  let checked = 0;
  for (const [key, sprite] of Object.entries(renderer.images)) {
    if (!key.startsWith('player_') && !key.startsWith('mob_') && !key.startsWith('npc_')) continue;
    if (!expectedKeys.has(key)) failures.push(`${key}: unexpected sprite outside the asset catalog`);
    if (!sprite.complete || !sprite.naturalWidth) { failures.push(`${key}: not loaded`); continue; }
    for (const facing of [-1, 1]) {
      ctx.clearRect(0, 0, 512, 512);
      ctx.save();
      ctx.translate(256, 256);
      ctx.scale(facing, 1);
      renderer.drawFootAlignedSprite(ctx, sprite);
      ctx.restore();
      const pixels = ctx.getImageData(0, 0, 512, 512).data;
      let bottom = -1, largestSize = 0;
      const seen = new Uint8Array(512 * 512);
      for (let index = 0; index < seen.length; index++) {
        if (seen[index] || !pixels[index * 4 + 3]) continue;
        const stack = [index];
        seen[index] = 1;
        let size = 0, componentBottom = -1;
        while (stack.length) {
          const point = stack.pop();
          const x = point % 512, y = Math.floor(point / 512);
          size++;
          componentBottom = Math.max(componentBottom, y);
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= 512 || ny < 0 || ny >= 512) continue;
            const neighbor = ny * 512 + nx;
            if (!seen[neighbor] && pixels[neighbor * 4 + 3]) {
              seen[neighbor] = 1;
              stack.push(neighbor);
            }
          }
        }
        // Dying sprites are fragments rather than a single live body.
        if (key.includes('_die1_')) bottom = Math.max(bottom, componentBottom);
        else if (size > largestSize) {
          largestSize = size;
          bottom = componentBottom;
        }
      }
      if (bottom !== 255) failures.push(`${key}: foot pixel ends at ${bottom}, expected 255`);
      checked++;
    }
  }
  for (const key of expectedKeys) if (!renderer.images[key]) failures.push(`${key}: catalog frame was skipped`);
  // Verify the actual player/monster draw paths use that anchor, including air/death.
  const original = renderer.drawFootAlignedSprite;
  let draws = 0;
  renderer.drawFootAlignedSprite = function(...args) { draws++; return original.apply(this, args); };
  try {
    const jobNames = {beginner: '초보자', warrior: '전사', magician: '마법사', bowman: '궁수', thief: '도적'};
    for (const jobKey of Object.keys(renderer.playerSprites)) {
      const job = jobNames[jobKey];
      if (!job) { failures.push(`${jobKey}: missing playable job mapping`); continue; }
      const player = new Player(256, 256);
      player.job = job;
      player.onGround = true;
      for (const state of ['stand', 'walk', 'attack', 'jump', 'ladder']) {
        player.vx = state === 'walk' ? 1 : 0;
        player.attackTimer = state === 'attack' ? player.attackDuration : 0;
        player.onGround = state !== 'jump';
        player.onLadder = state === 'ladder';
        const before = draws;
        renderer.drawPlayer(ctx, player);
        if (draws !== before + 1) failures.push(`${job}/${state}: foot anchor bypassed`);
      }
    }
    for (const type of Object.keys(catalog)) {
      const monster = new Monster(type, 256, 256);
      for (const state of ['stand', 'move', 'hit', 'dying']) {
        monster.vx = state === 'move' ? 1 : 0;
        monster.hitstopTimer = state === 'hit' ? 0.08 : 0;
        monster.state = state === 'dying' ? 'dying' : 'alive';
        monster.dyingTimer = monster.dyingDuration;
        const before = draws;
        renderer.drawMonster(ctx, monster);
        if (draws !== before + 1) failures.push(`${type}/${state}: foot anchor bypassed`);
      }
    }
    for (const type of Object.keys(renderer.npcs)) {
      const before = draws;
      renderer.drawNPC(ctx, {type, x:256, y:256, name:type});
      if (draws !== before + 1) failures.push(`${type}: NPC foot anchor bypassed`);
    }
  } finally { renderer.drawFootAlignedSprite = original; }
  // Offset belongs to the terrain image, leaving footholds and generated platforms intact.
  const terrainDraws = [];
  const originalMinimap = renderer.minimapImg;
  for (const key of ['henesys_hhg', 'henesys_town', 'ant_tunnel', 'ellinia', 'zakum_altar']) {
    const map = new GameMap(key);
    map.terrainLoaded = true;
    Object.defineProperty(map.terrainImg, 'complete', {value: true});
    map.drawSkyAndFarBackdrop = () => {};
    map.drawElliniaProceduralTerrain = () => {};
    map.drawZakumAltarPlatforms = () => {};
    map.drawLaddersAndRopes = () => {};
    map.drawPortals = () => {};
    const oldDraw = ctx.drawImage;
    ctx.drawImage = (image, x, y) => { if (image === map.terrainImg) terrainDraws.push({key, x, y}); };
    try { map.draw(ctx, {x: 0, y: 0, width: 512, height: 512}); }
    finally { ctx.drawImage = oldDraw; }
    const draw = terrainDraws[terrainDraws.length - 1];
    const expectedOrigins = {henesys_hhg:[13,-20], henesys_town:[40,-294], ant_tunnel:[31,10], ellinia:[-10,-294], zakum_altar:[31,150]};
    if (!draw || draw.key !== key || draw.x !== expectedOrigins[key][0] || draw.y !== expectedOrigins[key][1]) {
      failures.push(`${key}: terrain origin changed incorrectly`);
    }
  }
  renderer.minimapImg = originalMinimap;
  const expectedDraws = Object.keys(renderer.playerSprites).length * 5 + Object.keys(catalog).length * 4 + Object.keys(renderer.npcs).length;
  return {checked, expectedChecks: expectedKeys.size * 2, frames: expectedKeys.size,
    species: Object.keys(catalog).length, draws, expectedDraws, failures};
})()"""


async def main():
    qa_module.PORT = int(os.environ.get('QA_CDP_PORT', '9222'))
    catalog = json.loads((Path(__file__).resolve().parent / 'assets' / 'monsters' / 'catalog.json').read_text(encoding='utf-8'))
    assert catalog['zombie_mushroom']['mobId'] == 2230101
    assert catalog['horny_mushroom']['mobId'] == 2110200
    for family, record in catalog.items():
        for action, count in record['frames'].items():
            files = list((Path(__file__).resolve().parent / 'assets' / 'monsters' / family).glob(f'{action}_*.png'))
            assert len(files) == count, f'{family}/{action}: source catalog and PNG family differ'
    suite = GameQASuite()
    try:
        await suite.start()
        loaded = await suite.send_cmd('Runtime.evaluate', {
            'expression': "Promise.all(Object.entries(sprites.images).map(([key, image]) => image.decode().catch(() => new Promise(r => setTimeout(r, 150)).then(() => image.decode())).then(() => null, error => key + ': ' + error.message))).then(results => results.filter(Boolean))",
            'awaitPromise': True, 'returnByValue': True
        })
        decode_errors = loaded.get('result', {}).get('result', {}).get('value')
        assert decode_errors == [], loaded
        result = await suite.evaluate(PIXEL_CHECK)
        assert result and result['frames'] > 0 and result['checked'] == result['expectedChecks'], result
        assert result['draws'] == result['expectedDraws'], result
        assert not result['failures'], result['failures']
        assert not suite.errors, suite.errors
        print(f"[PASS] {result['checked']} pixel contact checks ({result['frames']} catalog frames, {result['species']} monster families, both directions)")
        print(f"[PASS] {result['draws']} player/monster draw paths, including jump and death")
        print('[PASS] 5 map terrain origins; 0 runtime exceptions')

        # Reproducible visual evidence at the same positions as the original defect.
        await suite.evaluate(r"""(() => {
          const g = game;
          g.update = () => {};
          g.autoHunt.enabled = false;
          Object.assign(g.player, {x: 1000, y: 1320, onGround: true, attackTimer: 0, invincibleTimer: 0});
          Object.assign(g.camera, {x: 350, y: 950});
          g.monsters = ['snail', 'slime', 'orange_mushroom', 'ribbon_pig'].map((type, i) => {
            const m = new Monster(type, 650 + i * 200, 1320);
            m.vx = 1;
            m.onGround = true;
            return m;
          });
          for (const id of ['top-bar-overlay', 'maple-chat-container', 'maple-loot-log', 'auto-stats-panel']) {
            document.getElementById(id).style.display = 'none';
          }
        })()""")
        await asyncio.sleep(0.1)
        shot = await suite.send_cmd('Page.captureScreenshot')
        output = Path(__file__).resolve().parent / 'scratch_scripts' / 'grounding_after.png'
        output.parent.mkdir(exist_ok=True)
        output.write_bytes(base64.b64decode(shot['result']['data']))
        print(f'[Artifact] {output}')
    finally:
        if suite.ws:
            await suite.ws.close()
        if suite.proc:
            suite.proc.terminate()
            suite.proc.wait(timeout=10)


if __name__ == '__main__':
    asyncio.run(main())
