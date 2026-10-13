// js/sprites.js - Canvas Vector/Sprite Graphics Engine for Classic MapleStory with 4 Classes

class SpriteRenderer {
  constructor() {
    this.cache = {};
  }

  // --- Draw Player with 4 Class Skins ---
  drawPlayer(ctx, player) {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Direction flip
    if (player.facing === 'left') {
      ctx.scale(-1, 1);
    }

    // Invincible blink
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Death / Tombstone
    if (player.hp <= 0) {
      this.drawTombstone(ctx, player);
      ctx.restore();
      return;
    }

    // State calculation
    const isJumping = !player.onGround && !player.onLadder;
    const isWalking = player.vx !== 0 && player.onGround;
    const isAttacking = player.attackTimer > 0;
    const isClimbing = player.onLadder;

    const bob = isWalking ? Math.sin(Date.now() / 90) * 2.5 : Math.sin(Date.now() / 350) * 1;
    const walkCycle = Math.sin(Date.now() / 80);

    // Shadow
    if (player.onGround) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 3, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.translate(0, bob);

    // If climbing ladder
    if (isClimbing) {
      this.drawClimbingPlayer(ctx, player);
      ctx.restore();
      return;
    }

    // Back arm
    if (!isAttacking) {
      ctx.fillStyle = '#f6cfa6';
      ctx.beginPath();
      ctx.arc(-8, -14, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Legs & Pants based on Job
    this.drawPlayerLegs(ctx, player, isJumping, isWalking, walkCycle);

    // Torso / Outfit based on Job
    this.drawPlayerOutfit(ctx, player);

    // Head & Face
    this.drawPlayerHead(ctx, player, isAttacking);

    // Hat / Hair based on Job
    this.drawPlayerHat(ctx, player);

    // Front Arm & Weapon based on Job
    this.drawPlayerArmAndWeapon(ctx, player, isAttacking, isWalking, walkCycle);

    ctx.restore();
  }

  drawPlayerLegs(ctx, player, isJumping, isWalking, walkCycle) {
    let pantsColor = '#2c406b'; // Default beginner
    let shoesColor = '#8b4513';

    if (player.job === '전사') {
      pantsColor = '#374151'; // Steel chainmail
      shoesColor = '#1f2937';
    } else if (player.job === '마법사') {
      pantsColor = '#1e3a8a'; // Blue robe hem
      shoesColor = '#78350f';
    } else if (player.job === '궁수') {
      pantsColor = '#3f6212'; // Forest green
      shoesColor = '#713f12';
    } else if (player.job === '도적') {
      pantsColor = '#18181b'; // Shadow dark
      shoesColor = '#27272a';
    }

    ctx.fillStyle = pantsColor;
    if (isJumping) {
      ctx.fillRect(-6, -6, 5, 6);
      ctx.fillRect(1, -7, 5, 5);
      ctx.fillStyle = shoesColor;
      ctx.fillRect(-8, 0, 7, 4);
      ctx.fillRect(0, -2, 7, 4);
    } else if (isWalking) {
      ctx.fillRect(-6 + walkCycle * 3, -6, 5, 6);
      ctx.fillRect(1 - walkCycle * 3, -6, 5, 6);
      ctx.fillStyle = shoesColor;
      ctx.fillRect(-8 + walkCycle * 3, 0, 7, 4);
      ctx.fillRect(0 - walkCycle * 3, 0, 7, 4);
    } else {
      ctx.fillRect(-5, -6, 4, 6);
      ctx.fillRect(1, -6, 4, 6);
      ctx.fillStyle = shoesColor;
      ctx.fillRect(-7, 0, 6, 4);
      ctx.fillRect(1, 0, 6, 4);
    }
  }

  drawPlayerOutfit(ctx, player) {
    if (player.job === '전사') {
      // Plate Armor
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.roundRect(-8, -20, 16, 15, 3);
      ctx.fill();
      // Gold chest emblem
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-3, -17, 6, 8);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(-8, -20, 16, 15);
    } else if (player.job === '마법사') {
      // Mystic Blue Robe
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.roundRect(-8, -20, 16, 16, 4);
      ctx.fill();
      // Golden star runes
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-2, -18, 4, 12);
    } else if (player.job === '궁수') {
      // Archer Leather Tunic
      ctx.fillStyle = '#65a30d';
      ctx.beginPath();
      ctx.roundRect(-7, -19, 14, 14, 3);
      ctx.fill();
      // Brown quiver strap
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-7, -16, 14, 3);
    } else if (player.job === '도적') {
      // Shadow Shinobi Garb
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.roundRect(-7, -19, 14, 14, 3);
      ctx.fill();
      // Crimson sash
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-7, -12, 14, 4);
    } else {
      // Beginner Shirt
      ctx.fillStyle = '#eef1f6';
      ctx.beginPath();
      ctx.roundRect(-7, -19, 14, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#3a72b8';
      ctx.fillRect(-7, -19, 14, 4);
      ctx.fillRect(-2, -15, 4, 10);
    }
  }

  drawPlayerHead(ctx, player, isAttacking) {
    ctx.fillStyle = '#fce4c8';
    ctx.beginPath();
    ctx.arc(0, -27, 11, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1c1b22';
    if (isAttacking) {
      ctx.beginPath();
      ctx.moveTo(3, -29);
      ctx.lineTo(8, -26);
      ctx.lineTo(3, -26);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(5, -26, 2.5, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, -28, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 120, 140, 0.45)';
      ctx.beginPath();
      ctx.arc(6, -23, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Smile / Expression
    ctx.strokeStyle = '#c47d63';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(4, -22, 2.5, 0.1 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }

  drawPlayerHat(ctx, player) {
    if (player.job === '전사') {
      // Iron Horned Helmet
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(0, -32, 12, Math.PI, 0, false);
      ctx.lineTo(12, -26);
      ctx.lineTo(-12, -26);
      ctx.closePath();
      ctx.fill();
      // Golden Horns
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-11, -30);
      ctx.lineTo(-18, -38);
      ctx.lineTo(-10, -34);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(11, -30);
      ctx.lineTo(18, -38);
      ctx.lineTo(10, -34);
      ctx.fill();
    } else if (player.job === '마법사') {
      // Pointed Wizard Hat
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.moveTo(-14, -28);
      ctx.lineTo(0, -48);
      ctx.lineTo(14, -28);
      ctx.closePath();
      ctx.fill();
      // Brim
      ctx.beginPath();
      ctx.ellipse(0, -28, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Golden star
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, -36, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (player.job === '궁수') {
      // Green Feather Archer Cap
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.ellipse(0, -32, 13, 7, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Red Feather
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-6, -34);
      ctx.lineTo(-14, -45);
      ctx.lineTo(-4, -38);
      ctx.fill();
    } else if (player.job === '도적') {
      // Black Ninja Bandana & Mask
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-11, -34, 22, 6);
      // Face mask
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.roundRect(1, -25, 10, 8, 2);
      ctx.fill();
    } else {
      // Beginner Red Headband
      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(-11, -33, 22, 5);
      ctx.beginPath();
      ctx.moveTo(-11, -31);
      ctx.lineTo(-16, -28);
      ctx.lineTo(-15, -24);
      ctx.lineTo(-11, -28);
      ctx.fill();
    }
  }

  drawPlayerArmAndWeapon(ctx, player, isAttacking, isWalking, walkCycle) {
    if (isAttacking) {
      const swingProgress = 1 - (player.attackTimer / player.attackDuration);
      const angle = -Math.PI / 4 + swingProgress * (Math.PI * 0.9);

      ctx.save();
      ctx.translate(2, -15);
      ctx.rotate(angle);

      // Arm
      ctx.fillStyle = '#fce4c8';
      ctx.beginPath();
      ctx.roundRect(0, -3, 14, 6, 3);
      ctx.fill();

      // Weapon
      this.drawWeapon(ctx, player.weaponType || 'sword');
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = '#fce4c8';
      ctx.beginPath();
      ctx.arc(4, -13, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.translate(6, -13);
      ctx.rotate(Math.PI / 6 + (isWalking ? walkCycle * 0.15 : 0));
      this.drawWeapon(ctx, player.weaponType || 'sword');
      ctx.restore();
    }
  }

  drawWeapon(ctx, type) {
    if (type === 'dagger' || type === 'claw') {
      // Thief Claw / Dagger
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(0, -3, 10, 6);
      // Silver blade prongs
      ctx.fillStyle = '#e4e4e7';
      ctx.beginPath();
      ctx.moveTo(10, -5); ctx.lineTo(24, -3); ctx.lineTo(10, -1);
      ctx.moveTo(10, 1); ctx.lineTo(24, 3); ctx.lineTo(10, 5);
      ctx.fill();
    } else if (type === 'staff') {
      // Magician Arcane Staff
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, -2, 34, 4);
      // Glowing Crystal Orb
      const grad = ctx.createRadialGradient(34, 0, 1, 34, 0, 7);
      grad.addColorStop(0, '#c084fc');
      grad.addColorStop(1, '#7e22ce');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(34, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'bow') {
      // Archer Bow
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(10, 0, 18, -Math.PI / 2.3, Math.PI / 2.3);
      ctx.stroke();
      // Bow string
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(17, -16);
      ctx.lineTo(17, 16);
      ctx.stroke();
    } else {
      // Warrior Greatsword
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, -2, 8, 4);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(8, -8, 4, 16);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(12, -5);
      ctx.lineTo(38, -4);
      ctx.lineTo(44, 0);
      ctx.lineTo(38, 4);
      ctx.lineTo(12, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(14, -1, 26, 2);
    }
  }

  drawClimbingPlayer(ctx, player) {
    const climbCycle = Math.sin(Date.now() / 90);
    ctx.fillStyle = '#3a72b8';
    ctx.fillRect(-7, -19, 14, 14);

    ctx.fillStyle = '#2c406b';
    ctx.fillRect(-6, -6 + climbCycle * 3, 5, 6);
    ctx.fillRect(1, -6 - climbCycle * 3, 5, 6);

    ctx.fillStyle = '#5c3826';
    ctx.beginPath();
    ctx.arc(0, -27, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(-10, -33, 20, 5);

    ctx.fillStyle = '#fce4c8';
    ctx.fillRect(-12, -26 - climbCycle * 5, 5, 8);
    ctx.fillRect(7, -26 + climbCycle * 5, 5, 8);
  }

  drawTombstone(ctx, player) {
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.roundRect(-14, -28, 28, 28, [12, 12, 2, 2]);
    ctx.fill();
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('R.I.P', 0, -14);
    ctx.fillText(player.name || '모험가', 0, -5);

    const ghostY = -38 - Math.sin(Date.now() / 250) * 8;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(0, ghostY, 9, Math.PI, 0, false);
    ctx.lineTo(8, ghostY + 12);
    ctx.lineTo(3, ghostY + 8);
    ctx.lineTo(0, ghostY + 12);
    ctx.lineTo(-3, ghostY + 8);
    ctx.lineTo(-8, ghostY + 12);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, ghostY - 12, 6, 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- Draw Monster (Fixed: Text & HP Bar are NEVER inverted) ---
  drawMonster(ctx, m) {
    ctx.save();
    ctx.translate(m.x, m.y);

    // 1. Draw Monster Body with Facing Direction
    ctx.save();
    if (m.facing === 'right') {
      ctx.scale(-1, 1);
    }

    if (m.hitTimer > 0) {
      ctx.filter = 'brightness(2.2) contrast(1.2)';
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 2, m.width * 0.45, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (m.type) {
      case 'snail':
        this.drawSnail(ctx, m, '#27ae60', '#2ecc71');
        break;
      case 'blue_snail':
        this.drawSnail(ctx, m, '#2980b9', '#3498db');
        break;
      case 'red_snail':
        this.drawSnail(ctx, m, '#c0392b', '#e74c3c');
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
        this.drawSnail(ctx, m, '#27ae60', '#2ecc71');
    }
    ctx.restore(); // Restore body transformation!

    // 2. Draw HP Bar and Name Tag WITHOUT Direction Inversion!
    if (m.hp < m.maxHp && m.type !== 'mushmom') {
      const hpWidth = Math.max(28, m.width * 0.85);
      const hpPercent = Math.max(0, m.hp / m.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-hpWidth / 2, -m.height - 10, hpWidth, 5);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(-hpWidth / 2 + 1, -m.height - 9, (hpWidth - 2) * hpPercent, 3);
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

  drawSnail(ctx, m, shellDark, shellLight) {
    const bob = Math.sin(Date.now() / 120 + m.id) * 1.5;
    ctx.fillStyle = '#f4e29b';
    ctx.beginPath();
    ctx.ellipse(6, -6 + bob, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e6c875';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, -8 + bob);
    ctx.lineTo(16, -14 + bob);
    ctx.moveTo(10, -9 + bob);
    ctx.lineTo(13, -15 + bob);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(16, -15 + bob, 1.8, 0, Math.PI * 2);
    ctx.arc(13, -16 + bob, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = shellDark;
    ctx.beginPath();
    ctx.arc(-4, -13 + bob, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = shellLight;
    ctx.beginPath();
    ctx.arc(-4, -13 + bob, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = shellDark;
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

    const grad = ctx.createRadialGradient(-3, -15, 2, 0, -12, 18);
    grad.addColorStop(0, '#a3e635');
    grad.addColorStop(0.6, '#4ade80');
    grad.addColorStop(1, '#16a34a');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.bezierCurveTo(-18, -14, -12, -26, 0, -28);
    ctx.bezierCurveTo(12, -26, 18, -14, 16, -2);
    ctx.bezierCurveTo(10, 2, -10, 2, -16, -2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-5, -20, 5, 2.5, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

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

    ctx.fillStyle = 'rgba(255, 100, 150, 0.4)';
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
    ctx.fill();

    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(-6, -1, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -1, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(-3, -11, 2, 3.2, 0, 0, Math.PI * 2);
    ctx.ellipse(4, -11, 2, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(0, -22, 22, 15, 0, Math.PI, 0, false);
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
      ctx.fill();
    });

    ctx.restore();
  }

  drawRibbonPig(ctx, m) {
    const runCycle = Math.sin(Date.now() / 90 + m.id);
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(0, -14, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(12, -15, 10, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.ellipse(18, -13, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(13, -18, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f472b6';
    ctx.fillRect(-12 + runCycle * 4, -4, 4, 6);
    ctx.fillRect(-4 - runCycle * 4, -4, 4, 6);
    ctx.fillRect(4 + runCycle * 4, -4, 4, 6);
    ctx.fillRect(12 - runCycle * 4, -4, 4, 6);

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(5, -17, 3, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(5, -17, 3, 5, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGreenMushroom(ctx, m) {
    const hop = Math.abs(Math.sin(Date.now() / 150 + m.id)) * 4;
    ctx.save();
    ctx.translate(0, -hop);

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, -11, 12, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(0, -25, 25, 17, 0, Math.PI, 0, false);
    ctx.fill();

    ctx.fillStyle = '#bbf7d0';
    [
      { x: -14, y: -27, r: 3.5 },
      { x: 0, y: -34, r: 4 },
      { x: 14, y: -28, r: 3.2 }
    ].forEach(dot => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  drawMushmom(ctx, m) {
    const hop = Math.abs(Math.sin(Date.now() / 200 + m.id)) * 8;
    ctx.save();
    ctx.translate(0, -hop);
    const scale = 2.4;
    ctx.scale(scale, scale);

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, -12, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(-7, -18); ctx.lineTo(-2, -14); ctx.lineTo(-7, -12); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7, -18); ctx.lineTo(2, -14); ctx.lineTo(7, -12); ctx.fill();

    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-18, -25, 36, 5);

    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.ellipse(0, -32, 28, 20, 0, Math.PI, 0, false);
    ctx.fill();

    ctx.restore();
  }

  // --- Draw Projectiles (Arrow, Shuriken, Energy Bolt) ---
  drawProjectile(ctx, proj) {
    ctx.save();
    ctx.translate(proj.x, proj.y);

    if (proj.type === 'arrow') {
      // Archer Arrow
      const angle = Math.atan2(proj.vy, proj.vx);
      ctx.rotate(angle);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-16, -1.5, 32, 3);
      // Arrowhead
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(16, -4); ctx.lineTo(22, 0); ctx.lineTo(16, 4);
      ctx.fill();
      // Fletching
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-16, -4); ctx.lineTo(-10, 0); ctx.lineTo(-16, 4);
      ctx.fill();
    } else if (proj.type === 'shuriken') {
      // Thief Throwing Star (Spinning Subi/Ilbi)
      const rot = (Date.now() / 30) % (Math.PI * 2);
      ctx.rotate(rot);
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -10); ctx.lineTo(3, 0); ctx.lineTo(0, 3); ctx.lineTo(-3, 0);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.type === 'energy_bolt') {
      // Magician Arcane Bolt
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

  // --- Draw Drops ---
  drawDrop(ctx, drop) {
    ctx.save();
    ctx.translate(drop.x, drop.y);
    const bob = Math.sin(Date.now() / 150 + drop.id) * 2;
    ctx.translate(0, bob);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 4 - bob, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (drop.type === 'meso') {
      if (drop.amount >= 100) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.ellipse(0, -4, 9, 8, 0, 0, Math.PI * 2);
        ctx.fill();
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
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(0, -4, 4.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (drop.type === 'red_potion') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -3, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-2, -10, 4, 3);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-3, -13, 6, 3);
    } else if (drop.type === 'blue_potion') {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(0, -3, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-2, -10, 4, 3);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-3, -13, 6, 3);
    } else {
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.roundRect(-7, -11, 14, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('★', 0, -1);
    }

    ctx.restore();
  }

  // --- Draw Floating Damage & Text ---
  drawFloatingText(ctx, ft) {
    ctx.save();
    ctx.translate(ft.x, ft.y);
    ctx.globalAlpha = Math.max(0, Math.min(1, ft.life));

    if (ft.type === 'damage') {
      ctx.font = 'bold 18px "Impact", "Arial Black", sans-serif';
      ctx.textAlign = 'center';

      if (ft.isCrit) {
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 4;
        ctx.strokeText(ft.text, 0, 0);
        ctx.fillStyle = '#facc15';
        ctx.fillText(ft.text, 0, 0);

        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText('CRITICAL', 0, -16);
        ctx.fillText('CRITICAL', 0, -16);
      } else {
        ctx.strokeStyle = '#4c1d95';
        ctx.lineWidth = 3.5;
        ctx.strokeText(ft.text, 0, 0);
        ctx.fillStyle = '#f472b6';
        ctx.fillText(ft.text, 0, 0);
      }
    } else if (ft.type === 'miss') {
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

  // --- Draw Skills & Visual FX ---
  drawSkillEffects(ctx, fx) {
    ctx.save();
    ctx.translate(fx.x, fx.y);

    if (fx.type === 'power_strike') {
      const progress = fx.progress;
      ctx.save();
      ctx.rotate((progress - 0.5) * Math.PI * 0.4);
      ctx.fillStyle = 'rgba(250, 204, 21, ' + (1 - progress) + ')';
      ctx.beginPath();
      ctx.moveTo(-15, -90);
      ctx.lineTo(25, -90);
      ctx.lineTo(15, 20);
      ctx.lineTo(-5, 20);
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
      ctx.moveTo(-20, -50 + progress * 60);
      ctx.lineTo(10, 10);
      ctx.moveTo(0, -60 + progress * 60);
      ctx.lineTo(30, 0);
      ctx.stroke();
      ctx.restore();
    } else if (fx.type === 'lucky_seven') {
      // 2 Golden Stars burst
      const progress = fx.progress;
      ctx.save();
      ctx.rotate(progress * Math.PI * 6);
      ctx.fillStyle = 'rgba(250, 204, 21, ' + (1 - progress) + ')';
      ctx.beginPath();
      ctx.arc(0, 0, 18 * (1 - progress), 0, Math.PI * 2);
      ctx.fill();
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
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-35, -40, -75, -20, -70, 20);
      ctx.bezierCurveTo(-50, 15, -25, 20, 0, 10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(35, -40, 75, -20, 70, 20);
      ctx.bezierCurveTo(50, 15, 25, 20, 0, 10);
      ctx.fill();

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
