// js/physics.js - Line Segment Foothold Physics & Fixed 60Hz Timestep Engine

class Foothold {
  constructor(id, x1, y1, x2, y2, canDropThrough = true, type = 'platform') {
    this.id = id;
    // Guarantee x1 <= x2
    if (x1 <= x2) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
    } else {
      this.x1 = x2;
      this.y1 = y2;
      this.x2 = x1;
      this.y2 = y1;
    }
    this.canDropThrough = canDropThrough;
    this.type = type;
    this.length = Math.hypot(this.x2 - this.x1, this.y2 - this.y1);
    this.width = Math.abs(this.x2 - this.x1);
    this.isProp = this.type === 'prop'; // Short WZ slope segments are real terrain, not decorations.
  }

  // Calculate Y coordinate on the slope at given X
  getYAtX(x) {
    if (this.x1 === this.x2) return this.y1;
    // Clamp X to segment bounds so it NEVER returns null or NaN!
    const clampedX = Math.max(this.x1, Math.min(this.x2, x));
    const t = (clampedX - this.x1) / (this.x2 - this.x1);
    return this.y1 + (this.y2 - this.y1) * t;
  }
}

class Physics {
  static GRAVITY = 0.52;
  static MAX_FALL_SPEED = 12.0;
  static JUMP_VELOCITY = -9.8;
  static AIR_ACCEL = 0.18;
  static GROUND_ACCEL = 0.65;
  static FRICTION = 0.82;
  static LADDER_SNAP_RANGE = 12;
  static FIXED_STEP = 1 / 60; // 60Hz fixed physics step

  // Fixed timestep accumulator update
  static updateEntityFixed(entity, map, dt) {
    if (!entity.accumulator) entity.accumulator = 0;
    entity.accumulator += Math.min(dt, 0.1);

    while (entity.accumulator >= Physics.FIXED_STEP) {
      Physics.stepFixed(entity, map, Physics.FIXED_STEP);
      entity.accumulator -= Physics.FIXED_STEP;
    }
  }

  static attachToLadder(entity, ladder) {
    entity.onLadder = true;
    entity.currentLadder = ladder;
    entity.onGround = false;
    entity.currentFoothold = null;
    entity.x = ladder.x;
    entity.y = Math.max(ladder.top, Math.min(ladder.bottom, entity.y));
    entity.vx = 0;
    entity.vy = 0;
    entity.dropThroughTimer = 0;
    entity.dropThroughFoothold = null;
  }

  static detachFromLadder(entity) {
    entity.onLadder = false;
    entity.currentLadder = null;
    entity.onGround = false;
    entity.currentFoothold = null;
    entity.ladderCooldown = 0.25;
  }

  static findLadderFoothold(map, ladder, end = 'top') {
    return map.findFootholdNear(ladder.x, ladder[end], 16);
  }

  static landOnFoothold(entity, foothold) {
    entity.onGround = true;
    entity.currentFoothold = foothold;
    entity.y = foothold.getYAtX(entity.x);
    entity.vy = 0;
    entity.dropThroughTimer = 0;
    entity.dropThroughFoothold = null;
    entity.dropThroughUntilY = null;
  }

  static finishLadder(entity, map, end = 'top') {
    const ladder = entity.currentLadder;
    if (!ladder) return false;
    const foothold = Physics.findLadderFoothold(map, ladder, end);
    entity.x = ladder.x;
    entity.y = ladder[end];
    entity.vy = 0;
    if (!foothold && end === 'top') return false; // An open rope tip remains grabbable.
    Physics.detachFromLadder(entity);
    if (foothold) Physics.landOnFoothold(entity, foothold);
    return Boolean(foothold);
  }

  static applyHorizontalInput(entity, stepTime) {
    if (!Number.isFinite(entity.horizontalInput)) return;
    if (entity.horizontalImpulseTimer > 0) {
      entity.horizontalImpulseTimer = Math.max(0, entity.horizontalImpulseTimer - stepTime);
      return;
    }
    const direction = entity.hp <= 0 ? 0 : entity.horizontalInput;
    if (entity.onGround) {
      if (!direction) {
        entity.vx *= Physics.FRICTION;
        if (Math.abs(entity.vx) < 0.05) entity.vx = 0;
      } else {
        const target = direction * entity.walkSpeed;
        entity.vx += Math.max(-Physics.GROUND_ACCEL, Math.min(Physics.GROUND_ACCEL, target - entity.vx));
      }
    } else if (direction && direction * entity.vx < entity.walkSpeed) {
      // Air steering never erases the momentum of a rope kick or flash jump.
      entity.vx += direction * Math.min(Physics.AIR_ACCEL, entity.walkSpeed - direction * entity.vx);
    }
  }

  static followGround(entity, map) {
    let foothold = entity.currentFoothold;
    for (let i = 0; foothold && i <= map.footholds.length; i++) {
      if (entity.x >= foothold.x1 && entity.x <= foothold.x2) {
        entity.currentFoothold = foothold;
        entity.y = foothold.getYAtX(entity.x);
        entity.vy = 0;
        return;
      }
      const right = entity.x > foothold.x2;
      const next = map.findConnectingFoothold(foothold, entity.x, right ? 'right' : 'left');
      if (!next) {
        entity.y = right ? foothold.y2 : foothold.y1;
        break;
      }
      foothold = next;
    }
    entity.onGround = false;
    entity.currentFoothold = null;
  }

