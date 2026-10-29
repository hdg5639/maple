// js/game.js - Main Game Loop, Camera, Input, Multi-Map Engine, NPC Dialogue, and Combat Rendering

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.map = new GameMap('henesys_hhg');
    this.player = new Player(this.map.defaultSpawn.x, this.map.defaultSpawn.y);
    this.monsters = [];
    this.drops = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.damageDigits = [];
    this.skillEffects = [];

    this.camera = { x: 0, y: 0, width: 800, height: 600 };
    this.keys = {};
    this.lastTime = performance.now();
    this.simulationAccumulator = 0;
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
      const clickX = (e.clientX - rect.left) * this.canvas.width / rect.width / (this.camera.zoom || 1) + this.camera.x;
      const clickY = (e.clientY - rect.top) * this.canvas.height / rect.height / (this.camera.zoom || 1) + this.camera.y;

      for (const rp of this.network.remotePlayers.values()) {
        if (Math.hypot(rp.x - clickX, rp.y - clickY) < 40) {
          this.ui.showPeerInteractionModal(rp);
          break;
        }
      }
    });

    this.maxMonsters = 24;
    this.spawnTimer = 0;

    this.initCanvasSize();
    this.initInputs();
    this.initMonsters();
    this.loadProgress();
    const initial = this.map.resolvePosition(this.player.x, this.player.y);
    Object.assign(this.player, initial, {onGround:true, currentFoothold:this.map.findSpawnFoothold(initial.x, initial.y)});
    this.ui.updateQuickslotsForJob(this.player.job);

    requestAnimationFrame((t) => this.loop(t));
    setInterval(() => this.saveProgress(), 15000);
  }

  initCanvasSize() {
    const overlay = document.getElementById('top-bar-overlay');
    const positionOverlay = () => document.documentElement.style.setProperty('--game-overlay-bottom', `${(overlay?.offsetHeight || 26) + 16}px`);
    const resize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        this.canvas.width = Math.max(1, container.clientWidth);
        this.canvas.height = Math.max(1, container.clientHeight);
        this.ctx.imageSmoothingEnabled = false;
        this.snapCameraToPlayer();
      }
      positionOverlay();
    };
    window.addEventListener('resize', resize);
    window.addEventListener('load', resize);
    resize();
    if (overlay && typeof ResizeObserver !== 'undefined') new ResizeObserver(positionOverlay).observe(overlay);
    const container = document.getElementById('canvas-container');
    if (container && typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(container);
  }

  isTextInput(target) {
    return Boolean(target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable));
  }

  isActionPressed(action) {
    return Boolean(this.touchActions?.[action] || Object.keys(this.keys).some(code =>
      this.keys[code] && this.keyConfig.getAction(code) === action
    ));
  }

  getHorizontalDirection() {
    const left = this.isActionPressed('moveLeft');
    const right = this.isActionPressed('moveRight');
    if (left && right) return this.keyConfig.getAction(this.lastHorizontalKey) === 'moveRight' ? 1 : -1;
    return right ? 1 : (left ? -1 : 0);
  }

  resetInputs() {
    this.keys = {};
    this.touchActions = {};
    this.lastHorizontalKey = null;
    this.horizontalKeyOrder = [];
    this.player.stopHorizontal();
    this.player.vx = 0;
    this.player.stopVerticalClimb();
  }

  jumpPlayer() {
    if (!this.player.onLadder && this.isActionPressed('climbDown')) this.player.dropThrough(this.map);
    else this.player.jump(this.getHorizontalDirection());
  }

  initInputs() {
    this.touchActions = {};
    this.lastHorizontalKey = null;
    this.horizontalKeyOrder = [];

    window.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || ([' ', 'Enter'].includes(e.key) && e.target.closest?.('button, summary'))) return;
      if (this.isTextInput(e.target) || this.isTextInput(document.activeElement)) return;
      const wasPressed = this.keys[e.code];
      this.keys[e.code] = true;

      const action = this.keyConfig ? this.keyConfig.getAction(e.code) : null;

      if (action) {
        e.preventDefault();
      }
      if (e.repeat && ['jump', 'interact', 'climbUp'].includes(action)) return;

      // Generous Portal Detection (horizontal +-75px, vertical +-85px)
      const nearPortal = this.map.portals.find(p =>
        Math.abs(p.x - this.player.x) <= 75 && Math.abs(p.y - this.player.y) <= 85
      );
      // Generous NPC Detection (horizontal +-85px, vertical +-90px)
      const nearNpc = this.map.npcs.find(npc =>
        Math.abs(npc.x - this.player.x) <= 85 && Math.abs(npc.y - this.player.y) <= 90
      );

      // 1. Move Left
      if (action === 'moveLeft') {
        if (!wasPressed && !e.repeat) {
          this.horizontalKeyOrder.push(e.code);
          this.lastHorizontalKey = e.code;
        }
        return;
      }
      // 2. Move Right
      if (action === 'moveRight') {
        if (!wasPressed && !e.repeat) {
          this.horizontalKeyOrder.push(e.code);
          this.lastHorizontalKey = e.code;
        }
        return;
      }

      // 3. Climb Up / Enter Portal
      if (action === 'climbUp') {
        if (nearPortal) {
          this.changeMap(nearPortal.targetMap, nearPortal.targetX, nearPortal.targetY);
          return;
        }
        return;
      }

      // 4. Climb Down
      if (action === 'climbDown') {
        return;
      }

      // 5. Interact (Space): NPC Dialog -> Portal Warp -> Jump
      if (action === 'interact') {
        if (nearNpc) {
          this.ui.showNpcDialog(nearNpc);
          return;
        }
        if (nearPortal) {
          this.changeMap(nearPortal.targetMap, nearPortal.targetX, nearPortal.targetY);
          return;
        }
        this.jumpPlayer();
        return;
      }

      // 6. Jump
      if (action === 'jump') {
        this.jumpPlayer();
        return;
      }

      // 7. Primary Signature Skill Attack (replaces normal attack)
      if (action === 'primarySkill') {
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

      // 9. Item Pick Up
      if (action === 'pickUp') {
        this.pickUpNearbyDrops();
      }

      // 10. Potions
      if (action === 'potionRed') this.player.usePotion('red_potion');
      if (action === 'potionBlue') this.player.usePotion('blue_potion');

      // 11. Auto-hunt
      if (action === 'autoHunt') {
        this.autoHunt.toggle();
      }

      // Boss Mushmom spawn
      if (!action && e.code === 'KeyB') {
        this.spawnBoss();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      const action = this.keyConfig ? this.keyConfig.getAction(e.code) : null;

      this.horizontalKeyOrder = this.horizontalKeyOrder.filter(code => code !== e.code);
      if (this.lastHorizontalKey === e.code) {
        this.lastHorizontalKey = this.horizontalKeyOrder[this.horizontalKeyOrder.length - 1] || null;
      }
      if ((action === 'moveLeft' || action === 'moveRight') && !this.getHorizontalDirection()) {
        this.lastHorizontalKey = null;
        this.player.stopHorizontal();
      }

      if ((action === 'climbUp' || action === 'climbDown') &&
          !this.isActionPressed('climbUp') && !this.isActionPressed('climbDown')) {
        this.player.stopVerticalClimb();
      }
    });

    window.addEventListener('blur', () => this.resetInputs());
    document.addEventListener('focusin', (e) => {
      if (this.isTextInput(e.target)) this.resetInputs();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.resetInputs();
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
          this.touchActions.moveLeft = true;
          this.touchActions.moveRight = false;
          this.lastHorizontalKey = this.keyConfig.bindings.moveLeft?.key;
        } else if (touchX > width * 0.6) {
          this.touchActions.moveRight = true;
          this.touchActions.moveLeft = false;
          this.lastHorizontalKey = this.keyConfig.bindings.moveRight?.key;
        }
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      const touch = Array.from(e.touches).find(t => t.identifier === activeTouchId);
      if (!touch) return;
      const deltaY = touch.clientY - touchStartY;
      if (deltaY < -40) {
        this.touchActions.climbUp = true;
        this.touchActions.climbDown = false;
      } else if (deltaY > 40) {
        this.touchActions.climbDown = true;
        this.touchActions.climbUp = false;
      }
    }, { passive: true });

    const endTouch = (e) => {
      if (e.type !== 'touchcancel' && activeTouchId !== null && touchStartTime > 0) {
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
      this.touchActions = {};
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
    this.raidViewBounds = null;
    document.getElementById('game-container')?.classList.toggle('boss-map', this.map.isBossMap);
    if (this.map.isBossMap) this.ui?.setChatCollapsed?.(true);

    this.player.x = spawnX !== null ? spawnX : this.map.defaultSpawn.x;
    this.player.y = spawnY !== null ? spawnY : this.map.defaultSpawn.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.onLadder = false;
    this.player.currentLadder = null;
    this.player.ladderCooldown = 0;
    this.player.dropThroughTimer = 0;
    this.player.dropThroughFoothold = null;
    this.player.dropThroughUntilY = null;
    this.player.horizontalImpulseTimer = 0;
    this.player.accumulator = 0;
    this.resetInputs();

    // Immediate Foothold Grounding (ensures player never falls into void on warp)
    const arrival = this.map.resolvePosition(this.player.x, this.player.y);
    this.player.x = arrival.x;
    this.player.y = arrival.y;
    const groundFh = this.map.findSpawnFoothold(arrival.x, arrival.y);
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
    this.spawnTimer = 0;

    // Rebuild Auto-Hunt Topological Graph
    if (this.autoHunt) {
      this.autoHunt.graph = new FootholdGraph(this.map);
      this.autoHunt.currentTarget = null;
      this.autoHunt.commandQueue = [];
      this.autoHunt.stuckTimer = 0;
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
    this.saveProgress();
  }

  createMapMonster(site) {
    const point = this.map.resolvePosition(site.x, site.y);
    const fh = this.map.findSpawnFoothold(point.x, point.y);
    if (!fh || this.map.npcs.some(n => Math.hypot(n.x-point.x,n.y-point.y)<100) ||
        this.map.portals.some(p => Math.hypot(p.x-point.x,p.y-point.y)<100) ||
        Math.hypot(this.map.defaultSpawn.x-point.x,this.map.defaultSpawn.y-point.y)<100 ||
        this.monsters.some(m => m.isAlive() && Math.hypot(m.x-point.x,m.y-point.y)<40)) return null;
    const monster = new Monster(site.type, point.x, point.y);
    Object.assign(monster, {onGround:true, currentFoothold:fh, spawnSite:site});
    this.monsters.push(monster);
    return monster;
  }

  initMonsters() {
    this.monsters = [];
    this.maxMonsters = this.map.maxMonsters;
    if (this.map.isBossMap) { this.spawnZakumBoss(); return; }
    if (this.map.isTown) return;
    for (const site of this.map.mobSpawns) this.createMapMonster(site);
  }

  spawnMonster() {
    if (this.map.isTown || this.map.isBossMap || !this.map.mobSpawns.length ||
        this.monsters.filter(m => m.isAlive() || m.isDying()).length >= this.map.maxMonsters) return;
    const sites = [...this.map.mobSpawns].sort(() => Math.random() - 0.5);
    for (const site of sites) if (this.createMapMonster(site)) break;
  }

  spawnBoss() {
    if (this.boss && (this.boss.isAlive() || this.boss.isDying())) {
      this.spawnItemText(this.player.x, this.player.y - 45, '이미 머쉬맘이 소환되어 있습니다!');
      return;
    }

    const site = this.map.bossSpawn;
    if (!site || site.type !== 'mushmom') return;
    const point = this.map.resolvePosition(site.x, site.y);
    window.audio.playBossRoar();
    this.boss = new Monster('mushmom', point.x, point.y);
    this.boss.onGround = true;
    this.boss.currentFoothold = this.map.findSpawnFoothold(point.x, point.y);
    this.monsters.push(this.boss);
    this.spawnItemText(this.player.x, this.player.y - 45, '★ [BOSS] 거대 보스 머쉬맘 출현! ★');

    const bBar = document.getElementById('boss-bar-container');
    const pImg = document.getElementById('boss-portrait-img');
    if (bBar) bBar.style.display = 'block';
    if (pImg) pImg.src = 'assets/monsters/mushmom/stand_0.png';
  }

  spawnZakumBoss() {
    if (this.boss && (this.boss.isAlive() || this.boss.isDying())) return;
    const site = this.map.bossSpawn || {x:600,y:537};
    const ground = this.map.resolvePosition(site.x, site.y);
    this.boss = new ZakumBoss(ground.x, ground.y);
    this.boss.setGroundPosition(ground.x, ground.y);
    const parts = [this.boss.getPartGeometry(), ...this.boss.arms.map(arm => this.boss.getPartGeometry('arm', arm))];
    this.raidViewBounds = {x:0, y:Math.min(140, ...parts.map(p => p.y)) - 16,
      width:this.map.width, bottom:Math.max(...this.map.footholds.map(f => Math.max(f.y1,f.y2))) + 20};
    if (this.canvas) this.snapCameraToPlayer();
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
        } else if (drop.type === 'equip') {
          if (this.player.inventory.equip.length >= 24) continue;
          const zakum = drop.name.includes('자쿰');
          this.player.inventory.equip.push({id:zakum ? 'zakum_helm' : 'pan_lid',
            name:zakum ? '자쿰의 투구' : '냄비 뚜껑', type:zakum ? 'hat' : 'shield',
            equipped:false, def:zakum ? 150 : 10, upgradeSlots:zakum ? 10 : 7,
            str:zakum ? 15 : 0, dex:zakum ? 15 : 0, int:zakum ? 15 : 0, luk:zakum ? 15 : 0});
          this.ui.addLootLog(`장비를 얻었습니다 (${drop.name})`, 'item');
        } else {
          this.player.addItem(drop.type, drop.name, drop.amount, this);
          this.ui.addLootLog(`아이템을 얻었습니다 (${drop.name})`, 'item');
        }
        this.drops.splice(i, 1);
        picked = true;
      }
    }
    if (picked) {
      this.ui.renderInventoryTab('equip');
      this.saveProgress();
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
      const direction = this.getHorizontalDirection();
      if (direction < 0) {
        this.player.moveLeft();
      } else if (direction > 0) {
        this.player.moveRight();
      } else {
        this.player.stopHorizontal();
      }

      const isUp = this.isActionPressed('climbUp');
      const isDown = this.isActionPressed('climbDown');

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

  getCameraTarget() {
    const screenWidth = this.canvas.width;
    const screenHeight = this.canvas.height;
    if (this.map.isBossMap && this.raidViewBounds) {
      const bounds = this.raidViewBounds;
      const topInset = Math.min(140, screenHeight * 0.24);
      const bottomInset = Math.min(76, screenHeight * 0.16);
      const contentHeight = bounds.bottom - bounds.y;
      const zoom = Math.max(0.1, Math.min(1, (screenWidth - 20) / bounds.width,
        (screenHeight - topInset - bottomInset) / contentHeight));
      const spare = Math.max(0, screenHeight - topInset - bottomInset - contentHeight * zoom);
      return {zoom, width:screenWidth / zoom, height:screenHeight / zoom,
        x:bounds.x + bounds.width / 2 - screenWidth / zoom / 2,
        y:bounds.y - (topInset + spare / 2) / zoom};
    }
    const width = screenWidth, height = screenHeight;
    return {zoom:1, width, height,
      x:Math.max(0, Math.min(this.map.width - width, this.player.x - width / 2)),
      y:Math.max(0, Math.min(this.map.height - height, this.player.y - height * 0.65))};
  }

  snapCameraToPlayer() {
    Object.assign(this.camera, this.getCameraTarget());
  }

  updateCamera(dt = 0.016) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
    }

    const target = this.getCameraTarget();
    this.camera.zoom = target.zoom;
    this.camera.width = target.width;
    this.camera.height = target.height;
    this.camera.x += (target.x - this.camera.x) * 0.12;
    this.camera.y += (target.y - this.camera.y) * 0.12;

    if (this.shakeTimer > 0) {
      this.camera.x += (Math.random() - 0.5) * this.shakeMagnitude * 2;
      this.camera.y += (Math.random() - 0.5) * this.shakeMagnitude * 2;
    }

    if (!this.map.isBossMap) {
      this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, this.camera.x));
      this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, this.camera.y));
    }
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
      const liveArms = this.boss.arms?.filter(arm => arm.isAlive) || [];
      const armPhase = liveArms.length > 0;
      const currentHp = armPhase ? this.boss.arms.reduce((sum,arm) => sum+Math.max(0,arm.hp),0) : this.boss.hp;
      const maximumHp = armPhase ? this.boss.arms.reduce((sum,arm) => sum+arm.maxHp,0) : this.boss.maxHp;
      const pct = Math.max(0, currentHp / maximumHp * 100);
      if (bFill) bFill.style.width = `${pct}%`;
      if (bText) bText.innerText = `${this.boss.arms ? (armPhase ? '자쿰 · 팔' : '자쿰 · 본체') : this.boss.name} ${currentHp.toLocaleString()}/${maximumHp.toLocaleString()}`;
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
          return `<div title="${title}" role="meter" aria-label="${a.name}" aria-valuemin="0" aria-valuemax="${a.maxHp}" aria-valuenow="${a.hp}" style="width: 16px; height: 7px; background: #292524; border-radius: 2px; border: 1px solid #1c1917; overflow: hidden;"><div style="height:100%;width:${Math.max(0,a.hp/a.maxHp*100)}%;background:${color}"></div></div>`;
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
    ctx.scale(this.camera.zoom || 1, this.camera.zoom || 1);
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
    if (this.boss && typeof ZakumBoss !== 'undefined' && this.boss instanceof ZakumBoss && (this.boss.isAlive() || this.boss.isDying())) {
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

    const mapImg = this.map.minimapCanvas;
    const innerX = mmX + 6;
    const innerY = mmY + 20;
    const innerW = mmW - 12;
    const innerH = mmH - 26;

    if (mapImg && mapImg.width > 0) {
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
      innerX + Math.max(0,this.camera.x) * scaleX,
      innerY + Math.max(0,this.camera.y) * scaleY,
      Math.max(0, Math.min(this.map.width, this.camera.x+this.camera.width)-Math.max(0,this.camera.x)) * scaleX,
      Math.max(0, Math.min(this.map.height, this.camera.y+this.camera.height)-Math.max(0,this.camera.y)) * scaleY
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

    this.simulationAccumulator += dt;
    while (this.simulationAccumulator >= Physics.FIXED_STEP) {
      this.update(Physics.FIXED_STEP);
      this.simulationAccumulator -= Physics.FIXED_STEP;
    }
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

  restorePlayerData(data) {
    const p = this.player;
    p.name = data.name ?? p.name;
    p.job = data.job ?? p.job;
    p.level = Math.max(1, Math.min(Player.MAX_LEVEL, data.level ?? p.level));
    for (const field of ['exp','str','dex','int','luk','ap','sp','fame','meso']) {
      if (Number.isFinite(data[field]) && data[field] >= 0) p[field] = data[field];
    }
    p.maxExp = Player.expRequiredForLevel(p.level);
    if (data.inventory?.equip && data.inventory?.use && data.inventory?.etc) p.inventory = data.inventory;
    p.initSkillsForJob(p.job);
    for (const [id, saved] of Object.entries(data.skills || {})) {
      if (p.skills[id] && Number.isFinite(saved.level)) p.skills[id].level = Math.max(0, Math.min(p.skills[id].maxLevel, saved.level));
    }
    p.syncSkillCosts();
    if (Array.isArray(data.quickslots) && data.quickslots.length) p.quickslotBindings = data.quickslots;
    const weapon = p.inventory.equip.find(eq => eq.equipped && eq.type === 'weapon');
    if (weapon?.weaponType) p.weaponType = weapon.weaponType;
    p.calcDerivedStats();
    p.hp = Math.max(0, Math.min(p.maxHp, data.hp ?? p.maxHp));
    p.mp = Math.max(0, Math.min(p.maxMp, data.mp ?? p.maxMp));
    if (data.currentMap && MAP_DATABASE[data.currentMap]) this.changeMap(data.currentMap, data.x ?? null, data.y ?? null);
    // A saved death has no live timeout after reload; resume through the normal safe-town revival.
    if (p.hp === 0) p.revive(this);
    this.ui.updateQuickslotsForJob(p.job);
    this.ui.updateHUD();
  }

  loadProgress() {
    try {
      if (typeof StorageManager !== 'undefined') {
        const data = StorageManager.load();
        if (data) this.restorePlayerData(data);
      }
    } catch (e) {
      console.warn('Load failed:', e);
    }
  }

  resetProgress() {
    StorageManager.clear();
    window.location.reload();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
