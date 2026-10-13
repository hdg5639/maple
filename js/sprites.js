// js/sprites.js - Authentic MapleStory Sprite Engine with Genuine Nexon Assets

class SpriteRenderer {
  constructor() {
    this.loaded = false;
    this.images = {};
    this.dustParticles = [];

    this.initAssets();
  }

  loadImage(key, path) {
    const img = new Image();
    img.src = path;
    this.images[key] = img;
    return img;
  }

  initAssets() {
    // 1. Preload Player Classes (5 Jobs: Beginner, Warrior, Magician, Bowman, Thief)
    const jobs = ['beginner', 'warrior', 'magician', 'bowman', 'thief'];
    const playerActions = [
      'stand_0', 'stand_1', 'stand_2',
      'walk_0', 'walk_1', 'walk_2', 'walk_3',
      'jump_0',
      'attack_0', 'attack_1', 'attack_2',
      'ladder_0', 'rope_0'
    ];

    this.playerSprites = {};
    jobs.forEach(job => {
      this.playerSprites[job] = {};
      playerActions.forEach(act => {
        this.playerSprites[job][act] = this.loadImage(`player_${job}_${act}`, `assets/player/${job}/${act}.png`);
      });
    });

    // 2. Preload Monsters (Stand, Move, Hit, Die)
    const mobs = [
      { name: 'snail', stand: 1, move: 5, hit: 1, die: 9 },
      { name: 'blue_snail', stand: 1, move: 4, hit: 1, die: 3 },
      { name: 'red_snail', stand: 1, move: 4, hit: 1, die: 3 },
      { name: 'slime', stand: 3, move: 7, hit: 1, die: 4 },
      { name: 'ribbon_pig', stand: 3, move: 3, hit: 1, die: 3 },
      { name: 'orange_mushroom', stand: 2, move: 3, hit: 1, die: 3 },
      { name: 'green_mushroom', stand: 3, move: 4, hit: 1, die: 4 },
      { name: 'mushmom', stand: 1, move: 6, hit: 1, die: 6 },
      { name: 'zombie_mushroom', stand: 1, move: 6, hit: 1, die: 5 }
    ];

    this.monsterSprites = {};
    mobs.forEach(m => {
      this.monsterSprites[m.name] = {
        stand: [],
        move: [],
        hit1: [],
        die1: []
      };

      for (let i = 0; i < m.stand; i++) {
        this.monsterSprites[m.name].stand.push(
          this.loadImage(`mob_${m.name}_stand_${i}`, `assets/monsters/${m.name}/stand_${i}.png`)
        );
      }
      for (let i = 0; i < m.move; i++) {
        this.monsterSprites[m.name].move.push(
          this.loadImage(`mob_${m.name}_move_${i}`, `assets/monsters/${m.name}/move_${i}.png`)
        );
      }
      for (let i = 0; i < m.hit; i++) {
        this.monsterSprites[m.name].hit1.push(
          this.loadImage(`mob_${m.name}_hit1_${i}`, `assets/monsters/${m.name}/hit1_${i}.png`)
        );
      }
      for (let i = 0; i < m.die; i++) {
        this.monsterSprites[m.name].die1.push(
          this.loadImage(`mob_${m.name}_die1_${i}`, `assets/monsters/${m.name}/die1_${i}.png`)
        );
      }
    });

    // 3. Preload Damage Digits (Normal 0-9, Crit 0-9, Crit Star, Miss)
    this.damageSprites = {
      normal: {},
      crit: {}
    };
    for (let d = 0; d <= 9; d++) {
      this.damageSprites.normal[d] = this.loadImage(`dmg_norm_${d}`, `assets/ui/damage/normal_${d}.png`);
      this.damageSprites.crit[d] = this.loadImage(`dmg_crit_${d}`, `assets/ui/damage/crit_${d}.png`);
    }
    this.critStar = this.loadImage('dmg_crit_star', 'assets/ui/damage/crit_star.png');
    this.missImg = this.loadImage('dmg_miss', 'assets/ui/damage/miss.png');

    // 4. Preload Projectiles
    this.projectiles = {
      arrow: this.loadImage('proj_arrow', 'assets/projectiles/arrow.png'),
      shuriken: this.loadImage('proj_shuriken', 'assets/projectiles/shuriken.png'),
      energy_bolt: this.loadImage('proj_energy_bolt', 'assets/projectiles/energy_bolt.png')
    };

    // 5. Preload Drops (Meso coins & Item loot)
    this.drops = {
      meso_bronze: this.loadImage('drop_meso_b', 'assets/ui/drops/meso_bronze.png'),
      meso_silver: this.loadImage('drop_meso_s', 'assets/ui/drops/meso_silver.png'),
      meso_gold: this.loadImage('drop_meso_g', 'assets/ui/drops/meso_gold.png'),
      meso_bag: this.loadImage('drop_meso_bag', 'assets/ui/drops/meso_bag.png'),
      red_potion: this.loadImage('item_red_pot', 'assets/items/red_potion.png'),
      blue_potion: this.loadImage('item_blue_pot', 'assets/items/blue_potion.png'),
      snail_shell: this.loadImage('item_shell', 'assets/items/snail_shell.png'),
      blue_snail_shell: this.loadImage('item_b_shell', 'assets/items/blue_snail_shell.png'),
      red_snail_shell: this.loadImage('item_r_shell', 'assets/items/red_snail_shell.png'),
      mushroom_cap: this.loadImage('item_mush_cap', 'assets/items/mushroom_cap.png'),
      slime_liquid: this.loadImage('item_slime_liq', 'assets/items/slime_liquid.png'),
      ribbon: this.loadImage('item_ribbon', 'assets/items/ribbon.png')
    };

    // 6. Preload Minimap
    this.minimapImg = this.loadImage('ui_minimap', 'assets/map/henesys_minimap.png');

    // 7. Preload NPCs
    this.npcs = {
      regular_cab: this.loadImage('npc_regular_cab', 'assets/npcs/regular_cab.png'),
      vip_cab: this.loadImage('npc_vip_cab', 'assets/npcs/vip_cab.png'),
      chief_stan: this.loadImage('npc_chief_stan', 'assets/npcs/chief_stan.png'),
      betty: this.loadImage('npc_betty', 'assets/npcs/betty.png'),
      maya: this.loadImage('npc_maya', 'assets/npcs/maya.png'),
      adobis: this.loadImage('npc_adobis', 'assets/npcs/adobis.png')
    };

    // 8. Preload Zakum Boss (Body 8 frames, Arms 1..8 with 8 frames each)
    this.zakum = {
      body: [],
      arms: {}
    };
    for (let f = 0; f < 8; f++) {
      this.zakum.body.push(this.loadImage(`zakum_body_${f}`, `assets/monsters/zakum/stand_${f}.png`));
    }
    for (let armId = 1; armId <= 8; armId++) {
      this.zakum.arms[armId] = [];
      for (let f = 0; f < 8; f++) {
        this.zakum.arms[armId].push(this.loadImage(`zakum_arm_${armId}_${f}`, `assets/monsters/zakum/arm_${armId}_${f}.png`));
      }
    }
  }

