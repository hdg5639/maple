import json

with open('assets/map/henesys_data.json', 'r', encoding='utf-8') as f:
    map_data = json.load(f)

footholds_json = json.dumps(map_data['footholds'])
ladders_json = json.dumps(map_data['ladders'])

map_code = f"""// js/map.js - Authentic Henesys Hunting Ground 1 with Genuine Terrain & WZ Footholds

const HENESYS_FOOTHOLDS_RAW = {footholds_json};
const HENESYS_LADDERS_RAW = {ladders_json};

class GameMap {{
  constructor() {{
    this.name = '헤네시스 사냥터 1 (Henesys Hunting Ground 1)';
    this.width = {map_data['width']};
    this.height = {map_data['height']};
    this.groundY = {map_data['groundY']};

    // Terrain Image
    this.terrainImg = new Image();
    this.terrainImg.src = 'assets/map/henesys_terrain.png';
    this.terrainLoaded = false;
    this.terrainImg.onload = () => {{
      this.terrainLoaded = true;
    }};

    // Convert raw footholds into Foothold instances
    this.footholds = HENESYS_FOOTHOLDS_RAW.map(f => 
      new Foothold(f.id, f.x1, f.y1, f.x2, f.y2, f.canDropThrough, f.y1 >= 1300 ? 'ground' : 'platform')
    );

    // Reference to base ground foothold
    this.groundFoothold = this.footholds.find(f => f.y1 >= 1300) || this.footholds[0];

    // Ladders and Ropes
    this.ladders = HENESYS_LADDERS_RAW.map(l => ({{
      id: l.id,
      x: l.x,
      top: l.top,
      bottom: l.bottom,
      isLadder: l.isLadder,
      type: l.isLadder ? 'ladder' : 'rope'
    }}));

    // Parallax Clouds
    this.clouds = [
      {{ x: 150, y: 120, speed: 0.15, size: 90 }},
      {{ x: 600, y: 80, speed: 0.22, size: 110 }},
      {{ x: 1150, y: 140, speed: 0.18, size: 85 }},
      {{ x: 1700, y: 90, speed: 0.25, size: 120 }},
      {{ x: 2100, y: 160, speed: 0.20, size: 95 }}
    ];
  }}

  get platforms() {{
    return this.footholds.map(fh => ({{
      x: fh.x1,
      y: fh.y1,
      width: fh.x2 - fh.x1,
      height: 10
    }}));
  }}

  // Find continuous slope segment
  findConnectingFoothold(currentFh, x) {{
    for (const fh of this.footholds) {{
      if (fh.id === currentFh.id) continue;
      if (x >= fh.x1 && x <= fh.x2) {{
        const currentY = currentFh.getYAtX(x);
        const targetY = fh.getYAtX(x);
        if (Math.abs(currentY - targetY) <= 8) {{
          return fh;
        }}
      }}
    }}
    return null;
  }}

  update(dt) {{
    this.clouds.forEach(c => {{
      c.x += c.speed;
      if (c.x > this.width + 150) c.x = -150;
    }});
  }}

  draw(ctx, camera) {{
    // 1. Far Sky & Parallax Backdrops
    this.drawSkyAndFarBackdrop(ctx, camera);

    // 2. Authentic Henesys Terrain
    if (this.terrainLoaded && this.terrainImg.complete) {{
      ctx.drawImage(this.terrainImg, 0, 0);
    }}

    // 3. Render Pixel-Art Ladders & Ropes connecting platforms
    this.drawLaddersAndRopes(ctx);
  }}

  drawSkyAndFarBackdrop(ctx, camera) {{
    // Sky Gradient
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
    for (let x = 0; x <= this.width + 1000; x += 300) {{
      ctx.quadraticCurveTo(x + 150, 850 + Math.sin(x * 0.01) * 80, x + 300, 1200);
    }}
    ctx.lineTo(this.width + 1000, 1634);
    ctx.lineTo(0, 1634);
    ctx.closePath();
    ctx.fill();

    // Floating Clouds
    this.clouds.forEach(c => {{
      const cx = c.x - camera.x * 0.12;
      const cy = c.y + camera.y * 0.05;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(cx, cy, c.size * 0.45, 0, Math.PI * 2);
      ctx.arc(cx + c.size * 0.35, cy - c.size * 0.12, c.size * 0.4, 0, Math.PI * 2);
      ctx.arc(cx + c.size * 0.7, cy, c.size * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }});

    ctx.restore();
  }}

  drawLaddersAndRopes(ctx) {{
    this.ladders.forEach(l => {{
      const x = l.x;
      const top = l.top;
      const bot = l.bottom;
      const height = bot - top;
      if (height <= 0) return;

      if (l.isLadder) {{
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
        for (let ry = top + 8; ry < bot - 4; ry += 15) {{
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
        }}
      }} else {{
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
        for (let ry = top + 6; ry < bot - 3; ry += 12) {{
          ctx.beginPath();
          ctx.ellipse(x, ry, 3.5, 2.5, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }}
      }}
    }});
  }}
}}
"""

with open('js/map.js', 'w', encoding='utf-8') as f:
    f.write(map_code)

print("js/map.js successfully updated with authentic Henesys map data and rendering!")
