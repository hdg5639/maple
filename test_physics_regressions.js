// Run with: node --test test_physics_regressions.js
// These fixtures run the real engine at 60 Hz; no browser or rendering mocks alter physics.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function fixture(mapKey = 'henesys_hhg') {
  const context = vm.createContext({
    window: {
      audio: new Proxy({}, { get: () => () => {} }),
      sprites: { spawnLandingDust() {} }
    },
    Image: class {},
    performance: { now: () => 0 }
  });
  for (const name of ['map_data', 'physics', 'map', 'entities', 'autohunt']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'js', name + '.js'), 'utf8'), context,
      { filename: name + '.js' });
  }
  const { Player, Physics, Foothold } = context.window;
  const map = vm.runInContext(`new GameMap(${JSON.stringify(mapKey)})`, context);
  const player = new Player(200, 200);
  return { context, Player, Physics, Foothold, map, player };
}

function threeFloors() {
  const f = fixture();
  const { Foothold, map, player } = f;
  map.width = 1000;
  map.height = 1000;
  map.footholds = [
    new Foothold('upper', 100, 100, 300, 100),
    new Foothold('middle', 100, 200, 300, 200),
    new Foothold('floor', 0, 400, 1000, 400, false, 'ground')
  ];
  map.ladders = [{ id: 'rope', x: 200, top: 102, bottom: 200, isLadder: false }];
  player.currentFoothold = map.footholds[1];
  player.onGround = true;
  return f;
}

function tick(player, map, count = 1) {
  for (let i = 0; i < count; i++) player.update(1 / 60, map);
}

test('grabbing a rope clears the previous floor contact', () => {
  const { player, map } = threeFloors();
  player.climbUp(map);
  assert.equal(player.onLadder, true);
  assert.equal(player.onGround, false);
  assert.equal(player.currentFoothold, null);
});

test('rope ascent lands on the upper endpoint, never the bottom-most floor', () => {
  const { player, map } = threeFloors();
  for (let i = 0; i < 100; i++) {
    player.climbUp(map);
    tick(player, map);
  }
  assert.equal(player.onLadder, false);
  assert.equal(player.onGround, true);
  assert.equal(player.currentFoothold.id, 'upper');
  assert.equal(player.y, 100);
});

test('rope descent lands on its intermediate bottom endpoint', () => {
  const { player, map } = threeFloors();
  player.y = 100;
  player.currentFoothold = map.footholds[0];
  for (let i = 0; i < 45; i++) {
    player.climbDown(map);
    tick(player, map);
    if (!player.onLadder && player.ladderCooldown > 0) break;
  }
  assert.equal(player.onLadder, false);
  assert.equal(player.onGround, true);
  assert.equal(player.currentFoothold.id, 'middle');
  assert.equal(player.y, 200);
});

for (const direction of [-1, 1]) {
  test(`rope jump (${direction < 0 ? 'left' : 'right'}) rises without stale ground snap`, () => {
    const { player, map } = threeFloors();
    player.climbUp(map);
    tick(player, map, 8);
    const beforeY = player.y;
    player.jump(direction);
    tick(player, map);
    assert.equal(player.onLadder, false);
    assert.equal(player.onGround, false);
    assert.equal(player.currentFoothold, null);
    assert.ok(player.y < beforeY, `jump fell/snapped from ${beforeY} to ${player.y}`);
    assert.ok(player.vy < 0);
    assert.equal(Math.sign(player.vx), direction);
  });
}

test('jump without a horizontal direction keeps hanging on the rope', () => {
  const { player, map } = threeFloors();
  player.climbUp(map);
  tick(player, map, 8);
  player.stopVerticalClimb();
  const beforeY = player.y;
  player.jump(0);
  tick(player, map, 30);
  assert.equal(player.onLadder, true);
  assert.equal(player.y, beforeY);
  assert.equal(player.vy, 0);
});

for (const direction of ['up', 'down']) {
  test(`releasing ${direction} stops climbing and disables gravity while hanging`, () => {
    const { player, map } = threeFloors();
    player.y = 150;
    if (direction === 'up') player.climbUp(map);
    else player.climbDown(map);
    tick(player, map);
    player.stopVerticalClimb();
    const beforeY = player.y;
    tick(player, map, 30);
    assert.equal(player.onLadder, true);
    assert.equal(player.y, beforeY);
    assert.equal(player.vy, 0);
  });
}

