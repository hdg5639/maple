// js/sprites.js - Authentic MapleStory Sprite Engine with Genuine Nexon Assets

class SpriteRenderer {
  constructor() {
    this.loaded = false;
    this.images = {};
    this.spriteFootY = new WeakMap();
    this.dustParticles = [];
    this.levelUpGlow = this.bakeLevelUpGlow();

    this.initAssets();
  }

  loadImage(key, path) {
    const img = new Image();
    const footY = window.SPRITE_FOOT_Y?.[path];
    if (footY !== undefined) this.spriteFootY.set(img, footY);
    img.src = path;
    this.images[key] = img;
    return img;
  }

  drawFootAlignedSprite(ctx, sprite) {
    const width = sprite.naturalWidth;
    const height = sprite.naturalHeight;
    const footY = this.spriteFootY.get(sprite) ?? height;
    ctx.drawImage(sprite, -width / 2, -footY, width, height);
  }

  bakeLevelUpGlow() {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    const glow = ctx.createRadialGradient(90, 170, 4, 90, 150, 100);
    glow.addColorStop(0, 'rgba(255,250,210,0.5)');
    glow.addColorStop(0.45, 'rgba(255,215,90,0.2)');
    glow.addColorStop(1, 'rgba(255,215,90,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(90, 135, 88, 105, 0, 0, Math.PI*2);
    ctx.fill();
    const light = ctx.createLinearGradient(0, 20, 0, 235);
    light.addColorStop(0, 'rgba(255,250,220,0)');
    light.addColorStop(0.65, 'rgba(255,245,180,0.45)');
    light.addColorStop(1, 'rgba(255,230,150,0)');
    ctx.fillStyle = light;
    for (let ray=0;ray<7;ray++) {
      const x=35+ray*18;
      ctx.beginPath();
      ctx.moveTo(84+ray*2,235);
      ctx.quadraticCurveTo(x,120,x-5,20+ray%3*18);
      ctx.quadraticCurveTo(x+18,140,96+ray*2,235);
      ctx.fill();
    }
    return canvas;
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
    this.monsterSprites = {};
    for (const [name, record] of Object.entries(window.MONSTER_ASSETS || {})) {
      const frames = this.monsterSprites[name] = {};
      for (const action of ['stand', 'move', 'hit1', 'die1']) {
        frames[action] = [];
        for (let index = 0; index < record.frames[action]; index++) {
          frames[action].push(this.loadImage(`mob_${name}_${action}_${index}`, `assets/monsters/${name}/${action}_${index}.png`));
        }
      }
    }

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
    if (player.facing === 'right') {
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
      const attackProgress = 1 - (player.attackTimer / (player.attackAnimationDuration || player.attackDuration));
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
      this.drawFootAlignedSprite(ctx, sprite);
    } else {
      // Fallback
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-12, -40, 24, 40);
    }

    // Draw Equipped Weapon on Player's Hands
    this.drawEquippedWeapon(ctx, player, actionKey);

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
    const now = performance.now();

    // 1. Arched Stone Monument (Tombstone)
    ctx.save();
    // Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone Base Outline
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.9)';
    ctx.fillStyle = '#78716c';

    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-12, -26);
    ctx.arcTo(-12, -38, 0, -38, 12);
    ctx.arcTo(12, -38, 12, -26, 12);
    ctx.lineTo(12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cel-Shading Highlight & Shadow
    ctx.fillStyle = '#a8a29e';
    ctx.beginPath();
    ctx.arc(0, -28, 8, Math.PI, Math.PI * 1.5);
    ctx.lineTo(0, -20);
    ctx.closePath();
    ctx.fill();

    // Engraved Stone Cross & Text
    ctx.fillStyle = '#292524';
    ctx.fillRect(-2, -32, 4, 12);
    ctx.fillRect(-6, -28, 12, 4);

    ctx.fillStyle = '#f5f5f4';
    ctx.font = 'bold 9px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('R.I.P', 0, -10);
    ctx.restore();

    // 2. Translucent Floating Angel/Ghost
    const ghostFloat = Math.sin(now / 220) * 4;
    const ghostY = -52 + ghostFloat;
    ctx.save();
    ctx.translate(0, ghostY);
    ctx.globalAlpha = 0.85;

    // Golden Halo
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -18, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Cute Angel Wings
    const wingFlap = Math.sin(now / 150) * 3;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.ellipse(-10, -4 + wingFlap, 6, 3, -0.4, 0, Math.PI * 2);
    ctx.ellipse(10, -4 + wingFlap, 6, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Ghost Head & Body
    ctx.fillStyle = 'rgba(240, 248, 255, 0.95)';
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-2.5, -6, 1.2, 0, Math.PI * 2);
    ctx.arc(2.5, -6, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Blushing cheeks
    ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
    ctx.beginPath();
    ctx.arc(-4, -4, 1.5, 0, Math.PI * 2);
    ctx.arc(4, -4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- DRAW MONSTER (GENUINE MAPLESTORY PIXEL SPRITE) ---
  getSpriteHitMask(sprite) {
    if (!this.hitMasks) this.hitMasks = new WeakMap();
    if (!this.hitMasks.has(sprite)) {
      const mask = document.createElement('canvas');
      mask.width = sprite.naturalWidth;
      mask.height = sprite.naturalHeight;
      const maskContext = mask.getContext('2d');
      maskContext.drawImage(sprite, 0, 0);
      maskContext.globalCompositeOperation = 'source-in';
      maskContext.fillStyle = '#fff';
      maskContext.fillRect(0, 0, mask.width, mask.height);
      this.hitMasks.set(sprite, mask);
    }
    return this.hitMasks.get(sprite);
  }

  drawMonster(ctx, m) {
    if (!m) return;
    const mobKey = m.type || 'slime';
    const mobData = this.monsterSprites[mobKey] || this.monsterSprites['slime'];

    const now = performance.now();
    let frameList = mobData.stand;
    let frameIdx = 0;

    const isDying = Boolean((m.isDying && m.isDying()) || (!m.isAlive() && m.state === 'dying'));
    if (isDying) {
      frameList = (mobData.die1 && mobData.die1.length > 0) ? mobData.die1 : mobData.stand;
      const dTimer = (m.dyingTimer !== undefined ? m.dyingTimer : (m.deathTimer || 0));
      const dDur = m.dyingDuration || 0.45;
      const progress = Math.max(0, Math.min(1, 1 - (dTimer / dDur)));
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
    if (isDying) ctx.globalAlpha *= Math.max(0, (m.dyingTimer || 0) / (m.dyingDuration || 0.45));

    // Facing direction
    if (m.facing === 'right') {
      ctx.scale(-1, 1);
    }

    // Shadow on ground
    if (m.onGround) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(12, m.width * 0.45), 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Entity y is the visible foot contact, not the GIF frame's padded bottom.
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      this.drawFootAlignedSprite(ctx, sprite);
      if (m.hitFlashTimer > 0) {
        ctx.save();
        ctx.globalAlpha *= Math.min(1, m.hitFlashTimer / 0.12);
        const footY = this.spriteFootY.get(sprite) ?? sprite.naturalHeight;
        ctx.drawImage(this.getSpriteHitMask(sprite), -sprite.naturalWidth / 2, -footY);
        ctx.restore();
      }
    }

    ctx.restore();

    // Draw Monster Name & HP Bar (Never mirrored!)
    if (m.isAlive() && !isDying) {
      this.drawMonsterUI(ctx, m);
    }
  }

  drawMonsterUI(ctx, m) {
    ctx.save();
    const yOff = m.labelYOffset || 0;
    const uiY = m.y - m.height - 10 - yOff;
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
      this.drawThrowingStar(ctx, p.starType || 'steely', 18);
    } else if (p.type === 'energy_bolt') {
      const sprite = this.projectiles.energy_bolt;
      if (sprite && sprite.complete) {
        ctx.drawImage(sprite, -12, -12, 24, 24);
      }
    } else if (p.type === 'snail_shell') {
      const spin = (performance.now() * 0.018 * Math.sign(p.vx || 1)) % (Math.PI * 2);
      ctx.rotate(spin);
      const sprite = this.drops ? this.drops.snail_shell : null;
      if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        ctx.drawImage(sprite, -12, -12, 24, 24);
      } else {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (p.type === 'arrow_bomb') {
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(14, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      const sprite = this.projectiles.arrow;
      if (sprite && sprite.complete) {
        ctx.drawImage(sprite, -16, -6, 32, 12);
      }
    } else if (p.type === 'avenger_star') {
      const spin = (performance.now() * 0.035 * Math.sign(p.vx || 1)) % (Math.PI * 2);
      ctx.rotate(spin);
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 18;
      this.drawThrowingStar(ctx, p.starType || 'steely', 38);
    }

    ctx.restore();
  }

  // --- AUTHENTIC THROWING STARS ENGINE (뇌전수리검, 일비, 토비, 금비, 화비, 목비, 수비) ---
  drawThrowingStar(ctx, starType = 'steely', size = 18) {
    const r = size / 2;
    ctx.save();

    if (starType === 'steely') {
      // ⚡ 뇌전수리검: 번개 궤적, 4각 샤프 다이아몬드 날, 전기 스파크 아크
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 12;

      ctx.fillStyle = '#00f5ff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const pCos = Math.cos(a + Math.PI / 4);
        const pSin = Math.sin(a + Math.PI / 4);
        if (i === 0) ctx.moveTo(cos * r, sin * r);
        else ctx.lineTo(cos * r, sin * r);
        ctx.lineTo(pCos * (r * 0.32), pSin * (r * 0.32));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Electric core diamond
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.45);
      ctx.lineTo(r * 0.45, 0);
      ctx.lineTo(0, r * 0.45);
      ctx.lineTo(-r * 0.45, 0);
      ctx.closePath();
      ctx.fill();

      // Crackling lightning sparks
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const sparkSeed = performance.now() * 0.01;
      for (let s = 0; s < 3; s++) {
        const sa = sparkSeed + s * 2.1;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sa) * (r * 0.5), Math.sin(sa) * (r * 0.5));
        ctx.lineTo(Math.cos(sa + 0.3) * (r * 1.15), Math.sin(sa + 0.3) * (r * 1.15));
      }
      ctx.stroke();

    } else if (starType === 'ilbi') {
      // ⭐ 일비표창: 전설의 3단 곡선 흑요석 날 + 붉은 루비 코어
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 9;

      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 3);

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(r * 0.5, r * 0.2, r * 1.05, 0);
        ctx.quadraticCurveTo(r * 0.4, -r * 0.55, 0, 0);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(r * 0.4, r * 0.15);
        ctx.lineTo(r * 1.05, 0);
        ctx.stroke();

        ctx.restore();
      }

      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-r * 0.08, -r * 0.08, r * 0.08, 0, Math.PI * 2);
      ctx.fill();

    } else if (starType === 'tobi') {
      // 💫 토비표창: 코발트 블루 4곡선 날 + 바람 소용돌이 링
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 10;

      ctx.strokeStyle = 'rgba(191, 219, 254, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.75, 0, Math.PI * 1.6);
      ctx.stroke();

      ctx.fillStyle = '#2563eb';
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(a + Math.PI / 4) * (r * 0.35), Math.sin(a + Math.PI / 4) * (r * 0.35));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fill();

    } else if (starType === 'kumbi') {
      // 🌟 금비표창: 찬란한 순금 4각성 + 스파클
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;

      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(a + Math.PI / 4) * (r * 0.28), Math.sin(a + Math.PI / 4) * (r * 0.28));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
      ctx.fill();

    } else if (starType === 'hwabi') {
      // 🔥 화비표창: 불타는 화염 수리검
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 14;

      ctx.fillStyle = '#ea580c';
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05);
        else ctx.lineTo(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05);
        ctx.lineTo(Math.cos(a + 0.35) * (r * 0.4), Math.sin(a + 0.35) * (r * 0.4));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      ctx.fill();

    } else if (starType === 'mokbi') {
      // 🪵 목비표창: 청동/나무 십자 표창
      ctx.fillStyle = '#92400e';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(a + Math.PI / 4) * (r * 0.35), Math.sin(a + Math.PI / 4) * (r * 0.35));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // ⚙️ 수비표창: 표준 은빛 4각 수리검
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(a + Math.PI / 4) * (r * 0.3), Math.sin(a + Math.PI / 4) * (r * 0.3));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- DRAW EQUIPPED WEAPON ON PLAYER SPRITE ---
  drawEquippedWeapon(ctx, player, actionKey) {
    if (player.onLadder) return;

    const now = performance.now();
    const wp = player.inventory?.equip?.find(eq => eq.type === 'weapon' && eq.equipped);
    const starType = player.activeStar || 'steely';

    let handX = -10;
    let handY = -15;
    let angle = -0.2;

    if (actionKey.startsWith('attack')) {
      const frame = parseInt(actionKey.split('_')[1] || '0', 10);
      if (frame === 0) {
        handX = -8;
        handY = -26;
        angle = -0.75;
      } else if (frame === 1) {
        handX = -22;
        handY = -18;
        angle = 0.35;
      } else {
        handX = -18;
        handY = -10;
        angle = 1.05;
      }
    } else if (actionKey.startsWith('walk')) {
      handX = -11;
      handY = -16 + Math.sin(now / 90) * 1.5;
      angle = -0.25;
    } else if (actionKey.startsWith('jump')) {
      handX = -12;
      handY = -22;
      angle = -0.45;
    } else {
      handX = -10;
      handY = -15 + Math.sin(now / 350) * 0.8;
      angle = -0.2;
    }

    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(angle);

    const wpId = wp ? wp.id : (player.job === '도적' ? 'wp_meba' : 'wp_wood_sword');

    if (wpId === 'wp_highlander') {
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(28, -3);
      ctx.lineTo(34, 0);
      ctx.lineTo(28, 3);
      ctx.lineTo(0, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(24, 0);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-2, -6, 4, 12);
      ctx.strokeRect(-2, -6, 4, 12);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, -2, 6, 4);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-9, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (wpId === 'wp_gryunhill') {
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(30, -4);
      ctx.lineTo(37, 0);
      ctx.lineTo(30, 4);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(4, -4);
      ctx.lineTo(10, -7);
      ctx.lineTo(16, -4);
      ctx.lineTo(22, -7);
      ctx.lineTo(28, -4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-2, -8, 5, 16);

    } else if (wpId === 'wp_dragon_claymore') {
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#083344';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(32, -4);
      ctx.lineTo(39, 0);
      ctx.lineTo(32, 4);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.lineTo(-6, -9);
      ctx.lineTo(4, -5);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 5);
      ctx.lineTo(-6, 9);
      ctx.closePath();
      ctx.fill();

    } else if (wpId === 'wp_taeguk_fan') {
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 16, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(8, -2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(8, 2, 5, 0, Math.PI * 2);
      ctx.fill();

    } else if (wpId === 'wp_kandine') {
      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.quadraticCurveTo(8, -6, 14, 0);
      ctx.quadraticCurveTo(20, 6, 26, 0);
      ctx.lineTo(24, 2);
      ctx.quadraticCurveTo(18, 4, 12, -2);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-2, -4, 4, 8);

    } else if (wpId === 'wp_dragon_toenail') {
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.quadraticCurveTo(12, -8, 24, -3);
      ctx.lineTo(20, 3);
      ctx.lineTo(0, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

    } else if (wp?.weaponType === 'dagger' || wpId.includes('dagger') || wpId === 'wp_geta' || wpId === 'wp_fruit_dagger') {
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(18, -2);
      ctx.lineTo(22, 0);
      ctx.lineTo(16, 2);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-5, -2, 5, 4);

    } else if (wp?.weaponType === 'claw' || player.job === '도적') {
      ctx.fillStyle = '#3b82f6';
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-3, -4, 6, 8);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(3, -3);
      ctx.lineTo(8, -4);
      ctx.lineTo(3, -1);
      ctx.moveTo(3, 1);
      ctx.lineTo(8, 2);
      ctx.lineTo(3, 3);
      ctx.fill();
      ctx.save();
      ctx.translate(6, 0);
      this.drawThrowingStar(ctx, starType, 10);
      ctx.restore();

    } else if (wp?.weaponType === 'bow' || wpId.includes('bow') || wpId === 'wp_ryden') {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, 16, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(-Math.PI * 0.4) * 16, Math.sin(-Math.PI * 0.4) * 16);
      ctx.lineTo(Math.cos(Math.PI * 0.4) * 16, Math.sin(Math.PI * 0.4) * 16);
      ctx.stroke();

    } else if (wp?.weaponType === 'staff' || wpId === 'wp_evil_wings') {
      ctx.fillStyle = '#581c87';
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-2, -18, 4, 30);
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(-8, -24);
      ctx.lineTo(-4, -18);
      ctx.lineTo(0, -16);
      ctx.lineTo(4, -18);
      ctx.lineTo(8, -24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, -18, 3, 0, Math.PI * 2);
      ctx.fill();

    } else {
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.fillRect(0, -2, 20, 4);
      ctx.strokeRect(0, -2, 20, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-4, -2, 4, 4);
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
    } else if (fx.type === 'brandish') {
      const progress = fx.progress;
      const alpha = Math.max(0, 1 - progress);
      ctx.save();
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#38bdf8';

      // First slash (top-left to bottom-right)
      ctx.strokeStyle = `rgba(224, 242, 254, ${alpha})`;
      ctx.beginPath();
      const s1 = progress * 65;
      ctx.moveTo(-45 + s1, -55 + s1 * 0.85);
      ctx.lineTo(15 + s1, -5 + s1 * 0.85);
      ctx.stroke();

      // Second slash (top-right to bottom-left)
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.moveTo(45 - s1, -55 + s1 * 0.85);
      ctx.lineTo(-15 - s1, -5 + s1 * 0.85);
      ctx.stroke();

      // Intersection spark
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(0, -18, 12 * (1 - progress * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (fx.type === 'thunderbolt') {
      const progress = fx.progress;
      const alpha = Math.max(0, 1 - progress);
      ctx.save();
      ctx.shadowBlur = 22;
      ctx.shadowColor = '#60a5fa';
      ctx.lineWidth = 5;
      ctx.strokeStyle = `rgba(219, 234, 254, ${alpha})`;

      // Main zigzag bolt from the sky
      ctx.beginPath();
      ctx.moveTo(0, -260);
      ctx.lineTo(-18, -190);
      ctx.lineTo(22, -120);
      ctx.lineTo(-12, -50);
      ctx.lineTo(10, 0);
      ctx.stroke();

      // Secondary branching bolt
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgba(147, 197, 253, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.moveTo(22, -120);
      ctx.lineTo(48, -70);
      ctx.lineTo(32, 0);
      ctx.stroke();

      // Ground electric discharge ring
      ctx.strokeStyle = `rgba(191, 219, 254, ${alpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 55 * progress + 20, 14 * progress + 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (fx.type === 'level_up') {
      const p = fx.progress;
      const alpha = 1 - p;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(this.levelUpGlow, -90, -230 - p*12);
      ctx.restore();

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
      ctx.save();
      ctx.translate(Math.round(npc.x), Math.round(npc.y));
      this.drawFootAlignedSprite(ctx, sprite);
      ctx.restore();

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
    if (!boss || (!boss.isAlive() && !boss.isDying())) return;
    ctx.save();
    if (boss.isDying()) ctx.globalAlpha *= Math.max(0, boss.dyingTimer / boss.dyingDuration);

    for (const arm of boss.arms) {
      if (!arm.isAlive && arm.state !== 'dying') continue;
      const geometry = boss.getPartGeometry('arm', arm);
      const sprite = this.zakum.arms[arm.id]?.[geometry.frame];
      if (!sprite?.complete || !sprite.naturalWidth) continue;
      ctx.save();
      if (arm.state === 'dying') ctx.globalAlpha *= Math.max(0, arm.dyingTimer / arm.dyingDuration);
      ctx.drawImage(sprite, geometry.drawX, geometry.drawY, geometry.spriteWidth, geometry.spriteHeight);
      if (arm.hitTimer > 0) {
        ctx.save();
        ctx.globalAlpha *= Math.min(1, arm.hitTimer / 0.15);
        ctx.drawImage(this.getSpriteHitMask(sprite), geometry.drawX, geometry.drawY);
        ctx.restore();
      }
      if (arm.isAlive && arm.hp < arm.maxHp) {
        const x = geometry.x + geometry.width / 2 - 20;
        const y = geometry.y - 8;
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(x - 1, y - 1, 42, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x, y, Math.max(0, arm.hp / arm.maxHp) * 40, 4);
      }
      ctx.restore();
    }

    const body = boss.getPartGeometry();
    const sprite = this.zakum.body[body.frame];
    if (sprite?.complete && sprite.naturalWidth) {
      ctx.drawImage(sprite, body.drawX, body.drawY, body.spriteWidth, body.spriteHeight);
      if (boss.hitTimer > 0 && boss.isAlive()) {
        ctx.save();
        ctx.globalAlpha *= Math.min(1, boss.hitTimer / 0.15);
        ctx.drawImage(this.getSpriteHitMask(sprite), body.drawX, body.drawY);
        ctx.restore();
      }
    }

    for (const spell of boss.activeSpells) {
      const progress = Math.min(1, spell.timer / spell.duration);
      ctx.save();
      if (spell.type === 'fire_pillar') {
        const gradient = ctx.createLinearGradient(spell.x, spell.y, spell.x, spell.y - 200);
        gradient.addColorStop(0, 'rgba(239,68,68,0.9)');
        gradient.addColorStop(0.5, 'rgba(249,115,22,0.7)');
        gradient.addColorStop(1, 'rgba(253,224,71,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(spell.x - 30, spell.y - 200, 60, 200);
      } else if (spell.type === 'lightning') {
        ctx.strokeStyle = 'rgba(125,211,252,0.9)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(spell.x, 0);
        ctx.lineTo(spell.x - 15, spell.y * 0.4);
        ctx.lineTo(spell.x + 20, spell.y * 0.7);
        ctx.lineTo(spell.x, spell.y);
        ctx.stroke();
      } else if (spell.isOneToOne) {
        ctx.strokeStyle = `rgba(216,180,254,${0.5 + progress * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(spell.x, spell.y - 2, 55, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(spell.x, spell.y - 2, Math.max(4, 55 * (1 - progress)), 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = 'bold 16px "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f3e8ff';
        ctx.fillText('1 / 1', spell.x, spell.y - 35);
      }
      ctx.restore();
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
