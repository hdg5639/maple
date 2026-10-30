// js/audio.js - Web Audio API Procedural Sound Engine & Henesys BGM Synthesizer

class AudioManager {
  constructor() {
    this.ctx = null;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmNoteIndex = 0;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.masterVolume = 0.7;
    this.bgmVolume = 0.4;
    this.sfxVolume = 0.6;

    // Automatic one-time gesture unlocker to satisfy browser Autoplay policies
    const unlock = () => {
      this.init();
      this.resume();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
    }
  }

  init() {
    if (this.ctx) return;
    const AudioContext = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
    if (!AudioContext) return;
    try {
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      // AudioContext unavailable or blocked
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Silently catch suspended context before gesture
      });
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  setVolume(type, val) {
    if (!this.ctx) return;
    val = Math.max(0, Math.min(1, val));
    if (type === 'master') {
      this.masterVolume = val;
      if (!this.isMuted) this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
    } else if (type === 'bgm') {
      this.bgmVolume = val;
      this.bgmGain.gain.setValueAtTime(val, this.ctx.currentTime);
    } else if (type === 'sfx') {
      this.sfxVolume = val;
      this.sfxGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  // --- Sound Effects ---

  playButtonClick() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  playJump() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playPortal() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Classic Maple Portal Warp Synth (swept sine + resonant sparkle)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(260, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.32);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(520, now);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.32);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.36);
      osc2.stop(now + 0.36);
    } catch (e) {}
  }

  playAttack() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // White noise whoosh
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.12);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
  }

  playHit() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  playMonsterDie() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  playPickItem() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.35, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.04 + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.16);
    });
  }

  playUsePotion() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [400, 600, 800].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.25, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.08);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.09);
    });
  }

  playLevelUp() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Classic maple level up fanfare chords: C, E, G, High C, High E, High G, C6!
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
      const startTime = now + idx * 0.08;
      const duration = idx === notes.length - 1 ? 0.8 : 0.25;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  }

  playPowerStrike() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playSlashBlast() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + i * 0.05;
      osc.frequency.setValueAtTime(600 - i * 100, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.13);
    }
  }

  playMagicClaw() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [700, 1050].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      const t = now + idx * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.12);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.13);
    });
  }

  playFlashJump() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playBossRoar() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.6);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  playMiss() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Classic maple whoosh miss sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  playTombstone() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Heavy crashing thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.52);

    // Somber low bell chime
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      [220, 164.81].forEach((f, idx) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, t + idx * 0.15);
        g.gain.setValueAtTime(0.3, t + idx * 0.15);
        g.gain.exponentialRampToValueAtTime(0.005, t + idx * 0.15 + 0.7);
        o.connect(g);
        g.connect(this.sfxGain);
        o.start(t + idx * 0.15);
        o.stop(t + idx * 0.15 + 0.72);
      });
    }, 150);
  }

  playScrollSuccess() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Brilliant ascending maple enchant success chime: E5, G5, B5, E6!
    [659.25, 783.99, 987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.09;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.48);
    });
  }

  playScrollFail() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Dull shattered failure buzz: D#3, D3
    [155.56, 146.83].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + idx * 0.12;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  playBreakthrough() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx >= 4 ? 'triangle' : 'sine';
      const t = now + idx * 0.065;
      const dur = idx === notes.length - 1 ? 0.65 : 0.25;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.38, t);
      gain.gain.exponentialRampToValueAtTime(0.008, t + dur);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    });
  }

  playStarForce() {
    this.init(); this.resume();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    [783.99, 987.77, 1174.66, 1567.98].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.32, t);
      gain.gain.exponentialRampToValueAtTime(0.008, t + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  getThemeForMap(mapKey = 'henesys_hhg') {
    if (mapKey === 'ellinia') return 'ellinia';
    if (mapKey === 'perion_boar') return 'perion';
    if (mapKey === 'kerning_subway' || mapKey === 'kerning_pq') return 'kerning';
    if (mapKey === 'ant_tunnel' || mapKey === 'sleepy_dungeon') return 'dungeon';
    if (mapKey === 'ship_orbis') return 'orbis';
    if (mapKey === 'el_nath_deadmine') return 'elnath';
    if (mapKey === 'ludi_clocktower') return 'ludi';
    if (mapKey === 'zakum_altar') return 'zakum';
    return 'henesys';
  }

  playBgmForMap(mapKey) {
    const nextTheme = this.getThemeForMap(mapKey);
    const changed = this.currentBgmTheme !== nextTheme;
    this.currentBgmTheme = nextTheme;
    if (this.bgmPlaying && changed) {
      this.stopBGM();
      this.startBGM();
    }
  }

  // --- Multi-Theme Classic Maple BGM Synthesizer ---
  startBGM() {
    if (this.bgmPlaying) return;
    this.init();
    this.resume();
    this.bgmPlaying = true;
    const theme = this.currentBgmTheme || 'henesys';

    const C3 = 130.81, D3 = 146.83, E3 = 164.81, F3 = 174.61, G3 = 196.00, A3 = 220.00, B3 = 246.94;
    const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, Fs4 = 369.99, G4 = 392.00, Ab4 = 415.30, A4 = 440.00, Bb4 = 466.16, B4 = 493.88;
    const C5 = 523.25, D5 = 587.33, Eb5 = 622.25, E5 = 659.25, F5 = 698.46, Fs5 = 739.99, G5 = 783.99, A5 = 880.00, B5 = 987.77, C6 = 1046.50;

    const themes = {
      henesys: {
        tempo: 138, wave: 'triangle',
        melody: [
          G4, C5, E5, G5,  E5, D5, C5, 0,
          A4, C5, F5, A5,  G5, E5, C5, 0,
          D5, E5, F5, D5,  E5, F5, G5, E5,
          D5, C5, D5, E5,  D5, 0,  G4, 0,
          G4, C5, E5, G5,  E5, D5, C5, 0,
          A4, C5, F5, A5,  G5, C6, C5, 0,
          F5, E5, D5, C5,  B4, C5, D5, G4,
          C5, 0,  E5, 0,   C5, 0,  0,  0
        ],
        bass: [
          C3, 0, G3, 0,   C3, 0, G3, 0,
          F3, 0, C4, 0,   F3, 0, C4, 0,
          G3, 0, D4, 0,   E3, 0, B3, 0,
          A3, 0, E4, 0,   G3, 0, D4, 0,
          C3, 0, G3, 0,   C3, 0, G3, 0,
          F3, 0, C4, 0,   F3, 0, C4, 0,
          G3, 0, D4, 0,   G3, 0, D4, 0,
          C3, 0, G3, 0,   C3, 0, 0,  0
        ]
      },
      ellinia: {
        tempo: 104, wave: 'sine',
        melody: [
          E4, B4, E5, Fs5, G5, Fs5, E5, B4,
          C5, G4, C5, D5,  E5, D5,  B4, 0,
          A4, E5, A5, G5,  Fs5, E5, D5, B4,
          E5, 0,  B4, 0,   E4, 0,   0,  0
        ],
        bass: [
          E3, 0, B3, 0,   E3, 0, B3, 0,
          C3, 0, G3, 0,   G3, 0, D3, 0,
          A3, 0, E3, 0,   B3, 0, Fs4, 0,
          E3, 0, B3, 0,   E3, 0, 0,  0
        ]
      },
      perion: {
        tempo: 126, wave: 'sawtooth',
        melody: [
          D4, 0, A4, G4,  F4, 0, D4, 0,
          Bb4, A4, G4, F4, E4, 0, A4, 0,
          D4, F4, A4, D5, C5, Bb4, A4, G4,
          A4, 0, D4, 0,   D4, 0, 0, 0
        ],
        bass: [
          D3, D3, A3, 0,  D3, D3, A3, 0,
          G3, 0,  D3, 0,  A3, 0,  E3, 0,
          D3, D3, A3, 0,  Bb4, 0, G3, 0,
          A3, 0,  D3, 0,  D3, 0,  0,  0
        ]
      },
      kerning: {
        tempo: 132, wave: 'square',
        melody: [
          A4, 0, C5, D5,  Eb5, D5, C5, A4,
          G4, 0, C5, 0,   A4, 0,   0,  0,
          F4, A4, C5, D5, Eb5, 0,  D5, C5,
          A4, 0, G4, A4,  A4, 0,   0,  0
        ],
        bass: [
          A3, 0, E3, A3,  0, E3, G3, A3,
          C3, 0, G3, C4,  A3, 0, E3, 0,
          F3, 0, C3, F3,  G3, 0, D3, G3,
          A3, 0, E3, G3,  A3, 0, 0,  0
        ]
      },
      dungeon: {
        tempo: 112, wave: 'triangle',
        melody: [
          C4, G4, Ab4, G4, F4, Eb5, D5, G4,
          C4, G4, Ab4, B4, C5, 0,   G4, 0,
          F4, Ab4, C5, B4, Ab4, G4, F4, Eb5,
          D5, 0,  B4, 0,   C5, 0,   0,  0
        ],
        bass: [
          C3, 0, G3, 0,   Ab4, 0, G3, 0,
          C3, 0, G3, 0,   C3, 0,  G3, 0,
          F3, 0, C3, 0,   G3, 0,  D3, 0,
          G3, 0, G3, 0,   C3, 0,  0,  0
        ]
      },
      orbis: {
        tempo: 144, wave: 'triangle',
        melody: [
          F4, A4, C5, F5,  E5, C5, A4, 0,
          Bb4, D5, F5, D5, C5, A4, G4, 0,
          A4, C5, F5, A5,  G5, E5, C5, D5,
          F5, 0,  C5, 0,   F4, 0,  0,  0
        ],
        bass: [
          F3, 0, C4, 0,   A3, 0, C4, 0,
          Bb4, 0, F3, 0,  C3, 0, G3, 0,
          F3, 0, C4, 0,   C3, 0, G3, 0,
          F3, 0, C3, 0,   F3, 0, 0,  0
        ]
      },
      elnath: {
        tempo: 116, wave: 'sine',
        melody: [
          E5, B4, G5, Fs5, E5, B4, D5, C5,
          B4, E4, G4, B4,  A4, 0,  Fs4, 0,
          G4, B4, E5, G5,  Fs5, D5, B4, A4,
          E5, 0,  B4, 0,   E4, 0,  0,  0
        ],
        bass: [
          E3, 0, B3, 0,   G3, 0, D4, 0,
          C3, 0, G3, 0,   D3, 0, A3, 0,
          E3, 0, B3, 0,   B3, 0, Fs4, 0,
          E3, 0, B3, 0,   E3, 0, 0,  0
        ]
      },
      ludi: {
        tempo: 152, wave: 'triangle',
        melody: [
          C5, G4, E5, C5,  D5, G4, F5, D5,
          E5, C5, G5, E5,  D5, B4, G4, 0,
          A4, C5, F5, A5,  G5, E5, C5, G4,
          D5, B4, G5, B4,  C5, 0,  C6, 0
        ],
        bass: [
          C3, G3, C4, G3,  G3, D3, G3, D3,
          C3, G3, C4, G3,  G3, D3, G3, 0,
          F3, C4, F3, C4,  C3, G3, C4, G3,
          G3, D3, G3, D3,  C3, 0,  C3, 0
        ]
      },
      zakum: {
        tempo: 160, wave: 'sawtooth',
        melody: [
          E4, E4, Bb4, A4, G4, F4, E4, Bb4,
          A4, G4, F4,  E4, D4, F4, E4, 0,
          E4, G4, Bb4, C5, B4, Bb4, A4, G4,
          F4, E4, Eb5, B4, E4, 0,  E5, 0
        ],
        bass: [
          E3, E3, E3, E3,  Bb4, A3, G3, F3,
          E3, E3, E3, E3,  D3,  F3, E3, 0,
          E3, E3, G3, G3,  A3,  A3, Bb4, G3,
          F3, E3, B3, B3,  E3,  0,  E3, 0
        ]
      }
    };

    const cfg = themes[theme] || themes.henesys;
    const stepDuration = 60 / cfg.tempo / 2;
    const melody = cfg.melody;
    const bass = cfg.bass;

    let step = 0;
    const totalSteps = melody.length;

    const scheduleNext = () => {
      if (!this.bgmPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;

      const mNote = melody[step % totalSteps];
      if (mNote && typeof mNote === 'number' && mNote > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = cfg.wave || 'triangle';
        osc.frequency.setValueAtTime(mNote, now);
        gain.gain.setValueAtTime(cfg.wave === 'sawtooth' || cfg.wave === 'square' ? 0.11 : 0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + stepDuration * 0.9);
        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(now);
        osc.stop(now + stepDuration);
      }

      const bNote = bass[step % totalSteps];
      if (bNote && typeof bNote === 'number' && bNote > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(bNote, now);
        bGain.gain.setValueAtTime(0.22, now);
        bGain.gain.exponentialRampToValueAtTime(0.005, now + stepDuration * 0.85);
        bOsc.connect(bGain);
        bGain.connect(this.bgmGain);
        bOsc.start(now);
        bOsc.stop(now + stepDuration);
      }

      step++;
      this.bgmTimer = setTimeout(scheduleNext, stepDuration * 1000);
    };

    scheduleNext();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleBGM() {
    if (this.bgmPlaying) {
      this.stopBGM();
      return false;
    } else {
      this.startBGM();
      return true;
    }
  }
}

window.audio = new AudioManager();
