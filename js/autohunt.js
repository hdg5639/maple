// js/autohunt.js - Advanced Auto-Hunt (자동사냥) AI Engine & Analytics

class AutoHuntManager {
  constructor(game) {
    this.game = game;
    this.enabled = false;

    // Configuration / Options
    this.config = {
      hpPotionThreshold: 0.55,  // Auto-drink HP pot when HP < 55%
      mpPotionThreshold: 0.40,  // Auto-drink MP pot when MP < 40%
      autoLoot: true,           // Prioritize picking up items & mesos
      useSkills: true,          // Use Power Strike / Slash Blast / Magic Claw
      huntMode: 'balanced',     // 'aggressive', 'balanced', 'safe'
      searchRadius: 900         // Range to search for monsters
    };

    // AI Internal State
    this.currentTarget = null;
    this.targetType = null;     // 'monster' | 'drop'
    this.state = 'idle';        // 'idle', 'navigate', 'attack', 'loot', 'climb'
    this.stuckTimer = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.actionCooldown = 0;
    this.decisionTimer = 0;

    // Analytics / Statistics
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
      this.game.spawnItemText(this.game.player.x, this.game.player.y - 50, '★ 자동사냥 시작! ★');
    } else {
      this.game.player.stopHorizontal();
      this.game.player.stopVerticalClimb();
      this.currentTarget = null;
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

    // 1. Auto-Potion / Survival Check (Highest Priority)
    this.checkSurvival(player);

    // 2. Anti-Stuck Check
    this.checkStuck(dt, player);

    // 3. Periodic Decision Making
    this.decisionTimer -= dt;
    if (this.decisionTimer <= 0) {
      this.decisionTimer = 0.12; // 8-10 decisions per second
      this.selectTarget(player);
    }

    // 4. Execute AI Actions
    this.executeAI(dt, player, map);
  }

  checkSurvival(player) {
    // HP Check
    if (player.hp / player.maxHp < this.config.hpPotionThreshold) {
      const used = player.usePotion('red_potion');
      if (used) this.stats.potionsUsed++;
    }

    // MP Check
    if (player.mp / player.maxMp < this.config.mpPotionThreshold) {
      const used = player.usePotion('blue_potion');
      if (used) this.stats.potionsUsed++;
    }
  }

