// Run with: node --test test_boss_lifecycle.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function fixture() {
  const sounds = [], delayed = [], drops = [], damageTexts = [], kills = [];
  const context = vm.createContext({window: {
    audio: new Proxy({}, {get: (_, key) => () => sounds.push(key)}),
    sprites: {spawnLandingDust() {}}
  }, performance: {now: () => 123456}, setTimeout: callback => delayed.push(callback)});
  for (const name of ['sprite_grounding', 'physics', 'entities', 'combat']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'js', `${name}.js`), 'utf8'), context);
  }
  const {ZakumBoss, Monster, Player, CombatSystem, Foothold} = context.window;
  const player = new Player(1000, 490);
  player.level = 200;
  let exp = 0;
  player.gainExp = amount => {exp += amount;};
  const game = {player, monsters: [], autoHunt: {recordKill: (...args) => kills.push(args)},
    spawnDrop: (...args) => drops.push(args), spawnItemText() {}, spawnMissText() {},
    spawnStaggeredDamage: (...args) => damageTexts.push(args), spawnDamageText() {}, triggerScreenShake() {}};
  const map = {width: 1200, height: 800, footholds: [new Foothold('floor', 0, 490, 1200, 490, false)],
    findConnectingFoothold: () => null, findGroundFootholdAt: () => null};
  const boss = new ZakumBoss().setGroundPosition(600, 490);
  game.boss = boss;
  game.monsters = [boss];
  const destroyArms = () => {
    for (const arm of boss.arms) boss.takeDamage(15000, false, 'right', game, {type: 'arm', target: arm});
    boss.hitstopTimer = 0;
  };
  return {context, boss, player, game, map, Monster, ZakumBoss, CombatSystem, drops, damageTexts, delayed, sounds, kills,
    destroyArms, getExp: () => exp};
}

test('canonical boss levels and independent 100k body / eight 15k arms remain intact', () => {
  const {boss, Monster} = fixture();
  assert.equal(new Monster('mushmom', 0, 0).level, 60);
  assert.equal(boss.level, 140);
  assert.equal(boss.maxHp, 100000);
  assert.equal(boss.arms.length, 8);
  for (const arm of boss.arms) assert.equal(arm.hp, 15000);
});

test('the body visible foot rests on the supplied arena floor throughout every animation frame', () => {
  const {boss, context} = fixture();
  assert.ok(context.window.BOSS_SPRITE_GEOMETRY, 'Generated boss asset geometry is required');
  for (let frame = 0; frame < 8; frame++) {
    boss.animationTime = frame / 4;
    const body = boss.getPartGeometry();
    assert.equal(body.y + body.height, 490);
    assert.equal(boss.getGroundY(), 490);
  }
});

test('the arms phase shields the body and tracks each destroyed arm without repeat hits', () => {
  const {boss, game} = fixture();
  assert.equal(boss.getHitBoxes().length, 8);
  assert.equal(boss.takeDamage(100000, false, 'right', game, {type: 'body', target: boss}), false);
  assert.equal(boss.hp, 100000);
  const arm = boss.arms[0];
  assert.equal(boss.takeDamage(15000, false, 'right', game, {type: 'arm', target: arm}), true);
  assert.equal(arm.isAlive, false);
  assert.equal(arm.state, 'dying');
  assert.equal(arm.hp, 0);
  assert.equal(boss.arms[1].hp, 15000);
  assert.equal(boss.getHitBoxes().length, 7);
  assert.equal(boss.takeDamage(15000, false, 'right', game, {type: 'arm', target: arm}), false);
  assert.equal(arm.hp, 0);
});

test('body damage is enabled only after all eight arms are destroyed', () => {
  const {boss, game, destroyArms} = fixture();
  destroyArms();
  assert.equal(boss.phase, 'body');
  assert.equal(boss.getHitBoxes().length, 1);
  assert.equal(boss.getHitBoxes()[0].type, 'body');
  assert.equal(boss.takeDamage(1000, false, 'right', game, boss.getHitBoxes()[0]), true);
  assert.equal(boss.hp, 99000);
});