  // Intersection of the moving foot point and a one-way sloped segment.
  static landingTime(prevX, prevY, x, y, foothold) {
    const slope = (foothold.y2 - foothold.y1) / foothold.width;
    const before = prevY - (foothold.y1 + (prevX - foothold.x1) * slope);
    const after = y - (foothold.y1 + (x - foothold.x1) * slope);
    if (before > 1e-7 || after < 0 || after - before <= 1e-7) return null;
    const time = Math.max(0, -before / (after - before));
    const contactX = prevX + (x - prevX) * time;
    if (time > 1 || contactX < foothold.x1 - 1e-7 || contactX > foothold.x2 + 1e-7) return null;
    return time;
  }

  // Single 60Hz physics step. Every velocity/inertia change happens on this clock.
  static stepFixed(entity, map, stepTime = Physics.FIXED_STEP) {
    if (entity.onLadder && entity.currentLadder) {
      const ladder = entity.currentLadder;
      entity.onGround = false;
      entity.currentFoothold = null;
      entity.x = ladder.x;
      entity.vx = 0;
      entity.y += entity.vy;
      if (entity.vy < 0 && entity.y <= ladder.top + 2) Physics.finishLadder(entity, map, 'top');
      else if (entity.vy > 0 && entity.y >= ladder.bottom) Physics.finishLadder(entity, map, 'bottom');
      else entity.y = Math.max(ladder.top, Math.min(ladder.bottom, entity.y));
      return;
    }
    if (entity.onLadder) Physics.detachFromLadder(entity);
    if (!entity.currentFoothold || entity.currentFoothold.isProp || entity.currentFoothold.width === 0) {
      entity.onGround = false;
      entity.currentFoothold = null;
    }
    Physics.applyHorizontalInput(entity, stepTime);
    if (entity.dropThroughTimer > 0) entity.dropThroughTimer--;
    const prevX = entity.x;
    const prevY = entity.y;
    const halfW = (entity.width || 24) / 2;
    entity.x = Math.max(halfW, Math.min(map.width - halfW, entity.x + entity.vx));
    if (entity.x === halfW || entity.x === map.width - halfW) entity.vx = 0;

    if (entity.onGround) {
      Physics.followGround(entity, map);
    } else {
      entity.vy = Math.min(Physics.MAX_FALL_SPEED, entity.vy + Physics.GRAVITY);
      entity.y += entity.vy;
      if (entity.vy >= 0) {
        let landing = null;
        let firstTime = Infinity;
        for (const foothold of map.footholds) {
          if (foothold.isProp || foothold.width === 0) continue;
          if (entity.dropThroughTimer > 0 && entity.dropThroughFoothold) {
            const source = entity.dropThroughFoothold;
            const sourceSlope = (source.y2 - source.y1) / source.width;
            const slope = (foothold.y2 - foothold.y1) / foothold.width;
            const sameSurface = Math.abs(slope - sourceSlope) < 1e-7 &&
              Math.abs((foothold.y1 - slope * foothold.x1) - (source.y1 - sourceSlope * source.x1)) < 1e-7;
            if (foothold === source || (foothold.canDropThrough && sameSurface)) continue;
          }
          const time = Physics.landingTime(prevX, prevY, entity.x, entity.y, foothold);
          if (time !== null && time < firstTime) {
            firstTime = time;
            landing = foothold;
          }
        }
        if (landing) {
          Physics.landOnFoothold(entity, landing);
          Physics.followGround(entity, map);
          if (entity.onLand) entity.onLand();
        }
      }
    }
    if (entity.dropThroughTimer <= 0 || (entity.dropThroughUntilY != null && entity.y > entity.dropThroughUntilY)) {
      entity.dropThroughFoothold = null;
      entity.dropThroughUntilY = null;
    }
    if (entity.y > map.height + (entity.height || 36)) {
      const safe = map.findGroundFootholdAt(entity.x);
      if (safe) Physics.landOnFoothold(entity, safe);
      else {
        const spawn = map.defaultSpawn || {x: 400, y: 1300};
        entity.x = spawn.x;
        entity.y = spawn.y;
        entity.vx = 0;
        entity.vy = 0;
        const spawnFoothold = map.findGroundFootholdAt(spawn.x);
        if (spawnFoothold) Physics.landOnFoothold(entity, spawnFoothold);
      }
    }
  }

  // Ladder snap detection with top/bottom hysteresis.
  static checkLadderGrab(player, map, dir) {
    if (player.ladderCooldown > 0) {
      return null;
    }
    const snapRange = Physics.LADDER_SNAP_RANGE;
    for (const lad of map.ladders) {
      if (Math.abs(player.x - lad.x) <= snapRange) {
        const endpoint = Physics.findLadderFoothold(map, lad, dir === 'up' ? 'top' : 'bottom');
        if (player.onGround && endpoint && Math.abs(player.y - endpoint.getYAtX(lad.x)) < 1e-6) continue;
        if (dir === 'up') {
          // If already at or above platform level, pressing UP must NOT grab ladder underneath!
          if (player.y > lad.top + 6 && player.y <= lad.bottom + 15) {
            return lad;
          }
        } else if (dir === 'down') {
          // Can grab ladder going down from platform above
          if (player.y >= lad.top - 12 && player.y < lad.bottom) {
            return lad;
          }
        }
      }
    }
    return null;
  }
}

window.Foothold = Foothold;
window.Physics = Physics;
