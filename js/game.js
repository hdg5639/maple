// js/game.js - Main Game Loop, Camera, Input, Spawning, Projectiles, and Rendering

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.map = new GameMap();
    this.player = new Player(400, 1318);
    this.monsters = [];
    this.drops = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.damageDigits = [];
    this.skillEffects = [];

    this.camera = { x: 0, y: 0, width: 800, height: 600 };
    this.keys = {};
    this.lastTime = performance.now();
    this.boss = null;

    this.autoHunt = new AutoHuntManager(this);
    this.ui = new UIManager(this);

    this.maxMonsters = 24;
    this.spawnTimer = 0;

    this.initCanvasSize();
    this.initInputs();
    this.initMonsters();
    this.loadProgress();

    requestAnimationFrame((t) => this.loop(t));
    setInterval(() => this.saveProgress(), 15000);
  }

  initCanvasSize() {
    const resize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        this.canvas.width = Math.max(300, container.clientWidth || window.innerWidth);
        this.canvas.height = Math.max(300, container.clientHeight || window.innerHeight - 64);
        this.camera.width = this.canvas.width;
        this.camera.height = this.canvas.height;
      }
    };
    window.addEventListener('resize', resize);
    window.addEventListener('load', resize);
    resize();
  }

  initInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'AltLeft', 'ControlLeft'].includes(e.code)) {
        e.preventDefault();
      }

      // Jump
      if (e.code === 'AltLeft' || e.code === 'KeyC') {
        if (this.keys['ArrowDown']) {
          this.player.dropThrough();
        } else {
          this.player.jump();
        }
      }

      // Normal Attack [Ctrl]
      if (e.code === 'ControlLeft') {
        this.player.normalAttack(this);
      }

      // Class Skill 1 [Shift or KeyQ]
      if (e.code === 'ShiftLeft' || e.code === 'KeyQ') {
        const skillId = this.getClassSkillId(0);
        if (skillId) this.player.useSkill(skillId, this);
      }

      // Class Skill 2 [KeyW]
      if (e.code === 'KeyW') {
        const skillId = this.getClassSkillId(1);
        if (skillId) this.player.useSkill(skillId, this);
      }

      // Class Skill 3 [KeyE]
      if (e.code === 'KeyE') {
        const skillId = this.getClassSkillId(2);
        if (skillId) this.player.useSkill(skillId, this);
      }

      // Class Skill 4 / Flash Jump [KeyF]
      if (e.code === 'KeyF') {
        const skillId = this.getClassSkillId(3) || 'flash_jump';
        this.player.useSkill(skillId, this);
      }

      // Item Pick Up [KeyZ]
      if (e.code === 'KeyZ') {
        this.pickUpNearbyDrops();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;

      if ((e.code === 'ArrowLeft' && !this.keys['ArrowRight']) ||
          (e.code === 'ArrowRight' && !this.keys['ArrowLeft'])) {
        this.player.stopHorizontal();
      }

      if ((e.code === 'ArrowUp' && !this.keys['ArrowDown']) ||
          (e.code === 'ArrowDown' && !this.keys['ArrowUp'])) {
        this.player.stopVerticalClimb();
      }
    });
  }

  getClassSkillId(index) {
    const keys = Object.keys(this.player.skills);
    return keys[index] || null;
  }

  changePlayerJob(jobName) {
    this.player.setJob(jobName);
    this.ui.updateQuickslotsForJob(jobName);
    this.ui.updateStatsWindow();
    this.ui.updateSkillsWindow();
    this.spawnItemText(this.player.x, this.player.y - 45, `★ ${jobName} 전직 완료! ★`);
  }

  initMonsters() {
    const spawnList = [
      // Ground Level (Y ~ 1320)
      { type: 'snail', x: 300, y: 1320 },
      { type: 'snail', x: 550, y: 1320 },
      { type: 'blue_snail', x: 800, y: 1320 },
      { type: 'blue_snail', x: 1050, y: 1320 },
      { type: 'slime', x: 1350, y: 1320 },
      { type: 'slime', x: 1650, y: 1320 },
      { type: 'ribbon_pig', x: 1950, y: 1320 },
      { type: 'ribbon_pig', x: 2150, y: 1320 },

      // Tier 1 Platforms (Y ~ 1022)
      { type: 'snail', x: 350, y: 1022 },
      { type: 'blue_snail', x: 700, y: 1022 },
      { type: 'red_snail', x: 1100, y: 1022 },
      { type: 'slime', x: 1550, y: 1022 },
      { type: 'red_snail', x: 1900, y: 1022 },

      // Tier 2 Platforms (Y ~ 782)
      { type: 'slime', x: 450, y: 782 },
      { type: 'orange_mushroom', x: 950, y: 782 },
      { type: 'orange_mushroom', x: 1450, y: 782 },
      { type: 'ribbon_pig', x: 1850, y: 782 },

      // Tier 3 Platforms (Y ~ 542)
      { type: 'orange_mushroom', x: 600, y: 542 },
      { type: 'green_mushroom', x: 1050, y: 542 },
      { type: 'green_mushroom', x: 1500, y: 542 },
      { type: 'zombie_mushroom', x: 1750, y: 542 }
    ];

    spawnList.forEach(sp => {
      this.monsters.push(new Monster(sp.type, sp.x, sp.y));
    });
  }

  spawnMonster() {
    if (this.monsters.filter(m => m.isAlive()).length >= this.maxMonsters) return;

    const fh = this.map.footholds[Math.floor(Math.random() * this.map.footholds.length)];
    const x = fh.x1 + 15 + Math.random() * Math.max(10, (fh.x2 - fh.x1) - 30);
    const y = fh.getYAtX(x);

    let type = 'snail';
    if (y >= 1280) {
      const r = Math.random();
      type = r < 0.25 ? 'snail' : (r < 0.55 ? 'blue_snail' : (r < 0.8 ? 'slime' : 'ribbon_pig'));
    } else if (y >= 950) {
      const r = Math.random();
      type = r < 0.35 ? 'blue_snail' : (r < 0.7 ? 'red_snail' : 'slime');
    } else if (y >= 700) {
      const r = Math.random();
      type = r < 0.4 ? 'slime' : (r < 0.75 ? 'orange_mushroom' : 'ribbon_pig');
    } else {
      const r = Math.random();
      type = r < 0.4 ? 'orange_mushroom' : (r < 0.8 ? 'green_mushroom' : 'zombie_mushroom');
    }

    this.monsters.push(new Monster(type, x, y));
  }

  spawnBoss() {
    if (this.boss && this.boss.isAlive()) {
      this.spawnItemText(this.player.x, this.player.y - 45, '이미 머쉬맘이 소환되어 있습니다!');
      return;
    }

    window.audio.playBossRoar();
    this.boss = new Monster('mushmom', 1500, 542);
    this.monsters.push(this.boss);
    this.spawnItemText(this.player.x, this.player.y - 45, '★ [BOSS] 거대 보스 머쉬맘 출현! ★');

    const bBar = document.getElementById('boss-bar-container');
    if (bBar) bBar.style.display = 'block';
  }

  pickUpNearbyDrops() {
    let picked = false;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      if (drop.canPickUp(this.player)) {
        if (drop.type === 'meso') {
          this.player.addMeso(drop.amount, this);
        } else if (drop.type === 'red_potion') {
          this.player.addItem('red_potion', '빨간 포션', drop.amount, this);
        } else if (drop.type === 'blue_potion') {
          this.player.addItem('blue_potion', '파란 포션', drop.amount, this);
        } else {
          this.player.addItem(drop.type, drop.name, drop.amount, this);
        }
        this.drops.splice(i, 1);
        picked = true;
      }
    }
    return picked;
  }

  spawnDamageText(x, y, damage, isCrit = false, target = 'monster') {
    this.floatingTexts.push(new FloatingText(x, y, `${damage}`, target === 'monster' ? 'damage' : 'miss', isCrit));
  }

  spawnStaggeredDamage(x, y, damage, isCrit = false) {
    const str = `${damage}`;
    const digitSpacing = isCrit ? 15 : 12;
    const totalW = str.length * digitSpacing;
    const startX = x - totalW / 2 + digitSpacing / 2;

    if (isCrit) {
      this.damageDigits.push(new DamageDigit('CRITICAL', x, y - 22, 0, true));
    }

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const digitX = startX + i * digitSpacing;
      const delay = i * 0.04;
      this.damageDigits.push(new DamageDigit(char, digitX, y, delay, isCrit));
    }
  }

  spawnMesoText(x, y, amount) {
    this.floatingTexts.push(new FloatingText(x, y, `${amount}`, 'meso'));
  }

  spawnExpText(x, y, amount) {
    this.floatingTexts.push(new FloatingText(x, y, `${amount}`, 'exp'));
  }

  spawnItemText(x, y, text) {
    this.floatingTexts.push(new FloatingText(x, y, text, 'item'));
  }

  spawnDrop(type, amount, x, y, name = '') {
    this.drops.push(new DropItem(type, amount, x, y, name));
  }

  // --- Main Update Loop ---
  update(dt) {
    if (!this.autoHunt.enabled) {
      if (this.keys['ArrowLeft']) {
        this.player.moveLeft();
      } else if (this.keys['ArrowRight']) {
        this.player.moveRight();
      }

      if (this.keys['ArrowUp']) {
        this.player.climbUp(this.map);
      } else if (this.keys['ArrowDown']) {
        this.player.climbDown(this.map);
      }
    }

    this.autoHunt.update(dt);
    this.map.update(dt);
    this.player.update(dt, this.map);
    this.pickUpNearbyDrops();

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, this);
      if (p.life <= 0 || p.hit) {
        this.projectiles.splice(i, 1);
      }
    }

    // Monster spawns & updates
    this.spawnTimer += dt;
    if (this.spawnTimer >= 1.6) {
      this.spawnTimer = 0;
      this.spawnMonster();
    }

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (m.isAlive()) {
        m.update(dt, this.player, this.map, this);
        if (!m.isAlive()) {
          m.die(this.player, this);
          this.autoHunt.recordKill(m.exp, 20);
          this.monsters.splice(i, 1);
        }
      } else {
        this.monsters.splice(i, 1);
      }
    }

    // Drops update
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.update(dt, this.map);
      if (d.life <= 0) {
        this.drops.splice(i, 1);
      }
    }

    // Damage digits update
    for (let i = this.damageDigits.length - 1; i >= 0; i--) {
      const dd = this.damageDigits[i];
      dd.update(dt);
      if (dd.life <= 0) {
        this.damageDigits.splice(i, 1);
      }
    }

    // Particles update
    window.sprites.updateParticles(dt);

    // Floating text update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.update(dt);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Skill effects update
    for (let i = this.skillEffects.length - 1; i >= 0; i--) {
      const fx = this.skillEffects[i];
      fx.progress += dt / fx.duration;
      if (fx.progress >= 1.0) {
        this.skillEffects.splice(i, 1);
      }
    }

    this.updateCamera();
    this.ui.updateHUD();
    this.updateBossBar();
  }

  updateCamera() {
    const targetX = this.player.x - this.camera.width / 2;
    const targetY = this.player.y - this.camera.height * 0.65;

    this.camera.x += (targetX - this.camera.x) * 0.12;
    this.camera.y += (targetY - this.camera.y) * 0.12;

    this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, this.camera.y));
  }

  updateBossBar() {
    const bBar = document.getElementById('boss-bar-container');
    const bFill = document.getElementById('boss-hp-fill');
    const bText = document.getElementById('boss-hp-text');

    if (this.boss && this.boss.isAlive()) {
      if (bBar) bBar.style.display = 'block';
      const pct = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
      if (bFill) bFill.style.width = `${pct}%`;
      if (bText) bText.innerText = `${this.boss.name} (${this.boss.hp} / ${this.boss.maxHp})`;
    } else {
      if (bBar) bBar.style.display = 'none';
    }
  }

  // --- Main Render Loop ---
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

    // 1. Map & Scenery
    this.map.draw(ctx, this.camera);

    // 2. Drops
    this.drops.forEach(d => window.sprites.drawDrop(ctx, d));

    // 3. Monsters
    this.monsters.forEach(m => window.sprites.drawMonster(ctx, m));

    // 4. Projectiles (Arrows, Shurikens, Energy Bolts)
    this.projectiles.forEach(p => window.sprites.drawProjectile(ctx, p));

    // 5. Player
    window.sprites.drawPlayer(ctx, this.player);

    // 6. Skill Effects
    this.skillEffects.forEach(fx => window.sprites.drawSkillEffects(ctx, fx));

    // 7. Auto-Hunt Crosshair
    this.autoHunt.drawTargetIndicator(ctx);

    // 8. Particles & Staggered Damage Numbers
    window.sprites.drawDustParticles(ctx);
    this.damageDigits.forEach(dd => window.sprites.drawDamageDigit(ctx, dd));
    this.floatingTexts.forEach(ft => window.sprites.drawFloatingText(ctx, ft));

    ctx.restore();

    // 9. Minimap
    this.drawMinimap(ctx);
  }

  drawMinimap(ctx) {
    const mmW = 160;
    const mmH = 126;
    const mmX = this.canvas.width - mmW - 15;
    const mmY = 15;

    ctx.save();
    // Classic Maple Minimap Frame
    ctx.fillStyle = 'rgba(15, 20, 30, 0.88)';
    ctx.beginPath();
    ctx.roundRect(mmX, mmY, mmW, mmH, 6);
    ctx.fill();
    ctx.strokeStyle = '#c8a86b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Title Bar
    ctx.font = 'bold 10px "Malgun Gothic", "Gulim", sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'left';
    ctx.fillText('헤네시스 사냥터 1', mmX + 8, mmY + 14);

    const mapImg = window.sprites.minimapImg;
    const contentX = mmX + 8;
    const contentY = mmY + 20;
    const contentW = mmW - 16;
    const contentH = mmH - 26;

    if (mapImg && mapImg.complete && mapImg.naturalWidth > 0) {
      ctx.drawImage(mapImg, contentX, contentY, contentW, contentH);
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(contentX, contentY, contentW, contentH);
    }

    const scaleX = contentW / this.map.width;
    const scaleY = contentH / this.map.height;

    // Monsters (red dots)
    ctx.fillStyle = '#ef4444';
    this.monsters.forEach(m => {
      if (m.isAlive()) {
        const mx = contentX + m.x * scaleX;
        const my = contentY + m.y * scaleY;
        ctx.fillRect(mx - 1.5, my - 1.5, 3, 3);
      }
    });

    // Player (yellow dot with border)
    const plx = contentX + this.player.x * scaleX;
    const ply = contentY + this.player.y * scaleY;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(plx, ply, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  loop(currentTime) {
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  saveProgress() {
    try {
      const data = {
        level: this.player.level,
        job: this.player.job,
        exp: this.player.exp,
        maxExp: this.player.maxExp,
        hp: this.player.hp,
        mp: this.player.mp,
        str: this.player.str,
        dex: this.player.dex,
        int: this.player.int,
        luk: this.player.luk,
        ap: this.player.ap,
        sp: this.player.sp,
        meso: this.player.meso,
        inventory: this.player.inventory,
        skills: this.player.skills
      };
      localStorage.setItem('openmaple_save', JSON.stringify(data));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem('openmaple_save');
      if (raw) {
        const data = JSON.parse(raw);
        this.player.level = data.level || 1;
        this.player.job = data.job || '초보자';
        this.player.exp = data.exp || 0;
        this.player.maxExp = data.maxExp || 15;
        this.player.str = data.str || 12;
        this.player.dex = data.dex || 8;
        this.player.int = data.int || 4;
        this.player.luk = data.luk || 4;
        this.player.ap = data.ap || 5;
        this.player.sp = data.sp || 3;
        this.player.meso = data.meso || 100;
        if (data.inventory) this.player.inventory = data.inventory;
        if (data.skills) this.player.skills = data.skills;

        this.player.calcDerivedStats();
        this.player.hp = Math.min(this.player.maxHp, data.hp || this.player.maxHp);
        this.player.mp = Math.min(this.player.maxMp, data.mp || this.player.maxMp);
        this.ui.updateQuickslotsForJob(this.player.job);
      }
    } catch (e) {
      console.warn('Load failed:', e);
    }
  }

  resetProgress() {
    localStorage.removeItem('openmaple_save');
    window.location.reload();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
