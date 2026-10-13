// js/map.js - Henesys Hunting Ground 1 (헤네시스 사냥터 1) Map Engine

class GameMap {
  constructor() {
    this.name = '헤네시스 사냥터 1 (Henesys Hunting Ground 1)';
    this.width = 2400;
    this.height = 950;

    // Platform definitions: { x, y, width, height, canDropThrough }
    this.platforms = [
      // Ground floor (Cannot drop through)
      { x: 0, y: 820, width: 2400, height: 130, canDropThrough: false, type: 'ground' },

      // Lower Level Tiers (Tiers 1)
      { x: 120, y: 700, width: 380, height: 18, canDropThrough: true, type: 'grass' },
      { x: 580, y: 680, width: 440, height: 18, canDropThrough: true, type: 'grass' },
      { x: 1100, y: 700, width: 400, height: 18, canDropThrough: true, type: 'grass' },
      { x: 1600, y: 680, width: 450, height: 18, canDropThrough: true, type: 'grass' },

      // Mid Level Tiers (Tiers 2)
      { x: 260, y: 550, width: 320, height: 18, canDropThrough: true, type: 'grass' },
      { x: 740, y: 530, width: 420, height: 18, canDropThrough: true, type: 'grass' },
      { x: 1300, y: 540, width: 360, height: 18, canDropThrough: true, type: 'grass' },
      { x: 1780, y: 520, width: 380, height: 18, canDropThrough: true, type: 'grass' },

      // High Level Tiers (Tiers 3)
      { x: 450, y: 400, width: 340, height: 18, canDropThrough: true, type: 'wood' },
      { x: 950, y: 380, width: 400, height: 18, canDropThrough: true, type: 'wood' },
      { x: 1480, y: 390, width: 340, height: 18, canDropThrough: true, type: 'wood' },

      // Top Peak / Boss Shrine Area (Tier 4)
      { x: 780, y: 250, width: 480, height: 20, canDropThrough: true, type: 'shrine' }
    ];

    // Ladders and Ropes: { x, top, bottom, type: 'ladder'|'rope' }
    this.ladders = [
      { x: 300, top: 700, bottom: 820, type: 'ladder' },
      { x: 780, top: 680, bottom: 820, type: 'rope' },
      { x: 1320, top: 700, bottom: 820, type: 'ladder' },
      { x: 1800, top: 680, bottom: 820, type: 'rope' },

      { x: 420, top: 550, bottom: 700, type: 'rope' },
      { x: 920, top: 530, bottom: 680, type: 'ladder' },
      { x: 1460, top: 540, bottom: 700, type: 'rope' },
      { x: 1940, top: 520, bottom: 680, type: 'ladder' },

      { x: 620, top: 400, bottom: 550, type: 'ladder' },
      { x: 1140, top: 380, bottom: 530, type: 'rope' },
      { x: 1650, top: 390, bottom: 540, type: 'ladder' },

      { x: 1020, top: 250, bottom: 380, type: 'ladder' }
    ];

    // Portals: { x, y, targetX, targetY, label }
    this.portals = [
      { x: 80, y: 820, targetX: 2300, targetY: 820, label: '마을 (Town)' },
      { x: 2320, y: 820, targetX: 100, targetY: 820, label: '깊은 숲 (Deep Forest)' }
    ];

    // Wooden Signs
    this.signs = [
      { x: 180, y: 820, text: '헤네시스 사냥터 1' },
      { x: 1020, y: 250, text: '★ 버섯동산 정상 ★' },
      { x: 1700, y: 820, text: '위험! 주황버섯 출현' }
    ];

    // Clouds
    this.clouds = [
      { x: 200, y: 90, speed: 0.15, size: 70 },
      { x: 800, y: 60, speed: 0.25, size: 90 },
      { x: 1400, y: 110, speed: 0.18, size: 80 },
      { x: 2000, y: 75, speed: 0.22, size: 85 }
    ];

    // Scenery Background Trees & Houses
    this.scenery = [
      { x: 240, y: 820, type: 'tree' },
      { x: 650, y: 820, type: 'mushroom_house' },
      { x: 1200, y: 820, type: 'tree' },
      { x: 1550, y: 820, type: 'windmill' },
      { x: 2100, y: 820, type: 'tree' }
    ];
  }

  update(dt) {
    // Animate clouds
    this.clouds.forEach(c => {
      c.x += c.speed;
      if (c.x > this.width + 100) c.x = -150;
    });
  }

  draw(ctx, camera) {
    // 1. Sky & Backdrop (Parallax)
    this.drawSkyAndBackdrop(ctx, camera);

    // 2. Scenery behind platforms
    this.drawScenery(ctx, camera);

    // 3. Ladders & Ropes
    this.drawLadders(ctx);

    // 4. Platforms & Ground
    this.drawPlatforms(ctx);

    // 5. Portals & Signs
    this.drawPortals(ctx);
    this.drawSigns(ctx);
  }

