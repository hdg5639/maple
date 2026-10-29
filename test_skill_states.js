// Run with: node --test test_skill_states.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function fixture() {
  const sounds = [];
  const audio = new Proxy({}, {get: (_, key) => () => sounds.push(key)});
  const context = vm.createContext({window: {audio}, setTimeout() {}});
  for (const name of ['physics', 'entities', 'combat', 'skills']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'js', `${name}.js`), 'utf8'), context);
  }
  const player = new context.window.Player(100, 100);
  player.facing = 'right';
  const lookups = [];
  let destination = null;
  const map = {
    width: 500,
    findFootholdNear(...args) {lookups.push(args); return destination;}
  };
  const game = {map, monsters: [], projectiles: [], skillEffects: [], spawnItemText() {}};
  const cast = id => context.window.SkillRegistry.execute(id, player, game);
  return {player, game, cast, sounds, lookups, setDestination(value) {destination = value;}, Foothold: context.window.Foothold};
}

test('dead characters cannot attack, buff, teleport or flash-jump and spend no MP', () => {
  const {player, cast, sounds, game} = fixture();
  player.hp = 0;
  const mp = player.mp;
  for (const id of ['power_strike', 'iron_body', 'teleport', 'flash_jump']) assert.equal(cast(id), false, id);
  assert.equal(player.mp, mp);
  assert.equal(player.attackTimer, 0);
  assert.equal(player.x, 100);
  assert.equal(game.projectiles.length, 0);
  assert.equal(sounds.length, 0);
});

test('hanging characters cannot cast actions that would leave stale rope state or spend MP', () => {
  const {player, cast, sounds} = fixture();
  const rope = {x: 100, top: 0, bottom: 200};
  player.onLadder = true;
  player.currentLadder = rope;
  const mp = player.mp;
  for (const id of ['power_strike', 'iron_body', 'teleport', 'flash_jump']) assert.equal(cast(id), false, id);
  assert.equal(player.onLadder, true);
  assert.equal(player.currentLadder, rope);
  assert.equal(player.mp, mp);
  assert.equal(player.x, 100);
  assert.equal(sounds.length, 0);
});

test('weakness blocks flash jump before MP is charged', () => {
  const {player, cast, sounds} = fixture();
  player.weakenedTimer = 1;
  const mp = player.mp;
  assert.equal(cast('flash_jump'), false);
  assert.equal(player.mp, mp);
  assert.equal(sounds.length, 0);
});

test('ground teleport reattaches only to a same-height destination foothold', () => {
  const {player, cast, sounds, lookups, setDestination, Foothold} = fixture();
  const destination = new Foothold('destination', 200, 98, 300, 108);
  player.onGround = true;
  player.currentFoothold = new Foothold('old', 50, 100, 150, 100);
  player.currentLadder = {x: 100};
  setDestination(destination);
  const mp = player.mp;
  assert.equal(cast('teleport'), true);
  assert.equal(player.x, 230);
  assert.equal(player.y, destination.getYAtX(230));
  assert.equal(player.onGround, true);
  assert.equal(player.currentFoothold, destination);
  assert.equal(player.currentLadder, null);
  assert.equal(player.vy, 0);
  assert.equal(player.mp, mp - 8);
  assert.equal(lookups.length, 1);
  assert.equal(lookups[0][0], 230);
  assert.equal(lookups[0][1], 100);
  assert.equal(lookups[0][2], 16);
  assert.equal(sounds.at(-1), 'playFlashJump');
});

test('teleporting beyond a ledge releases ground without warping down to a lower floor', () => {
  const {player, cast, lookups, Foothold} = fixture();
  player.onGround = true;
  player.currentFoothold = new Foothold('old', 50, 100, 150, 100);
  assert.equal(cast('teleport'), true);
  assert.equal(player.x, 230);
  assert.equal(player.y, 100);
  assert.equal(player.onGround, false);
  assert.equal(player.currentFoothold, null);
  assert.equal(lookups[0][1], 100);
});

test('airborne teleport preserves height and velocity even if a nearby platform is available', () => {
  const {player, cast, lookups, setDestination, Foothold} = fixture();
  const platform = new Foothold('platform', 200, 100, 300, 100);
  setDestination(platform);
  player.onGround = false;
  player.currentFoothold = platform; // Stale contact must not be retained.
  player.y = 92;
  player.vx = 2;
  player.vy = -4;
  assert.equal(cast('teleport'), true);
  assert.equal(player.x, 230);
  assert.equal(player.y, 92);
  assert.equal(player.vx, 2);
  assert.equal(player.vy, -4);
  assert.equal(player.onGround, false);
  assert.equal(player.currentFoothold, null);
  assert.equal(lookups.length, 0);
});

test('teleport clamps to both map boundaries using the character half-width', () => {
  for (const [facing, x] of [['left', 25], ['right', 475]]) {
    const {player, cast, game} = fixture();
    player.x = x;
    player.facing = facing;
    assert.equal(cast('teleport'), true);
    assert.equal(player.x, facing === 'left' ? player.width / 2 : game.map.width - player.width / 2);
  }
});

test('rejected attack cooldown remains rejected without side effects or resource use', () => {
  const {player, cast, sounds, game} = fixture();
  player.attackTimer = 0.2;
  const mp = player.mp;
  assert.equal(cast('power_strike'), false);
  assert.equal(player.mp, mp);
  assert.equal(player.attackTimer, 0.2);
  assert.equal(game.skillEffects.length, 0);
  assert.equal(sounds.length, 0);
});
