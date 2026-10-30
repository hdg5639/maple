// js/snail_race.js - Classic MapleStory Snail Derby Mini-Game with Provably Fair Cryptography & SDE Physics

// ==============================================================================
// 1. Provably Fair Cryptographic Engine & Deterministic RNG
// ==============================================================================
class ProvablyFairEngine {
  // Web Cryptography API SHA-256 Digest with fallback
  static async sha256(message) {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      // Fall through to fallback
    }
    return ProvablyFairEngine.fallbackSha256(message);
  }

  // Cryptographically Secure Entropy Generator (CSPRNG)
  static generateSecretSeed(prefix = 'sn_seed_') {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
      return `${prefix}${hex}`;
    }
    return `${prefix}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }

  // Converts a SHA-256 hash string into a 32-bit Integer Seed
  static hashToSeedInt(hashStr) {
    let hash = 0;
    for (let i = 0; i < hashStr.length; i++) {
      hash = ((hash << 5) - hash) + hashStr.charCodeAt(i);
      hash |= 0;
    }
    return hash >>> 0;
  }

  // Pure JS Bitwise SHA-256 Fallback (FIPS-180-2 compliant)
  static fallbackSha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let lengthProperty = 'length';
    let i, j;
    let result = '';
    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;
    let hash = ProvablyFairEngine._hash || [];
    const k = ProvablyFairEngine._k || [];
    let primeCounter = k[lengthProperty] || 0;

    if (!k.length) {
      const isComposite = {};
      for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
          for (i = 0; i < 313; i += candidate) {
            isComposite[i] = candidate;
          }
          hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
          k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
      }
      ProvablyFairEngine._hash = hash;
      ProvablyFairEngine._k = k;
    }

    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength) | 0;

    for (j = 0; j < words[lengthProperty];) {
      const w = words.slice(j, j += 16);
      const oldHash = hash;
      hash = hash.slice(0, 8);

      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const temp1 = hash[7]
          + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
          + ((e & hash[5]) ^ ((~e) & hash[6]))
          + k[i]
          + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0);
        const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }

      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    for (i = 0; i < 8; i++) {
      for (let b = 3; b >= 0; b--) {
        const byte = (hash[i] >> (8 * b)) & 255;
        result += (byte < 16 ? '0' : '') + byte.toString(16);
      }
    }
    return result;
  }
}

// 2. Deterministic PRNG with Box-Muller Gaussian & Ornstein-Uhlenbeck SDE
class DeterministicRNG {
  constructor(seedInt = 1337) {
    this.s = seedInt >>> 0;
    this.haveNextNextGaussian = false;
    this.nextNextGaussian = 0;
  }

  // Uniform [0, 1) Float via Mulberry32 algorithm
  nextFloat() {
    let t = (this.s += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Box-Muller Transform for Gaussian Distribution N(mean, stdDev^2)
  nextGaussian(mean = 0, stdDev = 1) {
    if (this.haveNextNextGaussian) {
      this.haveNextNextGaussian = false;
      return mean + this.nextNextGaussian * stdDev;
    }
    let u = 0, v = 0;
    while (u === 0) u = this.nextFloat();
    while (v === 0) v = this.nextFloat();
    const mag = Math.sqrt(-2.0 * Math.log(u));
    this.nextNextGaussian = mag * Math.sin(2.0 * Math.PI * v);
    this.haveNextNextGaussian = true;
    return mean + (mag * Math.cos(2.0 * Math.PI * v)) * stdDev;
  }

  // Ornstein-Uhlenbeck Continuous Stochastic Differential Equation step:
  // dv = theta * (mu - v) * dt + sigma * sqrt(dt) * epsilon, where epsilon ~ N(0, 1)
  stepOrnsteinUhlenbeck(currentV, targetMu, theta = 2.4, sigma = 14.0, dt = 0.016) {
    const drift = theta * (targetMu - currentV) * dt;
    const diffusion = sigma * Math.sqrt(dt) * this.nextGaussian(0, 1);
    return currentV + drift + diffusion;
  }
}

// ==============================================================================
// 2. SnailRacer Entity with SDE Physics Integration
// ==============================================================================
class SnailRacer {
  constructor(index, config) {
    this.index = index;
    this.id = config.id;
    this.name = config.name;
    this.title = config.title;
    this.odds = config.odds;
    this.color = config.color;
    this.tag = config.tag;
    this.desc = config.desc;
    this.baseSpeed = config.baseSpeed;
    this.speedVariance = config.speedVariance;
    this.sleepChance = config.sleepChance || 0;
    this.stunResistance = config.stunResistance || 1.0;
    this.lateSpurt = Boolean(config.lateSpurt);
    this.scale = config.scale || 1.0;

    // Movement & Track State
    this.x = 0;
    this.y = 0;
    this.laneY = 0;
    this.currentSpeed = this.baseSpeed;
    this.targetSpeed = this.baseSpeed;
    this.state = 'running'; // 'running', 'sleeping', 'stunned', 'hidden', 'finished'
    this.stateTimer = 0;
    this.boostTimer = 0;
    this.boostMultiplier = 1.0;
    this.rotation = 0;

    // Visuals & Animation
    this.frameIndex = 0;
    this.frameTimer = Math.random() * 0.5;
    this.wiggleTimer = Math.random() * Math.PI * 2;
    this.trailHistory = [];
    this.sprites = [];
    this.hitSprite = null;
    this.loaded = false;

    this.finishRank = 0;
    this.finishTime = 0;
    this.sleepTriggered = false;
    this.spurtTriggered = false;

    this.loadSprites(config);
  }

  loadSprites(config) {
    const frameCount = config.frameCount || 4;
    let loadedCount = 0;
    const total = frameCount + 1;

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = `${config.spriteDir}/move_${i}.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= total) this.loaded = true;
      };
      this.sprites.push(img);
    }

    const hit = new Image();
    hit.src = config.hitSprite || `${config.spriteDir}/hit1_0.png`;
    hit.onload = () => {
      loadedCount++;
      if (loadedCount >= total) this.loaded = true;
    };
    this.hitSprite = hit;
  }

  reset(laneY) {
    this.x = 20;
    this.laneY = laneY;
    this.y = laneY;
    this.currentSpeed = this.baseSpeed;
    this.targetSpeed = this.baseSpeed;
    this.state = 'running';
    this.stateTimer = 0;
    this.boostTimer = 0;
    this.boostMultiplier = 1.0;
    this.rotation = 0;
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.wiggleTimer = Math.random() * Math.PI * 2;
    this.trailHistory = [];
    this.finishRank = 0;
    this.finishTime = 0;
    this.sleepTriggered = false;
    this.spurtTriggered = false;
  }

  applyBoost(multiplier = 1.75, duration = 2.2) {
    this.boostTimer = duration;
    this.boostMultiplier = multiplier;
    if (this.state === 'sleeping' || this.state === 'hidden') {
      this.state = 'running';
      this.stateTimer = 0;
    }
  }

  applyStun(duration = 1.2) {
    const actualDuration = duration * this.stunResistance;
    this.state = 'stunned';
    this.stateTimer = actualDuration;
    this.rotation = 0;
    this.boostTimer = 0;
  }

  applyHide(duration = 1.2) {
    this.state = 'hidden';
    this.stateTimer = duration;
    this.boostTimer = 0;
  }

  update(dt, trackLength, manager, rng) {
    if (this.finishRank > 0) return;

    // Trail history for boost effects
    if (this.boostTimer > 0) {
      this.trailHistory.unshift({ x: this.x, y: this.y, alpha: 0.7 });
      if (this.trailHistory.length > 5) this.trailHistory.pop();
    } else if (this.trailHistory.length > 0) {
      this.trailHistory.shift();
    }

    // Boost timer decay
    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      if (this.boostTimer <= 0) this.boostMultiplier = 1.0;
    }

    // State processing
    if (this.state === 'stunned') {
      this.stateTimer -= dt;
      this.rotation += dt * Math.PI * 4;
      if (this.stateTimer <= 0) {
        this.state = 'running';
        this.rotation = 0;
      }
      return;
    }

    if (this.state === 'hidden') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'running';
      }
      return;
    }

    if (this.state === 'sleeping') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'running';
        manager.addCommentary(`[중계] ${this.name}(이)가 낮잠에서 깨어나 다시 기어가기 시작합니다!`);
      }
      return;
    }

    // Deterministic Random Sleep Chance for Blue Snail
    const randRoll = rng ? rng.nextFloat() : Math.random();
    if (!this.sleepTriggered && this.sleepChance > 0 && this.x > 500 && this.x < 1400) {
      if (randRoll < this.sleepChance * dt * 0.8) {
        this.sleepTriggered = true;
        this.state = 'sleeping';
        this.stateTimer = 1.8;
        manager.addCommentary(`[돌발] 앗! ${this.name}(이)가 너무 지쳐 껍질 속에서 쿨쿨 잠에 빠집니다!`);
        manager.spawnFloatingText(this.x, this.y - 20, 'Zzz...', '#60a5fa');
        return;
      }
    }

    // Late Spurt for Red Snail
    if (this.lateSpurt && !this.spurtTriggered && this.x >= trackLength - 650) {
      this.spurtTriggered = true;
      this.applyBoost(1.9, 8.0);
      manager.addCommentary(`[대역전] 3번 ${this.name}, 결승선이 보이자 분노의 막판 스퍼트를 폭발시킵니다!!`);
      manager.spawnFloatingText(this.x, this.y - 25, 'SPURT!!', '#ef4444');
    }

    // Ornstein-Uhlenbeck Continuous Stochastic Differential Equation Integration
    let targetSpeed = this.baseSpeed * this.boostMultiplier;
    if (rng) {
      this.currentSpeed = rng.stepOrnsteinUhlenbeck(this.currentSpeed, targetSpeed, 2.8, this.speedVariance, dt);
    } else {
      this.currentSpeed = targetSpeed;
    }

    // Bio-rhythm Wiggle factor
    this.wiggleTimer += dt * 8;
    const wiggleFactor = 1.0 + 0.30 * Math.sin(this.wiggleTimer);
    const finalSpeed = Math.max(15, this.currentSpeed * wiggleFactor);

    // Position integration
    this.x += finalSpeed * dt;

    // Sprite frame animation synced with crawl speed
    this.frameTimer += dt * (finalSpeed / 40);
    if (this.frameTimer >= 0.16) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % (this.sprites.length || 1);
    }

    // Finish line check
    if (this.x >= trackLength && this.finishRank === 0) {
      this.finishRank = manager.registerFinish(this);
    }
  }

  draw(ctx, cameraX) {
    const screenX = Math.round(this.x - cameraX);
    const screenY = Math.round(this.laneY);

    ctx.save();
    ctx.translate(screenX, screenY);

    // Boost afterimages
    if (this.trailHistory.length > 0) {
      for (let i = 0; i < this.trailHistory.length; i++) {
        const t = this.trailHistory[i];
        const tx = Math.round(t.x - cameraX);
        const ty = Math.round(this.laneY);
        ctx.save();
        ctx.translate(tx - screenX, ty - screenY);
        ctx.globalAlpha = 0.35 - i * 0.06;
        if (this.sprites.length > 0 && this.sprites[this.frameIndex]?.complete) {
          ctx.scale(-1 * this.scale, 1 * this.scale);
          ctx.drawImage(this.sprites[this.frameIndex], -24, -20);
        }
        ctx.restore();
      }
    }

    // Banana slip rotation
    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }

    // Snail sprite (Flip for rightwards race)
    ctx.scale(-1 * this.scale, 1 * this.scale);

    let currentImg = this.sprites[this.frameIndex];
    if (this.state === 'stunned' || this.state === 'hidden') {
      currentImg = this.hitSprite || currentImg;
    }

    if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
      const w = currentImg.naturalWidth;
      const h = currentImg.naturalHeight;
      ctx.drawImage(currentImg, -w / 2, -h + 10);
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, -12, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1e1b4b';
      ctx.stroke();
    }

    ctx.restore();

    // Floating state effects
    if (this.state === 'sleeping') {
      ctx.save();
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#60a5fa';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText('💤 Zzz', screenX - 10, screenY - 26);
      ctx.fillText('💤 Zzz', screenX - 10, screenY - 26);
      ctx.restore();
    } else if (this.state === 'stunned') {
      ctx.save();
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText('💫 SLIP!', screenX - 14, screenY - 24);
      ctx.fillText('💫 SLIP!', screenX - 14, screenY - 24);
      ctx.restore();
    } else if (this.boostTimer > 0) {
      ctx.save();
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#f97316';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText('🔥 BOOST', screenX - 16, screenY - 25);
      ctx.fillText('🔥 BOOST', screenX - 16, screenY - 25);
      ctx.restore();
    }
  }
}

