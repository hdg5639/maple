// js/ui.js - Retro Maple UI Windows, Job Selector, Quickslot Customization

class UIManager {
  constructor(game) {
    this.game = game;
    this.initWindows();
    this.initHotkeys();
    this.initDraggableWindows();
    this.initResponsiveControls();
    if (this.game.player) {
      this.updateQuickslotsForJob(this.game.player.job);
    }
  }

  initWindows() {
    document.getElementById('btn-stat-toggle')?.addEventListener('click', () => this.toggleWindow('win-stats'));
    document.getElementById('btn-inven-toggle')?.addEventListener('click', () => this.toggleWindow('win-inventory'));
    document.getElementById('btn-skill-toggle')?.addEventListener('click', () => this.toggleWindow('win-skills'));
    document.getElementById('btn-auto-toggle')?.addEventListener('click', () => this.toggleWindow('win-auto-config'));
    document.getElementById('btn-sound-toggle')?.addEventListener('click', () => this.toggleAudio());
    document.getElementById('btn-boss-spawn')?.addEventListener('click', () => this.game.spawnBoss());
    document.getElementById('btn-auto-hunt')?.addEventListener('click', () => this.game.autoHunt.toggle());
    document.getElementById('btn-job-select-open')?.addEventListener('click', () => this.showJobAdvancementModal());
    document.getElementById('btn-map-travel-open')?.addEventListener('click', () => this.showMapTravelModal());
    document.getElementById('btn-keyconfig-open')?.addEventListener('click', () => this.toggleWindow('win-keyconfig'));
    document.getElementById('btn-keyconfig-toggle')?.addEventListener('click', () => this.toggleWindow('win-keyconfig'));
    document.getElementById('btn-armory-open')?.addEventListener('click', () => this.toggleWindow('win-armory'));
    document.getElementById('btn-armory-toggle')?.addEventListener('click', () => this.toggleWindow('win-armory'));
    document.getElementById('btn-login-open')?.addEventListener('click', () => this.showLoginModal());
    document.getElementById('btn-shop-open')?.addEventListener('click', () => this.showShopModal());

    // Login modal buttons
    document.getElementById('btn-login-submit')?.addEventListener('click', () => {
      const u = document.getElementById('login-username')?.value.trim();
      const p = document.getElementById('login-password')?.value.trim();
      if (!u || !p) {
        alert('아이디와 비밀번호를 모두 입력해주세요!');
        return;
      }
      window.audio.playButtonClick();
      this.game.network?.login(u, p);
    });

    document.getElementById('btn-register-submit')?.addEventListener('click', () => {
      const u = document.getElementById('login-username')?.value.trim();
      const p = document.getElementById('login-password')?.value.trim();
      if (!u || !p) {
        alert('아이디와 비밀번호를 모두 입력해주세요!');
        return;
      }
      window.audio.playButtonClick();
      this.game.network?.register(u, p);
    });

    document.getElementById('btn-login-guest')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-maple-login');
      if (modal) modal.style.display = 'none';
      window.audio.playButtonClick();
    });

    // Character Selection Lobby & 4/4 Dice Roll listeners
    document.getElementById('btn-char-lobby-close')?.addEventListener('click', () => {
      document.getElementById('modal-char-lobby').style.display = 'none';
    });
    document.getElementById('btn-lobby-logout')?.addEventListener('click', () => {
      document.getElementById('modal-char-lobby').style.display = 'none';
      if (this.game.network) this.game.network.authenticated = false;
      this.showLoginModal();
    });
    document.getElementById('btn-char-create-close')?.addEventListener('click', () => {
      document.getElementById('modal-char-create').style.display = 'none';
      document.getElementById('modal-char-lobby').style.display = 'flex';
    });
    document.getElementById('btn-create-char-cancel')?.addEventListener('click', () => {
      document.getElementById('modal-char-create').style.display = 'none';
      document.getElementById('modal-char-lobby').style.display = 'flex';
    });
    document.getElementById('btn-dice-roll')?.addEventListener('click', () => {
      this.rollDiceStats();
    });
    document.getElementById('btn-create-char-submit')?.addEventListener('click', () => {
      this.submitCharacterCreate();
    });

    // Armory category tab listeners
    document.querySelectorAll('.armory-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.armory-tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const cat = e.target.dataset.category;
        window.audio.playButtonClick();
        this.renderArmoryWindow(cat);
      });
    });

    // Key Config Preset Buttons
    document.getElementById('btn-preset-classic')?.addEventListener('click', () => {
      this.game.keyConfig?.applyPreset('classic');
      window.audio.playButtonClick();
      this.renderKeyConfigWindow();
    });
    document.getElementById('btn-preset-wasd')?.addEventListener('click', () => {
      this.game.keyConfig?.applyPreset('wasd');
      window.audio.playButtonClick();
      this.renderKeyConfigWindow();
    });
    document.getElementById('btn-preset-reset')?.addEventListener('click', () => {
      this.game.keyConfig?.applyPreset('default');
      window.audio.playButtonClick();
      this.renderKeyConfigWindow();
    });

    document.querySelectorAll('.btn-window-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const win = e.target.closest('.maple-window') || e.target.closest('.maple-dialog-modal') || e.target.closest('#modal-job-advance');
        if (win) win.style.display = 'none';
        window.audio.playButtonClick();
      });
    });

    document.getElementById('btn-npc-dialog-close')?.addEventListener('click', () => {
      document.getElementById('modal-npc-dialog').style.display = 'none';
    });
    document.getElementById('btn-npc-dialog-exit')?.addEventListener('click', () => {
      document.getElementById('modal-npc-dialog').style.display = 'none';
    });

    document.getElementById('btn-map-travel-close')?.addEventListener('click', () => {
      document.getElementById('modal-map-travel').style.display = 'none';
    });

    // Map travel modal destination buttons
    document.querySelectorAll('.btn-map-target').forEach(btn => {
      btn.addEventListener('click', () => {
        const mapKey = btn.dataset.map;
        const modal = document.getElementById('modal-map-travel');
        if (modal) modal.style.display = 'none';
        this.game.changeMap(mapKey);
      });
    });

    // Chat input handlers
    const chatInput = document.getElementById('chat-input');
    const sendChat = () => {
      if (!chatInput) return;
      const text = chatInput.value.trim();
      if (text) {
        this.game.sendChatMessage(text);
        chatInput.value = '';
        chatInput.blur();
      }
    };

    document.getElementById('btn-chat-send')?.addEventListener('click', sendChat);
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendChat();
      }
    });

    document.querySelectorAll('.inven-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.inven-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.renderInventoryTab(e.target.dataset.tab);
        window.audio.playButtonClick();
      });
    });

    ['str', 'dex', 'int', 'luk'].forEach(stat => {
      document.getElementById(`btn-add-${stat}`)?.addEventListener('click', () => {
        if (this.game.player.ap > 0) {
          this.game.player[stat]++;
          this.game.player.ap--;
          this.game.player.calcDerivedStats();
          this.game.player.persistProgress(this.game, true);
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

    // Modal Job Choice Buttons
    document.querySelectorAll('.btn-job-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        const job = btn.dataset.job;
        this.game.changePlayerJob(job);
        const modal = document.getElementById('modal-job-advance');
        if (modal) modal.style.display = 'none';
        window.audio.playLevelUp();
      });
    });

    // Quickslots Click / Touch Trigger (for Desktop clicks and Mobile/LAN touch)
    const addQuickslotAction = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;
      const trigger = (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (e) e.stopPropagation();
        el.style.transform = 'scale(0.9)';
        setTimeout(() => { if (el) el.style.transform = ''; }, 120);
        action();
      };
      el.addEventListener('click', trigger);
      el.addEventListener('touchstart', trigger, { passive: false });
    };

    addQuickslotAction('quick-slot-attack', () => this.game.player.primaryAttack(this.game));
    for (let slot = 1; slot <= 8; slot++) {
      addQuickslotAction(`quick-slot-${slot}`, () => {
        const skillId = this.game.getQuickslotSkill(slot - 1);
        if (skillId) this.game.player.useSkill(skillId, this.game);
      });
    }
    addQuickslotAction('quick-slot-jump', () => this.game.jumpPlayer());
    addQuickslotAction('quick-slot-loot', () => this.game.pickUpNearbyDrops());
    addQuickslotAction('quick-slot-potion-red', () => this.game.player.usePotion('red_potion'));
    addQuickslotAction('quick-slot-potion-blue', () => this.game.player.usePotion('blue_potion'));
    addQuickslotAction('quick-slot-autohunt', () => this.game.autoHunt.toggle());
  }


  showCharacterLobby(characters = [], username = '모험가') {
    const loginModal = document.getElementById('modal-maple-login');
    if (loginModal) loginModal.style.display = 'none';

    const lobbyModal = document.getElementById('modal-char-lobby');
    if (lobbyModal) {
      lobbyModal.style.display = 'flex';
      const nameEl = document.getElementById('lobby-account-name');
      if (nameEl) nameEl.innerText = username;
      this.renderCharacterSlots(characters);
    }
  }

  renderCharacterSlots(characters = []) {
    const grid = document.getElementById('char-slots-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 0; i < 4; i++) {
      const charData = characters[i];
      const slotEl = document.createElement('div');

      if (charData) {
        slotEl.className = 'char-slot-card';
        let jobIcon = '🍁';
        if (charData.job === '전사') jobIcon = '⚔️';
        else if (charData.job === '마법사') jobIcon = '🔮';
        else if (charData.job === '궁수') jobIcon = '🏹';
        else if (charData.job === '도적') jobIcon = '🗡️';

        let mapName = '헤네시스';
        if (charData.currentMap === 'ant_tunnel') mapName = '개미굴';
        else if (charData.currentMap === 'ellinia') mapName = '엘리니아';
        else if (charData.currentMap === 'zakum_altar') mapName = '자쿰 제단';

        slotEl.innerHTML = `
          <div class="char-slot-avatar">${jobIcon}</div>
          <div class="char-slot-name">${charData.name}</div>
          <div class="char-slot-meta">Lv.${charData.level} ${charData.job}</div>
          <div style="font-size: 10px; color: #854d0e; margin-bottom: 6px;">📍 ${mapName}</div>
          <button class="btn-maple btn-select-char" style="width: 100%; padding: 6px 0; font-weight: bold; background: linear-gradient(to bottom, #10b981, #059669); color: #fff;">
            선택 접속
          </button>
        `;

        slotEl.querySelector('.btn-select-char')?.addEventListener('click', () => {
          window.audio?.playButtonClick?.();
          this.game.network?.selectCharacter(charData.charId);
        });
      } else {
        slotEl.className = 'char-slot-card empty-slot';
        slotEl.innerHTML = `
          <div style="font-size: 32px; color: #9ca3af; margin-bottom: 4px;">➕</div>
          <div style="font-size: 12px; font-weight: bold; color: #6b7280;">새 캐릭터 생성</div>
        `;
        slotEl.addEventListener('click', () => {
          window.audio?.playButtonClick?.();
          this.showCharacterCreateModal();
        });
      }

      grid.appendChild(slotEl);
    }
  }

  showCharacterCreateModal() {
    const lobbyModal = document.getElementById('modal-char-lobby');
    if (lobbyModal) lobbyModal.style.display = 'none';

    const createModal = document.getElementById('modal-char-create');
    if (createModal) {
      createModal.style.display = 'flex';
      const nameInput = document.getElementById('create-char-name');
      if (nameInput) {
        nameInput.value = '';
        nameInput.focus();
      }
      this.rollDiceStats();
    }
  }

  rollDiceStats() {
    const diceBoard = document.getElementById('modal-char-create')?.querySelector('.maple-dialog-body');
    if (diceBoard) {
      diceBoard.classList.remove('dice-rolling');
      void diceBoard.offsetWidth; // trigger reflow
      diceBoard.classList.add('dice-rolling');
    }
    window.audio?.playButtonClick?.();

    let rem = 9;
    const cuts = [0, 0, 0];
    for (let i = 0; i < 3; i++) cuts[i] = Math.floor(Math.random() * (rem + 1));
    cuts.sort((a, b) => a - b);

    const p0 = cuts[0];
    const p1 = cuts[1] - cuts[0];
    const p2 = cuts[2] - cuts[1];
    const p3 = rem - cuts[2];

    const stats = [4 + p0, 4 + p1, 4 + p2, 4 + p3];
    for (let i = stats.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [stats[i], stats[j]] = [stats[j], stats[i]];
    }

    this.currentDiceStats = {
      str: stats[0],
      dex: stats[1],
      int: stats[2],
      luk: stats[3]
    };

    document.getElementById('dice-val-str').innerText = this.currentDiceStats.str;
    document.getElementById('dice-val-dex').innerText = this.currentDiceStats.dex;
    document.getElementById('dice-val-int').innerText = this.currentDiceStats.int;
    document.getElementById('dice-val-luk').innerText = this.currentDiceStats.luk;

    // Check 4/4 Recommendation
    const badge = document.getElementById('dice-recommend-badge');
    if (badge) {
      const { str, dex, int: intStat, luk } = this.currentDiceStats;
      if (intStat === 4 && luk === 4) {
        badge.innerHTML = '⭐ <span style="color: #dc2626;">전사 / 궁수</span> 최적 세팅 (INT 4 / LUK 4) 달성!';
      } else if (str === 4 && dex === 4) {
        badge.innerHTML = '⭐ <span style="color: #2563eb;">마법사</span> 최적 세팅 (STR 4 / DEX 4) 달성!';
      } else if (str === 4 && intStat === 4) {
        badge.innerHTML = '⭐ <span style="color: #9333ea;">도적</span> 최적 세팅 (STR 4 / INT 4) 달성!';
      } else {
        badge.innerHTML = '주사위를 계속 굴려 비주력 스탯 4/4를 노려보세요!';
      }
    }
  }

  submitCharacterCreate() {
    const nameInput = document.getElementById('create-char-name');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name || name.length < 2 || name.length > 12) {
      alert('캐릭터 이름은 2자 이상 12자 이하여야 합니다.');
      nameInput?.focus();
      return;
    }

    if (!this.currentDiceStats) {
      this.rollDiceStats();
    }

    const { str, dex, int: intStat, luk } = this.currentDiceStats;
    if ((str + dex + intStat + luk) !== 25) {
      alert('스탯 총합이 25가 아닙니다. 주사위를 다시 굴려주세요.');
      return;
    }

    window.audio?.playButtonClick?.();
    if (this.game.network) {
      this.game.network.createCharacter(name, str, dex, intStat, luk);
    }
  }

  onCharacterCreated(success, message, characters = []) {
    if (success) {
      const createModal = document.getElementById('modal-char-create');
      if (createModal) createModal.style.display = 'none';
      this.showCharacterLobby(characters, this.game.network?.accountUsername || '모험가');
      this.addChat('system', `🎉 [캐릭터 생성] ${message}`);
    }
  }

  hideAllAuthScreens() {
    const loginModal = document.getElementById('modal-maple-login');
    if (loginModal) loginModal.style.display = 'none';

    const lobbyModal = document.getElementById('modal-char-lobby');
    if (lobbyModal) lobbyModal.style.display = 'none';

    const createModal = document.getElementById('modal-char-create');
    if (createModal) createModal.style.display = 'none';
  }

  onServerEnchantResult(success, message, data) {
    if (data && data.inventory) {
      this.game.player.inventory = data.inventory;
      this.game.player.calcDerivedStats();
    }
    this.renderInventoryTab('equip');
    this.updateStatsWindow();
    this.updateHUD();

    if (success) {
      window.audio?.playScrollSuccess?.();
      this.game.spawnItemText(this.game.player.x, this.game.player.y - 45, '★ 강화 성공! ★');
    } else {
      window.audio?.playScrollFail?.();
      this.game.spawnItemText(this.game.player.x, this.game.player.y - 45, '💨 주문서 미끄러짐... 💨');
    }

    this.addChat('system', `[서버 강화] ${message}`);
  }

  toggleWindow(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const isVisible = el.style.display === 'block';
    el.style.display = isVisible ? 'none' : 'block';
    window.audio.playButtonClick();

    if (!isVisible) {
      if (id === 'win-stats') this.updateStatsWindow();
      if (id === 'win-inventory') this.renderInventoryTab('use');
      if (id === 'win-skills') this.updateSkillsWindow();
      if (id === 'win-keyconfig') this.renderKeyConfigWindow();
      if (id === 'win-armory') this.renderArmoryWindow('swords');
      this.constrainWindow(el);
    }
  }

  constrainWindow(el) {
    const rect = el.getBoundingClientRect();
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8))}px`;
    el.style.top = `${Math.max(8, Math.min(rect.top, window.innerHeight - rect.height - 8))}px`;
  }

  initResponsiveControls() {
    const menu = document.getElementById('game-menu');
    menu?.addEventListener('click', (event) => {
      if (event.target.closest('button')) menu.open = false;
    });
    document.addEventListener('pointerdown', (event) => {
      if (menu?.open && !menu.contains(event.target)) menu.open = false;
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu) menu.open = false;
      if (event.key === 'Escape' && chat?.contains(document.activeElement)) {
        document.activeElement.blur();
        setChatCollapsed(true);
      }
      if (event.key === 'Enter' && !event.defaultPrevented && !this.game.isTextInput(event.target) && !this.game.isTextInput(document.activeElement) &&
          !this.game.keyConfig?.getAction(event.code) && !event.target.closest?.('button, summary')) {
        event.preventDefault();
        setChatCollapsed(false);
        document.getElementById('chat-input')?.focus();
      }
    });
    const chat = document.getElementById('maple-chat-container');
    const toggle = document.getElementById('btn-chat-toggle');
    const setChatCollapsed = (collapsed) => {
      chat?.classList.toggle('chat-collapsed', collapsed);
      toggle?.setAttribute('aria-expanded', String(!collapsed));
      if (toggle) toggle.textContent = collapsed ? '대화 펼치기' : '대화 접기';
    };
    this.setChatCollapsed = setChatCollapsed;
    setChatCollapsed(window.innerWidth < 740 || this.game.map.isBossMap);
    window.matchMedia('(max-width: 739px)').addEventListener('change', event => setChatCollapsed(event.matches || this.game.map.isBossMap));
    toggle?.addEventListener('click', () => setChatCollapsed(!chat.classList.contains('chat-collapsed')));
    document.getElementById('chat-input')?.addEventListener('focus', () => setChatCollapsed(false));
    window.addEventListener('resize', () => {
      document.querySelectorAll('.maple-window').forEach(el => {
        if (el.style.display === 'block') this.constrainWindow(el);
      });
    });
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
        activeWin.style.left = `${Math.max(8, Math.min(e.clientX - offset.x, innerWidth - activeWin.offsetWidth - 8))}px`;
        activeWin.style.top = `${Math.max(8, Math.min(e.clientY - offset.y, innerHeight - activeWin.offsetHeight - 8))}px`;
        activeWin.style.right = 'auto';
      }
    });

    window.addEventListener('mouseup', () => {
      if (activeWin) {
        activeWin.style.zIndex = '200';
        activeWin = null;
      }
    });
  }

  initHotkeys() {
    window.addEventListener('keydown', (e) => {
      if (this.game.isTextInput(e.target) || this.game.isTextInput(document.activeElement)) return;
      if (this.game.keyConfig.getAction(e.code)) return;

      const code = e.code;
      if (code === 'KeyC') this.toggleWindow('win-stats');
      else if (code === 'KeyI') this.toggleWindow('win-inventory');
      else if (code === 'KeyK') this.toggleWindow('win-skills');
      else if (code === 'KeyO') this.toggleWindow('win-auto-config');
    });
  }

  updateHud() {
    this.updateHUD();
  }

  updateHUD() {
    const player = this.game.player;

    const hpFill = document.getElementById('hud-hp-fill');
    const hpText = document.getElementById('hud-hp-text');
    if (hpFill && hpText) {
      const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
      hpFill.style.width = `${hpPct}%`;
      hpText.innerText = `${player.hp} / ${player.maxHp}`;
    }

    const mpFill = document.getElementById('hud-mp-fill');
    const mpText = document.getElementById('hud-mp-text');
    if (mpFill && mpText) {
      const mpPct = Math.max(0, Math.min(100, (player.mp / player.maxMp) * 100));
      mpFill.style.width = `${mpPct}%`;
      mpText.innerText = `${player.mp} / ${player.maxMp}`;
    }

    const expFill = document.getElementById('hud-exp-fill');
    const expText = document.getElementById('hud-exp-text');
    if (expFill && expText) {
      const atMaxLevel = player.level >= Player.MAX_LEVEL;
      const expPct = atMaxLevel ? 100 : Math.max(0, Math.min(100, (player.exp / Math.max(1, player.maxExp)) * 100));
      expFill.style.width = `${expPct}%`;
      expText.innerText = atMaxLevel ? 'MAX LEVEL' : `${player.exp} / ${player.maxExp} [${expPct.toFixed(1)}%]`;
    }

    const nameEl = document.getElementById('hud-player-name');
    if (nameEl) nameEl.innerText = `${player.name} (${player.job})`;
    const lvEl = document.getElementById('hud-player-level');
    if (lvEl) lvEl.innerText = `Lv.${player.level}`;

    const redCount = player.inventory.use.find(p => p.id === 'red_potion')?.count || 0;
    const blueCount = player.inventory.use.find(p => p.id === 'blue_potion')?.count || 0;
    const qRed = document.getElementById('quick-red-count');
    const qBlue = document.getElementById('quick-blue-count');
    if (qRed) qRed.innerText = redCount;
    if (qBlue) qBlue.innerText = blueCount;

    // Render Active Buff Bar
    const buffContainer = document.getElementById('hud-buff-bar');
    if (buffContainer && player.buffs) {
      const buffEntries = Object.entries(player.buffs);
      if (buffEntries.length === 0) {
        buffContainer.innerHTML = '';
      } else {
        buffContainer.innerHTML = buffEntries.map(([k, b]) => {
          const iconHtml = (window.SkillSvgIcons && SkillSvgIcons.ICONS[k])
            ? `<div style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;">${SkillSvgIcons.getIcon(k)}</div>`
            : b.icon;
          return `
          <div class="hud-buff-badge" title="${b.name} (${Math.ceil(b.duration)}초 남음)">
            <span class="buff-icon">${iconHtml}</span>
            <span class="buff-timer">${Math.ceil(b.duration)}s</span>
          </div>
        `;
        }).join('');
      }
    }

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

  renderKeyConfigWindow() {
    const container = document.getElementById('keyconfig-list-container');
    if (!container || !this.game.keyConfig) return;

    container.innerHTML = '';
    const bindings = this.game.keyConfig.bindings;

    for (const [actionKey, data] of Object.entries(bindings)) {
      const row = document.createElement('div');
      row.className = 'keyconfig-row';
      row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: #fff; border: 1px solid #d1c4a9; border-radius: 4px; font-size: 11px;';

      const isListening = this.listeningKeyAction === actionKey;

      row.innerHTML = `
        <span style="font-weight: 700; color: #451a03;">${data.label}</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span class="key-badge" style="background: ${isListening ? '#fef08a' : '#1f2937'}; color: ${isListening ? '#b45309' : '#fef08a'}; padding: 2px 8px; border-radius: 3px; font-weight: 800; font-size: 10px; border: 1px solid #c8a86b;">
            ${isListening ? '⌨️ 키 입력...' : data.display}
          </span>
          <button class="btn-change-key btn-maple" style="padding: 2px 8px; font-size: 10px;">${isListening ? '취소' : '변경'}</button>
        </div>
      `;

      const btn = row.querySelector('.btn-change-key');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.listeningKeyAction === actionKey) {
          this.listeningKeyAction = null;
          this.renderKeyConfigWindow();
        } else {
          this.startListeningKey(actionKey);
        }
      });

      container.appendChild(row);
    }
  }

  startListeningKey(actionKey) {
    this.listeningKeyAction = actionKey;
    this.renderKeyConfigWindow();

    const onKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.removeEventListener('keydown', onKeyDown, true);

      // Escape cancels
      if (e.code !== 'Escape') {
        this.game.keyConfig.bindKey(actionKey, e.code);
        window.audio.playButtonClick();
      }
      this.listeningKeyAction = null;
      this.renderKeyConfigWindow();
      this.updateHUD();
    };

    window.addEventListener('keydown', onKeyDown, true);
  }

  renderArmoryWindow(category = 'swords') {
    const container = document.getElementById('armory-grid-container');
    if (!container) return;

    container.innerHTML = '';
    const catalog = window.MAPLE_EQUIPMENT_CATALOG || {};
    const items = catalog[category] || [];
    const p = this.game.player;

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'armory-card';

      // Check if equipped
      let isEquipped = false;
      if (item.type === 'star') {
        isEquipped = p.activeStar === item.starType;
      } else {
        const eqWp = p.inventory?.equip?.find(e => e.id === item.id && e.equipped);
        isEquipped = !!eqWp;
      }

      if (isEquipped) card.classList.add('equipped');

      // Stat string
      let statsText = `공격력: +${item.atk || 0}`;
      if (item.str) statsText += ` | STR: +${item.str}`;
      if (item.dex) statsText += ` | DEX: +${item.dex}`;
      if (item.int) statsText += ` | INT: +${item.int}`;
      if (item.luk) statsText += ` | LUK: +${item.luk}`;
      if (item.def) statsText += ` | 방어: +${item.def}`;
      if (item.spd) statsText += ` | 이속: +${item.spd}`;
      if (item.count) statsText += ` | 충전: ${item.count}개`;

      card.innerHTML = `
        <div>
          <div class="armory-card-header">
            <div class="armory-card-icon" style="background: ${item.color || '#e2e8f0'}22; border-color: ${item.color || '#94a3b8'};">
              ${item.icon || '⚔️'}
            </div>
            <div>
              <div class="armory-card-name" style="color: ${item.color || '#1e293b'}">${item.name}</div>
              <div class="armory-card-cat">${item.category || ''} (제한: Lv.${item.reqLevel || 0})</div>
            </div>
          </div>
          <div class="armory-card-stats">${statsText}</div>
          <div class="armory-card-desc">${item.desc || ''}</div>
        </div>
        <button class="armory-btn-equip ${isEquipped ? 'equipped' : ''}">
          ${isEquipped ? '✓ 장착 중' : '장착하기'}
        </button>
      `;

      const btn = card.querySelector('.armory-btn-equip');
      if (!isEquipped) {
        btn.addEventListener('click', () => {
          p.equipById(item.id);
          window.audio.playPickItem();
          this.game.spawnItemText(p.x, p.y - 45, `✨ [장착] ${item.name}!`);
          this.addChatMessage('시스템', `⚔️ [장비 장착] ${item.name}을(를) 장착했습니다!`, 'system');
          this.updateStatsWindow();
          this.updateHUD();
          this.updateQuickslotsForJob(p.job);
          this.renderArmoryWindow(category);
        });
      }

      container.appendChild(card);
    });
  }

  updateQuickslotsForJob(job) {
    const defaultQuickslots = {
      '초보자': [
        { key: 'Shift', id: 'three_snails', name: '달팽이 세껍질', icon: '🐌' },
        { key: 'Q', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' },
        { key: 'W', id: 'slash_blast', name: '슬래시 블러스트', icon: '🌀' },
        { key: 'E', id: 'flash_jump', name: '플래시 점프', icon: '⚡' },
        { key: 'A', id: 'recovery', name: '회복력 향상', icon: '❤️' },
        { key: 'S', id: null, name: '빈 슬롯', icon: '—' },
        { key: 'D', id: null, name: '빈 슬롯', icon: '—' },
        { key: 'F', id: 'flash_jump', name: '플래시 점프', icon: '⚡' }
      ],
      '전사': [
        { key: 'Shift', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' },
        { key: 'Q', id: 'slash_blast', name: '슬래시 블러스트', icon: '🌀' },
        { key: 'W', id: 'iron_body', name: '아이언 바디', icon: '🛡️' },
        { key: 'E', id: 'rage', name: '분노', icon: '🔥' },
        { key: 'A', id: 'combo_attack', name: '콤보 어택', icon: '🔮' },
        { key: 'S', id: 'brandish', name: '브랜디쉬', icon: '⚡' },
        { key: 'D', id: null, name: '빈 슬롯', icon: '—' },
        { key: 'F', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' }
      ],
      '마법사': [
        { key: 'Shift', id: 'energy_bolt', name: '에너지 볼트', icon: '🔮' },
        { key: 'Q', id: 'magic_claw', name: '매직 클로', icon: '✨' },
        { key: 'W', id: 'teleport', name: '텔레포트', icon: '🌌' },
        { key: 'E', id: 'magic_guard', name: '매직 가드', icon: '💎' },
        { key: 'A', id: 'thunderbolt', name: '썬더볼트', icon: '⚡' },
        { key: 'S', id: 'holy_symbol', name: '홀리 심볼', icon: '🕊️' },
        { key: 'D', id: null, name: '빈 슬롯', icon: '—' },
        { key: 'F', id: 'teleport', name: '텔레포트', icon: '🌌' }
      ],
      '궁수': [
        { key: 'Shift', id: 'arrow_blow', name: '애로우 블로우', icon: '🏹' },
        { key: 'Q', id: 'double_shot', name: '더블 샷', icon: '🎯' },
        { key: 'W', id: 'focus', name: '포커스', icon: '👁️' },
        { key: 'E', id: 'soul_arrow', name: '소울 애로우', icon: '✨' },
        { key: 'A', id: 'arrow_bomb', name: '애로우 밤', icon: '💣' },
        { key: 'S', id: 'hurricane', name: '폭풍의 시', icon: '🌪️' },
        { key: 'D', id: null, name: '빈 슬롯', icon: '—' },
        { key: 'F', id: 'hurricane', name: '폭풍의 시', icon: '🌪️' }
      ],
      '도적': [
        { key: 'Shift', id: 'lucky_seven', name: '럭키 세븐', icon: '⭐' },
        { key: 'Q', id: 'double_stab', name: '더블 스탭', icon: '🗡️' },
        { key: 'W', id: 'flash_jump', name: '플래시 점프', icon: '⚡' },
        { key: 'E', id: 'haste', name: '헤이스트', icon: '💨' },
        { key: 'A', id: 'dark_site', name: '다크 사이트', icon: '👤' },
        { key: 'S', id: 'shadow_partner', name: '쉐도우 파트너', icon: '👥' },
        { key: 'D', id: 'avenger', name: '어벤저', icon: '🌀' },
        { key: 'F', id: 'flash_jump', name: '플래시 점프', icon: '⚡' }
      ]
    };

    // Dynamically update Primary Basic Skill on quick-slot-attack
    const qAttack = document.getElementById('quick-slot-attack');
    if (qAttack && this.game.player) {
      const primId = this.game.player.getPrimarySkillId();
      qAttack.title = `${this.game.player.getPrimarySkillName()} [Ctrl] (기본 스킬)`;
      const iconEl = qAttack.querySelector('.slot-icon');
      if (iconEl) {
        if (window.SkillSvgIcons && SkillSvgIcons.ICONS[primId]) {
          iconEl.innerHTML = SkillSvgIcons.getIcon(primId);
        } else {
          iconEl.innerText = this.game.player.getPrimarySkillIcon();
        }
      }
    }

    const slots = defaultQuickslots[job] || defaultQuickslots['초보자'];
    if (this.game.player) {
      this.game.player.quickslotBindings = slots.map(s => s.id);
    }

    slots.forEach((s, idx) => {
      const el = document.getElementById(`quick-slot-${idx + 1}`);
      if (el) {
        el.title = s.id ? `${s.name} [${s.key}]` : `빈 슬롯 [${s.key}]`;
        const iconEl = el.querySelector('.slot-icon');
        if (iconEl) {
          if (s.id && window.SkillSvgIcons && SkillSvgIcons.ICONS[s.id]) {
            iconEl.innerHTML = SkillSvgIcons.getIcon(s.id);
          } else {
            iconEl.innerText = s.icon || '';
          }
        }
      }
    });
  }

  updateStatsWindow() {
    const p = this.game.player;
    document.getElementById('stat-win-name').innerText = p.name;
    document.getElementById('stat-win-job').innerText = p.job;
    document.getElementById('stat-win-level').innerText = p.level;

    const fameEl = document.getElementById('stat-win-fame');
    if (fameEl) fameEl.innerText = p.fame || 0;

    document.getElementById('stat-win-hp').innerText = `${p.hp}/${p.maxHp}`;
    document.getElementById('stat-win-mp').innerText = `${p.mp}/${p.maxMp}`;
    document.getElementById('stat-win-atk').innerText = `${p.minAtk} ~ ${p.maxAtk}`;

    const accEl = document.getElementById('stat-win-acc');
    if (accEl) accEl.innerText = p.accuracy || 10;
    const defEl = document.getElementById('stat-win-def');
    if (defEl) defEl.innerText = p.defense || 3;

    document.getElementById('stat-win-str').innerText = `${p.str}${p.totalStr > p.str ? ' (+' + (p.totalStr - p.str) + ')' : ''}`;
    document.getElementById('stat-win-dex').innerText = `${p.dex}${p.totalDex > p.dex ? ' (+' + (p.totalDex - p.dex) + ')' : ''}`;
    document.getElementById('stat-win-int').innerText = `${p.int}${p.totalInt > p.int ? ' (+' + (p.totalInt - p.int) + ')' : ''}`;
    document.getElementById('stat-win-luk').innerText = `${p.luk}${p.totalLuk > p.luk ? ' (+' + (p.totalLuk - p.luk) + ')' : ''}`;
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
    const items = (p.inventory[tabName] || []).filter(item => item.count === undefined || item.count > 0);

    const mesoEl = document.getElementById('inven-meso-amount');
    if (mesoEl) mesoEl.innerText = p.meso.toLocaleString();

    for (let i = 0; i < 24; i++) {
      const slot = document.createElement('div');
      slot.className = 'inven-slot';

      if (items[i]) {
        const item = items[i];

        if (tabName === 'equip') {
          if (item.equipped) slot.classList.add('equipped');
          const succ = item.successCount || item.enhancements || 0;
          slot.title = `${item.name} (+${succ}) [${item.equipped ? '장착 중' : '미장착'}]\nUUID: ${item.item_uuid || 'N/A'}\n공격력: +${item.atk || 0} / 방어력: +${item.def || 0}\n남은 업그레이드 가능 횟수: ${item.upgradeSlots ?? 7}회\n(클릭하여 장착/해제, 아래 패널에서 강화)`;
        } else if (tabName === 'use' && item.type === 'scroll') {
          slot.title = `${item.name} x${item.count}\n성공률: ${(item.rate * 100)}%\n성공 시 ${item.bonusDef !== undefined ? '방어력 +' + item.bonusDef : '공격력 +' + item.bonusAtk}\n(클릭하여 아래 강화 패널에서 선택)`;
        } else {
          slot.title = `${item.name}${item.count ? ' x' + item.count : ''}`;
        }

        let icon = item.icon || '📦';
        if (item.id === 'red_potion') icon = '🧪';
        else if (item.id === 'blue_potion') icon = '💙';
        else if (item.type === 'scroll') icon = '📜';
        else if (item.type === 'weapon') icon = '🗡️';
        else if (item.type === 'chair') icon = '🪑';
        else if (tabName === 'cash') icon = '✨';
        else if (item.id === 'zakum_helm') icon = '👑';
        else if (item.id === 'pan_lid') icon = '🍳';
        else if (item.type === 'hat') icon = '🧢';
        else if (item.id === 'snail_shell') icon = '🐚';
        else if (item.id === 'slime_liquid') icon = '💧';
        else if (item.id === 'mushroom_cap') icon = '🍄';
        slot.innerHTML = `<span class="slot-icon">${icon}</span><span class="slot-count">${item.count || ''}</span>`;

        slot.addEventListener('click', () => {
          if (tabName === 'equip') {
            p.toggleEquip(item);
            window.audio.playButtonClick();
            this.renderInventoryTab('equip');
            this.updateStatsWindow();
            this.updateHUD();
          } else if (tabName === 'use') {
            if (item.type === 'scroll') {
              this.enhancementScrollId = item.id;
              this.renderEnhancementPanel();
              document.getElementById('inven-enhancement-panel')?.scrollIntoView({block: 'nearest'});
            } else if (item.count > 0) {
              p.usePotion(item.id);
              this.renderInventoryTab('use');
            }
          }
        });
      }

      container.appendChild(slot);
    }
    this.renderEnhancementPanel();
  }

  renderEnhancementPanel() {
    const container = document.getElementById('inven-enhancement-panel');
    if (!container) return;
    const player = this.game.player;
    const equipment = player.inventory.equip.filter(item => Number.isFinite(item.upgradeSlots) && item.type !== 'star');
    if (!equipment.includes(this.enhancementTarget)) {
      this.enhancementTarget = equipment.find(item => item.equipped && item.type === 'weapon') || equipment[0];
    }
    const target = this.enhancementTarget;
    const scrolls = player.inventory.use.filter(item => item.count > 0 && player.canUseEquipmentScroll(target, item))
      .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
    const scroll = scrolls.find(item => item.id === this.enhancementScrollId) || scrolls[0];
    this.enhancementScrollId = scroll?.id;
    const fee = player.getEnhancementFee(target);
    container.innerHTML = `
      <div style="font-size: 12px; font-weight: 800; color: #92400e; margin-bottom: 6px;">장비 강화</div>
      <label style="font-size: 11px; display: block;">장비 <select id="enhancement-equipment" style="width: 100%; margin: 3px 0 6px; padding: 4px;"></select></label>
      <label style="font-size: 11px; display: block;">주문서 <select id="enhancement-scroll" style="width: 100%; margin: 3px 0 6px; padding: 4px;"></select></label>
      <div id="enhancement-info" style="font-size: 10px; line-height: 1.5; color: #713f12;"></div>
      <button id="btn-enhance-equipment" class="btn-maple" style="width: 100%; margin-top: 6px; padding: 5px;">강화하기</button>
      <div id="enhancement-result" role="status" style="font-size: 10px; line-height: 1.5; margin-top: 5px;"></div>
    `;
    const targetSelect = container.querySelector('#enhancement-equipment');
    equipment.forEach((item, index) => {
      const option = document.createElement('option');
      option.value = `${index}`;
      option.textContent = `${item.name} +${item.enhancements || 0} (남은 횟수 ${item.upgradeSlots})`;
      option.selected = item === target;
      targetSelect.appendChild(option);
    });
    targetSelect.onchange = () => {
      this.enhancementTarget = equipment[Number(targetSelect.value)];
      this.enhancementScrollId = null;
      this.renderEnhancementPanel();
    };
    const scrollSelect = container.querySelector('#enhancement-scroll');
    if (!scrolls.length) {
      const option = document.createElement('option');
      option.textContent = '사용 가능한 주문서 없음 · 상점에서 구매';
      scrollSelect.appendChild(option);
    }
    scrolls.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.name} x${item.count}`;
      option.selected = item === scroll;
      scrollSelect.appendChild(option);
    });
    scrollSelect.onchange = () => { this.enhancementScrollId = scrollSelect.value; this.renderEnhancementPanel(); };
    const info = container.querySelector('#enhancement-info');
    info.textContent = scroll
      ? `성공률 ${Math.round(scroll.rate * 100)}% · ${scroll.bonusDef !== undefined ? '방어력 +' + scroll.bonusDef : '공격력 +' + scroll.bonusAtk} · 수수료 ${fee.toLocaleString()} 메소. 실패해도 주문서·수수료·남은 횟수 1회가 소모됩니다.`
      : '무기에는 공격력 주문서, 방어구에는 방어력 주문서를 사용합니다.';
    const button = container.querySelector('#btn-enhance-equipment');
    button.disabled = !target || !scroll || target.upgradeSlots <= 0 || player.meso < fee;
    button.onclick = () => {
      const result = player.enhanceEquipment(target, scroll, this.game);
      this.enhancementFeedback = result
        ? `${result.success ? '성공' : '실패'} · ${result.itemName}${result.success ? ' · ' + (result.stat === 'atk' ? '공격력' : '방어력') + ' +' + result.bonus : ''} · ${result.fee.toLocaleString()} 메소 사용 · 남은 횟수 ${result.remainingSlots}`
        : (player.speechText || '강화할 수 없습니다.');
      this.renderInventoryTab(document.querySelector('.inven-tab.active')?.dataset.tab || 'equip');
      document.getElementById('enhancement-result')?.scrollIntoView({block: 'nearest'});
    };
    const feedback = container.querySelector('#enhancement-result');
    feedback.textContent = this.enhancementFeedback || '';
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
      const iconHtml = (window.SkillSvgIcons && SkillSvgIcons.ICONS[id])
        ? `<div style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;">${SkillSvgIcons.getIcon(id)}</div>`
        : skill.icon;

      row.innerHTML = `
        <div class="skill-icon" style="width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; padding: 1px;">${iconHtml}</div>
        <div class="skill-info">
          <div class="skill-name">${skill.name}</div>
          <div class="skill-level">Lv. ${skill.level} / ${skill.maxLevel}</div>
          <div style="font-size: 9px; color: #854d0e;">${skill.desc || ''}</div>
        </div>
        <button class="btn-skill-cast" title="스킬 즉시 사용">사용</button>
        <button class="btn-maple btn-sp-add" ${p.sp <= 0 || skill.level >= skill.maxLevel ? 'disabled' : ''}>+</button>
      `;

      row.querySelector('.btn-skill-cast')?.addEventListener('click', () => {
        p.useSkill(id, this.game);
        this.updateHUD();
      });

      row.querySelector('.btn-sp-add')?.addEventListener('click', () => {
        if (p.sp > 0 && skill.level < skill.maxLevel) {
          skill.level++;
          p.sp--;
          p.persistProgress(this.game);
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
  }

  // --- CLASSIC NPC DIALOGUE SYSTEM ---
  showNpcDialog(npc) {
    const modal = document.getElementById('modal-npc-dialog');
    if (!modal) return;

    window.audio.playButtonClick();

    document.getElementById('npc-dialog-title').innerText = `${npc.name} 대화`;
    document.getElementById('npc-dialog-portrait').src = `assets/npcs/${npc.type}.png`;
    document.getElementById('npc-dialog-name').innerText = npc.name;

    const textEl = document.getElementById('npc-dialog-text');
    const choicesEl = document.getElementById('npc-dialog-choices');
    choicesEl.innerHTML = '';

    if (npc.type === 'regular_cab') {
      textEl.innerText = '안녕하세요! 빅토리아 아일랜드 각 마을과 사냥터로 안전하게 모시는 중형택시입니다. 어디로 이동하시겠습니까?';
      const destinations = [
        { name: '헤네시스 사냥터 1 (초보자 사냥터)', map: 'henesys_hhg', x: 1050, y: 1320 },
        { name: '헤네시스 마을 (자유시장 & 상점)', map: 'henesys_town', x: 2200, y: 880 },
        { name: '마법의 숲 엘리니아 (요정의 마을)', map: 'ellinia', x: 1400, y: 4550 },
        { name: '던전 개미굴 1 (위험한 동굴 탐험)', map: 'ant_tunnel', x: 400, y: 240 }
      ];

      destinations.forEach(dest => {
        const btn = document.createElement('button');
        btn.className = 'npc-choice-btn';
        btn.innerText = `▶ ${dest.name} 로 이동`;
        btn.addEventListener('click', () => {
          modal.style.display = 'none';
          this.game.changeMap(dest.map);
        });
        choicesEl.appendChild(btn);
      });
    } else if (npc.type === 'vip_cab') {
      textEl.innerText = '심해와 던전 깊은 곳까지 빠르게 직통으로 모시는 모범택시입니다. 어디로 가시겠습니까?';
      const destinations = [
        { name: '던전 개미굴 1 (직통 이동)', map: 'ant_tunnel', x: 400, y: 240 },
        { name: '자쿰의 제단 (고대 거신 보스 구역)', map: 'zakum_altar', x: 180, y: 490 },
        { name: '헤네시스 마을로 복귀', map: 'henesys_town', x: 2200, y: 880 }
      ];

      destinations.forEach(dest => {
        const btn = document.createElement('button');
        btn.className = 'npc-choice-btn';
        btn.innerText = `▶ ${dest.name}`;
        btn.addEventListener('click', () => {
          modal.style.display = 'none';
          this.game.changeMap(dest.map);
        });
        choicesEl.appendChild(btn);
      });
    } else if (npc.type === 'adobis') {
      textEl.innerText = '자쿰의 제단에 오신 것을 환영합니다. 제단에 불의 눈을 바쳐 고대 거신 자쿰을 깨우시겠습니까?';
      const choices = [
        { text: '🔥 자쿰 레이드 시작 (자쿰 소환)', action: () => this.game.spawnZakumBoss() },
        { text: '헤네시스로 안전하게 귀환하기', action: () => this.game.changeMap('henesys_hhg') }
      ];

      choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'npc-choice-btn';
        btn.innerText = `▶ ${ch.text}`;
        btn.addEventListener('click', () => {
          modal.style.display = 'none';
          ch.action();
        });
        choicesEl.appendChild(btn);
      });
    } else if (npc.type === 'chief_stan') {
      textEl.innerText = '반갑네, 젊은 모험가여! 헤네시스 사냥터의 몬스터를 물리치고 마을을 수호해주어 고맙네. 자네의 명예를 치하하여 인기도를 올려주겠네!';
      const choices = [
        {
          text: '🛒 헤네시스 잡화상점 이용하기 (물약/주문서 구매 & 전리품 판매)',
          action: () => this.showShopModal()
        },
        {
          text: '🏅 장로스탄의 칭찬 받기 (인기도 +5 획득)',
          action: () => {
            this.game.player.fame = (this.game.player.fame || 0) + 5;
            window.audio.playLevelUp();
            this.game.spawnItemText(this.game.player.x, this.game.player.y - 45, '★ 인기도 +5 획득! ★');
            this.addChat('system', '🌟 [장로스탄의 보상] 인기도가 +5 상승했습니다!');
            this.updateStatsWindow();
          }
        },
        { text: '헤네시스 사냥터 1로 바로 가기', action: () => this.game.changeMap('henesys_hhg') }
      ];
      choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'npc-choice-btn';
        btn.innerText = `▶ ${ch.text}`;
        btn.addEventListener('click', () => {
          modal.style.display = 'none';
          ch.action();
        });
        choicesEl.appendChild(btn);
      });
    } else if (npc.type === 'maya') {
      textEl.innerText = '콜록콜록... 몸이 허약해서 약이 필요해요. 모험가님, 힘이 되어주셔서 정말 감사해요!';
      const choices = [
        {
          text: '💊 마야에게 보약 선물하기 (인기도 +10 획득)',
          action: () => {
            this.game.player.fame = (this.game.player.fame || 0) + 10;
            window.audio.playLevelUp();
            this.game.spawnItemText(this.game.player.x, this.game.player.y - 45, '★ 인기도 +10 획득! ★');
            this.addChat('system', '🌟 [마야와 이상한 약] 마야가 기운을 차렸습니다! 인기도 +10 획득!');
            this.updateStatsWindow();
          }
        },
        { text: '마야의 집 둘러보기', action: () => {} }
      ];
      choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'npc-choice-btn';
        btn.innerText = `▶ ${ch.text}`;
        btn.addEventListener('click', () => {
          modal.style.display = 'none';
          ch.action();
        });
        choicesEl.appendChild(btn);
      });
    } else {
      textEl.innerText = '반갑습니다! 메이플 월드를 여행하는 중이신가요? 오늘도 즐거운 모험 되세요!';
      const btn = document.createElement('button');
      btn.className = 'npc-choice-btn';
      btn.innerText = '▶ 대화 마치기';
      btn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
      choicesEl.appendChild(btn);
    }

    modal.style.display = 'flex';
  }

  // --- QUICK WORLD MAP TRAVEL MODAL ---
  showMapTravelModal() {
    const modal = document.getElementById('modal-map-travel');
    if (!modal) return;
    window.audio.playButtonClick();
    modal.style.display = 'flex';
  }

  // --- CHAT SYSTEM ---
  addChat(sender, text = null, type = 'system') {
    if (text === null) {
      this.addChatMessage('시스템', sender, 'system');
    } else {
      this.addChatMessage(sender, text, type);
    }
  }

  addChatMessage(sender, text, type = 'player') {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = `chat-msg ${type}`;
    if (type === 'system') {
      row.innerText = text;
    } else {
      row.innerHTML = `<span class="chat-sender">${sender}</span> : ${text}`;
    }

    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
  }

  // --- BOTTOM-RIGHT LOOT & EXP LOG POPUP ---
  addLootLog(text, type = 'meso') {
    const logBox = document.getElementById('maple-loot-log');
    if (!logBox) return;

    const item = document.createElement('div');
    item.className = `loot-log-item ${type}`;
    item.innerText = text;

    logBox.appendChild(item);

    setTimeout(() => {
      if (item.parentNode === logBox) {
        logBox.removeChild(item);
      }
    }, 3200);
  }

  // --- LOGIN MODAL ---
  showLoginModal() {
    const modal = document.getElementById('modal-maple-login');
    if (!modal) return;
    modal.style.display = 'flex';
    window.audio.playButtonClick();
  }

  // --- TOWN SHOP MODAL ---
  showShopModal() {
    const modal = document.getElementById('modal-maple-shop');
    if (!modal) return;
    modal.style.display = 'flex';
    window.audio.playButtonClick();
    this.renderShopModal();
  }

  renderShopModal() {
    const p = this.game.player;
    if (!p) return;

    const mesoEl = document.getElementById('shop-user-meso');
    if (mesoEl) mesoEl.innerText = p.meso.toLocaleString();

    // 1. Buy List
    const buyListEl = document.getElementById('shop-buy-list');
    if (buyListEl) {
      buyListEl.innerHTML = '';
      SHOP_ITEMS_FOR_SALE.forEach(item => {
        const row = document.createElement('div');
        row.className = 'shop-item-row';
        row.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">${item.icon}</span>
            <div>
              <div style="font-weight: 700; color: #1e293b;">${item.name}</div>
              <div style="font-size: 9px; color: #64748b;">${item.desc}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-weight: 800; color: #b45309;">${item.price.toLocaleString()} 메소</span>
            <button class="btn-maple shop-item-btn btn-buy">구매</button>
          </div>
        `;
        row.querySelector('.btn-buy').addEventListener('click', () => {
          ShopSystem.buyItem(p, item, this.game);
          this.renderShopModal();
        });
        buyListEl.appendChild(row);
      });
    }

    // 2. Sell List (Etc & Use Items)
    const sellListEl = document.getElementById('shop-sell-list');
    if (sellListEl) {
      sellListEl.innerHTML = '';
      const itemsToSell = [];

      // Collect from etc
      p.inventory.etc.forEach((it, idx) => {
        if (it.count > 0) itemsToSell.push({ tab: 'etc', idx, item: it });
      });
      // Collect from use
      p.inventory.use.forEach((it, idx) => {
        if (it.count > 0) itemsToSell.push({ tab: 'use', idx, item: it });
      });
      p.inventory.equip.forEach((it, idx) => {
        itemsToSell.push({tab: 'equip', idx, item: it});
      });

      if (itemsToSell.length === 0) {
        sellListEl.innerHTML = '<div style="color: #94a3b8; text-align: center; margin-top: 30px;">판매할 소지품이 없습니다.</div>';
      } else {
        itemsToSell.forEach(({ tab, idx, item }) => {
          const unitPrice = ITEM_SELL_PRICES[item.id] || Math.max(1, Math.floor((item.price || 10) * 0.4));
          const row = document.createElement('div');
          row.className = 'shop-item-row';
          row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 14px;">📦</span>
              <div>
                <span style="font-weight: 700;">${item.name}</span>
                <span style="color: #64748b; font-size: 10px;">x${item.count || 1}</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 700; color: #15803d;">개당 ${unitPrice} 메소</span>
              <button class="btn-maple shop-item-btn btn-sell" ${item.equipped ? 'disabled' : ''} style="background: #ef4444; color: #fff;">${item.equipped ? '장착 중' : '판매'}</button>
            </div>
          `;
          row.querySelector('.btn-sell').addEventListener('click', () => {
            ShopSystem.sellItem(p, tab, idx, this.game);
            this.renderShopModal();
          });
          sellListEl.appendChild(row);
        });
      }
    }
  }

  // --- PEER USER INTERACTION ---
  showPeerInteractionModal(peer) {
    const modal = document.getElementById('modal-user-interaction');
    if (!modal || !peer) return;

    window.audio.playButtonClick();
    modal.style.display = 'flex';

    const nameEl = document.getElementById('peer-interact-name');
    if (nameEl) nameEl.innerText = peer.name;

    const infoEl = document.getElementById('peer-interact-info');
    if (infoEl) infoEl.innerText = `Lv.${peer.level} ${peer.job} | 🌟 인기도: ${peer.fame || 0}`;

    const btnFame = document.getElementById('btn-interact-fame');
    if (btnFame) {
      btnFame.onclick = () => {
        window.audio.playLevelUp();
        this.game.network?.sendFameUp(peer.name);
        modal.style.display = 'none';
      };
    }

    const btnWhisper = document.getElementById('btn-interact-whisper');
    if (btnWhisper) {
      btnWhisper.onclick = () => {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
          this.setChatCollapsed(false);
          chatInput.value = `/w ${peer.name} `;
          chatInput.focus();
        }
        modal.style.display = 'none';
      };
    }
  }
}

window.UIManager = UIManager;