test('one-way platforms allow ascent from below and catch the later descent', () => {
  const { player, map } = threeFloors();
  player.y = 140;
  player.onGround = false;
  player.currentFoothold = null;
  player.vy = -9.8;
  let crossedUpward = false;
  for (let i = 0; i < 90; i++) {
    tick(player, map);
    if (player.y < 100 && player.vy < 0) {
      crossedUpward = true;
      assert.equal(player.onGround, false);
    }
    if (crossedUpward && player.onGround) break;
  }
  assert.equal(crossedUpward, true);
  assert.equal(player.currentFoothold.id, 'upper');
  assert.equal(player.y, 100);
});

test('a falling entity already below a one-way platform cannot snap upward onto it', () => {
  const { player, map } = threeFloors();
  Object.assign(player, { y: 103, vy: 0, onGround: false, currentFoothold: null });
  tick(player, map);
  assert.equal(player.onGround, false);
  assert.ok(player.y > 103);
});

test('normal ground jump clears ground contact and follows an upward parabola', () => {
  const { player, map } = threeFloors();
  player.jump();
  assert.equal(player.onGround, false);
  assert.equal(player.currentFoothold, null);
  const beforeY = player.y;
  tick(player, map);
  assert.ok(player.vy < 0);
  assert.ok(player.y < beforeY);
});

test('a diagonal uphill foothold crossing is detected along the motion segment', () => {
  const { player, map, Foothold, Physics } = threeFloors();
  const slope = new Foothold('slope', 100, 200, 200, 100);
  map.footholds = [slope];
  Object.assign(player, { x: 90, y: 190, vx: 30, vy: 1, onGround: false, currentFoothold: null });
  Physics.stepFixed(player, map, 1 / 60);
  assert.equal(player.onGround, true);
  assert.equal(player.currentFoothold.id, 'slope');
  assert.equal(player.y, slope.getYAtX(player.x));
});

test('drop-through ignores the source floor but catches a nearby lower platform', () => {
  const { player, map, Foothold } = threeFloors();
  map.footholds[1] = new Foothold('nearby-lower', 100, 116, 300, 116);
  player.y = 100;
  player.currentFoothold = map.footholds[0];
  player.dropThrough();
  tick(player, map, 30);
  assert.equal(player.onGround, true);
  assert.equal(player.currentFoothold.id, 'nearby-lower');
  assert.equal(player.y, 116);
});

test('the non-droppable bottom floor never releases the player into the void', () => {
  const { player, map } = threeFloors();
  player.y = 400;
  player.currentFoothold = map.footholds[2];
  player.dropThrough();
  tick(player, map, 30);
  assert.equal(player.onGround, true);
  assert.equal(player.currentFoothold.id, 'floor');
  assert.equal(player.y, 400);
});

test('an explicit decorative prop cannot catch a falling player', () => {
  const { player, map, Foothold } = threeFloors();
  map.footholds = [new Foothold('prop', 100, 150, 300, 150, true, 'prop'), map.footholds[1]];
  Object.assign(player, { y: 140, vy: 2, onGround: false, currentFoothold: null });
  tick(player, map, 40);
  assert.equal(player.currentFoothold.id, 'middle');
  assert.equal(player.y, 200);
});

test('a short real foothold is walkable rather than classified by its width', () => {
  const { player, map, Foothold } = threeFloors();
  const narrow = new Foothold('narrow', 195, 150, 205, 150, true, 'platform');
  assert.equal(narrow.isProp, false);
  map.footholds = [narrow];
  Object.assign(player, { y: 140, vy: 2, onGround: false, currentFoothold: null });
  tick(player, map, 15);
  assert.equal(player.currentFoothold.id, 'narrow');
  assert.equal(player.y, 150);
});

test('releasing movement in mid-air preserves the knockback impulse', () => {
  const { player, map } = threeFloors();
  Object.assign(player, { y: 150, vx: 3.2, vy: -2, onGround: false, currentFoothold: null });
  player.stopHorizontal();
  tick(player, map);
  assert.ok(player.vx > 0, `airborne impulse was erased: vx=${player.vx}`);
  assert.ok(player.x > 200);
});