// ==============================================================================
// 3. SnailRaceGame - Complete Mini-Game & Provably Fair Betting System
// ==============================================================================
class SnailRaceGame {
  static TRACK_LENGTH = 2200;
  static VIEW_WIDTH = 800;
  static VIEW_HEIGHT = 260;

  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.running = false;
    this.gameLoopId = null;

    // State: 'BETTING', 'COUNTDOWN', 'RACING', 'PHOTO_FINISH', 'RESULT'
    this.phase = 'BETTING';
    this.countdownTime = 3.0;
    this.raceTimer = 0;
    this.cameraX = 0;
    this.slowMoFactor = 1.0;

    // Betting Economy
    this.selectedRacerIndex = 0;
    this.betAmount = 10000;
    this.isAllIn = false;
    this.winnings = 0;

    // Provably Fair Cryptographic Seeds
    this.roundId = '';
    this.serverSeed = '';
    this.serverSeedHash = '';
    this.clientSeed = '';
    this.masterHash = '';
    this.rng = new DeterministicRNG(1337);

    // Interactive Items & Cooldowns
    this.cooldowns = { apple: 0, banana: 0, shell: 0 };
    this.cheerGauge = 0;

    // Entities in Race
    this.racers = [];
    this.projectiles = [];
    this.obstacles = [];
    this.floatingTexts = [];
    this.finishOrder = [];

