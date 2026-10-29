// js/autohunt.js - Foothold Topological Graph, A* Pathfinding, and Waypoint Queue Engine

class FootholdGraph {
  constructor(map) {
    this.map = map;
    this.nodes = new Map(); // footholdId -> Foothold
    this.edges = new Map(); // footholdId -> [ { targetId, type: 'walk'|'ladder'|'drop', cost, ladder, dropX } ]
    this.buildGraph();
  }

  buildGraph() {
    const walkable = this.map.footholds.filter(fh => !fh.isProp && fh.width > 0);
    walkable.forEach(fh => {
      this.nodes.set(fh.id, fh);
      this.edges.set(fh.id, []);
    });

    // 1. Add Adjacent Walk Edges
    walkable.forEach(fhA => {
      walkable.forEach(fhB => {
        if (fhA.id !== fhB.id) {
          // Check horizontal adjacency
          if (Math.abs(fhA.x2 - fhB.x1) <= 2 && Math.abs(fhA.y2 - fhB.y1) <= 6) {
            this.edges.get(fhA.id).push({ targetId: fhB.id, type: 'walk', cost: 1 });
            this.edges.get(fhB.id).push({ targetId: fhA.id, type: 'walk', cost: 1 });
          }
        }
      });
    });

    // 2. Add Ladder Edges
    this.map.ladders.forEach(lad => {
      const bottomFh = Physics.findLadderFoothold(this.map, lad, 'bottom');
      const topFh = Physics.findLadderFoothold(this.map, lad, 'top');

      if (bottomFh && topFh && bottomFh.id !== topFh.id) {
        const cost = Math.abs(lad.bottom - lad.top) * 0.1;
        this.edges.get(bottomFh.id).push({
          targetId: topFh.id,
          type: 'ladder',
          ladder: lad,
          climbDir: 'up',
          cost: cost
        });
        this.edges.get(topFh.id).push({
          targetId: bottomFh.id,
          type: 'ladder',
          ladder: lad,
          climbDir: 'down',
          cost: cost * 0.7
        });
      }
    });

    // Low native ledges are reached by an ordinary vertical jump, not a rope.
    // Validate the first descending landing so intervening platforms cannot
    // create an imaginary connection to a higher layer.
    for (const lower of walkable) for (const upper of walkable) {
      if (upper.width < 20 || lower === upper) continue;
      const left = Math.max(lower.x1, upper.x1) + 1;
      const right = Math.min(lower.x2, upper.x2) - 1;
      if (right - left < 6) continue;
      const x = (left + right) / 2, y = lower.getYAtX(x);
      const rise = y - upper.getYAtX(x);
      if (rise < 12 || rise > 90) continue;
      let footY = y, velocity = Physics.JUMP_VELOCITY, landed = null;
      for (let tick = 0; tick < 60 && !landed; tick++) {
        const previousY = footY;
        velocity += Physics.GRAVITY;
        footY += velocity;
        if (velocity < 0) continue;
        let earliest = Infinity;
        for (const foothold of walkable) {
          const time = Physics.landingTime(x, previousY, x, footY, foothold);
          if (time !== null && time < earliest) {earliest = time; landed = foothold;}
        }
      }
      if (landed?.id === upper.id) this.edges.get(lower.id).push({targetId: upper.id,
        type: 'jump', launchX: x, cost: 60 + rise * .5});
    }

    // Drop edges must stop at the first lower surface, exactly as collision does.
    for (const upper of walkable) {
      if (!upper.canDropThrough) continue;
      const overlapping = walkable.filter(lower => lower.id !== upper.id &&
        Math.max(upper.x1, lower.x1) < Math.min(upper.x2, lower.x2));
      for (const lower of overlapping) {
        const x = (Math.max(upper.x1, lower.x1) + Math.min(upper.x2, lower.x2)) / 2;
        const upperY = upper.getYAtX(x);
        const lowerY = lower.getYAtX(x);
        if (lowerY <= upperY + 1 || lowerY - upperY >= 600) continue;
        const blocked = overlapping.some(other => other.id !== lower.id && x >= other.x1 && x <= other.x2 &&
          other.getYAtX(x) > upperY + 1 && other.getYAtX(x) < lowerY - 1e-7);
        if (blocked) continue;
        this.edges.get(upper.id).push({targetId: lower.id, type: 'drop', dropX: x, cost: 1.5});
      }
    }
  }