test('fixed-step accumulation gives the same trajectory for equal elapsed time', () => {
  const a = threeFloors();
  const b = threeFloors();
  for (const { player } of [a, b]) {
    Object.assign(player, { y: 50, vx: 1.5, vy: -3, onGround: false, currentFoothold: null });
  }
  for (let i = 0; i < 30; i++) a.player.update(1 / 60, a.map);
  for (let i = 0; i < 10; i++) b.player.update(1 / 20, b.map);
  assert.ok(Math.abs(a.player.x - b.player.x) < 1e-8);
  assert.ok(Math.abs(a.player.y - b.player.y) < 1e-8);
  assert.ok(Math.abs(a.player.vy - b.player.vy) < 1e-8);
});

test('all native and added ladder/rope tops end on their own connected foothold', () => {
  let count = 0;
  for (const key of ['henesys_hhg', 'henesys_town', 'ant_tunnel', 'ellinia', 'zakum_altar']) {
    const { map, Player, Physics } = fixture(key);
    for (const ladder of map.ladders) {
      const upper = Physics.findLadderFoothold(map, ladder, 'top');
      assert.ok(upper, `${key}/${ladder.id}: missing upper foothold`);
      const player = new Player(ladder.x, ladder.bottom);
      const limit = Math.ceil((ladder.bottom - ladder.top) / player.ladderSpeed) + 45;
      let grabbed = false;
      for (let i = 0; i < limit; i++) {
        player.climbUp(map);
        grabbed ||= player.onLadder;
        tick(player, map);
        // Holding Up may legitimately continue onto a different rope above this one.
        // Inspect this rope's first completed ascent rather than that later traversal.
        if (grabbed && !player.onLadder) break;
      }
      assert.equal(grabbed, true, `${key}/${ladder.id}: failed to grab`);
      assert.equal(player.onLadder, false, `${key}/${ladder.id}: never left rope`);
      assert.equal(player.onGround, true, `${key}/${ladder.id}: not grounded at top`);
      assert.equal(player.currentFoothold.id, upper.id, `${key}/${ladder.id}: landed on wrong floor`);
      assert.ok(Math.abs(player.y - upper.getYAtX(player.x)) < 1e-8, `${key}/${ladder.id}: top drift`);
      count++;
    }
  }
  assert.equal(count, 65);
});

test('holding Up after an isolated HHG rope ascent stays on the upper platform', () => {
  const { map, player, Physics } = fixture();
  const ladder = map.ladders.find(candidate => candidate.id === 3);
  const upper = Physics.findLadderFoothold(map, ladder, 'top');
  Object.assign(player, {x: ladder.x, y: ladder.bottom});
  for (let i = 0; i < 600; i++) {
    player.climbUp(map);
    tick(player, map);
  }
  assert.equal(player.onLadder, false);
  assert.equal(player.onGround, true);
  assert.equal(player.currentFoothold.id, upper.id);
  assert.equal(player.y, upper.getYAtX(player.x));
});

test('all native and added ladder endpoints select the nearest nearby support, never a remote floor', () => {
  let endpoints = 0;
  let unsupportedBottoms = 0;
  for (const key of ['henesys_hhg', 'henesys_town', 'ant_tunnel', 'ellinia', 'zakum_altar']) {
    const { map, Physics, Player } = fixture(key);
    for (const ladder of map.ladders) {
      for (const end of ['top', 'bottom']) {
        const endpointY = ladder[end];
        const candidates = map.footholds.filter(fh => !fh.isProp &&
          ladder.x >= fh.x1 && ladder.x <= fh.x2 &&
          Math.abs(fh.getYAtX(ladder.x) - endpointY) <= 16);
        const support = Physics.findLadderFoothold(map, ladder, end);
        if (!candidates.length) {
          assert.equal(support, null, `${key}/${ladder.id}/${end}: selected remote floor`);
          assert.equal(end, 'bottom', `${key}/${ladder.id}: missing restored upper platform`);
          unsupportedBottoms++;
          const player = new Player(ladder.x, endpointY);
          Physics.attachToLadder(player, ladder);
          const grounded = Physics.finishLadder(player, map, end);
          assert.equal(grounded, false);
          assert.equal(player.onLadder, false);
          assert.equal(player.onGround, false);
          assert.equal(player.currentFoothold, null);
          assert.equal(player.y, endpointY, `${key}/${ladder.id}: endpoint exit warped vertically`);
          assert.equal(player.vy, 0);
          Physics.stepFixed(player, map, 1 / 60);
          assert.ok(player.y > endpointY, `${key}/${ladder.id}: unsupported exit failed to fall naturally`);
        } else {
          assert.ok(support, `${key}/${ladder.id}/${end}: nearby support was missed`);
          const nearestDistance = Math.min(...candidates.map(fh => Math.abs(fh.getYAtX(ladder.x) - endpointY)));
          assert.ok(Math.abs(Math.abs(support.getYAtX(ladder.x) - endpointY) - nearestDistance) < 1e-8,
            `${key}/${ladder.id}/${end}: selected wrong nearby floor`);
        }
        endpoints++;
      }
    }
  }
  assert.equal(endpoints, 130);
  // Four original Ellinia hanging ropes intentionally have no nearby lower platform.
  assert.equal(unsupportedBottoms, 4);
});

