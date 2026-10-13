// js/map.js - Henesys Hunting Ground 1 with Line Segment Footholds & 3-Layer Parallax

class GameMap {
  constructor() {
    this.name = '헤네시스 사냥터 1 (Henesys Hunting Ground 1)';
    this.width = 2400;
    this.height = 950;

    // Line Segment Footholds: Foothold(id, x1, y1, x2, y2, canDropThrough, type)
    this.footholds = [
      // Main Ground Floor (with subtle organic slope segments)
      new Foothold(1, 0, 820, 800, 820, false, 'ground'),
      new Foothold(2, 800, 820, 1100, 814, false, 'ground'),   // Gentle uphill slope
      new Foothold(3, 1100, 814, 1500, 820, false, 'ground'),  // Gentle downhill slope
      new Foothold(4, 1500, 820, 2400, 820, false, 'ground'),

      // Tier 1 Platforms (Can drop through)
      new Foothold(10, 120, 700, 500, 700, true, 'grass'),
      new Foothold(11, 580, 680, 1020, 680, true, 'grass'),
      new Foothold(12, 1100, 700, 1500, 700, true, 'grass'),
      new Foothold(13, 1600, 680, 2050, 680, true, 'grass'),

      // Tier 2 Platforms (Sloped platforms supported!)
      new Foothold(20, 260, 550, 580, 550, true, 'grass'),
      new Foothold(21, 740, 530, 1160, 530, true, 'grass'),
      new Foothold(22, 1300, 540, 1660, 540, true, 'grass'),
      new Foothold(23, 1780, 520, 2160, 520, true, 'grass'),

      // Tier 3 Platforms (Wood & Grassy branches)
      new Foothold(30, 450, 400, 790, 400, true, 'wood'),
      new Foothold(31, 950, 380, 1350, 380, true, 'wood'),
      new Foothold(32, 1480, 390, 1820, 390, true, 'wood'),

      // Tier 4 Peak Shrine Platform
      new Foothold(40, 780, 250, 1260, 250, true, 'shrine')
    ];

    // Reference to base ground
    this.groundFoothold = this.footholds[0];

    // Ladders and Ropes
    this.ladders = [
      { id: 1, x: 300, top: 700, bottom: 820, type: 'ladder', fromFh: 1, toFh: 10 },
      { id: 2, x: 780, top: 680, bottom: 820, type: 'rope', fromFh: 1, toFh: 11 },
      { id: 3, x: 1320, top: 700, bottom: 820, type: 'ladder', fromFh: 3, toFh: 12 },
      { id: 4, x: 1800, top: 680, bottom: 820, type: 'rope', fromFh: 4, toFh: 13 },

      { id: 5, x: 420, top: 550, bottom: 700, type: 'rope', fromFh: 10, toFh: 20 },
      { id: 6, x: 920, top: 530, bottom: 680, type: 'ladder', fromFh: 11, toFh: 21 },
      { id: 7, x: 1460, top: 540, bottom: 700, type: 'rope', fromFh: 12, toFh: 22 },
      { id: 8, x: 1940, top: 520, bottom: 680, type: 'ladder', fromFh: 13, toFh: 23 },

      { id: 9, x: 620, top: 400, bottom: 550, type: 'ladder', fromFh: 20, toFh: 30 },
      { id: 10, x: 1140, top: 380, bottom: 530, type: 'rope', fromFh: 21, toFh: 31 },
      { id: 11, x: 1650, top: 390, bottom: 540, type: 'ladder', fromFh: 22, toFh: 32 },

      { id: 12, x: 1020, top: 250, bottom: 380, type: 'ladder', fromFh: 31, toFh: 40 }
    ];

    this.portals = [
      { x: 80, y: 820, targetX: 2300, targetY: 820, label: '마을 (Town)' },
      { x: 2320, y: 820, targetX: 100, targetY: 820, label: '깊은 숲 (Deep Forest)' }
    ];

    this.signs = [
      { x: 180, y: 820, text: '헤네시스 사냥터 1' },
      { x: 1020, y: 250, text: '★ 버섯동산 정상 ★' },
      { x: 1700, y: 820, text: '위험! 주황버섯 출현' }
    ];

    this.clouds = [
      { x: 200, y: 90, speed: 0.15, size: 70 },
      { x: 800, y: 60, speed: 0.25, size: 90 },
      { x: 1400, y: 110, speed: 0.18, size: 80 },
      { x: 2000, y: 75, speed: 0.22, size: 85 }
    ];

    this.scenery = [
      { x: 240, y: 820, type: 'tree' },
      { x: 650, y: 820, type: 'mushroom_house' },
      { x: 1200, y: 816, type: 'tree' },
      { x: 1550, y: 820, type: 'windmill' },
      { x: 2100, y: 820, type: 'tree' }
    ];
  }