test('lethal body damage enters a visible death phase, clears spells and awards exactly once at its end', () => {
  const {boss, game, map, player, destroyArms, drops, getExp, kills} = fixture();
  destroyArms();
  boss.activeSpells.push({type: 'fire_pillar', x: player.x, y: player.y, timer: 0, duration: 1});
  boss.takeDamage(100000, false, 'right', game, boss.getHitBoxes()[0]);
  assert.equal(boss.isAlive(), false);
  assert.equal(boss.isDying(), true);
  assert.equal(boss.state, 'dying');
  assert.equal(boss.activeSpells.length, 0);
  assert.equal(boss.getHitBoxes().length, 0);
  assert.equal(drops.length, 0);
  boss.update(0.45, player, map, game);
  assert.equal(boss.isDying(), true);
  assert.equal(getExp(), 0);
  boss.update(0.5, player, map, game);
  assert.equal(boss.state, 'dead');
  assert.equal(getExp(), 15000);
  assert.equal(drops.length, 5);
  assert.equal(drops.filter(drop => drop[0] === 'meso').reduce((sum, drop) => sum + drop[1], 0), 100000);
  assert.ok(drops.some(drop => drop[0] === 'equip' && drop[4] === '👑 자쿰의 투구'));
  boss.die(player, game);
  boss.takeDamage(100000, false, 'right', game);
  boss.grantRewards(player, game);
  boss.update(2, player, map, game);
  assert.equal(drops.length, 5);
  assert.equal(getExp(), 15000);
  assert.equal(kills.length, 1);
  assert.equal(kills[0][0], 15000);
});

test('arm animation geometry and hitboxes use the same simulation clock and pause in hitstop', () => {
  const {boss, map, player, game} = fixture();
  boss.animationTime = 0.4;
  const initial = boss.getPartGeometry('arm', boss.arms[0]);
  const box = boss.getHitBoxes()[0];
  for (const key of ['x', 'y', 'width', 'height']) assert.equal(box[key], initial[key]);
  boss.hitstopTimer = 0.08;
  boss.update(0.04, player, map, game);
  assert.equal(boss.animationTime, 0.4);
  assert.equal(boss.getPartGeometry('arm', boss.arms[0]).y, initial.y);
});

test('boss contact damage respects player invulnerability', () => {
  const {boss, player, game, map} = fixture();
  player.x = 600;
  const hp = player.hp;
  boss.update(1 / 60, player, map, game);
  assert.equal(player.hp, hp - 85);
  boss.update(1 / 60, player, map, game);
  assert.equal(player.hp, hp - 85);
});

test('fire mechanics do not hit an unrelated upper floor and do not resurrect dead players', () => {
  const {boss, player, game, map} = fixture();
  player.y = 250;
  const hp = player.hp;
  boss.activeSpells = [{type: 'fire_pillar', x: player.x, y: 700, timer: 0, duration: 0.01, damage: 45}];
  boss.update(1 / 60, player, map, game);
  assert.equal(player.hp, hp);
  player.hp = 0;
  player.y = 700;
  boss.activeSpells = [{type: 'one_to_one', x: player.x, y: 700, timer: 0, duration: 0.01, isOneToOne: true}];
  boss.update(1 / 60, player, map, game);
  assert.equal(player.hp, 0);
});

test('a matching spell volume damages a live target once, then consumes the spell', () => {
  const {boss, player, game, map} = fixture();
  const hp = player.hp;
  boss.activeSpells = [{type: 'fire_pillar', x: player.x, y: player.y, timer: 0, duration: 0.01, damage: 45}];
  boss.update(1 / 60, player, map, game);
  assert.equal(player.hp, hp - 45);
  assert.equal(boss.activeSpells.length, 0);
});

test('boss references shared by the boss slot and monster list are queried only once', () => {
  const {game, CombatSystem} = fixture();
  assert.equal(CombatSystem.getAllDamageableTargets(game).length, 1);
});