test('hanging near either rope endpoint stays clamped for ten seconds without gravity drift', () => {
  for (const location of ['top', 'bottom']) {
    const { player, map, Physics } = threeFloors();
    const ladder = map.ladders[0];
    player.y = location === 'top' ? ladder.top + 0.25 : ladder.bottom - 0.25;
    Physics.attachToLadder(player, ladder);
    player.stopVerticalClimb();
    const beforeY = player.y;
    tick(player, map, 600);
    assert.equal(player.onLadder, true);
    assert.equal(player.onGround, false);
    assert.equal(player.currentFoothold, null);
    assert.equal(player.y, beforeY);
    assert.equal(player.x, ladder.x);
    assert.equal(player.vx, 0);
    assert.equal(player.vy, 0);
  }
});

test('a climbing physics step clamps endpoint overshoot before returning to normal movement', () => {
  for (const end of ['top', 'bottom']) {
    const { player, map, Physics } = threeFloors();
    const ladder = map.ladders[0];
    player.y = end === 'top' ? ladder.top + 1 : ladder.bottom - 1;
    Physics.attachToLadder(player, ladder);
    player.vy = end === 'top' ? -100 : 100;
    Physics.stepFixed(player, map, 1 / 60);
    assert.equal(player.onLadder, false);
    assert.equal(player.onGround, true);
    assert.equal(player.currentFoothold.id, end === 'top' ? 'upper' : 'middle');
    assert.equal(player.y, end === 'top' ? 100 : 200);
    assert.equal(player.vy, 0);
  }
});

test('ground input accelerates to walking speed and release decelerates through friction', () => {
  const { player, map } = threeFloors();
  player.moveRight();
  assert.equal(player.vx, 0, 'input must not directly assign a velocity outside the fixed step');
  tick(player, map);
  assert.ok(player.vx > 0 && player.vx < player.walkSpeed);
  tick(player, map, 10);
  assert.equal(player.vx, player.walkSpeed);
  player.stopHorizontal();
  tick(player, map);
  assert.ok(player.vx > 0 && player.vx < player.walkSpeed, 'release should brake smoothly');
  tick(player, map, 40);
  assert.equal(player.vx, 0);
});

test('air steering accelerates gradually and does not erase a larger skill impulse', () => {
  const { player, map, Physics } = threeFloors();
  Object.assign(player, { y: 30, vy: -3, onGround: false, currentFoothold: null });
  player.moveRight();
  tick(player, map);
  assert.ok(Math.abs(player.vx - Physics.AIR_ACCEL) < 1e-8);
  player.vx = 8.5;
  tick(player, map);
  assert.equal(player.vx, 8.5, 'air input clamped an existing skill boost to walk speed');
});

test('damage releases a rope and preserves the knockback against immediate opposite input', () => {
  const { player, map, Physics } = threeFloors();
  player.y = 150;
  Physics.attachToLadder(player, map.ladders[0]);
  const damage = player.takeDamage(10, null, player.x - 20);
  assert.equal(damage, 10);
  assert.equal(player.onLadder, false);
  assert.equal(player.onGround, false);
  assert.equal(player.currentFoothold, null);
  assert.ok(player.vx > 0 && player.vy < 0);
  const hp = player.hp;
  assert.equal(player.takeDamage(10, null, player.x - 20), 0, 'invulnerability did not block repeated contact');
  assert.equal(player.hp, hp);
  player.moveLeft();
  tick(player, map, 6);
  assert.ok(player.vx > 0, 'opposite input instantly cancelled hit knockback');
  assert.ok(player.x > 200);
});

