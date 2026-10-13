// js/ui.js - Retro Maple UI Windows, Tooltips, Hotkeys, and Sound Integration

class UIManager {
  constructor(game) {
    this.game = game;
    this.initWindows();
    this.initHotkeys();
    this.initDraggableWindows();
  }

  initWindows() {
    // Window Toggle Buttons
    document.getElementById('btn-stat-toggle')?.addEventListener('click', () => this.toggleWindow('win-stats'));
    document.getElementById('btn-inven-toggle')?.addEventListener('click', () => this.toggleWindow('win-inventory'));
    document.getElementById('btn-skill-toggle')?.addEventListener('click', () => this.toggleWindow('win-skills'));
    document.getElementById('btn-auto-toggle')?.addEventListener('click', () => this.toggleWindow('win-auto-config'));
    document.getElementById('btn-sound-toggle')?.addEventListener('click', () => this.toggleAudio());
    document.getElementById('btn-boss-spawn')?.addEventListener('click', () => this.game.spawnBoss());
    document.getElementById('btn-auto-hunt')?.addEventListener('click', () => this.game.autoHunt.toggle());

    // Close buttons
    document.querySelectorAll('.btn-window-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const win = e.target.closest('.maple-window');
        if (win) win.style.display = 'none';
        window.audio.playButtonClick();
      });
    });

    // Inventory Tabs
    document.querySelectorAll('.inven-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.inven-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.renderInventoryTab(e.target.dataset.tab);
        window.audio.playButtonClick();
      });
    });

    // Stat AP Distribution buttons
    ['str', 'dex', 'int', 'luk'].forEach(stat => {
      document.getElementById(`btn-add-${stat}`)?.addEventListener('click', () => {
        if (this.game.player.ap > 0) {
          this.game.player[stat]++;
          this.game.player.ap--;
          this.game.player.calcDerivedStats();
          window.audio.playButtonClick();
          this.updateStatsWindow();
        }
      });
    });

    // Auto-hunt config sliders & switches
    const hpSlider = document.getElementById('slider-auto-hp');
    if (hpSlider) {
      hpSlider.addEventListener('input', (e) => {
        this.game.autoHunt.config.hpPotionThreshold = parseFloat(e.target.value) / 100;
        document.getElementById('val-auto-hp').innerText = `${e.target.value}%`;
      });
    }

    const mpSlider = document.getElementById('slider-auto-mp');
    if (mpSlider) {
      mpSlider.addEventListener('input', (e) => {
        this.game.autoHunt.config.mpPotionThreshold = parseFloat(e.target.value) / 100;
        document.getElementById('val-auto-mp').innerText = `${e.target.value}%`;
      });
    }

    const lootCheck = document.getElementById('check-auto-loot');
    if (lootCheck) {
      lootCheck.addEventListener('change', (e) => {
        this.game.autoHunt.config.autoLoot = e.target.checked;
      });
    }

    const skillCheck = document.getElementById('check-auto-skills');
    if (skillCheck) {
      skillCheck.addEventListener('change', (e) => {
        this.game.autoHunt.config.useSkills = e.target.checked;
      });
    }
  }

  toggleWindow(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const isVisible = el.style.display === 'block';
    el.style.display = isVisible ? 'none' : 'block';
    window.audio.playButtonClick();

    if (!isVisible) {
      // Refresh contents
      if (id === 'win-stats') this.updateStatsWindow();
      if (id === 'win-inventory') this.renderInventoryTab('use');
      if (id === 'win-skills') this.updateSkillsWindow();
    }
  }

  toggleAudio() {
    const isPlaying = window.audio.toggleBGM();
    const btn = document.getElementById('btn-sound-toggle');
    if (btn) {
      btn.innerText = isPlaying ? '🔊 BGM ON' : '🔇 BGM OFF';
    }
  }

  initDraggableWindows() {
    let activeWin = null;
    let offset = { x: 0, y: 0 };

    document.querySelectorAll('.maple-window-header').forEach(header => {
      header.addEventListener('mousedown', (e) => {
        activeWin = header.closest('.maple-window');
        if (activeWin) {
          offset.x = e.clientX - activeWin.offsetLeft;
          offset.y = e.clientY - activeWin.offsetTop;
          activeWin.style.zIndex = '1000';
        }
      });
    });

    window.addEventListener('mousemove', (e) => {
      if (activeWin) {
        activeWin.style.left = `${Math.max(10, e.clientX - offset.x)}px`;
        activeWin.style.top = `${Math.max(10, e.clientY - offset.y)}px`;
      }
    });

    window.addEventListener('mouseup', () => {
      if (activeWin) {
        activeWin.style.zIndex = '100';
        activeWin = null;
      }
    });
  }

  initHotkeys() {
    window.addEventListener('keydown', (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT') return;

      const code = e.code;
      if (code === 'KeyS') {
        this.toggleWindow('win-stats');
      } else if (code === 'KeyI') {
        this.toggleWindow('win-inventory');
      } else if (code === 'KeyK') {
        this.toggleWindow('win-skills');
      } else if (code === 'KeyO') {
        this.toggleWindow('win-auto-config');
      } else if (code === 'KeyR') {
        this.game.autoHunt.toggle();
      } else if (code === 'KeyB') {
        this.game.spawnBoss();
      } else if (code === 'Digit1') {
        this.game.player.usePotion('red_potion');
      } else if (code === 'Digit2') {
        this.game.player.usePotion('blue_potion');
      }
    });
  }

  updateHUD() {
    const player = this.game.player;

    // HP Bar
    const hpFill = document.getElementById('hud-hp-fill');
    const hpText = document.getElementById('hud-hp-text');
    if (hpFill && hpText) {
      const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
      hpFill.style.width = `${hpPct}%`;
      hpText.innerText = `${player.hp} / ${player.maxHp}`;
    }

    // MP Bar
    const mpFill = document.getElementById('hud-mp-fill');
    const mpText = document.getElementById('hud-mp-text');
    if (mpFill && mpText) {
      const mpPct = Math.max(0, Math.min(100, (player.mp / player.maxMp) * 100));
      mpFill.style.width = `${mpPct}%`;
      mpText.innerText = `${player.mp} / ${player.maxMp}`;
    }

    // EXP Bar
    const expFill = document.getElementById('hud-exp-fill');
    const expText = document.getElementById('hud-exp-text');
    if (expFill && expText) {
      const expPct = Math.max(0, Math.min(100, (player.exp / player.maxExp) * 100));
      expFill.style.width = `${expPct}%`;
      expText.innerText = `${player.exp} [${expPct.toFixed(1)}%]`;
    }

    // Name & Level
    const nameEl = document.getElementById('hud-player-name');
    if (nameEl) nameEl.innerText = `${player.name} (${player.job})`;
    const lvEl = document.getElementById('hud-player-level');
    if (lvEl) lvEl.innerText = `Lv.${player.level}`;

    // Potion counts in quickslot
    const redCount = player.inventory.use.find(p => p.id === 'red_potion')?.count || 0;
    const blueCount = player.inventory.use.find(p => p.id === 'blue_potion')?.count || 0;
    const qRed = document.getElementById('quick-red-count');
    const qBlue = document.getElementById('quick-blue-count');
    if (qRed) qRed.innerText = redCount;
    if (qBlue) qBlue.innerText = blueCount;

    // Update Auto-hunt Dashboard
    if (this.game.autoHunt.enabled) {
      const st = this.game.autoHunt.stats;
      const mins = Math.floor(st.duration / 60);
      const secs = st.duration % 60;
      document.getElementById('stat-hunt-time').innerText = `${mins}분 ${secs}초`;
      document.getElementById('stat-hunt-kills').innerText = `${st.kills} 마리`;
      document.getElementById('stat-hunt-exp-min').innerText = `${st.expPerMin.toLocaleString()} EXP/분`;
      document.getElementById('stat-hunt-meso-min').innerText = `${st.mesoPerMin.toLocaleString()} 메소/분`;
    }
  }

  updateStatsWindow() {
    const p = this.game.player;
    document.getElementById('stat-win-name').innerText = p.name;
    document.getElementById('stat-win-job').innerText = p.job;
    document.getElementById('stat-win-level').innerText = p.level;
    document.getElementById('stat-win-hp').innerText = `${p.hp}/${p.maxHp}`;
    document.getElementById('stat-win-mp').innerText = `${p.mp}/${p.maxMp}`;
    document.getElementById('stat-win-atk').innerText = `${p.minAtk} ~ ${p.maxAtk}`;
    document.getElementById('stat-win-str').innerText = p.str;
    document.getElementById('stat-win-dex').innerText = p.dex;
    document.getElementById('stat-win-int').innerText = p.int;
    document.getElementById('stat-win-luk').innerText = p.luk;
    document.getElementById('stat-win-ap').innerText = p.ap;

    const apButtons = document.querySelectorAll('.btn-add-stat');
    apButtons.forEach(btn => {
      btn.style.display = p.ap > 0 ? 'inline-block' : 'none';
    });
  }

  renderInventoryTab(tabName) {
    const p = this.game.player;
    const container = document.getElementById('inven-grid');
    if (!container) return;

    container.innerHTML = '';
    const items = p.inventory[tabName] || [];

    // Mesos counter
    const mesoEl = document.getElementById('inven-meso-amount');
    if (mesoEl) mesoEl.innerText = p.meso.toLocaleString();

    // 24 inventory slots (classic 4x6 grid)
    for (let i = 0; i < 24; i++) {
      const slot = document.createElement('div');
      slot.className = 'inven-slot';

      if (items[i]) {
        const item = items[i];
        slot.title = `${item.name}${item.count ? ' x' + item.count : ''}`;
        
        let icon = '📦';
        if (item.id === 'red_potion') icon = '🧪(빨강)';
        else if (item.id === 'blue_potion') icon = '🧪(파랑)';
        else if (item.type === 'weapon') icon = '🗡️';
        else if (item.type === 'hat') icon = '🧢';
        else if (item.id === 'snail_shell') icon = '🐚';
        else if (item.id === 'slime_liquid') icon = '💧';
        else if (item.id === 'mushroom_cap') icon = '🍄';

        slot.innerHTML = `<span class="slot-icon">${icon}</span><span class="slot-count">${item.count || ''}</span>`;

        // Double-click to use potion
        slot.addEventListener('click', () => {
          if (tabName === 'use' && item.count > 0) {
            p.usePotion(item.id);
            this.renderInventoryTab('use');
          }
        });
      }

      container.appendChild(slot);
    }
  }

  updateSkillsWindow() {
    const p = this.game.player;
    const container = document.getElementById('skill-list-container');
    const spEl = document.getElementById('skill-sp-count');
    if (spEl) spEl.innerText = p.sp;
    if (!container) return;

    container.innerHTML = '';

    Object.entries(p.skills).forEach(([id, skill]) => {
      const row = document.createElement('div');
      row.className = 'skill-row';
      row.innerHTML = `
        <div class="skill-icon">${skill.icon}</div>
        <div class="skill-info">
          <div class="skill-name">${skill.name}</div>
          <div class="skill-level">Lv. ${skill.level} / ${skill.maxLevel}</div>
        </div>
        <button class="btn-maple btn-sp-add" ${p.sp <= 0 || skill.level >= skill.maxLevel ? 'disabled' : ''}>+</button>
      `;

      row.querySelector('.btn-sp-add')?.addEventListener('click', () => {
        if (p.sp > 0 && skill.level < skill.maxLevel) {
          skill.level++;
          p.sp--;
          window.audio.playButtonClick();
          this.updateSkillsWindow();
        }
      });

      container.appendChild(row);
    });
  }

  showJobAdvancementModal() {
    const modal = document.getElementById('modal-job-advance');
    if (!modal) return;
    modal.style.display = 'flex';
    window.audio.playLevelUp();

    document.querySelectorAll('.btn-job-choice').forEach(btn => {
      btn.onclick = () => {
        const job = btn.dataset.job;
        this.game.player.advanceJob(job);
        modal.style.display = 'none';
        this.game.spawnItemText(this.game.player.x, this.game.player.y - 45, `★ ${job} 1차 전직 완료! ★`);
        this.updateStatsWindow();
        this.updateSkillsWindow();
      };
    });
  }
}

window.UIManager = UIManager;