  // Find continuous slope segment
  findConnectingFoothold(currentFh, x) {
    for (const fh of this.footholds) {
      if (fh.id === currentFh.id) continue;
      if (x >= fh.x1 && x <= fh.x2) {
        // Vertical closeness check (within 6px)
        const currentY = currentFh.getYAtX(x);
        const targetY = fh.getYAtX(x);
        if (Math.abs(currentY - targetY) <= 8) {
          return fh;
        }
      }
    }
    return null;
  }

  get platforms() {
    return this.footholds.map(fh => ({
      x: fh.x1,
      y: fh.y1,
      width: fh.x2 - fh.x1,
      height: 10
    }));
  }

  update(dt) {
    this.clouds.forEach(c => {
      c.x += c.speed;
      if (c.x > this.width + 100) c.x = -150;
    });
  }

  // 3-Layer Parallax Drawing
  draw(ctx, camera) {
    // 1. Far Layer (Sky, Sun, Clouds - Scroll Rate 0.1)
    this.drawSkyAndFarBackdrop(ctx, camera);

    // 2. Mid Layer (Distant Hills, Windmills, Trees - Scroll Rate 0.4)
    this.drawMidground(ctx, camera);

    // 3. Near Layer (Footholds, Ladders, Portals - Scroll Rate 1.0)
    this.drawLadders(ctx);
    this.drawFootholds(ctx);
    this.drawPortals(ctx);
    this.drawSigns(ctx);
  }

