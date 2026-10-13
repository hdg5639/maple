// js/entities.js - Player, Monster, Drops, Projectiles, and Staggered Bouncing Damage Digits

class DamageDigit {
  constructor(char, x, y, delay, isCrit) {
    this.char = char;
    this.x = x;
    this.y = y;
    this.delay = delay;
    this.isCrit = isCrit;
    this.vy = -5.0;
    this.gravity = 0.4;
    this.life = 0.85;
    this.started = false;
  }

  update(dt) {
    if (this.delay > 0) {
      this.delay -= dt;
      return;
    }
    this.started = true;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life -= dt;
  }
}

class Projectile {
  constructor(x, y, vx, vy, type, damage, isCrit, owner) {
    this.id = Math.random();
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.damage = damage;
    this.isCrit = isCrit;
    this.owner = owner;
    this.life = 1.6;
    this.hit = false;
  }

  update(dt, game) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;

    if (this.hit) return;

    for (const m of game.monsters) {
      if (m.isAlive()) {
        const d = Math.hypot(m.x - this.x, (m.y - m.height / 2) - this.y);
        if (d < Math.max(24, m.width * 0.6)) {
          this.hit = true;
          m.takeDamage(this.damage, this.isCrit, this.vx > 0 ? 'right' : 'left', game);
          game.spawnStaggeredDamage(m.x, m.y - m.height * 0.8, this.damage, this.isCrit);
          break;
        }
      }
    }
  }
}

class Player {
  constructor(x = 400, y = 1318) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 24;
    this.height = 36;
    this.facing = 'right';

    this.onGround = false;
    this.currentFoothold = null;
    this.onLadder = false;
    this.currentLadder = null;
    this.dropThroughTimer = 0;

    this.attackTimer = 0;
    this.attackDuration = 0.26;
    this.invincibleTimer = 0;

    this.name = '단풍모험가';
    this.job = '초보자';
    this.level = 1;
    this.exp = 0;
    this.maxExp = 15;

    this.str = 12;
    this.dex = 8;
    this.int = 4;
    this.luk = 4;
    this.ap = 5;
    this.sp = 3;

    this.calcDerivedStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    this.walkSpeed = 3.6;
    this.jumpForce = Physics.JUMP_VELOCITY;
    this.ladderSpeed = 2.4;
    this.weaponType = 'sword';

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

    this.skills = {};
    this.initSkillsForJob('초보자');

