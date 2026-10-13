// js/autohunt.js - Advanced Auto-Hunt AI with Class-Aware Range and Combat Tactics

class AutoHuntManager {
  constructor(game) {
    this.game = game;
    this.enabled = false;

    this.config = {
      hpPotionThreshold: 0.55,
      mpPotionThreshold: 0.40,
      autoLoot: true,
      useSkills: true,
      huntMode: 'balanced',
      searchRadius: 1000
    };

    this.currentTarget = null;
    this.targetType = null;
    this.stuckTimer = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.decisionTimer = 0;

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

    this.checkSurvival(player);
    this.checkStuck(dt, player);

    this.decisionTimer -= dt;
    if (this.decisionTimer <= 0) {
      this.decisionTimer = 0.12;
      this.selectTarget(player);
    }

    this.executeAI(dt, player, map);
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

  checkStuck(dt, player) {
    const distMoved = Math.hypot(player.x - this.lastX, player.y - this.lastY);
    if (distMoved < 3 && player.vx !== 0) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 0.8) {
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
    if (this.config.autoLoot && this.game.drops.length > 0) {
      let closestDrop = null;
      let minDropDist = 280;

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

    let bestMonster = null;
    let minScore = Infinity;

    for (const m of this.game.monsters) {
      if (!m.isAlive()) continue;

      const dx = m.x - player.x;
      const dy = m.y - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > this.config.searchRadius) continue;

      const verticalPenalty = Math.abs(dy) * 2.2;
      let score = dist + verticalPenalty;

      if (m.type === 'mushmom') {
        score -= 250;
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
      player.stopHorizontal();
      return;
    }

    const tx = this.currentTarget.x;
    const ty = this.currentTarget.y;
    const dx = tx - player.x;
    const dy = ty - player.y;

    if (player.onLadder) {
      if (dy < -15) {
        player.climbUp(map);
      } else if (dy > 15) {
        player.climbDown(map);
      } else {
        player.facing = dx > 0 ? 'right' : 'left';
        player.jump();
      }
      return;
    }

    if (this.targetType === 'drop') {
      if (Math.abs(dx) > 12) {
        if (dx > 0) player.moveRight();
        else player.moveLeft();
      } else {
        player.stopHorizontal();
      }
      if (dy > 35 && Math.abs(dx) < 80) {
        player.dropThrough();
      }
      return;
    }

    // Class-specific attack ranges!
    let attackRange = 54;
    if (player.job === '궁수') attackRange = 240;
    else if (player.job === '도적') attackRange = 210;
    else if (player.job === '마법사') attackRange = 160;

    const inAttackRange = Math.abs(dx) <= attackRange && Math.abs(dy) <= 35;

    if (inAttackRange) {
      player.stopHorizontal();
      player.facing = dx >= 0 ? 'right' : 'left';

      // Perform class skills or attack
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
      return;
    }

    if (dy < -60) {
      const ladder = Physics.checkLadderGrab(player, map, 'up');
      if (ladder) {
        player.climbUp(map);
        return;
      } else {
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

    if (dy > 50 && Math.abs(dx) < 180) {
      player.dropThrough();
    }

    if (dx > 25) {
      player.moveRight();
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

window.AutoHuntManager = AutoHuntManager;
