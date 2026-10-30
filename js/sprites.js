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
    let retries = 0;
    img.onerror = () => {
      if (retries < 3) {
        retries++;
        setTimeout(() => { img.src = path; }, 40 * retries);
      }
    };
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
    this.mobs = this.monsterSprites;
    this.bakedMobCanvases = new Map();
    for (const [name, record] of Object.entries(window.MONSTER_ASSETS || {})) {
      const frames = this.monsterSprites[name] = {};
      for (const action of ['stand', 'move', 'hit1', 'die1']) {
        frames[action] = [];
        const count = record.frames[action] || 0;
        for (let index = 0; index < count; index++) {
          frames[action].push(this.loadImage(`mob_${name}_${action}_${index}`, `assets/monsters/${name}/${action}_${index}.png`));
        }
      }
      frames.bake = (facing = 'left') => this.bakeMonster(name, facing);
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

    // 4. Preload Projectiles & Authentic Classic Throwing Stars
    this.projectiles = {
      arrow: this.loadImage('proj_arrow', 'assets/projectiles/arrow.png'),
      shuriken: this.loadImage('proj_shuriken', 'assets/projectiles/shuriken.png'),
      energy_bolt: this.loadImage('proj_energy_bolt', 'assets/projectiles/energy_bolt.png')
    };
    this.starSprites = {
      subi: [this.loadImage('star_subi_0', 'assets/projectiles/stars/subi_0.png'), this.loadImage('star_subi_1', 'assets/projectiles/stars/subi_1.png')],
      mokbi: [this.loadImage('star_mokbi_0', 'assets/projectiles/stars/mokbi_0.png'), this.loadImage('star_mokbi_1', 'assets/projectiles/stars/mokbi_1.png')],
      kumbi: [this.loadImage('star_kumbi_0', 'assets/projectiles/stars/kumbi_0.png'), this.loadImage('star_kumbi_1', 'assets/projectiles/stars/kumbi_1.png')],
      tobi: [this.loadImage('star_tobi_0', 'assets/projectiles/stars/tobi_0.png'), this.loadImage('star_tobi_1', 'assets/projectiles/stars/tobi_1.png')],
      steely: [this.loadImage('star_steely_0', 'assets/projectiles/stars/steely_0.png'), this.loadImage('star_steely_1', 'assets/projectiles/stars/steely_1.png')],
      ilbi: [this.loadImage('star_ilbi_0', 'assets/projectiles/stars/ilbi_0.png'), this.loadImage('star_ilbi_1', 'assets/projectiles/stars/ilbi_1.png')],
      hwabi: [this.loadImage('star_hwabi_0', 'assets/projectiles/stars/hwabi_0.png'), this.loadImage('star_hwabi_1', 'assets/projectiles/stars/hwabi_1.png')],
      ultimate: [this.loadImage('star_ultimate_0', 'assets/projectiles/stars/ultimate_0.png'), this.loadImage('star_ultimate_1', 'assets/projectiles/stars/ultimate_1.png')]
    };

    // 5. Preload Drops (Meso coins & Item loot)
    const ribbonImg = this.loadImage('item_ribbon', 'assets/items/ribbon.png');
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
      ribbon: ribbonImg,
      pig_ribbon: ribbonImg,
      subi_star: this.loadImage('icon_subi', 'assets/projectiles/stars/subi_icon.png'),
      mokbi_star: this.loadImage('icon_mokbi', 'assets/projectiles/stars/mokbi_icon.png'),
      kumbi_star: this.loadImage('icon_kumbi', 'assets/projectiles/stars/kumbi_icon.png'),
      tobi_star: this.loadImage('icon_tobi', 'assets/projectiles/stars/tobi_icon.png'),
      steely_star: this.loadImage('icon_steely', 'assets/projectiles/stars/steely_icon.png'),
      ilbi_star: this.loadImage('icon_ilbi', 'assets/projectiles/stars/ilbi_icon.png'),
      hwabi_star: this.loadImage('icon_hwabi', 'assets/projectiles/stars/hwabi_icon.png'),
      ultimate_star: this.loadImage('icon_ultimate', 'assets/projectiles/stars/ultimate_icon.png'),
      trophy_king_slime: this.loadImage('trophy_kslime', 'assets/monsters/king_slime/stand_0.png'),
      trophy_mushmom: this.loadImage('trophy_mushmom', 'assets/monsters/mushmom/stand_0.png'),
      trophy_zombie_mushmom: this.loadImage('trophy_zmush', 'assets/monsters/zombie_mushroom/stand_0.png'),
      trophy_jr_balrog: this.loadImage('trophy_jrbalrog', 'assets/monsters/jr_balrog/stand_0.png'),
      trophy_zakum: this.loadImage('trophy_zakum', 'assets/monsters/zakum/stand_0.png'),
      trophy_horntail: this.loadImage('trophy_horntail', 'assets/monsters/horntail/stand_0.png'),
      trophy_pianus: this.loadImage('trophy_pianus', 'assets/monsters/pianus/stand_0.png'),
      trophy_alishar: this.loadImage('trophy_alishar', 'assets/monsters/alishar/stand_0.png'),
      trophy_griffey: this.loadImage('trophy_griffey', 'assets/monsters/griffey/stand_0.png'),
      trophy_timer: this.loadImage('trophy_timer', 'assets/monsters/timer/stand_0.png')
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

  // --- DRAW SHADOW PARTNER CLONE AVATAR ---
  drawShadowPartnerAvatar(ctx, player) {
    if (!player || player.hp <= 0 || player.onLadder) return;

    // Use delayed pose history if available, else offset 16px behind player
    let shadowX = player.facing === 'right' ? player.x - 16 : player.x + 16;
    let shadowY = player.y;
    let shadowFacing = player.facing;

    if (player.poseHistory && player.poseHistory.length >= 6) {
      const pastPose = player.poseHistory[Math.min(6, player.poseHistory.length - 1)];
      if (pastPose && Math.hypot(pastPose.x - player.x, pastPose.y - player.y) < 120) {
        shadowX = pastPose.x;
        shadowY = pastPose.y;
        shadowFacing = pastPose.facing;
      }
    }

    ctx.save();
    ctx.translate(Math.round(shadowX), Math.round(shadowY));
    if (shadowFacing === 'right') {
      ctx.scale(-1, 1);
    }

    // Shadow Partner Crimson Aura & Transparency (No expensive ctx.filter for 60 FPS guarantee)
    ctx.fillStyle = 'rgba(220, 38, 38, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, -18, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.55;

    // Crimson Ground Shadow
    ctx.fillStyle = 'rgba(185, 28, 28, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 1, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Determine Action Frame for clone
    const cloneWarriorJobs = ['전사', '검사', '파이터', '크루세이더', '히어로'];
    const cloneMagicianJobs = ['마법사', '매지션', '위자드', '메이지', '아크메이지'];
    const cloneBowmanJobs = ['궁수', '아처', '헌터', '레인저', '보우마스터'];
    const cloneThiefJobs = ['도적', '로그', '어쌔신', '허밋', '나이트로드', '시프', '시프마스터', '섀도어'];
    let jobKey = 'beginner';
    if (cloneWarriorJobs.includes(player.job)) jobKey = 'warrior';
    else if (cloneMagicianJobs.includes(player.job)) jobKey = 'magician';
    else if (cloneBowmanJobs.includes(player.job)) jobKey = 'bowman';
    else if (cloneThiefJobs.includes(player.job)) jobKey = 'thief';
    const jobSprites = this.playerSprites[jobKey] || this.playerSprites['beginner'];
    const now = performance.now();
    let actionKey = 'stand_0';

    if (player.attackTimer > 0) {
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
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      this.drawFootAlignedSprite(ctx, sprite);
    }

    // Draw weapon on clone in crimson
    this.drawEquippedWeapon(ctx, player, actionKey);

    // Classic Maple Warrior: Combo Attack Glowing Orbs
    if (player.comboCount && player.comboCount > 0) {
      this.drawComboOrbs(ctx, player);
    }

    ctx.restore();
  }

  // --- DRAW PLAYER (GENUINE MAPLESTORY PIXEL SPRITE) ---
  drawPlayer(ctx, player) {
    // 1. Draw Shadow Partner Avatar behind player if buff is active
    if (player.hasShadowPartner && player.hasShadowPartner()) {
      this.drawShadowPartnerAvatar(ctx, player);
    }

    ctx.save();
    ctx.translate(Math.round(player.x), Math.round(player.y));

    // Facing direction / Ladder alternating climb animation
    if (player.onLadder) {
      if (player.vy !== 0 && Math.floor((player.climbAnimTimer || 0) * 7) % 2 === 1) {
        ctx.scale(-1, 1);
      }
    } else if (player.facing === 'right') {
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

    // Determine Job Key (Supports all 1~4th Job Advancement Tiers)
    let jobKey = 'beginner';
    const warriorJobs = ['전사', '파이터', '크루세이더', '히어로'];
    const magicianJobs = ['마법사', '위자드', '메이지', '아크메이지'];
    const bowmanJobs = ['궁수', '헌터', '레인저', '보우마스터'];
    const thiefJobs = ['도적', '어쌔신', '허밋', '나이트로드', '시프'];
    const pirateJobs = ['해적', '인파이터', '바이퍼', '건슬링거', '캡틴'];

    if (warriorJobs.includes(player.job)) jobKey = 'warrior';
    else if (magicianJobs.includes(player.job)) jobKey = 'magician';
    else if (bowmanJobs.includes(player.job)) jobKey = 'bowman';
    else if (thiefJobs.includes(player.job)) jobKey = 'thief';
    else if (pirateJobs.includes(player.job)) jobKey = 'thief';

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

    // Back Coordi Layer (Capes, Wings & Awakened Weapon Aura)
    this.drawCoordiBack(ctx, player, actionKey);

    // Draw Character Sprite (aligned to feet at y=0)
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      this.drawFootAlignedSprite(ctx, sprite);
    } else {
      // Fallback
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-12, -40, 24, 40);
    }

    // Front Coordi Layer (Clothes, Hats, Glasses, Blush/Leaf)
    this.drawCoordiFront(ctx, player, actionKey);

    // Draw Equipped Weapon / Coordi Weapon Skin on Player's Hands
    this.drawEquippedWeapon(ctx, player, actionKey);

    ctx.restore();

    // Draw Character Name Tag (Never mirrored!)
    this.drawPlayerNameTag(ctx, player);
  }

  drawCoordiBack(ctx, player, actionKey) {
    const coordi = player?.coordi;
    const wp = player?.inventory?.equip?.find(eq => eq.type === 'weapon' && eq.equipped);
    const now = performance.now();
    const bob = Math.sin(now / 260) * 1.5;

    // Awakened Weapon Breakthrough Aura Ring
    if (wp && (wp.breakthroughTier || 0) > 0) {
      ctx.save();
      const auraColor = wp.auraColor || '#facc15';
      ctx.strokeStyle = auraColor;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.ellipse(0, -18 + bob * 0.5, 18 + wp.breakthroughTier * 1.5, 24 + wp.breakthroughTier, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (!coordi || !coordi.cape) return;
    ctx.save();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';

    if (coordi.cape === 'cape_angel_wings') {
      const flap = Math.sin(now / 180) * 2.2;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(10, -24 + flap, 11, 6, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.ellipse(12, -18 + flap * 0.8, 8, 4.5, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (coordi.cape === 'cape_icarus') {
      const wave = Math.sin(now / 200) * 2;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(4, -28);
      ctx.quadraticCurveTo(18, -22 + wave, 16, -6);
      ctx.lineTo(5, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (coordi.cape === 'cape_balrog_wings') {
      const flap = Math.sin(now / 170) * 2.5;
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(4, -24);
      ctx.lineTo(20, -34 + flap);
      ctx.lineTo(16, -16 + flap);
      ctx.lineTo(9, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawCoordiFront(ctx, player, actionKey) {
    const coordi = player?.coordi;
    if (!coordi) return;
    const now = performance.now();
    const headBob = actionKey.startsWith('walk') ? Math.sin(now / 120) * 1.2 : Math.sin(now / 360) * 0.8;

    ctx.save();
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
    ctx.lineWidth = 1.5;

    // 1. Coordi Clothes Overlay (Torso)
    if (coordi.clothes === 'clothes_hoodie') {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-7, -21, 14, 11);
      ctx.strokeRect(-7, -21, 14, 11);
    } else if (coordi.clothes === 'clothes_royal') {
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(-7, -21, 14, 12);
      ctx.strokeRect(-7, -21, 14, 12);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2, -21, 4, 12);
    } else if (coordi.clothes === 'clothes_school') {
      ctx.fillStyle = '#334155';
      ctx.fillRect(-7, -21, 14, 11);
      ctx.strokeRect(-7, -21, 14, 11);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-2, -20, 3, 6);
    }

    // 2. Coordi Face & Eye Accessories
    if (coordi.faceAcc === 'face_blush') {
      ctx.fillStyle = 'rgba(244, 114, 182, 0.65)';
      ctx.beginPath();
      ctx.ellipse(-6, -29 + headBob, 3, 1.8, 0, 0, Math.PI * 2);
      ctx.ellipse(2, -29 + headBob, 3, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (coordi.faceAcc === 'face_leaf') {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(-9, -27 + headBob, 4, 2.2, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (coordi.eyeAcc === 'eye_sunglasses') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-10, -35 + headBob, 7, 4.5);
      ctx.fillRect(-1, -35 + headBob, 6, 4.5);
      ctx.strokeRect(-10, -35 + headBob, 7, 4.5);
      ctx.strokeRect(-1, -35 + headBob, 6, 4.5);
    } else if (coordi.eyeAcc === 'eye_star_patch') {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(-6, -33 + headBob, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 3. Coordi Hat Overlay (Crown, Mushroom Cap, Bandana, Ribbon)
    if (coordi.hat && coordi.hat !== 'hat_transparent') {
      if (coordi.hat === 'hat_crown') {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-10, -43 + headBob);
        ctx.lineTo(-8, -52 + headBob);
        ctx.lineTo(-3, -46 + headBob);
        ctx.lineTo(0, -54 + headBob);
        ctx.lineTo(3, -46 + headBob);
        ctx.lineTo(8, -52 + headBob);
        ctx.lineTo(10, -43 + headBob);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -46 + headBob, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (coordi.hat === 'hat_mushcap') {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, -44 + headBob, 13, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(-5, -49 + headBob, 2.8, 0, Math.PI * 2);
        ctx.arc(5, -48 + headBob, 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (coordi.hat === 'hat_bandana') {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-12, -42 + headBob, 24, 5);
        ctx.strokeRect(-12, -42 + headBob, 24, 5);
      } else if (coordi.hat === 'hat_star_ribbon') {
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.ellipse(6, -44 + headBob, 5, 3, -0.3, 0, Math.PI * 2);
        ctx.ellipse(12, -42 + headBob, 5, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
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
  getBakedMobFrame(mobKey, action, index) {
    if (!this.bakedMobCanvases) this.bakedMobCanvases = new Map();
    const cacheKey = `${mobKey}_${action}_${index}`;
    if (this.bakedMobCanvases.has(cacheKey)) {
      return this.bakedMobCanvases.get(cacheKey);
    }
    const frames = this.monsterSprites?.[mobKey]?.[action];
    const img = frames?.[index];
    if (!img || !img.complete || img.naturalWidth === 0) return null;

    const offscreen = document.createElement('canvas');
    offscreen.width = img.naturalWidth;
    offscreen.height = img.naturalHeight;
    const octx = offscreen.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.drawImage(img, 0, 0);
    this.bakedMobCanvases.set(cacheKey, offscreen);
    return offscreen;
  }

  bakeMonster(mobKey) {
    const mob = this.monsterSprites?.[mobKey];
    if (!mob) return;
    for (const action of ['stand', 'move', 'hit1', 'die1']) {
      const frames = mob[action] || [];
      for (let i = 0; i < frames.length; i++) {
        this.getBakedMobFrame(mobKey, action, i);
      }
    }
  }

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
    let actionKey = 'stand';
    let frameList = mobData.stand;
    let frameIdx = 0;

    const isDying = Boolean((m.isDying && m.isDying()) || (!m.isAlive() && m.state === 'dying'));
    if (isDying) {
      actionKey = 'die1';
      frameList = (mobData.die1 && mobData.die1.length > 0) ? mobData.die1 : mobData.stand;
      const dTimer = (m.dyingTimer !== undefined ? m.dyingTimer : (m.deathTimer || 0));
      const dDur = m.dyingDuration || 0.45;
      const progress = Math.max(0, Math.min(1, 1 - (dTimer / dDur)));
      frameIdx = Math.min(frameList.length - 1, Math.floor(progress * frameList.length));
    } else if (m.hitstopTimer > 0) {
      actionKey = 'hit1';
      frameList = mobData.hit1.length > 0 ? mobData.hit1 : mobData.stand;
      frameIdx = 0;
    } else if (m.vx !== 0) {
      actionKey = 'move';
      frameList = mobData.move.length > 0 ? mobData.move : mobData.stand;
      frameIdx = Math.floor(now / 150) % frameList.length;
    } else {
      actionKey = 'stand';
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

    // Enraged Boss Crimson Aura
    if (m.enraged && m.onGround) {
      ctx.save();
      const pulse = 0.55 + Math.sin(now / 120) * 0.25;
      ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -m.height * 0.48, m.width * 0.62, m.height * 0.44, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Entity y is the visible foot contact, not the GIF frame's padded bottom.
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      const baked = this.getBakedMobFrame(mobKey, actionKey, frameIdx);
      if (baked) {
        const footY = this.spriteFootY.get(sprite) ?? sprite.naturalHeight;
        ctx.drawImage(baked, -sprite.naturalWidth / 2, -footY);
      } else {
        this.drawFootAlignedSprite(ctx, sprite);
      }
      if (m.hitFlashTimer > 0) {
        ctx.save();
        ctx.globalAlpha *= Math.min(1, m.hitFlashTimer / 0.12);
        const footY = this.spriteFootY.get(sprite) ?? sprite.naturalHeight;
        ctx.drawImage(this.getSpriteHitMask(sprite), -sprite.naturalWidth / 2, -footY);
        ctx.restore();
      }
    }

    ctx.restore();

    // Draw Boss Pattern Spells (Telegraphs & Explosions)
    if (m.activeBossSpells && m.activeBossSpells.length > 0) {
      this.drawBossSpells(ctx, m);
    }

    // Draw Monster Name & HP Bar (Never mirrored!)
    if (m.isAlive() && !isDying) {
      this.drawMonsterUI(ctx, m);
    }
  }

  drawBossSpells(ctx, m) {
    if (!m.activeBossSpells || !m.activeBossSpells.length) return;
    for (const spell of m.activeBossSpells) {
      const progress = Math.min(1, (spell.timer || 0) / Math.max(0.1, spell.duration || 0.8));
      const color = spell.color || '#ef4444';
      ctx.save();
      if (!spell.triggered) {
        // Telegraph Warning Phase
        const alpha = 0.35 + Math.sin(performance.now() / 65) * 0.25;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.5;
        if (spell.type === 'shockwave') {
          const r = spell.radius || 220;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.ellipse(spell.x, spell.y - 4, r * progress, 10, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(spell.x, spell.y - 4, r, 10, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          const w = spell.width || 64;
          const h = spell.height || 180;
          ctx.globalAlpha = alpha * 0.45;
          ctx.fillRect(spell.x - w / 2, spell.y - h, w, h);
          ctx.globalAlpha = 0.85;
          ctx.strokeRect(spell.x - w / 2, spell.y - h, w, h);
        }
        if (spell.label) {
          ctx.globalAlpha = 0.95;
          ctx.font = 'bold 11px "Malgun Gothic", sans-serif';
          ctx.textAlign = 'center';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.strokeText(`⚠️ ${spell.label}`, spell.x, spell.y - 24);
          ctx.fillStyle = '#fef08a';
          ctx.fillText(`⚠️ ${spell.label}`, spell.x, spell.y - 24);
        }
      } else {
        // Triggered Impact Phase
        const fade = Math.max(0, Math.min(1, (spell.lingerTimer || 0.2) / 0.45));
        ctx.globalAlpha = fade;
        if (spell.type === 'shockwave') {
          const r = spell.radius || 220;
          ctx.strokeStyle = color;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.ellipse(spell.x, spell.y - 6, r, 16, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (spell.type === 'lightning') {
          ctx.strokeStyle = '#7dd3fc';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(spell.x, spell.y - (spell.height || 220));
          ctx.lineTo(spell.x - 16, spell.y - 140);
          ctx.lineTo(spell.x + 18, spell.y - 70);
          ctx.lineTo(spell.x, spell.y);
          ctx.stroke();
        } else if (spell.type === 'poison_cloud' || spell.type === 'time_bomb') {
          const w = spell.width || 85;
          const h = spell.height || 85;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.ellipse(spell.x, spell.y - h * 0.45, w * 0.55, h * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // fire_pillar or dragon_breath
          const w = spell.width || 68;
          const h = spell.height || 200;
          const grad = ctx.createLinearGradient(spell.x, spell.y, spell.x, spell.y - h);
          grad.addColorStop(0, color);
          grad.addColorStop(0.6, '#fb923c');
          grad.addColorStop(1, 'rgba(254, 240, 138, 0.1)');
          ctx.fillStyle = grad;
          ctx.fillRect(spell.x - w / 2, spell.y - h, w, h);
        }
      }
      ctx.restore();
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
    ctx.fillStyle = m.enraged ? '#fca5a5' : (m.isBoss ? '#fde047' : '#ffffff');
    ctx.fillText(label, 0, -6);

    // HP Bar
    if (m.hp < m.maxHp) {
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
    // ★ 1. Star Trail 궤적 잔상 일루전 렌더링 (불변 규격 INV-4, Zero-Blur Hardware Fast Path)
    if (p.type === 'shuriken' && p.trailHistory && p.trailHistory.length > 1) {
      ctx.save();
      const len = p.trailHistory.length;
      for (let i = 1; i < len; i++) {
        const pt = p.trailHistory[i];
        const ratio = 1 - (i / len);
        const alpha = Math.max(0, ratio * 0.65);
        const radius = Math.max(2, ratio * 8.5);
        ctx.fillStyle = p.isShadow ? `rgba(239, 68, 68, ${alpha})` : (p.starType === 'ilbi' ? `rgba(220, 38, 38, ${alpha})` : `rgba(56, 189, 248, ${alpha})`);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Connecting golden/neon light beam
        const prevPt = p.trailHistory[i - 1];
        ctx.strokeStyle = p.isShadow ? `rgba(248, 113, 113, ${alpha * 0.8})` : `rgba(254, 240, 138, ${alpha * 0.8})`;
        ctx.lineWidth = Math.max(1, ratio * 3.5);
        ctx.beginPath();
        ctx.moveTo(prevPt.x, prevPt.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));

    // Shrapnel impact explosion if hit (0.08s linger)
    if (p.hit) {
      ctx.save();
      const progress = Math.min(1, (p.hitTimer || 0) / 0.08);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5 * (1 - progress);
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      for (let k = 0; k < 6; k++) {
        const ang = (k * Math.PI) / 3;
        const dist = 6 + progress * 24;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * (dist * 0.4), Math.sin(ang) * (dist * 0.4));
        ctx.lineTo(Math.cos(ang) * dist, Math.sin(ang) * dist);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Shadow Partner Clone Projectile Crimson Effect (Hardware-accelerated aura without slow CSS filter)
    if (p.isShadow) {
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = 'rgba(220, 38, 38, 0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
    }

    if (p.type === 'arrow') {
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      const sprite = this.projectiles.arrow;
      if (sprite && sprite.complete) {
        ctx.drawImage(sprite, -16, -6, 32, 12);
      }
    } else if (p.type === 'shuriken') {
      // Fast rotation
      const spin = (performance.now() * 0.025) % (Math.PI * 2);
      ctx.rotate(spin);
      if (p.starType === 'ultimate') {
        ctx.save();
        ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      this.drawThrowingStar(ctx, p.starType || 'subi', p.starType === 'ultimate' ? 28 : 24);
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
      ctx.shadowColor = p.isShadow ? '#ef4444' : '#a855f7';
      ctx.shadowBlur = p.isShadow ? 24 : 18;
      this.drawThrowingStar(ctx, p.starType || 'steely', p.isShadow ? 34 : 38);
    } else if (p.type === 'iron_arrow') {
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(10, -5); ctx.lineTo(10, 5); ctx.fill();
    } else if (p.type === 'piercing_arrow') {
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 18;
      ctx.strokeStyle = '#e879f9'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(24, 0); ctx.stroke();
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(14, -7); ctx.lineTo(14, 7); ctx.fill();
    } else if (p.type === 'sniper_bullet') {
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#fee2e2';
      ctx.fillRect(-15, -2, 30, 4);
    } else if (p.type === 'bullet') {
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      ctx.fillStyle = '#fbbf24'; ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 8;
      ctx.fillRect(-8, -2, 16, 4);
    } else if (p.type === 'cannonball') {
      ctx.fillStyle = '#1e293b'; ctx.shadowColor = '#f97316'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    } else if (p.type === 'energy_blast') {
      ctx.fillStyle = '#38bdf8'; ctx.shadowColor = '#0ea5e9'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  }

  // --- AUTHENTIC THROWING STARS ENGINE (뇌전수리검, 일비, 토비, 금비, 화비, 목비, 수비) ---
  drawThrowingStar(ctx, starType = 'steely', size = 20) {
    const r = size / 2;
    ctx.save();

    // 1. Authentic Official Pixel Sprite Render (with animation frame toggle)
    const frames = this.starSprites?.[starType] || this.starSprites?.['subi'];
    const now = performance.now();
    const frameIdx = Math.floor(now * 0.015) % 2;
    const sprite = frames ? frames[frameIdx] : null;

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      if (starType === 'ultimate') {
        ctx.save();
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 20;
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
        ctx.restore();
      } else if (starType === 'steely') {
        ctx.save();
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 14;
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
        ctx.restore();
      } else if (starType === 'ilbi') {
        ctx.save();
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 12;
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
        ctx.restore();
      } else if (starType === 'hwabi') {
        ctx.save();
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 14;
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
        ctx.restore();
      } else {
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      }
      ctx.restore();
      return;
    }

    if (starType === 'ilbi') {
      // ⭐ 일비표창: 원작 메이플의 진정한 로망! 3단 흑요석 유선형 곡면 날개 + 붉은 루비 코어
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 10;

      // 3 Obsidian curved blades with cel-shading & silver edge
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 3);

        // Blade base dark shadow
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(r * 0.45, r * 0.25, r * 1.15, 0);
        ctx.quadraticCurveTo(r * 0.35, -r * 0.65, 0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cel-shaded metallic blade body
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(r * 0.15, -r * 0.1);
        ctx.quadraticCurveTo(r * 0.45, r * 0.15, r * 1.05, 0);
        ctx.quadraticCurveTo(r * 0.4, -r * 0.45, r * 0.15, -r * 0.1);
        ctx.fill();

        // Silver razor-sharp highlight line
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(r * 0.4, r * 0.18);
        ctx.lineTo(r * 1.12, 0);
        ctx.stroke();

        ctx.restore();
      }

      // Central glowing red ruby gemstone core
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ruby sparkle reflection
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-r * 0.1, -r * 0.1, r * 0.1, 0, Math.PI * 2);
      ctx.fill();

    } else if (starType === 'steely') {
      // ⚡ 뇌전수리검: 푸른 번개 4각 샤프 다이아몬드 날 + 파지직 전기 스파크 아크
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;

      // 4 Diamond lightning blades
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#082f49';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const cos = Math.cos(a), sin = Math.sin(a);
        const pCos = Math.cos(a + Math.PI / 4), pSin = Math.sin(a + Math.PI / 4);
        if (i === 0) ctx.moveTo(cos * r * 1.1, sin * r * 1.1);
        else ctx.lineTo(cos * r * 1.1, sin * r * 1.1);
        ctx.lineTo(pCos * (r * 0.35), pSin * (r * 0.35));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cyan cel-shaded inner blade
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const cos = Math.cos(a), sin = Math.sin(a);
        const pCos = Math.cos(a + Math.PI / 4), pSin = Math.sin(a + Math.PI / 4);
        if (i === 0) ctx.moveTo(cos * r * 0.85, sin * r * 0.85);
        else ctx.lineTo(cos * r * 0.85, sin * r * 0.85);
        ctx.lineTo(pCos * (r * 0.25), pSin * (r * 0.25));
      }
      ctx.closePath();
      ctx.fill();

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
      const sparkSeed = performance.now() * 0.012;
      for (let s = 0; s < 4; s++) {
        const sa = sparkSeed + s * 1.57;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sa) * (r * 0.5), Math.sin(sa) * (r * 0.5));
        ctx.lineTo(Math.cos(sa + 0.25) * (r * 1.2), Math.sin(sa + 0.25) * (r * 1.2));
      }
      ctx.stroke();

    } else if (starType === 'tobi') {
      // 💫 토비표창: 코발트 블루 4곡선 날 + 바람 소용돌이
      ctx.shadowColor = '#2563eb';
      ctx.shadowBlur = 10;

      ctx.fillStyle = '#1e40af';
      ctx.strokeStyle = '#172554';
      ctx.lineWidth = 1.8;
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

      // Light cyan blade highlight
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#eff6ff';
      ctx.beginPath();
      ctx.arc(-r * 0.08, -r * 0.08, r * 0.12, 0, Math.PI * 2);
      ctx.fill();

    } else if (starType === 'kumbi') {
      // 🌟 금비표창: 찬란한 황금 4각 십자 표창
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;

      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.8;
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

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();

    } else if (starType === 'hwabi') {
      // 🔥 화비표창: 불타는 진홍빛 화염 수리검
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 14;

      ctx.fillStyle = '#c2410c';
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1);
        else ctx.lineTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1);
        ctx.lineTo(Math.cos(a + 0.38) * (r * 0.42), Math.sin(a + 0.38) * (r * 0.42));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
      ctx.fill();

    } else if (starType === 'mokbi') {
      // 🪵 목비표창: 견고한 암갈색 청동/나무 십자 표창
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#291003';
      ctx.lineWidth = 1.8;
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

      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fill();

    } else if (starType === 'ultimate') {
      // ★ 궁극의 성광수리검: 전설을 초월한 8방향 신화급 성광 수리검!
      // 황금빛과 시안 코어의 눈부신 광휘 + 8방향 성스러운 다이아몬드 검날 + 회전 룬 후광
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 22;

      // 1. Rotating holy halo ring with geometric runes
      ctx.save();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 2. 8-Point Mythic Divine Blades (Outer golden-white blades)
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const bladeLen = (i % 2 === 0) ? r * 1.25 : r * 0.85;
        const cos = Math.cos(a), sin = Math.sin(a);
        const pCos = Math.cos(a + Math.PI / 8), pSin = Math.sin(a + Math.PI / 8);
        if (i === 0) ctx.moveTo(cos * bladeLen, sin * bladeLen);
        else ctx.lineTo(cos * bladeLen, sin * bladeLen);
        ctx.lineTo(pCos * (r * 0.32), pSin * (r * 0.32));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. Inner Celestian Radiant Star (Cyan-White Starlight Layer)
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const bladeLen = (i % 2 === 0) ? r * 0.95 : r * 0.65;
        const cos = Math.cos(a), sin = Math.sin(a);
        const pCos = Math.cos(a + Math.PI / 8), pSin = Math.sin(a + Math.PI / 8);
        if (i === 0) ctx.moveTo(cos * bladeLen, sin * bladeLen);
        else ctx.lineTo(cos * bladeLen, sin * bladeLen);
        ctx.lineTo(pCos * (r * 0.22), pSin * (r * 0.22));
      }
      ctx.closePath();
      ctx.fill();

      // 4. Pure Divine Diamond Core (Glittering White)
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.38);
      ctx.lineTo(r * 0.38, 0);
      ctx.lineTo(0, r * 0.38);
      ctx.lineTo(-r * 0.38, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 5. Star cross light rays
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.35);
      ctx.lineTo(0, r * 1.35);
      ctx.moveTo(-r * 1.35, 0);
      ctx.lineTo(r * 1.35, 0);
      ctx.stroke();

    } else {
      // ⚙️ 수비표창: 클래식 은빛 4각 십자 수리검 (네온 외곽선 & 발광 보정 - INV-3)
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;

      // Outer razor blade
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * (r * 1.15), Math.sin(a) * (r * 1.15));
        else ctx.lineTo(Math.cos(a) * (r * 1.15), Math.sin(a) * (r * 1.15));
        ctx.lineTo(Math.cos(a + Math.PI / 4) * (r * 0.36), Math.sin(a + Math.PI / 4) * (r * 0.36));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cyan-White inner highlight blade
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * (r * 0.8), Math.sin(a) * (r * 0.8));
        else ctx.lineTo(Math.cos(a) * (r * 0.8), Math.sin(a) * (r * 0.8));
        ctx.lineTo(Math.cos(a + Math.PI / 4) * (r * 0.22), Math.sin(a + Math.PI / 4) * (r * 0.22));
      }
      ctx.closePath();
      ctx.fill();

      // Gleaming white center core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.2;
      ctx.stroke();
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

    const wsId = player.coordi?.weaponSkin || null;
    if (wsId === 'ws_transparent') return;

    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(angle);

    // 한계 돌파 무기 오라 (Breakthrough Aura Glow)
    if (wp && wp.auraColor && (wp.breakthroughTier || 0) >= 1) {
      ctx.save();
      ctx.strokeStyle = wp.auraColor;
      ctx.lineWidth = 3 + Math.min(4, wp.breakthroughTier || 1);
      ctx.globalAlpha = 0.38 + Math.sin(now / 140) * 0.15;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(30, 0);
      ctx.stroke();
      ctx.restore();
    }

    if (wsId === 'ws_rose') {
      // 코디 무기: 붉은 장미 한 송이
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(20, 0);
      ctx.stroke();
      ctx.fillStyle = '#e11d48';
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(22, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    } else if (wsId === 'ws_flame_katana') {
      // 코디 무기: 홍련의 화염도
      ctx.fillStyle = '#f97316';
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -2.5);
      ctx.lineTo(28, -2);
      ctx.lineTo(34, 0);
      ctx.lineTo(28, 2);
      ctx.lineTo(0, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.fillRect(2, -1, 24, 2);
      ctx.restore();
      return;
    } else if (wsId === 'ws_star_wand') {
      // 코디 무기: 별빛 요술봉
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(20, 0);
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(22, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }

    const wpId = wp ? wp.id : ((player.job === '어쌔신' || player.job === '도적') ? 'wp_meba' : (player.job === '시프' ? 'wp_taeguk_fan' : 'wp_wood_sword'));

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

    } else if (wp?.weaponType === 'dagger' || wpId.includes('dagger') || wpId === 'wp_geta' || wpId === 'wp_fruit_dagger' || player.job === '시프') {
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

    } else if (wp?.weaponType === 'claw' || player.job === '어쌔신' || player.job === '도적') {
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
    getItemDropSprite(type) {
    if (!this.itemDropCache) this.itemDropCache = {};
    if (this.itemDropCache[type]) return this.itemDropCache[type];

    if (this.drops && this.drops[type]) {
      this.itemDropCache[type] = this.drops[type];
      return this.drops[type];
    }

    const resolved = typeof UIManager !== 'undefined' ? UIManager.getItemIconPath({ id: type, type }) : null;
    const img = new Image();
    img.src = resolved || `assets/items/${type}.png`;
    this.itemDropCache[type] = img;
    return img;
  }

  drawDrop(ctx, drop) {
    ctx.save();
    const bob = Math.sin(performance.now() / 250) * 2.5;
    ctx.translate(Math.round(drop.x), Math.round(drop.y + bob));

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 2 - bob, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const dtype = String(drop.type || '');
    const isRareLoot = dtype.startsWith('trophy_') || dtype.startsWith('scroll_') || dtype.endsWith('_star') || dtype === 'equip';
    if (isRareLoot) {
      const beamColor = dtype.startsWith('trophy_') ? 'rgba(168, 85, 247, 0.35)' : 'rgba(250, 204, 21, 0.35)';
      ctx.fillStyle = beamColor;
      ctx.fillRect(-5, -36, 10, 36);
    }



    let sprite = null;
    if (dtype === 'meso') {
      if (drop.amount < 50) sprite = this.drops.meso_bronze;
      else if (drop.amount < 100) sprite = this.drops.meso_silver;
      else if (drop.amount < 500) sprite = this.drops.meso_gold;
      else sprite = this.drops.meso_bag;
    } else {
      sprite = this.getItemDropSprite(dtype);
    }

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      if (dtype.startsWith('trophy_')) {
        ctx.drawImage(sprite, -14, -28, 28, 28);
      } else {
        const sw = sprite.naturalWidth;
        const sh = sprite.naturalHeight;
        ctx.drawImage(sprite, -sw / 2, -sh + 2, sw, sh);
      }
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

    if (fx.type === 'shadow_web') {
      const p = fx.progress;
      const alpha = Math.max(0, 1 - p * 0.7);
      ctx.strokeStyle = 
gba(168, 85, 247, );
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 12;
      for (let w = 0; w < 6; w++) {
        const ang = (w / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * 26, Math.sin(ang) * 26);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

        if (fx.type === 'chain_lightning') {
      const alpha = Math.max(0, 1 - fx.progress);
      ctx.save();
      ctx.translate(fx.startX - fx.x, fx.startY - fx.y);
      ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.shadowColor = '#3b82f6'; ctx.shadowBlur = 14;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0);
      const midX = (fx.x - fx.startX) * 0.5 + (Math.random() * 20 - 10);
      const midY = (fx.y - fx.startY) * 0.5 + (Math.random() * 20 - 10);
      ctx.lineTo(midX, midY); ctx.lineTo(fx.x - fx.startX, fx.y - fx.startY);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
      return;
    }

    if (fx.type === 'meso_explosion') {
      const p = fx.progress;
      const alpha = Math.max(0, 1 - p);
      ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(0, 0, 20 * p + 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }

    if (fx.type === 'meteor') {
      const p = fx.progress;
      const alpha = Math.max(0, 1 - p);
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.8})`;
      ctx.shadowColor = '#ea580c'; ctx.shadowBlur = 24;
      for (let m = -3; m <= 3; m++) {
        const fallY = -350 + (350 * Math.min(1, p * 1.5));
        ctx.beginPath(); ctx.arc(m * 90, fallY, 24, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      return;
    }

    if (fx.type === 'blizzard') {
      const p = fx.progress;
      const alpha = Math.max(0, 1 - p);
      ctx.strokeStyle = `rgba(186, 230, 253, ${alpha})`;
      ctx.shadowColor = '#0284c7'; ctx.shadowBlur = 20;
      ctx.lineWidth = 3;
      for (let s = -4; s <= 4; s++) {
        ctx.beginPath(); ctx.moveTo(s * 75, -200); ctx.lineTo(s * 75 + 20, 20); ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (fx.type === 'sanctuary') {
      const p = fx.progress;
      const alpha = Math.max(0, 1 - p);
      ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 30;
      ctx.fillRect(-25, -280, 50, 320);
      ctx.fillRect(-120, -180, 240, 60);
      ctx.restore();
      return;
    }

    if (fx.type === 'dragon_roar') {
      const p = fx.progress;
      const alpha = Math.max(0, 1 - p);
      ctx.strokeStyle = `rgba(244, 63, 94, ${alpha})`;
      ctx.shadowColor = '#be123c'; ctx.shadowBlur = 25;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, 320 * p, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 240 * p, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      return;
    }

    if (fx.type === 'boomerang_step') {
      const p = fx.progress;
      const alpha = Math.max(0, 1 - p);
      ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 18;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-60, -40); ctx.lineTo(60, 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60, -40); ctx.lineTo(-60, 40); ctx.stroke();
      ctx.restore();
      return;
    }

if (fx.type === 'teleport') {
      const p = fx.progress;
      const alpha = Math.max(0, 1 - p);
      // Start distortion sphere
      ctx.save();
      ctx.translate(fx.startX - fx.x, fx.startY - fx.y);
      ctx.fillStyle = `rgba(168, 85, 247, ${alpha * 0.7})`;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, -18, 22 * (1 - p * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(216, 180, 254, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -18, 30 * p, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Destination arrival burst
      ctx.save();
      ctx.fillStyle = `rgba(192, 132, 252, ${alpha * 0.8})`;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.ellipse(0, -18, 24 * (1 - p * 0.3), 32 * (1 - p * 0.3), 0, 0, Math.PI * 2);
      ctx.fill();
      // Cyan magical shockwave ring
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, -18, 42 * p, 24 * p, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (fx.type === 'power_strike') {
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
    } else if (fx.type === 'heal') {
      const p = fx.progress;
      const alpha = Math.max(0, 1 - p);
      ctx.save();
      // Holy healing green-gold aura rings
      ctx.strokeStyle = `rgba(52, 211, 153, ${alpha * 0.9})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -10, 40 * p + 10, 15 * p + 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Rising sacred crosses
      const crosses = [
        { x: -25, y: -20 - p * 50, scale: 0.8 },
        { x: 0, y: -35 - p * 65, scale: 1.2 },
        { x: 25, y: -20 - p * 50, scale: 0.8 },
        { x: -12, y: -10 - p * 40, scale: 0.6 },
        { x: 12, y: -10 - p * 40, scale: 0.6 }
      ];
      ctx.fillStyle = `rgba(167, 243, 208, ${alpha})`;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      crosses.forEach(c => {
        ctx.save();
        ctx.translate(c.x, c.y);
        const s = c.scale;
        // Draw cross
        ctx.fillRect(-2 * s, -8 * s, 4 * s, 16 * s);
        ctx.fillRect(-7 * s, -4 * s, 14 * s, 4 * s);
        ctx.restore();
      });
      ctx.restore();
    } else if (fx.type === 'holy_hit') {
      const p = fx.progress;
      const alpha = Math.max(0, 1 - p);
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#34d399';
      ctx.strokeStyle = `rgba(110, 231, 183, ${alpha * 0.9})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20 * p + 8, 10 * p + 4, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Golden sacred cross flash on hit undead monster
      ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
      const s = 1.3 * (1 - p * 0.3);
      ctx.fillRect(-2 * s, -12 * s, 4 * s, 24 * s);
      ctx.fillRect(-10 * s, -6 * s, 20 * s, 4 * s);
      ctx.restore();
    } else if (fx.type === 'genesis') {
      const p = fx.progress;
      const alpha = Math.max(0, 1 - p * 0.8);
      ctx.save();
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#fde047';

      // 4 Sacred Divine Light Pillars from heavens
      const pillarOffsets = [-180, -60, 60, 180];
      pillarOffsets.forEach((px, idx) => {
        const pillarAlpha = Math.max(0, Math.sin((p + idx * 0.1) * Math.PI) * alpha);
        ctx.fillStyle = `rgba(254, 240, 138, ${pillarAlpha * 0.85})`;
        ctx.fillRect(px - 18, -450, 36, 450);
        ctx.fillStyle = `rgba(255, 255, 255, ${pillarAlpha})`;
        ctx.fillRect(px - 8, -450, 16, 450);

        // Ground burst at base of each pillar
        ctx.strokeStyle = `rgba(250, 204, 21, ${pillarAlpha})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(px, 0, 35 * p + 10, 10 * p + 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Massive central shockwave
      ctx.strokeStyle = `rgba(254, 249, 195, ${alpha * 0.9})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 260 * p, 45 * p, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (fx.type === 'strafe') {
      const p = fx.progress;
      const alpha = Math.max(0, 1 - p);
      const dir = fx.facing === 'right' ? 1 : -1;
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#f59e0b';
      // 4 Golden high-speed arrow vapor trails
      for (let i = 0; i < 4; i++) {
        const startX = dir * (i * 25 + p * 120);
        const yOff = -24 + (i * 6 - 9);
        ctx.strokeStyle = `rgba(254, 240, 138, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, yOff);
        ctx.lineTo(startX + dir * 65, yOff);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(startX + dir * 65, yOff, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (fx.type === 'savage_blow') {
      const p = fx.progress;
      const alpha = Math.max(0, 1 - p);
      const dir = fx.facing === 'right' ? 1 : -1;
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#e11d48';

      // 6 rapid diagonal slash arcs
      const slashes = [
        { x: 30, y: -45, rot: 0.4, color: '#f43f5e' },
        { x: 50, y: -25, rot: -0.6, color: '#fb7185' },
        { x: 40, y: -10, rot: 0.8, color: '#f59e0b' },
        { x: 60, y: -35, rot: -0.3, color: '#e11d48' },
        { x: 45, y: -20, rot: 0.5, color: '#fda4af' },
        { x: 55, y: -40, rot: -0.7, color: '#ffe4e6' }
      ];

      slashes.forEach((sl, idx) => {
        const slashP = Math.min(1, Math.max(0, (p * 6 - idx * 0.8)));
        if (slashP <= 0 || slashP >= 1) return;
        ctx.save();
        ctx.translate(dir * sl.x, sl.y);
        ctx.rotate(sl.rot * dir);
        ctx.strokeStyle = sl.color;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(-35 * slashP, 0);
        ctx.lineTo(35 * slashP, 0);
        ctx.stroke();

        // White core spark
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(20 * slashP, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
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

  // --- DRAW COMBO ATTACK ORBS ---
  drawComboOrbs(ctx, player) {
    const count = Math.min(5, Math.max(1, player.comboCount || 0));
    const time = (window.performance ? window.performance.now() / 1000 : Date.now() / 1000) * 2.8;
    const radius = 34;
    const centerY = -30; // Chest / Shoulder height

    for (let i = 0; i < count; i++) {
      const angle = time + (i * 2 * Math.PI / count);
      const ox = Math.cos(angle) * radius;
      const oy = centerY + Math.sin(angle) * (radius * 0.42); // 3D perspective ellipse orbit

      ctx.save();
      ctx.translate(ox, oy);

      // Max combo (5 orbs) turns blazing crimson-gold, otherwise mystical violet/azure
      const isMax = count >= 5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = isMax ? '#f59e0b' : '#a855f7';

      // Outer glow orb
      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 7.5);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, isMax ? '#fbbf24' : '#c084fc');
      grad.addColorStop(0.8, isMax ? '#ef4444' : '#7c3aed');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Sharp dark outline
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Small specular sparkle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2, -2, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
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

  // --- DRAW HORNTAIL MYTHIC BOSS (3 HEADS + WINGS + BODY) ---
  drawHorntailBoss(ctx, boss) {
    if (!boss || (!boss.isAlive() && !boss.isDying())) return;
    ctx.save();
    if (boss.isDying()) ctx.globalAlpha *= Math.max(0, boss.dyingTimer / boss.dyingDuration);

    const frameIdx = Math.floor(boss.animationTime * 4) % 6;
    const sprite = this.monsters?.horntail?.stand?.[frameIdx] || this.monsters?.horntail?.move?.[frameIdx];

    const drawX = Math.round(boss.x - boss.width / 2);
    const drawY = Math.round(boss.y - boss.height);

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(sprite, drawX, drawY, boss.width, boss.height);
      if (boss.hitTimer > 0 && boss.isAlive()) {
        ctx.save();
        ctx.globalAlpha *= Math.min(1, boss.hitTimer / 0.15);
        ctx.drawImage(this.getSpriteHitMask(sprite), drawX, drawY, boss.width, boss.height);
        ctx.restore();
      }
    } else {
      // Fallback silhouette
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(drawX, drawY, boss.width, boss.height);
    }

    // Draw Destructible Parts HP bars & labels (when alive)
    if (boss.isAlive()) {
      for (const part of boss.parts) {
        if (!part.isAlive) continue;
        const px = boss.x + part.offsetX;
        const py = boss.y + part.offsetY;
        const hpPct = Math.max(0, part.hp / part.maxHp);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(px - 22, py - 6, 44, 5);
        ctx.fillStyle = part.id === 'middle_head' ? '#eab308' : (part.id === 'left_head' ? '#ef4444' : (part.id === 'right_head' ? '#38bdf8' : '#a855f7'));
        ctx.fillRect(px - 21, py - 5, hpPct * 42, 3);

        ctx.font = 'bold 9px "Malgun Gothic", sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.fillText(part.name.split(' ')[1] || part.name, px, py - 8);
      }
    }

    // Draw Active Spells
    for (const spell of boss.activeSpells) {
      const progress = Math.min(1, spell.timer / spell.duration);
      ctx.save();
      const color = spell.color || '#ef4444';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;

      const w = spell.width || 64;
      const h = spell.height || 200;
      const alpha = 0.35 + Math.sin(performance.now() / 65) * 0.25;
      ctx.globalAlpha = alpha * 0.45;
      ctx.fillRect(spell.x - w / 2, spell.y - h, w, h);
      ctx.globalAlpha = 0.85;
      ctx.strokeRect(spell.x - w / 2, spell.y - h, w, h);

      if (spell.label) {
        ctx.font = 'bold 11px "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(`⚠️ ${spell.label}`, spell.x, spell.y - 20);
      }
      ctx.restore();
    }

    ctx.restore();
  }
}

window.sprites = new SpriteRenderer();