test('dead players cannot initiate movement, jumps, climbing, flash jump or drop-through', () => {
  const { player, map } = threeFloors();
  player.hp = 0;
  player.moveRight();
  assert.equal(player.horizontalInput, 0);
  assert.equal(player.jump(1), false);
  assert.equal(player.flashJump(), false);
  assert.equal(player.dropThrough(map), false);
  player.climbUp(map);
  player.climbDown(map);
  tick(player, map);
  assert.equal(player.onLadder, false);
  assert.equal(player.onGround, true);
  assert.equal(player.x, 200);
  assert.equal(player.y, 200);
});

test('weakness blocks every jump variant and drop-through without changing floor contact', () => {
  const { player, map } = threeFloors();
  player.weakenedTimer = 1;
  const foothold = player.currentFoothold;
  assert.equal(player.jump(1), false);
  assert.equal(player.flashJump(), false);
  assert.equal(player.dropThrough(map), false);
  assert.equal(player.onGround, true);
  assert.equal(player.currentFoothold, foothold);
  assert.equal(player.vy, 0);
});

for (const direction of [-1, 1]) {
  test(`normal-speed ${direction < 0 ? 'left' : 'right'} walking traverses contiguous short slopes without lagging a segment`, () => {
    const { player, map, Foothold } = threeFloors();
    map.footholds = Array.from({length: 80}, (_, i) =>
      new Foothold(`slope-${i}`, 100 + i, 200 - i * 0.5, 101 + i, 199.5 - i * 0.5));
    player.x = direction > 0 ? 100.5 : 179.5;
    player.currentFoothold = map.footholds[direction > 0 ? 0 : 79];
    player.y = player.currentFoothold.getYAtX(player.x);
    player.setHorizontalInput(direction);
    for (let i = 0; i < 10; i++) {
      tick(player, map);
      assert.equal(player.onGround, true);
      assert.ok(player.x >= player.currentFoothold.x1 && player.x <= player.currentFoothold.x2);
      assert.ok(Math.abs(player.y - player.currentFoothold.getYAtX(player.x)) < 1e-8);
    }
  });
}

test('walking off a disconnected ledge releases ground contact and starts gravity next tick', () => {
  const { player, map, Foothold } = threeFloors();
  map.footholds = [new Foothold('ledge', 100, 200, 220, 200)];
  player.currentFoothold = map.footholds[0];
  player.moveRight();
  for (let i = 0; i < 40 && player.onGround; i++) tick(player, map);
  assert.equal(player.onGround, false);
  assert.equal(player.currentFoothold, null);
  tick(player, map);
  assert.ok(player.vy > 0);
  assert.ok(player.y > 200);
});

test('Game.loop sends only fixed 60 Hz steps at high and low rendering rates', () => {
  const { context } = fixture();
  context.window.addEventListener = () => {};
  context.requestAnimationFrame = () => {};
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'js', 'game.js'), 'utf8'), context,
    {filename: 'game.js'});
  const loop = vm.runInContext('Game.prototype.loop', context);
  for (const interval of [5, 25, 100]) {
    let updates = 0, renders = 0;
    const game = {lastTime: 0, simulationAccumulator: 0,
      update(dt) { assert.equal(dt, 1 / 60); updates++; }, render() { renders++; }};
    for (let time = interval; time <= 1000; time += interval) loop.call(game, time);
    assert.equal(updates, 60, `${interval}ms render interval changed simulated time`);
    assert.equal(renders, 1000 / interval);
  }
});

