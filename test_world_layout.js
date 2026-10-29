// Run with: node --test test_world_layout.js
// Data/runtime placement audit; browser image checks complement these geometry tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const MAP_KEYS = ['henesys_hhg', 'henesys_town', 'ant_tunnel', 'ellinia', 'zakum_altar'];
const MIN_CLEARANCE = 80;

function fixture() {
  const paint = new Proxy({}, {get: (_target, key) => {
    if (key === 'createLinearGradient') return () => ({addColorStop() {}});
    if (key === 'measureText') return text => ({width: String(text).length * 7});
    return () => {};
  }});
  const context = vm.createContext({
    window: {addEventListener() {}, audio: new Proxy({}, {get: () => () => {}}),
      sprites: {spawnLandingDust() {}}},
    Image: class {},
    document: {getElementById: () => null,
      createElement: () => ({width: 0, height: 0, getContext: () => paint})},
    performance: {now: () => 0}, requestAnimationFrame() {}, setTimeout() {}
  });
  for (const name of ['map_data', 'physics', 'map', 'entities', 'autohunt', 'game']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'js', name + '.js'), 'utf8'), context,
      {filename: name + '.js'});
  }
  const data = vm.runInContext('MAP_DATABASE', context);
  const newMap = key => vm.runInContext(`new GameMap(${JSON.stringify(key)})`, context);
  const game = vm.runInContext('Object.create(Game.prototype)', context);
  Object.assign(game, {
    map: newMap('henesys_hhg'), player: new context.window.Player(),
    camera: {x: 0, y: 0, width: 1280, height: 600}, keys: {}, touchActions: {},
    ui: new Proxy({}, {get: () => () => {}}), autoHunt: {enabled: false},
    monsters: [], drops: [], projectiles: [], floatingTexts: [], damageDigits: [], skillEffects: [],
    maxMonsters: 24, spawnItemText() {}, snapCameraToPlayer() {}
  });
  context.window.game = game;
  return {context, data, newMap, game, Physics: context.window.Physics};
}

function assertGrounded(map, point, label) {
  const support = map.findFootholdNear(point.x, point.y, 0.01);
  assert.ok(support, `${label}: no walkable surface at (${point.x}, ${point.y})`);
  assert.equal(support.isProp, false);
  assert.ok(point.x >= 0 && point.x <= map.width && point.y >= 0 && point.y <= map.height,
    `${label}: outside map bounds`);
  return support;
}

function assertClearance(points, label) {
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
    const a = points[i], b = points[j];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    assert.ok(distance >= MIN_CLEARANCE - 1e-7,
      `${label}: ${a.label} and ${b.label} are only ${distance.toFixed(2)}px apart`);
  }
}

function assertIntendedLayer(map, point, hintY, label) {
  const intended = map.findFootholdNear(point.x, hintY, 32);
  assert.ok(intended, `${label}: no nearby surface for authored layer ${hintY}`);
  assert.ok(Math.abs(point.y - intended.getYAtX(point.x)) <= 0.01,
    `${label}: requested layer ${hintY}, arrived at ${point.y} instead of ${intended.getYAtX(point.x)}`);
}

