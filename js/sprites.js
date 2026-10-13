// js/sprites.js - 2-Head SD Paperdoll, Cel-Shading, Dark Outlines, and Maple Damage Skin

class SpriteRenderer {
  constructor() {
    this.dustParticles = [];
  }

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

  // --- Draw Player (2-Head SD Paperdoll Hierarchy with 2px Outlines & Cel-Shading) ---
  drawPlayer(ctx, player) {
    ctx.save();
    ctx.translate(player.x, player.y);

    if (player.facing === 'left') {
      ctx.scale(-1, 1);
    }

    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 12) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    if (player.hp <= 0) {
      this.drawTombstone(ctx, player);
      ctx.restore();
      return;
    }

    const isJumping = !player.onGround && !player.onLadder;
    const isWalking = player.vx !== 0 && player.onGround;
    const isAttacking = player.attackTimer > 0;
    const isClimbing = player.onLadder;

    const time = Date.now() / 1000;
    // Breathing bob
    const idleBob = Math.sin(time * 3.2) * 1.5;
    const walkBob = isWalking ? Math.sin(time * 9.0) * 2.5 : 0;
    const bob = isWalking ? walkBob : idleBob;
    const walkCycle = Math.sin(time * 9.0);

    // Forward lean when running
    const bodyLean = isWalking ? (4 * Math.PI / 180) : 0;

    // Shadow
    if (player.onGround) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 14, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.translate(0, bob);
    ctx.rotate(bodyLean);

    if (isClimbing) {
      this.drawClimbingPlayer(ctx, player);
      ctx.restore();
      return;
    }

    // === PAPERDOLL HIERARCHY ===
    // 1. Back Arm
    if (!isAttacking) {
      this.drawBackArm(ctx, player, walkCycle);
    }

    // 2. Legs & Pants (Cel-shaded with 2px outline)
    this.drawLegs(ctx, player, isJumping, isWalking, walkCycle);

    // 3. Body / Torso
    this.drawTorso(ctx, player);

    // 4. Head & Face (Extreme Chibi: Head height 22px, Body+Legs 22px)
    this.drawHeadAndFace(ctx, player, isAttacking);

    // 5. Hair & Hat
    this.drawHairAndHat(ctx, player);

    // 6. Front Arm & Weapon
    this.drawFrontArmAndWeapon(ctx, player, isAttacking, isWalking, walkCycle);