    this.regenTimer = 0;
  }

  onLand() {
    window.sprites.spawnLandingDust(this.x, this.y);
  }

  initSkillsForJob(job) {
    if (job === '전사') {
      this.skills = {
        power_strike: { name: '파워 스트라이크', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.8, icon: '⚔️', desc: '강력한 세로 베기로 단일 적에게 치명타' },
        slash_blast: { name: '슬래시 블러스트', level: 1, maxLevel: 20, mpCost: 10, hpCost: 8, dmgMult: 1.4, icon: '🌀', desc: '360도 회전하며 주변 모든 적 타격' },
        iron_body: { name: '아이언 바디', level: 1, maxLevel: 10, mpCost: 8, icon: '🛡️', desc: '물리 방어력과 체력을 증가시킴' },
        recovery: { name: '회복력 향상', level: 1, maxLevel: 10, passive: true, icon: '❤️', desc: '주기적으로 HP 자동 회복' }
      };
      this.weaponType = 'sword';
      this.walkSpeed = 3.6;
    } else if (job === '마법사') {
      this.skills = {
        energy_bolt: { name: '에너지 볼트', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.3, icon: '🔮', desc: '비전 마법 탄환을 전방으로 발사' },
        magic_claw: { name: '매직 클로', level: 1, maxLevel: 20, mpCost: 12, dmgMult: 1.3, hits: 2, icon: '✨', desc: '적의 위치에 2연속 비전 손톱 할퀴기' },
        teleport: { name: '텔레포트', level: 1, maxLevel: 5, mpCost: 8, icon: '🌌', desc: '바라보는 방향으로 즉시 순간이동' },
        recovery: { name: '회복력 향상', level: 1, maxLevel: 10, passive: true, icon: '❤️', desc: 'MP 자동 회복량 증가' }
      };
      this.weaponType = 'staff';
      this.walkSpeed = 3.6;
    } else if (job === '궁수') {
      this.skills = {
        arrow_blow: { name: '애로우 블로우', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.6, icon: '🏹', desc: '관통하는 강력한 화살 1발 발사' },
        double_shot: { name: '더블 샷', level: 1, maxLevel: 20, mpCost: 10, dmgMult: 1.2, icon: '🎯', desc: '화살 2발을 고속 연속 발사' },
        focus: { name: '포커스', level: 1, maxLevel: 10, mpCost: 8, icon: '👁️', desc: '명중률과 이동속도 증가' },
        recovery: { name: '회복력 향상', level: 1, maxLevel: 10, passive: true, icon: '❤️', desc: 'HP/MP 주기적 회복' }
      };
      this.weaponType = 'bow';
      this.walkSpeed = 3.8;
    } else if (job === '도적') {
      this.skills = {
        lucky_seven: { name: '럭키 세븐', level: 1, maxLevel: 20, mpCost: 8, dmgMult: 1.5, icon: '⭐', desc: '수리검 2개를 날려 크리티컬 폭발' },
        double_stab: { name: '더블 스탭', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.3, icon: '🗡️', desc: '단검으로 급소를 2연속 찌르기' },
        flash_jump: { name: '플래시 점프', level: 1, maxLevel: 5, mpCost: 6, icon: '⚡', desc: '공중에서 2단 대쉬 점프' },
        haste: { name: '헤이스트', level: 1, maxLevel: 10, mpCost: 10, icon: '💨', desc: '이동속도와 점프력을 대폭 증가' }
      };
      this.weaponType = 'claw';
      this.walkSpeed = 4.2;
    } else {
      this.skills = {
        power_strike: { name: '파워 스트라이크', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.8, icon: '⚔️' },
        slash_blast: { name: '슬래시 블러스트', level: 0, maxLevel: 20, mpCost: 10, hpCost: 8, dmgMult: 1.4, icon: '🌀' },
        magic_claw: { name: '매직 클로', level: 0, maxLevel: 20, mpCost: 12, dmgMult: 1.3, icon: '✨' },
        flash_jump: { name: '플래시 점프', level: 0, maxLevel: 5, mpCost: 5, icon: '⚡' },
        recovery: { name: '회복력 향상', level: 1, maxLevel: 10, passive: true, icon: '❤️' }
      };
      this.weaponType = 'sword';
    }
  }

  calcDerivedStats() {
    if (this.job === '전사') {
      this.maxHp = 120 + this.level * 28 + this.str * 6;
      this.maxMp = 30 + this.level * 8 + this.int * 2;
      this.minAtk = Math.max(6, Math.floor(this.str * 1.2 + this.dex * 0.4 + this.level * 3));
      this.maxAtk = Math.max(10, Math.floor(this.str * 1.8 + this.dex * 0.6 + this.level * 4));
    } else if (this.job === '마법사') {
      this.maxHp = 60 + this.level * 14 + this.str * 2;
      this.maxMp = 140 + this.level * 30 + this.int * 7;
      this.minAtk = Math.max(8, Math.floor(this.int * 1.4 + this.luk * 0.4 + this.level * 3));
      this.maxAtk = Math.max(12, Math.floor(this.int * 2.0 + this.luk * 0.6 + this.level * 4));
    } else if (this.job === '궁수') {
      this.maxHp = 80 + this.level * 18 + this.str * 3;
      this.maxMp = 50 + this.level * 12 + this.int * 3;
      this.minAtk = Math.max(7, Math.floor(this.dex * 1.3 + this.str * 0.5 + this.level * 3));
      this.maxAtk = Math.max(11, Math.floor(this.dex * 1.9 + this.str * 0.7 + this.level * 4));
    } else if (this.job === '도적') {
      this.maxHp = 85 + this.level * 20 + this.str * 3;
      this.maxMp = 60 + this.level * 14 + this.int * 3;
      this.minAtk = Math.max(8, Math.floor(this.luk * 1.4 + this.dex * 0.5 + this.level * 3));
      this.maxAtk = Math.max(12, Math.floor(this.luk * 2.1 + this.dex * 0.7 + this.level * 5));
    } else {
      this.maxHp = 70 + this.level * 18 + this.str * 4;
      this.maxMp = 35 + this.level * 10 + this.int * 3;
      this.minAtk = Math.max(4, Math.floor(this.str * 0.9 + this.dex * 0.4 + this.level * 2));
      this.maxAtk = Math.max(8, Math.floor(this.str * 1.5 + this.dex * 0.6 + this.level * 3));
    }
  }

  setJob(jobName) {
    this.job = jobName;
    if (jobName === '전사') this.str = Math.max(25, this.str);
    else if (jobName === '마법사') this.int = Math.max(25, this.int);
    else if (jobName === '궁수') this.dex = Math.max(25, this.dex);
    else if (jobName === '도적') this.luk = Math.max(25, this.luk);

    this.initSkillsForJob(jobName);
    this.calcDerivedStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;
  }

  getDamage() {
    const range = this.maxAtk - this.minAtk;
    const base = this.minAtk + Math.floor(Math.random() * (range + 1));
    const critRate = this.job === '도적' ? 0.45 : (this.job === '궁수' ? 0.35 : 0.22);
    const isCrit = Math.random() < critRate;
    const dmg = isCrit ? Math.floor(base * 1.6) : base;
    return { damage: dmg, isCrit };
  }

  update(dt, map) {
    if (this.attackTimer > 0) this.attackTimer -= dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;

    this.regenTimer += dt;
    if (this.regenTimer >= 5) {
      this.regenTimer = 0;
      const rec = (this.skills.recovery?.level || 1) * 4;
      this.healHp(5 + rec);
      this.healMp(5 + rec);
    }

    Physics.updateEntityFixed(this, map, dt);
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
      this.currentFoothold = null;
      window.audio.playJump();
    }
  }

  flashJump() {
    const boost = 8.5;
    this.vx = (this.facing === 'right' ? 1 : -1) * boost;
    this.vy = -3.8;
    this.onGround = false;
    this.currentFoothold = null;
    window.audio.playFlashJump();
    return true;
  }

  dropThrough() {
    if (this.onGround && this.currentFoothold && this.currentFoothold.canDropThrough) {
      this.dropThroughTimer = 18;
      this.y += 6;
      this.vy = 2.5;
      this.onGround = false;
      this.currentFoothold = null;
    }
  }

  climbUp(map) {
    if (!this.onLadder) {
      const lad = Physics.checkLadderGrab(this, map, 'up');
      if (lad) {
        this.onLadder = true;
        this.currentLadder = lad;
        this.x = lad.x; // Snap precisely to ladder X!
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
        this.x = lad.x; // Snap precisely to ladder X!
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

  normalAttack(game) {
    if (this.attackTimer > 0) return false;
    this.attackTimer = this.attackDuration;
    window.audio.playAttack();

    const dirSign = this.facing === 'right' ? 1 : -1;

    if (this.job === '궁수') {
      const { damage, isCrit } = this.getDamage();
      game.projectiles.push(new Projectile(this.x + dirSign * 16, this.y - 16, dirSign * 500, 0, 'arrow', damage, isCrit, this));
      return true;
    } else if (this.job === '도적') {
      const { damage, isCrit } = this.getDamage();
      game.projectiles.push(new Projectile(this.x + dirSign * 16, this.y - 16, dirSign * 540, 0, 'shuriken', damage, isCrit, this));
      return true;
    } else if (this.job === '마법사') {
      const { damage, isCrit } = this.getDamage();
      game.projectiles.push(new Projectile(this.x + dirSign * 16, this.y - 16, dirSign * 420, 0, 'energy_bolt', damage, isCrit, this));
      return true;
    }

    const range = 58;
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
        m.takeDamage(damage, isCrit, this.facing, game);
        game.spawnStaggeredDamage(m.x, m.y - m.height * 0.7, damage, isCrit);
        hit = true;
      }
    }
    return hit;
  }

  useSkill(skillId, game) {
    if (this.attackTimer > 0) return false;
    const skill = this.skills[skillId];
    if (!skill || skill.level <= 0) return false;

    const dirSign = this.facing === 'right' ? 1 : -1;

    if (skillId === 'power_strike') {
      if (this.mp < skill.mpCost) return false;
      this.mp -= skill.mpCost;
      this.attackTimer = this.attackDuration * 1.1;
      window.audio.playPowerStrike();

      game.skillEffects.push({
        type: 'power_strike',
        x: this.facing === 'right' ? this.x + 30 : this.x - 30,
        y: this.y - 15,
        progress: 0,
        duration: 0.35
      });

      const hitBox = {
        x: this.facing === 'right' ? this.x : this.x - 70,
        y: this.y - 45,
        width: 70,
        height: 48
      };

      for (const m of game.monsters) {
        if (m.isAlive() && this.checkCollision(hitBox, m.getHitBox())) {
          const { damage } = this.getDamage();
          const strikeDmg = Math.floor(damage * (skill.dmgMult + skill.level * 0.08));
          m.takeDamage(strikeDmg, true, this.facing, game);
          game.spawnStaggeredDamage(m.x, m.y - m.height * 0.8, strikeDmg, true);
          break;
        }
      }
      return true;
    } else if (skillId === 'slash_blast') {
      if (this.mp < skill.mpCost || this.hp <= skill.hpCost) return false;
      this.mp -= skill.mpCost;
      this.hp -= skill.hpCost;
      this.attackTimer = this.attackDuration * 1.2;
      window.audio.playSlashBlast();

      game.skillEffects.push({
        type: 'slash_blast',
        x: this.x,
        y: this.y - 15,
        progress: 0,
        duration: 0.4
      });

      const radius = 100;
      for (const m of game.monsters) {
        if (m.isAlive()) {
          const dist = Math.hypot(m.x - this.x, (m.y - m.height / 2) - (this.y - 18));
          if (dist <= radius) {
            const { damage, isCrit } = this.getDamage();
            const slashDmg = Math.floor(damage * (skill.dmgMult + skill.level * 0.05));
            m.takeDamage(slashDmg, isCrit, m.x > this.x ? 'right' : 'left', game);
            game.spawnStaggeredDamage(m.x, m.y - m.height * 0.7, slashDmg, isCrit);
          }
        }
      }
      return true;
    } else if (skillId === 'energy_bolt') {
      if (this.mp < skill.mpCost) return false;
      this.mp -= skill.mpCost;
      this.attackTimer = this.attackDuration;
      window.audio.playAttack();
      const { damage, isCrit } = this.getDamage();
      game.projectiles.push(new Projectile(this.x + dirSign * 16, this.y - 16, dirSign * 440, 0, 'energy_bolt', Math.floor(damage * 1.4), isCrit, this));
      return true;
    } else if (skillId === 'magic_claw') {
      if (this.mp < skill.mpCost) return false;
      this.mp -= skill.mpCost;
      this.attackTimer = this.attackDuration * 1.1;
      window.audio.playMagicClaw();

      const range = 120;
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

          for (let hit = 0; hit < 2; hit++) {
            setTimeout(() => {
              if (m.isAlive()) {
                const { damage, isCrit } = this.getDamage();
                const clawDmg = Math.floor(damage * (1.1 + skill.level * 0.06));
                m.takeDamage(clawDmg, isCrit, this.facing, game);
                game.spawnStaggeredDamage(m.x + (hit * 12 - 6), m.y - m.height * 0.8 - hit * 15, clawDmg, isCrit);
              }
            }, hit * 120);
          }
          break;
        }
      }
      return true;
    } else if (skillId === 'teleport') {
      if (this.mp < skill.mpCost) return false;
      this.mp -= skill.mpCost;
      this.x += dirSign * 130;
      window.audio.playFlashJump();
      return true;
    } else if (skillId === 'arrow_blow') {
      if (this.mp < skill.mpCost) return false;
      this.mp -= skill.mpCost;
      this.attackTimer = this.attackDuration;
      window.audio.playAttack();
      const { damage } = this.getDamage();
      game.projectiles.push(new Projectile(this.x + dirSign * 16, this.y - 16, dirSign * 520, 0, 'arrow', Math.floor(damage * 1.8), true, this));
      return true;
    } else if (skillId === 'double_shot') {
      if (this.mp < skill.mpCost) return false;
      this.mp -= skill.mpCost;
      this.attackTimer = this.attackDuration * 1.2;
      window.audio.playAttack();

      for (let s = 0; s < 2; s++) {
        setTimeout(() => {
          const { damage, isCrit } = this.getDamage();
          game.projectiles.push(new Projectile(this.x + dirSign * 16, this.y - 16, dirSign * 500, 0, 'arrow', Math.floor(damage * 1.25), isCrit, this));
        }, s * 140);
      }
      return true;
    } else if (skillId === 'lucky_seven') {
      if (this.mp < skill.mpCost) return false;
      this.mp -= skill.mpCost;
      this.attackTimer = this.attackDuration * 1.1;
      window.audio.playAttack();

      for (let s = 0; s < 2; s++) {
        setTimeout(() => {
          const { damage } = this.getDamage();
          const starDmg = Math.floor(damage * 1.7);
          game.projectiles.push(new Projectile(this.x + dirSign * 16, this.y - 16 + (s * 8 - 4), dirSign * 560, (s * 40 - 20), 'shuriken', starDmg, true, this));
        }, s * 100);
      }
      return true;
    } else if (skillId === 'double_stab') {
      if (this.mp < skill.mpCost) return false;
      this.mp -= skill.mpCost;
      this.attackTimer = this.attackDuration * 0.9;
      window.audio.playAttack();

      const range = 52;
      const hitBox = {
        x: this.facing === 'right' ? this.x : this.x - range,
        y: this.y - 36,
        width: range,
        height: 38
      };

      for (const m of game.monsters) {
        if (m.isAlive() && this.checkCollision(hitBox, m.getHitBox())) {
          for (let s = 0; s < 2; s++) {
            setTimeout(() => {
              if (m.isAlive()) {
                const { damage, isCrit } = this.getDamage();
                m.takeDamage(damage, isCrit, this.facing, game);
                game.spawnStaggeredDamage(m.x + (s * 10 - 5), m.y - m.height * 0.7 - s * 12, damage, isCrit);
              }
            }, s * 100);
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
    this.invincibleTimer = 1.2;
    window.audio.playHit();

    // Knockback
    this.vx = (this.facing === 'right' ? -1 : 1) * 3.5;
    this.vy = -2.8;
    this.onGround = false;
    this.currentFoothold = null;

    if (this.hp <= 0) {
      this.hp = 0;
      setTimeout(() => {
        this.resurrect();
      }, 3000);
    }
  }

  resurrect() {
    this.hp = Math.floor(this.maxHp * 0.5);
    this.mp = Math.floor(this.maxMp * 0.5);
    this.x = 400;
    this.y = 1318;
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

    if (this.level >= 10 && this.job === '초보자') {
      game.ui.showJobAdvancementModal();
    }
  }

  advanceJob(newJob) {
    this.setJob(newJob);
  }

  addMeso(amount, game) {
    this.meso += amount;
    window.audio.playPickItem();
    game.spawnMesoText(this.x, this.y - 35, amount);
  }

  addItem(itemId, name, count = 1, game) {
    window.audio.playPickItem();
    game.spawnItemText(this.x, this.y - 35, name);

    const useItem = this.inventory.use.find(i => i.id === itemId);
    if (useItem) {
      useItem.count += count;
      return;
    }
    const etcItem = this.inventory.etc.find(i => i.id === itemId);
    if (etcItem) {
      etcItem.count += count;
      return;
    }
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
    this.currentFoothold = null;
    this.hitTimer = 0;
    this.hitstopTimer = 0;

    this.initMonsterType(type);
    this.hp = this.maxHp;

    this.moveTimer = Math.random() * 2;
    this.moveDir = 0;
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
      case 'zombie_mushroom':
        this.name = '좀비버섯';
        this.level = 15;
        this.maxHp = 420;
        this.exp = 60;
        this.atk = 48;
        this.speed = 1.4;
        this.width = 36;
        this.height = 32;
        this.dropTable = [
          { type: 'meso', chance: 0.95, min: 65, max: 160 },
          { type: 'etc', name: '죽은자의 부적', chance: 0.8 },
          { type: 'blue_potion', name: '파란 포션', chance: 0.45 }
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

    // Hitstop Freeze
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
    }

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
        this.moveDir = 0;
      }

      if ((this.type === 'slime' || this.type === 'orange_mushroom' || this.type === 'mushmom') && this.onGround && Math.random() < 0.6) {
        this.vy = -6.5;
        this.onGround = false;
        this.currentFoothold = null;
      }
    }

    if (this.onGround && this.hitTimer <= 0) {
      this.vx = this.moveDir * this.speed;
    }

    // Foothold Edge Boundary Check
    if (this.currentFoothold && this.onGround) {
      if (this.x - 8 <= this.currentFoothold.x1) {
        this.moveDir = 1;
        this.facing = 'right';
      } else if (this.x + 8 >= this.currentFoothold.x2) {
        this.moveDir = -1;
        this.facing = 'left';
      }
    }

    Physics.updateEntityFixed(this, map, dt);

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

  takeDamage(amount, isCrit, fromDir, game) {
    this.hp -= amount;
    this.hitTimer = 0.15;
    this.hitstopTimer = 0.08; // 0.08s hitstop!
    window.audio.playHit();

    // Parabolic knockback
    const hitDir = (fromDir === 'right' ? 1 : -1);
    this.vx = hitDir * 3.2;
    this.vy = -2.0;
    this.onGround = false;
    this.currentFoothold = null;

    if (this.hp <= 0) {
      this.hp = 0;
    }
  }

  die(player, game) {
    window.audio.playMonsterDie();
    player.gainExp(this.exp, game);

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
    this.currentFoothold = null;
    this.life = 60.0;
  }

  update(dt, map) {
    this.life -= dt;
    if (!this.onGround) {
      this.vx *= 0.95;
    } else {
      this.vx = 0;
    }
    Physics.updateEntityFixed(this, map, dt);
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
    this.type = type;
    this.isCrit = isCrit;
    this.life = 1.0;
    this.vy = -1.2;
  }

  update(dt) {
    this.y += this.vy;
    this.life -= dt * 1.1;
  }
}

window.DamageDigit = DamageDigit;
window.Projectile = Projectile;
window.Player = Player;
window.Monster = Monster;
window.DropItem = DropItem;
window.FloatingText = FloatingText;
