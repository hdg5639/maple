// js/entities.js - Player, Monster, Drops, and Combat Entities

class Player {
  constructor(x = 200, y = 820) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 24;
    this.height = 36;
    this.facing = 'right'; // 'left' or 'right'

    this.onGround = false;
    this.onLadder = false;
    this.currentLadder = null;
    this.dropThroughTimer = 0;

    // Combat & Timers
    this.attackTimer = 0;
    this.attackDuration = 0.28; // seconds
    this.invincibleTimer = 0;
    this.canAttack = true;

    // Character Profile & Level
    this.name = '단풍모험가';
    this.job = '초보자';
    this.level = 1;
    this.exp = 0;
    this.maxExp = 15;

    // Core Stats
    this.str = 12;
    this.dex = 8;
    this.int = 4;
    this.luk = 4;
    this.ap = 5; // Ability points
    this.sp = 3; // Skill points

    this.calcDerivedStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    // Movement speeds
    this.walkSpeed = 3.6;
    this.jumpForce = -9.6;
    this.ladderSpeed = 2.4;

    // Weapon / Cosmetics
    this.weaponType = 'sword'; // 'sword', 'dagger', 'staff'

    // Inventory
    this.meso = 100;
    this.inventory = {
      equip: [
        { id: 'eq_wood_sword', name: '초보자 목검', type: 'weapon', atk: 7, equipped: true },
        { id: 'eq_bandana', name: '빨간 띠', type: 'hat', def: 3, equipped: true }
      ],
      use: [
        { id: 'red_potion', name: '빨간 포션', count: 15, healHp: 50 },
        { id: 'blue_potion', name: '파란 포션', count: 10, healMp: 50 }
      ],
      etc: [
        { id: 'snail_shell', name: '달팽이의 껍질', count: 0 },
        { id: 'slime_liquid', name: '물컹물컹한 액체', count: 0 },
        { id: 'mushroom_cap', name: '주황버섯의 갓', count: 0 }
      ]
    };

    // Skill Levels
    this.skills = {
      power_strike: { name: '파워 스트라이크', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.8, range: 60, icon: '⚔️' },
      slash_blast: { name: '슬래시 블러스트', level: 0, maxLevel: 20, mpCost: 10, hpCost: 8, dmgMult: 1.4, radius: 100, icon: '🌀' },
      magic_claw: { name: '매직 클로', level: 0, maxLevel: 20, mpCost: 12, dmgMult: 1.3, hits: 2, range: 110, icon: '✨' },
      flash_jump: { name: '플래시 점프', level: 0, maxLevel: 5, mpCost: 5, icon: '⚡' },
      recovery: { name: '회복력 향상', level: 1, maxLevel: 10, passive: true, icon: '❤️' }
    };