    ctx.restore();
  }

  drawBackArm(ctx, player, walkCycle) {
    ctx.save();
    ctx.translate(-7, -15);
    ctx.rotate(-walkCycle * 0.25);
    ctx.fillStyle = '#fce4c8';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  drawLegs(ctx, player, isJumping, isWalking, walkCycle) {
    let pantsBase = '#2c406b';
    let pantsShadow = '#1e2b48';
    let shoesBase = '#8b4513';
    let shoesShadow = '#5c2d0c';

    if (player.job === '전사') {
      pantsBase = '#475569'; pantsShadow = '#334155';
      shoesBase = '#1f2937'; shoesShadow = '#111827';
    } else if (player.job === '마법사') {
      pantsBase = '#1e3a8a'; pantsShadow = '#172554';
      shoesBase = '#78350f'; shoesShadow = '#451a03';
    } else if (player.job === '궁수') {
      pantsBase = '#4d7c0f'; pantsShadow = '#365314';
      shoesBase = '#713f12'; shoesShadow = '#422006';
    } else if (player.job === '도적') {
      pantsBase = '#27272a'; pantsShadow = '#18181b';
      shoesBase = '#18181b'; shoesShadow = '#09090b';
    }

    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';

    if (isJumping) {
      // Bent jumping legs
      ctx.fillStyle = pantsBase;
      ctx.fillRect(-6, -7, 5, 7);
      ctx.strokeRect(-6, -7, 5, 7);
      ctx.fillRect(1, -8, 5, 6);
      ctx.strokeRect(1, -8, 5, 6);

      ctx.fillStyle = shoesBase;
      ctx.fillRect(-8, 0, 7, 4);
      ctx.strokeRect(-8, 0, 7, 4);
      ctx.fillRect(0, -2, 7, 4);
      ctx.strokeRect(0, -2, 7, 4);
    } else if (isWalking) {
      // Striding legs
      const step = walkCycle * 3;
      ctx.fillStyle = pantsBase;
      ctx.fillRect(-6 + step, -7, 5, 7);
      ctx.strokeRect(-6 + step, -7, 5, 7);
      ctx.fillRect(1 - step, -7, 5, 7);
      ctx.strokeRect(1 - step, -7, 5, 7);

      ctx.fillStyle = shoesBase;
      ctx.fillRect(-8 + step, 0, 7, 4);
      ctx.strokeRect(-8 + step, 0, 7, 4);
      ctx.fillRect(0 - step, 0, 7, 4);
      ctx.strokeRect(0 - step, 0, 7, 4);
    } else {
      // Standing legs with cel shadow
      ctx.fillStyle = pantsBase;
      ctx.fillRect(-5, -7, 4, 7);
      ctx.strokeRect(-5, -7, 4, 7);
      ctx.fillRect(1, -7, 4, 7);
      ctx.strokeRect(1, -7, 4, 7);

      ctx.fillStyle = pantsShadow;
      ctx.fillRect(-5, -2, 4, 2);
      ctx.fillRect(1, -2, 4, 2);

      ctx.fillStyle = shoesBase;
      ctx.fillRect(-7, 0, 6, 4);
      ctx.strokeRect(-7, 0, 6, 4);
      ctx.fillRect(1, 0, 6, 4);
      ctx.strokeRect(1, 0, 6, 4);
    }
  }

  drawTorso(ctx, player) {
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';

    if (player.job === '전사') {
      // Knight Chestplate
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.roundRect(-8, -21, 16, 15, 3);
      ctx.fill();
      ctx.stroke();
      // Cel shadow
      ctx.fillStyle = '#475569';
      ctx.fillRect(-8, -10, 16, 4);
      // Gold chest emblem
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-3, -18, 6, 7);
    } else if (player.job === '마법사') {
      // Mystic Blue Robe
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.roundRect(-8, -21, 16, 15, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(-8, -10, 16, 4);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-2, -19, 4, 11);
    } else if (player.job === '궁수') {
      // Archer Tunic
      ctx.fillStyle = '#65a30d';
      ctx.beginPath();
      ctx.roundRect(-7, -20, 14, 14, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(-7, -10, 14, 4);
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-7, -16, 14, 3);
    } else if (player.job === '도적') {
      // Shinobi Shadow Garb
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.roundRect(-7, -20, 14, 14, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-7, -10, 14, 4);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-7, -13, 14, 4);
    } else {
      // Classic Beginner Outfit
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(-7, -20, 14, 14, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-7, -10, 14, 4);
      ctx.fillStyle = '#3a72b8';
      ctx.fillRect(-7, -20, 14, 4);
    }
  }

  drawHeadAndFace(ctx, player, isAttacking) {
    // 2-Head SD Ratio: Large head radius 12px
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';

    // Head base skin
    ctx.fillStyle = '#fce4c8';
    ctx.beginPath();
    ctx.arc(0, -29, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cel skin shadow under chin
    ctx.fillStyle = '#f6cca2';
    ctx.beginPath();
    ctx.arc(0, -29, 12, 0.2 * Math.PI, 0.8 * Math.PI, false);
    ctx.fill();

    // Cheeks: Rosy pink blush
    ctx.fillStyle = 'rgba(255, 140, 160, 0.6)';
    ctx.beginPath();
    ctx.ellipse(6, -24, 3.2, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes: Iconic Anime Maple Eyes with 2 specular highlights
    if (isAttacking) {
      // Fierce fighting eyes
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.moveTo(3, -31);
      ctx.lineTo(9, -27);
      ctx.lineTo(3, -28);
      ctx.closePath();
      ctx.fill();
    } else {
      // Big cute dark anime eye
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(5, -28, 3.0, 4.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight 1 (Upper large sparkle)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, -30, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Highlight 2 (Lower tiny secondary sparkle)
      ctx.beginPath();
      ctx.arc(4.2, -26.5, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouth / Smile
    ctx.strokeStyle = '#a65e44';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(3.5, -23, 2.5, 0.1 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }

  drawHairAndHat(ctx, player) {
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';

    if (player.job === '전사') {
      // Horned Iron Helmet
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(0, -34, 13, Math.PI, 0, false);
      ctx.lineTo(13, -27);
      ctx.lineTo(-13, -27);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Gold Horns
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-12, -32); ctx.lineTo(-20, -41); ctx.lineTo(-11, -37); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, -32); ctx.lineTo(20, -41); ctx.lineTo(11, -37); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (player.job === '마법사') {
      // Blue Wizard Hat with Star
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.moveTo(-15, -30); ctx.lineTo(0, -52); ctx.lineTo(15, -30); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -30, 17, 4.5, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, -39, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (player.job === '궁수') {
      // Feather Hunter Cap
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.ellipse(0, -34, 14, 7.5, -0.1, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-7, -36); ctx.lineTo(-16, -48); ctx.lineTo(-4, -40); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (player.job === '도적') {
      // Ninja Bandana & Shadow Mask
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-12, -36, 24, 7);
      ctx.strokeRect(-12, -36, 24, 7);
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.roundRect(1, -26, 11, 8, 2);
      ctx.fill(); ctx.stroke();
    } else {
      // Beginner Red Headband & Hair
      ctx.fillStyle = '#5c3826';
      ctx.beginPath();
      ctx.arc(-2, -33, 12, Math.PI, 0, false);
      ctx.lineTo(11, -30); ctx.lineTo(8, -25); ctx.lineTo(2, -31);
      ctx.lineTo(-3, -24); ctx.lineTo(-13, -28); ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-12, -35, 24, 6);
      ctx.strokeRect(-12, -35, 24, 6);
    }
  }

  drawFrontArmAndWeapon(ctx, player, isAttacking, isWalking, walkCycle) {
    if (isAttacking) {
      const swingProgress = 1 - (player.attackTimer / player.attackDuration);
      const angle = -Math.PI / 4 + swingProgress * (Math.PI * 0.95);

      ctx.save();
      ctx.translate(2, -15);
      ctx.rotate(angle);

      ctx.fillStyle = '#fce4c8';
      ctx.beginPath();
      ctx.roundRect(0, -3, 14, 6, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      this.drawWeapon(ctx, player.weaponType || 'sword');
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = '#fce4c8';
      ctx.beginPath();
      ctx.arc(4, -13, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.translate(6, -13);
      ctx.rotate(Math.PI / 6 + (isWalking ? walkCycle * 0.2 : 0));
      this.drawWeapon(ctx, player.weaponType || 'sword');
      ctx.restore();
    }
  }

  drawWeapon(ctx, type) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';

    if (type === 'dagger' || type === 'claw') {
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(0, -3, 10, 6);
      ctx.strokeRect(0, -3, 10, 6);
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(10, -5); ctx.lineTo(25, -3); ctx.lineTo(10, -1);
      ctx.moveTo(10, 1); ctx.lineTo(25, 3); ctx.lineTo(10, 5);
      ctx.fill(); ctx.stroke();
    } else if (type === 'staff') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, -2, 34, 4);
      ctx.strokeRect(0, -2, 34, 4);
      const grad = ctx.createRadialGradient(34, 0, 1, 34, 0, 7);
      grad.addColorStop(0, '#e9d5ff');
      grad.addColorStop(1, '#9333ea');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(34, 0, 7.5, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    } else if (type === 'bow') {
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(10, 0, 19, -Math.PI / 2.3, Math.PI / 2.3);
      ctx.stroke();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(10, 0, 19, -Math.PI / 2.3, Math.PI / 2.3);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(18, -17); ctx.lineTo(18, 17);
      ctx.stroke();
    } else {
      // Steel Greatsword
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, -2, 8, 4);
      ctx.strokeRect(0, -2, 8, 4);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(8, -8, 4, 16);
      ctx.strokeRect(8, -8, 4, 16);

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(12, -5); ctx.lineTo(38, -4); ctx.lineTo(44, 0); ctx.lineTo(38, 4); ctx.lineTo(12, 5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(14, -1, 25, 2);
    }
  }

  drawClimbingPlayer(ctx, player) {
    const climbCycle = Math.sin(Date.now() / 90);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';

    ctx.fillStyle = '#3a72b8';
    ctx.fillRect(-7, -19, 14, 14);
    ctx.strokeRect(-7, -19, 14, 14);

    ctx.fillStyle = '#2c406b';
    ctx.fillRect(-6, -6 + climbCycle * 3, 5, 6);
    ctx.strokeRect(-6, -6 + climbCycle * 3, 5, 6);
    ctx.fillRect(1, -6 - climbCycle * 3, 5, 6);
    ctx.strokeRect(1, -6 - climbCycle * 3, 5, 6);

    ctx.fillStyle = '#5c3826';
    ctx.beginPath();
    ctx.arc(0, -27, 12, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(-10, -34, 20, 6);
    ctx.strokeRect(-10, -34, 20, 6);

    ctx.fillStyle = '#fce4c8';
    ctx.fillRect(-12, -26 - climbCycle * 5, 5, 8);
    ctx.strokeRect(-12, -26 - climbCycle * 5, 5, 8);
    ctx.fillRect(7, -26 + climbCycle * 5, 5, 8);
    ctx.strokeRect(7, -26 + climbCycle * 5, 5, 8);
  }

  drawTombstone(ctx, player) {
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(-14, -28, 28, 28, [12, 12, 2, 2]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('R.I.P', 0, -14);
    ctx.fillText(player.name || '모험가', 0, -5);

    const ghostY = -38 - Math.sin(Date.now() / 250) * 8;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(0, ghostY, 9, Math.PI, 0, false);
    ctx.lineTo(8, ghostY + 12); ctx.lineTo(3, ghostY + 8);
    ctx.lineTo(0, ghostY + 12); ctx.lineTo(-3, ghostY + 8);
    ctx.lineTo(-8, ghostY + 12); ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, ghostY - 12, 6, 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- Draw Monster with Cel-Shading, Dark Outlines, and White Hit Flash Mask ---
  drawMonster(ctx, m) {
    ctx.save();
    ctx.translate(m.x, m.y);

    // 1. Draw Body
    ctx.save();
    if (m.facing === 'right') {
      ctx.scale(-1, 1);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 2, m.width * 0.45, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';

    switch (m.type) {
      case 'snail':
        this.drawSnail(ctx, m, '#27ae60', '#1e824c', '#58d68d');
        break;
      case 'blue_snail':
        this.drawSnail(ctx, m, '#2563eb', '#1d4ed8', '#60a5fa');
        break;
      case 'red_snail':
        this.drawSnail(ctx, m, '#dc2626', '#b91c1c', '#f87171');
        break;
      case 'slime':
        this.drawSlime(ctx, m);
        break;
      case 'orange_mushroom':
        this.drawOrangeMushroom(ctx, m);
        break;
      case 'ribbon_pig':
        this.drawRibbonPig(ctx, m);
        break;
      case 'green_mushroom':
        this.drawGreenMushroom(ctx, m);
        break;
      case 'mushmom':
        this.drawMushmom(ctx, m);
        break;
      default:
        this.drawSnail(ctx, m, '#27ae60', '#1e824c', '#58d68d');
    }

    // Pure White Silhouette Hit Flash Mask (0.12s)
    if (m.hitTimer > 0) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillRect(-m.width, -m.height - 20, m.width * 2, m.height * 2);
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();

    // 2. HP Bar and Text (Facing Invariant)
    if (m.hp < m.maxHp && m.type !== 'mushmom') {
      const hpWidth = Math.max(28, m.width * 0.85);
      const hpPercent = Math.max(0, m.hp / m.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-hpWidth / 2, -m.height - 10, hpWidth, 5);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-hpWidth / 2 + 1, -m.height - 9, (hpWidth - 2) * hpPercent, 3);
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-hpWidth / 2, -m.height - 10, hpWidth, 5);
    }

    ctx.font = 'bold 10px "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    const label = `Lv.${m.level} ${m.name}`;
    ctx.strokeText(label, 0, -m.height - 14);
    ctx.fillText(label, 0, -m.height - 14);

    ctx.restore();
  }

  drawSnail(ctx, m, shellBase, shellShadow, shellHighlight) {
    const bob = Math.sin(Date.now() / 120 + m.id) * 1.5;

    // Body
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(6, -6 + bob, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Eye stalks
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(12, -8 + bob); ctx.lineTo(16, -14 + bob);
    ctx.moveTo(10, -9 + bob); ctx.lineTo(13, -15 + bob);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(16, -15 + bob, 1.8, 0, Math.PI * 2);
    ctx.arc(13, -16 + bob, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Shell with cel shade
    ctx.fillStyle = shellShadow;
    ctx.beginPath();
    ctx.arc(-4, -13 + bob, 13, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = shellBase;
    ctx.beginPath();
    ctx.arc(-4, -13 + bob, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = shellHighlight;
    ctx.beginPath();
    ctx.arc(-3, -13 + bob, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSlime(ctx, m) {
    const bounce = Math.abs(Math.sin(Date.now() / 140 + m.id));
    const stretchY = 1 + bounce * 0.25;
    const stretchX = 1 - bounce * 0.15;

    ctx.save();
    ctx.scale(stretchX, stretchY);

    // Cel-Shaded Gelatinous Body
    ctx.fillStyle = '#16a34a'; // Dark shade
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.bezierCurveTo(-18, -14, -12, -26, 0, -28);
    ctx.bezierCurveTo(12, -26, 18, -14, 16, -2);
    ctx.bezierCurveTo(10, 2, -10, 2, -16, -2);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#4ade80'; // Mid green
    ctx.beginPath();
    ctx.moveTo(-13, -4);
    ctx.bezierCurveTo(-15, -13, -10, -23, 0, -25);
    ctx.bezierCurveTo(10, -23, 15, -13, 13, -4);
    ctx.bezierCurveTo(8, 0, -8, 0, -13, -4);
    ctx.closePath();
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(-5, -19, 5, 2.5, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Eyes with specular dots
    ctx.fillStyle = '#0f291e';
    ctx.beginPath();
    ctx.ellipse(-4, -12, 2.2, 3.2, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -12, 2.2, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -13.5, 1, 0, Math.PI * 2);
    ctx.arc(6, -13.5, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 120, 160, 0.5)';
    ctx.beginPath();
    ctx.arc(-8, -9, 2.5, 0, Math.PI * 2);
    ctx.arc(10, -9, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawOrangeMushroom(ctx, m) {
    const hop = Math.abs(Math.sin(Date.now() / 160 + m.id)) * 5;
    ctx.save();
    ctx.translate(0, -hop);

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, -10, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(-6, -1, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -1, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Eyes
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(-3, -11, 2, 3.2, 0, 0, Math.PI * 2);
    ctx.ellipse(4, -11, 2, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3, -12.5, 1, 0, Math.PI * 2);
    ctx.arc(4, -12.5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Cap with 2-Tone Cel Shading
    ctx.fillStyle = '#c2410c'; // Shadow
    ctx.beginPath();
    ctx.ellipse(0, -22, 23, 16, 0, Math.PI, 0, false);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ea580c'; // Base orange
    ctx.beginPath();
    ctx.ellipse(0, -24, 21, 14, 0, Math.PI, 0, false);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    [
      { x: -11, y: -24, r: 3 },
      { x: 0, y: -30, r: 3.5 },
      { x: 12, y: -25, r: 2.8 },
      { x: -5, y: -22, r: 2 },
      { x: 6, y: -22, r: 2.2 }
    ].forEach(dot => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    });

    ctx.restore();
  }

  drawRibbonPig(ctx, m) {
    const runCycle = Math.sin(Date.now() / 90 + m.id);
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(0, -14, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(12, -15, 10, 9, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.ellipse(18, -13, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(13, -18, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f472b6';
    ctx.fillRect(-12 + runCycle * 4, -4, 4, 6); ctx.strokeRect(-12 + runCycle * 4, -4, 4, 6);
    ctx.fillRect(-4 - runCycle * 4, -4, 4, 6); ctx.strokeRect(-4 - runCycle * 4, -4, 4, 6);
    ctx.fillRect(4 + runCycle * 4, -4, 4, 6); ctx.strokeRect(4 + runCycle * 4, -4, 4, 6);
    ctx.fillRect(12 - runCycle * 4, -4, 4, 6); ctx.strokeRect(12 - runCycle * 4, -4, 4, 6);

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(5, -17, 3, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(5, -17, 3, 5, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }

  drawGreenMushroom(ctx, m) {
    const hop = Math.abs(Math.sin(Date.now() / 150 + m.id)) * 4;
    ctx.save();
    ctx.translate(0, -hop);

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, -11, 12, 11, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#15803d'; // Shadow
    ctx.beginPath();
    ctx.ellipse(0, -25, 26, 18, 0, Math.PI, 0, false);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#16a34a'; // Base
    ctx.beginPath();
    ctx.ellipse(0, -27, 24, 16, 0, Math.PI, 0, false);
    ctx.fill();

    ctx.fillStyle = '#bbf7d0';
    [
      { x: -14, y: -27, r: 3.5 },
      { x: 0, y: -34, r: 4 },
      { x: 14, y: -28, r: 3.2 }
    ].forEach(dot => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    });

    ctx.restore();
  }

  drawMushmom(ctx, m) {
    const hop = Math.abs(Math.sin(Date.now() / 200 + m.id)) * 8;
    ctx.save();
    ctx.translate(0, -hop);
    ctx.scale(2.4, 2.4);

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, -12, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(-7, -18); ctx.lineTo(-2, -14); ctx.lineTo(-7, -12); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7, -18); ctx.lineTo(2, -14); ctx.lineTo(7, -12); ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-18, -25, 36, 5); ctx.strokeRect(-18, -25, 36, 5);

    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.ellipse(0, -32, 29, 21, 0, Math.PI, 0, false);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.ellipse(0, -34, 27, 19, 0, Math.PI, 0, false);
    ctx.fill();

    ctx.restore();
  }

  // --- Draw Staggered Bouncing Damage Digits (Maple Damage Skin) ---
  drawDamageParticle(ctx, dp) {
    if (dp.delay > 0) return; // Staggered delay wait

    ctx.save();
    ctx.translate(dp.x, dp.y);
    ctx.globalAlpha = Math.max(0, Math.min(1, dp.life * 2.5));

    const size = dp.isCrit ? 22 : 17;
    ctx.font = `900 ${size}px "Impact", "Arial Black", sans-serif`;
    ctx.textAlign = 'center';

    if (dp.isCrit) {
      // 2px Black Outer Border
      ctx.strokeStyle = '#3f1010';
      ctx.lineWidth = 4.5;
      ctx.strokeText(dp.char, 0, 0);

      // Gold/Orange Gradient Fill
      const grad = ctx.createLinearGradient(0, -size, 0, 0);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#facc15');
      grad.addColorStop(1, '#ea580c');
      ctx.fillStyle = grad;
      ctx.fillText(dp.char, 0, 0);

      // White Highlight Inner Stroke
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(dp.char, -0.6, -0.8);
    } else {
      ctx.strokeStyle = '#2e1065';
      ctx.lineWidth = 3.8;
      ctx.strokeText(dp.char, 0, 0);

      const grad = ctx.createLinearGradient(0, -size, 0, 0);
      grad.addColorStop(0, '#fbcfe8');
      grad.addColorStop(0.5, '#f472b6');
      grad.addColorStop(1, '#db2777');
      ctx.fillStyle = grad;
      ctx.fillText(dp.char, 0, 0);
    }

    ctx.restore();
  }

  drawProjectile(ctx, proj) {
    ctx.save();
    ctx.translate(proj.x, proj.y);

    if (proj.type === 'arrow') {
      const angle = Math.atan2(proj.vy, proj.vx);
      ctx.rotate(angle);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-16, -1.5, 32, 3);
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(16, -4); ctx.lineTo(22, 0); ctx.lineTo(16, 4); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-16, -4); ctx.lineTo(-10, 0); ctx.lineTo(-16, 4); ctx.fill();
    } else if (proj.type === 'shuriken') {
      const rot = (Date.now() / 30) % (Math.PI * 2);
      ctx.rotate(rot);
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -10); ctx.lineTo(3, 0); ctx.lineTo(0, 3); ctx.lineTo(-3, 0);
        ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.type === 'energy_bolt') {
      const pulse = Math.sin(Date.now() / 60) * 2;
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 10 + pulse);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#c084fc');
      grad.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 10 + pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawDrop(ctx, drop) {
    ctx.save();
    ctx.translate(drop.x, drop.y);
    const bob = Math.sin(Date.now() / 150 + drop.id) * 2;
    ctx.translate(0, bob);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 4 - bob, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';

    if (drop.type === 'meso') {
      if (drop.amount >= 100) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.ellipse(0, -4, 9, 8, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-5, -11, 10, 3);
        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('M', 0, -1);
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(0, -4, 7, 7, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(0, -4, 4.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (drop.type === 'red_potion') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -3, 6, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-2, -10, 4, 3);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-3, -13, 6, 3);
    } else if (drop.type === 'blue_potion') {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(0, -3, 6, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-2, -10, 4, 3);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-3, -13, 6, 3);
    } else {
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.roundRect(-7, -11, 14, 14, 3);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('★', 0, -1);
    }

    ctx.restore();
  }

  drawDamageDigit(ctx, digit) {
    if (!digit.started || digit.life <= 0) return;
    ctx.save();
    ctx.translate(digit.x, digit.y);
    const alpha = Math.max(0, Math.min(1, digit.life * 1.5));
    ctx.globalAlpha = alpha;

    if (digit.char === 'CRITICAL') {
      ctx.font = '900 11px "Impact", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 3;
      ctx.strokeText('CRITICAL', 0, 0);
      ctx.fillStyle = '#fef08a';
      ctx.fillText('CRITICAL', 0, 0);
      ctx.restore();
      return;
    }

    const isCrit = digit.isCrit;
    const fontSize = isCrit ? 22 : 18;
    ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;
    ctx.textAlign = 'center';

    if (isCrit) {
      // Golden / Orange Maple Classic Critical Typography
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeText(digit.char, 0, 0);

      const grad = ctx.createLinearGradient(0, -fontSize, 0, 2);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#facc15');
      grad.addColorStop(1, '#ea580c');
      ctx.fillStyle = grad;
      ctx.fillText(digit.char, 0, 0);
    } else {
      // Classic Purple / Pink Maple Typography
      ctx.strokeStyle = '#4c1d95';
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      ctx.strokeText(digit.char, 0, 0);

      const grad = ctx.createLinearGradient(0, -fontSize, 0, 2);
      grad.addColorStop(0, '#fdf4ff');
      grad.addColorStop(0.5, '#f472b6');
      grad.addColorStop(1, '#c026d3');
      ctx.fillStyle = grad;
      ctx.fillText(digit.char, 0, 0);
    }

    ctx.restore();
  }

  drawFloatingText(ctx, ft) {
    ctx.save();
    ctx.translate(ft.x, ft.y);
    ctx.globalAlpha = Math.max(0, Math.min(1, ft.life));

    if (ft.type === 'miss') {
      ctx.font = 'bold 15px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText('MISS', 0, 0);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('MISS', 0, 0);
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

  drawSkillEffects(ctx, fx) {
    ctx.save();
    ctx.translate(fx.x, fx.y);

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
      grad.addColorStop(0, `rgba(254, 240, 138, 0)`);
      grad.addColorStop(0.5, `rgba(253, 224, 71, ${0.75 * alpha})`);
      grad.addColorStop(1, `rgba(234, 179, 8, ${0.9 * alpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(-28, -200, 56, 220);

      ctx.save();
      ctx.translate(0, -70);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.bezierCurveTo(-35, -40, -75, -20, -70, 20);
      ctx.bezierCurveTo(-50, 15, -25, 20, 0, 10); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.bezierCurveTo(35, -40, 75, -20, 70, 20);
      ctx.bezierCurveTo(50, 15, 25, 20, 0, 10); ctx.fill();

      ctx.font = 'bold 22px "Arial Black", Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = `rgba(180, 83, 9, ${alpha})`;
      ctx.lineWidth = 6;
      ctx.strokeText('LEVEL UP!', 0, -20 - p * 20);
      ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
      ctx.fillText('LEVEL UP!', 0, -20 - p * 20);
      ctx.restore();
    }

    ctx.restore();
  }
}

window.sprites = new SpriteRenderer();
