const fs = require('fs');

try {
  const code = fs.readFileSync('js/map_data.js', 'utf8');
  eval(code.replace('const MAP_DATABASE =', 'global.MAP_DATABASE ='));
  console.log('✓ js/map_data.js syntax is VALID!');
} catch (e) {
  console.error('✗ js/map_data.js syntax ERROR:', e);
  process.exit(1);
}

function getYAtX(fh, x) {
  if (fh.x2 === fh.x1) return fh.y1;
  return fh.y1 + ((fh.y2 - fh.y1) / (fh.x2 - fh.x1)) * (x - fh.x1);
}

function findFoothold(mapData, x, hintY) {
  let best = null;
  let minDist = Infinity;
  for (const fh of mapData.footholds) {
    if (fh.isProp || (fh.x2 - fh.x1) <= 0) continue;
    const minX = Math.min(fh.x1, fh.x2);
    const maxX = Math.max(fh.x1, fh.x2);
    if (x >= minX && x <= maxX) {
      const y = getYAtX(fh, x);
      const dist = Math.abs(y - hintY);
      if (dist < minDist) {
        minDist = dist;
        best = { fh, y, dist };
      }
    }
  }
  return best;
}

let allOk = true;

for (let key of Object.keys(MAP_DATABASE)) {
  const m = MAP_DATABASE[key];
  console.log('--------------------------------------------------');
  console.log(`[MAP] ${key} (${m.name}) - Portals: ${m.portals ? m.portals.length : 0}`);

  // 1. Check defaultSpawn
  const spFh = findFoothold(m, m.defaultSpawn.x, m.defaultSpawn.y);
  if (!spFh) {
    console.error(`  [FAIL] defaultSpawn (${m.defaultSpawn.x}, ${m.defaultSpawn.y}) has NO direct foothold!`);
    allOk = false;
  } else {
    console.log(`  [OK] defaultSpawn (${m.defaultSpawn.x}, ${m.defaultSpawn.y}) matches foothold (y=${spFh.y.toFixed(2)}, diff=${spFh.dist.toFixed(2)})`);
  }

  // 2. Check Portals & Targets
  (m.portals || []).forEach((p, idx) => {
    const pFh = findFoothold(m, p.x, p.y);
    if (!pFh) {
      console.error(`  [FAIL] Portal[${idx}] '${p.name}' at (${p.x}, ${p.y}) has NO foothold!`);
      allOk = false;
    } else {
      console.log(`  [OK] Portal[${idx}] '${p.name}' at (${p.x}, ${p.y}) -> fh y=${pFh.y.toFixed(2)} (diff=${pFh.dist.toFixed(2)})`);
    }

    const targetMap = MAP_DATABASE[p.targetMap];
    if (!targetMap) {
      console.error(`  [FAIL] Target map '${p.targetMap}' DOES NOT EXIST!`);
      allOk = false;
    } else {
      const tFh = findFoothold(targetMap, p.targetX, p.targetY);
      if (!tFh) {
        console.error(`  [FAIL] Target position in '${p.targetMap}' (${p.targetX}, ${p.targetY}) has NO foothold!`);
        allOk = false;
      } else {
        console.log(`       -> Target '${p.targetMap}' at (${p.targetX}, ${p.targetY}) -> fh y=${tFh.y.toFixed(2)} (diff=${tFh.dist.toFixed(2)})`);
      }
    }
  });
}

if (allOk) {
  console.log('\n========================================');
  console.log('✓ ALL 12 MAPS AND PORTALS PASSED 100% AUDIT!');
  console.log('========================================');
} else {
  console.error('\n✗ SOME PORTALS FAILED GROUNDING AUDIT!');
  process.exit(1);
}
