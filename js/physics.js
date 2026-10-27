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
  static FRICTION = 0.82;
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

  // Single 60Hz physics step
  static stepFixed(entity, map, stepTime) {
    // 1. Ladder climbing state
    if (entity.onLadder) {
      entity.x += entity.vx;
      entity.y += entity.vy;
      entity.vx = 0;
      return;
    }

    // 2. Drop-through cooldown
    if (entity.dropThroughTimer > 0) {
      entity.dropThroughTimer--;
    }

    const prevX = entity.x;
    const prevY = entity.y;

    // 3. Ground / Slope Foothold Physics
    if (entity.onGround && entity.currentFoothold) {
      entity.x += entity.vx;

      const fh = entity.currentFoothold;
      if (entity.x > fh.x2) {
        const nextFh = map.findConnectingFoothold(fh, entity.x, 'right');
        if (nextFh) {
          entity.currentFoothold = nextFh;
          entity.y = nextFh.getYAtX(entity.x);
          entity.vy = 0;
        } else {
          // Walked off right ledge -> start falling
          entity.onGround = false;
          entity.currentFoothold = null;
          entity.y = fh.y2;
        }
      } else if (entity.x < fh.x1) {
        const prevFh = map.findConnectingFoothold(fh, entity.x, 'left');
        if (prevFh) {
          entity.currentFoothold = prevFh;
          entity.y = prevFh.getYAtX(entity.x);
          entity.vy = 0;
        } else {
          // Walked off left ledge -> start falling
          entity.onGround = false;
          entity.currentFoothold = null;
          entity.y = fh.y1;
        }
      } else {
        // Snap precisely to current foothold slope
        entity.y = fh.getYAtX(entity.x);
        entity.vy = 0;
      }
    } else {
      // 4. Airborne / Falling Physics
      entity.vy += Physics.GRAVITY;
      if (entity.vy > Physics.MAX_FALL_SPEED) {
        entity.vy = Physics.MAX_FALL_SPEED;
      }

      entity.x += entity.vx;
      entity.y += entity.vy;

      // Check foothold landing (only when falling downwards)
      if (entity.vy >= 0) {
        let bestLandingFh = null;
        let bestLandingY = Infinity;

        for (const fh of map.footholds) {
          if (entity.dropThroughTimer > 0 && fh.canDropThrough) {
            continue;
          }

          if (entity.x >= fh.x1 - 2 && entity.x <= fh.x2 + 2) {
            const slopeY = fh.getYAtX(entity.x);
            // Swept raycast check from prevY to current entity.y
            if (prevY <= slopeY + 6 && entity.y >= slopeY - 4) {
              if (slopeY < bestLandingY) {
                bestLandingY = slopeY;
                bestLandingFh = fh;
              }
            }
          }
        }

        if (bestLandingFh) {
          entity.y = bestLandingY;
          entity.vy = 0;
          entity.onGround = true;
          entity.currentFoothold = bestLandingFh;

          if (entity.onLand) {
            entity.onLand();
          }
        }
      }
    }

    // 5. Map Boundaries
    const halfW = (entity.width || 24) / 2;
    if (entity.x < halfW) {
      entity.x = halfW;
      entity.vx = 0;
    } else if (entity.x > map.width - halfW) {
      entity.x = map.width - halfW;
      entity.vx = 0;
    }

    // Failsafe floor - safely recover to closest ground foothold or default spawn
    if (entity.y > map.height - 30) {
      const safeFh = map.findGroundFootholdAt(entity.x);
      if (safeFh) {
        entity.y = safeFh.getYAtX(entity.x);
        entity.vy = 0;
        entity.onGround = true;
        entity.currentFoothold = safeFh;
      } else {
        const spawn = map.defaultSpawn || { x: 400, y: 1300 };
        entity.x = spawn.x;
        entity.y = spawn.y;
        entity.vy = 0;
        entity.onGround = true;
        entity.currentFoothold = map.findGroundFootholdAt(spawn.x);
      }
    }
  }

  // Ladder snap detection (X +- 12px)
  static checkLadderGrab(player, map, dir) {
    const snapRange = 14;
    for (const lad of map.ladders) {
      if (Math.abs(player.x - lad.x) <= snapRange) {
        if (dir === 'up') {
          if (player.y >= lad.top && player.y <= lad.bottom + 15) {
            return lad;
          }
        } else if (dir === 'down') {
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