for (const key of MAP_KEYS) {
  test(`${key}: default arrival stays on its authored floor and clears NPCs/portals`, () => {
    const {game, data} = fixture();
    const requested = data[key].defaultSpawn;
    game.changeMap(key);
    assert.equal(game.player.onGround, true);
    assert.ok(game.player.currentFoothold);
    assertGrounded(game.map, game.player, `${key}/arrival`);
    assertIntendedLayer(game.map, game.player, requested.y, key);
    const points = [
      {label: 'arrival', x: game.player.x, y: game.player.y},
      ...game.map.npcs.map(npc => ({label: npc.name, x: npc.x, y: npc.y})),
      ...game.map.portals.map(portal => ({label: portal.name, x: portal.x, y: portal.y}))
    ];
    assertClearance(points, key);
  });

  test(`${key}: NPCs and portals rest on their intended surfaces with separate interaction zones`, () => {
    const {newMap} = fixture();
    const map = newMap(key);
    for (const npc of map.npcs) {
      assertGrounded(map, npc, `${key}/${npc.name}`);
      assert.equal(fs.existsSync(path.join(__dirname, 'assets', 'npcs', npc.type + '.png')), true,
        `${key}/${npc.name}: missing NPC sprite`);
    }
    for (const portal of map.portals) assertGrounded(map, portal, `${key}/${portal.name}`);
    assertClearance([
      ...map.npcs.map(npc => ({label: npc.name, x: npc.x, y: npc.y})),
      ...map.portals.map(portal => ({label: portal.name, x: portal.x, y: portal.y}))
    ], key);
  });

  test(`${key}: every portal resolves to an existing destination and a safe arrival on its target layer`, () => {
    const {newMap, game, data} = fixture();
    const map = newMap(key);
    for (const portal of map.portals) {
      assert.ok(data[portal.targetMap], `${key}/${portal.name}: unknown destination ${portal.targetMap}`);
      assert.ok(Number.isFinite(portal.targetX) && Number.isFinite(portal.targetY));
      game.changeMap(portal.targetMap, portal.targetX, portal.targetY);
      assert.equal(game.map.currentKey, portal.targetMap);
      assert.equal(game.player.onGround, true);
      assertGrounded(game.map, game.player, `${key}/${portal.name}/destination`);
      assertIntendedLayer(game.map, game.player, portal.targetY, `${key}/${portal.name}`);
      assertClearance([
        {label: 'arrival', x: game.player.x, y: game.player.y},
        ...game.map.npcs.map(npc => ({label: npc.name, x: npc.x, y: npc.y})),
        ...game.map.portals.map(point => ({label: point.name, x: point.x, y: point.y}))
      ], `${key}/${portal.name}/destination`);
    }
  });

  test(`${key}: ordinary monster spawns are immediately attached to walkable footholds`, () => {
    const {game} = fixture();
    game.changeMap(key);
    for (const monster of game.monsters) {
      if (monster.id === 'zakum') continue; // Multi-part boss uses its own center-coordinate model.
      assert.equal(monster.onGround, true, `${key}/${monster.type}: spawned airborne`);
      assert.ok(monster.currentFoothold && !monster.currentFoothold.isProp,
        `${key}/${monster.type}: missing walkable contact`);
      assertGrounded(game.map, monster, `${key}/${monster.type}`);
      assert.equal(fs.existsSync(path.join(__dirname, 'assets', 'monsters', monster.type, 'stand_0.png')), true,
        `${key}/${monster.type}: missing matching sprite family`);
      for (const npc of game.map.npcs) {
        assert.ok(Math.hypot(monster.x - npc.x, monster.y - npc.y) >= MIN_CLEARANCE,
          `${key}/${monster.type}: overlaps NPC ${npc.name}`);
      }
    }
  });
}

test('map identifiers, finite geometry and intended world bounds remain internally consistent', () => {
  const {newMap, data} = fixture();
  for (const key of MAP_KEYS) {
    const map = newMap(key);
    assert.equal(map.currentKey, key);
    assert.equal(data[key].key, key);
    assert.ok(Number.isFinite(map.width) && map.width > 0 && Number.isFinite(map.height) && map.height > 0);
    assert.ok(map.footholds.length > 0);
    const ids = new Set();
    for (const fh of map.footholds) {
      assert.equal(ids.has(fh.id), false, `${key}: duplicate foothold ${fh.id}`);
      ids.add(fh.id);
      for (const value of [fh.x1, fh.x2, fh.y1, fh.y2]) assert.ok(Number.isFinite(value));
      assert.ok(fh.x1 >= 0 && fh.x2 <= map.width, `${key}/${fh.id}: outside horizontal world bounds`);
      assert.ok(fh.y1 >= 0 && fh.y2 >= 0 && fh.y1 <= map.height && fh.y2 <= map.height,
        `${key}/${fh.id}: outside vertical world bounds`);
    }
  }
});

test('world population and geometry come from their matching pinned GMS 62 source', () => {
  const {data} = fixture();
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname,'assets/monsters/catalog.json'),'utf8'));
  const ids = {henesys_hhg:104040000,henesys_town:100000000,ant_tunnel:105050000,ellinia:101000000,zakum_altar:280030000};
  for (const key of MAP_KEYS) {
    assert.equal(data[key].mapId, ids[key]);
    assert.equal(data[key].nativeTerrain, true);
    const source = JSON.parse(fs.readFileSync(path.join(__dirname,'assets/map/source',`${ids[key]}.json`),'utf8'));
    assert.equal(data[key].footholds.length,Object.values(source.footholds).filter(f=>f.x1!==f.x2).length);
    assert.equal(data[key].mobSpawns.length,(source.mobs || []).length);
    for (const spawn of data[key].mobSpawns) assert.equal(catalog[spawn.type].mobId,spawn.sourceMobId);
    if (source.isTown) assert.equal(data[key].maxMonsters,0);
  }
});

test('restoring progress preserves zero resources and rebuilds skills with current policy', () => {
  const {game} = fixture();
  game.restorePlayerData({level:3,job:'마법사',exp:5,ap:0,sp:0,meso:0,mp:0,hp:20,
    maxExp:999999,skills:{energy_bolt:{level:1,mpCost:999999}}});
  assert.equal(game.player.ap,0);
  assert.equal(game.player.sp,0);
  assert.equal(game.player.meso,0);
  assert.equal(game.player.mp,0);
  assert.equal(game.player.hp,20);
  assert.equal(game.player.exp,5);
  assert.notEqual(game.player.maxExp,999999);
  assert.notEqual(game.player.skills.energy_bolt.mpCost,999999);
  assert.ok(game.player.skills.thunderbolt);
});
