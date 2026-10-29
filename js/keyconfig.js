// js/keyconfig.js - Custom Key Configuration Manager adhering to SOLID Principles (SRP & OCP)

class KeyConfigManager {
  static STORAGE_KEY = 'openmaple_custom_keyconfig';

  static DEFAULT_BINDINGS = {
    'moveLeft': { label: '이동 (좌)', key: 'ArrowLeft', display: '←' },
    'moveRight': { label: '이동 (우)', key: 'ArrowRight', display: '→' },
    'climbUp': { label: '오르기 / 포탈', key: 'ArrowUp', display: '↑' },
    'climbDown': { label: '내리기 / 하향점프', key: 'ArrowDown', display: '↓' },
    'jump': { label: '점프', key: 'AltLeft', display: 'Alt' },
    'primarySkill': { label: '기본 스킬 (평타 대체)', key: 'ControlLeft', display: 'Ctrl' },
    'interact': { label: 'NPC 대화 / 포탈', key: 'Space', display: 'Space' },
    'pickUp': { label: '아이템 줍기', key: 'KeyZ', display: 'Z' },
    'skill1': { label: '스킬 1', key: 'ShiftLeft', display: 'Shift' },
    'skill2': { label: '스킬 2', key: 'KeyQ', display: 'Q' },
    'skill3': { label: '스킬 3', key: 'KeyW', display: 'W' },
    'skill4': { label: '스킬 4', key: 'KeyE', display: 'E' },
    'skill5': { label: '스킬 5', key: 'KeyA', display: 'A' },
    'skill6': { label: '스킬 6', key: 'KeyS', display: 'S' },
    'skill7': { label: '스킬 7', key: 'KeyD', display: 'D' },
    'skill8': { label: '스킬 8', key: 'KeyF', display: 'F' },
    'potionRed': { label: '빨간 포션', key: 'Digit1', display: '1' },
    'potionBlue': { label: '파란 포션', key: 'Digit2', display: '2' },
    'autoHunt': { label: '자동사냥 토글', key: 'KeyR', display: 'R' }
  };

  static WASD_PRESET = {
    'moveLeft': { label: '이동 (좌)', key: 'KeyA', display: 'A' },
    'moveRight': { label: '이동 (우)', key: 'KeyD', display: 'D' },
    'climbUp': { label: '오르기 / 포탈', key: 'KeyW', display: 'W' },
    'climbDown': { label: '내리기 / 하향점프', key: 'KeyS', display: 'S' },
    'jump': { label: '점프', key: 'Space', display: 'Space' },
    'primarySkill': { label: '기본 스킬 (평타 대체)', key: 'KeyJ', display: 'J' },
    'interact': { label: 'NPC 대화 / 포탈', key: 'KeyF', display: 'F' },
    'pickUp': { label: '아이템 줍기', key: 'KeyZ', display: 'Z' },
    'skill1': { label: '스킬 1', key: 'KeyQ', display: 'Q' },
    'skill2': { label: '스킬 2', key: 'KeyE', display: 'E' },
    'skill3': { label: '스킬 3', key: 'KeyR', display: 'R' },
    'skill4': { label: '스킬 4', key: 'KeyT', display: 'T' },
    'skill5': { label: '스킬 5', key: 'KeyU', display: 'U' },
    'skill6': { label: '스킬 6', key: 'KeyI', display: 'I' },
    'skill7': { label: '스킬 7', key: 'KeyO', display: 'O' },
    'skill8': { label: '스킬 8', key: 'KeyP', display: 'P' },
    'potionRed': { label: '빨간 포션', key: 'Digit1', display: '1' },
    'potionBlue': { label: '파란 포션', key: 'Digit2', display: '2' },
    'autoHunt': { label: '자동사냥 토글', key: 'KeyH', display: 'H' }
  };

  constructor(game) {
    this.game = game;
    this.bindings = {};
    this.keyToActionMap = {};
    this.listeningAction = null;

    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(KeyConfigManager.STORAGE_KEY);
      if (saved) {
        this.bindings = JSON.parse(saved);
      } else {
        this.bindings = JSON.parse(JSON.stringify(KeyConfigManager.DEFAULT_BINDINGS));
      }
    } catch (e) {
      this.bindings = JSON.parse(JSON.stringify(KeyConfigManager.DEFAULT_BINDINGS));
    }
    this.rebuildReverseMap();
  }

  save() {
    try {
      localStorage.setItem(KeyConfigManager.STORAGE_KEY, JSON.stringify(this.bindings));
    } catch (e) {}
    this.rebuildReverseMap();
    this.game.resetInputs();
    this.updateHUDKeyLabels();
  }

  normalizeKey(code) {
    return code?.replace(/^(Alt|Control|Shift)Right$/, '$1Left');
  }

  rebuildReverseMap() {
    this.keyToActionMap = {};
    for (const [action, data] of Object.entries(this.bindings)) {
      if (!data.key) continue;
      this.keyToActionMap[data.key] = action;
      // Also register alternate left/right equivalents for Shift, Ctrl, Alt
      const key = this.normalizeKey(data.key);
      if (['AltLeft', 'ControlLeft', 'ShiftLeft'].includes(key)) {
        this.keyToActionMap[key] = action;
        this.keyToActionMap[key.replace('Left', 'Right')] = action;
      }
    }
  }

  getAction(code) {
    return this.keyToActionMap[code] || null;
  }

  bindKey(action, keyCode) {
    if (!this.bindings[action]) return false;

    // A physical key (including both modifier variants) owns exactly one action.
    for (const [otherAction, binding] of Object.entries(this.bindings)) {
      if (otherAction !== action && this.normalizeKey(binding.key) === this.normalizeKey(keyCode)) {
        binding.key = null;
        binding.display = '—';
      }
    }

    // Format display string
    let display = keyCode.replace('Key', '').replace('Digit', '').replace('Left', '').replace('Right', '');
    if (keyCode.startsWith('Arrow')) {
      display = { 'ArrowLeft': '←', 'ArrowRight': '→', 'ArrowUp': '↑', 'ArrowDown': '↓' }[keyCode] || keyCode;
    }

    this.bindings[action].key = keyCode;
    this.bindings[action].display = display;
    this.save();
    return true;
  }

  applyPreset(presetName) {
    if (presetName === 'wasd') {
      this.bindings = JSON.parse(JSON.stringify(KeyConfigManager.WASD_PRESET));
    } else {
      this.bindings = JSON.parse(JSON.stringify(KeyConfigManager.DEFAULT_BINDINGS));
    }
    this.save();
  }

  updateHUDKeyLabels() {
    const actionToSlotId = {
      'primarySkill': 'quick-slot-attack',
      'jump': 'quick-slot-jump',
      'pickUp': 'quick-slot-loot',
      'skill1': 'quick-slot-1',
      'skill2': 'quick-slot-2',
      'skill3': 'quick-slot-3',
      'skill4': 'quick-slot-4',
      'skill5': 'quick-slot-5',
      'skill6': 'quick-slot-6',
      'skill7': 'quick-slot-7',
      'skill8': 'quick-slot-8',
      'potionRed': 'quick-slot-potion-red',
      'potionBlue': 'quick-slot-potion-blue',
      'autoHunt': 'quick-slot-autohunt'
    };

    for (const [action, slotId] of Object.entries(actionToSlotId)) {
      const binding = this.bindings[action];
      if (!binding) continue;
      const el = document.getElementById(slotId);
      if (el) {
        const keySpan = el.querySelector('.slot-key');
        if (keySpan) keySpan.innerText = binding.display;
      }
    }
  }
}

window.KeyConfigManager = KeyConfigManager;