    // Passive regeneration timer
    this.regenTimer = 0;
  }

  calcDerivedStats() {
    this.maxHp = 60 + this.level * 18 + this.str * 4;
    this.maxMp = 25 + this.level * 10 + this.int * 3;
    this.minAtk = Math.max(3, Math.floor(this.str * 0.9 + this.dex * 0.4 + this.level * 2));
    this.maxAtk = Math.max(5, Math.floor(this.str * 1.5 + this.dex * 0.6 + this.level * 3));
  }

  getDamage() {
    const range = this.maxAtk - this.minAtk;
    const base = this.minAtk + Math.floor(Math.random() * (range + 1));
    const isCrit = Math.random() < 0.22; // 22% crit rate
    const dmg = isCrit ? Math.floor(base * 1.5) : base;
    return { damage: dmg, isCrit };
  }

  update(dt, map) {
    // Attack timer
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
    }

    // Invincible blink
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }

    // Passive regeneration (every 6s)
    this.regenTimer += dt;
    if (this.regenTimer >= 6) {
      this.regenTimer = 0;
      const recBonus = this.skills.recovery.level * 3;
      this.healHp(5 + recBonus);
      this.healMp(4 + recBonus);
    }

    // Physics update
    Physics.updateEntity(this, map, dt);
  }

  moveLeft() {
    if (this.onLadder) return;
    this.vx = -this.walkSpeed;
    this.facing = 'left';
  }

  moveRight() {
    if (this.onLadder) return;
    this.vx = this.walkSpeed;
    this.facing = 'right';
  }

  stopHorizontal() {
    this.vx = 0;
  }

  jump() {
    if (this.onLadder) {
      this.onLadder = false;
      this.currentLadder = null;
      this.vy = this.jumpForce * 0.8;
      window.audio.playJump();
      return;
    }
    if (this.onGround) {
      this.vy = this.jumpForce;
      this.onGround = false;
      window.audio.playJump();
    }
  }

  flashJump() {
    if (this.skills.flash_jump.level > 0 && this.mp >= this.skills.flash_jump.mpCost) {
      this.mp -= this.skills.flash_jump.mpCost;
      const boost = 7.5 + this.skills.flash_jump.level * 0.6;
      this.vx = (this.facing === 'right' ? 1 : -1) * boost;
      this.vy = -3.5;
      window.audio.playFlashJump();
      return true;
    }
    return false;
  }

  dropThrough() {
    if (this.onGround && this.currentPlatform && this.currentPlatform.canDropThrough) {
      this.dropThroughTimer = 18;
      this.y += 4;
      this.vy = 2;
      this.onGround = false;
    }
  }

  climbUp(map) {
    if (!this.onLadder) {
      const lad = Physics.checkLadderGrab(this, map, 'up');
      if (lad) {
        this.onLadder = true;
        this.currentLadder = lad;
        this.x = lad.x;
        this.vx = 0;
      }
    }
    if (this.onLadder) {
      this.vy = -this.ladderSpeed;
      if (this.y < this.currentLadder.top) {
        this.y = this.currentLadder.top;
        this.onLadder = false;
        this.onGround = true;
        this.vy = 0;
      }
    }
  }

  climbDown(map) {
    if (!this.onLadder) {
      const lad = Physics.checkLadderGrab(this, map, 'down');
      if (lad) {
        this.onLadder = true;
        this.currentLadder = lad;
        this.x = lad.x;
        this.y += 10;
        this.vx = 0;
      }
    }
    if (this.onLadder) {
      this.vy = this.ladderSpeed;
      if (this.y > this.currentLadder.bottom) {
        this.y = this.currentLadder.bottom;
        this.onLadder = false;
        this.onGround = true;
        this.vy = 0;
      }
    }
  }

  stopVerticalClimb() {
    if (this.onLadder) {
      this.vy = 0;
    }
  }

  // --- Combat Methods ---

  normalAttack(game) {
    if (this.attackTimer > 0) return false;
    this.attackTimer = this.attackDuration;
    window.audio.playAttack();

    const range = 52;
    const hitBox = {
      x: this.facing === 'right' ? this.x : this.x - range,
      y: this.y - 36,
      width: range,
      height: 38
    };

    let hit = false;
    for (const m of game.monsters) {
      if (m.isAlive() && this.checkCollision(hitBox, m.getHitBox())) {
        const { damage, isCrit } = this.getDamage();
        m.takeDamage(damage, isCrit, this.facing);
        game.spawnDamageText(m.x, m.y - m.height * 0.7, damage, isCrit);
        hit = true;
      }
    }
    return hit;
  }

  useSkill(skillId, game) {
    if (this.attackTimer > 0) return false;
    const skill = this.skills[skillId];
    if (!skill || skill.level <= 0) return false;

    if (skillId === 'power_strike') {
      if (this.mp < skill.mpCost) return false;
      this.mp -= skill.mpCost;
      this.attackTimer = this.attackDuration * 1.1;
      window.audio.playPowerStrike();

      // Golden aura animation
      game.skillEffects.push({
        type: 'power_strike',
        x: this.facing === 'right' ? this.x + 30 : this.x - 30,
        y: this.y - 15,
        progress: 0,
        duration: 0.35
      });

      const hitBox = {
        x: this.facing === 'right' ? this.x : this.x - 65,
        y: this.y - 45,
        width: 65,
        height: 48
      };

      for (const m of game.monsters) {
        if (m.isAlive() && this.checkCollision(hitBox, m.getHitBox())) {
          const { damage, isCrit } = this.getDamage();
          const strikeDmg = Math.floor(damage * (skill.dmgMult + skill.level * 0.08));
          m.takeDamage(strikeDmg, true, this.facing);
          game.spawnDamageText(m.x, m.y - m.height * 0.8, strikeDmg, true);
          break; // Single target heavy burst
        }
      }
      return true;
    } else if (skillId === 'slash_blast') {
      if (this.mp < skill.mpCost || this.hp <= skill.hpCost) return false;
      this.mp -= skill.mpCost;
      this.hp -= skill.hpCost;
      this.attackTimer = this.attackDuration * 1.2;
      window.audio.playSlashBlast();

      // Whirlwind animation
      game.skillEffects.push({
        type: 'slash_blast',
        x: this.x,
        y: this.y - 15,
        progress: 0,
        duration: 0.4
      });

      const radius = 95;
      for (const m of game.monsters) {
        if (m.isAlive()) {
          const dist = Math.hypot(m.x - this.x, (m.y - m.height / 2) - (this.y - 18));
          if (dist <= radius) {
            const { damage, isCrit } = this.getDamage();
            const slashDmg = Math.floor(damage * (skill.dmgMult + skill.level * 0.05));
            m.takeDamage(slashDmg, isCrit, m.x > this.x ? 'right' : 'left');
            game.spawnDamageText(m.x, m.y - m.height * 0.7, slashDmg, isCrit);
          }
        }
      }
      return true;
    } else if (skillId === 'magic_claw') {
      if (this.mp < skill.mpCost) return false;
      this.mp -= skill.mpCost;
      this.attackTimer = this.attackDuration * 1.1;
      window.audio.playMagicClaw();

      const range = 110;
      const hitBox = {
        x: this.facing === 'right' ? this.x : this.x - range,
        y: this.y - 45,
        width: range,
        height: 50
      };

      for (const m of game.monsters) {
        if (m.isAlive() && this.checkCollision(hitBox, m.getHitBox())) {
          game.skillEffects.push({
            type: 'magic_claw',
            x: m.x,
            y: m.y - m.height / 2,
            progress: 0,
            duration: 0.35
          });

          // 2 hits!
          for (let hit = 0; hit < 2; hit++) {
            setTimeout(() => {
              if (m.isAlive()) {
                const { damage, isCrit } = this.getDamage();
                const clawDmg = Math.floor(damage * (1.1 + skill.level * 0.06));
                m.takeDamage(clawDmg, isCrit, this.facing);
                game.spawnDamageText(m.x + (hit * 12 - 6), m.y - m.height * 0.8 - hit * 15, clawDmg, isCrit);
              }
            }, hit * 120);
          }
          break;
        }
      }
      return true;
    } else if (skillId === 'flash_jump') {
      return this.flashJump();
    }
    return false;
  }

  takeDamage(amount) {
    if (this.invincibleTimer > 0 || this.hp <= 0) return;
    this.hp -= amount;
    this.invincibleTimer = 1.0; // 1s invincibility
    window.audio.playHit();

    if (this.hp <= 0) {
      this.hp = 0;
      // Resurrect after 3s
      setTimeout(() => {
        this.resurrect();
      }, 3000);
    }
  }

  resurrect() {
    this.hp = Math.floor(this.maxHp * 0.5);
    this.mp = Math.floor(this.maxMp * 0.5);
    this.x = 200;
    this.y = 820;
    this.vx = 0;
    this.vy = 0;
    this.onLadder = false;
  }

  healHp(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  healMp(amount) {
    this.mp = Math.min(this.maxMp, this.mp + amount);
  }

  usePotion(type) {
    const pot = this.inventory.use.find(p => p.id === type);
    if (!pot || pot.count <= 0) return false;

    if (pot.healHp && this.hp >= this.maxHp && !pot.healMp) return false;
    if (pot.healMp && this.mp >= this.maxMp && !pot.healHp) return false;

    pot.count--;
    window.audio.playUsePotion();
    if (pot.healHp) this.healHp(pot.healHp);
    if (pot.healMp) this.healMp(pot.healMp);
    return true;
  }

  gainExp(amount, game) {
    this.exp += amount;
    game.spawnExpText(this.x, this.y - 45, amount);

    while (this.exp >= this.maxExp) {
      this.exp -= this.maxExp;
      this.levelUp(game);
    }
  }

  levelUp(game) {
    this.level++;
    this.ap += 5;
    this.sp += 3;
    this.maxExp = Math.floor(this.maxExp * 1.5 + this.level * 10);
    this.calcDerivedStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    window.audio.playLevelUp();
    game.skillEffects.push({
      type: 'level_up',
      x: this.x,
      y: this.y,
      progress: 0,
      duration: 1.6
    });

    // Check Job advancement eligibility at Lv.10
    if (this.level >= 10 && this.job === '초보자') {
      game.ui.showJobAdvancementModal();
    }
  }

  advanceJob(newJob) {
    this.job = newJob;
    if (newJob === '전사') {
      this.skills.power_strike.level = Math.max(1, this.skills.power_strike.level);
      this.skills.slash_blast.level = Math.max(1, this.skills.slash_blast.level);
      this.str += 10;
    } else if (newJob === '마법사') {
      this.skills.magic_claw.level = Math.max(1, this.skills.magic_claw.level);
      this.int += 10;
      this.weaponType = 'staff';
    } else if (newJob === '도적') {
      this.skills.flash_jump.level = Math.max(1, this.skills.flash_jump.level);
      this.luk += 10;
      this.weaponType = 'dagger';
    } else if (newJob === '궁수') {
      this.dex += 10;
    }
    this.calcDerivedStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;
  }

  addMeso(amount, game) {
    this.meso += amount;
    window.audio.playPickItem();
    game.spawnMesoText(this.x, this.y - 35, amount);
  }

  addItem(itemId, name, count = 1, game) {
    window.audio.playPickItem();
    game.spawnItemText(this.x, this.y - 35, name);

    // Look in use
    const useItem = this.inventory.use.find(i => i.id === itemId);
    if (useItem) {
      useItem.count += count;
      return;
    }
    // Look in etc
    const etcItem = this.inventory.etc.find(i => i.id === itemId);
    if (etcItem) {
      etcItem.count += count;
      return;
    }
    // New etc item
    this.inventory.etc.push({ id: itemId, name, count });
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }
}

