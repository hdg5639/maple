// js/map.js - Multi-Map Engine with Official Nexon WZ Footholds & Parallax Environments

class GameMap {
  constructor(initialKey = 'henesys_hhg') {
    this.currentKey = initialKey;
    this.terrainImg = new Image();
    this.terrainLoaded = false;
    this.clouds = [
      { x: 150, y: 120, speed: 0.15, size: 90 },
      { x: 600, y: 80, speed: 0.22, size: 110 },
      { x: 1150, y: 140, speed: 0.18, size: 85 },
      { x: 1700, y: 90, speed: 0.25, size: 120 },
      { x: 2100, y: 160, speed: 0.20, size: 95 }
    ];

    this.loadMap(initialKey);
  }

  loadMap(key) {
    let data = null;
    if (typeof MAP_DATABASE !== 'undefined' && MAP_DATABASE[key]) {
      data = MAP_DATABASE[key];
    } else {
      // Fallback to default henesys
      data = (typeof MAP_DATABASE !== 'undefined' && MAP_DATABASE['henesys_hhg']) || {
        name: '헤네시스 사냥터 1',
        category: '사냥터',
        width: 2242,
        height: 1634,
        img: 'assets/map/henesys_terrain.png',
        minimap: 'assets/map/henesys_minimap.png',
        defaultSpawn: { x: 1050, y: 1320 },
        footholds: [],
        ladders: [],
        npcs: [],
        portals: []
      };
    }

    this.currentKey = key;
    this.name = data.name;
    this.category = data.category || '사냥터';
    this.width = data.width;
    this.height = data.height;
    this.defaultSpawn = data.defaultSpawn || { x: 400, y: 1300 };
    this.isBossMap = data.isBossMap || false;
    this.boss = data.boss || null;

    // Load Terrain Image
    this.terrainLoaded = false;
    this.terrainImg = new Image();
    this.terrainImg.src = data.img;
    this.terrainImg.onload = () => {
      this.terrainLoaded = true;
    };

    // Load Minimap Image
    if (window.sprites) {
      window.sprites.minimapImg = new Image();
      window.sprites.minimapImg.src = data.minimap;
    }

    // Convert raw footholds into Foothold instances
    this.footholds = (data.footholds || []).map(f => 
      new Foothold(f.id, f.x1, f.y1, f.x2, f.y2, f.canDropThrough, f.canDropThrough ? 'platform' : 'ground')
    );

    // Ladders and Ropes
    this.ladders = (data.ladders || []).map(l => ({
      id: l.id,
      x: l.x,
      top: l.top,
      bottom: l.bottom,
      isLadder: l.isLadder,
      type: l.isLadder ? 'ladder' : 'rope'
    }));

    // NPCs
    this.npcs = (data.npcs || []).map(npcData => ({
      name: npcData.name,
      type: npcData.type,
      x: npcData.x,
      y: npcData.y,
      dialog: npcData.dialog,
      width: npcData.type.includes('cab') ? 120 : 50,
      height: 70
    }));

    // Portals
    this.portals = (data.portals || []).map(pData => ({
      x: pData.x,
      y: pData.y,
      targetMap: pData.targetMap,
      targetX: pData.targetX,
      targetY: pData.targetY,
      name: pData.name
    }));

    return this;
  }

  get platforms() {
    return this.footholds.map(fh => ({
      x: fh.x1,
      y: fh.y1,
      width: fh.x2 - fh.x1,
      height: 10
    }));
  }

  // Find continuous slope segment
  findConnectingFoothold(currentFh, x) {
    for (const fh of this.footholds) {
      if (fh.id === currentFh.id) continue;
      if (x >= fh.x1 && x <= fh.x2) {
        const currentY = currentFh.getYAtX(x);
        const targetY = fh.getYAtX(x);
        if (Math.abs(currentY - targetY) <= 8) {
          return fh;
        }
      }
    }
    return null;
  }

  update(dt) {
    this.clouds.forEach(c => {
      c.x += c.speed;
      if (c.x > this.width + 150) c.x = -150;
    });
  }

  draw(ctx, camera) {
    // 1. Far Sky & Parallax Backdrops
    this.drawSkyAndFarBackdrop(ctx, camera);

    // 2. Authentic Map Terrain Blit
    if (this.terrainLoaded && this.terrainImg.complete) {
      ctx.drawImage(this.terrainImg, 0, 0);
    }

    // 3. Render Pixel-Art Ladders & Ropes connecting platforms
    this.drawLaddersAndRopes(ctx);

    // 4. Render Portals
    if (window.sprites) {
      this.portals.forEach(portal => {
        window.sprites.drawPortal(ctx, portal);
      });
    }
  }

