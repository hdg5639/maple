// js/combat.js - Unified Combat System adhering to SOLID Principles
// (SRP: Combat calculation & hit detection; LSP: Uniform IDamageable treatment; OCP: Extensible target querying)

class CombatSystem {
  /**
   * Standard AABB overlap check between two bounding rectangles
   */
  static checkAABB(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  /**
   * Continuous Swept AABB check to completely prevent projectile tunneling through small targets
   */
  static checkSweptAABB(prevX, prevY, curX, curY, box, padX = 8, padY = 12) {
    return this.getSweptHitTime(prevX, prevY, curX, curY, box, padX, padY) !== null;
  }

  /** First segment entry into the target expanded by the projectile's half-size. */
  static getSweptHitTime(prevX, prevY, curX, curY, box, padX = 8, padY = 12) {
    const values = [prevX, prevY, curX, curY, box.x, box.y, box.width, box.height, padX, padY];
    if (!values.every(Number.isFinite)) return null;

    let entry = 0;
    let exit = 1;
    const axes = [
      [prevX, curX - prevX, box.x - padX, box.x + box.width + padX],
      [prevY, curY - prevY, box.y - padY, box.y + box.height + padY]
    ];
    for (const [start, delta, min, max] of axes) {
      if (delta === 0) {
        if (start < min || start > max) return null;
        continue;
      }
      const t1 = (min - start) / delta;
      const t2 = (max - start) / delta;
      entry = Math.max(entry, Math.min(t1, t2));
      exit = Math.min(exit, Math.max(t1, t2));
      if (entry > exit) return null;
    }
    return entry;
  }

  /**
   * Maple Accuracy vs Avoidance check
   * Guaranteed hit when target level <= attacker level (eliminates beginner frustration)
   */
  static checkHit(attacker, target) {
    if (!target) return true;
    const targetLv = target.getLevel ? target.getLevel() : (target.level || 1);
    const attackerLv = attacker.level || 1;

    if (targetLv <= attackerLv) return true;

    const avoid = target.getAvoid ? target.getAvoid() : (target.avoid || 5);
    const levelDiff = Math.max(0, targetLv - attackerLv);
    const needAcc = Math.floor(avoid * (1.84 + 0.07 * levelDiff));
    const acc = attacker.accuracy || 10;

    if (acc >= needAcc) return true;
    const hitRate = Math.max(0.50, acc / needAcc);
    return Math.random() < hitRate;
  }

  /**
   * Classic Maple Damage formula with Job-specific Crit Rates
   */
  static calculateDamage(attacker, multiplier = 1.0, target = null) {
    const minAtk = attacker.minAtk || 5;
    const maxAtk = attacker.maxAtk || 10;
    const range = maxAtk - minAtk;
    const base = minAtk + Math.floor(Math.random() * (range + 1));

    const critRate = attacker.job === '도적' ? 0.45 : (attacker.job === '궁수' ? 0.35 : 0.22);
    const isCrit = Math.random() < critRate;
    const scaled = isCrit ? Math.floor(base * 1.6) : base;

    const targetDef = target ? (target.getDefense ? target.getDefense() : (target.def || 0)) : 0;
    const finalDmg = Math.max(1, Math.floor(scaled * multiplier - targetDef * 0.5));

    return { damage: finalDmg, isCrit };
  }

  /**
   * Polymorphic target collection adhering to Liskov Substitution Principle (LSP)
   * Both standard monsters, Mushmom, and multi-part Zakum Boss expose the same IDamageable interface.
   */
  static getAllDamageableTargets(game) {
    const targets = [];
    if (game.boss && game.boss.isAlive()) {
      targets.push(game.boss);
    }
    for (const m of game.monsters) {
      if (m.isAlive()) {
        targets.push(m);
      }
    }
    return targets;
  }

  /**
   * Execute Melee Hitbox resolution across all damageable entities
   */
  static executeMeleeAttack(attacker, hitBox, multiplier = 1.0, game, options = {}) {
    const maxTargets = options.maxTargets || 1;
    const hitsPerTarget = options.hitsPerTarget || 1;
    const hitDelay = options.hitDelay || 110;
    const sound = options.sound || null;

    if (sound && window.audio) {
      window.audio[sound]?.();
    }

    const targets = this.getAllDamageableTargets(game);
    let totalHitCount = 0;

    for (const target of targets) {
      if (!target.isAlive()) continue;

      // Polymorphic hitboxes: single target returns 1 box, multi-part boss returns multiple boxes
      const targetBoxes = target.getHitBoxes ? target.getHitBoxes() : [target.getHitBox()];
      let hitBoxHit = false;
      let matchedBox = null;

      for (const tBox of targetBoxes) {
        if (this.checkAABB(hitBox, tBox)) {
          hitBoxHit = true;
          matchedBox = tBox;
          break;
        }
      }

      if (hitBoxHit) {
        // Accuracy Check
        if (!this.checkHit(attacker, target)) {
          const spawnX = matchedBox ? matchedBox.x + matchedBox.width / 2 : target.x;
          const spawnY = matchedBox ? matchedBox.y : target.y - 20;
          game.spawnMissText(spawnX, spawnY);
          totalHitCount++;
          if (totalHitCount >= maxTargets) break;
          continue;
        }

        // Multi-hit resolution
        for (let hitIdx = 0; hitIdx < hitsPerTarget; hitIdx++) {
          const delayMs = hitIdx * hitDelay;
          const applyHit = () => {
            if (!target.isAlive()) return;
            const { damage, isCrit } = this.calculateDamage(attacker, multiplier, target);
            target.takeDamage(damage, isCrit, attacker.facing, game, matchedBox);

            const spawnX = (matchedBox ? matchedBox.x + matchedBox.width / 2 : target.x) + (hitIdx * 12 - 6);
            const spawnY = (matchedBox ? matchedBox.y : target.y - (target.height || 30) * 0.75) - hitIdx * 14;
            game.spawnStaggeredDamage(spawnX, spawnY, damage, isCrit);
          };

          if (delayMs === 0) {
            applyHit();
          } else {
            setTimeout(applyHit, delayMs);
          }
        }

        totalHitCount++;
        if (totalHitCount >= maxTargets) break;
      }
    }

    return totalHitCount > 0;
  }

  /**
   * Swept Projectile Collision Resolution adhering to LSP
   */
  static resolveProjectileCollision(projectile, game) {
    if (projectile.hit) return false;

    const targets = this.getAllDamageableTargets(game);
    let firstHit = null;

    for (const target of targets) {
      if (!target.isAlive()) continue;

      const targetBoxes = target.getHitBoxes ? target.getHitBoxes() : [target.getHitBox()];

      for (const tBox of targetBoxes) {
        const time = this.getSweptHitTime(projectile.prevX, projectile.prevY, projectile.x, projectile.y, tBox);
        if (time !== null && (!firstHit || time < firstHit.time)) {
          firstHit = { target, box: tBox, time };
        }
      }
    }

    if (!firstHit) return false;
    const { target, box: tBox } = firstHit;
    projectile.hit = true;

    // Accuracy is evaluated for the first contacted target, not the array's first entry.
    if (projectile.owner && !this.checkHit(projectile.owner, target)) {
      game.spawnMissText(tBox.x + tBox.width / 2, tBox.y);
      return true;
    }

    const targetDef = target.getDefense ? target.getDefense() : (target.def || 0);
    const finalDmg = Math.max(1, Math.floor(projectile.damage - targetDef * 0.5));
    const hitDir = projectile.vx >= 0 ? 'right' : 'left';
    target.takeDamage(finalDmg, projectile.isCrit, hitDir, game, tBox);
    game.spawnStaggeredDamage(tBox.x + tBox.width / 2, tBox.y, finalDmg, projectile.isCrit);
    return true;
  }
}

window.CombatSystem = CombatSystem;
