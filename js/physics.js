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
    if (x < this.x1 || x > this.x2) return null;
    if (this.x1 === this.x2) return this.y1;
    const t = (x - this.x1) / (this.x2 - this.x1);
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
      // Horizontal friction & movement
      entity.x += entity.vx;

      // Check if player walked off the current foothold
      if (entity.x < entity.currentFoothold.x1 - 2 || entity.x > entity.currentFoothold.x2 + 2) {
        // Try to connect to an adjacent continuous foothold
        const adjacent = map.findConnectingFoothold(entity.currentFoothold, entity.x);
        if (adjacent) {
          entity.currentFoothold = adjacent;
          entity.y = adjacent.getYAtX(entity.x);
        } else {
          // Walked off ledge -> fall!
          entity.onGround = false;
          entity.currentFoothold = null;
        }
      } else {
        // Snap precisely to the slope Y
        entity.y = entity.currentFoothold.getYAtX(entity.x);
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
        for (const fh of map.footholds) {
          // Skip if player is intentionally dropping through
          if (entity.dropThroughTimer > 0 && fh.canDropThrough) {
            continue;
          }

          if (entity.x >= fh.x1 && entity.x <= fh.x2) {
            const slopeY = fh.getYAtX(entity.x);
            // Crossing the line from above
            if (prevY <= slopeY + 4 && entity.y >= slopeY - 2) {
              entity.y = slopeY;
              entity.vy = 0;
              entity.onGround = true;
              entity.currentFoothold = fh;

              // Landing impact dust callback
              if (entity.onLand) {
                entity.onLand();
              }
              break;
            }
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

    // Failsafe floor
    if (entity.y > map.height - 40) {
      entity.y = 820;
      entity.vy = 0;
      entity.onGround = true;
      entity.currentFoothold = map.groundFoothold;
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