  drawSkyAndFarBackdrop(ctx, camera) {
    // Vibrant Blue Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#56b8f5');
    skyGrad.addColorStop(0.5, '#99d9ea');
    skyGrad.addColorStop(1, '#dff3fc');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Sun (Scroll rate 0.05)
    const sunX = 400 + camera.x * 0.05;
    ctx.fillStyle = 'rgba(255, 245, 180, 0.45)';
    ctx.beginPath();
    ctx.arc(sunX, 150, 85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffae0';
    ctx.beginPath();
    ctx.arc(sunX, 150, 42, 0, Math.PI * 2);
    ctx.fill();

    // Drifting Fluffy Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    this.clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size * 0.4, 0, Math.PI * 2);
      ctx.arc(c.x + c.size * 0.35, c.y - c.size * 0.15, c.size * 0.35, 0, Math.PI * 2);
      ctx.arc(c.x + c.size * 0.7, c.y, c.size * 0.4, 0, Math.PI * 2);
      ctx.arc(c.x + c.size * 0.35, c.y + c.size * 0.1, c.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Far Mountain Ridge (Parallax 0.15)
    const pxFar = camera.x * 0.15;
    ctx.fillStyle = '#9bd084';
    ctx.beginPath();
    ctx.moveTo(0, 750);
    for (let x = 0; x <= this.width; x += 280) {
      const peakY = 470 + Math.sin(x * 0.005 + pxFar * 0.003) * 80;
      ctx.quadraticCurveTo(x + 140, peakY, x + 280, 750);
    }
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fill();
  }

  drawMidground(ctx, camera) {
    // Midground Rolling Hills (Parallax 0.4)
    ctx.fillStyle = '#7ac067';
    ctx.beginPath();
    ctx.moveTo(0, 800);
    for (let x = 0; x <= this.width; x += 220) {
      const peakY = 620 + Math.sin(x * 0.008) * 60;
      ctx.quadraticCurveTo(x + 110, peakY, x + 220, 800);
    }
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fill();

    // Scenery behind platforms
    this.scenery.forEach(item => {
      ctx.save();
      ctx.translate(item.x, item.y);

      if (item.type === 'tree') {
        ctx.fillStyle = '#6b4226';
        ctx.fillRect(-12, -130, 24, 130);
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-12, -130, 24, 130);

        // Cel-shaded canopy
        ctx.fillStyle = '#3f822e'; // Dark shade
        ctx.beginPath();
        ctx.arc(0, -150, 56, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#52aa3c'; // Mid base
        ctx.beginPath();
        ctx.arc(-5, -155, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6bc752'; // Top highlight
        ctx.beginPath();
        ctx.arc(-10, -162, 38, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'mushroom_house') {
        // Cel-shaded Henesys Mushroom House
        ctx.fillStyle = '#fce4c8';
        ctx.beginPath();
        ctx.roundRect(-45, -70, 90, 70, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#8b5a2b';
        ctx.beginPath();
        ctx.roundRect(-14, -45, 28, 45, [14, 14, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(-26, -35, 10, 0, Math.PI * 2);
        ctx.arc(26, -35, 10, 0, Math.PI * 2);
        ctx.fill();

        // Cel-Shaded Orange Mushroom Roof
        ctx.fillStyle = '#c2410c'; // Base shadow
        ctx.beginPath();
        ctx.ellipse(0, -75, 62, 42, 0, Math.PI, 0, false);
        ctx.fill();
        ctx.fillStyle = '#ea580c'; // Mid orange
        ctx.beginPath();
        ctx.ellipse(0, -78, 58, 38, 0, Math.PI, 0, false);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        [-35, 0, 35].forEach((x, i) => {
          ctx.beginPath();
          ctx.arc(x, -88 - (i === 1 ? 14 : 0), 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      } else if (item.type === 'windmill') {
        ctx.fillStyle = '#f5f5f4';
        ctx.beginPath();
        ctx.moveTo(-30, 0); ctx.lineTo(-18, -140); ctx.lineTo(18, -140); ctx.lineTo(30, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-24, -140); ctx.lineTo(0, -180); ctx.lineTo(24, -140);
        ctx.closePath();
        ctx.fill();

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
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(lad.x - 12, lad.top, 5, height);
        ctx.fillRect(lad.x + 7, lad.top, 5, height);
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(lad.x - 12, lad.top, 5, height);
        ctx.strokeRect(lad.x + 7, lad.top, 5, height);

        const stepDist = 18;
        ctx.fillStyle = '#d4a373';
        for (let y = lad.top + 10; y < lad.bottom; y += stepDist) {
          ctx.fillRect(lad.x - 10, y, 20, 4);
          ctx.strokeRect(lad.x - 10, y, 20, 4);
        }
      } else {
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

        ctx.fillStyle = '#52b788';
        for (let y = lad.top + 20; y < lad.bottom; y += 36) {
          ctx.beginPath();
          ctx.ellipse(lad.x + 6, y, 6, 3, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }

  // Draw Line Segment Footholds with Cel-Shaded Grass & Outlines
  drawFootholds(ctx) {
    this.footholds.forEach(fh => {
      const length = fh.x2 - fh.x1;
      const angle = Math.atan2(fh.y2 - fh.y1, fh.x2 - fh.x1);

      ctx.save();
      ctx.translate(fh.x1, fh.y1);
      ctx.rotate(angle);

      if (fh.type === 'ground') {
        // Ground Foothold: 2-tone grass + dark earth
        ctx.fillStyle = '#39782c'; // Grass shadow
        ctx.fillRect(0, 0, length, 24);
        ctx.fillStyle = '#52aa3c'; // Grass base
        ctx.fillRect(0, 0, length, 12);
        ctx.fillStyle = '#6bc752'; // Grass highlight
        ctx.fillRect(0, 0, length, 4);

        // 2px Outline on Foothold surface
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(length, 0);
        ctx.stroke();

        // Earth
        ctx.fillStyle = '#5a3821';
        ctx.fillRect(0, 24, length, 110);
      } else if (fh.type === 'shrine') {
        // Ancient Stone Shrine
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, length, 22);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, 0, length, 6);
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, length, 22);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('❖  M U S H M O M   S H R I N E  ❖', length / 2, 15);
      } else {
        // Floating Platforms: Wooden base with cel-shaded grass topper
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(0, 0, length, 18, 4);
        ctx.fill();

        // Cel-shaded grass
        ctx.fillStyle = '#39782c';
        ctx.fillRect(0, 0, length, 7);
        ctx.fillStyle = '#52aa3c';
        ctx.fillRect(0, 0, length, 4);
        ctx.fillStyle = '#86efac';
        ctx.fillRect(0, 0, length, 1.5);

        // 1.5px Outline
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(0, 0, length, 18);

        // Wood post drops
        ctx.fillStyle = '#92400e';
        ctx.fillRect(16, 18, 6, 12);
        ctx.fillRect(length - 22, 18, 6, 12);
      }

      ctx.restore();
    });
  }

  drawPortals(ctx) {
    const pulse = Math.sin(Date.now() / 200) * 4;
    this.portals.forEach(port => {
      ctx.save();
      ctx.translate(port.x, port.y - 35);

      const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 24 + pulse);
      grad.addColorStop(0, 'rgba(186, 230, 253, 0.95)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.75)');
      grad.addColorStop(0.9, 'rgba(14, 165, 233, 0.3)');
      grad.addColorStop(1, 'rgba(3, 105, 161, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22 + pulse, 38 + pulse, 0, 0, Math.PI * 2);
      ctx.fill();

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

      ctx.fillStyle = '#5c3826';
      ctx.fillRect(-3, -30, 6, 30);
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-3, -30, 6, 30);

      ctx.fillStyle = '#b4814a';
      ctx.beginPath();
      ctx.roundRect(-50, -52, 100, 24, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 10px "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2e190b';
      ctx.fillText(s.text, 0, -36);

      ctx.restore();
    });
  }
}

window.GameMap = GameMap;
