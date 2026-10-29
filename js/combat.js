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

  // Boss hit surfaces follow the baked opaque sprite pixels, including body occlusion.
  static getTargetRects(box) {
    if (!box.maskRects) return [box];
    let rectangles = box.maskRects;
    const cover = box.occluder;
    if (cover?.maskRects) {
      this.visibleMaskCache ||= new WeakMap();
      let frameCache = this.visibleMaskCache.get(rectangles);
      if (!frameCache) this.visibleMaskCache.set(rectangles, frameCache = new WeakMap());
      let visible = frameCache.get(cover.maskRects);
      if (!visible) {
        const dx = cover.drawX - box.drawX, dy = cover.drawY - box.drawY;
        const rows = new Map();
        for (const [x, y, width, height] of cover.maskRects) {
          for (let row = y + dy; row < y + dy + height; row++) {
            if (!rows.has(row)) rows.set(row, []);
            rows.get(row).push([x + dx, x + dx + width]);
          }
        }
        visible = [];
        for (const [x, y, width, height] of rectangles) {
          for (let row = y; row < y + height; row++) {
            let spans = [[x, x + width]];
            for (const [left, right] of rows.get(row) || []) {
              spans = spans.flatMap(([a, b]) => right <= a || left >= b ? [[a, b]] :
                [[a, Math.min(b, left)], [Math.max(a, right), b]].filter(([l, r]) => r > l));
              if (!spans.length) break;
            }
            for (const [left, right] of spans) visible.push([left, row, right - left, 1]);
          }
        }
        frameCache.set(cover.maskRects, visible);
      }
      rectangles = visible;
    }
    this.worldMaskCache ||= new WeakMap();
    let world = this.worldMaskCache.get(rectangles);
    if (!world || world.x !== box.drawX || world.y !== box.drawY) {
      world = {x: box.drawX, y: box.drawY, rectangles: rectangles.map(([x, y, width, height]) =>
        ({x: box.drawX + x, y: box.drawY + y, width, height}))};
      this.worldMaskCache.set(rectangles, world);
    }
    return world.rectangles;
  }

  static closestTargetPoint(box, x, y, options = {}) {
    let best = null;
    for (const rect of this.getTargetRects(box)) {
      const left = Math.max(rect.x, options.clip?.x ?? -Infinity);
      const right = Math.min(rect.x + rect.width, options.clip ? options.clip.x + options.clip.width : Infinity);
      const top = Math.max(rect.y, options.clip?.y ?? -Infinity);
      const bottom = Math.min(rect.y + rect.height, options.clip ? options.clip.y + options.clip.height : Infinity);
      if (left >= right || top >= bottom) continue;
      const pointX = Math.max(left + .01, Math.min(right - .01, x));
      const pointY = Math.max(top + .01, Math.min(bottom - .01, y));
      const distance = Math.hypot(pointX - x, pointY - y);
      if (distance > (options.range ?? Infinity) || Math.abs(pointY - y) > (options.verticalRange ?? Infinity)) continue;
      if (best && distance >= best.distance) continue;
      if (options.map && this.terrainHitTime(options.map, x, y, pointX, pointY) !== null) continue;
      best = {x: pointX, y: pointY, distance};
    }
    return best;
  }

  static getTargetHitTime(x1, y1, x2, y2, box) {
    if (this.getSweptHitTime(x1, y1, x2, y2, box) === null) return null;
    let first = null;
    for (const rect of this.getTargetRects(box)) {
      const time = this.getSweptHitTime(x1, y1, x2, y2, rect);
      if (time !== null && (first === null || time < first)) first = time;
    }
    return first;
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

  static terrainHitTime(map, x1, y1, x2, y2, includeEndpoint = false) {
    if (!map?.footholds) return null;
    const dx = x2 - x1, dy = y2 - y1;
    let first = null;
    for (const foothold of map.footholds) {
      if (foothold.isProp) continue;
      const fx = foothold.x2 - foothold.x1, fy = foothold.y2 - foothold.y1;
      const determinant = dx * fy - dy * fx;
      if (Math.abs(determinant) < 1e-9) continue;
      const qx = foothold.x1 - x1, qy = foothold.y1 - y1;
      const time = (qx * fy - qy * fx) / determinant;
      const segmentTime = (qx * dy - qy * dx) / determinant;
      if (time > 1e-6 && (includeEndpoint ? time <= 1 : time < 1 - 1e-6) && segmentTime >= 0 && segmentTime <= 1 &&
          (first === null || time < first)) first = time;
    }
    return first;
  }

  static findAutoAimTarget(attacker, game, options = {}) {
    const range = options.range || 100;
    const verticalRange = options.verticalRange || 48;
    const origin = {x: attacker.x, y: attacker.y - 16};
    const graph = game.autoHunt?.graph;
    let walkableSurface = null;
    if (graph && attacker.currentFoothold && graph.nodes.has(attacker.currentFoothold.id)) {
      walkableSurface = new Set([attacker.currentFoothold.id]);
      const queue = [attacker.currentFoothold.id];
      while (queue.length) {
        for (const edge of graph.edges.get(queue.shift()) || []) {
          if (edge.type === 'walk' && !walkableSurface.has(edge.targetId)) {
            walkableSurface.add(edge.targetId);
            queue.push(edge.targetId);
          }
        }
      }
    }
    let best = null;
    for (const target of this.getAllDamageableTargets(game)) {
      if (walkableSurface && target.currentFoothold && !walkableSurface.has(target.currentFoothold.id)) continue;
      for (const box of target.getHitBoxes ? target.getHitBoxes() : [target.getHitBox()]) {
        const point = this.closestTargetPoint(box, origin.x, origin.y, {range, verticalRange, map: game.map});
        if (!point) continue;
        const {x, y, distance} = point;
        if (!best || distance < best.distance) best = {target, part: box.target, type: box.type, x, y, box, distance};
      }
    }
    return best;
  }

  static prepareAutoAim(attacker, game, options = {}) {
    const aim = this.findAutoAimTarget(attacker, game, options);
    if (aim) {
      const direction = aim.x - attacker.x;
      if (Math.abs(direction) > 1) attacker.facing = direction > 0 ? 'right' : 'left';
    }
    return aim;
  }

  static projectileVelocity(attacker, game, aim, x, y, speed, facing = attacker.facing) {
    const fallback = {vx: (facing === 'right' ? 1 : -1) * speed, vy: 0};
    if (!aim?.target?.isAlive()) return fallback;
    const boxes = aim.target.getHitBoxes ? aim.target.getHitBoxes() : [aim.target.getHitBox()];
    const box = boxes.find(candidate => candidate.type === aim.type && candidate.target === aim.part);
    if (!box) return fallback;
    const point = this.closestTargetPoint(box, x, y, {map: game.map});
    if (!point) return fallback;
    const targetX = point.x, targetY = point.y;
    const dx = targetX - x, dy = targetY - y, distance = Math.hypot(dx, dy);
    return distance > 1e-6 ? {vx: dx / distance * speed, vy: dy / distance * speed} : fallback;
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
    const seen = new Set();
    if (game.boss && game.boss.isAlive()) {
      targets.push(game.boss);
      seen.add(game.boss);
    }
    for (const m of game.monsters) {
      if (!seen.has(m) && m.isAlive()) {
        targets.push(m);
        seen.add(m);
      }
    }
    return targets;
  }

  static applyTargetDamage(target, damage, isCrit, direction, game, box) {
    const healthTarget = box?.type === 'arm' ? box.target : target;
    const before = healthTarget?.hp;
    const applied = target.takeDamage(damage, isCrit, direction, game, box);
    if (applied === false) return false;
    // Protected, stale or destroyed parts must never produce successful damage digits.
    if (Number.isFinite(before) && Number.isFinite(healthTarget?.hp) && healthTarget.hp >= before) return false;
    return true;
  }

  /**
   * Execute Melee Hitbox resolution across all damageable entities
   */
  static executeMeleeAttack(attacker, hitBox, multiplier = 1.0, game, options = {}) {
    const maxTargets = options.maxTargets || 1;
    const hitsPerTarget = options.hitsPerTarget || 1;
    const hitDelay = (options.hitDelay || 110) / (attacker.getAttackSpeedFactor?.() || 1);
    const sound = options.sound || null;

    if (sound && window.audio) {
      window.audio[sound]?.();
    }

    const targets = this.getAllDamageableTargets(game);
    const castMap = game.map;
    const castMapKey = castMap?.currentKey;
    const castMonsters = game.monsters;
    let totalHitCount = 0;

    for (const target of targets) {
      if (!target.isAlive()) continue;

      // Polymorphic hitboxes: single target returns 1 box, multi-part boss returns multiple boxes
      const targetBoxes = target.getHitBoxes ? target.getHitBoxes() : [target.getHitBox()];
      let hitBoxHit = false;
      let matchedBox = null;
      let matchedPoint = null;

      for (const tBox of targetBoxes) {
        if (this.checkAABB(hitBox, tBox)) {
          const originY = attacker.y - 16;
          const point = this.closestTargetPoint(tBox, attacker.x, originY, {clip: hitBox, map: game.map});
          if (!point) continue;
          if (matchedPoint && point.distance >= matchedPoint.distance) continue;
          hitBoxHit = true;
          matchedBox = tBox;
          matchedPoint = point;
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
            if (!target.isAlive() || attacker.hp <= 0 || attacker.onLadder || game.map !== castMap || game.monsters !== castMonsters ||
                game.map?.currentKey !== castMapKey) return;
            const { damage, isCrit } = this.calculateDamage(attacker, multiplier, target);
            if (!this.applyTargetDamage(target, damage, isCrit, attacker.facing, game, matchedBox)) return;

            const spawnX = (matchedPoint?.x ?? target.x) + (hitIdx * 12 - 6);
            const spawnY = (matchedPoint?.y ?? target.y - 20) - hitIdx * 14;
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
        const time = this.getTargetHitTime(projectile.prevX, projectile.prevY, projectile.x, projectile.y, tBox);
        if (time !== null && (!firstHit || time < firstHit.time)) {
          firstHit = { target, box: tBox, time };
        }
      }
    }

    const terrainTime = this.terrainHitTime(game.map, projectile.prevX, projectile.prevY, projectile.x, projectile.y, true);
    if (terrainTime !== null && (!firstHit || terrainTime < firstHit.time)) {
      projectile.hit = true;
      return true;
    }
    if (!firstHit) return false;
    const { target, box: tBox, time } = firstHit;
    const hitX = projectile.prevX + (projectile.x - projectile.prevX) * time;
    const hitY = projectile.prevY + (projectile.y - projectile.prevY) * time;
    const hitPoint = this.closestTargetPoint(tBox, hitX, hitY) || {x: hitX, y: hitY};
    projectile.hit = true;

    // Accuracy is evaluated for the first contacted target, not the array's first entry.
    if (projectile.owner && !this.checkHit(projectile.owner, target)) {
      game.spawnMissText(hitPoint.x, hitPoint.y);
      return true;
    }

    const targetDef = target.getDefense ? target.getDefense() : (target.def || 0);
    const finalDmg = Math.max(1, Math.floor(projectile.damage - targetDef * 0.5));
    const hitDir = projectile.vx >= 0 ? 'right' : 'left';
    if (!this.applyTargetDamage(target, finalDmg, projectile.isCrit, hitDir, game, tBox)) return true;
    game.spawnStaggeredDamage(hitPoint.x, hitPoint.y, finalDmg, projectile.isCrit);
    return true;
  }
}

window.CombatSystem = CombatSystem;
