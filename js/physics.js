// js/physics.js - Platformer 2D Physics Engine for Classic MapleStory

class Physics {
  static GRAVITY = 0.52;
  static MAX_FALL_SPEED = 12.0;

  // Update an entity (player, monster, drop)
  static updateEntity(entity, map, dt) {
    // If on ladder, custom physics
    if (entity.onLadder) {
      entity.x += entity.vx;
      entity.y += entity.vy;
      entity.vx = 0;
      return;
    }

    // Apply gravity
    if (!entity.onGround) {
      entity.vy += Physics.GRAVITY;
      if (entity.vy > Physics.MAX_FALL_SPEED) {
        entity.vy = Physics.MAX_FALL_SPEED;
      }
    }

    // Horizontal movement
    entity.x += entity.vx;

    // Map horizontal boundaries
    const halfW = (entity.width || 20) / 2;
    if (entity.x < halfW) {
      entity.x = halfW;
      entity.vx = 0;
    } else if (entity.x > map.width - halfW) {
      entity.x = map.width - halfW;
      entity.vx = 0;
    }

    // Vertical movement
    const prevY = entity.y;
    entity.y += entity.vy;

    // Platform collision detection (only when falling downwards)
    let landed = false;
    entity.onGround = false;

    // Decrement drop through timer
    if (entity.dropThroughTimer && entity.dropThroughTimer > 0) {
      entity.dropThroughTimer--;
    }

    if (entity.vy >= 0) {
      for (const plat of map.platforms) {
        // If entity is dropping through a passable platform, skip
        if (entity.dropThroughTimer > 0 && plat.canDropThrough) {
          continue;
        }

        // Horizontal overlap
        if (entity.x >= plat.x && entity.x <= plat.x + plat.width) {
          // Vertical intersection: entity feet was above or at plat.y before, now at or below plat.y
          if (prevY <= plat.y + 4 && entity.y >= plat.y) {
            entity.y = plat.y;
            entity.vy = 0;
            entity.onGround = true;
            entity.currentPlatform = plat;
            landed = true;
            break;
          }
        }
      }
    }

    // Failsafe bottom pit
    if (entity.y > map.height - 50) {
      entity.y = 820;
      entity.vy = 0;
      entity.onGround = true;
    }
  }

  // Check if player can grab ladder
  static checkLadderGrab(player, map, dir) {
    const reach = 16;
    for (const lad of map.ladders) {
      if (Math.abs(player.x - lad.x) <= reach) {
        if (dir === 'up') {
          if (player.y >= lad.top && player.y <= lad.bottom + 15) {
            return lad;
          }
        } else if (dir === 'down') {
          if (player.y >= lad.top - 10 && player.y < lad.bottom) {
            return lad;
          }
        }
      }
    }
    return null;
  }
}

window.Physics = Physics;
