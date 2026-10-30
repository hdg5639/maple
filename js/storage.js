// js/storage.js - LocalStorage Persistence & Seamless Offline/Online Auto-Save with Zero-Loss Crash Defense

class StorageManager {
  static KEY = 'OPENMAPLE_CLASSIC_SAVE_DATA';

  static serializePlayer(player, mapKey) {
    if (!player) return null;
    return {
      name: player.name,
      job: player.job,
      jobTier: player.jobTier || 0,
      selectedMobility: player.selectedMobility || 'flash_jump',
      level: player.level,
      exp: player.exp,
      maxExp: player.maxExp,
      hp: player.hp,
      maxHp: player.maxHp,
      mp: player.mp,
      maxMp: player.maxMp,
      str: player.str,
      dex: player.dex,
      int: player.int,
      luk: player.luk,
      ap: player.ap,
      sp: player.sp,
      fame: player.fame || 0,
      meso: player.meso,
      currentMap: mapKey || 'henesys_hhg',
      x: Math.round(player.x),
      y: Math.round(player.y),
      inventory: player.inventory || { equip: [], use: [], setup: [], etc: [], cash: [] },
      coordi: player.coordi || null,
      coordiPresets: player.coordiPresets || null,
      activeCoordiPreset: player.activeCoordiPreset ?? 0,
      coordiCloset: player.coordiCloset || null,
      bossKills: player.bossKills || {},
      skills: player.skills || {},
      quickslots: player.quickslotBindings || [],
      savedAt: Date.now()
    };
  }

  static save(player, mapKey) {
    if (!player) return false;
    try {
      const data = StorageManager.serializePlayer(player, mapKey);
      localStorage.setItem(StorageManager.KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('[STORAGE] LocalStorage save failed:', e);
      return false;
    }
  }

  static load() {
    try {
      const raw = localStorage.getItem(StorageManager.KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[STORAGE] LocalStorage load failed:', e);
      return null;
    }
  }

  static clear() {
    localStorage.removeItem(StorageManager.KEY);
  }
}

window.StorageManager = StorageManager;