  drawSkyAndBackdrop(ctx, camera) {
    // Beautiful vibrant blue sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#56b8f5');
    skyGrad.addColorStop(0.5, '#99d9ea');
    skyGrad.addColorStop(1, '#dff3fc');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Sun with gentle rays
    ctx.fillStyle = 'rgba(255, 245, 180, 0.4)';
    ctx.beginPath();
    ctx.arc(400, 160, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffae0';
    ctx.beginPath();
    ctx.arc(400, 160, 45, 0, Math.PI * 2);
    ctx.fill();

    // Drifting Fluffy Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    this.clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size * 0.4, 0, Math.PI * 2);
      ctx.arc(c.x + c.size * 0.35, c.y - c.size * 0.15, c.size * 0.35, 0, Math.PI * 2);
      ctx.arc(c.x + c.size * 0.7, c.y, c.size * 0.4, 0, Math.PI * 2);
      ctx.arc(c.x + c.size * 0.35, c.y + c.size * 0.1, c.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Distant Green Mountains (Parallax 0.3)
    const pxOffset = camera.x * 0.3;
    ctx.fillStyle = '#9bd084';
    ctx.beginPath();
    ctx.moveTo(0, 750);
    for (let x = 0; x <= this.width; x += 300) {
      const peakY = 480 + Math.sin(x * 0.005 + pxOffset * 0.002) * 90;
      ctx.quadraticCurveTo(x + 150, peakY, x + 300, 750);
    }
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fill();

    // Midground Rolling Hills
    ctx.fillStyle = '#7ac067';
    ctx.beginPath();
    ctx.moveTo(0, 800);
    for (let x = 0; x <= this.width; x += 220) {
      const peakY = 600 + Math.sin(x * 0.008) * 70;
      ctx.quadraticCurveTo(x + 110, peakY, x + 220, 800);
    }
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fill();
  }

  drawScenery(ctx) {
    this.scenery.forEach(item => {
      ctx.save();
      ctx.translate(item.x, item.y);

      if (item.type === 'tree') {
        // Maple Tree (Thick trunk, lush multi-layered leaves)
        ctx.fillStyle = '#6b4226';
        ctx.fillRect(-12, -130, 24, 130);
        // Tree roots
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-24, 0);
        ctx.lineTo(-12, -20);
        ctx.moveTo(12, 0);
        ctx.lineTo(24, 0);
        ctx.lineTo(12, -20);
        ctx.fill();

        // Lush Green Canopy
        ctx.fillStyle = '#489b37';
        ctx.beginPath();
        ctx.arc(0, -150, 55, 0, Math.PI * 2);
        ctx.arc(-35, -130, 42, 0, Math.PI * 2);
        ctx.arc(35, -130, 42, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#5fb34c';
        ctx.beginPath();
        ctx.arc(-10, -160, 36, 0, Math.PI * 2);
        ctx.arc(20, -145, 30, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'mushroom_house') {
        // Classic Henesys Mushroom House
        // House wall
        ctx.fillStyle = '#fce4c8';
        ctx.beginPath();
        ctx.roundRect(-45, -70, 90, 70, 8);
        ctx.fill();
        // Wooden door
        ctx.fillStyle = '#8b5a2b';
        ctx.beginPath();
        ctx.roundRect(-14, -45, 28, 45, [14, 14, 0, 0]);
        ctx.fill();
        // Doorknob
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(8, -20, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Windows
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(-26, -35, 10, 0, Math.PI * 2);
        ctx.arc(26, -35, 10, 0, Math.PI * 2);
        ctx.fill();

        // Orange Mushroom Roof
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(0, -75, 60, 40, 0, Math.PI, 0, false);
        ctx.fill();
        // Roof dots
        ctx.fillStyle = '#ffffff';
        [-35, 0, 35].forEach((x, i) => {
          ctx.beginPath();
          ctx.arc(x, -85 - (i === 1 ? 15 : 0), 8, 0, Math.PI * 2);
          ctx.fill();
        });
        // Chimney
        ctx.fillStyle = '#78350f';
        ctx.fillRect(25, -115, 14, 25);
      } else if (item.type === 'windmill') {
        // Henesys Windmill
        ctx.fillStyle = '#f5f5f4';
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.lineTo(-18, -140);
        ctx.lineTo(18, -140);
        ctx.lineTo(30, 0);
        ctx.closePath();
        ctx.fill();

        // Cone roof
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-24, -140);
        ctx.lineTo(0, -180);
        ctx.lineTo(24, -140);
        ctx.closePath();
        ctx.fill();

        // Rotating blades
        const rot = (Date.now() / 1200) % (Math.PI * 2);
        ctx.save();
        ctx.translate(0, -140);
        ctx.rotate(rot);
        ctx.fillStyle = '#78350f';
        for (let b = 0; b < 4; b++) {
          ctx.rotate(Math.PI / 2);
          ctx.fillRect(-4, -65, 8, 65);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-12, -60, 24, 45);
          ctx.fillStyle = '#78350f';
        }
        ctx.restore();
      }

      ctx.restore();
    });
  }

  drawLadders(ctx) {
    this.ladders.forEach(lad => {
      const height = lad.bottom - lad.top;
      if (lad.type === 'ladder') {
        // Classic Wooden Ladder
        ctx.fillStyle = '#8b5a2b';
        // Side rails
        ctx.fillRect(lad.x - 12, lad.top, 5, height);
        ctx.fillRect(lad.x + 7, lad.top, 5, height);
        // Steps
        const stepDist = 18;
        ctx.fillStyle = '#d4a373';
        for (let y = lad.top + 10; y < lad.bottom; y += stepDist) {
          ctx.fillRect(lad.x - 10, y, 20, 4);
        }
      } else {
        // Hanging Vine / Rope
        ctx.strokeStyle = '#2d6a4f';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lad.x, lad.top);
        for (let y = lad.top; y <= lad.bottom; y += 16) {
          const wave = Math.sin(y * 0.1) * 2;
          ctx.lineTo(lad.x + wave, y);
        }
        ctx.stroke();

        // Little leaves on rope
        ctx.fillStyle = '#52b788';
        for (let y = lad.top + 20; y < lad.bottom; y += 36) {
          ctx.beginPath();
          ctx.ellipse(lad.x + 6, y, 6, 3, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }

  drawPlatforms(ctx) {
    this.platforms.forEach(p => {
      if (p.type === 'ground') {
        // Main Ground: Lush grass top, rich brown soil underneath
        // Grass layer
        ctx.fillStyle = '#489b37';
        ctx.fillRect(p.x, p.y, p.width, 24);

        // Grass blades detail
        ctx.fillStyle = '#5eb84a';
        for (let x = p.x; x < p.x + p.width; x += 12) {
          ctx.beginPath();
          ctx.moveTo(x, p.y);
          ctx.lineTo(x + 5, p.y - 6);
          ctx.lineTo(x + 10, p.y);
          ctx.fill();
        }

        // Earth / Soil
        ctx.fillStyle = '#654321';
        ctx.fillRect(p.x, p.y + 24, p.width, p.height - 24);

        // Stones in dirt
        ctx.fillStyle = '#8b5a2b';
        for (let x = p.x + 20; x < p.x + p.width; x += 80) {
          ctx.beginPath();
          ctx.ellipse(x, p.y + 50, 14, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === 'shrine') {
        // Stone / Ancient Boss Platform
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 6);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(p.x + 4, p.y + 2, p.width - 8, 4);

        // Golden Shrine Runes
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('❖  M U S H M O M   S H R I N E  ❖', p.x + p.width / 2, p.y + 14);
      } else {
        // Floating Wooden & Grass Platforms
        // Platform body
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 4);
        ctx.fill();

        // Grass topper
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(p.x, p.y, p.width, 6);

        // Hanging vines / wood posts
        ctx.fillStyle = '#92400e';
        ctx.fillRect(p.x + 15, p.y + p.height, 6, 12);
        ctx.fillRect(p.x + p.width - 21, p.y + p.height, 6, 12);

        // Grass edge frills
        ctx.fillStyle = '#22c55e';
        for (let x = p.x + 4; x < p.x + p.width - 8; x += 16) {
          ctx.beginPath();
          ctx.arc(x + 8, p.y + 6, 4, 0, Math.PI);
          ctx.fill();
        }
      }
    });
  }

  drawPortals(ctx) {
    const pulse = Math.sin(Date.now() / 200) * 4;
    this.portals.forEach(port => {
      ctx.save();
      ctx.translate(port.x, port.y - 35);

      // Glowing Blue Oval Portal Rings
      const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 26 + pulse);
      grad.addColorStop(0, 'rgba(186, 230, 253, 0.95)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.75)');
      grad.addColorStop(0.9, 'rgba(14, 165, 233, 0.3)');
      grad.addColorStop(1, 'rgba(3, 105, 161, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + pulse, 38 + pulse, 0, 0, Math.PI * 2);
      ctx.fill();

      // Portal sparkles
      for (let i = 0; i < 4; i++) {
        const angle = (Date.now() / 400 + i * Math.PI / 2) % (Math.PI * 2);
        const sx = Math.cos(angle) * (14 + pulse);
        const sy = Math.sin(angle) * (24 + pulse);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Portal Label
      ctx.font = 'bold 11px "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 3;
      ctx.strokeText(port.label, 0, -48);
      ctx.fillText(port.label, 0, -48);

      ctx.restore();
    });
  }

  drawSigns(ctx) {
    this.signs.forEach(s => {
      ctx.save();
      ctx.translate(s.x, s.y);

      // Wooden post
      ctx.fillStyle = '#5c3826';
      ctx.fillRect(-3, -30, 6, 30);

      // Signboard
      ctx.fillStyle = '#b4814a';
      ctx.beginPath();
      ctx.roundRect(-50, -52, 100, 24, 4);
      ctx.fill();
      ctx.strokeStyle = '#5c3826';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sign text
      ctx.font = 'bold 10px "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2e190b';
      ctx.fillText(s.text, 0, -36);

      ctx.restore();
    });
  }
}

window.GameMap = GameMap;