for (const direction of ['up', 'down']) {
  test(`auto-hunt ${direction} rope command completes only after actual endpoint landing, without a forced jump`, () => {
    const { player, map, context } = threeFloors();
    const ladder = map.ladders[0];
    const destination = map.footholds[direction === 'up' ? 0 : 1];
    if (direction === 'down') {
      player.y = 100;
      player.currentFoothold = map.footholds[0];
    }
    const manager = new context.window.AutoHuntManager({ player, map });
    manager.currentTarget = { x: 200, y: destination.getYAtX(200) };
    manager.targetType = 'monster';
    manager.commandQueue = [{ action: 'CLIMB_LADDER', ladder, dir: direction }];
    let jumps = 0;
    const jump = player.jump;
    player.jump = function(...args) { jumps++; return jump.apply(this, args); };
    let grabbed = false, completed = false;
    for (let i = 0; i < 100; i++) {
      manager.executeWaypoints(1 / 60, player, map);
      grabbed ||= player.onLadder;
      if (!manager.commandQueue.length) {
        completed = true;
        assert.equal(player.onLadder, false, 'queue finished while still attached to the rope');
        assert.equal(player.onGround, true, 'queue finished before landing');
        assert.equal(player.currentFoothold.id, destination.id, 'queue finished on another floor');
        assert.equal(player.y, destination.getYAtX(player.x));
        break;
      }
      tick(player, map);
      if (player.onLadder) assert.equal(manager.commandQueue.length, 1);
    }
    assert.equal(grabbed, true, 'waypoint never grabbed the rope');
    assert.equal(completed, true, 'waypoint never completed');
    assert.equal(jumps, 0, 'waypoint forced a jump instead of a normal endpoint exit');
  });
}

test('auto-hunt topology excludes props and vertical walls but includes short real footholds', () => {
  const { map, Foothold, context } = threeFloors();
  map.footholds.push(
    new Foothold('narrow', 198, 150, 203, 150),
    new Foothold('prop', 100, 130, 300, 130, true, 'prop'),
    new Foothold('wall', 300, 100, 300, 200)
  );
  const graph = new context.window.FootholdGraph(map);
  assert.equal(graph.nodes.has('narrow'), true);
  assert.equal(graph.nodes.has('prop'), false);
  assert.equal(graph.nodes.has('wall'), false);
  assert.equal(graph.nodes.size, 4);
  for (const [source, edges] of graph.edges) {
    assert.equal(graph.nodes.has(source), true);
    for (const edge of edges) assert.equal(graph.nodes.has(edge.targetId), true);
  }
  assert.ok(graph.edges.get('middle').some(edge => edge.type === 'ladder' && edge.targetId === 'upper'));
  assert.ok(graph.edges.get('upper').some(edge => edge.type === 'ladder' && edge.targetId === 'middle'));
});

for (const [mapKey, ladderId] of [['ant_tunnel', 1], ['henesys_hhg', 3]]) {
  test(`holding Down after ${mapKey} ladder ${ladderId} descent never re-grabs its lower endpoint`, () => {
    const { map, player, Physics } = fixture(mapKey);
    const ladder = map.ladders.find(candidate => candidate.id === ladderId);
    const upper = Physics.findLadderFoothold(map, ladder, 'top');
    const lower = Physics.findLadderFoothold(map, ladder, 'bottom');
    assert.ok(upper && lower);
    Object.assign(player, {x: ladder.x, y: upper.getYAtX(ladder.x),
      onGround: true, currentFoothold: upper});
    let grabbed = false;
    let landed = false;
    let stableTicks = 0;
    const limit = Math.ceil((ladder.bottom - ladder.top) / player.ladderSpeed) + 180;
    for (let i = 0; i < limit; i++) {
      player.climbDown(map);
      if (landed) {
        assert.equal(player.onLadder, false, `re-grabbed after ${stableTicks} stable ticks`);
        assert.equal(player.onGround, true);
        assert.equal(player.currentFoothold.id, lower.id);
        stableTicks++;
      } else {
        grabbed ||= player.onLadder;
      }
      tick(player, map);
      if (grabbed && !player.onLadder && player.onGround && player.currentFoothold.id === lower.id) {
        landed = true;
      }
    }
    assert.equal(grabbed, true, 'never began descending');
    assert.equal(landed, true, 'never reached lower support');
    assert.ok(stableTicks >= 120, 'did not test beyond the endpoint re-grab cooldown');
    assert.equal(player.y, lower.getYAtX(player.x));
    assert.equal(player.vy, 0);
  });
}

