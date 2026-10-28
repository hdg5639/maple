// js/game.js - Main Game Loop, Camera, Input, Multi-Map Engine, NPC Dialogue, and Combat Rendering

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.map = new GameMap('henesys_hhg');
    this.player = new Player(400, 1318);
    this.monsters = [];
    this.drops = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.damageDigits = [];
    this.skillEffects = [];

    this.camera = { x: 0, y: 0, width: 800, height: 600 };
    this.keys = {};
    this.lastTime = performance.now();
    this.boss = null;
    this.shakeTimer = 0;
    this.shakeMagnitude = 0;

    this.keyConfig = new KeyConfigManager(this);
    this.autoHunt = new AutoHuntManager(this);
    this.ui = new UIManager(this);
    this.network = new NetworkManager(this);

    // Click canvas to interact with other players
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left + this.camera.x;
      const clickY = e.clientY - rect.top + this.camera.y;

      for (const rp of this.network.remotePlayers.values()) {
        if (Math.hypot(rp.x - clickX, rp.y - clickY) < 40) {
          this.ui.showPeerInteractionModal(rp);
          break;
        }
      }
    });

    this.maxMonsters = 24;
    this.spawnTimer = 0;
    this.ambientChatTimer = 10.0;

    this.initCanvasSize();
    this.initInputs();
    this.initMonsters();
    this.loadProgress();
    this.ui.updateQuickslotsForJob(this.player.job);

    requestAnimationFrame((t) => this.loop(t));
    setInterval(() => this.saveProgress(), 15000);
  }

  initCanvasSize() {
    const resize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        this.canvas.width = Math.max(300, container.clientWidth || window.innerWidth);
        this.canvas.height = Math.max(300, container.clientHeight || window.innerHeight - 64);
        this.camera.width = this.canvas.width;
        this.camera.height = this.canvas.height;
      }
    };
    window.addEventListener('resize', resize);
    window.addEventListener('load', resize);
    resize();
  }

  initInputs() {
    this.lastHorizontalKey = null;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const action = this.keyConfig ? this.keyConfig.getAction(e.code) : null;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'AltLeft', 'AltRight', 'ControlLeft', 'ControlRight', 'Tab'].includes(e.code)) {
        e.preventDefault();
      }

      // Generous Portal Detection (horizontal +-75px, vertical +-85px)
      const nearPortal = this.map.portals.find(p =>
        Math.abs(p.x - this.player.x) <= 75 && Math.abs(p.y - this.player.y) <= 85
      );
      // Generous NPC Detection (horizontal +-85px, vertical +-90px)
      const nearNpc = this.map.npcs.find(npc =>
        Math.abs(npc.x - this.player.x) <= 85 && Math.abs(npc.y - this.player.y) <= 90
      );

      // 1. Move Left
      if (action === 'moveLeft' || e.code === 'ArrowLeft') {
        this.keys['ArrowLeft'] = true;
        this.lastHorizontalKey = 'ArrowLeft';
      }
      // 2. Move Right
      if (action === 'moveRight' || e.code === 'ArrowRight') {
        this.keys['ArrowRight'] = true;
        this.lastHorizontalKey = 'ArrowRight';
      }

      // 3. Climb Up / Enter Portal
      if (action === 'climbUp' || e.code === 'ArrowUp') {
        this.keys['ArrowUp'] = true;
        if (nearPortal) {
          this.changeMap(nearPortal.targetMap, nearPortal.targetX, nearPortal.targetY);
          return;
        }
      }

      // 4. Climb Down
      if (action === 'climbDown' || e.code === 'ArrowDown') {
        this.keys['ArrowDown'] = true;
      }

      // 5. Interact (Space): NPC Dialog -> Portal Warp -> Jump
      if (action === 'interact' || e.code === 'Space') {
        if (nearNpc) {
          this.ui.showNpcDialog(nearNpc);
          return;
        }
        if (nearPortal) {
          this.changeMap(nearPortal.targetMap, nearPortal.targetX, nearPortal.targetY);
          return;
        }
        if (this.keys['ArrowDown']) {
          this.player.dropThrough();
        } else {
          this.player.jump(this.keys);
        }
        return;
      }

      // 6. Jump
      if (action === 'jump' || e.code === 'AltLeft' || e.code === 'AltRight') {
        if (this.keys['ArrowDown']) {
          this.player.dropThrough();
        } else {
          this.player.jump(this.keys);
        }
        return;
      }

      // 7. Primary Signature Skill Attack (replaces normal attack)
      if (action === 'primarySkill' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
        this.player.primaryAttack(this);
        return;
      }

      // 8. Quickslot Skills 1 to 8
      if (action && action.startsWith('skill')) {
        const slotIdx = parseInt(action.replace('skill', '')) - 1;
        const skillId = this.getQuickslotSkill(slotIdx);
        if (skillId) this.player.useSkill(skillId, this);
        return;
      }

      // Fallback Hotkeys for Skills 1~8
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        const skillId = this.getQuickslotSkill(0);
        if (skillId) this.player.useSkill(skillId, this);
      } else if (e.code === 'KeyQ') {
        const skillId = this.getQuickslotSkill(1);
        if (skillId) this.player.useSkill(skillId, this);
      } else if (e.code === 'KeyW' && action !== 'climbUp') {
        const skillId = this.getQuickslotSkill(2);
        if (skillId) this.player.useSkill(skillId, this);
      } else if (e.code === 'KeyE') {
        const skillId = this.getQuickslotSkill(3);
        if (skillId) this.player.useSkill(skillId, this);
      } else if (e.code === 'KeyA' && action !== 'moveLeft') {
        const skillId = this.getQuickslotSkill(4);
        if (skillId) this.player.useSkill(skillId, this);
      } else if (e.code === 'KeyS' && action !== 'climbDown') {
        const skillId = this.getQuickslotSkill(5);
        if (skillId) this.player.useSkill(skillId, this);
      } else if (e.code === 'KeyD' && action !== 'moveRight') {
        const skillId = this.getQuickslotSkill(6);
        if (skillId) this.player.useSkill(skillId, this);
      } else if (e.code === 'KeyF' && action !== 'interact') {
        const skillId = this.getQuickslotSkill(7);
        if (skillId) this.player.useSkill(skillId, this);
      }

      // 9. Item Pick Up
      if (action === 'pickUp' || e.code === 'KeyZ') {
        this.pickUpNearbyDrops();
      }

      // 10. Potions
      if (action === 'potionRed' || e.code === 'Digit1') this.player.usePotion('red_potion');
      if (action === 'potionBlue' || e.code === 'Digit2') this.player.usePotion('blue_potion');

      // 11. Auto-hunt
      if (action === 'autoHunt' || e.code === 'KeyR') {
        this.autoHunt.toggle();
      }

      // Boss Mushmom spawn
      if (e.code === 'KeyB') {
        this.spawnBoss();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      const action = this.keyConfig ? this.keyConfig.getAction(e.code) : null;

      if (action === 'moveLeft' || e.code === 'ArrowLeft') {
        this.keys['ArrowLeft'] = false;
        if (this.keys['ArrowRight']) {
          this.lastHorizontalKey = 'ArrowRight';
        } else {
          this.lastHorizontalKey = null;
          this.player.stopHorizontal();
        }
      } else if (action === 'moveRight' || e.code === 'ArrowRight') {
        this.keys['ArrowRight'] = false;
        if (this.keys['ArrowLeft']) {
          this.lastHorizontalKey = 'ArrowLeft';
        } else {
          this.lastHorizontalKey = null;
          this.player.stopHorizontal();
        }
      }

      if (action === 'climbUp' || e.code === 'ArrowUp') {
        this.keys['ArrowUp'] = false;
        if (!this.keys['ArrowDown']) this.player.stopVerticalClimb();
      }
      if (action === 'climbDown' || e.code === 'ArrowDown') {
        this.keys['ArrowDown'] = false;
        if (!this.keys['ArrowUp']) this.player.stopVerticalClimb();
      }
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.lastHorizontalKey = null;
      this.player.stopHorizontal();
      this.player.stopVerticalClimb();
    });

    // Touch / Mobile On-Screen Controls for LAN & Mobile devices
    let touchStartTime = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let activeTouchId = null;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        activeTouchId = touch.identifier;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = performance.now();

        const rect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const width = rect.width;

        // If touched left 40%, move left; right 40%, move right
        if (touchX < width * 0.4) {
          this.keys['ArrowLeft'] = true;
          this.keys['ArrowRight'] = false;
        } else if (touchX > width * 0.6) {
          this.keys['ArrowRight'] = true;
          this.keys['ArrowLeft'] = false;
        }
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      const touch = Array.from(e.touches).find(t => t.identifier === activeTouchId);
      if (!touch) return;
      const deltaY = touch.clientY - touchStartY;
      if (deltaY < -40) {
        this.keys['ArrowUp'] = true;
        this.keys['ArrowDown'] = false;
      } else if (deltaY > 40) {
        this.keys['ArrowDown'] = true;
        this.keys['ArrowUp'] = false;
      }
    }, { passive: true });

    const endTouch = () => {
      if (activeTouchId !== null && touchStartTime > 0) {
        const duration = performance.now() - touchStartTime;
        // Tap gesture detection (< 250ms)
        if (duration < 250) {
          // Check NPC interaction
          const nearNpc = this.map.npcs.find(npc => Math.hypot(npc.x - this.player.x, npc.y - this.player.y) < 75);
          if (nearNpc) {
            this.ui.showNpcDialog(nearNpc);
          } else {
            // Check Portal interaction
            const nearPortal = this.map.portals.find(p => Math.hypot(p.x - this.player.x, p.y - this.player.y) < 55);
            if (nearPortal) {
              this.changeMap(nearPortal.targetMap, nearPortal.targetX, nearPortal.targetY);
            } else if (this.player.onGround) {
              this.player.jump();
            }
          }
        }
      }
      activeTouchId = null;
      touchStartTime = 0;
      this.keys['ArrowLeft'] = false;
      this.keys['ArrowRight'] = false;
      this.keys['ArrowUp'] = false;
      this.keys['ArrowDown'] = false;
      this.player.stopHorizontal();
      this.player.stopVerticalClimb();
    };

    this.canvas.addEventListener('touchend', endTouch, { passive: true });
    this.canvas.addEventListener('touchcancel', endTouch, { passive: true });
  }

  getQuickslotSkill(index) {
    if (this.player.quickslotBindings && this.player.quickslotBindings[index] !== undefined) {
      return this.player.quickslotBindings[index];
    }
    const keys = Object.keys(this.player.skills);
    return keys[index] || null;
  }

  getClassSkillId(index) {
    const keys = Object.keys(this.player.skills);
    return keys[index] || null;
  }

  changePlayerJob(jobName) {
    this.player.setJob(jobName);
    this.ui.updateQuickslotsForJob(jobName);
    this.ui.updateStatsWindow();
    this.ui.updateSkillsWindow();
    this.spawnItemText(this.player.x, this.player.y - 45, `★ ${jobName} 전직 완료! ★`);
    this.ui.addChatMessage('시스템', `축하합니다! ${jobName} 으로 1차 전직을 완료하였습니다.`, 'system');
  }

  // --- MULTI-MAP TRAVEL ENGINE ---
  changeMap(mapKey, spawnX = null, spawnY = null) {
    this.map.loadMap(mapKey);

    this.player.x = spawnX !== null ? spawnX : this.map.defaultSpawn.x;
    this.player.y = spawnY !== null ? spawnY : this.map.defaultSpawn.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.onLadder = false;

    // Immediate Foothold Grounding (ensures player never falls into void on warp)
    const groundFh = this.map.findGroundFootholdAt(this.player.x);
    if (groundFh) {
      this.player.currentFoothold = groundFh;
      this.player.y = groundFh.getYAtX(this.player.x);
      this.player.onGround = true;
    } else {
      this.player.currentFoothold = null;
      this.player.onGround = false;
    }

    // Immediate Camera Snap to new map and player position
    this.snapCameraToPlayer();

    // Reset combat state for new map
    this.monsters = [];
    this.drops = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.damageDigits = [];
    this.skillEffects = [];
    this.boss = null;

    // Rebuild Auto-Hunt Topological Graph
    if (this.autoHunt) {
      this.autoHunt.graph = new FootholdGraph(this.map);
    }

    if (this.map.isBossMap || mapKey === 'zakum_altar') {
      this.spawnZakumBoss();
    } else {
      const bBar = document.getElementById('boss-bar-container');
      if (bBar) bBar.style.display = 'none';
      this.initMonsters();
    }

    // Warp sound & notification
    window.audio.playFlashJump();
    this.spawnItemText(this.player.x, this.player.y - 45, `★ ${this.map.name} 도착! ★`);
    this.ui.addChatMessage('시스템', `[맵 이동] ${this.map.name} 에 입장하였습니다.`, 'system');
    this.ui.addLootLog(`[맵 이동] ${this.map.name}`, 'item');
  }

  initMonsters() {
    this.monsters = [];
    const key = this.map.currentKey;

    if (key === 'zakum_altar') {
      this.spawnZakumBoss();
      return;
    }

    if (key === 'ant_tunnel') {
      // Ant Tunnel: Dungeon depth spawns (Y >= 1000)
      const antSpawns = [
        { type: 'zombie_mushroom', x: 300, y: 1074 },
        { type: 'zombie_mushroom', x: 570, y: 1005 },
        { type: 'green_mushroom', x: 880, y: 1044 },
        { type: 'zombie_mushroom', x: 1060, y: 1009 },
        { type: 'green_mushroom', x: 2950, y: 1076 },
        { type: 'zombie_mushroom', x: 1450, y: 1940 },
        { type: 'green_mushroom', x: 1720, y: 1991 },
        { type: 'zombie_mushroom', x: 2100, y: 1784 },
        { type: 'zombie_mushroom', x: 2470, y: 1957 },
        { type: 'green_mushroom', x: 2660, y: 2156 },
        { type: 'zombie_mushroom', x: 2120, y: 2184 }
      ];
      antSpawns.forEach(sp => this.monsters.push(new Monster(sp.type, sp.x, sp.y)));
      return;
    }

    if (key === 'ellinia') {
      // Ellinia: Giant tree platforms
      const elliniaSpawns = [
        // Ground floor
        { type: 'slime', x: 600, y: 4480 },
        { type: 'slime', x: 1000, y: 4480 },
        { type: 'green_mushroom', x: 1900, y: 4480 },
        { type: 'slime', x: 2300, y: 4480 },
        // Tree branch platforms
        { type: 'green_mushroom', x: 675, y: 4433 },
        { type: 'slime', x: 1670, y: 4369 },
        { type: 'green_mushroom', x: 2100, y: 4263 },
        { type: 'slime', x: 1250, y: 4306 },
        { type: 'green_mushroom', x: 2140, y: 4301 }
      ];
      elliniaSpawns.forEach(sp => this.monsters.push(new Monster(sp.type, sp.x, sp.y)));
      return;
    }

    if (key === 'henesys_town') {
      // Peaceful Town: No aggressive mobs in central town! 3 beginner snails on far outskirts only
      const townSpawns = [
        { type: 'snail', x: 600, y: 880 },
        { type: 'blue_snail', x: 5400, y: 880 },
        { type: 'snail', x: 6100, y: 880 }
      ];
      townSpawns.forEach(sp => this.monsters.push(new Monster(sp.type, sp.x, sp.y)));
      return;
    }

    // Default Henesys Hunting Ground 1 (21 Authentically Placed Monsters Across 4 Tiers)
    const spawnList = [
      // Ground Level (Y = 1320, span 0..2238) - Snails, Slimes, Ribbon Pigs
      { type: 'snail', x: 250, y: 1320 },
      { type: 'snail', x: 500, y: 1320 },
      { type: 'blue_snail', x: 750, y: 1320 },
      { type: 'blue_snail', x: 1000, y: 1320 },
      { type: 'slime', x: 1250, y: 1320 },
      { type: 'slime', x: 1600, y: 1320 },
      { type: 'ribbon_pig', x: 1850, y: 1320 },
      { type: 'ribbon_pig', x: 2100, y: 1320 },

      // Tier 1 Major Platform (Y = 1020, span 360..1878) - Slimes, Red Snails, Ribbon Pigs
      { type: 'snail', x: 450, y: 1020 },
      { type: 'blue_snail', x: 750, y: 1020 },
      { type: 'red_snail', x: 1100, y: 1020 },
      { type: 'slime', x: 1450, y: 1020 },
      { type: 'red_snail', x: 1750, y: 1020 },

      // Tier 2 Major Platform (Y = 780, span 450..1788) - Slimes, Orange Mushrooms, Ribbon Pigs
      { type: 'slime', x: 550, y: 780 },
      { type: 'orange_mushroom', x: 950, y: 780 },
      { type: 'orange_mushroom', x: 1350, y: 780 },
      { type: 'ribbon_pig', x: 1650, y: 780 },

      // Tier 3 Top Platform (Y = 540, span 540..1698) - Green Mushrooms, Zombie Mushrooms
      { type: 'orange_mushroom', x: 650, y: 540 },
      { type: 'green_mushroom', x: 1000, y: 540 },
      { type: 'green_mushroom', x: 1350, y: 540 },
      { type: 'zombie_mushroom', x: 1600, y: 540 }
    ];

    spawnList.forEach(sp => {
      this.monsters.push(new Monster(sp.type, sp.x, sp.y));
    });
  }

  spawnMonster() {
    if (this.map.isBossMap || this.map.currentKey === 'zakum_altar') return;

    if (this.map.currentKey === 'henesys_town') {
      const townMobs = this.monsters.filter(m => m.isAlive());
      if (townMobs.length >= 3) return;
    } else {
      if (this.monsters.filter(m => m.isAlive()).length >= this.maxMonsters) return;
    }

    if (!this.map.footholds || this.map.footholds.length === 0) return;

    // Filter candidate footholds:
    // 1. Substantial platform (length >= 75)
    // 2. Playable area (Y >= 150, excluding phantom sky footholds)
    // 3. For Ant Tunnel: only inside cave depths (Y >= 950, excluding safe entrance)
    const validFhs = this.map.footholds.filter(fh => {
      if (fh.isProp) return false;
      const w = Math.abs(fh.x2 - fh.x1);
      const avgY = (fh.y1 + fh.y2) / 2;
      if (w < 75) return false;
      if (avgY < 150) return false;
      if (this.map.currentKey === 'ant_tunnel' && avgY < 950) return false;
      return true;
    });

    if (validFhs.length === 0) return;

    const fh = validFhs[Math.floor(Math.random() * validFhs.length)];
    const minX = Math.min(fh.x1, fh.x2) + 25;
    const maxX = Math.max(fh.x1, fh.x2) - 25;
    if (maxX <= minX) return;

    const x = minX + Math.random() * (maxX - minX);

    // Prevent spawning within 100px of any NPC (prevents taxi/Stan clutter!)
    if (this.map.npcs) {
      for (const npc of this.map.npcs) {
        if (Math.abs(x - npc.x) < 100 && Math.abs(fh.getYAtX(x) - npc.y) < 50) return;
      }
    }
    const y = fh.getYAtX(x);
    if (!y || y <= 0) return;

    let type = 'snail';
    if (this.map.currentKey === 'henesys_hhg') {
      if (y >= 1200) {
        const r = Math.random();
        type = r < 0.3 ? 'snail' : (r < 0.6 ? 'blue_snail' : (r < 0.85 ? 'red_snail' : 'slime'));
      } else if (y >= 700) {
        const r = Math.random();
        type = r < 0.35 ? 'slime' : (r < 0.7 ? 'orange_mushroom' : 'ribbon_pig');
      } else {
        const r = Math.random();
        type = r < 0.6 ? 'green_mushroom' : 'zombie_mushroom';
      }
    } else if (this.map.currentKey === 'ant_tunnel') {
      const r = Math.random();
      type = r < 0.65 ? 'zombie_mushroom' : 'green_mushroom';
    } else if (this.map.currentKey === 'ellinia') {
      const r = Math.random();
      type = r < 0.6 ? 'slime' : 'green_mushroom';
    } else if (this.map.currentKey === 'henesys_town') {
      type = Math.random() < 0.6 ? 'snail' : 'blue_snail';
    }

    this.monsters.push(new Monster(type, x, y));
  }

  spawnBoss() {
    if (this.boss && this.boss.isAlive()) {
      this.spawnItemText(this.player.x, this.player.y - 45, '이미 머쉬맘이 소환되어 있습니다!');
      return;
    }

    window.audio.playBossRoar();
    this.boss = new Monster('mushmom', 1500, 542);
    this.monsters.push(this.boss);
    this.spawnItemText(this.player.x, this.player.y - 45, '★ [BOSS] 거대 보스 머쉬맘 출현! ★');

    const bBar = document.getElementById('boss-bar-container');
    const pImg = document.getElementById('boss-portrait-img');
    if (bBar) bBar.style.display = 'block';
    if (pImg) pImg.src = 'assets/monsters/mushmom/stand_0.png';
  }

  spawnZakumBoss() {
    this.boss = new ZakumBoss(600, 360);
    this.monsters = [this.boss];
    window.audio.playBossRoar();
    this.spawnItemText(this.player.x, this.player.y - 45, '👑 ★ 고대 거신 자쿰이 소환되었습니다! ★ 👑');
    this.ui.addChatMessage('시스템', '★ 경고: 고대 거신 자쿰이 제단에서 눈을 떴습니다! ★', 'system');

    const bBar = document.getElementById('boss-bar-container');
    const pImg = document.getElementById('boss-portrait-img');
    if (bBar) bBar.style.display = 'block';
    if (pImg) pImg.src = 'assets/monsters/zakum/stand_0.png';
  }

  sendChatMessage(text) {
    if (!text) return;
    if (this.network) {
      this.network.sendChat(text, 'ALL');
    } else {
      this.player.say(text);
      this.ui.addChatMessage(this.player.name, text, 'player');
    }
  }

  pickUpNearbyDrops() {
    let picked = false;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      if (drop.canPickUp(this.player)) {
        if (drop.type === 'meso') {
          this.player.addMeso(drop.amount, this);
          this.ui.addLootLog(`메소를 얻었습니다 (+${drop.amount})`, 'meso');
        } else if (drop.type === 'red_potion') {
          this.player.addItem('red_potion', '빨간 포션', drop.amount, this);
          this.ui.addLootLog(`아이템을 얻었습니다 (빨간 포션 x${drop.amount})`, 'item');
        } else if (drop.type === 'blue_potion') {
          this.player.addItem('blue_potion', '파란 포션', drop.amount, this);
          this.ui.addLootLog(`아이템을 얻었습니다 (파란 포션 x${drop.amount})`, 'item');
        } else {
          this.player.addItem(drop.type, drop.name, drop.amount, this);
          this.ui.addLootLog(`아이템을 얻었습니다 (${drop.name})`, 'item');
        }
        this.drops.splice(i, 1);
        picked = true;
      }
    }
    return picked;
  }

  triggerScreenShake(duration = 0.5, magnitude = 6) {
    this.shakeTimer = duration;
    this.shakeMagnitude = magnitude;
  }

  spawnMissText(x, y) {
    this.floatingTexts.push(new FloatingText(x, y, 'MISS', 'miss', false));
    if (window.audio && window.audio.playMiss) window.audio.playMiss();
  }

  spawnDamageText(x, y, damage, isCrit = false, target = 'monster') {
    this.floatingTexts.push(new FloatingText(x, y, `${damage}`, target === 'monster' ? 'damage' : 'miss', isCrit));
  }

  spawnStaggeredDamage(x, y, damage, isCrit = false) {
    const str = `${damage}`;
    const digitSpacing = isCrit ? 15 : 12;
    const totalW = str.length * digitSpacing;
    const startX = x - totalW / 2 + digitSpacing / 2;

    if (isCrit) {
      this.damageDigits.push(new DamageDigit('CRITICAL', x, y - 22, 0, true));
    }

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const digitX = startX + i * digitSpacing;
      const delay = i * 0.04;
      this.damageDigits.push(new DamageDigit(char, digitX, y, delay, isCrit));
    }
  }

  spawnMesoText(x, y, amount) {
    this.floatingTexts.push(new FloatingText(x, y, `${amount}`, 'meso'));
  }

  spawnExpText(x, y, amount) {
    this.floatingTexts.push(new FloatingText(x, y, `${amount}`, 'exp'));
    this.ui.addLootLog(`경험치를 얻었습니다 (+${amount})`, 'exp');
  }

  spawnItemText(x, y, text) {
    this.floatingTexts.push(new FloatingText(x, y, text, 'item'));
  }

  spawnDrop(type, amount, x, y, name = '') {
    this.drops.push(new DropItem(type, amount, x, y, name));
  }

  // --- Main Update Loop ---
  update(dt) {
    if (!this.autoHunt.enabled) {
      const isLeft = Boolean(
        this.keys['ArrowLeft'] ||
        (this.keyConfig && this.keyConfig.bindings.moveLeft && this.keys[this.keyConfig.bindings.moveLeft.key])
      );
      const isRight = Boolean(
        this.keys['ArrowRight'] ||
        (this.keyConfig && this.keyConfig.bindings.moveRight && this.keys[this.keyConfig.bindings.moveRight.key])
      );

      if (isLeft && isRight) {
        const lastIsRight = (this.lastHorizontalKey === 'ArrowRight' || (this.keyConfig && this.lastHorizontalKey === this.keyConfig.bindings.moveRight?.key));
        if (lastIsRight) {
          this.player.moveRight();
        } else {
          this.player.moveLeft();
        }
      } else if (isLeft) {
        this.player.moveLeft();
      } else if (isRight) {
        this.player.moveRight();
      } else {
        this.player.stopHorizontal();
      }

      const isUp = Boolean(
        this.keys['ArrowUp'] ||
        (this.keyConfig && this.keyConfig.bindings.climbUp && this.keys[this.keyConfig.bindings.climbUp.key])
      );
      const isDown = Boolean(
        this.keys['ArrowDown'] ||
        (this.keyConfig && this.keyConfig.bindings.climbDown && this.keys[this.keyConfig.bindings.climbDown.key])
      );

      if (isUp) {
        this.player.climbUp(this.map);
      } else if (isDown) {
        this.player.climbDown(this.map);
      } else {
        this.player.stopVerticalClimb();
      }
    }

    this.autoHunt.update(dt);
    this.map.update(dt);
    this.player.update(dt, this.map);
    this.pickUpNearbyDrops();

    // 🌐 Real-Time Multiplayer Network Sync
    if (this.network) {
      this.network.update(dt);
      this.network.sendMove(this.player, this.map.currentKey);
    }

    // Ambient chatter ticker (Classic MMO chatter atmosphere)
    this.ambientChatTimer -= dt;
    if (this.ambientChatTimer <= 0) {
      this.ambientChatTimer = 12 + Math.random() * 8;
      const quotes = [
        { sender: 'CWPlayer18', text: 'drop game anyone' },
        { sender: 'CWPlayer23', text: 'r>party for mushmom' },
        { sender: '마정', text: '냄뚜 팝니다 @@@ 10만 메소' },
        { sender: '단풍길드', text: '초보자 길드원 상시 모집중 매너필수' },
        { sender: '제네트', text: '개미굴 좀비버섯 파티 구합니다 2/6' },
        { sender: '신대륙모험가', text: '엘리니아 배 언제 출발해요?' }
      ];
      const q = quotes[Math.floor(Math.random() * quotes.length)];
      this.ui.addChatMessage(q.sender, q.text, 'mock');
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, this);
      if (p.life <= 0 || p.hit) {
        this.projectiles.splice(i, 1);
      }
    }

    // Monster spawns & updates
    this.spawnTimer += dt;
    if (this.spawnTimer >= 1.6) {
      this.spawnTimer = 0;
      this.spawnMonster();
    }

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (m.isAlive()) {
        m.update(dt, this.player, this.map, this);
        if (m.hp <= 0 && !m.isDying()) {
          m.startDying(this.player, this);
          this.autoHunt.recordKill(m.exp, 20);
        }
      } else if (m.isDying()) {
        m.update(dt, this.player, this.map, this);
        if (m.state === 'dead') {
          this.monsters.splice(i, 1);
        }
      } else {
        this.monsters.splice(i, 1);
      }
    }

    // Anti-crowding label Y stagger for overlapping monsters
    for (let i = 0; i < this.monsters.length; i++) {
      const m1 = this.monsters[i];
      m1.labelYOffset = 0;
      for (let j = 0; j < i; j++) {
        const m2 = this.monsters[j];
        if (Math.abs(m1.x - m2.x) < 42 && Math.abs(m1.y - m2.y) < 22) {
          m1.labelYOffset = 15;
          break;
        }
      }
    }

    // Drops update
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.update(dt, this.map);
      if (d.life <= 0) {
        this.drops.splice(i, 1);
      }
    }

    // Damage digits update
    for (let i = this.damageDigits.length - 1; i >= 0; i--) {
      const dd = this.damageDigits[i];
      dd.update(dt);
      if (dd.life <= 0) {
        this.damageDigits.splice(i, 1);
      }
    }

    // Particles update
    window.sprites.updateParticles(dt);

    // Floating text update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.update(dt);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Skill effects update
    for (let i = this.skillEffects.length - 1; i >= 0; i--) {
      const fx = this.skillEffects[i];
      fx.progress += dt / (fx.duration || 0.4);
      if (fx.progress >= 1.0) {
        this.skillEffects.splice(i, 1);
      }
    }

    this.updateCamera(dt);
    this.updateBossBar();
    this.ui.updateHud();
  }

  snapCameraToPlayer() {
    this.camera.width = this.canvas.width;
    this.camera.height = this.canvas.height;
    const targetX = this.player.x - this.camera.width / 2;
    const targetY = this.player.y - this.camera.height * 0.65;
    this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, targetX));
    this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, targetY));
  }

  updateCamera(dt = 0.016) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
    }

    const targetX = this.player.x - this.camera.width / 2;
    const targetY = this.player.y - this.camera.height * 0.65;

    this.camera.x += (targetX - this.camera.x) * 0.12;
    this.camera.y += (targetY - this.camera.y) * 0.12;

    if (this.shakeTimer > 0) {
      this.camera.x += (Math.random() - 0.5) * this.shakeMagnitude * 2;
      this.camera.y += (Math.random() - 0.5) * this.shakeMagnitude * 2;
    }

    this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, this.camera.y));
  }

  updateBossBar() {
    const bBar = document.getElementById('boss-bar-container');
    const bFill = document.getElementById('boss-hp-fill');
    const bText = document.getElementById('boss-hp-text');
    const pImg = document.getElementById('boss-portrait-img');
    const armsCont = document.getElementById('boss-arms-container');
    const armsCount = document.getElementById('boss-arms-count');
    const armsPips = document.getElementById('boss-arms-pips');

    if (this.boss && this.boss.isAlive()) {
      if (bBar) bBar.style.display = 'block';
      const pct = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
      if (bFill) bFill.style.width = `${pct}%`;
      if (bText) bText.innerText = `${this.boss.name} (${this.boss.hp.toLocaleString()} / ${this.boss.maxHp.toLocaleString()})`;
      if (pImg) {
        pImg.src = (typeof ZakumBoss !== 'undefined' && this.boss instanceof ZakumBoss)
          ? 'assets/monsters/zakum/stand_0.png'
          : 'assets/monsters/mushmom/stand_0.png';
      }

      if (this.boss.arms && armsCont && armsCount && armsPips) {
        armsCont.style.display = 'flex';
        const aliveArms = this.boss.arms.filter(a => a.isAlive).length;
        armsCount.innerText = `자쿰의 팔: ${aliveArms}/8`;
        armsPips.innerHTML = this.boss.arms.map(a => {
          const color = a.isAlive ? (a.hp < a.maxHp * 0.4 ? '#ef4444' : '#22c55e') : '#4b5563';
          const title = `${a.name}: ${a.isAlive ? a.hp + '/' + a.maxHp : '파괴됨'}`;
          return `<div title="${title}" style="width: 12px; height: 7px; background: ${color}; border-radius: 2px; border: 1px solid #1c1917;"></div>`;
        }).join('');
      } else if (armsCont) {
        armsCont.style.display = 'none';
      }
    } else {
      if (bBar) bBar.style.display = 'none';
    }
  }

  // --- Main Render Loop ---
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

    // 1. Map & Scenery & Portals
    this.map.draw(ctx, this.camera);

    // 2. NPCs
    if (this.map.npcs) {
      this.map.npcs.forEach(npc => {
        const isNear = Math.hypot(npc.x - this.player.x, npc.y - this.player.y) < 70;
        window.sprites.drawNPC(ctx, npc, isNear);
      });
    }

    // 3. Drops
    this.drops.forEach(d => window.sprites.drawDrop(ctx, d));

    // 4. Monsters & Zakum Boss
    if (this.boss && typeof ZakumBoss !== 'undefined' && this.boss instanceof ZakumBoss && this.boss.isAlive()) {
      window.sprites.drawZakumBoss(ctx, this.boss);
    }
    this.monsters.forEach(m => {
      if (!(typeof ZakumBoss !== 'undefined' && m instanceof ZakumBoss)) {
        window.sprites.drawMonster(ctx, m);
      }
    });

    // 5. Projectiles (Arrows, Shurikens, Energy Bolts)
    this.projectiles.forEach(p => window.sprites.drawProjectile(ctx, p));

    // 6. Player
    window.sprites.drawPlayer(ctx, this.player);

    // 6.5. Remote Peer Players (Multiplayer)
    if (this.network) {
      this.network.drawRemotePlayers(ctx);
      for (const rp of this.network.remotePlayers.values()) {
        if (rp.speechText) {
          window.sprites.drawSpeechBubble(ctx, rp.x, rp.y - rp.height - 18, rp.speechText);
        }
      }
    }

    // 7. Player Speech Bubble
    if (this.player.speechText) {
      window.sprites.drawSpeechBubble(ctx, this.player.x, this.player.y - this.player.height - 18, this.player.speechText);
    }

    // 8. Skill Effects
    this.skillEffects.forEach(fx => window.sprites.drawSkillEffects(ctx, fx));

    // 9. Auto-Hunt Crosshair
    this.autoHunt.drawTargetIndicator(ctx);

    // 10. Particles & Staggered Damage Numbers
    window.sprites.drawDustParticles(ctx);
    this.damageDigits.forEach(dd => window.sprites.drawDamageDigit(ctx, dd));
    this.floatingTexts.forEach(ft => window.sprites.drawFloatingText(ctx, ft));

    // 10.5 Render interaction prompt overlay when standing near Portal or NPC
    const nearP = this.map.portals.find(p => Math.abs(p.x - this.player.x) <= 75 && Math.abs(p.y - this.player.y) <= 85);
    const nearN = this.map.npcs.find(n => Math.abs(n.x - this.player.x) <= 85 && Math.abs(n.y - this.player.y) <= 90);
    if (nearP) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      const text = `[ ↑ / Space ] ${nearP.name} 이동`;
      ctx.font = 'bold 11px sans-serif';
      const tw = ctx.measureText(text).width;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(this.player.x - tw / 2 - 8, this.player.y - 75, tw + 16, 22, 4);
      else ctx.rect(this.player.x - tw / 2 - 8, this.player.y - 75, tw + 16, 22);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText(text, this.player.x, this.player.y - 60);
      ctx.restore();
    } else if (nearN) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      const text = `[ Space ] ${nearN.name} 대화`;
      ctx.font = 'bold 11px sans-serif';
      const tw = ctx.measureText(text).width;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(this.player.x - tw / 2 - 8, this.player.y - 75, tw + 16, 22, 4);
      else ctx.rect(this.player.x - tw / 2 - 8, this.player.y - 75, tw + 16, 22);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText(text, this.player.x, this.player.y - 60);
      ctx.restore();
    }

    ctx.restore();

    // 11. Minimap
    this.drawMinimap(ctx);
  }

  drawMinimap(ctx) {
    const mmW = 160;
    const mmH = 126;
    const mmX = this.canvas.width - mmW - 15;
    const mmY = 15;

    ctx.save();
    // Classic Maple Minimap Frame
    ctx.fillStyle = 'rgba(15, 20, 30, 0.88)';
    ctx.beginPath();
    ctx.roundRect(mmX, mmY, mmW, mmH, 6);
    ctx.fill();
    ctx.strokeStyle = '#c8a86b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dynamic Title Bar
    ctx.font = 'bold 10px "Malgun Gothic", "Gulim", sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'left';
    ctx.fillText(this.map.name, mmX + 8, mmY + 14);

    const mapImg = window.sprites.minimapImg;
    const innerX = mmX + 6;
    const innerY = mmY + 20;
    const innerW = mmW - 12;
    const innerH = mmH - 26;

    if (mapImg && mapImg.complete && mapImg.naturalWidth > 0) {
      ctx.drawImage(mapImg, innerX, innerY, innerW, innerH);
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(innerX, innerY, innerW, innerH);
    }

    const scaleX = innerW / this.map.width;
    const scaleY = innerH / this.map.height;

    // Camera view rectangle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      innerX + this.camera.x * scaleX,
      innerY + this.camera.y * scaleY,
      this.camera.width * scaleX,
      this.camera.height * scaleY
    );

    // Portal dots (cyan)
    if (this.map.portals) {
      ctx.fillStyle = '#38bdf8';
      this.map.portals.forEach(p => {
        ctx.beginPath();
        ctx.arc(innerX + p.x * scaleX, innerY + p.y * scaleY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // NPC dots (blue)
    if (this.map.npcs) {
      ctx.fillStyle = '#60a5fa';
      this.map.npcs.forEach(npc => {
        ctx.beginPath();
        ctx.arc(innerX + npc.x * scaleX, innerY + npc.y * scaleY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Monster dots (red)
    ctx.fillStyle = '#f87171';
    this.monsters.forEach(m => {
      if (m.isAlive()) {
        ctx.beginPath();
        ctx.arc(innerX + m.x * scaleX, innerY + m.y * scaleY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Player dot (yellow)
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(innerX + this.player.x * scaleX, innerY + this.player.y * scaleY, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  loop(currentTime) {
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  saveProgress() {
    try {
      if (typeof StorageManager !== 'undefined') {
        StorageManager.save(this.player, this.map.currentKey);
      }
      if (this.network && this.network.authenticated) {
        this.network.saveCurrentCharacter();
      }
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  loadProgress() {
    try {
      if (typeof StorageManager !== 'undefined') {
        const data = StorageManager.load();
        if (data) {
          this.player.level = data.level || 1;
          this.player.job = data.job || '초보자';
          this.player.exp = data.exp || 0;
          this.player.maxExp = data.maxExp || 15;
          this.player.str = data.str || 12;
          this.player.dex = data.dex || 8;
          this.player.int = data.int || 4;
          this.player.luk = data.luk || 4;
          this.player.ap = data.ap || 5;
          this.player.sp = data.sp || 3;
          this.player.fame = data.fame || 0;
          this.player.meso = data.meso !== undefined ? data.meso : 500;
          if (data.inventory) this.player.inventory = data.inventory;
          if (data.skills) this.player.skills = data.skills;

          this.player.calcDerivedStats();
          this.player.hp = Math.min(this.player.maxHp, data.hp || this.player.maxHp);
          this.player.mp = Math.min(this.player.maxMp, data.mp || this.player.maxMp);
          this.ui.updateQuickslotsForJob(this.player.job);
        }
      }
    } catch (e) {
      console.warn('Load failed:', e);
    }
  }

  resetProgress() {
    localStorage.removeItem('openmaple_save');
    window.location.reload();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