  checkStuck(dt, player) {
    const distMoved = Math.hypot(player.x - this.lastX, player.y - this.lastY);
    if (distMoved < 3 && player.vx !== 0) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 0.8) {
        // Try jumping or reversing
        player.jump();
        if (Math.random() < 0.4) {
          player.dropThrough();
        }
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
    }
    this.lastX = player.x;
    this.lastY = player.y;
  }

  selectTarget(player) {
    // A. Priority: Nearby Drops (if autoLoot enabled)
    if (this.config.autoLoot && this.game.drops.length > 0) {
      let closestDrop = null;
      let minDropDist = 260; // Loot search radius

      for (const drop of this.game.drops) {
        const dist = Math.hypot(drop.x - player.x, drop.y - player.y);
        if (dist < minDropDist) {
          minDropDist = dist;
          closestDrop = drop;
        }
      }

      if (closestDrop) {
        this.currentTarget = closestDrop;
        this.targetType = 'drop';
        return;
      }
    }

    // B. Priority: Alive Monsters
    let bestMonster = null;
    let minScore = Infinity;

    for (const m of this.game.monsters) {
      if (!m.isAlive()) continue;

      const dx = m.x - player.x;
      const dy = m.y - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > this.config.searchRadius) continue;

      // Penalize monsters on distant vertical layers
      const verticalPenalty = Math.abs(dy) * 2.2;
      let score = dist + verticalPenalty;

      // Boss prioritization
      if (m.type === 'mushmom') {
        score -= 200;
      }

      if (score < minScore) {
        minScore = score;
        bestMonster = m;
      }
    }

    this.currentTarget = bestMonster;
    this.targetType = bestMonster ? 'monster' : null;
  }

  executeAI(dt, player, map) {
    if (!this.currentTarget) {
      // Idle wander
      player.stopHorizontal();
      return;
    }

    const tx = this.currentTarget.x;
    const ty = this.currentTarget.y;
    const dx = tx - player.x;
    const dy = ty - player.y;

    // --- State: Climbing Ladder ---
    if (player.onLadder) {
      if (dy < -15) {
        player.climbUp(map);
      } else if (dy > 15) {
        player.climbDown(map);
      } else {
        // Reached target height, jump off ladder towards target
        player.facing = dx > 0 ? 'right' : 'left';
        player.jump();
      }
      return;
    }

    // --- State: Target is Dropped Item ---
    if (this.targetType === 'drop') {
      if (Math.abs(dx) > 12) {
        if (dx > 0) player.moveRight();
        else player.moveLeft();
      } else {
        player.stopHorizontal();
      }

      // If drop is on lower platform, drop down
      if (dy > 35 && Math.abs(dx) < 80) {
        player.dropThrough();
      }
      return;
    }

    // --- State: Target is Monster ---
    const attackRange = 54;
    const inAttackRange = Math.abs(dx) <= attackRange && Math.abs(dy) <= 30;

    if (inAttackRange) {
      // Stand & Attack
      player.stopHorizontal();
      player.facing = dx >= 0 ? 'right' : 'left';

      // Decide skill vs normal attack
      if (this.config.useSkills) {
        if (player.skills.slash_blast.level > 0 && player.mp >= player.skills.slash_blast.mpCost && player.hp > 20) {
          player.useSkill('slash_blast', this.game);
        } else if (player.skills.power_strike.level > 0 && player.mp >= player.skills.power_strike.mpCost) {
          player.useSkill('power_strike', this.game);
        } else if (player.skills.magic_claw.level > 0 && player.mp >= player.skills.magic_claw.mpCost) {
          player.useSkill('magic_claw', this.game);
        } else {
          player.normalAttack(this.game);
        }
      } else {
        player.normalAttack(this.game);
      }
      return;
    }

    // Monster is on a higher tier: look for ladders!
    if (dy < -60) {
      const ladder = Physics.checkLadderGrab(player, map, 'up');
      if (ladder) {
        player.climbUp(map);
        return;
      } else {
        // Move towards the nearest ladder going up towards the monster
        const bestLadder = this.findNearestUpLadder(player, map, ty);
        if (bestLadder) {
          const ldx = bestLadder.x - player.x;
          if (Math.abs(ldx) > 6) {
            if (ldx > 0) player.moveRight();
            else player.moveLeft();
          } else {
            player.climbUp(map);
          }
          return;
        }
      }
    }

    // Monster is on a lower tier: drop through platform!
    if (dy > 50 && Math.abs(dx) < 180) {
      player.dropThrough();
    }

    // Horizontal movement toward monster
    if (dx > 25) {
      player.moveRight();
      // Jump across gap or obstacles
      if (Math.random() < 0.05 && player.onGround) {
        player.jump();
      }
    } else if (dx < -25) {
      player.moveLeft();
      if (Math.random() < 0.05 && player.onGround) {
        player.jump();
      }
    } else {
      player.stopHorizontal();
      player.facing = dx >= 0 ? 'right' : 'left';
    }
  }

  findNearestUpLadder(player, map, targetY) {
    let best = null;
    let minD = Infinity;
    for (const lad of map.ladders) {
      // Ladder must reach higher than player
      if (lad.top < player.y && lad.bottom >= player.y - 20) {
        const d = Math.abs(lad.x - player.x);
        if (d < minD) {
          minD = d;
          best = lad;
        }
      }
    }
    return best;
  }

  drawTargetIndicator(ctx) {
    if (!this.enabled || !this.currentTarget) return;

    ctx.save();
    const t = this.currentTarget;

    // Glowing Crosshair Reticle
    const angle = (Date.now() / 300) % (Math.PI * 2);
    ctx.translate(t.x, t.y - (t.height ? t.height / 2 : 10));
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;

    // Rotating targeting circle
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair ticks
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(26, 0);
      ctx.stroke();
    }

    // Target Label
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

window.AutoHuntManager = AutoHuntManager;