  drawSkyAndFarBackdrop(ctx, camera) {
    if (this.currentKey === 'ant_tunnel') {
      // Dark Underground Cavern
      const caveGrad = ctx.createLinearGradient(0, camera.y, 0, camera.y + camera.height);
      caveGrad.addColorStop(0, '#0a090e');
      caveGrad.addColorStop(0.5, '#16131c');
      caveGrad.addColorStop(1, '#211d2b');
      ctx.fillStyle = caveGrad;
      ctx.fillRect(camera.x, camera.y, camera.width, camera.height);

      // Distant stalactites (Parallax 0.2)
      ctx.save();
      const pOffset = camera.x * 0.15;
      ctx.translate(-pOffset, 0);
      ctx.fillStyle = 'rgba(28, 24, 36, 0.6)';
      for (let sx = 0; sx <= this.width + 1000; sx += 180) {
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx + 30, 220 + Math.sin(sx) * 60);
        ctx.lineTo(sx + 60, 0);
        ctx.fill();
      }
      ctx.restore();
    } else if (this.currentKey === 'zakum_altar') {
      // Scorching Molten Lava Cavern
      const lavaGrad = ctx.createLinearGradient(0, camera.y, 0, camera.y + camera.height);
      lavaGrad.addColorStop(0, '#1c0402');
      lavaGrad.addColorStop(0.5, '#3b0a07');
      lavaGrad.addColorStop(1, '#66140b');
      ctx.fillStyle = lavaGrad;
      ctx.fillRect(camera.x, camera.y, camera.width, camera.height);

      // Fiery ember glow on the bottom (Parallax 0.3)
      ctx.save();
      const glowGrad = ctx.createLinearGradient(0, this.height - 250, 0, this.height);
      glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      glowGrad.addColorStop(0.8, 'rgba(249, 115, 22, 0.4)');
      glowGrad.addColorStop(1, 'rgba(254, 240, 138, 0.6)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(camera.x, this.height - 250, camera.width, 250);
      ctx.restore();
    } else if (this.currentKey === 'ellinia') {
      // Mystical Emerald Forest
      const treeGrad = ctx.createLinearGradient(0, camera.y, 0, camera.y + camera.height);
      treeGrad.addColorStop(0, '#021812');
      treeGrad.addColorStop(0.5, '#062d22');
      treeGrad.addColorStop(1, '#0e4a39');
      ctx.fillStyle = treeGrad;
      ctx.fillRect(camera.x, camera.y, camera.width, camera.height);

      // Ancient Giant Trunks in background (Parallax 0.25)
      ctx.save();
      const treeParallax = camera.x * 0.2;
      ctx.translate(-treeParallax, 0);
      ctx.fillStyle = 'rgba(7, 43, 33, 0.55)';
      for (let tx = 100; tx <= this.width + 1000; tx += 450) {
        ctx.fillRect(tx, 0, 140, this.height);
      }
      ctx.restore();
    } else {
      // Henesys Daylight Blue Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, camera.y, 0, camera.y + camera.height);
      skyGrad.addColorStop(0, '#53a8ea');
      skyGrad.addColorStop(0.5, '#87c6f5');
      skyGrad.addColorStop(1, '#d2effd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(camera.x, camera.y, camera.width, camera.height);

      // Distant Rolling Henesys Hills (Parallax 0.25)
      ctx.save();
      const hillParallax = camera.x * 0.25;
      ctx.translate(-hillParallax, 0);

      ctx.fillStyle = 'rgba(125, 195, 75, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, 1200);
      for (let x = 0; x <= this.width + 1000; x += 300) {
        ctx.quadraticCurveTo(x + 150, 850 + Math.sin(x * 0.01) * 80, x + 300, 1200);
      }
      ctx.lineTo(this.width + 1000, this.height);
      ctx.lineTo(0, this.height);
      ctx.closePath();
      ctx.fill();

      // Floating Clouds
      this.clouds.forEach(c => {
        const cx = c.x - camera.x * 0.12;
        const cy = c.y + camera.y * 0.05;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(cx, cy, c.size * 0.45, 0, Math.PI * 2);
        ctx.arc(cx + c.size * 0.35, cy - c.size * 0.12, c.size * 0.4, 0, Math.PI * 2);
        ctx.arc(cx + c.size * 0.7, cy, c.size * 0.42, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }
  }

  drawLaddersAndRopes(ctx) {
    this.ladders.forEach(l => {
      const x = l.x;
      const top = l.top;
      const bot = l.bottom;
      const height = bot - top;
      if (height <= 0) return;

      if (l.isLadder) {
        // Wooden Ladder: 2 vertical rails + horizontal rungs
        const railHalf = 9;
        ctx.strokeStyle = '#5a3818';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        // Left rail
        ctx.beginPath();
        ctx.moveTo(x - railHalf, top);
        ctx.lineTo(x - railHalf, bot);
        ctx.stroke();
        // Right rail
        ctx.beginPath();
        ctx.moveTo(x + railHalf, top);
        ctx.lineTo(x + railHalf, bot);
        ctx.stroke();

        // Inner wood highlight
        ctx.strokeStyle = '#b8824a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x - railHalf, top);
        ctx.lineTo(x - railHalf, bot);
        ctx.moveTo(x + railHalf, top);
        ctx.lineTo(x + railHalf, bot);
        ctx.stroke();

        // Rungs every 15px
        for (let ry = top + 8; ry < bot - 4; ry += 15) {
          ctx.strokeStyle = '#422810';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x - railHalf, ry);
          ctx.lineTo(x + railHalf, ry);
          ctx.stroke();

          ctx.strokeStyle = '#d49b5c';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - railHalf + 1, ry - 0.5);
          ctx.lineTo(x + railHalf - 1, ry - 0.5);
          ctx.stroke();
        }
      } else {
        // Braided Hemp Climbing Rope
        ctx.strokeStyle = '#3d2b14';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bot);
        ctx.stroke();

        // Braided texture
        ctx.strokeStyle = '#c9a26b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bot);
        ctx.stroke();

        // Rope fiber knots every 12px
        ctx.fillStyle = '#6d4820';
        for (let ry = top + 6; ry < bot - 3; ry += 12) {
          ctx.beginPath();
          ctx.ellipse(x, ry, 3.5, 2.5, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }
}
