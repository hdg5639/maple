// Run with: node --test test_combat_collisions.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function fixture() {
  const context = vm.createContext({window: {}});
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'js/combat.js'), 'utf8'), context);
  const Combat = context.window.CombatSystem;
  const damage = [];
  const misses = [];
  const game = {boss: null, monsters: [], spawnStaggeredDamage() {}, spawnMissText(...args) { misses.push(args); }};
  const target = (name, boxes) => ({
    name, isAlive: () => true, getHitBoxes: () => boxes,
    takeDamage(amount, crit, direction, currentGame, box) { damage.push({name, amount, direction, box}); }
  });
  const projectile = (startX, startY, endX, endY) => ({
    prevX: startX, prevY: startY, x: endX, y: endY,
    vx: endX - startX, damage: 100, isCrit: false, hit: false
  });
  return {Combat, game, target, projectile, damage, misses};
}

test('a diagonal sweep does not hit targets inside only its enclosing rectangle', () => {
  const {Combat} = fixture();
  const offPath = {x: 0, y: 90, width: 10, height: 10};
  assert.equal(Combat.checkSweptAABB(0, 0, 100, 100, offPath, 0, 0), false);
  assert.equal(Combat.checkSweptAABB(0, 0, 100, 100, {x: 45, y: 45, width: 10, height: 10}, 0, 0), true);
});

test('entry times handle vertical, reversed, parallel and stationary segments', () => {
  const {Combat} = fixture();
  const box = {x: 40, y: 40, width: 20, height: 20};
  assert.equal(Combat.getSweptHitTime(50, 0, 50, 100, box, 0, 0), 0.4);
  assert.equal(Combat.getSweptHitTime(100, 50, 0, 50, box, 0, 0), 0.4);
  assert.equal(Combat.getSweptHitTime(0, 0, 0, 100, box, 0, 0), null);
  assert.equal(Combat.getSweptHitTime(50, 50, 50, 50, box, 0, 0), 0);
  assert.equal(Combat.getSweptHitTime(0, 0, 0, 0, box, 0, 0), null);
  assert.equal(Combat.getSweptHitTime(0, 0, NaN, 50, box, 0, 0), null);
});

test('projectile half-size expands the target without turning the sweep into a filled rectangle', () => {
  const {Combat} = fixture();
  const box = {x: 50, y: 10, width: 10, height: 10};
  assert.equal(Combat.getSweptHitTime(0, 0, 100, 0, box, 0, 9), null);
  assert.equal(Combat.getSweptHitTime(0, 0, 100, 0, box, 8, 10), 0.42);
  assert.equal(Combat.getSweptHitTime(50, 10, 100, 0, box, 8, 10), 0);
});

test('fast projectiles hit the closest target even when monsters are stored in reverse order', () => {
  const {Combat, game, target, projectile, damage} = fixture();
  game.monsters = [
    target('far', [{x: 80, y: -5, width: 10, height: 10}]),
    target('near', [{x: 30, y: -5, width: 10, height: 10}])
  ];
  const shot = projectile(0, 0, 120, 0);
  assert.equal(Combat.resolveProjectileCollision(shot, game), true);
  assert.equal(shot.hit, true);
  assert.equal(damage.length, 1);
  assert.equal(damage[0].name, 'near');
});

test('leftward projectiles use travel order instead of increasing world X', () => {
  const {Combat, game, target, projectile, damage} = fixture();
  game.monsters = [
    target('far-left', [{x: 10, y: -5, width: 10, height: 10}]),
    target('near-right', [{x: 80, y: -5, width: 10, height: 10}])
  ];
  Combat.resolveProjectileCollision(projectile(120, 0, 0, 0), game);
  assert.equal(damage[0].name, 'near-right');
  assert.equal(damage[0].direction, 'left');
});

test('boss collection priority cannot let a projectile pass through a nearer monster', () => {
  const {Combat, game, target, projectile, damage} = fixture();
  game.boss = target('boss', [{x: 90, y: -5, width: 20, height: 10}]);
  game.monsters = [target('monster', [{x: 30, y: -5, width: 10, height: 10}])];
  Combat.resolveProjectileCollision(projectile(0, 0, 120, 0), game);
  assert.equal(damage[0].name, 'monster');
});

test('a multi-part boss receives the box contacted first, regardless of arm/body array order', () => {
  const {Combat, game, target, projectile, damage} = fixture();
  const farArm = {id: 'far-arm', x: 90, y: -5, width: 10, height: 10};
  const body = {id: 'body', x: 60, y: -5, width: 20, height: 10};
  const nearArm = {id: 'near-arm', x: 30, y: -5, width: 10, height: 10};
  game.boss = target('zakum', [farArm, body, nearArm]);
  Combat.resolveProjectileCollision(projectile(0, 0, 120, 0), game);
  assert.equal(damage.length, 1);
  assert.equal(damage[0].box, nearArm);
});

test('a projectile starting inside a target hits that target before a later intersection', () => {
  const {Combat, game, target, projectile, damage} = fixture();
  game.monsters = [
    target('later', [{x: 80, y: -5, width: 10, height: 10}]),
    target('overlapping', [{x: -5, y: -5, width: 10, height: 10}])
  ];
  Combat.resolveProjectileCollision(projectile(0, 0, 120, 0), game);
  assert.equal(damage[0].name, 'overlapping');
});

test('MISS consumes the projectile at its first target and never damages a later target', () => {
  const {Combat, game, target, projectile, damage, misses} = fixture();
  game.monsters = [
    target('far', [{x: 80, y: -5, width: 10, height: 10}]),
    target('near', [{x: 30, y: -5, width: 10, height: 10}])
  ];
  Combat.checkHit = () => false;
  const shot = projectile(0, 0, 120, 0);
  shot.owner = {};
  assert.equal(Combat.resolveProjectileCollision(shot, game), true);
  assert.equal(shot.hit, true);
  assert.equal(damage.length, 0);
  assert.equal(misses.length, 1);
  assert.ok(misses[0][0] >= 30 && misses[0][0] <= 40, 'MISS stays on the actual first contacted target');
});

test('an already consumed projectile and an unobstructed shot cause no additional hits', () => {
  const {Combat, game, target, projectile, damage} = fixture();
  game.monsters = [target('off-path', [{x: 0, y: 90, width: 10, height: 10}])];
  const shot = projectile(0, 0, 100, 100);
  assert.equal(Combat.resolveProjectileCollision(shot, game), false);
  assert.equal(shot.hit, false);
  shot.hit = true;
  assert.equal(Combat.resolveProjectileCollision(shot, game), false);
  assert.equal(damage.length, 0);
});