  // --- Dust Particles ---
  spawnLandingDust(x, y) {
    for (let i = 0; i < 4; i++) {
      this.dustParticles.push({
        x: x + (i * 8 - 12),
        y: y,
        vx: (i < 2 ? -1 : 1) * (1.2 + Math.random() * 1.5),
        vy: -0.8 - Math.random() * 0.8,
        radius: 3.5 + Math.random() * 2.5,
        alpha: 0.85,
        life: 0.28
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= dt * 3.0;
      p.radius *= 0.96;
      if (p.alpha <= 0 || p.radius <= 0.5) {
        this.dustParticles.splice(i, 1);
      }
    }
  }

  drawDustParticles(ctx) {
    this.dustParticles.forEach(p => {
      ctx.save();
      ctx.fillStyle = `rgba(240, 245, 250, ${Math.max(0, p.alpha)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // --- DRAW PLAYER (GENUINE MAPLESTORY PIXEL SPRITE) ---
  drawPlayer(ctx, player) {
    ctx.save();
    ctx.translate(Math.round(player.x), Math.round(player.y));

    // Facing direction
    if (player.facing === 'left') {
      ctx.scale(-1, 1);
    }

    // Invincible flicker
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 14) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Dead state
    if (player.hp <= 0) {
      this.drawTombstone(ctx, player);
      ctx.restore();
      return;
    }

    // Determine Job Key
    let jobKey = 'beginner';
    if (player.job === '전사') jobKey = 'warrior';
    else if (player.job === '마법사') jobKey = 'magician';
    else if (player.job === '궁수') jobKey = 'bowman';
    else if (player.job === '도적') jobKey = 'thief';

    const jobSprites = this.playerSprites[jobKey] || this.playerSprites['beginner'];

    // Determine Action and Frame
    const now = performance.now();
    let actionKey = 'stand_0';

    if (player.onLadder) {
      const isRope = player.currentLadder && !player.currentLadder.isLadder;
      actionKey = isRope ? 'rope_0' : 'ladder_0';
    } else if (player.attackTimer > 0) {
      const attackProgress = 1 - (player.attackTimer / player.attackDuration);
      const frameIdx = Math.min(2, Math.floor(attackProgress * 3));
      actionKey = `attack_${frameIdx}`;
    } else if (!player.onGround) {
      actionKey = 'jump_0';
    } else if (player.vx !== 0) {
      const walkFrame = Math.floor(now / 140) % 4;
      actionKey = `walk_${walkFrame}`;
    } else {
      const standFrame = Math.floor(now / 400) % 3;
      actionKey = `stand_${standFrame}`;
    }

    const sprite = jobSprites[actionKey] || jobSprites['stand_0'];

    // Shadow on ground
    if (player.onGround) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, 1, 15, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Character Sprite (aligned to feet at y=0)
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      const sw = sprite.naturalWidth;
      const sh = sprite.naturalHeight;
      // Draw centered horizontally, bottom aligned with offset
      ctx.drawImage(sprite, -sw / 2, -sh + 2, sw, sh);
    } else {
      // Fallback
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-12, -40, 24, 40);
    }

    ctx.restore();

    // Draw Character Name Tag (Never mirrored!)
    this.drawPlayerNameTag(ctx, player);
  }

  drawPlayerNameTag(ctx, player) {
    ctx.save();
    ctx.translate(Math.round(player.x), Math.round(player.y + 6));

    const nameText = player.name || '단풍모험가';
    ctx.font = 'bold 11px "Malgun Gothic", "Gulim", sans-serif';
    ctx.textAlign = 'center';
    const tw = ctx.measureText(nameText).width;

    // Classic Maple Dark Blue/Black Name Pill
    const pw = tw + 14;
    const ph = 16;
    ctx.fillStyle = 'rgba(15, 20, 30, 0.78)';
    ctx.beginPath();
    ctx.roundRect(-pw / 2, 0, pw, ph, 4);
    ctx.fill();
    ctx.strokeStyle = '#c8a86b';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(nameText, 0, 12);

    ctx.restore();
  }

  drawTombstone(ctx, player) {
    ctx.fillStyle = '#78716c';
    ctx.fillRect(-10, -32, 20, 32);
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -32, 20, 32);
    ctx.fillStyle = '#f5f5f4';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('R.I.P', 0, -18);
  }

  // --- DRAW MONSTER (GENUINE MAPLESTORY PIXEL SPRITE) ---
  drawMonster(ctx, m) {
    if (!m) return;
    const mobKey = m.type || 'slime';
    const mobData = this.monsterSprites[mobKey] || this.monsterSprites['slime'];

    const now = performance.now();
    let frameList = mobData.stand;
    let frameIdx = 0;

    if (!m.isAlive()) {
      frameList = mobData.die1.length > 0 ? mobData.die1 : mobData.stand;
      const progress = 1 - (m.deathTimer / 0.5);
      frameIdx = Math.min(frameList.length - 1, Math.floor(progress * frameList.length));
    } else if (m.hitstopTimer > 0) {
      frameList = mobData.hit1.length > 0 ? mobData.hit1 : mobData.stand;
      frameIdx = 0;
    } else if (m.vx !== 0) {
      frameList = mobData.move.length > 0 ? mobData.move : mobData.stand;
      frameIdx = Math.floor(now / 150) % frameList.length;
    } else {
      frameList = mobData.stand;
      frameIdx = Math.floor(now / 350) % frameList.length;
    }

    const sprite = frameList[frameIdx] || frameList[0];

    ctx.save();
    ctx.translate(Math.round(m.x), Math.round(m.y));

    // Facing direction
    if (m.facing === 'right') {
      ctx.scale(-1, 1);
    }

    // Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(12, m.width * 0.45), 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hit Flash
    if (m.hitFlashTimer > 0) {
      ctx.filter = 'brightness(2.5) contrast(1.5)';
    }

    // Draw Monster Sprite (bottom-centered)
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      const sw = sprite.naturalWidth;
      const sh = sprite.naturalHeight;
      ctx.drawImage(sprite, -sw / 2, -sh + 2, sw, sh);
    } else {
      // Fallback
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-m.width / 2, -m.height, m.width, m.height);
    }

    ctx.restore();

    // Draw Monster Name & HP Bar (Never mirrored!)
    if (m.isAlive()) {
      this.drawMonsterUI(ctx, m);
    }
  }

  drawMonsterUI(ctx, m) {
    ctx.save();
    const uiY = m.y - m.height - 10;
    ctx.translate(Math.round(m.x), Math.round(uiY));

    // Name Label
    ctx.font = 'bold 10px "Malgun Gothic", "Gulim", sans-serif';
    ctx.textAlign = 'center';

    // Black stroke + yellow/white text
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.lineWidth = 2.5;
    const label = `Lv.${m.level || 1} ${m.name}`;
    ctx.strokeText(label, 0, -6);
    ctx.fillStyle = m.type === 'mushmom' ? '#fde047' : '#ffffff';
    ctx.fillText(label, 0, -6);

    // HP Bar
    if (m.hp < m.maxHp && m.type !== 'mushmom') {
      const barW = Math.max(34, m.width * 0.9);
      const barH = 5;
      const bx = -barW / 2;
      const by = -2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

      const hpPct = Math.max(0, m.hp / m.maxHp);
      const hpColor = hpPct > 0.5 ? '#22c55e' : (hpPct > 0.25 ? '#eab308' : '#ef4444');
      ctx.fillStyle = hpColor;
      ctx.fillRect(bx, by, barW * hpPct, barH);
    }

    ctx.restore();
  }

  // --- DRAW DAMAGE DIGIT (CLASSIC MAPLESTORY DAMAGE SKIN) ---
  drawDamageDigit(ctx, digit) {
    if (!digit.started || digit.life <= 0) return;
    ctx.save();
    ctx.translate(Math.round(digit.x), Math.round(digit.y));
    const alpha = Math.max(0, Math.min(1, digit.life * 1.6));
    ctx.globalAlpha = alpha;

    // Critical Star Mark / Critical Banner
    if (digit.char === 'CRITICAL') {
      if (this.critStar && this.critStar.complete) {
        ctx.drawImage(this.critStar, -16, -16, 32, 32);
      }
      ctx.restore();
      return;
    }

    // MISS Sprite
    if (digit.char === 'MISS') {
      if (this.missImg && this.missImg.complete) {
        ctx.drawImage(this.missImg, -32, -14, 64, 28);
      }
      ctx.restore();
      return;
    }

    // Number Digits (0-9)
    const d = digit.char;
    const spriteDict = digit.isCrit ? this.damageSprites.crit : this.damageSprites.normal;
    const sprite = spriteDict[d];

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      const sw = sprite.naturalWidth;
      const sh = sprite.naturalHeight;
      ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
    } else {
      // Fallback
      ctx.font = 'bold 20px Impact';
      ctx.fillStyle = digit.isCrit ? '#f59e0b' : '#ec4899';
      ctx.fillText(d, 0, 0);
    }

    ctx.restore();
  }

  // --- DRAW PROJECTILE (ARROW, SHURIKEN, ENERGY BOLT) ---
  drawProjectile(ctx, p) {
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));

    if (p.type === 'arrow') {
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      const sprite = this.projectiles.arrow;
      if (sprite && sprite.complete) {
        ctx.drawImage(sprite, -16, -6, 32, 12);
      }
    } else if (p.type === 'shuriken') {
      // Fast rotation
      const spin = (performance.now() * 0.02) % (Math.PI * 2);
      ctx.rotate(spin);
      const sprite = this.projectiles.shuriken;
      if (sprite && sprite.complete) {
        ctx.drawImage(sprite, -10, -10, 20, 20);
      }
    } else if (p.type === 'energy_bolt') {
      const sprite = this.projectiles.energy_bolt;
      if (sprite && sprite.complete) {
        ctx.drawImage(sprite, -12, -12, 24, 24);
      }
    }

    ctx.restore();
  }

  // --- DRAW DROPS (MESOS & ITEMS) ---
  drawDrop(ctx, drop) {
    ctx.save();
    const bob = Math.sin(performance.now() / 250) * 2.5;
    ctx.translate(Math.round(drop.x), Math.round(drop.y + bob));

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 2 - bob, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    let sprite = null;
    if (drop.type === 'meso') {
      if (drop.amount < 50) sprite = this.drops.meso_bronze;
      else if (drop.amount < 100) sprite = this.drops.meso_silver;
      else if (drop.amount < 500) sprite = this.drops.meso_gold;
      else sprite = this.drops.meso_bag;
    } else {
      sprite = this.drops[drop.type] || this.drops.red_potion;
    }

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      const sw = sprite.naturalWidth;
      const sh = sprite.naturalHeight;
      ctx.drawImage(sprite, -sw / 2, -sh + 2, sw, sh);
    }

    ctx.restore();
  }

  // --- DRAW FLOATING TEXT ---
  drawFloatingText(ctx, ft) {
    ctx.save();
    ctx.translate(Math.round(ft.x), Math.round(ft.y));
    ctx.globalAlpha = Math.max(0, Math.min(1, ft.life));

    if (ft.type === 'miss') {
      if (this.missImg && this.missImg.complete) {
        ctx.drawImage(this.missImg, -32, -14, 64, 28);
      }
    } else if (ft.type === 'meso') {
      ctx.font = 'bold 12px "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.strokeText(`+${ft.text} 메소`, 0, 0);
      ctx.fillStyle = '#fef08a';
      ctx.fillText(`+${ft.text} 메소`, 0, 0);
    } else if (ft.type === 'exp') {
      ctx.font = 'bold 12px "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 2.5;
      ctx.strokeText(`+${ft.text} EXP`, 0, 0);
      ctx.fillStyle = '#67e8f9';
      ctx.fillText(`+${ft.text} EXP`, 0, 0);
    } else if (ft.type === 'item') {
      ctx.font = 'bold 11px "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 2.5;
      ctx.strokeText(`+${ft.text}`, 0, 0);
      ctx.fillStyle = '#86efac';
      ctx.fillText(`+${ft.text}`, 0, 0);
    }

    ctx.restore();
  }

  // --- DRAW SKILL EFFECTS ---
  drawSkillEffects(ctx, fx) {
    ctx.save();
    ctx.translate(Math.round(fx.x), Math.round(fx.y));

    if (fx.type === 'power_strike') {
      const progress = fx.progress;
      ctx.save();
      ctx.rotate((progress - 0.5) * Math.PI * 0.4);
      ctx.fillStyle = 'rgba(250, 204, 21, ' + (1 - progress) + ')';
      ctx.beginPath();
      ctx.moveTo(-15, -90); ctx.lineTo(25, -90); ctx.lineTo(15, 20); ctx.lineTo(-5, 20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (fx.type === 'slash_blast') {
      const progress = fx.progress;
      ctx.save();
      ctx.rotate(progress * Math.PI * 4);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = 'rgba(56, 189, 248, ' + (1 - progress) * 0.8 + ')';
        ctx.beginPath();
        ctx.ellipse(35, 0, 40, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (fx.type === 'magic_claw') {
      const progress = fx.progress;
      ctx.save();
      ctx.strokeStyle = 'rgba(168, 85, 247, ' + (1 - progress) + ')';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-20, -50 + progress * 60); ctx.lineTo(10, 10);
      ctx.moveTo(0, -60 + progress * 60); ctx.lineTo(30, 0);
      ctx.stroke();
      ctx.restore();
    } else if (fx.type === 'level_up') {
      const p = fx.progress;
      const alpha = 1 - p;

      const grad = ctx.createLinearGradient(0, -200, 0, 20);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0)');
      grad.addColorStop(0.5, 'rgba(253, 224, 71, ' + 0.75 * alpha + ')');
      grad.addColorStop(1, 'rgba(234, 179, 8, ' + 0.9 * alpha + ')');
      ctx.fillStyle = grad;
      ctx.fillRect(-28, -200, 56, 220);

      ctx.save();
      ctx.translate(0, -70);
      ctx.font = 'bold 22px "Arial Black", Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(180, 83, 9, ' + alpha + ')';
      ctx.lineWidth = 6;
      ctx.strokeText('LEVEL UP!', 0, -20 - p * 20);
      ctx.fillStyle = 'rgba(254, 240, 138, ' + alpha + ')';
      ctx.fillText('LEVEL UP!', 0, -20 - p * 20);
      ctx.restore();
    }

    ctx.restore();
  }

  // --- DRAW NPC ---
  drawNPC(ctx, npc, isPlayerNear = false) {
    ctx.save();
    const sprite = this.npcs[npc.type];

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      const sw = sprite.naturalWidth;
      const sh = sprite.naturalHeight;
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(npc.x, npc.y + 2, Math.max(16, sw * 0.35), 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // NPC Sprite
      ctx.drawImage(sprite, Math.round(npc.x - sw / 2), Math.round(npc.y - sh), sw, sh);

      // Name Tag (Classic Maple Brown Pill)
      ctx.font = 'bold 11px "Malgun Gothic", Dotum, sans-serif';
      const textMetrics = ctx.measureText(npc.name);
      const tagW = textMetrics.width + 12;
      const tagH = 16;
      const tagX = Math.round(npc.x - tagW / 2);
      const tagY = Math.round(npc.y + 6);

      ctx.fillStyle = '#3a2614';
      ctx.strokeStyle = '#6d4c2b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagW, tagH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, Math.round(npc.x), tagY + 12);

      // Space Interaction Bubble
      if (isPlayerNear) {
        const bounce = Math.sin(performance.now() / 200) * 3;
        const bubbleY = Math.round(npc.y - sh - 14 + bounce);
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(Math.round(npc.x - 42), bubbleY, 84, 18, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#713f12';
        ctx.font = 'bold 10px "Malgun Gothic", sans-serif';
        ctx.fillText('💬 Space 대화', Math.round(npc.x), bubbleY + 13);
      }
    }
    ctx.restore();
  }

  // --- DRAW PORTAL (AUTHENTIC CYAN VORTEX) ---
  drawPortal(ctx, portal) {
    ctx.save();
    const t = performance.now() / 1000;
    const px = Math.round(portal.x);
    const py = Math.round(portal.y);

    // Glowing Oval Base
    const pulse = 0.85 + Math.sin(t * 4) * 0.15;
    ctx.save();
    ctx.translate(px, py - 40);

    // Outer glow
    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 36);
    grad.addColorStop(0, 'rgba(56, 189, 248, ' + (0.85 * pulse) + ')');
    grad.addColorStop(0.6, 'rgba(14, 165, 233, ' + (0.45 * pulse) + ')');
    grad.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spiraling Inner Core
    ctx.rotate(t * 1.5);
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 28, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(t * -3.0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 18, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Rising Sparkles
    for (let i = 0; i < 4; i++) {
      const moteT = (t * 2.5 + i * 1.2) % 3.0;
      const my = py - 10 - moteT * 24;
      const mx = px + Math.sin(t * 3 + i * 2) * 14;
      const alpha = Math.max(0, 1 - (moteT / 3.0));
      ctx.fillStyle = `rgba(186, 230, 253, ${alpha})`;
      ctx.beginPath();
      ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Portal Destination Name Tag
    if (portal.name) {
      ctx.font = 'bold 10px "Malgun Gothic", Dotum, sans-serif';
      const tw = ctx.measureText(portal.name).width;
      const tagW = tw + 10;
      const tagH = 15;
      const tagX = Math.round(px - tagW / 2);
      const tagY = Math.round(py + 6);

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagW, tagH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(portal.name, px, tagY + 11);
    }

    ctx.restore();
  }

  // --- DRAW ZAKUM BOSS (BODY & 8 INDEPENDENT ARMS) ---
  drawZakumBoss(ctx, boss) {
    if (!boss || !boss.isAlive()) return;
    ctx.save();

    const t = performance.now() / 1000;
    const bodyFrameIdx = Math.floor(t * 4) % 8;
    const armFrameIdx = Math.floor(t * 5) % 8;

    // 1. Draw 8 Arms (Arm 1-4 Left, Arm 5-8 Right)
    if (boss.arms) {
      boss.arms.forEach(arm => {
        if (!arm.isAlive) return;

        const armSpriteList = this.zakum.arms[arm.id];
        if (!armSpriteList || !armSpriteList[armFrameIdx]) return;
        const sprite = armSpriteList[armFrameIdx];

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
          const sw = sprite.naturalWidth;
          const sh = sprite.naturalHeight;
          const swayY = Math.sin(t * 2.5 + arm.id) * 4;
          const ax = Math.round(boss.x + arm.offsetX);
          const ay = Math.round(boss.y + arm.offsetY + swayY);

          ctx.save();
          if (arm.hitTimer > 0) {
            // Hit flash
            ctx.filter = 'brightness(2.0)';
          }
          ctx.drawImage(sprite, ax - sw / 2, ay - sh / 2, sw, sh);
          ctx.restore();

          // Small HP gauge above arm if damaged
          if (arm.hp < arm.maxHp) {
            const barW = 40;
            const barH = 4;
            const barX = ax - barW / 2;
            const barY = ay - sh / 2 - 8;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(barX, barY, Math.max(0, (arm.hp / arm.maxHp) * barW), barH);
          }
        }
      });
    }

    // 2. Draw Zakum Body
    const bodySprite = this.zakum.body[bodyFrameIdx];
    if (bodySprite && bodySprite.complete && bodySprite.naturalWidth > 0) {
      const bw = bodySprite.naturalWidth;
      const bh = bodySprite.naturalHeight;
      const bx = Math.round(boss.x - bw / 2);
      const by = Math.round(boss.y - bh / 2);

      ctx.save();
      if (boss.hitTimer > 0) {
        ctx.filter = 'brightness(2.2)';
      }
      ctx.drawImage(bodySprite, bx, by, bw, bh);
      ctx.restore();
    }

    // 3. Draw Active Spells (Lightning / Fire Pillar)
    if (boss.activeSpells) {
      boss.activeSpells.forEach(spell => {
        if (spell.type === 'fire_pillar') {
          const progress = spell.timer / spell.duration;
          ctx.save();
          const fGrad = ctx.createLinearGradient(spell.x, spell.y, spell.x, spell.y - 200);
          fGrad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
          fGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.7)');
          fGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = fGrad;
          ctx.fillRect(spell.x - 30, spell.y - 200, 60, 200);
          ctx.restore();
        } else if (spell.type === 'lightning') {
          ctx.save();
          ctx.strokeStyle = 'rgba(125, 211, 252, 0.9)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(spell.x, 0);
          ctx.lineTo(spell.x - 15, spell.y * 0.4);
          ctx.lineTo(spell.x + 20, spell.y * 0.7);
          ctx.lineTo(spell.x, spell.y);
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    ctx.restore();
  }

  // --- DRAW SPEECH BUBBLE ---
  drawSpeechBubble(ctx, x, y, text) {
    if (!text) return;
    ctx.save();
    ctx.font = '11px "Malgun Gothic", Dotum, sans-serif';
    const tm = ctx.measureText(text);
    const bw = Math.max(48, tm.width + 16);
    const bh = 22;
    const bx = Math.round(x - bw / 2);
    const by = Math.round(y - bh);

    // Bubble Fill & Border
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 5);
    ctx.fill();
    ctx.stroke();

    // Downward Pointer Triangle
    ctx.beginPath();
    ctx.moveTo(x - 4, by + bh);
    ctx.lineTo(x, by + bh + 5);
    ctx.lineTo(x + 4, by + bh);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();

    // Fill over base to clear the stroke line on top of pointer
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 3, by + bh - 1.5, 6, 2);

    // Text
    ctx.fillStyle = '#18181b';
    ctx.textAlign = 'center';
    ctx.fillText(text, Math.round(x), by + 15);

    ctx.restore();
  }
}

window.sprites = new SpriteRenderer();