test('a delayed multi-hit strike cannot damage or show damage on an arm destroyed between strikes', () => {
  const {boss, player, game, CombatSystem, delayed, damageTexts} = fixture();
  player.minAtk = player.maxAtk = 1;
  const firstArmBox = boss.getHitBoxes()[0];
  CombatSystem.executeMeleeAttack(player, firstArmBox, 1, game, {hitsPerTarget: 2, hitDelay: 100});
  assert.equal(damageTexts.length, 1);
  assert.equal(delayed.length, 1);
  boss.takeDamage(15000, false, 'right', game, firstArmBox);
  delayed[0]();
  assert.equal(damageTexts.length, 1);
});

test('Mushmom enters death animation and cannot grant experience or drops more than once', () => {
  const {Monster, player, game, map, drops, getExp, kills} = fixture();
  const monster = new Monster('mushmom', 300, 490);
  monster.takeDamage(monster.hp, false, 'right', game);
  assert.equal(monster.isDying(), true);
  assert.equal(getExp(), 950);
  const dropCount = drops.length;
  monster.die(player, game);
  monster.spawnDrops(game);
  assert.equal(getExp(), 950);
  assert.equal(drops.length, dropCount);
  assert.equal(kills.length, 1);
  assert.equal(kills[0][0], 950);
  monster.update(1, player, map, game);
  assert.equal(monster.state, 'dead');
});

test('kill accounting uses the actual experience returned by gainExp, including bonuses', () => {
  const {Monster, player, game, kills} = fixture();
  player.gainExp = amount => Math.floor(amount * 1.5);
  const monster = new Monster('mushmom', 300, 490);
  monster.takeDamage(monster.hp, false, 'right', game);
  assert.equal(kills.length, 1);
  assert.equal(kills[0][0], 1425);
});

test('Mushmom landing quake hits nearby grounded players, while jumping players evade it', () => {
  for (const grounded of [true, false]) {
    const {Monster, player, game, map} = fixture();
    const monster = new Monster('mushmom', 300, 489);
    monster.quakePending = true;
    monster.vy = 2;
    monster.moveTimer = 100;
    player.x = 500;
    player.y = 490;
    player.onGround = grounded;
    const hp = player.hp;
    monster.update(1 / 60, player, map, game);
    assert.equal(monster.onGround, true);
    assert.equal(monster.quakePending, false);
    assert.equal(player.hp, grounded ? hp - 60 : hp);
  }
});

test('renderers share boss part origins and visibly fade dying bosses and monsters', () => {
  const {context, boss, Monster, player, game} = fixture();
  context.Image = class {
    constructor() {this.complete = true; this.naturalWidth = 64; this.naturalHeight = 64;}
  };
  const bakeContext = new Proxy({}, {get: (_target, key) =>
    key === 'createRadialGradient' || key === 'createLinearGradient'
      ? () => ({addColorStop() {}}) : () => {}});
  context.document = {createElement: () => ({getContext: () => bakeContext})};
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'js/sprites.js'), 'utf8'), context);
  const renderer = context.window.sprites;
  const draws = [], stack = [];
  const ctx = new Proxy({globalAlpha: 1,
    save() {stack.push(this.globalAlpha);}, restore() {this.globalAlpha = stack.pop();},
    drawImage(image, x, y, width, height) {draws.push({image, x, y, width, height, alpha: this.globalAlpha});}
  }, {get: (target, key) => key in target ? target[key] : () => {}});
  renderer.drawZakumBoss(ctx, boss);
  for (const arm of boss.arms) {
    const geometry = boss.getPartGeometry('arm', arm);
    const image = renderer.zakum.arms[arm.id][geometry.frame];
    const draw = draws.find(item => item.image === image);
    assert.equal(draw.x, geometry.drawX);
    assert.equal(draw.y, geometry.drawY);
  }
  boss.startDying(player, game);
  boss.dyingTimer = boss.dyingDuration / 2;
  draws.length = 0;
  renderer.drawZakumBoss(ctx, boss);
  assert.ok(draws.length > 0);
  assert.ok(draws.every(draw => draw.alpha === 0.5));
  const monster = new Monster('mushmom', 300, 490);
  monster.state = 'dying';
  monster.dyingTimer = monster.dyingDuration / 2;
  draws.length = 0;
  renderer.drawMonster(ctx, monster);
  assert.equal(draws[0].alpha, 0.5);
});
