// Run with: node --test test_combat_assist.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function fixture() {
  const delayed = [], hits = [];
  const context = vm.createContext({window: {
    audio: new Proxy({}, {get: () => () => {}}), sprites: {spawnLandingDust() {}}
  }, setTimeout: (run, delay) => delayed.push({run, delay})});
  for (const name of ['physics', 'entities', 'combat', 'skills', 'autohunt']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'js', `${name}.js`), 'utf8'), context);
  }
  const {Player, Monster, Physics, Foothold, Projectile, CombatSystem, SkillRegistry} = context.window;
  const player = new Player(200, 200);
  player.level = 200;
  player.attackSpeedBonus = 0;
  const floor = new Foothold('floor', 0, 200, 1000, 200, false);
  const map = {currentKey: 'field', width: 1000, height: 1000, footholds: [floor],
    findConnectingFoothold: () => null, findGroundFootholdAt: () => floor};
  Physics.landOnFoothold(player, floor);
  const game = {player, map, boss: null, monsters: [], drops: [], projectiles: [], skillEffects: [],
    spawnStaggeredDamage: (...args) => hits.push(args), spawnMissText() {}, spawnItemText() {}};
  const monster = (x, y = 200) => {
    const m = new Monster('snail', x, y);
    m.hp = m.maxHp = 1000;
    m.currentFoothold = Math.abs(y - 200) < 1e-7 ? floor : null;
    game.monsters.push(m);
    return m;
  };
  return {context, player, game, map, floor, monster, delayed, hits, Projectile, Foothold, CombatSystem, SkillRegistry};
}

test('nearby melee targets automatically correct facing and receive the attack', () => {
  const {player, monster, game} = fixture();
  const target = monster(150);
  player.facing = 'right';
  assert.equal(player.normalAttack(game), true);
  assert.equal(player.facing, 'left');
  assert.ok(target.hp < target.maxHp);
});

test('auto aim chooses the closest reachable rectangle, not the first stored enemy', () => {
  const {player, monster, game, CombatSystem} = fixture();
  monster(260);
  const nearest = monster(165);
  assert.equal(CombatSystem.prepareAutoAim(player, game, {range: 100}).target, nearest);
  assert.equal(player.facing, 'left');
});

test('targets outside range or on another connected-surface layer do not steal aiming', () => {
  const {player, monster, game, CombatSystem} = fixture();
  monster(600);
  const upper = monster(210, 160);
  upper.currentFoothold = {id: 'upper'};
  game.autoHunt = {graph: {nodes: new Map([['floor', {}], ['upper', {}]]), edges: new Map([['floor', []], ['upper', []]])}};
  player.facing = 'left';
  assert.equal(CombatSystem.prepareAutoAim(player, game, {range: 100, verticalRange: 48}), null);
  assert.equal(player.facing, 'left');
});

test('terrain blocks auto aim and consumes a manually fired projectile before the enemy', () => {
  const {player, monster, game, map, Foothold, Projectile, CombatSystem} = fixture();
  const target = monster(270);
  map.footholds.push(new Foothold('wall', 230, 140, 230, 220, false));
  assert.equal(CombatSystem.findAutoAimTarget(player, game, {range: 200}), null);
  const shot = new Projectile(216, 184, 600, 0, 'arrow', 100, false, player);
  shot.update(0.1, game);
  assert.equal(shot.hit, true);
  assert.equal(target.hp, target.maxHp);
});

test('a manual melee hitbox cannot damage an enemy through an intervening wall', () => {
  const {player, monster, game, map, Foothold} = fixture();
  const target = monster(270);
  map.footholds.push(new Foothold('wall', 230, 140, 230, 220, false));
  player.facing = 'right';
  assert.equal(player.normalAttack(game), false);
  assert.equal(target.hp, target.maxHp);
});

test('aimed projectiles reach a visible enemy on a continuous rising slope', () => {
  const {player, monster, game, map, Foothold} = fixture();
  const slope = new Foothold('slope', 200, 200, 350, 160);
  map.footholds = [slope];
  player.currentFoothold = slope;
  const target = monster(350, 160);
  target.currentFoothold = slope;
  assert.equal(player.useSkill('three_snails', game), true);
  const shot = game.projectiles[0];
  assert.ok(shot.vx > 0 && shot.vy < 0, 'projectile did not steer toward the visible uphill target');
  for (let tick = 0; tick < 60 && !shot.hit; tick++) shot.update(1 / 60, game);
  assert.equal(shot.hit, true);
  assert.ok(target.hp < target.maxHp);
  assert.ok(shot.life <= 420 / 480);
});

