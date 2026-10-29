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
      return target && target.isAlive();
    } else if (this.targetType === 'drop') {
      return this.game.drops.includes(target) && target.life > 0;
    }
    return false;
  }

  selectTarget(player) {
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
    let minScore = Infinity;

    for (const m of this.game.monsters) {
      if (!m.isAlive()) continue;
      const dx = m.x - player.x;
      const dy = m.y - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > this.config.searchRadius) continue;
      let score = dist + Math.abs(dy) * 2.0;
      if (m.type === 'mushmom') score -= 300;

      if (score < minScore) {
        minScore = score;
        bestMonster = m;
      }
    }

    this.currentTarget = bestMonster;
    this.targetType = bestMonster ? 'monster' : null;
  }

  findCurrentFoothold(entity) {
    if (entity.currentFoothold) return entity.currentFoothold;
    for (const fh of this.game.map.footholds) {
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
    const targetFh = this.findCurrentFoothold(this.currentTarget);

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
      } else if (edge.type === 'walk') {
        const nextFh = this.graph.nodes.get(edge.targetId);
        this.commandQueue.push({ action: 'MOVE_TO_X', x: (nextFh.x1 + nextFh.x2) / 2 });
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
          player.x = cmd.ladder.x;
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

    if (cmd.action === 'NAVIGATE_TO_TARGET') {
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
    if (this.config.useSkills) {
      if (player.job === '전사') {
        if (player.skills.slash_blast?.level > 0 && player.mp >= 10 && player.hp > 25) {
          player.useSkill('slash_blast', this.game);
        } else if (player.skills.power_strike?.level > 0 && player.mp >= 6) {
          player.useSkill('power_strike', this.game);
        } else {
          player.normalAttack(this.game);
        }
      } else if (player.job === '마법사') {
        if (player.skills.magic_claw?.level > 0 && player.mp >= 12) {
          player.useSkill('magic_claw', this.game);
        } else if (player.skills.energy_bolt?.level > 0 && player.mp >= 6) {
          player.useSkill('energy_bolt', this.game);
        } else {
          player.normalAttack(this.game);
        }
      } else if (player.job === '궁수') {
        if (player.skills.double_shot?.level > 0 && player.mp >= 10) {
          player.useSkill('double_shot', this.game);
        } else if (player.skills.arrow_blow?.level > 0 && player.mp >= 6) {
          player.useSkill('arrow_blow', this.game);
        } else {
          player.normalAttack(this.game);
        }
      } else if (player.job === '도적') {
        if (player.skills.lucky_seven?.level > 0 && player.mp >= 8) {
          player.useSkill('lucky_seven', this.game);
        } else if (player.skills.double_stab?.level > 0 && player.mp >= 6) {
          player.useSkill('double_stab', this.game);
        } else {
          player.normalAttack(this.game);
        }
      } else {
        player.normalAttack(this.game);
      }
    } else {
      player.normalAttack(this.game);
    }
  }

  drawTargetIndicator(ctx) {
    if (!this.enabled || !this.currentTarget) return;

    ctx.save();
    const t = this.currentTarget;
    ctx.translate(t.x, t.y - (t.height ? t.height / 2 : 10));
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
