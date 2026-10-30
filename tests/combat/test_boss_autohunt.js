// Run with: node --test test_boss_autohunt.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function fixture(mapKey = 'zakum_altar') {
  const context = vm.createContext({window: {
    audio: new Proxy({}, {get: () => () => {}}), sprites: {spawnLandingDust() {}}
  }, Image: class {}, performance: {now: () => 0}, setTimeout() {}});
  for (const name of ['sprite_grounding', 'map_data', 'physics', 'map', 'entities', 'combat', 'skills', 'autohunt']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'js', `${name}.js`), 'utf8'), context);
  }
  const {Player, ZakumBoss, AutoHuntManager, Monster, Physics, FootholdGraph} = context.window;
  const map = vm.runInContext(`new GameMap('${mapKey}')`, context);
  const spawn = map.defaultSpawn;
  const player = new Player(spawn.x, spawn.y);
  Physics.landOnFoothold(player, map.findFootholdNear(spawn.x, spawn.y));
  player.level = 200;
  const bossSpawn = vm.runInContext(`MAP_DATABASE.zakum_altar.bossSpawn`, context);
  const boss = new ZakumBoss().setGroundPosition(bossSpawn.x, bossSpawn.y);
  const game = {player, map, boss, monsters: [boss], drops: [], skillEffects: [], projectiles: [],
    spawnItemText() {}, spawnMissText() {}, spawnStaggeredDamage() {}, spawnDamageText() {}, spawnDrop() {}};
  const ai = new AutoHuntManager(game);
  ai.config.autoLoot = false;
  ai.config.useSkills = false;
  ai.enabled = true;
  return {context, game, ai, player, boss, map, Physics, Monster, FootholdGraph};
}

test('the nearest reachable live arm is selected instead of the protected body center', () => {
  const {ai, player, boss} = fixture();
  ai.selectTarget(player);
  assert.equal(ai.currentTarget, boss);
  assert.equal(ai.bossTargetPlan.type, 'arm');
  assert.equal(ai.bossTargetPlan.part.isAlive, true);
  assert.equal(ai.bossTargetPlan.part.id % 2, 1, 'original odd-numbered arms are on the entry side');
  assert.equal(ai.getBossTargetBox().type, 'arm');
  assert.equal(ai.canAttackBossPart({...player, x: ai.bossTargetPlan.x, y: ai.bossTargetPlan.y}, ai.getBossTargetBox()), true);
});

test('an isolated upper arm generates a ladder and running-jump route to visible pixels', () => {
  const {ai, player, boss, game, map} = fixture();
  const arm = boss.arms[0];
  for (const other of boss.arms) if (other !== arm) {other.isAlive = false; other.hp = 0;}
  ai.selectTarget(player);
  ai.buildWaypointPath(player);
  assert.equal(ai.bossTargetPlan.part, arm);
  assert.ok(ai.commandQueue.some(command => command.action === 'CLIMB_LADDER'));
  assert.notEqual(ai.bossTargetPlan.foothold.id, player.currentFoothold.id);
  let steps = 0;
  while (arm.hp === arm.maxHp && steps++ < 2000) {
    ai.update(1 / 60);
    player.update(1 / 60, map);
  }
  assert.ok(arm.hp < arm.maxHp, `upper arm never received damage after ${steps} steps`);
  assert.equal(player.onLadder, false);
  assert.equal(game.boss, boss);
});

for (const job of ['전사', '마법사', '궁수', '도적', '초보자']) {
  test(`normal arena entry reaches all eight real arm silhouettes with ${job} attacks (accelerated damage fixture)`, () => {
    const {ai, player, boss, game, map} = fixture();
    ai.config.useSkills = true;
    player.setJob(job);
    player.level = 200;
    // This is a deterministic route/combat diagnostic, not a balance test.
    // Keep every boss HP, spawn and collision surface intact; accelerate damage only.
    for (const stat of ['minAtk', 'maxAtk']) Object.defineProperty(player, stat, {get: () => 100000, set() {}});
    const hitArms = new Set();
    const damage = boss.takeDamage.bind(boss);
    boss.takeDamage = (amount, critical, facing, currentGame, box) => {
      const before = box?.target?.hp;
      const shielded = boss.phase === 'arms', bodyHp = boss.hp;
      const result = damage(amount, critical, facing, currentGame, box);
      if (shielded) assert.equal(boss.hp, bodyHp, 'an arms-phase attack damaged the shielded body');
      if (result && box?.type === 'arm' && box.target.hp < before) hitArms.add(box.target.id);
      return result;
    };
    let steps = 0;
    while (boss.phase === 'arms' && steps++ < 4000) {
      ai.update(1 / 60);
      player.update(1 / 60, map);
      boss.animationTime += 1 / 60;
      for (const shot of game.projectiles) if (!shot.hit && shot.life > 0) {
        // Three Snails has fixed skill damage, so the accelerated test fixture
        // must also scale its outgoing projectile rather than altering boss HP.
        if (job === '초보자') shot.damage = 100000;
        shot.update(1 / 60, game);
      }
      game.projectiles = game.projectiles.filter(shot => !shot.hit && shot.life > 0);
    }
    assert.deepEqual([...hitArms].sort(), [1, 2, 3, 4, 5, 6, 7, 8], `route stalled after ${steps} steps at ${player.x},${player.y}`);
    assert.ok(['body', 'dying'].includes(boss.phase), 'last arm did not release the body phase');
  });
}

