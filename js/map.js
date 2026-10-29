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

    key = data.key || key;
    this.currentKey = key;
    this.name = data.name;
    this.category = data.category || '사냥터';
    this.width = data.width;
    this.height = data.height;
    this.terrainSourceWidth = data.terrainSourceWidth || data.width;
    this.nativeTerrain = Boolean(data.nativeTerrain);
    this.nativeRopeTailOffset = data.nativeRopeTailOffset || 0;
    this.isTown = Boolean(data.isTown);
    this.mobSpawns = data.mobSpawns || [];
    this.maxMonsters = data.maxMonsters ?? this.mobSpawns.length;
    this.bossSpawn = data.bossSpawn || null;
    this.terrainOffset = {
      x: data.terrainOffset?.x ?? 0,
      y: data.terrainOffset?.y ?? 0
    };
    this.defaultSpawn = data.defaultSpawn || { x: 400, y: 1300 };
    this.isBossMap = data.isBossMap || false;
    this.boss = data.boss || null;

    // Load Terrain Image
    this.terrainLoaded = false;
    this.minimapCanvas = null;
    this.terrainImg = new Image();
    const terrainImage = this.terrainImg;
    this.terrainImg.onload = () => {
      if (this.terrainImg !== terrainImage) return;
      this.terrainLoaded = true;
      this.bakeMinimap();
    };
    this.terrainImg.src = data.img;

    // Load Minimap Image
    if (window.sprites) {
      window.sprites.minimapImg = new Image();
      window.sprites.minimapImg.src = data.minimap;
    }

    // Convert raw footholds into Foothold instances
    const rawFhs = data.footholds || [];
    const maxY = rawFhs.length > 0 ? Math.max(...rawFhs.map(f => Math.max(f.y1, f.y2))) : 0;
    this.footholds = rawFhs.map(f => {
      // The bottom-most platform level must NEVER allow drop-through into the void!
      const isBottomFloor = Math.max(f.y1, f.y2) >= maxY - 25;
      const canDrop = isBottomFloor ? false : (f.canDropThrough !== undefined ? f.canDropThrough : true);
      const isDecorativeProp = f.isProp === true || f.type === 'prop' || (key === 'henesys_hhg' && (
        Math.abs(f.y1 - 473) <= 6 || Math.abs(f.y1 - 714) <= 6 ||
        Math.abs(f.y1 - 956) <= 6 || Math.abs(f.y1 - 1255) <= 6
      ));
      const type = isDecorativeProp ? 'prop' : (canDrop ? 'platform' : 'ground');
      const foothold = new Foothold(f.id, f.x1, f.y1, f.x2, f.y2, canDrop, type);
      foothold.sourceLayer = f.sourceLayer;
      foothold.sourceGroup = f.sourceGroup;
      return foothold;
    });
    // Ladders and Ropes
    this.ladders = (data.ladders || []).map(l => ({
      id: l.id,
      x: l.x,
      top: l.top,
      bottom: l.bottom,
      isLadder: l.isLadder,
      type: l.isLadder ? 'ladder' : 'rope',
      renderedInTerrain: Boolean(l.renderedInTerrain),
      nativeBottom: l.nativeBottom ?? l.bottom
    }));
    // Source ropes can stop above a lower foothold; expose a continuous, visible route.
    for (const ladder of this.ladders) {
      const near = this.findFootholdNear(ladder.x, ladder.bottom, 16);
      if (near) ladder.bottom = near.getYAtX(ladder.x);
      else {
        const below = this.footholds.filter(f => !f.isProp && f.width > 0 && ladder.x >= f.x1 && ladder.x <= f.x2 &&
          f.getYAtX(ladder.x) >= ladder.bottom && f.getYAtX(ladder.x) - ladder.bottom <= 160)
          .sort((a,b) => a.getYAtX(ladder.x) - b.getYAtX(ladder.x))[0];
        if (below) ladder.bottom = below.getYAtX(ladder.x);
      }
    }

    // The complete native render already contains six raid platforms. Never add
    // overlapping scaffold collision/slabs; connect the actual authored surfaces.
    this.raidPlatforms = [];
    if (key === 'zakum_altar') {
      const support = (x, layer, group) => this.footholds.find(f =>
        f.sourceLayer === layer && f.sourceGroup === group && x >= f.x1 && x <= f.x2);
      const routes = [
        {id:'zk_rope_left_middle', x:240, upper:[4,9], lower:[5,7]},
        {id:'zk_rope_left_top', x:210, upper:[3,12], lower:[4,9]},
        {id:'zk_rope_right_ground', x:1040, upper:[5,4], lower:[5,0]},
        {id:'zk_rope_right_middle', x:1060, upper:[4,5], lower:[5,4]},
        {id:'zk_rope_right_top', x:1060, upper:[3,11], lower:[4,5]}
      ];
      for (const route of routes) {
        const upper = support(route.x, ...route.upper);
        const lower = support(route.x, ...route.lower);
        if (!upper || !lower) throw new Error(`Missing native raid support: ${route.id}`);
        this.ladders.push({id:route.id, x:route.x, top:upper.getYAtX(route.x), bottom:lower.getYAtX(route.x),
          isLadder:false, type:'rope', adaptation:true, upperFootholdId:upper.id, lowerFootholdId:lower.id});
      }
    }

    // Cropped terrain images must not truncate authored footholds or climbing routes.
    this.width = Math.max(this.width, ...this.footholds.map(fh => fh.x2), ...this.ladders.map(l => l.x));
    this.bakeTerrainExtensions();

    this.defaultSpawn = this.resolvePosition(this.defaultSpawn.x, this.defaultSpawn.y);
    // NPCs
    this.npcs = (data.npcs || []).map(npcData => ({
      name: npcData.name,
      type: npcData.type,
      ...this.resolvePosition(npcData.x, npcData.y),
      dialog: npcData.dialog,
      width: npcData.type.includes('cab') ? 120 : 50,
      height: 70
    }));

    // Portals
    this.portals = (data.portals || []).map(pData => ({
      ...this.resolvePosition(pData.x, pData.y),
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
  findConnectingFoothold(currentFh, x, dir = null) {
    if (!currentFh) return null;
    let best = null;
    let bestDistance = Infinity;
    const right = dir === 'right' || (dir === null && x > currentFh.x2);
    const edgeX = right ? currentFh.x2 : currentFh.x1;
    const edgeY = right ? currentFh.y2 : currentFh.y1;
    for (const fh of this.footholds) {
      if (fh.id === currentFh.id || fh.isProp || fh.width === 0) continue;
      if (right ? fh.x2 <= edgeX : fh.x1 >= edgeX) continue;
      if (edgeX < fh.x1 - 2 || edgeX > fh.x2 + 2) continue;
      const distance = Math.abs(fh.getYAtX(edgeX) - edgeY);
      if (distance <= 6 && distance < bestDistance) {
        best = fh;
        bestDistance = distance;
      }
    }
    return best;
  }

  findFootholdNear(x, y, maxDistance = 16) {
    let best = null;
    let distance = Infinity;
    for (const fh of this.footholds) {
      if (fh.isProp || fh.width === 0 || x < fh.x1 || x > fh.x2) continue;
      const delta = Math.abs(fh.getYAtX(x) - y);
      if (delta <= maxDistance && delta < distance) {
        best = fh;
        distance = delta;
      }
    }
    return best;
  }

  findSpawnFoothold(x, hintY) {
    return this.findFootholdNear(x, hintY, Infinity);
  }

  resolvePosition(x, hintY) {
    x = Math.max(0, Math.min(this.width, x));
    let fh = this.findSpawnFoothold(x, hintY);
    if (!fh) {
      const candidates = this.footholds.filter(f => !f.isProp && f.width > 0);
      fh = candidates.sort((a, b) =>
        Math.hypot(Math.max(a.x1, Math.min(a.x2, x))-x, a.getYAtX(Math.max(a.x1, Math.min(a.x2,x)))-hintY) -
        Math.hypot(Math.max(b.x1, Math.min(b.x2, x))-x, b.getYAtX(Math.max(b.x1, Math.min(b.x2,x)))-hintY))[0];
      if (fh) x = Math.max(fh.x1, Math.min(fh.x2, x));
    }
    return {x, y: fh ? fh.getYAtX(x) : hintY};
  }

  bakeMinimap() {
    if (typeof document === 'undefined' || !this.terrainLoaded) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.scale(canvas.width / this.width, canvas.height / this.height);
    ctx.drawImage(this.terrainImg, this.terrainOffset.x, this.terrainOffset.y);
    for (const patch of this.terrainExtensions) ctx.drawImage(patch.canvas, patch.x, patch.y);
    this.drawLaddersAndRopes(ctx);

    this.minimapCanvas = canvas;
  }

  // Find lowest / ground foothold beneath or closest to given X
  findGroundFootholdAt(x) {
    let best = null;
    let maxY = -Infinity;
    for (const fh of this.footholds) {
      if (!fh.isProp && fh.width > 0 && x >= fh.x1 && x <= fh.x2) {
        const y = fh.getYAtX(x);
        if (y > maxY) {
          maxY = y;
          best = fh;
        }
      }
    }
    return best;
  }

  update(dt) {
    this.clouds.forEach(c => {
      c.x += c.speed;
      if (c.x > this.width + 150) c.x = -150;
    });
  }

  bakeTerrainExtensions() {
    this.terrainExtensions = [];
    if (typeof document === 'undefined') return;
    const imageLeft = this.terrainOffset.x;
    const imageRight = imageLeft + this.terrainSourceWidth;
    const margins = [[0, Math.min(this.width, imageLeft)], [Math.max(0, imageRight), this.width]];
    const grassy = this.currentKey.startsWith('henesys') || this.currentKey === 'ellinia';
    const colors = grassy
      ? ['#8b7151', '#6d5339', '#493522', '#b4db79', '#538b3b']
      : (this.currentKey === 'zakum_altar'
        ? ['#655248', '#473931', '#2e231e', '#e99752', '#8d492d']
        : ['#8c7451', '#665137', '#3e3021', '#c5a474', '#9a7b4d']);

    for (const [left, right] of margins) {
      if (right <= left) continue;
      const segments = this.footholds.filter(fh => !fh.isProp && fh.width > 0 && fh.x2 > left && fh.x1 < right);
      if (!segments.length) continue;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(right - left);
      canvas.height = Math.ceil(this.height);
      const ctx = canvas.getContext('2d');
      ctx.translate(-left, 0);
      ctx.lineJoin = 'bevel';

      for (const fh of segments) {
        const x1 = Math.max(left, fh.x1);
        const x2 = Math.min(right, fh.x2);
        const y1 = fh.getYAtX(x1);
        const y2 = fh.getYAtX(x2);
        const band = (top, bottom, color) => {
          ctx.beginPath();
          ctx.moveTo(x1, y1 + top);
          ctx.lineTo(x2, y2 + top);
          ctx.lineTo(x2, y2 + bottom);
          ctx.lineTo(x1, y1 + bottom);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
        };
        band(0, 7, colors[0]);
        band(7, 13, colors[1]);
        band(13, 18, colors[2]);
        band(0, 3, colors[4]);

        // Deterministic stone facets follow the same slope as the contact surface.
        for (let x = x1 + 6; x < x2 - 9; x += 23) {
          const y = fh.getYAtX(x);
          ctx.beginPath();
          ctx.moveTo(x, y + 7);
          ctx.lineTo(x + 5, y + 5);
          ctx.lineTo(x + 11, y + 9);
          ctx.lineTo(x + 8, y + 13);
          ctx.closePath();
          ctx.fillStyle = colors[0];
          ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x2, y2 + 18);
        ctx.lineTo(x1, y1 + 18);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x1, y1 + 1);
        ctx.lineTo(x2, y2 + 1);
        ctx.strokeStyle = colors[3];
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      this.terrainExtensions.push({ canvas, x: left, y: 0 });
    }
  }

  draw(ctx, camera) {
    // 1. Far Sky & Parallax Backdrops
    this.drawSkyAndFarBackdrop(ctx, camera);

    // 2. Authentic Map Terrain Blit
    if (this.terrainLoaded && this.terrainImg.complete) {
      ctx.drawImage(this.terrainImg, this.terrainOffset.x, this.terrainOffset.y);
    }
    for (const patch of this.terrainExtensions) {
      ctx.drawImage(patch.canvas, patch.x, patch.y);
    }

    // 2.5 Ellinia Procedural Ancient Trunks and Branch Platforms (replaces empty void)
    if (this.currentKey === 'ellinia' && !this.nativeTerrain) {
      this.drawElliniaProceduralTerrain(ctx, camera);
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

  drawElliniaProceduralTerrain(ctx, camera) {
    const viewLeft = camera.x - 80;
    const viewRight = camera.x + camera.width + 80;
    const viewTop = camera.y - 80;
    const viewBottom = camera.y + camera.height + 80;

    // 1. Giant Ancient Oak Trunks that anchor the vertical forest
    const giantTrunks = [
      { x: 320, w: 260 },
      { x: 880, w: 280 },
      { x: 1520, w: 340 },
      { x: 2220, w: 280 }
    ];

    ctx.save();
    for (const trunk of giantTrunks) {
      if (trunk.x + trunk.w < viewLeft || trunk.x > viewRight) continue;

      // Bark Base
      const trunkGrad = ctx.createLinearGradient(trunk.x, 0, trunk.x + trunk.w, 0);
      trunkGrad.addColorStop(0, '#2d180a');
      trunkGrad.addColorStop(0.15, '#45260f');
      trunkGrad.addColorStop(0.5, '#5c3417');
      trunkGrad.addColorStop(0.85, '#45260f');
      trunkGrad.addColorStop(1, '#241307');
      ctx.fillStyle = trunkGrad;
      ctx.fillRect(trunk.x, viewTop, trunk.w, viewBottom - viewTop);

      // Bark vertical wood-grain ridges & cel-shading
      ctx.strokeStyle = 'rgba(25, 12, 5, 0.65)';
      ctx.lineWidth = 3;
      for (let rx = trunk.x + 30; rx < trunk.x + trunk.w - 20; rx += 36) {
        ctx.beginPath();
        ctx.moveTo(rx, viewTop);
        ctx.lineTo(rx + Math.sin(rx) * 6, viewBottom);
        ctx.stroke();
      }

      // Outer Dark Outlines (AGENTS.md 1.5~2px border)
      ctx.strokeStyle = 'rgba(15, 10, 8, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(trunk.x, viewTop, trunk.w, viewBottom - viewTop);
    }
    ctx.restore();

    // 2. Mossy Wooden Branch Platforms along Footholds
    ctx.save();
    for (const fh of this.footholds) {
      if (fh.x2 < viewLeft || fh.x1 > viewRight) continue;
      const minY = Math.min(fh.y1, fh.y2);
      const maxY = Math.max(fh.y1, fh.y2);
      if (maxY < viewTop || minY > viewBottom) continue;

      const w = fh.x2 - fh.x1;
      if (w < 8) continue;

      if (minY >= 4450) {
        // Deep Ground Soil Floor
        ctx.fillStyle = '#261609';
        ctx.fillRect(fh.x1, minY, w, 500);

        // Top lush moss grass strip
        ctx.fillStyle = '#1e7b34';
        ctx.fillRect(fh.x1, minY - 2, w, 8);
        ctx.fillStyle = '#38a169';
        ctx.fillRect(fh.x1, minY - 4, w, 4);

        ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fh.x1, minY - 4);
        ctx.lineTo(fh.x2, minY - 4);
        ctx.stroke();
      } else {
        // Wooden Branch Platform
        const branchH = 16;
        const branchGrad = ctx.createLinearGradient(0, minY, 0, minY + branchH);
        branchGrad.addColorStop(0, '#5a3418');
        branchGrad.addColorStop(0.7, '#3d210d');
        branchGrad.addColorStop(1, '#241307');

        // Wooden Branch Slab
        ctx.fillStyle = branchGrad;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(fh.x1 - 4, minY, w + 8, branchH, [0, 0, 6, 6]);
        } else {
          ctx.rect(fh.x1 - 4, minY, w + 8, branchH);
        }
        ctx.fill();

        // 2px Dark Outline
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Top Moss Foliage Layer
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(fh.x1 - 5, minY - 4, w + 10, 6, [3, 3, 0, 0]);
        } else {
          ctx.rect(fh.x1 - 5, minY - 4, w + 10, 6);
        }
        ctx.fill();

        // Moss Highlights & Shadow Strip
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(fh.x1 - 3, minY - 4, w + 6, 2);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(fh.x1 - 3, minY, w + 6, 2);

        // Hanging Ivy Tendrils for authentic Ellinia fantasy feel
        if (w >= 40) {
          ctx.fillStyle = '#15803d';
          const vineCount = Math.min(4, Math.floor(w / 45));
          for (let vi = 0; vi < vineCount; vi++) {
            const vx = fh.x1 + 15 + vi * 38;
            const vh = 10 + (vi % 3) * 6;
            ctx.beginPath();
            ctx.ellipse(vx, minY + branchH + vh * 0.4, 3, vh * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(vx - 1, minY + branchH, 2, vh);
          }
        }
      }
    }
    ctx.restore();
  }


  drawLaddersAndRopes(ctx) {
    this.ladders.forEach(l => {
      const x = l.x;
      if (l.renderedInTerrain && l.bottom <= l.nativeBottom) return;
      const top = l.renderedInTerrain ? l.nativeBottom + this.nativeRopeTailOffset : l.top;
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