  // A* Shortest Path between two footholds
  findPath(startFhId, targetFhId) {
    if (startFhId === targetFhId) return [];

    const openSet = [startFhId];
    const cameFrom = new Map(); // node -> { prevNode, edge }
    const gScore = new Map();
    const fScore = new Map();

    this.nodes.forEach((_, id) => {
      gScore.set(id, Infinity);
      fScore.set(id, Infinity);
    });

    gScore.set(startFhId, 0);
    const startFh = this.nodes.get(startFhId);
    const targetFh = this.nodes.get(targetFhId);
    if (!startFh || !targetFh) return [];

    fScore.set(startFhId, Math.hypot(targetFh.x1 - startFh.x1, targetFh.y1 - startFh.y1));

    while (openSet.length > 0) {
      // Find lowest fScore
      let current = openSet[0];
      let lowestF = fScore.get(current);
      let currIdx = 0;

      for (let i = 1; i < openSet.length; i++) {
        const f = fScore.get(openSet[i]);
        if (f < lowestF) {
          lowestF = f;
          current = openSet[i];
          currIdx = i;
        }
      }

      if (current === targetFhId) {
        // Reconstruct path of edges
        const path = [];
        let currNode = targetFhId;
        while (cameFrom.has(currNode)) {
          const { prevNode, edge } = cameFrom.get(currNode);
          path.unshift(edge);
          currNode = prevNode;
        }
        return path;
      }

      openSet.splice(currIdx, 1);
      const neighborEdges = this.edges.get(current) || [];

      for (const edge of neighborEdges) {
        const neighbor = edge.targetId;
        const tentativeG = gScore.get(current) + edge.cost;

        if (tentativeG < gScore.get(neighbor)) {
          cameFrom.set(neighbor, { prevNode: current, edge });
          gScore.set(neighbor, tentativeG);

          const neighborFh = this.nodes.get(neighbor);
          const h = Math.hypot(targetFh.x1 - neighborFh.x1, targetFh.y1 - neighborFh.y1);
          fScore.set(neighbor, tentativeG + h);

          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    return []; // No path found
  }
}

class AutoHuntManager {
  constructor(game) {
    this.game = game;
    this.enabled = false;
    this.graph = new FootholdGraph(game.map);

    this.config = {
      hpPotionThreshold: 0.55,
      mpPotionThreshold: 0.40,
      autoLoot: true,
      useSkills: true,
      searchRadius: 1200
    };

    this.currentTarget = null;
    this.targetType = null;
    this.bossTargetPlan = null;
    this.commandQueue = []; // Array of actionable waypoint commands

    // Anti-Stuck Tracking (0.5s with displacement < 10px)
    this.stuckTimer = 0;
    this.lastRecordedX = 0;
    this.lastRecordedY = 0;
    this.pathRecalcCooldown = 0;

    // Analytics
    this.stats = {
      startTime: null,
      duration: 0,
      kills: 0,
      expGained: 0,
      mesosGained: 0,
      potionsUsed: 0,
      expPerMin: 0,
      mesoPerMin: 0
    };
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.stats.startTime = Date.now();
      this.commandQueue = [];
      this.game.spawnItemText(this.game.player.x, this.game.player.y - 50, '★ 지능형 자동사냥 ON ★');
    } else {
      this.game.player.stopHorizontal();
      this.game.player.stopVerticalClimb();
      this.currentTarget = null;
      this.commandQueue = [];
      this.game.spawnItemText(this.game.player.x, this.game.player.y - 50, '자동사냥 정지');
    }
    this.updateUI();
    return this.enabled;
  }

  recordKill(exp, mesos = 0) {
    if (!this.enabled) return;
    this.stats.kills++;
    this.stats.expGained += exp;
    this.stats.mesosGained += mesos;
    this.calculateRates();
  }

  calculateRates() {
    if (!this.stats.startTime) return;
    const elapsedMinutes = Math.max(0.05, (Date.now() - this.stats.startTime) / 60000);
    this.stats.expPerMin = Math.round(this.stats.expGained / elapsedMinutes);
    this.stats.mesoPerMin = Math.round(this.stats.mesosGained / elapsedMinutes);
    this.stats.duration = Math.floor((Date.now() - this.stats.startTime) / 1000);
  }

  update(dt) {
    if (!this.enabled) return;

    this.calculateRates();
    const player = this.game.player;
    const map = this.game.map;

    // 1. Auto Potion Survival
    this.checkSurvival(player);

    // 2. Anti-Stuck Detection (Displacement < 10px over 0.5s)
    this.checkAntiStuck(dt, player);

    // 3. Target Evaluation
    if (!this.currentTarget || !this.isTargetValid(this.currentTarget)) {
      this.selectTarget(player);
      this.buildWaypointPath(player);
    } else if (this.isMultipartBoss(this.currentTarget) && !this.getBossTargetBox()) {
      this.bossTargetPlan = this.planBossPart(player, this.currentTarget);
      this.buildWaypointPath(player);
    }

    // 4. Execute Waypoint Navigation Queue
    this.executeWaypoints(dt, player, map);
  }

  checkSurvival(player) {
    if (player.hp / player.maxHp < this.config.hpPotionThreshold) {
      const used = player.usePotion('red_potion');
      if (used) this.stats.potionsUsed++;
    }
    if (player.mp / player.maxMp < this.config.mpPotionThreshold) {
      const used = player.usePotion('blue_potion');
      if (used) this.stats.potionsUsed++;
    }
  }

  checkAntiStuck(dt, player) {
    if (!this.currentTarget || !this.isTargetValid(this.currentTarget) || !this.commandQueue.length) {
      this.stuckTimer = 0;
      this.lastRecordedX = player.x;
      this.lastRecordedY = player.y;
      return;
    }
    if (this.bossTargetPlan && !player.onLadder && player.onGround &&
        this.canAttackBossPart(player, this.getBossTargetBox())) {
      this.stuckTimer = 0;
      this.lastRecordedX = player.x;
      this.lastRecordedY = player.y;
      return; // Holding a firing position is productive, not a navigation failure.
    }
    const dist = Math.hypot(player.x - this.lastRecordedX, player.y - this.lastRecordedY);
    if (dist < 10) {
      this.stuckTimer += dt;
      if (this.stuckTimer >= 0.5) {
        // Unstuck routine: flush commands, random leap & recalculate!
        this.commandQueue = [];
        this.stuckTimer = 0;
        if (Math.random() < 0.5) player.jump();
        else player.dropThrough();
        this.selectTarget(player);
        this.buildWaypointPath(player);
      }
    } else {
      this.stuckTimer = 0;
      this.lastRecordedX = player.x;
      this.lastRecordedY = player.y;
    }
  }

  isTargetValid(target) {
    if (this.targetType === 'monster') {
      return target && target.isAlive() && (target === this.game.boss || this.game.monsters.includes(target));
    } else if (this.targetType === 'drop') {
      return this.game.drops.includes(target) && target.life > 0;
    }
    return false;
  }

  selectTarget(player) {
    this.bossTargetPlan = null;
    // A. Priority: Nearby Drops
    if (this.config.autoLoot && this.game.drops.length > 0) {
      let closestDrop = null;
      let minDist = 300;
      for (const d of this.game.drops) {
        const dist = Math.hypot(d.x - player.x, d.y - player.y);
        if (dist < minDist) {
          minDist = dist;
          closestDrop = d;
        }
      }
      if (closestDrop) {
        this.currentTarget = closestDrop;
        this.targetType = 'drop';
        return;
      }
    }

    // B. Alive Monster with distance scoring
    let bestMonster = null;
    let bestBossPlan = null;
    let minScore = Infinity;

    const monsters = [...new Set([this.game.boss, ...this.game.monsters])].filter(Boolean);
    for (const m of monsters) {
      if (!m.isAlive()) continue;
      const bossPlan = this.isMultipartBoss(m) ? this.planBossPart(player, m) : null;
      if (this.isMultipartBoss(m) && !bossPlan) continue;
      const dx = m.x - player.x;
      const dy = m.y - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > this.config.searchRadius) continue;
      let score = dist + Math.abs(dy) * 2.0;
      if (bossPlan) score = bossPlan.cost;
      if (m.type === 'mushmom') score -= 300;

      if (score < minScore) {
        minScore = score;
        bestMonster = m;
        bestBossPlan = bossPlan;
      }
    }

    this.currentTarget = bestMonster;
    this.targetType = bestMonster ? 'monster' : null;
    this.bossTargetPlan = bestBossPlan;
  }

  isMultipartBoss(target) {
    return Boolean(target && Array.isArray(target.arms) && typeof target.getPartGeometry === 'function');
  }

  getAttackRange(player) {
    if (!this.config.useSkills) return 75;
    const skill = SkillRegistry.get(player.getPrimarySkillId());
    if (skill?.id === 'power_strike') return 95;
    if (skill?.id === 'magic_claw') return 130;
    return skill?.aimProfile?.range || 75;
  }

  getBossTargetBox() {
    const plan = this.bossTargetPlan;
    if (!plan || this.currentTarget !== plan.boss || !plan.boss.isAlive()) return null;
    return plan.boss.getHitBoxes().find(box => box.type === plan.type && box.target === plan.part) || null;
  }

  canAttackBossPart(player, box) {
    if (!box) return false;
    const range = this.getAttackRange(player);
    const skillId = this.config.useSkills ? player.getPrimarySkillId() : null;
    const ranged = ['three_snails', 'arrow_blow', 'double_shot', 'lucky_seven', 'energy_bolt'].includes(skillId);
    const top = player.y - (ranged ? 64 : (skillId ? 55 : 48));
    const bottom = player.y + (ranged ? 32 : 8);
    const clip = {x: player.x - range, y: top, width: range * 2, height: bottom - top};
    if (!CombatSystem.checkAABB(clip, box)) return false;
    return Boolean(CombatSystem.closestTargetPoint(box, player.x, player.y - 16,
      {clip, range: ranged ? range : Infinity, map: this.game.map}));
  }

  planBossPart(player, boss) {
    const start = this.findCurrentFoothold(player);
    if (!start || !this.graph.nodes.has(start.id)) return null;
    const reachable = new Map([[start.id, 0]]);
    const queue = [{id: start.id, cost: 0}];
    while (queue.length) {
      queue.sort((a, b) => a.cost - b.cost);
      const node = queue.shift();
      if (node.cost !== reachable.get(node.id)) continue;
      for (const edge of this.graph.edges.get(node.id) || []) {
        const cost = node.cost + edge.cost;
        if (cost < (reachable.get(edge.targetId) ?? Infinity)) {
          reachable.set(edge.targetId, cost);
          queue.push({id: edge.targetId, cost});
        }
      }
    }
    let best = null;
    const range = this.getAttackRange(player) - 4;
    for (const box of boss.getHitBoxes()) {
      for (const [id, foothold] of this.graph.nodes) {
        if (!reachable.has(id)) continue;
        const left = Math.max(foothold.x1 + 1, box.x - range);
        const right = Math.min(foothold.x2 - 1, box.x + box.width + range);
        if (right < left) continue;
        const candidates = [Math.max(left, Math.min(right, player.x)), left, right];
        for (let x = left + 16; x < right; x += 16) candidates.push(x);
        for (const x of candidates) {
          const y = foothold.getYAtX(x);
          if (!this.canAttackBossPart(Object.assign(Object.create(player), {x, y}), box)) continue;
          const cost = Math.hypot(x - player.x, y - player.y) + reachable.get(id) * 3;
          if (!best || cost < best.cost) best = {boss, part: box.target, type: box.type, foothold,
            x, y, cost};
        }
      }
    }
    // Native Zakum platforms leave a gap to the upper hands. Simulate a real
    // running jump, rather than inventing a foothold or attacking empty padding.
    if (!best) for (const box of boss.getHitBoxes()) {
      for (const [id, foothold] of this.graph.nodes) {
        if (!reachable.has(id) || foothold.width < 20) continue;
        const direction = box.x + box.width / 2 > (foothold.x1 + foothold.x2) / 2 ? 1 : -1;
        const x = direction > 0 ? foothold.x2 - 5 : foothold.x1 + 5;
        const y = foothold.getYAtX(x);
        if (Math.abs(y - box.y) > 200) continue;
        const probe = Object.assign(Object.create(player), {x, y, vx: direction * player.walkSpeed,
          vy: player.jumpForce, onGround: false, onLadder: false, currentFoothold: null,
          currentLadder: null, horizontalInput: direction, onLand: null, dropThroughTimer: 0});
        for (let tick = 1; tick <= 60; tick++) {
          Physics.stepFixed(probe, this.game.map);
          if (probe.onGround) break;
          if (!this.canAttackBossPart(probe, box)) continue;
          const cost = Math.hypot(x - player.x, y - player.y) + reachable.get(id) * 3 + tick * 4 + 100;
          if (!best || cost < best.cost) best = {boss, part: box.target, type: box.type, foothold,
            x, y, cost, jump: {direction, attackX: probe.x, started: false}};
          break;
        }
      }
    }
    return best;
  }

  findCurrentFoothold(entity) {
    if (entity.currentFoothold && this.graph.nodes.has(entity.currentFoothold.id)) return entity.currentFoothold;
    for (const fh of this.game.map.footholds) {
      if (fh.isProp || fh.width === 0) continue;
      if (entity.x >= fh.x1 && entity.x <= fh.x2) {
        const sy = fh.getYAtX(entity.x);
        if (Math.abs(sy - entity.y) <= 18) {
          return fh;
        }
      }
    }
    return this.game.map.groundFoothold;
  }

  buildWaypointPath(player) {
    this.commandQueue = [];
    if (!this.currentTarget) return;

    const startFh = this.findCurrentFoothold(player);
    const targetFh = this.isMultipartBoss(this.currentTarget)
      ? this.bossTargetPlan?.foothold : this.findCurrentFoothold(this.currentTarget);

    if (!startFh || !targetFh) return;

    if (startFh.id === targetFh.id) {
      // Same foothold -> directly navigate to target X
      this.commandQueue.push({ action: 'NAVIGATE_TO_TARGET' });
      return;
    }

    // A* Pathfinding between footholds
    const edges = this.graph.findPath(startFh.id, targetFh.id);

    if (edges.length === 0) {
      this.commandQueue.push({ action: 'NAVIGATE_TO_TARGET' });
      return;
    }

    // Convert edges into concrete commands
    for (const edge of edges) {
      if (edge.type === 'ladder') {
        this.commandQueue.push({ action: 'MOVE_TO_X', x: edge.ladder.x });
        this.commandQueue.push({ action: 'CLIMB_LADDER', ladder: edge.ladder, dir: edge.climbDir });
      } else if (edge.type === 'drop') {
        this.commandQueue.push({ action: 'MOVE_TO_X', x: edge.dropX });
        this.commandQueue.push({ action: 'DROP_THROUGH', targetId: edge.targetId });
      } else if (edge.type === 'jump') {
        this.commandQueue.push({action: 'JUMP_TO_FOOTHOLD', targetId: edge.targetId, launchX: edge.launchX});
      } else if (edge.type === 'walk') {
        // Connected WZ floors can contain dozens of 1–10px segments. Their
        // centers are not waypoints: the next ladder/drop/final target already
        // supplies the destination on this continuous walking surface.
      }
    }

    this.commandQueue.push({ action: 'NAVIGATE_TO_TARGET' });
  }

  executeWaypoints(dt, player, map) {
    if (!this.currentTarget) {
      player.stopHorizontal();
      return;
    }

    const tx = this.currentTarget.x;
    const ty = this.currentTarget.y;

    // Execute current command in queue
    const cmd = this.commandQueue[0];
    if (!cmd) {
      this.buildWaypointPath(player);
      return;
    }

    if (cmd.action === 'MOVE_TO_X') {
      const dx = cmd.x - player.x;
      if (Math.abs(dx) <= 10) {
        player.stopHorizontal();
        this.commandQueue.shift(); // Finished command
      } else {
        if (dx > 0) player.moveRight();
        else player.moveLeft();
      }
      return;
    }

    if (cmd.action === 'CLIMB_LADDER') {
      const destination = Physics.findLadderFoothold(map, cmd.ladder, cmd.dir === 'up' ? 'top' : 'bottom');
      if (!player.onLadder && player.onGround && destination && player.currentFoothold?.id === destination.id) {
        this.commandQueue.shift();
        return;
      }
      if (!player.onLadder) {
        if (Math.abs(player.x - cmd.ladder.x) > 10) {
          player.setHorizontalInput(Math.sign(cmd.ladder.x - player.x));
          return;
        }
        if (cmd.dir === 'up') player.climbUp(map);
        else player.climbDown(map);
      } else {
        if (cmd.dir === 'up') {
          player.climbUp(map);
        } else {
          player.climbDown(map);
        }
      }
      return;
    }

    if (cmd.action === 'DROP_THROUGH') {
      player.stopHorizontal();
      if (!cmd.started) {
        cmd.started = player.dropThrough(map);
      } else if (player.onGround) {
        if (player.currentFoothold?.id === cmd.targetId) this.commandQueue.shift();
        else this.commandQueue = []; // Replan if inertia landed on a neighboring segment.
      }
      return;
    }

    if (cmd.action === 'JUMP_TO_FOOTHOLD') {
      if (!cmd.started) {
        const dx = cmd.launchX - player.x;
        const brakingDistance = Math.abs(player.vx) * Physics.FRICTION / (1 - Physics.FRICTION);
        if (Math.abs(dx) > 2 && !(Math.sign(dx) === Math.sign(player.vx) && Math.abs(dx) <= brakingDistance + 1)) {
          player.setHorizontalInput(Math.sign(dx));
        } else player.stopHorizontal();
        if (player.onGround && Math.abs(dx) <= 3 && Math.abs(player.vx) < .25) cmd.started = player.jump();
      }
      else if (cmd.started && player.onGround) {
        if (player.currentFoothold?.id === cmd.targetId) this.commandQueue.shift();
        else this.commandQueue = [];
      }
      return;
    }

    if (cmd.action === 'NAVIGATE_TO_TARGET') {
      if (this.isMultipartBoss(this.currentTarget)) {
        const box = this.getBossTargetBox();
        const plan = this.bossTargetPlan;
        if (!box || !plan) {
          this.commandQueue = [];
          return;
        }
        if (plan.jump?.started && player.onGround) {
          this.bossTargetPlan = this.planBossPart(player, this.currentTarget);
          this.buildWaypointPath(player);
          return;
        }
        if (!player.onLadder && this.canAttackBossPart(player, box)) {
          player.stopHorizontal();
          const point = CombatSystem.closestTargetPoint(box, player.x, player.y - 16);
          player.facing = point.x >= player.x ? 'right' : 'left';
          this.triggerAttack(player);
          if (!plan.jump?.started) return;
        }
        if (plan.jump?.started) {
          const direction = (player.x - plan.jump.attackX) * plan.jump.direction >= 0
            ? -plan.jump.direction : plan.jump.direction;
          player.setHorizontalInput(direction);
          return;
        }
        const dx = plan.x - player.x;
        if (dx > 8) player.moveRight();
        else if (dx < -8) player.moveLeft();
        else {
          player.stopHorizontal();
          if (player.onGround && player.currentFoothold?.id !== plan.foothold.id) this.buildWaypointPath(player);
          else if (plan.jump && player.onGround && player.attackTimer <= 0) {
            player.setHorizontalInput(plan.jump.direction);
            if (player.jump()) plan.jump.started = true;
          }
        }
        return;
      }
      const dx = tx - player.x;
      const dy = ty - player.y;

      let attackRange = 56;
      if (player.job === '궁수') attackRange = 240;
      else if (player.job === '도적') attackRange = 210;
      else if (player.job === '마법사') attackRange = 160;

      const inRange = Math.abs(dx) <= attackRange && Math.abs(dy) <= 35;

      if (inRange && this.targetType === 'monster') {
        player.stopHorizontal();
        player.facing = dx >= 0 ? 'right' : 'left';
        this.triggerAttack(player);
        return;
      }

      if (this.targetType === 'drop' && Math.abs(dx) <= 14) {
        player.stopHorizontal();
        return;
      }

      if (dx > 20) {
        player.moveRight();
      } else if (dx < -20) {
        player.moveLeft();
      } else {
        player.stopHorizontal();
        player.facing = dx >= 0 ? 'right' : 'left';
      }
    }
  }

  triggerAttack(player) {
    if (!this.config.useSkills) return player.normalAttack(this.game);
    if (this.isMultipartBoss?.(this.currentTarget)) return player.primaryAttack(this.game);
    const preferences = {
      '전사': ['slash_blast', 'power_strike'],
      '마법사': ['magic_claw', 'energy_bolt'],
      '궁수': ['double_shot', 'arrow_blow'],
      '도적': player.weaponType === 'dagger' ? ['double_stab', 'lucky_seven'] : ['lucky_seven', 'double_stab']
    };
    for (const id of preferences[player.job] || []) {
      if (!player.skills[id]?.level) continue;
      if (id === 'slash_blast' && player.hp <= 25) continue;
      const skill = SkillRegistry.get(id);
      if (skill?.canCast(player) && player.useSkill(id, this.game)) return true;
    }
    return player.primaryAttack(this.game);
  }

  drawTargetIndicator(ctx) {
    if (!this.enabled || !this.currentTarget) return;

    ctx.save();
    const t = this.currentTarget;
    const box = this.getBossTargetBox();
    ctx.translate(box ? box.x + box.width / 2 : t.x, box ? box.y + box.height / 2 : t.y - (t.height ? t.height / 2 : 10));
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(26, 0);
      ctx.stroke();
    }

    ctx.font = 'bold 9px Arial';
    ctx.fillStyle = '#f87171';
    ctx.textAlign = 'center';
    ctx.fillText('TARGET', 0, -28);

    ctx.restore();
  }

  updateUI() {
    const btn = document.getElementById('btn-auto-hunt');
    const badge = document.getElementById('auto-hunt-badge');
    const panel = document.getElementById('auto-stats-panel');

    if (btn) {
      btn.classList.toggle('active', this.enabled);
      btn.innerText = this.enabled ? '⚡ 자동사냥 중지 (R)' : '⚔️ 자동사냥 시작 (R)';
    }
    if (badge) {
      badge.style.display = this.enabled ? 'flex' : 'none';
    }
    if (panel) {
      panel.style.display = this.enabled ? 'block' : 'none';
    }
  }
}

window.FootholdGraph = FootholdGraph;
window.AutoHuntManager = AutoHuntManager;