test('auto-hunt drop paths visit the blocking middle floor instead of skipping it', () => {
  const { map, Foothold, context } = threeFloors();
  map.ladders = [];
  map.footholds = [
    new Foothold('upper', 100, 100, 300, 100),
    new Foothold('middle', 100, 180, 300, 180),
    new Foothold('lower', 100, 250, 300, 250, false, 'ground')
  ];
  const graph = new context.window.FootholdGraph(map);
  assert.equal(graph.edges.get('upper').some(edge => edge.type === 'drop' && edge.targetId === 'lower'), false);
  const route = Array.from(graph.findPath('upper', 'lower'), edge => ({type: edge.type, target: edge.targetId}));
  assert.deepEqual(route, [{type: 'drop', target: 'middle'}, {type: 'drop', target: 'lower'}]);
});

test('auto-hunt drop commands stay queued until each real lower-floor landing', () => {
  const { map, player, Foothold, context } = threeFloors();
  map.ladders = [];
  map.footholds = [
    new Foothold('upper', 100, 100, 300, 100),
    new Foothold('middle', 100, 180, 300, 180),
    new Foothold('lower', 100, 250, 300, 250, false, 'ground')
  ];
  Object.assign(player, {y: 100, currentFoothold: map.footholds[0]});
  const manager = new context.window.AutoHuntManager({player, map});
  manager.currentTarget = {x: 200, y: 250};
  manager.targetType = 'monster';
  const commands = [{action: 'DROP_THROUGH', targetId: 'middle'}, {action: 'DROP_THROUGH', targetId: 'lower'}];
  manager.commandQueue = [...commands, {action: 'NAVIGATE_TO_TARGET'}];
  let dropCalls = 0;
  const dropThrough = player.dropThrough;
  player.dropThrough = function(...args) { dropCalls++; return dropThrough.apply(this, args); };
  for (const command of commands) {
    let airborne = false;
    let finished = false;
    for (let i = 0; i < 100; i++) {
      manager.executeWaypoints(1 / 60, player, map);
      if (manager.commandQueue[0] !== command) {
        finished = true;
        assert.equal(player.onGround, true, 'drop command completed in mid-air');
        assert.equal(player.currentFoothold.id, command.targetId);
        break;
      }
      assert.equal(command.started, true);
      airborne ||= !player.onGround;
      tick(player, map);
    }
    assert.equal(airborne, true, 'drop command never released its source floor');
    assert.equal(finished, true, 'drop command failed to finish after landing');
  }
  assert.equal(dropCalls, 2, 'a drop command was re-triggered while already falling');
  assert.equal(manager.commandQueue.length, 1);
  assert.equal(manager.commandQueue[0].action, 'NAVIGATE_TO_TARGET');
  assert.equal(player.y, 250);
});

test('auto-hunt discards the remaining route after inertia lands on an unexpected segment', () => {
  const { map, player, Foothold, context } = threeFloors();
  map.ladders = [];
  map.footholds = [
    new Foothold('upper', 100, 100, 300, 100),
    new Foothold('expected-left', 100, 180, 200, 180),
    new Foothold('actual-right', 200, 180, 300, 180)
  ];
  Object.assign(player, {x: 199, y: 100, vx: 3.6, currentFoothold: map.footholds[0]});
  const manager = new context.window.AutoHuntManager({player, map});
  manager.currentTarget = {x: 150, y: 180};
  manager.targetType = 'monster';
  manager.commandQueue = [
    {action: 'DROP_THROUGH', targetId: 'expected-left'},
    {action: 'NAVIGATE_TO_TARGET', stale: true}
  ];
  let replanning = false;
  for (let i = 0; i < 100; i++) {
    manager.executeWaypoints(1 / 60, player, map);
    if (!manager.commandQueue.length) {
      replanning = true;
      assert.equal(player.onGround, true);
      assert.equal(player.currentFoothold.id, 'actual-right');
      break;
    }
    tick(player, map);
  }
  assert.equal(replanning, true, 'unexpected landing retained the stale waypoint route');
  manager.executeWaypoints(1 / 60, player, map);
  assert.equal(manager.commandQueue.some(command => command.stale), false);
  let attacked = false;
  manager.triggerAttack = () => {attacked = true;};
  for (let i = 0; i < 120 && !attacked; i++) {
    manager.executeWaypoints(1 / 60, player, map);
    tick(player, map);
  }
  assert.equal(attacked, true, 'the replanned route never reached the target from the actual landing');
  assert.ok(Math.abs(player.x - 150) <= 56);
});