test('native right ledges have a physically validated jump connection from the arena floor', () => {
  const {ai, player} = fixture();
  const queue = [player.currentFoothold.id], reached = new Set(queue);
  let jumps = 0;
  while (queue.length) for (const edge of ai.graph.edges.get(queue.shift()) || []) {
    if (edge.type === 'jump') jumps++;
    if (!reached.has(edge.targetId)) {reached.add(edge.targetId); queue.push(edge.targetId);}
  }
  assert.ok(jumps > 0);
  assert.equal(reached.has(152), true, 'original upper-right platform is unreachable');
});

test('destroying the chosen arm causes a new live part to be selected', () => {
  const {ai, player, boss, game} = fixture();
  ai.selectTarget(player);
  const previous = ai.bossTargetPlan.part;
  boss.takeDamage(15000, false, 'right', game, {type: 'arm', target: previous});
  ai.update(1 / 60);
  assert.notEqual(ai.bossTargetPlan.part, previous);
  assert.equal(ai.bossTargetPlan.part.isAlive, true);
});

test('destroying all arms switches targeting and attack positions to the body phase', () => {
  const {ai, player, boss, game} = fixture();
  ai.selectTarget(player);
  for (const arm of boss.arms) boss.takeDamage(15000, false, 'right', game, {type: 'arm', target: arm});
  ai.update(1 / 60);
  assert.equal(ai.bossTargetPlan.type, 'body');
  assert.equal(ai.bossTargetPlan.part, boss);
  assert.equal(ai.getBossTargetBox().type, 'body');
  assert.equal(ai.canAttackBossPart({...player, x: ai.bossTargetPlan.x, y: ai.bossTargetPlan.y}, ai.getBossTargetBox()), true);
});

test('unreachable upper arms do not create a path through empty space', () => {
  const {ai, player, boss, map, FootholdGraph} = fixture();
  for (const arm of boss.arms.slice(1)) {arm.isAlive = false; arm.hp = 0;}
  map.footholds = [player.currentFoothold];
  map.ladders = [];
  ai.graph = new FootholdGraph(map);
  ai.selectTarget(player);
  ai.buildWaypointPath(player);
  assert.equal(ai.currentTarget, null);
  assert.equal(ai.bossTargetPlan, null);
  assert.equal(ai.commandQueue.length, 0);
});

test('holding a valid boss firing position does not activate the stuck watchdog', () => {
  const {ai, player} = fixture();
  ai.selectTarget(player);
  const plan = ai.bossTargetPlan;
  Object.assign(player, {x: plan.x, y: plan.y, onGround: true, currentFoothold: plan.foothold});
  ai.stuckTimer = 0.49;
  ai.commandQueue = [{action: 'NAVIGATE_TO_TARGET'}];
  let forcedJumps = 0;
  player.jump = () => forcedJumps++;
  ai.checkAntiStuck(1 / 60, player);
  assert.equal(ai.stuckTimer, 0);
  assert.equal(forcedJumps, 0);
});

test('targets from a previous map are invalid even if the old entity remains alive', () => {
  const {ai, player, game, boss} = fixture();
  ai.selectTarget(player);
  game.monsters = [];
  game.boss = null;
  assert.equal(boss.isAlive(), true);
  assert.equal(ai.isTargetValid(boss), false);
});

test('ordinary monsters retain direct entity targeting without a boss part plan', () => {
  const {ai, player, game, Monster, map} = fixture('henesys_hhg');
  const monster = new Monster('snail', player.x + 40, player.y);
  monster.currentFoothold = map.findFootholdNear(monster.x, monster.y);
  game.monsters = [monster];
  game.boss = null;
  ai.selectTarget(player);
  ai.buildWaypointPath(player);
  assert.equal(ai.currentTarget, monster);
  assert.equal(ai.targetType, 'monster');
  assert.equal(ai.bossTargetPlan, null);
  assert.equal(ai.commandQueue.at(-1).action, 'NAVIGATE_TO_TARGET');
});

test('an empty town remains idle for 2000 ticks without watchdog jumping or dropping', () => {
  const {ai, player, game, map} = fixture('henesys_town');
  game.monsters = [];
  game.boss = null;
  let jumps = 0, drops = 0;
  player.jump = () => jumps++;
  player.dropThrough = () => drops++;
  const initialX = player.x, initialY = player.y;
  for (let step = 0; step < 2000; step++) {
    ai.update(1 / 60);
    player.update(1 / 60, map);
  }
  assert.equal(ai.currentTarget, null);
  assert.equal(ai.commandQueue.length, 0);
  assert.equal(ai.stuckTimer, 0);
  assert.equal(jumps, 0);
  assert.equal(drops, 0);
  assert.equal(player.x, initialX);
  assert.equal(player.y, initialY);
});
