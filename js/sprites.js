// js/sprites.js - Canvas Vector/Sprite Graphics Engine for Classic MapleStory

class SpriteRenderer {
  constructor() {
    this.cache = {};
  }

  // --- Draw Player ---
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

    // === Back Arm / Weapon behind body if idle/walk ===
    if (!isAttacking) {
      ctx.save();
      ctx.fillStyle = '#f6cfa6';
      ctx.beginPath();
      ctx.arc(-8, -14, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // === Legs & Shoes ===
    ctx.fillStyle = '#2c406b'; // Pants
    if (isJumping) {
      // Jump legs
      ctx.fillRect(-6, -6, 5, 6);
      ctx.fillRect(1, -7, 5, 5);
      // Shoes (classic brown leather shoes)
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-8, 0, 7, 4);
      ctx.fillRect(0, -2, 7, 4);
    } else if (isWalking) {
      // Walking legs
      ctx.fillRect(-6 + walkCycle * 3, -6, 5, 6);
      ctx.fillRect(1 - walkCycle * 3, -6, 5, 6);
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-8 + walkCycle * 3, 0, 7, 4);
      ctx.fillRect(0 - walkCycle * 3, 0, 7, 4);
    } else {
      // Standing legs
      ctx.fillRect(-5, -6, 4, 6);
      ctx.fillRect(1, -6, 4, 6);
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-7, 0, 6, 4);
      ctx.fillRect(1, 0, 6, 4);
    }

    // === Torso & Shirt ===
    ctx.fillStyle = '#eef1f6'; // Classic white/blue beginner shirt
    ctx.beginPath();
    ctx.roundRect(-7, -19, 14, 14, 3);
    ctx.fill();
    // Blue collar/stripe
    ctx.fillStyle = '#3a72b8';
    ctx.fillRect(-7, -19, 14, 4);
    ctx.fillRect(-2, -15, 4, 10);

    // === Head & Face ===
    ctx.fillStyle = '#fce4c8'; // Skin tone
    ctx.beginPath();
    ctx.arc(0, -27, 11, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1c1b22';
    if (isAttacking) {
      // Determined fighting eye
      ctx.beginPath();
      ctx.moveTo(3, -29);
      ctx.lineTo(8, -26);
      ctx.lineTo(3, -26);
      ctx.fill();
    } else {
      // Cute anime maple eye
      ctx.beginPath();
      ctx.ellipse(5, -26, 2.5, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eye highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, -28, 1.2, 0, Math.PI * 2);
      ctx.fill();
      // Cheeks (blush)
      ctx.fillStyle = 'rgba(255, 120, 140, 0.45)';
      ctx.beginPath();
      ctx.arc(6, -23, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Classic Smile / Expression
    ctx.strokeStyle = '#c47d63';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(4, -22, 2.5, 0.1 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    // === Hair (Classic brown spike/bob) ===
    ctx.fillStyle = '#5c3826';
    ctx.beginPath();
    ctx.arc(-2, -31, 11, Math.PI, 0, false);
    ctx.lineTo(10, -28);
    ctx.lineTo(7, -23);
    ctx.lineTo(1, -29);
    ctx.lineTo(-4, -22);
    ctx.lineTo(-12, -26);
    ctx.closePath();
    ctx.fill();

    // Sideburn & bangs
    ctx.beginPath();
    ctx.moveTo(-11, -27);
    ctx.lineTo(-7, -20);
    ctx.lineTo(-4, -25);
    ctx.lineTo(1, -21);
    ctx.lineTo(4, -27);
    ctx.fill();

    // Classic Maple Bandana / Red Headband
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(-11, -33, 22, 5);
    // Bandana knot at back
    ctx.beginPath();
    ctx.moveTo(-11, -31);
    ctx.lineTo(-16, -28);
    ctx.lineTo(-15, -24);
    ctx.lineTo(-11, -28);
    ctx.fill();

    // === Front Arm & Weapon ===
    if (isAttacking) {
      // Attack Swing Animation
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

      // Weapon (Classic Wooden Sword / Broad Dagger)
      this.drawWeapon(ctx, player.weaponType || 'sword');

      ctx.restore();
    } else {
      // Idle / Walking arm holding weapon
      ctx.save();
      ctx.fillStyle = '#fce4c8';
      ctx.beginPath();
      ctx.arc(4, -13, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Weapon resting at side
      ctx.translate(6, -13);
      ctx.rotate(Math.PI / 6 + (isWalking ? walkCycle * 0.15 : 0));
      this.drawWeapon(ctx, player.weaponType || 'sword');
      ctx.restore();
    }

    ctx.restore();
  }

  // Draw Ladder Climbing Player (Back view)
  drawClimbingPlayer(ctx, player) {
    const climbCycle = Math.sin(Date.now() / 90);
    // Body (back)
    ctx.fillStyle = '#3a72b8';
    ctx.fillRect(-7, -19, 14, 14);

    // Pants & legs alternating
    ctx.fillStyle = '#2c406b';
    ctx.fillRect(-6, -6 + climbCycle * 3, 5, 6);
    ctx.fillRect(1, -6 - climbCycle * 3, 5, 6);

    // Head (back hair)
    ctx.fillStyle = '#5c3826';
    ctx.beginPath();
    ctx.arc(0, -27, 11, 0, Math.PI * 2);
    ctx.fill();

    // Red bandana back
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(-10, -33, 20, 5);
    // Bandana knot
    ctx.beginPath();
    ctx.arc(0, -28, 3, 0, Math.PI * 2);
    ctx.fill();

    // Arms holding ladder
    ctx.fillStyle = '#fce4c8';
    ctx.fillRect(-12, -26 - climbCycle * 5, 5, 8);
    ctx.fillRect(7, -26 + climbCycle * 5, 5, 8);
  }

  // Draw Weapon
  drawWeapon(ctx, type) {
    if (type === 'dagger') {
      // Dagger
      ctx.fillStyle = '#5a3825';
      ctx.fillRect(0, -2, 6, 4); // Handle
      ctx.fillStyle = '#dcdde1';
      ctx.beginPath();
      ctx.moveTo(6, -3);
      ctx.lineTo(20, -1);
      ctx.lineTo(22, 0);
      ctx.lineTo(20, 1);
      ctx.lineTo(6, 3);
      ctx.fill();
    } else if (type === 'staff') {
      // Magic Staff
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(0, -2, 32, 4);
      // Gem at tip
      ctx.fillStyle = '#9b59b6';
      ctx.beginPath();
      ctx.arc(33, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Classic Wooden Sword / Steel Sword
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(0, -2, 7, 4); // Wooden hilt
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(7, -6, 3, 12); // Gold guard
      ctx.fillStyle = '#ecf0f1'; // Silver steel blade
      ctx.beginPath();
      ctx.moveTo(10, -4);
      ctx.lineTo(34, -3);
      ctx.lineTo(40, 0);
      ctx.lineTo(34, 3);
      ctx.lineTo(10, 4);
      ctx.closePath();
      ctx.fill();
      // Blade highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, -1, 24, 2);
    }
  }

  // Draw Tombstone on Death
  drawTombstone(ctx, player) {
    // Tombstone
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.roundRect(-14, -28, 28, 28, [12, 12, 2, 2]);
    ctx.fill();
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // "R.I.P" text
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('R.I.P', 0, -14);
    ctx.fillText(player.name || '초보자', 0, -5);

    // Floating Maple Ghost
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

    // Halo
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, ghostY - 12, 6, 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- Draw Monsters ---

  drawMonster(ctx, m) {
    ctx.save();
    ctx.translate(m.x, m.y);

    if (m.facing === 'right') {
      ctx.scale(-1, 1);
    }

    // Hit flash
    if (m.hitTimer > 0) {
      ctx.filter = 'brightness(2.2) contrast(1.2)';
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 2, m.width * 0.45, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const animCycle = Math.sin(Date.now() / 150 + m.id);

    switch (m.type) {
      case 'snail':
        this.drawSnail(ctx, m, '#27ae60', '#2ecc71'); // Green
        break;
      case 'blue_snail':
        this.drawSnail(ctx, m, '#2980b9', '#3498db'); // Blue
        break;
      case 'red_snail':
        this.drawSnail(ctx, m, '#c0392b', '#e74c3c'); // Red
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

    // Reset filter
    ctx.filter = 'none';

    // Draw HP Bar over Monster
    if (m.hp < m.maxHp && m.type !== 'mushmom') {
      const hpWidth = Math.max(26, m.width * 0.8);
      const hpPercent = Math.max(0, m.hp / m.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-hpWidth / 2, -m.height - 10, hpWidth, 5);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(-hpWidth / 2 + 1, -m.height - 9, (hpWidth - 2) * hpPercent, 3);
    }

    // Draw Monster Name & Level
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

  // 1. Snail (달팽이)
  drawSnail(ctx, m, shellDark, shellLight) {
    const bob = Math.sin(Date.now() / 120 + m.id) * 1.5;
    // Snail body (yellowish flesh)
    ctx.fillStyle = '#f4e29b';
    ctx.beginPath();
    ctx.ellipse(6, -6 + bob, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snail eye stalks
    ctx.strokeStyle = '#e6c875';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, -8 + bob);
    ctx.lineTo(16, -14 + bob);
    ctx.moveTo(10, -9 + bob);
    ctx.lineTo(13, -15 + bob);
    ctx.stroke();

    // Snail eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(16, -15 + bob, 1.8, 0, Math.PI * 2);
    ctx.arc(13, -16 + bob, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Snail Shell (spiral)
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

  // 2. Slime (슬라임)
  drawSlime(ctx, m) {
    const bounce = Math.abs(Math.sin(Date.now() / 140 + m.id));
    const stretchY = 1 + bounce * 0.25;
    const stretchX = 1 - bounce * 0.15;

    ctx.save();
    ctx.translate(0, 0);
    ctx.scale(stretchX, stretchY);

    // Slime Body (Translucent gradient green blob)
    const grad = ctx.createRadialGradient(-3, -15, 2, 0, -12, 18);
    grad.addColorStop(0, '#a3e635');
    grad.addColorStop(0.6, '#4ade80');
    grad.addColorStop(1, '#16a34a');

    ctx.fillStyle = grad;
    ctx.beginPath();
    // Droplet curved blob
    ctx.moveTo(-16, -2);
    ctx.bezierCurveTo(-18, -14, -12, -26, 0, -28);
    ctx.bezierCurveTo(12, -26, 18, -14, 16, -2);
    ctx.bezierCurveTo(10, 2, -10, 2, -16, -2);
    ctx.closePath();
    ctx.fill();

    // Translucent shine highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-5, -20, 5, 2.5, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Cute smiling eyes & mouth
    ctx.fillStyle = '#0f291e';
    ctx.beginPath();
    ctx.ellipse(-4, -12, 2.2, 3.2, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -12, 2.2, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye sparkles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -13.5, 1, 0, Math.PI * 2);
    ctx.arc(6, -13.5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Cute blush
    ctx.fillStyle = 'rgba(255, 100, 150, 0.4)';
    ctx.beginPath();
    ctx.arc(-8, -9, 2.5, 0, Math.PI * 2);
    ctx.arc(10, -9, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 3. Orange Mushroom (주황버섯)
  drawOrangeMushroom(ctx, m) {
    const hop = Math.abs(Math.sin(Date.now() / 160 + m.id)) * 5;
    ctx.save();
    ctx.translate(0, -hop);

    // Stalk / Body
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, -10, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(-6, -1, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -1, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(-3, -11, 2, 3.2, 0, 0, Math.PI * 2);
    ctx.ellipse(4, -11, 2, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3, -12.5, 1, 0, Math.PI * 2);
    ctx.arc(4, -12.5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Iconic Orange Cap
    ctx.fillStyle = '#ea580c'; // Vibrant orange
    ctx.beginPath();
    ctx.ellipse(0, -22, 22, 15, 0, Math.PI, 0, false);
    ctx.fill();

    // White polka dots
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

    // Cap rim shade
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, -22);
    ctx.lineTo(22, -22);
    ctx.stroke();

    ctx.restore();
  }

  // 4. Ribbon Pig (리본돼지)
  drawRibbonPig(ctx, m) {
    const runCycle = Math.sin(Date.now() / 90 + m.id);
    // Pig Body
    ctx.fillStyle = '#fbcfe8'; // Pink
    ctx.beginPath();
    ctx.ellipse(0, -14, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(12, -15, 10, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pig Snout
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.ellipse(18, -13, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#831843';
    ctx.fillRect(17, -14, 1.5, 2.5);
    ctx.fillRect(20, -14, 1.5, 2.5);

    // Eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(13, -18, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(13.5, -18.5, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Ear
    ctx.fillStyle = '#db2777';
    ctx.beginPath();
    ctx.moveTo(8, -22);
    ctx.lineTo(13, -26);
    ctx.lineTo(12, -20);
    ctx.closePath();
    ctx.fill();

    // Legs
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(-12 + runCycle * 4, -4, 4, 6);
    ctx.fillRect(-4 - runCycle * 4, -4, 4, 6);
    ctx.fillRect(4 + runCycle * 4, -4, 4, 6);
    ctx.fillRect(12 - runCycle * 4, -4, 4, 6);

    // Red Ribbon tied at neck!
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(5, -17, 3, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(5, -17, 3, 5, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24'; // Ribbon knot
    ctx.beginPath();
    ctx.arc(5, -17, 2, 0, Math.PI * 2);
    ctx.fill();

    // Curly tail
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-18, -16, 4, 0, Math.PI * 1.5);
    ctx.stroke();
  }

  // 5. Green Mushroom (초록버섯)
  drawGreenMushroom(ctx, m) {
    const hop = Math.abs(Math.sin(Date.now() / 150 + m.id)) * 4;
    ctx.save();
    ctx.translate(0, -hop);

    // Body
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, -11, 12, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(-7, -2, 6, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -2, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(-4, -12, 2.2, 3.5, 0, 0, Math.PI * 2);
    ctx.ellipse(5, -12, 2.2, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Green Cap
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(0, -25, 25, 17, 0, Math.PI, 0, false);
    ctx.fill();

    // Polka dots
    ctx.fillStyle = '#bbf7d0';
    [
      { x: -14, y: -27, r: 3.5 },
      { x: 0, y: -34, r: 4 },
      { x: 14, y: -28, r: 3.2 },
      { x: -6, y: -25, r: 2.2 },
      { x: 7, y: -25, r: 2.5 }
    ].forEach(dot => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // 6. Mushmom (머쉬맘 - Boss Monster)
  drawMushmom(ctx, m) {
    const hop = Math.abs(Math.sin(Date.now() / 200 + m.id)) * 8;
    ctx.save();
    ctx.translate(0, -hop);

    const scale = 2.4;
    ctx.scale(scale, scale);

    // Stalk
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, -12, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(-9, -2, 8, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(9, -2, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Angry boss eyes
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(-7, -18);
    ctx.lineTo(-2, -14);
    ctx.lineTo(-7, -12);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(7, -18);
    ctx.lineTo(2, -14);
    ctx.lineTo(7, -12);
    ctx.closePath();
    ctx.fill();

    // Red Headband with spikes
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-18, -25, 36, 5);

    // Giant Mushroom Cap
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.ellipse(0, -32, 28, 20, 0, Math.PI, 0, false);
    ctx.fill();

    // Spots
    ctx.fillStyle = '#fef08a';
    [
      { x: -16, y: -35, r: 4.5 },
      { x: 0, y: -43, r: 5 },
      { x: 16, y: -36, r: 4 },
      { x: -8, y: -31, r: 3 },
      { x: 8, y: -31, r: 3 }
    ].forEach(dot => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // --- Draw Dropped Items / Mesos ---
  drawDrop(ctx, drop) {
    ctx.save();
    ctx.translate(drop.x, drop.y);

    // Floating bob
    const bob = Math.sin(Date.now() / 150 + drop.id) * 2;
    ctx.translate(0, bob);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 4 - bob, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (drop.type === 'meso') {
      if (drop.amount >= 100) {
        // Meso pouch (money bag)
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.ellipse(0, -4, 9, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Red tie
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-5, -11, 10, 3);
        // Frill top
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-6, -11);
        ctx.lineTo(-7, -15);
        ctx.lineTo(0, -13);
        ctx.lineTo(7, -15);
        ctx.lineTo(6, -11);
        ctx.fill();
        // "$" / "M" symbol
        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('M', 0, -1);
      } else {
        // Gold Coin
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
      // Red potion bottle
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -3, 6, 0, Math.PI * 2);
      ctx.fill();
      // Neck & Cork
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-2, -10, 4, 3);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-3, -13, 6, 3);
      // Shine
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2, -5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (drop.type === 'blue_potion') {
      // Blue potion bottle
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(0, -3, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-2, -10, 4, 3);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-3, -13, 6, 3);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2, -5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // General monster etc / equipment drop
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
      // Iconic Maple multi-digit bouncy font
      ctx.font = 'bold 18px "Impact", "Arial Black", sans-serif';
      ctx.textAlign = 'center';

      if (ft.isCrit) {
        // Critical Hit (Orange/Yellow gradient effect)
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 4;
        ctx.strokeText(ft.text, 0, 0);
        ctx.fillStyle = '#facc15';
        ctx.fillText(ft.text, 0, 0);

        // "CRITICAL" tiny text above
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText('CRITICAL', 0, -16);
        ctx.fillText('CRITICAL', 0, -16);
      } else {
        // Normal Hit (Purple/Pink/White)
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
      // Giant golden anime sword smash
      const progress = fx.progress; // 0 to 1
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

      // Golden sparks
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    } else if (fx.type === 'slash_blast') {
      // 360-degree whirlwind blades
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
      // Twin Arcane Claws
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
    } else if (fx.type === 'level_up') {
      // Glorious Level Up Pillar of Light & Wings
      const p = fx.progress;
      const alpha = 1 - p;

      // Golden Beam
      const grad = ctx.createLinearGradient(0, -200, 0, 20);
      grad.addColorStop(0, `rgba(254, 240, 138, 0)`);
      grad.addColorStop(0.5, `rgba(253, 224, 71, ${0.75 * alpha})`);
      grad.addColorStop(1, `rgba(234, 179, 8, ${0.9 * alpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(-28, -200, 56, 220);

      // Angelic Wings
      ctx.save();
      ctx.translate(0, -70);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * alpha})`;
      // Left Wing
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-35, -40, -75, -20, -70, 20);
      ctx.bezierCurveTo(-50, 15, -25, 20, 0, 10);
      ctx.fill();
      // Right Wing
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(35, -40, 75, -20, 70, 20);
      ctx.bezierCurveTo(50, 15, 25, 20, 0, 10);
      ctx.fill();

      // "LEVEL UP!" Retro 3D Text
      ctx.font = 'bold 22px "Arial Black", Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = `rgba(180, 83, 9, ${alpha})`;
      ctx.lineWidth = 6;
      ctx.strokeText('LEVEL UP!', 0, -20 - p * 20);
      ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
      ctx.fillText('LEVEL UP!', 0, -20 - p * 20);
      ctx.restore();

      // Sparkling particles
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + p * 4;
        const dist = 30 + p * 50;
        const px = Math.cos(angle) * dist;
        const py = -80 + Math.sin(angle) * dist * 0.4;
        ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

window.sprites = new SpriteRenderer();