// === Monster Class ===

class Monster {
  constructor(type, x, y) {
    this.id = Math.random();
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = Math.random() < 0.5 ? 'left' : 'right';
    this.onGround = false;
    this.hitTimer = 0;

    this.initMonsterType(type);
    this.hp = this.maxHp;

    // AI wandering timers
    this.moveTimer = Math.random() * 2;
    this.moveDir = 0; // -1, 0, 1
  }

  initMonsterType(type) {
    switch (type) {
      case 'snail':
        this.name = '달팽이';
        this.level = 1;
        this.maxHp = 15;
        this.exp = 3;
        this.atk = 2;
        this.speed = 0.6;
        this.width = 24;
        this.height = 18;
        this.dropTable = [
          { type: 'meso', chance: 0.7, min: 2, max: 8 },
          { type: 'snail_shell', name: '달팽이의 껍질', chance: 0.6 }
        ];
        break;
      case 'blue_snail':
        this.name = '파란달팽이';
        this.level = 2;
        this.maxHp = 30;
        this.exp = 5;
        this.atk = 5;
        this.speed = 0.8;
        this.width = 24;
        this.height = 18;
        this.dropTable = [
          { type: 'meso', chance: 0.75, min: 5, max: 14 },
          { type: 'snail_shell', name: '파란달팽이 껍질', chance: 0.6 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.15 }
        ];
        break;
      case 'red_snail':
        this.name = '빨간달팽이';
        this.level = 4;
        this.maxHp = 50;
        this.exp = 8;
        this.atk = 9;
        this.speed = 1.0;
        this.width = 24;
        this.height = 18;
        this.dropTable = [
          { type: 'meso', chance: 0.8, min: 10, max: 25 },
          { type: 'snail_shell', name: '빨간달팽이 껍질', chance: 0.65 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.25 }
        ];
        break;
      case 'slime':
        this.name = '슬라임';
        this.level = 6;
        this.maxHp = 90;
        this.exp = 14;
        this.atk = 14;
        this.speed = 1.2;
        this.width = 30;
        this.height = 24;
        this.dropTable = [
          { type: 'meso', chance: 0.85, min: 15, max: 40 },
          { type: 'slime_liquid', name: '물컹물컹한 액체', chance: 0.7 },
          { type: 'blue_potion', name: '파란 포션', chance: 0.25 }
        ];
        break;
      case 'orange_mushroom':
        this.name = '주황버섯';
        this.level = 8;
        this.maxHp = 150;
        this.exp = 22;
        this.atk = 20;
        this.speed = 1.3;
        this.width = 32;
        this.height = 28;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 25, max: 65 },
          { type: 'mushroom_cap', name: '주황버섯의 갓', chance: 0.75 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.3 },
          { type: 'blue_potion', name: '파란 포션', chance: 0.2 }
        ];
        break;
      case 'ribbon_pig':
        this.name = '리본돼지';
        this.level = 10;
        this.maxHp = 220;
        this.exp = 32;
        this.atk = 28;
        this.speed = 2.0;
        this.width = 36;
        this.height = 26;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 35, max: 90 },
          { type: 'etc', name: '돼지의 리본', chance: 0.8 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.35 }
        ];
        break;
      case 'green_mushroom':
        this.name = '초록버섯';
        this.level = 12;
        this.maxHp = 300;
        this.exp = 42;
        this.atk = 36;
        this.speed = 1.4;
        this.width = 34;
        this.height = 30;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 50, max: 120 },
          { type: 'etc', name: '초록버섯의 갓', chance: 0.75 },
          { type: 'blue_potion', name: '파란 포션', chance: 0.4 }
        ];
        break;
      case 'mushmom':
        this.name = '★ 머쉬맘 (BOSS) ★';
        this.level = 25;
        this.maxHp = 4500;
        this.exp = 950;
        this.atk = 75;
        this.speed = 1.6;
        this.width = 80;
        this.height = 70;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 1000, max: 2500 },
          { type: 'red_potion', name: '빨간 포션', chance: 1.0, count: 5 },
          { type: 'blue_potion', name: '파란 포션', chance: 1.0, count: 5 },
          { type: 'etc', name: '머쉬맘의 포자', chance: 1.0 },
          { type: 'equip', name: '냄비 뚜껑', chance: 0.65 }
        ];
        break;
      default:
        this.initMonsterType('snail');
    }
  }

  isAlive() {
    return this.hp > 0;
  }

  getHitBox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    };
  }

  update(dt, player, map, game) {
    if (!this.isAlive()) return;

    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
    }

    // AI wandering logic
    this.moveTimer -= dt;
    if (this.moveTimer <= 0) {
      this.moveTimer = 1.5 + Math.random() * 2.5;
      const r = Math.random();
      if (r < 0.4) {
        this.moveDir = -1;
        this.facing = 'left';
      } else if (r < 0.8) {
        this.moveDir = 1;
        this.facing = 'right';
      } else {
        this.moveDir = 0; // idle pause
      }

      // If slime or mushroom, occasional hop
      if ((this.type === 'slime' || this.type === 'orange_mushroom' || this.type === 'mushmom') && this.onGround && Math.random() < 0.6) {
        this.vy = -6.5;
        this.onGround = false;
      }
    }

    this.vx = this.moveDir * this.speed;

    // Platform edge check so monsters don't walk blindly off ledges unless jumping
    if (this.currentPlatform && this.onGround) {
      if (this.x - 10 <= this.currentPlatform.x) {
        this.moveDir = 1;
        this.facing = 'right';
      } else if (this.x + 10 >= this.currentPlatform.x + this.currentPlatform.width) {
        this.moveDir = -1;
        this.facing = 'left';
      }
    }

    // Physics
    Physics.updateEntity(this, map, dt);

    // Monster attacks player on touch
    if (player.hp > 0 && player.invincibleTimer <= 0) {
      const pBox = {
        x: player.x - player.width / 2,
        y: player.y - player.height,
        width: player.width,
        height: player.height
      };
      if (player.checkCollision(pBox, this.getHitBox())) {
        player.takeDamage(this.atk);
        game.spawnDamageText(player.x, player.y - 25, this.atk, false, 'player');
      }
    }
  }

  takeDamage(amount, isCrit, fromDir) {
    this.hp -= amount;
    this.hitTimer = 0.2;
    window.audio.playHit();

    // Knockback
    this.vx = (fromDir === 'right' ? 1 : -1) * 3.5;
    this.vy = -2.5;
    this.onGround = false;

    if (this.hp <= 0) {
      this.hp = 0;
    }
  }

  die(player, game) {
    window.audio.playMonsterDie();
    player.gainExp(this.exp, game);

    // Roll drops
    this.dropTable.forEach(drop => {
      if (Math.random() <= drop.chance) {
        if (drop.type === 'meso') {
          const amt = Math.floor(drop.min + Math.random() * (drop.max - drop.min + 1));
          game.spawnDrop('meso', amt, this.x + (Math.random() * 20 - 10), this.y - 10);
        } else if (drop.type === 'red_potion') {
          game.spawnDrop('red_potion', 1, this.x + (Math.random() * 20 - 10), this.y - 10);
        } else if (drop.type === 'blue_potion') {
          game.spawnDrop('blue_potion', 1, this.x + (Math.random() * 20 - 10), this.y - 10);
        } else {
          game.spawnDrop(drop.type, 1, this.x + (Math.random() * 20 - 10), this.y - 10, drop.name);
        }
      }
    });
  }
}

// === Drop Item Class ===

class DropItem {
  constructor(type, amount, x, y, name = '') {
    this.id = Math.random();
    this.type = type;
    this.amount = amount;
    this.name = name;
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 3.2;
    this.vy = -4.5;
    this.width = 16;
    this.height = 14;
    this.onGround = false;
    this.life = 60.0; // seconds before despawn
  }

  update(dt, map) {
    this.life -= dt;
    if (!this.onGround) {
      this.vx *= 0.95;
    } else {
      this.vx = 0;
    }
    Physics.updateEntity(this, map, dt);
  }

  canPickUp(player) {
    const dist = Math.hypot(this.x - player.x, this.y - (player.y - 15));
    return dist < 32;
  }
}

// === Floating Text Class ===

class FloatingText {
  constructor(x, y, text, type = 'damage', isCrit = false) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.type = type; // 'damage', 'crit', 'miss', 'meso', 'exp', 'item'
    this.isCrit = isCrit;
    this.life = 1.0;
    this.vy = -1.2;
  }

  update(dt) {
    this.y += this.vy;
    this.life -= dt * 1.1;
  }
}

window.Player = Player;
window.Monster = Monster;
window.DropItem = DropItem;
window.FloatingText = FloatingText;