test('MP costs are quartered, shown consistently and never charged for blocked recasts', () => {
  const {player, game, SkillRegistry} = fixture();
  assert.equal(SkillRegistry.get('slash_blast').mpCost, 2);
  player.mp = 20;
  assert.equal(player.useSkill('slash_blast', game), true);
  assert.equal(player.skills.slash_blast.mpCost, 2);
  assert.equal(player.mp, 18);
  assert.equal(player.useSkill('slash_blast', game), false);
  assert.equal(player.mp, 18);
  player.attackTimer = 0;
  player.skillCooldowns.slash_blast = 0;
  assert.equal(player.useSkill('power_strike', game), true);
  assert.equal(player.mp, 18);
});

test('a primary skill stays visibly free after casting even when its registry default has a cost', () => {
  const {player, game, SkillRegistry} = fixture();
  player.getPrimarySkillId = () => 'slash_blast';
  player.mp = 0;
  assert.equal(SkillRegistry.get('slash_blast').mpCost, 2);
  assert.equal(player.useSkill('slash_blast', game), true);
  assert.equal(player.mp, 0);
  assert.equal(player.skills.slash_blast.mpCost, 0);
});

test('equipment attack speed shortens both recast time and the following projectile interval', () => {
  const {player, game, SkillRegistry, delayed} = fixture();
  player.attackSpeedBonus = 0.5;
  assert.equal(SkillRegistry.execute('double_shot', player, game), true);
  assert.equal(game.projectiles.length, 1, 'first shot should respond immediately');
  assert.ok(Math.abs(player.attackTimer - 0.26 * 1.2 / 1.5) < 1e-9);
  assert.equal(player.attackAnimationDuration, player.attackTimer);
  assert.equal(delayed.length, 1);
  assert.ok(Math.abs(delayed[0].delay - 140 / 1.5) < 1e-9);
  assert.equal(SkillRegistry.execute('double_shot', player, game), false);
});

test('buff and movement skill cast delays expire on the simulation clock', () => {
  const {player, game, map} = fixture();
  assert.equal(player.useSkill('flash_jump', game), true);
  const mp = player.mp;
  assert.equal(player.useSkill('flash_jump', game), false);
  assert.equal(player.mp, mp);
  for (let tick = 0; tick < 20; tick++) player.update(1 / 60, map);
  assert.equal(player.useSkill('flash_jump', game), true);
});

test('queued projectiles keep their cast direction and are cancelled after map changes or death', () => {
  for (const cancel of ['map', 'same-map-reload', 'death', 'none']) {
    const {player, game, SkillRegistry, delayed} = fixture();
    player.facing = 'right';
    SkillRegistry.execute('double_shot', player, game);
    player.facing = 'left';
    if (cancel === 'map') game.map.currentKey = 'town';
    if (cancel === 'same-map-reload') game.monsters = [];
    if (cancel === 'death') player.hp = 0;
    delayed[0].run();
    assert.equal(game.projectiles.length, cancel === 'none' ? 2 : 1);
    if (cancel === 'none') assert.ok(game.projectiles[1].vx > 0);
  }
});

test('auto-hunt uses effective zero-MP signature skills instead of falling back to melee', () => {
  for (const [job, expected] of [['궁수', 'double_shot'], ['마법사', 'magic_claw'], ['도적', 'lucky_seven']]) {
    const {context, player, game, monster} = fixture();
    player.setJob(job);
    player.mp = 0;
    monster(280);
    const casts = [];
    const original = player.useSkill.bind(player);
    player.useSkill = (id, currentGame) => {casts.push(id); return original(id, currentGame);};
    let meleeFallback = 0;
    player.normalAttack = () => meleeFallback++;
    const ai = {game, config: {useSkills: true}};
    assert.equal(context.window.AutoHuntManager.prototype.triggerAttack.call(ai, player), true);
    assert.equal(casts[0], expected);
    assert.equal(player.mp, 0);
    assert.equal(meleeFallback, 0);
  }
});

test('queued melee hits cannot land on an entity left in the previous map', () => {
  const {player, monster, game, CombatSystem, delayed, hits} = fixture();
  const target = monster(250);
  CombatSystem.executeMeleeAttack(player, target.getHitBox(), 1, game, {hitsPerTarget: 2});
  assert.equal(hits.length, 1);
  game.map.currentKey = 'town';
  delayed[0].run();
  assert.equal(hits.length, 1);
});

test('a terrain hit at the exact end of a simulation step is not skipped', () => {
  const {player, game, map, Foothold, Projectile} = fixture();
  map.footholds.push(new Foothold('wall', 230, 140, 230, 220, false));
  const shot = new Projectile(220, 184, 600, 0, 'arrow', 100, false, player);
  shot.update(1 / 60, game);
  assert.equal(shot.x, 230);
  assert.equal(shot.hit, true);
});