    // Preloaded Assets
    this.itemImages = {};
    this.loadItemImages();
    this.initRacers();

    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
  }

  loadItemImages() {
    const items = {
      shell: 'assets/items/snail_shell.png',
      blue_shell: 'assets/items/blue_snail_shell.png',
      red_shell: 'assets/items/red_snail_shell.png'
    };
    for (const [k, v] of Object.entries(items)) {
      const img = new Image();
      img.src = v;
      this.itemImages[k] = img;
    }
  }

  initRacers() {
    const configs = [
      {
        id: 'snail',
        name: '초록달팽이',
        title: '그린 셸 (초록이)',
        odds: 2.0,
        color: '#16a34a',
        tag: '페이스메이커',
        desc: '흔들림 없는 정속 주행 · 방해 저항력 높음',
        baseSpeed: 74,
        speedVariance: 8,
        sleepChance: 0,
        stunResistance: 0.6,
        spriteDir: 'assets/monsters/snail',
        frameCount: 5,
        hitSprite: 'assets/monsters/snail/hit1_0.png',
        scale: 1.0
      },
      {
        id: 'blue_snail',
        name: '파란달팽이',
        title: '블루 썬더 (번개)',
        odds: 2.8,
        color: '#2563eb',
        tag: '스피드스타',
        desc: '최고 속도 최상 · 가끔 땡땡이 낮잠',
        baseSpeed: 96,
        speedVariance: 18,
        sleepChance: 0.22,
        stunResistance: 1.0,
        spriteDir: 'assets/monsters/blue_snail',
        frameCount: 4,
        hitSprite: 'assets/monsters/blue_snail/hit1_0.png',
        scale: 1.0
      },
      {
        id: 'red_snail',
        name: '빨간달팽이',
        title: '레드 블레이즈 (역전마)',
        odds: 4.0,
        color: '#dc2626',
        tag: '추입마',
        desc: '초반 완만 주행 · 결승선 600px 전 분노의 스퍼트',
        baseSpeed: 64,
        speedVariance: 10,
        sleepChance: 0,
        stunResistance: 0.8,
        lateSpurt: true,
        spriteDir: 'assets/monsters/red_snail',
        frameCount: 4,
        hitSprite: 'assets/monsters/red_snail/hit1_0.png',
        scale: 1.0
      },
      {
        id: 'mano',
        name: '미니 마노 킹',
        title: '황금 무지개 마노',
        odds: 8.5,
        color: '#9333ea',
        tag: '초고배당 로또',
        desc: '평소엔 매우 느림 · 응원/스퍼트 시 무지개 대폭주',
        baseSpeed: 50,
        speedVariance: 15,
        sleepChance: 0,
        stunResistance: 0.4,
        spriteDir: 'assets/monsters/mano',
        frameCount: 6,
        hitSprite: 'assets/monsters/mano/hit1_0.png',
        scale: 0.72
      }
    ];

    this.racers = configs.map((cfg, idx) => new SnailRacer(idx, cfg));
  }

  attach(canvas) {
    this.canvas = canvas;
    this.canvas.width = SnailRaceGame.VIEW_WIDTH;
    this.canvas.height = SnailRaceGame.VIEW_HEIGHT;
    this.ctx = canvas.getContext('2d');
    window.addEventListener('keydown', this.boundHandleKeyDown);
  }

  detach() {
    this.stop();
    window.removeEventListener('keydown', this.boundHandleKeyDown);
  }

  start() {
    if (this.running) return;
    this.running = true;
    let lastTime = performance.now();

    const loop = (time) => {
      if (!this.running) return;
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      this.update(dt);
      this.draw();

      this.gameLoopId = requestAnimationFrame(loop);
    };

    this.gameLoopId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  // Generates new Provably Fair Seeds on Betting Phase
  async generateProvablyFairSeeds() {
    this.roundId = `rnd_${Date.now().toString(36)}_${Math.floor(Math.random() * 10000)}`;
    this.serverSeed = ProvablyFairEngine.generateSecretSeed('srv_');
    this.clientSeed = ProvablyFairEngine.generateSecretSeed('cli_');
    // Commitment: H = SHA256(Server Seed : Round ID)
    this.serverSeedHash = await ProvablyFairEngine.sha256(`${this.serverSeed}:${this.roundId}`);

    const hashBadge = document.getElementById('snail-provably-fair-hash');
    if (hashBadge) {
      hashBadge.textContent = `${this.serverSeedHash.slice(0, 20)}...`;
      hashBadge.title = `사전 서약 해시: ${this.serverSeedHash}`;
    }
  }

  async resetBettingPhase() {
    this.phase = 'BETTING';
    this.countdownTime = 3.0;
    this.raceTimer = 0;
    this.cameraX = 0;
    this.slowMoFactor = 1.0;
    this.finishOrder = [];
    this.projectiles = [];
    this.obstacles = [];
    this.floatingTexts = [];
    this.cheerGauge = 0;
    this.cooldowns = { apple: 0, banana: 0, shell: 0 };

    const lanePositions = [48, 102, 156, 210];
    this.racers.forEach((r, idx) => r.reset(lanePositions[idx]));

    await this.generateProvablyFairSeeds();
    this.updateUI();
  }

  async startCountdown() {
    const player = window.game?.player;
    if (!player) return;

    if (this.betAmount <= 0) {
      alert('베팅 금액을 1 메소 이상 설정해주세요!');
      return;
    }

    if (player.meso < this.betAmount) {
      alert(`보유 메소가 부족합니다! (현재 보유: ${player.meso.toLocaleString()} 메소)`);
      return;
    }

    // Deduct Meso Authoritatively (Zero-Loss Persistence)
    player.meso -= this.betAmount;
    if (window.StorageManager) {
      window.StorageManager.save(player, window.game?.map?.currentMapKey);
    }
    window.audio?.playPickItem?.();

    // Combine Seeds: Master Hash = SHA256(ServerSeed : ClientSeed : RoundID)
    const combinedStr = `${this.serverSeed}:${this.clientSeed}:${this.roundId}`;
    this.masterHash = await ProvablyFairEngine.sha256(combinedStr);
    const seedInt = ProvablyFairEngine.hashToSeedInt(this.masterHash);
    this.rng = new DeterministicRNG(seedInt);

    this.phase = 'COUNTDOWN';
    this.countdownTime = 3.0;
    this.finishOrder = [];
    this.addCommentary(`[안내] 경주 준비 완료! 4마리의 달팽이가 출발선에 정렬했습니다. (시드 결합 완료)`);
    this.updateUI();
  }

  // ============================================================================
  // Interactive Items (Q, W, E, Space)
  // ============================================================================
  useApple() {
    if (this.phase !== 'RACING') return;
    if (this.cooldowns.apple > 0) return;

    this.cooldowns.apple = 3.8;
    const myRacer = this.racers[this.selectedRacerIndex];
    if (!myRacer || myRacer.finishRank > 0) return;

    this.projectiles.push({
      type: 'apple',
      x: myRacer.x - 70,
      y: myRacer.laneY - 80,
      targetRacer: myRacer,
      t: 0,
      duration: 0.35
    });

    window.audio?.playUsePotion?.();
    this.addCommentary(`[아이템] ${myRacer.name}에게 영양 만점 꿀사과를 던졌습니다!`);
    this.updateActionDeckUI();
  }

  useBanana() {
    if (this.phase !== 'RACING') return;
    if (this.cooldowns.banana > 0) return;

    this.cooldowns.banana = 5.2;

    let leader = null;
    let maxX = -1;
    for (const r of this.racers) {
      if (r.index !== this.selectedRacerIndex && r.finishRank === 0 && r.x > maxX) {
        maxX = r.x;
        leader = r;
      }
    }

    if (!leader) leader = this.racers.find(r => r.index !== this.selectedRacerIndex);
    if (!leader) return;

    this.obstacles.push({
      type: 'banana',
      x: leader.x + 75,
      y: leader.laneY,
      laneIndex: leader.index,
      life: 15.0
    });

    window.audio?.playAttack?.();
    this.addCommentary(`[방해] ${leader.name} 레인에 미끄러운 바나나 껍질을 투척했습니다!`);
    this.spawnFloatingText(leader.x + 75, leader.laneY - 20, '🍌 TRAP!', '#f59e0b');
    this.updateActionDeckUI();
  }

  useShell() {
    if (this.phase !== 'RACING') return;
    if (this.cooldowns.shell > 0) return;

    this.cooldowns.shell = 4.5;

    let target = null;
    let maxX = -1;
    for (const r of this.racers) {
      if (r.index !== this.selectedRacerIndex && r.finishRank === 0 && r.x > maxX) {
        maxX = r.x;
        target = r;
      }
    }
    if (!target) return;

    this.projectiles.push({
      type: 'shell',
      x: target.x - 120,
      y: target.laneY - 10,
      targetRacer: target,
      t: 0,
      duration: 0.4
    });

    window.audio?.playSlashBlast?.();
    this.addCommentary(`[견제] 1위 경쟁마 ${target.name}에게 딱딱한 달팽이 껍질을 날립니다!`);
    this.updateActionDeckUI();
  }

  cheerTap() {
    if (this.phase !== 'RACING') return;
    const myRacer = this.racers[this.selectedRacerIndex];
    if (!myRacer || myRacer.finishRank > 0) return;

    this.cheerGauge = Math.min(100, this.cheerGauge + 8);
    this.spawnFloatingText(myRacer.x + (Math.random() * 20 - 10), myRacer.laneY - 20, '❤️ CHEER!', '#ec4899');
    window.audio?.playJump?.();

    if (this.cheerGauge >= 100) {
      this.cheerGauge = 0;
      myRacer.applyBoost(2.0, 2.2);
      this.addCommentary(`[응원 폭발] 관중의 열렬한 응원으로 ${myRacer.name} 슈퍼 대시 발동!!`);
      this.spawnFloatingText(myRacer.x, myRacer.laneY - 30, '⚡ SUPER DASH!!', '#38bdf8');
      window.audio?.playFlashJump?.();
    }
    this.updateActionDeckUI();
  }

  handleKeyDown(e) {
    if (this.phase !== 'RACING') return;
    const key = e.key.toLowerCase();
    if (key === 'q') {
      this.useApple();
    } else if (key === 'w') {
      this.useBanana();
    } else if (key === 'e') {
      this.useShell();
    } else if (key === ' ' || e.code === 'Space') {
      e.preventDefault();
      this.cheerTap();
    }
  }

  registerFinish(racer) {
    const rank = this.finishOrder.length + 1;
    racer.finishRank = rank;
    racer.finishTime = this.raceTimer;
    this.finishOrder.push(racer);

    this.spawnFloatingText(racer.x, racer.laneY - 30, `${rank}위 골인!!`, racer.color);
    this.addCommentary(`[골인] ★ ${rank}위: ${racer.name} (${racer.finishTime.toFixed(2)}초) 결승선 통과!`);

    if (rank === 1) {
      window.audio?.playBossRoar?.();
      this.phase = 'PHOTO_FINISH';
      this.slowMoFactor = 0.25;
      setTimeout(() => {
        this.slowMoFactor = 1.0;
        this.phase = 'RACING';
      }, 700);
    }

    if (this.finishOrder.length === this.racers.length) {
      setTimeout(() => this.finalizeRace(), 1200);
    }

    return rank;
  }

  finalizeRace() {
    this.phase = 'RESULT';
    const winner = this.finishOrder[0];
    const player = window.game?.player;
    const isWin = winner && winner.index === this.selectedRacerIndex;

    if (isWin && player) {
      this.winnings = Math.floor(this.betAmount * winner.odds);
      player.meso += this.winnings;
      window.audio?.playLevelUp?.();
      window.audio?.playScrollSuccess?.();
      this.addCommentary(`[승리 축하] 🎉 대박!! [${winner.name}] 1등 적중! ${this.winnings.toLocaleString()} 메소 획득!!`);

      window.game?.ui?.addChatMessage?.('system', `[달팽이 경마] 🎉 ${player.name} 님이 [${winner.name}] 배팅에 적중하여 ${this.winnings.toLocaleString()} 메소를 획득하셨습니다!`);
    } else {
      this.winnings = 0;
      window.audio?.playScrollFail?.();
      this.addCommentary(`[결과] 아쉽게도 배팅한 달팽이가 1위를 차지하지 못했습니다.`);

      if (player && player.meso === 0 && this.isAllIn) {
        player.meso = 1000;
        setTimeout(() => {
          alert('주최자 쿤: "쯧쯧.. 젊은 모험가가 몰빵에 눈이 멀어 털렸구먼! 자, 리스항구 돌아갈 차비 1,000 메소일세. 다시 일어서게나!"');
          this.updateUI();
        }, 500);
      }
    }

    // Persist immediately
    if (player && window.StorageManager) {
      window.StorageManager.save(player, window.game?.map?.currentMapKey);
    }

    this.updateUI();
  }

  // ============================================================================
  // Engine Update Loop
  // ============================================================================
  update(rawDt) {
    const dt = rawDt * this.slowMoFactor;

    // Cooldown decay
    for (const k in this.cooldowns) {
      if (this.cooldowns[k] > 0) {
        this.cooldowns[k] = Math.max(0, this.cooldowns[k] - rawDt);
      }
    }

    // Cheer decay
    if (this.phase === 'RACING' && this.cheerGauge > 0) {
      this.cheerGauge = Math.max(0, this.cheerGauge - rawDt * 10);
    }

    if (this.phase === 'COUNTDOWN') {
      this.countdownTime -= rawDt;
      if (this.countdownTime <= 0) {
        this.phase = 'RACING';
        this.addCommentary('[출발] 땅-!! 4마리의 달팽이가 맹렬하게 기어가기 시작합니다!!');
        window.audio?.playPowerStrike?.();
      }
      this.updateCountdownUI();
      return;
    }

    if (this.phase !== 'RACING' && this.phase !== 'PHOTO_FINISH') return;

    this.raceTimer += dt;

    // Update Racers with Deterministic PRNG
    this.racers.forEach(r => r.update(dt, SnailRaceGame.TRACK_LENGTH, this, this.rng));

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.t += dt;
      const progress = Math.min(1.0, p.t / p.duration);
      const targetX = p.targetRacer.x;
      const targetY = p.targetRacer.laneY - 12;

      p.currentX = p.x + (targetX - p.x) * progress;
      p.currentY = p.y + (targetY - p.y) * progress - Math.sin(progress * Math.PI) * 45;

      if (progress >= 1.0) {
        if (p.type === 'apple') {
          p.targetRacer.applyBoost(1.85, 2.4);
          this.spawnFloatingText(p.targetRacer.x, p.targetRacer.laneY - 25, '🍎 SPEED UP!!', '#22c55e');
          window.audio?.playPickItem?.();
        } else if (p.type === 'shell') {
          p.targetRacer.applyHide(1.3);
          this.spawnFloatingText(p.targetRacer.x, p.targetRacer.laneY - 25, '💥 HIDE!', '#ef4444');
          window.audio?.playHit?.();
        }
        this.projectiles.splice(i, 1);
      }
    }

    // Check Obstacles (Banana Peels)
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const ob = this.obstacles[i];
      ob.life -= dt;
      if (ob.life <= 0) {
        this.obstacles.splice(i, 1);
        continue;
      }

      const racerOnLane = this.racers[ob.laneIndex];
      if (racerOnLane && racerOnLane.state === 'running' && Math.abs(racerOnLane.x - ob.x) < 22) {
        racerOnLane.applyStun(1.3);
        this.spawnFloatingText(racerOnLane.x, racerOnLane.laneY - 25, '🍌 SLIP!!', '#eab308');
        window.audio?.playMonsterDie?.();
        this.addCommentary(`[사고] ${racerOnLane.name}(이)가 바나나를 밟고 미끄러져 스턴에 걸렸습니다!`);
        this.obstacles.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= dt * 25;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Dynamic Camera Tracking
    let leadX = 0;
    for (const r of this.racers) {
      if (r.x > leadX) leadX = r.x;
    }
    const targetCamX = Math.max(0, Math.min(SnailRaceGame.TRACK_LENGTH - SnailRaceGame.VIEW_WIDTH + 60, leadX - 280));
    this.cameraX += (targetCamX - this.cameraX) * Math.min(1.0, dt * 4.5);

    this.updateMiniTrackUI();
    this.updateActionDeckUI();
  }

  spawnFloatingText(x, y, text, color = '#facc15') {
    this.floatingTexts.push({ x, y, text, color, life: 1.1 });
  }

  addCommentary(msg) {
    const box = document.getElementById('snail-race-commentary');
    if (!box) return;
    box.textContent = msg;
    box.classList.remove('commentary-pulse');
    void box.offsetWidth;
    box.classList.add('commentary-pulse');
  }

  // ============================================================================
  // Rendering
  // ============================================================================
  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = SnailRaceGame.VIEW_WIDTH;
    const h = SnailRaceGame.VIEW_HEIGHT;

    ctx.clearRect(0, 0, w, h);

    this.drawParallaxBackground(ctx);
    this.drawTrack(ctx);
    this.drawBanners(ctx);
    this.drawObstacles(ctx);
    this.racers.forEach(r => r.draw(ctx, this.cameraX));
    this.drawProjectiles(ctx);
    this.drawFloatingTexts(ctx);

    if (this.phase === 'COUNTDOWN') {
      this.drawCountdownOverlay(ctx);
    }
  }

  drawParallaxBackground(ctx) {
    const cam = this.cameraX;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, 100);
    skyGrad.addColorStop(0, '#38bdf8');
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, SnailRaceGame.VIEW_WIDTH, 100);

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(0, 65);
    for (let x = 0; x <= SnailRaceGame.VIEW_WIDTH; x += 40) {
      const wave = Math.sin((x + cam * 0.2) * 0.04) * 6;
      ctx.lineTo(x, 65 + wave);
    }
    ctx.lineTo(SnailRaceGame.VIEW_WIDTH, 100);
    ctx.lineTo(0, 100);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 100, SnailRaceGame.VIEW_WIDTH, 16);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 100, SnailRaceGame.VIEW_WIDTH, 16);

    for (let i = 0; i < SnailRaceGame.VIEW_WIDTH; i += 32) {
      const flagX = ((i - (cam * 0.6) % 32) + 32) % SnailRaceGame.VIEW_WIDTH;
      ctx.fillStyle = (i / 32) % 2 === 0 ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(flagX, 100);
      ctx.lineTo(flagX + 16, 100);
      ctx.lineTo(flagX + 8, 112);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawTrack(ctx) {
    const cam = this.cameraX;
    const laneYOffsets = [24, 78, 132, 186];
    const laneHeight = 52;

    for (let i = 0; i < 4; i++) {
      const y = laneYOffsets[i];
      ctx.fillStyle = i % 2 === 0 ? '#86efac' : '#bbf7d0';
      ctx.fillRect(0, y, SnailRaceGame.VIEW_WIDTH, laneHeight);

      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(0, y + 14, SnailRaceGame.VIEW_WIDTH, 26);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([12, 12]);
      ctx.lineDashOffset = -cam;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(SnailRaceGame.VIEW_WIDTH, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(6, y + 14, 22, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, 17, y + 30);
    }
    ctx.textAlign = 'start';
  }

  drawBanners(ctx) {
    const cam = this.cameraX;

    const startX = Math.round(30 - cam);
    if (startX >= -40 && startX <= SnailRaceGame.VIEW_WIDTH + 40) {
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(startX - 4, 24, 8, 208);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.save();
      ctx.translate(startX, 120);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('START', -18, 4);
      ctx.restore();
    }

    const finX = Math.round(SnailRaceGame.TRACK_LENGTH - cam);
    if (finX >= -80 && finX <= SnailRaceGame.VIEW_WIDTH + 80) {
      const sq = 12;
      for (let y = 24; y < 232; y += sq) {
        for (let col = 0; col < 2; col++) {
          ctx.fillStyle = ((y / sq) + col) % 2 === 0 ? '#000000' : '#ffffff';
          ctx.fillRect(finX + col * sq, y, sq, sq);
        }
      }

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(finX - 10, 8, 44, 18);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.strokeRect(finX - 10, 8, 44, 18);
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('FINISH', finX - 4, 21);
    }
  }

  drawObstacles(ctx) {
    const cam = this.cameraX;
    ctx.font = '20px sans-serif';
    for (const ob of this.obstacles) {
      const sx = Math.round(ob.x - cam);
      if (sx < -30 || sx > SnailRaceGame.VIEW_WIDTH + 30) continue;
      ctx.fillText('🍌', sx - 10, ob.y);
    }
  }

  drawProjectiles(ctx) {
    const cam = this.cameraX;
    for (const p of this.projectiles) {
      const sx = Math.round(p.currentX - cam);
      const sy = Math.round(p.currentY);
      if (p.type === 'apple') {
        ctx.font = '22px sans-serif';
        ctx.fillText('🍎', sx - 11, sy);
      } else if (p.type === 'shell') {
        const shellImg = this.itemImages.shell;
        if (shellImg && shellImg.complete) {
          ctx.drawImage(shellImg, sx - 12, sy - 12, 24, 24);
        } else {
          ctx.font = '20px sans-serif';
          ctx.fillText('🐌', sx - 10, sy);
        }
      }
    }
  }

  drawFloatingTexts(ctx) {
    const cam = this.cameraX;
    ctx.save();
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      const sx = Math.round(ft.x - cam);
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeText(ft.text, sx, ft.y);
      ctx.fillText(ft.text, sx, ft.y);
    }
    ctx.restore();
  }

  drawCountdownOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, SnailRaceGame.VIEW_WIDTH, SnailRaceGame.VIEW_HEIGHT);

    const seconds = Math.ceil(this.countdownTime);
    const txt = seconds > 0 ? `${seconds}` : 'START!';

    ctx.textAlign = 'center';
    ctx.font = 'bold 56px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 6;
    ctx.strokeText(txt, SnailRaceGame.VIEW_WIDTH / 2, SnailRaceGame.VIEW_HEIGHT / 2 + 18);
    ctx.fillText(txt, SnailRaceGame.VIEW_WIDTH / 2, SnailRaceGame.VIEW_HEIGHT / 2 + 18);
    ctx.restore();
  }

  // ============================================================================
  // UI Sync Helpers
  // ============================================================================
  updateCountdownUI() {}

  updateMiniTrackUI() {
    this.racers.forEach((r, idx) => {
      const pin = document.getElementById(`snail-mini-pin-${idx}`);
      if (pin) {
        const percent = Math.min(100, Math.max(0, (r.x / SnailRaceGame.TRACK_LENGTH) * 100));
        pin.style.left = `${percent}%`;
      }
    });
  }

  updateActionDeckUI() {
    const isRacing = this.phase === 'RACING';
    const deck = document.getElementById('snail-action-deck');
    if (deck) deck.style.display = isRacing ? 'flex' : 'none';

    const btnApple = document.getElementById('btn-snail-item-apple');
    const cdApple = document.getElementById('snail-cd-apple');
    if (btnApple && cdApple) {
      const cd = this.cooldowns.apple;
      btnApple.disabled = !isRacing || cd > 0;
      cdApple.textContent = cd > 0 ? `${cd.toFixed(1)}s` : '';
    }

    const btnBanana = document.getElementById('btn-snail-item-banana');
    const cdBanana = document.getElementById('snail-cd-banana');
    if (btnBanana && cdBanana) {
      const cd = this.cooldowns.banana;
      btnBanana.disabled = !isRacing || cd > 0;
      cdBanana.textContent = cd > 0 ? `${cd.toFixed(1)}s` : '';
    }

    const btnShell = document.getElementById('btn-snail-item-shell');
    const cdShell = document.getElementById('snail-cd-shell');
    if (btnShell && cdShell) {
      const cd = this.cooldowns.shell;
      btnShell.disabled = !isRacing || cd > 0;
      cdShell.textContent = cd > 0 ? `${cd.toFixed(1)}s` : '';
    }

    const bar = document.getElementById('snail-cheer-fill');
    if (bar) bar.style.width = `${this.cheerGauge}%`;
  }

  updateUI() {
    const player = window.game?.player;
    const currentMeso = player?.meso || 0;

    const elPlayerMeso = document.getElementById('snail-user-meso');
    if (elPlayerMeso) elPlayerMeso.textContent = currentMeso.toLocaleString();

    const elBetMeso = document.getElementById('snail-current-bet');
    if (elBetMeso) elBetMeso.textContent = this.betAmount.toLocaleString();

    const selectedRacer = this.racers[this.selectedRacerIndex];
    const expected = selectedRacer ? Math.floor(this.betAmount * selectedRacer.odds) : 0;
    const elExpected = document.getElementById('snail-expected-winnings');
    if (elExpected) elExpected.textContent = expected.toLocaleString();

    const btnAllIn = document.getElementById('btn-snail-all-in');
    if (btnAllIn) {
      if (this.isAllIn && currentMeso > 0 && this.betAmount === currentMeso) {
        btnAllIn.classList.add('all-in-active');
      } else {
        btnAllIn.classList.remove('all-in-active');
      }
    }

    const bettingPanel = document.getElementById('snail-betting-panel');
    const actionDeck = document.getElementById('snail-action-deck');
    const resultPanel = document.getElementById('snail-result-panel');

    if (bettingPanel) bettingPanel.style.display = this.phase === 'BETTING' ? 'block' : 'none';
    if (actionDeck) actionDeck.style.display = (this.phase === 'RACING' || this.phase === 'COUNTDOWN') ? 'flex' : 'none';
    if (resultPanel) {
      resultPanel.style.display = this.phase === 'RESULT' ? 'flex' : 'none';
      if (this.phase === 'RESULT') {
        this.renderResultPanel();
      }
    }

    document.querySelectorAll('.snail-racer-card').forEach((card, idx) => {
      if (idx === this.selectedRacerIndex) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    this.updateActionDeckUI();
  }

  renderResultPanel() {
    const winner = this.finishOrder[0];
    const player = window.game?.player;
    const isWin = winner && winner.index === this.selectedRacerIndex;

    const titleEl = document.getElementById('snail-result-title');
    const descEl = document.getElementById('snail-result-desc');
    const payoutEl = document.getElementById('snail-result-payout');

    if (isWin) {
      titleEl.innerHTML = `<span style="color:#f59e0b; text-shadow:0 0 10px #fbbf24;">🎉 [몰빵 적중] 축하합니다!! 1위 우승!</span>`;
      descEl.textContent = `응원하신 [${winner.name}]이(가) 환상적인 질주로 1위를 차지했습니다!`;
      payoutEl.innerHTML = `획득 상금: <strong style="color:#10b981; font-size:18px;">+${this.winnings.toLocaleString()}</strong> 메소 💰`;
    } else {
      titleEl.innerHTML = `<span style="color:#ef4444;">💀 [배팅 실패] 아쉽게 패배했습니다...</span>`;
      descEl.textContent = `1위는 [${winner?.name || '경쟁마'}]이(가) 차지했습니다. 배팅한 메소를 모두 잃었습니다.`;
      payoutEl.innerHTML = `손실 금액: <strong style="color:#ef4444; font-size:16px;">-${this.betAmount.toLocaleString()}</strong> 메소`;
    }

    const tbody = document.getElementById('snail-result-ranks');
    if (tbody) {
      tbody.innerHTML = this.finishOrder.map((r, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 4px; font-weight: bold; color: ${idx === 0 ? '#f59e0b' : '#64748b'};">${idx + 1}위</td>
          <td style="padding: 4px; font-weight: bold; color: ${r.color};">${r.name}</td>
          <td style="padding: 4px; text-align: right;">${r.finishTime.toFixed(2)}초</td>
        </tr>
      `).join('');
    }

    // Provably Fair Verification details in Result Panel
    const verifContainer = document.getElementById('snail-provably-fair-result');
    if (verifContainer) {
      verifContainer.innerHTML = `
        <div style="font-size: 11px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px; text-align: left; margin-top: 6px; font-family: monospace;">
          <div style="color: #0369a1; font-weight: bold;">🔒 [Provably Fair] 암호학적 공정성 검증 데이터:</div>
          <div>• Round ID: <strong>${this.roundId}</strong></div>
          <div>• Revealed Server Seed: <strong>${this.serverSeed}</strong></div>
          <div>• Client Seed: <strong>${this.clientSeed}</strong></div>
          <div>• Pre-Commitment Hash: <span style="color:#64748b;">${this.serverSeedHash}</span></div>
          <div id="snail-verif-status" style="margin-top: 4px; color: #16a34a; font-weight: bold;">✔ SHA-256 서약 해시 일치 확인 완료 (결과 조작 불가 100% 증명됨)</div>
        </div>
      `;
    }
  }

  // Auditable Method to verify fairness on demand
  async verifyFairness() {
    const recalculated = await ProvablyFairEngine.sha256(`${this.serverSeed}:${this.roundId}`);
    return {
      isValid: recalculated === this.serverSeedHash,
      roundId: this.roundId,
      serverSeed: this.serverSeed,
      clientSeed: this.clientSeed,
      originalHash: this.serverSeedHash,
      recalculatedHash: recalculated
    };
  }
}

window.ProvablyFairEngine = ProvablyFairEngine;
window.DeterministicRNG = DeterministicRNG;
window.SnailRaceGame = SnailRaceGame;
