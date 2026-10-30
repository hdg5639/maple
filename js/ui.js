// Canonical Classic OpenMaple All Jobs Catalog for Free Job Change
const ALL_JOBS_CATALOG = [
  // 0차 초보자
  { id: '초보자', name: '초보자 (Beginner)', category: 'beginner', tier: 0, icon: '🐌', desc: '달팽이 세껍질 & 자유로운 모험의 시작' },

  // 전사 계열 (1차 ~ 4차)
  { id: '전사', name: '전사 (검사)', category: 'warrior', tier: 1, icon: '⚔️', desc: '1차 · 파워 스트라이크 & 아이언 바디' },
  { id: '파이터', name: '파이터', category: 'warrior', tier: 2, icon: '⚔️', desc: '2차 · 슬래시 블러스트 & 분노 (공격력+35)' },
  { id: '크루세이더', name: '크루세이더', category: 'warrior', tier: 3, icon: '🛡️', desc: '3차 · 검기 슬래시 & 콤보 어택' },
  { id: '히어로', name: '히어로', category: 'warrior', tier: 4, icon: '👑', desc: '4차 · 브랜디쉬 (2연속 쾌도난마) & 어드밴스드 콤보' },

  // 마법사 계열 (1차 ~ 4차)
  { id: '마법사', name: '마법사 (매지션)', category: 'magician', tier: 1, icon: '🔮', desc: '1차 · 에너지 볼트, 매직 클로 & 매직 가드' },
  { id: '위자드', name: '위자드', category: 'magician', tier: 2, icon: '⚡', desc: '2차 · 강화 매직클로 (3연타), 썬더볼트 & 힐' },
  { id: '메이지', name: '메이지', category: 'magician', tier: 3, icon: '🕊️', desc: '3차 · 체인 썬더볼트 & 홀리 심볼 (EXP+50%)' },
  { id: '아크메이지', name: '아크메이지', category: 'magician', tier: 4, icon: '🌟', desc: '4차 · 제네시스 (최강 궁극 마법) & 텔포 마스터리' },

  // 궁수 계열 (1차 ~ 4차)
  { id: '궁수', name: '궁수 (아처)', category: 'bowman', tier: 1, icon: '🏹', desc: '1차 · 애로우 블로우 & 포커스' },
  { id: '헌터', name: '헌터', category: 'bowman', tier: 2, icon: '🎯', desc: '2차 · 더블 샷 & 소울 애로우 (화살 무한)' },
  { id: '레인저', name: '레인저', category: 'bowman', tier: 3, icon: '💣', desc: '3차 · 스트레이프 (4연사) & 애로우 밤' },
  { id: '보우마스터', name: '보우마스터', category: 'bowman', tier: 4, icon: '🌪️', desc: '4차 · 폭풍의 시 (기관총 연사) & 얼티밋 스트레이프' },

  // 도적 - 표창 (어쌔신) 계열 (1차 ~ 4차)
  { id: '도적', name: '도적 (로그)', category: 'thief_claw', tier: 1, icon: '⭐', desc: '1차 · 럭키 세븐, 더블 스탭 & 님블 바디' },
  { id: '어쌔신', name: '어쌔신', category: 'thief_claw', tier: 2, icon: '💨', desc: '2차 · 럭키 세븐 (3발 트리플 스로우) & 헤이스트' },
  { id: '허밋', name: '허밋', category: 'thief_claw', tier: 3, icon: '👥', desc: '3차 · 럭키 세븐 (4발 쿼드) & 쉐도우 파트너 & 드레인' },
  { id: '나이트로드', name: '나이트로드', category: 'thief_claw', tier: 4, icon: '✦', desc: '4차 · 럭키 세븐 (5발 펜타) & 어벤저 (암흑 관통)' },

  // 도적 - 단검 (시프) 계열 (2차 ~ 4차)
  { id: '시프', name: '시프 (단검도적)', category: 'thief_dagger', tier: 2, icon: '🗡️', desc: '2차 · 더블 스탭 & 새비지 블로우 (6연타 절삭 난무)' },
  { id: '시프마스터', name: '시프마스터', category: 'thief_dagger', tier: 3, icon: '🗡️', desc: '3차 · 새비지 블로우 & 쉐도우 파트너 (분신 연계)' },
  { id: '섀도어', name: '섀도어', category: 'thief_dagger', tier: 4, icon: '🗡️', desc: '4차 · 궁극의 암살 난무' }
];
window.ALL_JOBS_CATALOG = ALL_JOBS_CATALOG;

// js/ui.js - Retro Maple UI Windows, Job Selector, Quickslot Customization

class UIManager {
  // --- AUTHENTIC MAPLESTORY ITEM ICON RESOLVER ---
  static getItemIconPath(item) {
    if (!item) return null;
    let id = item.id || item.type;
    const name = item.name || '';

    // Evolving star or shuriken with starType
    if (id === 'star_evolving' || item.type === 'star' || item.starType) {
      const star = item.starType || (id ? String(id).replace(/^star_/, '').replace(/_star$/, '') : 'subi');
      return `assets/projectiles/stars/${star}_icon.png`;
    }

    if (item.iconPath && !item.iconPath.includes('star_evolving')) {
      return item.iconPath;
    }

    if (!id && !name) return null;

    let cleanId = String(id || '');
    for (const pfx of ['eq_starter_', 'eq_sample_', 'eq_shop_', 'wp_shop_', 'item_']) {
      if (cleanId.startsWith(pfx)) {
        cleanId = cleanId.substring(pfx.length);
        break;
      }
    }

    // Shurikens
    const starList = ['subi', 'mokbi', 'kumbi', 'tobi', 'steely', 'ilbi', 'hwabi', 'ultimate'];
    for (const s of starList) {
      if (cleanId === `${s}_star` || cleanId === `star_${s}` || cleanId === s) {
        return `assets/projectiles/stars/${s}_icon.png`;
      }
    }

    // Boss Trophies
    const trophyMap = {
      trophy_mano: 'assets/items/trophy_mano.png',
      trophy_stumpy: 'assets/items/trophy_stumpy.png',
      trophy_king_slime: 'assets/items/trophy_king_slime.png',
      trophy_dyle: 'assets/items/trophy_dyle.png',
      trophy_faust: 'assets/items/trophy_faust.png',
      trophy_mushmom: 'assets/items/trophy_mushmom.png',
      trophy_zombie_mushmom: 'assets/items/trophy_zombie_mushmom.png',
      trophy_jr_balrog: 'assets/items/trophy_jr_balrog.png',
      trophy_crimson_balrog: 'assets/items/trophy_crimson_balrog.png',
      trophy_manon: 'assets/items/trophy_manon.png',
      trophy_papulatus: 'assets/items/trophy_papulatus.png',
      trophy_zakum: 'assets/items/trophy_zakum.png',
      trophy_horntail: 'assets/items/trophy_horntail.png',
      trophy_pianus: 'assets/monsters/pianus/stand_0.png',
      trophy_alishar: 'assets/monsters/alishar/stand_0.png',
      trophy_griffey: 'assets/monsters/griffey/stand_0.png',
      trophy_timer: 'assets/monsters/timer/stand_0.png'
    };
    if (trophyMap[cleanId]) return trophyMap[cleanId];

    // Equipment aliases
    const aliases = {
      zakum_helm: 'helm_zakum',
      pan_lid: 'shd_pan_lid',
      wood_sword: 'wp_wood_sword',
      bandana: 'eq_bandana',
      highlander: 'wp_highlander',
      gryunhill: 'wp_gryunhill',
      dragon_claymore: 'wp_dragon_claymore',
      taeguk_fan: 'wp_taeguk_fan',
      kandine: 'wp_kandine',
      meba: 'wp_meba',
      ryden: 'wp_ryden',
      evil_wings: 'wp_evil_wings'
    };
    if (aliases[cleanId]) cleanId = aliases[cleanId];

    // Name-based mapping for monster etc drops / generic items
    const nameMap = {
      '달팽이의 껍질': 'assets/items/snail_shell.png',
      '파란달팽이 껍질': 'assets/items/blue_snail_shell.png',
      '빨간달팽이 껍질': 'assets/items/red_snail_shell.png',
      '물컹물컹한 액체': 'assets/items/slime_liquid.png',
      '방울 액체': 'assets/items/slime_liquid.png',
      '주황버섯의 갓': 'assets/items/orange_mushroom_cap.png',
      '초록버섯의 갓': 'assets/items/green_mushroom_cap.png',
      '뿔버섯의 갓': 'assets/items/horny_mushroom_cap.png',
      '돼지의 리본': 'assets/items/ribbon.png',
      '돼지의 머리': 'assets/items/pig_ribbon.png',
      '나뭇가지': 'assets/items/tree_branch.png',
      '장작': 'assets/items/firewood.png',
      '옥토퍼스의 다리': 'assets/items/octopus_leg.png',
      '죽은자의 부적': 'assets/items/zombie_mushroom_charm.png',
      '와일드보어의 어금니': 'assets/items/wild_boar_tooth.png',
      '파이어보어의 송곳니': 'assets/items/fire_boar_tooth.png',
      '커즈아이의 꼬리': 'assets/items/curse_eye_tail.png',
      '주니어 네키의 가죽': 'assets/items/necki_skin.png',
      '식탁보': 'assets/items/jr_wraith_cloth.png',
      '좀비의 잃어버린 이빨': 'assets/items/coolie_zombie_tooth.png',
      '드레이크의 피': 'assets/items/drake_blood.png',
      '타우로마시스의 뿔': 'assets/items/tauromacis_horn.png',
      '봉인된 테디베어 영혼': 'assets/items/death_teddy_soul.png',
      '빨간 포션': 'assets/items/red_potion.png',
      '주황 포션': 'assets/items/orange_potion.png',
      '하얀 포션': 'assets/items/white_potion.png',
      '파란 포션': 'assets/items/blue_potion.png',
      '마나 엘릭서': 'assets/items/mana_elixir.png',
      '엘릭서': 'assets/items/elixir.png',
      '파워 엘릭서': 'assets/items/power_elixir.png',
      '보스 토벌 주화': 'assets/items/boss_coin.png',
      '냄비 뚜껑': 'assets/items/shd_pan_lid.png',
      '자쿰의 투구': 'assets/items/helm_zakum.png',
      '👑 자쿰의 투구': 'assets/items/helm_zakum.png',
      '빨간 띠': 'assets/items/eq_bandana.png',
      '초보자 목검': 'assets/items/wp_wood_sword.png',
      '하이랜더': 'assets/items/wp_highlander.png',
      '그륜힐': 'assets/items/wp_gryunhill.png',
      '드래곤 클레이모어': 'assets/items/wp_dragon_claymore.png',
      '태극 부채': 'assets/items/wp_taeguk_fan.png',
      '칸디네': 'assets/items/wp_kandine.png',
      '메바': 'assets/items/wp_meba.png',
      '라이덴': 'assets/items/wp_ryden.png',
      '이블윙즈': 'assets/items/wp_evil_wings.png'
    };
    if (nameMap[cleanId]) return nameMap[cleanId];
    if (name && nameMap[name]) return nameMap[name];

    return `assets/items/${cleanId}.png`;
  }

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
    document.getElementById('btn-boss-spawn')?.addEventListener('click', () => this.showBossSpawnModal());
    document.getElementById('btn-snail-race-open')?.addEventListener('click', () => this.showSnailRaceModal());
    document.getElementById('btn-auto-hunt')?.addEventListener('click', () => this.game.autoHunt.toggle());
    document.getElementById('btn-job-select-open')?.addEventListener('click', () => this.showJobAdvancementModal());
    document.getElementById('btn-stat-job-change')?.addEventListener('click', () => this.showJobAdvancementModal(null, 'free'));
    document.getElementById('btn-skills-job-change')?.addEventListener('click', () => this.showJobAdvancementModal(null, 'free'));
    document.getElementById('btn-map-travel-open')?.addEventListener('click', () => this.showMapTravelModal());
    document.getElementById('btn-keyconfig-open')?.addEventListener('click', () => this.toggleWindow('win-keyconfig'));
    document.getElementById('btn-keyconfig-toggle')?.addEventListener('click', () => this.toggleWindow('win-keyconfig'));
    document.getElementById('btn-armory-open')?.addEventListener('click', () => this.toggleWindow('win-armory'));
    document.getElementById('btn-armory-toggle')?.addEventListener('click', () => this.toggleWindow('win-armory'));
    document.getElementById('btn-coordi-open')?.addEventListener('click', () => this.toggleWindow('win-coordi'));
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
    document.querySelectorAll('#win-armory .armory-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#win-armory .armory-tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const cat = e.target.dataset.category;
        window.audio.playButtonClick();
        this.renderArmoryWindow(cat);
      });
    });

    // Coordi category tab & preset listeners
    document.querySelectorAll('.coordi-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.coordi-tab-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const slot = e.currentTarget.dataset.slot || 'hat';
        window.audio?.playButtonClick?.();
        this.renderCoordiWindow(slot);
      });
    });
    document.querySelectorAll('.coordi-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.dataset.preset || 0);
        this.game.player.switchCoordiPreset(idx);
        this.game.player.persistProgress(this.game, true);
        window.audio?.playPickItem?.();
        const activeSlot = document.querySelector('.coordi-tab-btn.active')?.dataset.slot || 'hat';
        this.renderCoordiWindow(activeSlot);
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
        else if (charData.job === '어쌔신') jobIcon = '🦅';
        else if (charData.job === '시프') jobIcon = '🗡️';
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
      if (id === 'win-coordi') this.renderCoordiWindow('hat');
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
    if (!this._hudCache) this._hudCache = {};
    const c = this._hudCache;

    const hpKey = `${player.hp}/${player.maxHp}`;
    if (c.hpKey !== hpKey) {
      c.hpKey = hpKey;
      const hpFill = document.getElementById('hud-hp-fill');
      const hpText = document.getElementById('hud-hp-text');
      if (hpFill && hpText) {
        const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
        hpFill.style.width = `${hpPct}%`;
        hpText.innerText = `${player.hp} / ${player.maxHp}`;
      }
    }

    const mpKey = `${player.mp}/${player.maxMp}`;
    if (c.mpKey !== mpKey) {
      c.mpKey = mpKey;
      const mpFill = document.getElementById('hud-mp-fill');
      const mpText = document.getElementById('hud-mp-text');
      if (mpFill && mpText) {
        const mpPct = Math.max(0, Math.min(100, (player.mp / player.maxMp) * 100));
        mpFill.style.width = `${mpPct}%`;
        mpText.innerText = `${player.mp} / ${player.maxMp}`;
      }
    }

    const expKey = `${player.level}:${player.exp}/${player.maxExp}`;
    if (c.expKey !== expKey) {
      c.expKey = expKey;
      const expFill = document.getElementById('hud-exp-fill');
      const expText = document.getElementById('hud-exp-text');
      if (expFill && expText) {
        const atMaxLevel = player.level >= Player.MAX_LEVEL;
        const expPct = atMaxLevel ? 100 : Math.max(0, Math.min(100, (player.exp / Math.max(1, player.maxExp)) * 100));
        expFill.style.width = `${expPct}%`;
        expText.innerText = atMaxLevel ? 'MAX LEVEL' : `${player.exp} / ${player.maxExp} [${expPct.toFixed(1)}%]`;
      }
    }

    const idKey = `${player.name}|${player.job}|${player.level}`;
    if (c.idKey !== idKey) {
      c.idKey = idKey;
      const nameEl = document.getElementById('hud-player-name');
      if (nameEl) nameEl.innerText = `${player.name} (${player.job})`;
      const lvEl = document.getElementById('hud-player-level');
      if (lvEl) lvEl.innerText = `Lv.${player.level}`;
    }

    const redCount = player.inventory.use.find(p => p.id === 'red_potion')?.count || 0;
    const blueCount = player.inventory.use.find(p => p.id === 'blue_potion')?.count || 0;
    const potKey = `${redCount}:${blueCount}`;
    if (c.potKey !== potKey) {
      c.potKey = potKey;
      const qRed = document.getElementById('quick-red-count');
      const qBlue = document.getElementById('quick-blue-count');
      if (qRed) qRed.innerText = redCount;
      if (qBlue) qBlue.innerText = blueCount;
    }

    // Render Active Buff Bar only when buff state changes
    if (player.buffs) {
      const buffEntries = Object.entries(player.buffs);
      const buffKey = buffEntries.map(([k, b]) => `${k}:${b.permanent ? 'P' : Math.ceil(b.duration)}`).join('|');
      if (c.buffKey !== buffKey) {
        c.buffKey = buffKey;
        const buffContainer = document.getElementById('hud-buff-bar');
        if (buffContainer) {
          if (buffEntries.length === 0) {
            buffContainer.innerHTML = '';
          } else {
            buffContainer.innerHTML = buffEntries.map(([k, b]) => {
              const iconHtml = (window.SkillSvgIcons && SkillSvgIcons.ICONS[k])
                ? `<div style="width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;">${SkillSvgIcons.getIcon(k)}</div>`
                : b.icon;
              const timerHtml = b.permanent
                ? `<span class="buff-timer" style="color: #6ee7b7; font-size: 9px; font-weight: 800;">PASSIVE</span>`
                : `<span class="buff-timer">${Math.ceil(b.duration)}s</span>`;
              const titleText = b.permanent
                ? `${b.name} [패시브 상시 적용]`
                : `${b.name} (${Math.ceil(b.duration)}초 남음)`;
              return `
              <div class="hud-buff-badge ${b.permanent ? 'buff-passive' : ''}" title="${titleText}" style="${b.permanent ? 'border-color: #059669; background: rgba(6, 78, 59, 0.75);' : ''}">
                <span class="buff-icon">${iconHtml}</span>
                ${timerHtml}
              </div>
            `;
            }).join('');
          }
        }
      }
    }

    if (this.game.autoHunt.enabled) {
      const st = this.game.autoHunt.stats;
      const huntKey = `${st.duration}:${st.kills}:${st.expPerMin}:${st.mesoPerMin}`;
      if (c.huntKey !== huntKey) {
        c.huntKey = huntKey;
        const mins = Math.floor(st.duration / 60);
        const secs = st.duration % 60;
        const tEl = document.getElementById('stat-hunt-time');
        const kEl = document.getElementById('stat-hunt-kills');
        const eEl = document.getElementById('stat-hunt-exp-min');
        const mEl = document.getElementById('stat-hunt-meso-min');
        if (tEl) tEl.innerText = `${mins}분 ${secs}초`;
        if (kEl) kEl.innerText = `${st.kills} 마리`;
        if (eEl) eEl.innerText = `${st.expPerMin.toLocaleString()} EXP/분`;
        if (mEl) mEl.innerText = `${st.mesoPerMin.toLocaleString()} 메소/분`;
      }
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
            <div class="armory-card-icon" style="background: ${item.color || '#e2e8f0'}22; border-color: ${item.color || '#94a3b8'}; display: flex; align-items: center; justify-content: center;">
              ${(() => {
                const iconSrc = UIManager.getItemIconPath(item);
                return iconSrc
                  ? `<img src="${iconSrc}" style="width: 26px; height: 26px; object-fit: contain; image-rendering: pixelated;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"><span style="display:none;">${item.icon || '⚔️'}</span>`
                  : (item.icon || '⚔️');
              })()}
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

  renderCoordiMirrorPreview() {
    const canvas = document.getElementById('coordi-mirror-canvas');
    if (!canvas || !window.sprites || !this.game.player) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle mirror spotlight
    const grad = ctx.createRadialGradient(48, 56, 6, 48, 56, 42);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(1, 'rgba(251, 191, 36, 0.15)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(48, 52, 40, 0, Math.PI * 2);
    ctx.fill();

    // Pedestal
    ctx.fillStyle = '#d97706';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(48, 82, 26, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw live player paperdoll with current coordi
    const p = this.game.player;
    const origX = p.x;
    const origY = p.y;
    const origSpeech = p.speechText;
    p.x = 48;
    p.y = 80;
    p.speechText = '';
    try {
      window.sprites.drawPlayer(ctx, p);
    } finally {
      p.x = origX;
      p.y = origY;
      p.speechText = origSpeech;
    }
  }

  renderCoordiWindow(slot = 'hat') {
    const container = document.getElementById('coordi-grid-container');
    if (!container || !this.game.player) return;
    const p = this.game.player;
    container.innerHTML = '';

    document.querySelectorAll('.coordi-preset-btn').forEach(btn => {
      const idx = Number(btn.dataset.preset || 0);
      const isActive = p.activeCoordiPreset === idx;
      btn.style.background = isActive ? 'linear-gradient(to bottom, #db2777, #9d174d)' : '#475569';
      btn.style.borderColor = isActive ? '#fbcfe8' : '#94a3b8';
    });

    const catalog = window.MAPLE_COORDI_CATALOG || {};
    const items = catalog[slot] || [];
    const currentId = slot === 'face'
      ? (p.coordi?.faceAcc || p.coordi?.eyeAcc || null)
      : (p.coordi?.[slot] || null);

    // Option to unequip coordi slot (revert to default look)
    const unequipCard = document.createElement('div');
    unequipCard.className = `armory-card ${currentId === null ? 'equipped' : ''}`;
    unequipCard.innerHTML = `
      <div>
        <div class="armory-card-header">
          <div class="armory-card-icon" style="background: #f1f5f9; border-color: #94a3b8; display: flex; align-items: center; justify-content: center;">🔄</div>
          <div>
            <div class="armory-card-name" style="color: #334155;">기본 외형 (코디 해제)</div>
            <div class="armory-card-cat">슬롯: ${slot} · 스탯 영향 0%</div>
          </div>
        </div>
        <div class="armory-card-desc">이 부위의 코디를 해제하고 기본 모험가 외형을 표시합니다.</div>
      </div>
      <button type="button" class="armory-btn-equip ${currentId === null ? 'equipped' : ''}">
        ${currentId === null ? '✓ 적용 중' : '기본 외형 적용'}
      </button>
    `;
    if (currentId !== null) {
      unequipCard.querySelector('.armory-btn-equip')?.addEventListener('click', () => {
        p.equipCoordi(slot, null);
        p.persistProgress(this.game, true);
        window.audio?.playButtonClick?.();
        this.renderCoordiWindow(slot);
      });
    }
    container.appendChild(unequipCard);

    items.forEach(item => {
      const itemSlot = item.slot || slot;
      const isEquipped = p.coordi?.[itemSlot] === item.id;
      const card = document.createElement('div');
      card.className = `armory-card ${isEquipped ? 'equipped' : ''}`;
      card.innerHTML = `
        <div>
          <div class="armory-card-header">
            <div class="armory-card-icon" style="background: ${item.color || '#f472b6'}22; border-color: ${item.color || '#f472b6'}; display: flex; align-items: center; justify-content: center;">
              ${(() => {
                const iconSrc = UIManager.getItemIconPath(item);
                return iconSrc
                  ? `<img src="${iconSrc}" style="width: 24px; height: 24px; object-fit: contain; image-rendering: pixelated;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"><span style="display:none;">${item.icon || '👗'}</span>`
                  : (item.icon || '👗');
              })()}
            </div>
            <div>
              <div class="armory-card-name" style="color: #831843;">${item.name}</div>
              <div class="armory-card-cat">클래식 코디 · 전투 스탯 영향 0%</div>
            </div>
          </div>
          <div class="armory-card-desc">${item.desc || ''}</div>
        </div>
        <button type="button" class="armory-btn-equip ${isEquipped ? 'equipped' : ''}" data-coordi-id="${item.id}">
          ${isEquipped ? '✓ 코디 장착 중' : '코디 입기'}
        </button>
      `;
      const btn = card.querySelector('.armory-btn-equip');
      if (!isEquipped) {
        btn.addEventListener('click', () => {
          p.equipCoordi(itemSlot, item.id);
          p.persistProgress(this.game, true);
          window.audio?.playPickItem?.();
          this.game.spawnItemText(p.x, p.y - 45, `👗 [코디] ${item.name}!`);
          this.renderCoordiWindow(slot);
        });
      }
      container.appendChild(card);
    });

    this.renderCoordiMirrorPreview();
  }

  updateQuickslotsForJob(job, preserveExisting = false) {
    const pMobility = this.game.player?.selectedMobility || 'flash_jump';
    const altMobility = pMobility === 'teleport' ? 'flash_jump' : 'teleport';
    const mob1Name = pMobility === 'teleport' ? '텔레포트' : '플래시 점프';
    const mob1Icon = pMobility === 'teleport' ? '🌌' : '⚡';
    const mob2Name = altMobility === 'teleport' ? '텔레포트' : '플래시 점프';
    const mob2Icon = altMobility === 'teleport' ? '🌌' : '⚡';

    const defaultQuickslots = {
      '초보자': [
        { key: 'Shift', id: 'three_snails', name: '달팽이 세껍질', icon: '🐌' },
        { key: 'Q', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' },
        { key: 'W', id: 'slash_blast', name: '슬래시 블러스트', icon: '🌀' },
        { key: 'E', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'A', id: 'recovery', name: '회복력 향상', icon: '❤️' },
        { key: 'S', id: null, name: '빈 슬롯', icon: '—' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: pMobility, name: mob1Name, icon: mob1Icon }
      ],
      '검사': [
        { key: 'Shift', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' },
        { key: 'Q', id: 'slash_blast', name: '슬래시 블러스트', icon: '🌀' },
        { key: 'W', id: 'slash_blast', name: '슬래시 블러스트', icon: '🌀' },
        { key: 'E', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'A', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' },
        { key: 'S', id: 'recovery', name: '회복력 향상', icon: '❤️' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' }
      ],
      '파이터': [
        { key: 'Shift', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' },
        { key: 'Q', id: 'slash_blast', name: '슬래시 블러스트', icon: '🌀' },
        { key: 'W', id: 'slash_blast', name: '슬래시 블러스트', icon: '🌀' },
        { key: 'E', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'A', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' },
        { key: 'S', id: 'slash_blast', name: '슬래시 블러스트', icon: '🌀' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: pMobility, name: mob1Name, icon: mob1Icon }
      ],
      '크루세이더': [
        { key: 'Shift', id: 'slash_blast', name: '검기 슬래시', icon: '🌀' },
        { key: 'Q', id: 'slash_blast', name: '검기 슬래시', icon: '🌀' },
        { key: 'W', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' },
        { key: 'E', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'A', id: 'slash_blast', name: '검기 슬래시', icon: '🌀' },
        { key: 'S', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: pMobility, name: mob1Name, icon: mob1Icon }
      ],
      '히어로': [
        { key: 'Shift', id: 'brandish', name: '브랜디쉬', icon: '⚡' },
        { key: 'Q', id: 'brandish', name: '브랜디쉬', icon: '⚡' },
        { key: 'W', id: 'slash_blast', name: '검기 슬래시', icon: '🌀' },
        { key: 'E', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'A', id: 'brandish', name: '브랜디쉬', icon: '⚡' },
        { key: 'S', id: 'slash_blast', name: '검기 슬래시', icon: '🌀' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: 'brandish', name: '브랜디쉬', icon: '⚡' }
      ],
      '매지션': [
        { key: 'Shift', id: 'magic_claw', name: '매직 클로', icon: '✨' },
        { key: 'Q', id: 'magic_claw', name: '매직 클로', icon: '✨' },
        { key: 'W', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'E', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'A', id: 'energy_bolt', name: '에너지 볼트', icon: '🔮' },
        { key: 'S', id: 'magic_claw', name: '매직 클로', icon: '✨' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: pMobility, name: mob1Name, icon: mob1Icon }
      ],
      '위자드': [
        { key: 'Shift', id: 'magic_claw', name: '강화 매직클로', icon: '✨' },
        { key: 'Q', id: 'thunderbolt', name: '썬더볼트', icon: '⚡' },
        { key: 'W', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'E', id: 'heal', name: '힐', icon: '✝️' },
        { key: 'A', id: 'thunderbolt', name: '썬더볼트', icon: '⚡' },
        { key: 'S', id: 'magic_claw', name: '강화 매직클로', icon: '✨' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: 'thunderbolt', name: '썬더볼트', icon: '⚡' }
      ],
      '메이지': [
        { key: 'Shift', id: 'thunderbolt', name: '체인 썬더볼트', icon: '⚡' },
        { key: 'Q', id: 'thunderbolt', name: '체인 썬더볼트', icon: '⚡' },
        { key: 'W', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'E', id: 'heal', name: '힐', icon: '✝️' },
        { key: 'A', id: 'thunderbolt', name: '체인 썬더볼트', icon: '⚡' },
        { key: 'S', id: 'magic_claw', name: '강화 매직클로', icon: '✨' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: pMobility, name: mob1Name, icon: mob1Icon }
      ],
      '아크메이지': [
        { key: 'Shift', id: 'genesis', name: '제네시스', icon: '🌟' },
        { key: 'Q', id: 'thunderbolt', name: '체인 썬더볼트', icon: '⚡' },
        { key: 'W', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'E', id: 'genesis', name: '제네시스', icon: '🌟' },
        { key: 'A', id: 'genesis', name: '제네시스', icon: '🌟' },
        { key: 'S', id: 'thunderbolt', name: '체인 썬더볼트', icon: '⚡' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: pMobility, name: mob1Name, icon: mob1Icon }
      ],
      '아처': [
        { key: 'Shift', id: 'arrow_blow', name: '애로우 블로우', icon: '🏹' },
        { key: 'Q', id: 'double_shot', name: '더블 샷', icon: '🎯' },
        { key: 'W', id: 'arrow_blow', name: '애로우 블로우', icon: '🏹' },
        { key: 'E', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'A', id: 'double_shot', name: '더블 샷', icon: '🎯' },
        { key: 'S', id: 'arrow_blow', name: '애로우 블로우', icon: '🏹' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: pMobility, name: mob1Name, icon: mob1Icon }
      ],
      '헌터': [
        { key: 'Shift', id: 'double_shot', name: '더블 샷', icon: '🎯' },
        { key: 'Q', id: 'double_shot', name: '더블 샷', icon: '🎯' },
        { key: 'W', id: 'arrow_bomb', name: '애로우 밤', icon: '💣' },
        { key: 'E', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'A', id: 'double_shot', name: '더블 샷', icon: '🎯' },
        { key: 'S', id: 'arrow_bomb', name: '애로우 밤', icon: '💣' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: pMobility, name: mob1Name, icon: mob1Icon }
      ],
      '레인저': [
        { key: 'Shift', id: 'strafe', name: '스트레이프', icon: '🎯' },
        { key: 'Q', id: 'strafe', name: '스트레이프', icon: '🎯' },
        { key: 'W', id: 'arrow_bomb', name: '애로우 밤', icon: '💣' },
        { key: 'E', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'A', id: 'double_shot', name: '더블 샷', icon: '🎯' },
        { key: 'S', id: 'strafe', name: '스트레이프', icon: '🎯' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: pMobility, name: mob1Name, icon: mob1Icon }
      ],
      '보우마스터': [
        { key: 'Shift', id: 'hurricane', name: '폭풍의 시', icon: '🌪️' },
        { key: 'Q', id: 'hurricane', name: '폭풍의 시', icon: '🌪️' },
        { key: 'W', id: 'strafe', name: '스트레이프', icon: '🎯' },
        { key: 'E', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'A', id: 'hurricane', name: '폭풍의 시', icon: '🌪️' },
        { key: 'S', id: 'arrow_bomb', name: '애로우 밤', icon: '💣' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: 'hurricane', name: '폭풍의 시', icon: '🌪️' }
      ],
      '로그': [
        { key: 'Shift', id: 'lucky_seven', name: '럭키 세븐', icon: '⭐' },
        { key: 'Q', id: 'double_stab', name: '더블 스탭', icon: '🗡️' },
        { key: 'W', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'E', id: 'dark_site', name: '다크 사이트', icon: '👤' },
        { key: 'A', id: 'lucky_seven', name: '럭키 세븐', icon: '⭐' },
        { key: 'S', id: 'double_stab', name: '더블 스탭', icon: '🗡️' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: pMobility, name: mob1Name, icon: mob1Icon }
      ],
      '허밋': [
        { key: 'Shift', id: 'lucky_seven', name: '쿼드러플 스로우', icon: '⭐' },
        { key: 'Q', id: 'avenger', name: '어벤저', icon: '🌀' },
        { key: 'W', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'E', id: 'dark_site', name: '다크 사이트', icon: '👤' },
        { key: 'A', id: 'lucky_seven', name: '쿼드러플 스로우', icon: '⭐' },
        { key: 'S', id: 'avenger', name: '어벤저', icon: '🌀' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: 'lucky_seven', name: '쿼드러플 스로우', icon: '⭐' }
      ],
      '나이트로드': [
        { key: 'Shift', id: 'lucky_seven', name: '펜타 스로우', icon: '⭐' },
        { key: 'Q', id: 'avenger', name: '어벤저', icon: '🌀' },
        { key: 'W', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'E', id: 'dark_site', name: '다크 사이트', icon: '👤' },
        { key: 'A', id: 'lucky_seven', name: '펜타 스로우', icon: '⭐' },
        { key: 'S', id: 'avenger', name: '어벤저', icon: '🌀' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: 'lucky_seven', name: '펜타 스로우', icon: '⭐' }
      ],
      '시프마스터': [
        { key: 'Shift', id: 'savage_blow', name: '새비지 블로우', icon: '⚔️' },
        { key: 'Q', id: 'savage_blow', name: '새비지 블로우', icon: '⚔️' },
        { key: 'W', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'E', id: 'dark_site', name: '다크 사이트', icon: '👤' },
        { key: 'A', id: 'savage_blow', name: '새비지 블로우', icon: '⚔️' },
        { key: 'S', id: 'double_stab', name: '더블 스탭', icon: '🗡️' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: pMobility, name: mob1Name, icon: mob1Icon }
      ],
      '섀도어': [
        { key: 'Shift', id: 'savage_blow', name: '새비지 블로우', icon: '⚔️' },
        { key: 'Q', id: 'savage_blow', name: '새비지 블로우', icon: '⚔️' },
        { key: 'W', id: pMobility, name: mob1Name, icon: mob1Icon },
        { key: 'E', id: 'dark_site', name: '다크 사이트', icon: '👤' },
        { key: 'A', id: 'savage_blow', name: '새비지 블로우', icon: '⚔️' },
        { key: 'S', id: 'savage_blow', name: '새비지 블로우', icon: '⚔️' },
        { key: 'D', id: altMobility, name: mob2Name, icon: mob2Icon },
        { key: 'F', id: 'savage_blow', name: '새비지 블로우', icon: '⚔️' }
      ],
      '전사': [
        { key: 'Shift', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' },
        { key: 'Q', id: 'slash_blast', name: '슬래시 블러스트', icon: '🌀' },
        { key: 'W', id: 'brandish', name: '브랜디쉬', icon: '⚡' },
        { key: 'E', id: 'slash_blast', name: '슬래시 블러스트', icon: '🌀' },
        { key: 'A', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' },
        { key: 'S', id: 'brandish', name: '브랜디쉬', icon: '⚡' },
        { key: 'D', id: 'flash_jump', name: '플래시 점프', icon: '⚡' },
        { key: 'F', id: 'power_strike', name: '파워 스트라이크', icon: '⚔️' }
      ],
      '마법사': [
        { key: 'Shift', id: 'energy_bolt', name: '에너지 볼트', icon: '🔮' },
        { key: 'Q', id: 'magic_claw', name: '매직 클로', icon: '✨' },
        { key: 'W', id: 'teleport', name: '텔레포트', icon: '🌌' },
        { key: 'E', id: 'heal', name: '힐', icon: '✝️' },
        { key: 'A', id: 'thunderbolt', name: '썬더볼트', icon: '⚡' },
        { key: 'S', id: 'genesis', name: '제네시스', icon: '🌟' },
        { key: 'D', id: 'teleport', name: '텔레포트', icon: '🌌' },
        { key: 'F', id: 'genesis', name: '제네시스', icon: '🌟' }
      ],
      '궁수': [
        { key: 'Shift', id: 'arrow_blow', name: '애로우 블로우', icon: '🏹' },
        { key: 'Q', id: 'double_shot', name: '더블 샷', icon: '🎯' },
        { key: 'W', id: 'arrow_bomb', name: '애로우 밤', icon: '💣' },
        { key: 'E', id: 'strafe', name: '스트레이프', icon: '🎯' },
        { key: 'A', id: 'hurricane', name: '폭풍의 시', icon: '🌪️' },
        { key: 'S', id: 'strafe', name: '스트레이프', icon: '🎯' },
        { key: 'D', id: 'arrow_bomb', name: '애로우 밤', icon: '💣' },
        { key: 'F', id: 'hurricane', name: '폭풍의 시', icon: '🌪️' }
      ],
      '어쌔신': [
        { key: 'Shift', id: 'lucky_seven', name: '럭키 세븐', icon: '⭐' },
        { key: 'Q', id: 'avenger', name: '어벤저', icon: '🌀' },
        { key: 'W', id: 'flash_jump', name: '플래시 점프', icon: '⚡' },
        { key: 'E', id: 'dark_site', name: '다크 사이트', icon: '👤' },
        { key: 'A', id: 'lucky_seven', name: '럭키 세븐', icon: '⭐' },
        { key: 'S', id: 'avenger', name: '어벤저', icon: '🌀' },
        { key: 'D', id: 'flash_jump', name: '플래시 점프', icon: '⚡' },
        { key: 'F', id: 'lucky_seven', name: '럭키 세븐', icon: '⭐' }
      ],
      '시프': [
        { key: 'Shift', id: 'savage_blow', name: '새비지 블로우', icon: '⚔️' },
        { key: 'Q', id: 'double_stab', name: '더블 스탭', icon: '🗡️' },
        { key: 'W', id: 'flash_jump', name: '플래시 점프', icon: '⚡' },
        { key: 'E', id: 'dark_site', name: '다크 사이트', icon: '👤' },
        { key: 'A', id: 'savage_blow', name: '새비지 블로우', icon: '⚔️' },
        { key: 'S', id: 'double_stab', name: '더블 스탭', icon: '🗡️' },
        { key: 'D', id: 'flash_jump', name: '플래시 점프', icon: '⚡' },
        { key: 'F', id: 'savage_blow', name: '새비지 블로우', icon: '⚔️' }
      ],
      '도적': [
        { key: 'Shift', id: 'lucky_seven', name: '럭키 세븐', icon: '⭐' },
        { key: 'Q', id: 'double_stab', name: '더블 스탭', icon: '🗡️' },
        { key: 'W', id: 'savage_blow', name: '새비지 블로우', icon: '⚔️' },
        { key: 'E', id: 'flash_jump', name: '플래시 점프', icon: '⚡' },
        { key: 'A', id: 'dark_site', name: '다크 사이트', icon: '👤' },
        { key: 'S', id: 'savage_blow', name: '새비지 블로우', icon: '⚔️' },
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

        const resolvedIconPath = UIManager.getItemIconPath(item);
        if (resolvedIconPath) {
          slot.innerHTML = `<span class="slot-icon" style="display: flex; align-items: center; justify-content: center;"><img src="${resolvedIconPath}" class="item-icon-img" style="width: 24px; height: 24px; object-fit: contain; image-rendering: pixelated;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"><span style="display: none;">${item.icon || '📦'}</span></span><span class="slot-count">${item.count || ''}</span>`;
        } else {
          slot.innerHTML = `<span class="slot-icon">${item.icon || '📦'}</span><span class="slot-count">${item.count || ''}</span>`;
        }

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
    const equipment = player.inventory.equip.filter(item => Number.isFinite(item.upgradeSlots) && (item.type === 'weapon' || item.type === 'star' || item.type === 'hat' || item.type === 'overall'));
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
    const evoHint = target?.type === 'star' ? ' · [표창 진화 경로: +1 목비 / +3 금비 / +5 토비 / +7 뇌전 / +9 일비 / +10 화비 / +12 궁극의 성광수리검!]' : '';
    info.textContent = (scroll
      ? `성공률 ${Math.round(scroll.rate * 100)}% · ${scroll.bonusDef !== undefined ? '방어력 +' + scroll.bonusDef : '공격력 +' + scroll.bonusAtk} · 수수료 ${fee.toLocaleString()} 메소. 실패해도 주문서·수수료·남은 횟수 1회가 소모됩니다.`
      : '무기/표창에는 공격력 주문서, 방어구에는 방어력 주문서를 사용합니다.') + evoHint;
    const button = container.querySelector('#btn-enhance-equipment');
    const isCleanSlate = scroll?.id === 'scroll_clean_slate_10';
    const canUseSlots = isCleanSlate ? (target && target.upgradeSlots < (target.maxUpgradeSlots || 7)) : (target && target.upgradeSlots > 0);
    button.disabled = !target || !scroll || !canUseSlots || player.meso < fee;
    button.onclick = () => {
      const result = player.enhanceEquipment(target, scroll, this.game);
      this.enhancementFeedback = result
        ? `${result.success ? '성공' : '실패'} · ${result.itemName}${result.success ? ' · ' + (result.stat === 'atk' ? '공격력' : (result.stat === 'def' ? '방어력' : (result.stat === 'upgradeSlots' ? '업그레이드 횟수' : '옵션'))) + ' +' + result.bonus : ''}${result.destroyed ? ' (장비 파괴)' : ''} · ${result.fee.toLocaleString()} 메소 사용 · 남은 횟수 ${result.remainingSlots}`
        : (player.speechText || '강화할 수 없습니다.');
      this.renderInventoryTab(document.querySelector('.inven-tab.active')?.dataset.tab || 'equip');
      document.getElementById('enhancement-result')?.scrollIntoView({block: 'nearest'});
    };
    const feedback = container.querySelector('#enhancement-result');
    feedback.textContent = this.enhancementFeedback || '';

    // Weapon Mastery & Boss Breakthrough + Star Force section
    const extraBox = document.createElement('div');
    extraBox.style.cssText = 'margin-top: 8px; padding-top: 8px; border-top: 1px dashed #bfa878; font-size: 10px; color: #451a03;';
    const stars = Math.max(0, Math.min(5, Number(target?.starForce || 0)));
    const starDisplay = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    const sfCost = [1500, 3000, 6000, 12000, 25000][stars] || 1500;
    const canStarForce = target && target.type !== 'star' && target.upgradeSlots === 0 && stars < 5 && player.meso >= sfCost;

    let weaponMasteryHtml = '';
    if (target && target.type === 'weapon') {
      const nextTierIdx = target.breakthroughTier || 0;
      const tierCfg = Player.BREAKTHROUGH_TIERS?.[nextTierIdx];
      const expPct = Math.min(100, Math.floor(target.weaponExp || 0));
      const trophyCount = tierCfg
        ? (player.inventory.etc.find(e => e.id === tierCfg.trophyId && e.count > 0)?.count || 0)
        : 0;
      const tr = target.awakenedTraits || {};
      const traitParts = [];
      if (tr.critRate) traitParts.push(`크확 +${Math.round(tr.critRate * 100)}%`);
      if (tr.critDamage) traitParts.push(`크댐 +${Math.round(tr.critDamage * 100)}%`);
      if (tr.totalDamagePercent) traitParts.push(`최종댐 +${tr.totalDamagePercent}%`);
      if (tr.bossDamagePercent) traitParts.push(`보공 +${tr.bossDamagePercent}%`);
      if (tr.atkPercent) traitParts.push(`공격력 +${tr.atkPercent}%`);
      if (tr.allStatPercent) traitParts.push(`올스탯 +${tr.allStatPercent}%`);
      if (tr.ignoreDefPercent) traitParts.push(`방무 +${tr.ignoreDefPercent}%`);
      const traitsText = traitParts.length > 0 ? traitParts.join(', ') : '각성 특성 없음';
      weaponMasteryHtml = `
        <div style="margin-bottom: 6px; background: #fffbeb; border: 1px solid #f59e0b; border-radius: 4px; padding: 6px;">
          <div style="font-weight: 800; color: #b45309; margin-bottom: 3px;">
            🔥 무기 숙련도 Lv.${target.weaponLevel || 1} (${expPct}%) · 돌파 ${nextTierIdx}/6단계
          </div>
          <div style="height: 6px; background: #fde68a; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
            <div style="width: ${expPct}%; height: 100%; background: linear-gradient(90deg, #f59e0b, #dc2626);"></div>
          </div>
          <div style="font-size: 9px; color: #78350f; margin-bottom: 4px;">
            ✨ 각성 특성: ${traitsText}
          </div>
          ${tierCfg ? `
            <div style="font-size: 9px; color: #92400e; margin-bottom: 4px;">
              다음 돌파 재료: <strong>${tierCfg.trophyName}</strong> (보유: ${trophyCount}개 · ${tierCfg.bossName} 드롭)
            </div>
            <button type="button" id="btn-weapon-breakthrough" class="btn-maple" style="width: 100%; padding: 4px; font-weight: bold;" ${(!target.isBreakthroughReady && expPct < 100) || trophyCount <= 0 ? 'disabled' : ''}>
              🔥 보스 전리품 한계 돌파 ([${tierCfg.prefix}] 진화)
            </button>
          ` : `<div style="color: #dc2626; font-weight: 800;">★ 최종 6단계 신화 돌파 완료! ★</div>`}
        </div>
      `;
    }

    extraBox.innerHTML = `
      ${weaponMasteryHtml}
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px; margin-bottom: 6px;">
        <div style="font-weight: 800; color: #1e293b; margin-bottom: 2px;">
          ⭐ 스타포스 강화: <span style="color: #eab308;">${starDisplay}</span> (${stars}/5성)
        </div>
        <div style="font-size: 9px; color: #475569; margin-bottom: 4px;">
          업그레이드 가능 횟수가 0회일 때 메소(${sfCost.toLocaleString()})로 최대 5성까지 잠재력을 개방합니다.
        </div>
        <button type="button" id="btn-enhance-starforce" class="btn-maple" style="width: 100%; padding: 4px;" ${canStarForce ? '' : 'disabled'}>
          ⭐ 스타포스 ${stars + 1}성 강화하기
        </button>
      </div>
      <button type="button" id="btn-open-coordi-from-inven" class="btn-maple" style="width: 100%; padding: 4px; background: linear-gradient(to bottom, #db2777, #9d174d); color: #fff;">
        👗 코디 옷장 / 미러룸 열기 (외형 100% 분리)
      </button>
    `;
    container.appendChild(extraBox);

    extraBox.querySelector('#btn-weapon-breakthrough')?.addEventListener('click', () => {
      const res = player.executeWeaponBreakthrough(target, this.game);
      if (res?.success) {
        this.enhancementFeedback = `한계 돌파 성공! ${res.itemName} (${res.traitDesc})`;
      } else {
        this.enhancementFeedback = player.speechText || '한계 돌파 조건이 부족합니다.';
      }
      this.renderInventoryTab(document.querySelector('.inven-tab.active')?.dataset.tab || 'equip');
      this.updateStatsWindow();
      this.updateHUD();
    });

    extraBox.querySelector('#btn-enhance-starforce')?.addEventListener('click', () => {
      const res = player.enhanceStarForce(target, this.game);
      if (res) {
        this.enhancementFeedback = res.success
          ? `스타포스 ${res.starForce}성 성공! · ${target.name}`
          : `스타포스 실패 · ${target.name} (${res.starForce}성 유지)`;
      }
      this.renderInventoryTab(document.querySelector('.inven-tab.active')?.dataset.tab || 'equip');
      this.updateStatsWindow();
      this.updateHUD();
    });

    extraBox.querySelector('#btn-open-coordi-from-inven')?.addEventListener('click', () => {
      this.toggleWindow('win-coordi');
    });
  }

  updateSkillsWindow() {
    const p = this.game.player;
    const container = document.getElementById('skill-list-container');
    const spEl = document.getElementById('skill-sp-count');
    if (spEl) spEl.innerText = p.sp;
    if (!container) return;

    container.innerHTML = '';

    // 1. Mobility Skill Selector Banner (전직업 플점 / 텔포 자유 전환)
    const curMobility = p.selectedMobility || 'flash_jump';
    const isFJ = curMobility === 'flash_jump';
    const mobCard = document.createElement('div');
    mobCard.className = 'mobility-selector-card';
    mobCard.style.cssText = 'background: #f0fdf4; border: 1.5px solid #22c55e; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;';
    mobCard.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">${isFJ ? '⚡' : '🌌'}</span>
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #15803d;">
            기동 모드: <span style="color: #166534;">${isFJ ? '⚡ 플래시 점프 (플점)' : '🌌 텔레포트 (점텔)'}</span>
          </div>
          <div style="font-size: 9px; color: #16a34a;">전직업 자유 선택 지원 (점프 중 발동 가능)</div>
        </div>
      </div>
      <button id="btn-toggle-mobility-ui" class="btn-maple" style="padding: 3px 8px; font-size: 10px; font-weight: 800; background: #16a34a; color: #fff; border-color: #15803d;" title="플래시 점프와 텔레포트 간 기동 모드를 즉시 전환합니다">
        ⇋ [플점 / 텔포] 전환
      </button>
    `;
    mobCard.querySelector('#btn-toggle-mobility-ui')?.addEventListener('click', () => {
      p.toggleMobilitySkill(this.game);
    });
    container.appendChild(mobCard);

    // 2. SP Integrity & Recovery Card (전액 SP 초기화 버튼)
    const spCard = document.createElement('div');
    spCard.className = 'sp-management-card';
    spCard.style.cssText = 'background: #fffbeb; border: 1.5px solid #f59e0b; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;';
    spCard.innerHTML = `
      <div>
        <div style="font-size: 11px; font-weight: 800; color: #92400e;">
          🌟 잔여 SP: <span style="color: #b45309; font-size: 13px;">${p.sp}</span> pt | 직업: <b>${p.job}</b>
        </div>
        <div style="font-size: 9px; color: #b45309;">레벨 & 전직 보너스 SP 100% 영구 보존</div>
      </div>
      <button id="btn-reset-sp-ui" class="btn-maple" style="padding: 3px 8px; font-size: 10px; font-weight: 800; background: #dc2626; color: #fff; border-color: #991b1b;" title="모든 스킬 레벨을 1로 초기화하고 투자된 SP를 전액 환불합니다">
        🔄 SP 전액 초기화
      </button>
    `;
    spCard.querySelector('#btn-reset-sp-ui')?.addEventListener('click', () => {
      if (confirm('모든 스킬을 초기화하고 투자된 SP를 전액 회수하시겠습니까?\n(획득한 모든 레벨 및 전직 보너스 SP가 100% 반환됩니다.)')) {
        const restoredSP = p.resetSkillsAndRefundSP();
        window.audio?.playLevelUp?.();
        this.game.spawnItemText(p.x, p.y - 45, `✨ [SP 초기화 완료] 총 ${restoredSP} SP 반환!`);
        this.updateSkillsWindow();
        this.updateHUD();
      }
    });
    container.appendChild(spCard);

    Object.entries(p.skills).forEach(([id, skill]) => {
      const row = document.createElement('div');
      row.className = 'skill-row';
      const iconHtml = (window.SkillSvgIcons && SkillSvgIcons.ICONS[id])
        ? `<div style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;">${SkillSvgIcons.getIcon(id)}</div>`
        : skill.icon;

      const isPass = skill.passive;
      const actionBtnHtml = isPass
        ? `<span style="font-size: 10px; background: #064e3b; color: #6ee7b7; padding: 3px 8px; border-radius: 4px; font-weight: 800; border: 1px solid #059669;">PASSIVE</span>`
        : `<button class="btn-skill-cast" title="스킬 즉시 사용">사용</button>`;

      row.innerHTML = `
        <div class="skill-icon" style="width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; padding: 1px;">${iconHtml}</div>
        <div class="skill-info">
          <div class="skill-name">${skill.name} ${isPass ? '<span style="color:#10b981;font-size:11px;">[패시브]</span>' : ''}</div>
          <div class="skill-level">Lv. ${skill.level} / ${skill.maxLevel}</div>
          <div style="font-size: 9px; color: #854d0e;">${skill.desc || ''}</div>
        </div>
        ${actionBtnHtml}
        <button class="btn-maple btn-sp-add" ${p.sp <= 0 || skill.level >= skill.maxLevel ? 'disabled' : ''}>+</button>
      `;

      if (!isPass) {
        row.querySelector('.btn-skill-cast')?.addEventListener('click', () => {
          p.useSkill(id, this.game);
          this.updateHUD();
        });
      }

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

  showBossSpawnModal() {
    const modal = document.getElementById('modal-boss-spawn');
    if (!modal) return;
    window.audio?.playButtonClick?.();
    modal.style.display = 'block';

    const player = this.game?.player;
    const bossKills = player?.bossKills || {};
    const catalog = window.BOSS_RAID_CATALOG || [];
    const uniqueKills = catalog.filter(b => (Number(bossKills[b.type]) || 0) > 0).length;

    const summaryEl = document.getElementById('boss-collection-summary');
    const bossCoins = player?.inventory?.etc?.find(it => it.id === 'boss_coin')?.count || 0;
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
          <div>
            <span>🏆 <strong>보스 헌터 컬렉션:</strong> ${uniqueKills} / ${catalog.length || 13}종 토벌 완료</span>
            <span style="color: #facc15; margin-left: 12px; font-weight: 700;">🪙 보유 토벌 주화: ${bossCoins}개</span>
          </div>
          <button id="btn-boss-coin-shop-toggle" class="btn-maple" style="padding: 3px 10px; font-size: 11px; background: #eab308; color: #451a03; font-weight: 800; border-radius: 4px; cursor: pointer; border: 1.5px solid #a16207;">🏪 주화 교환 상점</button>
        </div>
        <div style="color: #bbf7d0; font-size: 10px; margin-top: 3px;">영구 컬렉션 보너스: 공격력 +${uniqueKills * 3} · 올스탯 +${uniqueKills * 2} · 보스 대미지 +${uniqueKills * 2}% · 최대 HP +${uniqueKills * 50}</div>
        <div id="boss-coin-shop-panel" style="display:none;margin-top:8px;padding:8px;background:#fefce8;border:1.5px solid #ca8a04;border-radius:6px;">
          <div style="font-weight:800;font-size:12px;color:#854d0e;margin-bottom:6px;display:flex;justify-content:space-between;">
            <span>🪙 [보스 토벌 주화 교환소] 원하는 진귀한 보상으로 교환하세요:</span>
            <span style="color:#b45309;font-size:11px;">현재 주화: ${bossCoins}개</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:6px;">
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:6px;display:flex;justify-content:space-between;align-items:center;">
              <div><div style="font-weight:700;font-size:11px;">📜 혼돈의 주문서 60%</div><div style="font-size:10px;color:#ca8a04;font-weight:700;">🪙 주화 10개</div></div>
              <button class="btn-buy-coin-reward btn-maple" data-id="scroll_chaos_60" data-name="혼돈의 주문서 60%" data-cost="10" data-count="1" style="padding:2px 8px;font-size:10px;">교환</button>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:6px;display:flex;justify-content:space-between;align-items:center;">
              <div><div style="font-weight:700;font-size:11px;">📜 무기 공격력 주문서 10%</div><div style="font-size:10px;color:#ca8a04;font-weight:700;">🪙 주화 5개</div></div>
              <button class="btn-buy-coin-reward btn-maple" data-id="scroll_atk_10" data-name="무기 공격력 주문서 10%" data-cost="5" data-count="1" style="padding:2px 8px;font-size:10px;">교환</button>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:6px;display:flex;justify-content:space-between;align-items:center;">
              <div><div style="font-weight:700;font-size:11px;">📜 저주 공격력 주문서 30%</div><div style="font-size:10px;color:#ca8a04;font-weight:700;">🪙 주화 5개</div></div>
              <button class="btn-buy-coin-reward btn-maple" data-id="scroll_cursed_atk_30" data-name="저주받은 공격력 주문서 30%" data-cost="5" data-count="1" style="padding:2px 8px;font-size:10px;">교환</button>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:6px;display:flex;justify-content:space-between;align-items:center;">
              <div><div style="font-weight:700;font-size:11px;">👑 자쿰의 투구</div><div style="font-size:10px;color:#ca8a04;font-weight:700;">🪙 주화 15개</div></div>
              <button class="btn-buy-coin-reward btn-maple" data-id="zakum_helm" data-name="👑 자쿰의 투구" data-cost="15" data-type="equip" style="padding:2px 8px;font-size:10px;">교환</button>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:6px;display:flex;justify-content:space-between;align-items:center;">
              <div><div style="font-weight:700;font-size:11px;">🥏 일비 표창 (1줄)</div><div style="font-size:10px;color:#ca8a04;font-weight:700;">🪙 주화 20개</div></div>
              <button class="btn-buy-coin-reward btn-maple" data-id="ilbi_star" data-name="일비 표창" data-cost="20" data-type="star" style="padding:2px 8px;font-size:10px;">교환</button>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:6px;display:flex;justify-content:space-between;align-items:center;">
              <div><div style="font-weight:700;font-size:11px;">⚡ 뇌전 수리검 (1줄)</div><div style="font-size:10px;color:#ca8a04;font-weight:700;">🪙 주화 15개</div></div>
              <button class="btn-buy-coin-reward btn-maple" data-id="steely_star" data-name="뇌전 수리검" data-cost="15" data-type="star" style="padding:2px 8px;font-size:10px;">교환</button>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:6px;display:flex;justify-content:space-between;align-items:center;">
              <div><div style="font-weight:700;font-size:11px;">🧪 파워 엘릭서 x20</div><div style="font-size:10px;color:#ca8a04;font-weight:700;">🪙 주화 2개</div></div>
              <button class="btn-buy-coin-reward btn-maple" data-id="power_elixir" data-name="파워 엘릭서" data-cost="2" data-count="20" style="padding:2px 8px;font-size:10px;">교환</button>
            </div>
          </div>
        </div>
      `;

      const shopToggleBtn = document.getElementById('btn-boss-coin-shop-toggle');
      const shopPanel = document.getElementById('boss-coin-shop-panel');
      if (shopToggleBtn && shopPanel) {
        shopToggleBtn.onclick = () => {
          shopPanel.style.display = shopPanel.style.display === 'none' ? 'block' : 'none';
        };
      }

      const buyBtns = document.querySelectorAll('.btn-buy-coin-reward');
      buyBtns.forEach(bBtn => {
        bBtn.onclick = () => {
          const cost = Number(bBtn.getAttribute('data-cost')) || 1;
          const itemId = bBtn.getAttribute('data-id');
          const itemName = bBtn.getAttribute('data-name');
          const itemType = bBtn.getAttribute('data-type');
          const count = Number(bBtn.getAttribute('data-count')) || 1;
          const coinItem = player?.inventory?.etc?.find(it => it.id === 'boss_coin');
          if (!coinItem || coinItem.count < cost) {
            alert(`보스 토벌 주화가 부족합니다! (필요: ${cost}개 / 보유: ${coinItem ? coinItem.count : 0}개)`);
            return;
          }
          coinItem.count -= cost;
          if (coinItem.count <= 0) {
            const idx = player.inventory.etc.indexOf(coinItem);
            if (idx >= 0) player.inventory.etc.splice(idx, 1);
          }
          if (itemType === 'equip' || itemId === 'zakum_helm') {
            player.inventory.equip.push({
              id: 'zakum_helm',
              name: '👑 자쿰의 투구',
              type: 'hat',
              equipped: false,
              def: 150,
              upgradeSlots: 10,
              str: 15, dex: 15, int: 15, luk: 15
            });
            player.ensureItemUUIDs?.();
          } else if (itemType === 'star') {
            player.addItem(itemId, itemName, 1, this.game);
          } else {
            player.addItem(itemId, itemName, count, this.game);
          }
          window.audio?.playBreakthrough?.();
          this.game?.spawnItemText?.(player.x, player.y - 45, `★ ${itemName} 교환 완료! ★`);
          this.game?.ui?.addChatMessage?.('시스템', `🪙 [주화 교환] 보스 토벌 주화 ${cost}개를 소모하여 [${itemName}]을(를) 획득했습니다!`, 'system');
          player.persistProgress(this.game, true);
          this.showBossSpawnModal();
        };
      });
    }

    const gridEl = document.getElementById('boss-raid-grid');
    if (gridEl && catalog.length > 0) {
      gridEl.innerHTML = catalog.map(b => {
        const kills = Number(bossKills[b.type]) || 0;
        const clearedBadge = kills > 0
          ? `<span style="background:#16a34a;color:#fff;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:700;">토벌 ${kills}회 ✓</span>`
          : `<span style="background:#57534e;color:#e7e5e4;padding:1px 6px;border-radius:10px;font-size:10px;">미토벌</span>`;
        return `
          <div style="background:#fffdf5;border:1.5px solid ${kills > 0 ? '#16a34a' : '#d6c7a1'};border-radius:8px;padding:9px;display:flex;flex-direction:column;justify-content:space-between;gap:5px;box-shadow:0 2px 6px rgba(0,0,0,0.08);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="background:${b.tierColor || '#b45309'};color:#fff;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;">${b.tier}</span>
              ${clearedBadge}
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin:2px 0;">
              <img src="assets/monsters/${b.type}/stand_0.png" alt="${b.name}" style="width:52px;height:52px;object-fit:contain;background:#f5f0e1;border-radius:6px;padding:3px;border:1px solid #e5dcc5;">
              <div style="text-align:left;line-height:1.25;">
                <div style="font-weight:800;font-size:13px;color:#451a03;">${b.name} <span style="font-size:11px;color:#b45309;">Lv.${b.level}</span></div>
                <div style="font-size:10px;color:#78350f;">${b.title || ''}</div>
                <div style="font-size:10px;color:#57534e;">HP ${Number(b.hp).toLocaleString()} · EXP ${Number(b.exp).toLocaleString()}</div>
              </div>
            </div>
            <div style="font-size:10px;color:#3f3f46;background:#f8f4e6;padding:4px 6px;border-radius:4px;line-height:1.3;">
              <div><strong>기믹:</strong> ${b.gimmickDesc}</div>
              <div style="color:#9333ea;"><strong>전리품:</strong> 🏆 ${b.trophyName}</div>
            </div>
            <div style="display:flex;gap:5px;margin-top:2px;">
              <button class="btn-boss-select btn-maple" data-boss="${b.type}" style="flex:1;padding:5px 4px;font-size:11px;font-weight:700;cursor:pointer;border-radius:4px;">⚔️ 현재 맵 소환</button>
              <button class="btn-boss-lair btn-maple" data-boss="${b.type}" style="flex:1;padding:5px 4px;font-size:11px;font-weight:700;cursor:pointer;border-radius:4px;background:linear-gradient(180deg,#2563eb,#1d4ed8);color:#fff;border-color:#1e3a8a;">🚀 본거지 토벌</button>
            </div>
          </div>
        `;
      }).join('');
    }

    const closeBtn = document.getElementById('btn-boss-modal-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        window.audio?.playButtonClick?.();
        modal.style.display = 'none';
      };
    }

    const selectBtns = modal.querySelectorAll('.btn-boss-select');
    selectBtns.forEach(btn => {
      btn.onclick = () => {
        const bossType = btn.getAttribute('data-boss') || 'mushmom';
        window.audio?.playButtonClick?.();
        modal.style.display = 'none';
        this.game.spawnBoss(bossType);
      };
    });

    const lairBtns = modal.querySelectorAll('.btn-boss-lair');
    lairBtns.forEach(btn => {
      btn.onclick = () => {
        const bossType = btn.getAttribute('data-boss') || 'mushmom';
        window.audio?.playButtonClick?.();
        modal.style.display = 'none';
        if (this.game.warpToBossLair) {
          this.game.warpToBossLair(bossType);
        } else {
          this.game.spawnBoss(bossType);
        }
      };
    });
  }

  showJobAdvancementModal(customAdvInfo = null, defaultTab = null) {
    const modal = document.getElementById('modal-job-advance');
    if (!modal) return;
    const box = modal.querySelector('.job-modal-box');
    if (!box) return;

    const player = this.game.player;
    const canAdvTier = player.canAdvanceJob ? player.canAdvanceJob() : 0;
    const info = customAdvInfo || (canAdvTier > 0 ? player.getNextJobAdvancement() : null);

    let currentTab = defaultTab || (canAdvTier > 0 ? 'advance' : 'free');
    let currentCategory = 'all';

    const render = () => {
      let contentHtml = '';

      // Common Header
      const headerHtml = `
        <button type="button" class="btn-window-close job-modal-close" aria-label="직업 선택 닫기">×</button>
        <h2 style="color: #b45309; font-size: 20px; margin-bottom: 4px; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span>🛡️ 메이플 전직 및 직업 변경 센터</span>
        </h2>
        <div style="font-size: 12px; color: #475569; margin-bottom: 12px;">
          현재 캐릭터: <b style="color: #b45309;">Lv.${player.level} [${player.job}]</b>
          <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-weight: bold; border: 1px solid #fde68a; margin-left: 6px;">${player.jobTier || 0}차 직업</span>
        </div>

        <div class="job-modal-tabs" style="display: flex; gap: 8px; justify-content: center; margin-bottom: 14px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          <button type="button" id="tab-btn-advance" class="job-tab-btn ${currentTab === 'advance' ? 'active' : ''}" style="padding: 6px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; border: 1.5px solid ${currentTab === 'advance' ? '#b45309' : '#cbd5e1'}; background: ${currentTab === 'advance' ? '#b45309' : '#f8fafc'}; color: ${currentTab === 'advance' ? '#ffffff' : '#475569'};">
            🍁 정통 단계별 전직 ${canAdvTier > 0 ? '<span style="background: #ef4444; color: white; border-radius: 50%; padding: 1px 5px; font-size: 10px; margin-left: 4px;">UP</span>' : ''}
          </button>
          <button type="button" id="tab-btn-free" class="job-tab-btn ${currentTab === 'free' ? 'active' : ''}" style="padding: 6px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; border: 1.5px solid ${currentTab === 'free' ? '#b45309' : '#cbd5e1'}; background: ${currentTab === 'free' ? '#b45309' : '#f8fafc'}; color: ${currentTab === 'free' ? '#ffffff' : '#475569'};">
            🔄 자유 직업 변경
          </button>
        </div>
      `;

      if (currentTab === 'advance') {
        if (!info) {
          const nextTier = (player.jobTier || 0) + 1;
          const nextLvReq = nextTier === 1 ? 10 : (nextTier === 2 ? 30 : (nextTier === 3 ? 70 : 120));
          const isMaxTier = (player.jobTier || 0) >= 4;

          contentHtml = `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 10px 0; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 6px;">${isMaxTier ? '👑' : '⏳'}</div>
              <h3 style="color: #334155; font-size: 16px; margin-bottom: 6px;">
                ${isMaxTier ? '최고 단계(4차 전직)에 도달하였습니다!' : `다음 전직: ${nextTier}차 전직 (Lv.${nextLvReq})`}
              </h3>
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 12px;">
                ${isMaxTier
                  ? `축하합니다! 이미 최종 4차 전직 [${player.job}]을 달성하셨습니다.<br>다른 직업군을 플레이하고 싶으시다면 언제든 <b>[자유 직업 변경]</b>을 이용하세요!`
                  : `현재 <b>Lv.${player.level} [${player.job}]</b> 상태입니다. (다음 전직까지 <b>Lv.${Math.max(0, nextLvReq - player.level)}</b> 필요)<br>
                     • 1차: Lv.10 | • 2차: Lv.30 | • 3차: Lv.70 | • 4차: Lv.120`}
              </p>
              <button id="btn-goto-free-change" style="background: linear-gradient(135deg, #d97706, #b45309); color: white; border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 8px rgba(180, 83, 9, 0.3);">
                🔄 지금 바로 다른 직업으로 자유 변경하기
              </button>
            </div>
          `;
        } else if (info.tier === 1) {
          contentHtml = `
            <div style="margin-bottom: 10px;">
              <h3 style="color: #b45309; font-size: 16px;">⚔️ 1차 전직에 오신 것을 환영합니다!</h3>
              <p style="color: #64748b; font-size: 12px; margin-top: 2px;">Lv.10을 달성하여 진정한 모험가로 거듭날 때가 되었습니다. 원하는 직업군을 선택하세요!</p>
            </div>
            <div class="job-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
              ${info.options.map(opt => `
                <div class="btn-job-choice" data-job="${opt.job}" style="background: rgba(15, 23, 42, 0.85); border: 1.5px solid #38bdf8; border-radius: 8px; padding: 12px; cursor: pointer; text-align: left; transition: transform 0.15s, background 0.15s;">
                  <div style="font-size: 24px; margin-bottom: 4px;">${opt.icon} <b style="color: #facc15; font-size: 16px;">${opt.job}</b></div>
                  <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">${opt.desc}</div>
                  <div style="font-size: 11px; color: #38bdf8; line-height: 1.4;">
                    • 신규 스킬: <b>${opt.newSkill.name}</b> (${opt.newSkill.icon})<br>
                    • 상시 패시브: <b>${opt.passive.name}</b>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        } else {
          const branch = info.branch;
          contentHtml = `
            <div style="margin-bottom: 10px;">
              <h3 style="color: #b45309; font-size: 16px;">🌟 ${info.tier}차 전직 각성: [${branch.nextJob}]</h3>
              <p style="color: #64748b; font-size: 12px; margin-top: 2px;">
                Lv.${info.tier === 2 ? 30 : (info.tier === 3 ? 70 : 120)} 달성을 축하합니다! <b>[${player.job}]</b>에서 <b>[${branch.nextJob}]</b>(으)로 각성합니다.
              </p>
            </div>
            
            <div style="background: rgba(15, 23, 42, 0.9); border: 2px solid #eab308; border-radius: 10px; padding: 14px; margin: 10px 0; text-align: left;">
              <div style="font-size: 16px; font-weight: bold; color: #facc15; margin-bottom: 8px;">
                ${branch.icon} ${branch.nextJob} <span style="font-size: 12px; color: #94a3b8; font-weight: normal;">- ${branch.title}</span>
              </div>
              
              <div style="background: rgba(30, 41, 59, 0.7); border-radius: 6px; padding: 8px; margin-bottom: 6px;">
                <div style="color: #38bdf8; font-weight: bold; font-size: 12px; margin-bottom: 2px;">⚡ [기존 주력 스킬 1개 진화 강화]</div>
                <div style="color: #f8fafc; font-size: 12px;">${branch.enhancedSkill.desc}</div>
              </div>

              <div style="background: rgba(30, 41, 59, 0.7); border-radius: 6px; padding: 8px;">
                <div style="color: #4ade80; font-weight: bold; font-size: 12px; margin-bottom: 2px;">✨ [신규 시그니처 스킬 1개 추가]</div>
                <div style="color: #f8fafc; font-size: 12px;">${branch.newSkill.desc}</div>
              </div>
            </div>

            <button id="btn-execute-advance" style="background: linear-gradient(135deg, #eab308, #ca8a04); color: #0f172a; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(234, 179, 8, 0.35); transition: transform 0.1s;">
              ⚔️ ${branch.nextJob}(으)로 ${info.tier}차 전직 완료하기
            </button>
          `;
        }
      } else {
        // currentTab === 'free'
        const categories = [
          { id: 'all', label: '전체' },
          { id: 'warrior', label: '⚔️ 전사' },
          { id: 'magician', label: '🔮 마법사' },
          { id: 'bowman', label: '🏹 궁수' },
          { id: 'thief_claw', label: '🦅 도적(표도)' },
          { id: 'thief_dagger', label: '🗡️ 도적(단도)' },
          { id: 'beginner', label: '🐌 초보자' }
        ];

        const catalog = window.ALL_JOBS_CATALOG || [];
        const filteredJobs = (currentCategory === 'all')
          ? catalog
          : catalog.filter(j => j.category === currentCategory);

        contentHtml = `
          <div style="margin-bottom: 8px;">
            <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0; line-height: 1.5;">
              원하는 직업으로 언제든지 자유롭게 변경할 수 있습니다.<br>
              <span style="color: #0284c7;">• 전용 무기 및 시그니처 스킬 자동 세팅 • 퀵슬롯 동기화 • SP 100% 무손실 보존 & 자동 정합</span>
            </p>
            <div style="display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; margin-bottom: 10px;">
              ${categories.map(cat => `
                <button type="button" class="job-cat-filter-btn" data-category="${cat.id}" style="padding: 3px 8px; font-size: 11px; border-radius: 4px; cursor: pointer; border: 1px solid ${currentCategory === cat.id ? '#b45309' : '#cbd5e1'}; background: ${currentCategory === cat.id ? '#b45309' : '#f8fafc'}; color: ${currentCategory === cat.id ? '#ffffff' : '#334155'}; font-weight: ${currentCategory === cat.id ? 'bold' : 'normal'};">
                  ${cat.label}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="job-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; max-height: 340px; overflow-y: auto; padding: 4px;">
            ${filteredJobs.map(j => {
              const isCurrent = player.job === j.id;
              return `
                <div class="btn-job-choice ${isCurrent ? 'current-active-job' : ''}" data-job="${j.id}" style="background: ${isCurrent ? 'linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%)' : 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)'}; border: 2px solid ${isCurrent ? '#16a34a' : '#d97706'}; border-radius: 8px; padding: 10px 8px; cursor: pointer; text-align: center; position: relative; transition: transform 0.15s, box-shadow 0.15s;">
                  ${isCurrent ? '<span style="position: absolute; top: 4px; right: 4px; background: #16a34a; color: white; font-size: 9px; padding: 1px 4px; border-radius: 4px; font-weight: bold;">현재</span>' : ''}
                  <div class="job-icon" style="font-size: 24px; margin-bottom: 2px;">${j.icon}</div>
                  <div class="job-name" style="font-size: 13px; font-weight: 800; color: ${isCurrent ? '#14532d' : '#78350f'};">${j.name}</div>
                  <div style="font-size: 10px; color: ${isCurrent ? '#15803d' : '#b45309'}; font-weight: bold; margin: 1px 0;">${j.tier === 0 ? '0차' : j.tier + '차 전직'}</div>
                  <div class="job-desc" style="font-size: 10px; color: ${isCurrent ? '#166534' : '#92400e'}; line-height: 1.3; min-height: 26px;">${j.desc}</div>
                  <button type="button" style="margin-top: 6px; width: 100%; padding: 4px 0; font-size: 11px; font-weight: bold; border-radius: 4px; border: none; cursor: pointer; background: ${isCurrent ? '#16a34a' : '#b45309'}; color: white;">
                    ${isCurrent ? '✔ 사용 중' : '선택 변경'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      box.innerHTML = headerHtml + contentHtml;

      // Event Listeners:
      // 1. Close buttons
      box.querySelectorAll('.job-modal-close, .job-modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => { modal.style.display = 'none'; });
      });

      // 2. Tabs
      box.querySelector('#tab-btn-advance')?.addEventListener('click', () => {
        currentTab = 'advance';
        render();
      });
      box.querySelector('#tab-btn-free')?.addEventListener('click', () => {
        currentTab = 'free';
        render();
      });
      box.querySelector('#btn-goto-free-change')?.addEventListener('click', () => {
        currentTab = 'free';
        render();
      });

      // 3. Category filters in free tab
      box.querySelectorAll('.job-cat-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          currentCategory = btn.dataset.category;
          render();
        });
      });

      // 4. Job Choices in free tab & 1st job
      box.querySelectorAll('.btn-job-choice').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetJob = btn.dataset.job;
          if (!targetJob) return;

          if (currentTab === 'advance') {
            player.advanceJob(targetJob, this.game);
            modal.style.display = 'none';
          } else {
            // Free job change
            if (player.job === targetJob) {
              this.addChat('system', `이미 [${targetJob}] 직업을 이용 중입니다.`);
              return;
            }
            this.game.changePlayerJob(targetJob);
            modal.style.display = 'none';
          }
        });
      });

      // 5. Advance execute button for tier 2, 3, 4
      box.querySelector('#btn-execute-advance')?.addEventListener('click', () => {
        if (info && info.branch) {
          player.advanceJob(info.branch.nextJob, this.game);
          modal.style.display = 'none';
        }
      });
    };

    render();
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
      const isMiner = (npc.name || '').includes('광부');
      const isWoong = (npc.name || '').includes('웅이');
      if (isMiner) {
        textEl.innerText = '험난한 만년설 폐광에 오셨군요! 추위와 좀비들을 피해 빅토리아 아일랜드나 오르비스로 가시겠습니까?';
      } else if (isWoong) {
        textEl.innerText = '커닝시티 지하철 승강장입니다! 열차를 타고 빅토리아 아일랜드 주요 지역이나 파티퀘스트 구역으로 이동하실 수 있습니다.';
      } else {
        textEl.innerText = '안녕하세요! 빅토리아 아일랜드 각 마을과 사냥터로 안전하게 모시는 모범택시입니다. 어디로 이동하시겠습니까?';
      }

      const destinations = [
        { name: '헤네시스 마을 (자유시장 & 상점)', map: 'henesys_town' },
        { name: '헤네시스 사냥터 1 (초보자 사냥터)', map: 'henesys_hhg' },
        { name: '페리온 와일드보어의 땅 (전사 사냥터)', map: 'perion_boar' },
        { name: '커닝시티 지하철 1호선 (도적 사냥터)', map: 'kerning_subway' },
        { name: '커닝 파퀘 킹슬라임 제단 (라케리스 & 파티퀘스트)', map: 'kerning_pq' },
        { name: '마법의 숲 엘리니아 (요정의 마을 & 정거장)', map: 'ellinia' },
        { name: '던전 개미굴 1 (뿔버섯 & 좀비버섯 동굴)', map: 'ant_tunnel' }
      ];

      destinations.forEach(dest => {
        const btn = document.createElement('button');
        btn.className = 'npc-choice-btn';
        btn.innerText = `🚕 ${dest.name} 로 이동`;
        btn.addEventListener('click', () => {
          modal.style.display = 'none';
          this.game.changeMap(dest.map);
        });
        choicesEl.appendChild(btn);
      });

      // 전체 월드맵 열기 옵션
      const mapBtn = document.createElement('button');
      mapBtn.className = 'npc-choice-btn';
      mapBtn.style.color = '#b45309';
      mapBtn.style.fontWeight = 'bold';
      mapBtn.innerText = '🗺️ 빅토리아 & 오시리아 12개 전체 대륙 지도 열기';
      mapBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        this.showMapTravelModal();
      });
      choicesEl.appendChild(mapBtn);
    } else if (npc.type === 'vip_cab') {
      const isTigun = (npc.name || '').includes('티군');
      if (isTigun) {
        textEl.innerText = '루디브리엄 시계탑 최하층에 오신 것을 환영합니다! 차원의 균열을 넘어 던전 심층부와 전 대륙으로 통하는 직통 VIP 포탈을 가동합니다.';
      } else {
        textEl.innerText = '심해와 던전 깊은 곳, 오시리아 대륙까지 빠르게 직통으로 모시는 VIP 총알택시입니다. 어디로 가시겠습니까?';
      }

      const destinations = [
        { name: '던전 개미굴 1 (위험한 동굴 직통)', map: 'ant_tunnel' },
        { name: '저주받은 신전 (주니어 발록 은신처)', map: 'sleepy_dungeon' },
        { name: '오르비스행 비행선 (크림슨 발록 습격)', map: 'ship_orbis' },
        { name: '엘나스 폐광 죽은나무의 숲 4 (쿨리 좀비 설원)', map: 'el_nath_deadmine' },
        { name: '루디브리엄 시계탑 최하층 (시간의 길 3)', map: 'ludi_clocktower' },
        { name: '자쿰의 제단 (고대 거신 원정대 구역)', map: 'zakum_altar' },
        { name: '헤네시스 마을 (빅토리아 중심부 복귀)', map: 'henesys_town' }
      ];

      destinations.forEach(dest => {
        const btn = document.createElement('button');
        btn.className = 'npc-choice-btn';
        btn.innerText = `🚀 ${dest.name} 로 즉시 이동`;
        btn.addEventListener('click', () => {
          modal.style.display = 'none';
          this.game.changeMap(dest.map);
        });
        choicesEl.appendChild(btn);
      });

      // 전체 월드맵 열기 옵션
      const mapBtn = document.createElement('button');
      mapBtn.className = 'npc-choice-btn';
      mapBtn.style.color = '#b45309';
      mapBtn.style.fontWeight = 'bold';
      mapBtn.innerText = '🗺️ 빅토리아 & 오시리아 12개 전체 대륙 지도 열기';
      mapBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        this.showMapTravelModal();
      });
      choicesEl.appendChild(mapBtn);
    } else if (npc.type === 'betty') {
      const isLakelis = (npc.name || '').includes('라케리스') || this.game.map?.currentKey === 'kerning_pq';
      if (isLakelis) {
        textEl.innerText = '첫 번째 동행(커닝시티 파티 퀘스트) 구역에 오신 것을 환영합니다! 거대 보스 킹슬라임을 물리치고 물컹물컹한 왕관(무기 1차 한계 돌파 재료)을 획득해보세요!';
        const choices = [
          {
            text: '👑 킹슬라임 보스 소환하기 (무기 1차 돌파 재료 드롭)',
            action: () => this.game.spawnBoss('king_slime')
          },
          {
            text: '🚇 커닝시티 지하철 1호선으로 이동',
            action: () => this.game.changeMap('kerning_subway')
          },
          {
            text: '🗺️ 전체 대륙 월드맵 열기',
            action: () => this.showMapTravelModal()
          }
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
        textEl.innerText = '안녕하세요! 저는 엘리니아에서 식물과 고대 화석을 연구하는 베티 박사랍니다. 연구를 도와주셔서 정말 고마워요!';
        const choices = [
          {
            text: '🌿 고대 나뭇잎 화석 연구 돕기 (인기도 +5 & 마나 엘릭서 3개 보상)',
            action: () => {
              this.game.player.fame = (this.game.player.fame || 0) + 5;
              this.game.player.addItem('mana_elixir', '마나 엘릭서', 3, this.game);
              window.audio?.playLevelUp?.();
              this.game.spawnItemText(this.game.player.x, this.game.player.y - 45, '★ 베티 박사의 연구 완료! (인기도 +5) ★');
              this.addChat('system', '🌟 [베티 박사의 화석 연구] 인기도 +5 및 마나 엘릭서 3개를 획득했습니다!');
              this.updateStatsWindow();
            }
          },
          {
            text: '👗 코디 옷장 / 미러룸 열기',
            action: () => this.toggleWindow('win-coordi')
          }
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
      }
    } else if (npc.type === 'adobis') {
      const isSleepyDungeon = this.game.map?.currentKey === 'sleepy_dungeon';
      if (isSleepyDungeon) {
        textEl.innerText = '이곳은 저주받은 신전 깊은 곳입니다. 사악한 주니어 발록의 기운과 고대 자쿰의 화염이 느껴집니다. 어디로 향하시겠습니까?';
        const choices = [
          { text: '🔥 자쿰의 제단으로 진입 (원정대 구역)', action: () => this.game.changeMap('zakum_altar') },
          { text: '🏰 던전 개미굴 1로 퇴장하기', action: () => this.game.changeMap('ant_tunnel') },
          { text: '🍁 헤네시스 마을로 안전하게 귀환', action: () => this.game.changeMap('henesys_town') },
          { text: '🗺️ 전체 대륙 월드맵 열기', action: () => this.showMapTravelModal() }
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
        textEl.innerText = '자쿰의 제단에 오신 것을 환영합니다. 제단에 불의 눈을 바쳐 고대 거신 자쿰을 깨우시겠습니까?';
        const choices = [
          { text: '🔥 자쿰 레이드 시작 (자쿰 소환)', action: () => this.game.spawnZakumBoss() },
          { text: '🏰 저주받은 신전으로 퇴장하기', action: () => this.game.changeMap('sleepy_dungeon') },
          { text: '❄️ 엘나스 폐광으로 퇴장하기', action: () => this.game.changeMap('el_nath_deadmine') },
          { text: '🍁 헤네시스로 안전하게 귀환하기', action: () => this.game.changeMap('henesys_town') }
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
      }
        } else if (npc.type === 'chief_stan') {
      const isShip = this.game.map?.currentKey === 'ship_orbis';
      if (isShip) {
        textEl.innerText = '오르비스행 비행선에 탑승하신 것을 환영합니다! 순항 중이지만 언제 하늘의 악마 크림슨 발록이 습격할지 모릅니다!';
        const choices = [
          { text: '🌳 마법의 숲 엘리니아로 돌아가기', action: () => this.game.changeMap('ellinia') },
          { text: '❄️ 만년설 엘나스 폐광으로 하선하기', action: () => this.game.changeMap('el_nath_deadmine') },
          { text: '🦅 크림슨 발록 소환 (공중 보스전)', action: () => this.game.spawnBoss('crimson_balrog') },
          { text: '🗺️ 전체 대륙 월드맵 열기', action: () => this.showMapTravelModal() }
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
        textEl.innerText = '반갑네, 용감한 모험가여! 헤네시스 마을의 평화를 지키기 위해 사냥터의 몬스터를 물리치고 주민들의 의뢰를 해결해주게나!';
        const player = this.game.player;
        const choices = [
          {
            text: '🛒 헤네시스 백화점 상점 이용하기 (장비/물약/주문서 구매 & 전리품 판매)',
            action: () => this.showShopModal()
          },
          {
            text: '📜 [퀘스트] 초보자 지원: 달팽이와 버섯 사냥 보고 (껍질/버섯갓 5개 납품)',
            action: () => {
              const snailItem = player.inventory.etc?.find(it => it.id?.includes('snail_shell') && it.count >= 5);
              const shroomItem = player.inventory.etc?.find(it => it.id?.includes('mushroom') && it.count >= 5);
              const target = snailItem || shroomItem;
              if (target) {
                target.count -= 5;
                if (target.count <= 0) {
                  const idx = player.inventory.etc.indexOf(target);
                  if (idx !== -1) player.inventory.etc.splice(idx, 1);
                }
                player.gainExp(250, this.game);
                player.meso += 5000;
                player.fame = (player.fame || 0) + 2;
                window.audio.playLevelUp();
                this.game.spawnItemText(player.x, player.y - 45, '★ 퀘스트 완료! EXP +250 · 5000 메소 · 인기도 +2 ★');
                this.addChat('system', '🌟 [장로스탄의 보상] 달팽이와 버섯 사냥 의뢰를 완수하여 EXP +250, 5,000 메소, 인기도 +2를 획득했습니다!');
                this.updateStatsWindow();
                this.renderInventoryTab('etc');
              } else {
                window.audio.playButtonClick();
                this.addChat('system', '⚠️ [장로스탄] 아직 전리품이 부족합니다. 달팽이의 껍질 5개 또는 버섯의 갓 5개를 모아오세요!');
              }
            }
          },
          {
            text: '📜 [퀘스트] 마을 수호: 와일드보어 어금니 5개 납품 (중급 의뢰)',
            action: () => {
              const boarItem = player.inventory.etc?.find(it => it.name?.includes('와일드보어') && it.count >= 5);
              if (boarItem) {
                boarItem.count -= 5;
                if (boarItem.count <= 0) {
                  const idx = player.inventory.etc.indexOf(boarItem);
                  if (idx !== -1) player.inventory.etc.splice(idx, 1);
                }
                player.gainExp(1500, this.game);
                player.meso += 15000;
                player.fame = (player.fame || 0) + 3;
                const scroll = (window.SHOP_ITEMS_FOR_SALE || []).find(s => s.id === 'scroll_atk_100');
                if (scroll) {
                  const existing = player.inventory.use.find(u => u.id === 'scroll_atk_100');
                  if (existing) existing.count += 1;
                  else player.inventory.use.push({ ...scroll, count: 1 });
                }
                window.audio.playLevelUp();
                this.game.spawnItemText(player.x, player.y - 45, '★ 퀘스트 완료! EXP +1500 · 15000 메소 · 무공 주문서 획득! ★');
                this.addChat('system', '🌟 [장로스탄의 보상] 와일드보어 퇴치 완료! EXP +1,500, 15,000 메소, 무기공격력 주문서 100%, 인기도 +3 획득!');
                this.updateStatsWindow();
                this.renderInventoryTab('etc');
                this.renderInventoryTab('use');
              } else {
                window.audio.playButtonClick();
                this.addChat('system', '⚠️ [장로스탄] 아직 와일드보어의 어금니가 5개 모이지 않았습니다. 와일드보어의 땅에서 사냥해오세요!');
              }
            }
          },
          { text: '헤네시스 사냥터 1로 바로 가기', action: () => this.game.changeMap('henesys_hhg') },
          { text: '🗺️ 빅토리아 & 오시리아 전체 대륙 지도 열기', action: () => this.showMapTravelModal() }
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
      }
    } else if (npc.type === 'maya') {
      textEl.innerText = '콜록콜록... 몸이 너무 허약해서 헤네시스 약초와 포션이 필요해요. 모험가님, 초록버섯의 갓 5개와 파란 포션 5개를 구해주실 수 있나요?';
      const player = this.game.player;
      const choices = [
        {
          text: '💊 [퀘스트] 마야에게 보약 선물하기 (초록버섯 갓 5개 + 파란포션 5개 납품)',
          action: () => {
            const capItem = player.inventory.etc?.find(it => it.name?.includes('초록버섯') && it.count >= 5);
            const potionItem = player.inventory.use?.find(it => it.id === 'blue_potion' && it.count >= 5);
            if (capItem && potionItem) {
              capItem.count -= 5;
              if (capItem.count <= 0) {
                const idx = player.inventory.etc.indexOf(capItem);
                if (idx !== -1) player.inventory.etc.splice(idx, 1);
              }
              potionItem.count -= 5;
              if (potionItem.count <= 0) {
                const idx = player.inventory.use.indexOf(potionItem);
                if (idx !== -1) player.inventory.use.splice(idx, 1);
              }
              player.gainExp(1000, this.game);
              player.fame = (player.fame || 0) + 10;
              const whitePot = (window.SHOP_ITEMS_FOR_SALE || []).find(s => s.id === 'white_potion');
              if (whitePot) {
                const existing = player.inventory.use.find(u => u.id === 'white_potion');
                if (existing) existing.count += 30;
                else player.inventory.use.push({ ...whitePot, count: 30 });
              }
              window.audio.playLevelUp();
              this.game.spawnItemText(player.x, player.y - 45, '★ [마야와 이상한 약 완결] EXP +1000 · 하얀포션 30개 · 인기도 +10! ★');
              this.addChat('system', '🌟 [마야와 이상한 약] 마야가 기운을 완전히 차렸습니다! EXP +1,000, 하얀 포션 30개, 인기도 +10 획득!');
              this.updateStatsWindow();
              this.renderInventoryTab('etc');
              this.renderInventoryTab('use');
            } else {
              window.audio.playButtonClick();
              this.addChat('system', '⚠️ [마야] 아직 재료가 부족합니다. (초록버섯의 갓 5개, 파란 포션 5개가 필요합니다)');
            }
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
      });} else {
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
  // --- SNAIL DERBY MINI-GAME ---
  showSnailRaceModal() {
    const modal = document.getElementById('modal-snail-race');
    if (!modal) return;
    window.audio?.playButtonClick?.();
    modal.style.display = 'flex';

    if (!this.snailRaceGame && window.SnailRaceGame) {
      this.snailRaceGame = new window.SnailRaceGame();
      const canvas = document.getElementById('snail-race-canvas');
      if (canvas) {
        this.snailRaceGame.attach(canvas);
      }
      this.initSnailRaceUIEvents();
    }

    if (this.snailRaceGame) {
      this.snailRaceGame.resetBettingPhase();
      this.snailRaceGame.start();
    }
  }

  hideSnailRaceModal() {
    const modal = document.getElementById('modal-snail-race');
    if (!modal) return;
    window.audio?.playButtonClick?.();
    modal.style.display = 'none';
    if (this.snailRaceGame) {
      this.snailRaceGame.stop();
    }
  }

  initSnailRaceUIEvents() {
    const game = this.snailRaceGame;
    if (!game) return;

    // Racer selection cards
    document.querySelectorAll('.snail-racer-card').forEach((card, idx) => {
      card.addEventListener('click', () => {
        if (game.phase !== 'BETTING') return;
        window.audio?.playButtonClick?.();
        game.selectedRacerIndex = idx;
        game.updateUI();
      });
    });

    // Bet amount buttons (+1만, +10만, +100만)
    document.querySelectorAll('.btn-bet-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (game.phase !== 'BETTING') return;
        const add = parseInt(e.target.dataset.add, 10) || 0;
        const playerMeso = window.game?.player?.meso || 0;
        game.betAmount = Math.min(playerMeso, game.betAmount + add);
        game.isAllIn = (game.betAmount === playerMeso && playerMeso > 0);
        window.audio?.playButtonClick?.();
        game.updateUI();
      });
    });

    // Clear bet
    document.getElementById('btn-bet-clear')?.addEventListener('click', () => {
      if (game.phase !== 'BETTING') return;
      game.betAmount = 0;
      game.isAllIn = false;
      window.audio?.playButtonClick?.();
      game.updateUI();
    });

    // ALL-IN Button!
    document.getElementById('btn-snail-all-in')?.addEventListener('click', () => {
      if (game.phase !== 'BETTING') return;
      const playerMeso = window.game?.player?.meso || 0;
      if (playerMeso <= 0) {
        alert('보유 메소가 없습니다!');
        return;
      }
      game.betAmount = playerMeso;
      game.isAllIn = true;
      window.audio?.playPowerStrike?.();
      game.addCommentary('🔥 [몰빵] 모든 재산을 걸었습니다! 이번 판에 모든 것이 달렸습니다!!');
      game.updateUI();
    });

    // Start Race
    document.getElementById('btn-snail-race-start')?.addEventListener('click', () => {
      if (game.phase !== 'BETTING') return;
      game.startCountdown();
    });

    // Restart button in result panel
    document.getElementById('btn-snail-race-restart')?.addEventListener('click', () => {
      window.audio?.playButtonClick?.();
      game.resetBettingPhase();
    });

    // Close button
    document.getElementById('btn-snail-race-close')?.addEventListener('click', () => {
      this.hideSnailRaceModal();
    });

    // Action deck buttons (Clicks)
    document.getElementById('btn-snail-item-apple')?.addEventListener('click', () => game.useApple());
    document.getElementById('btn-snail-item-banana')?.addEventListener('click', () => game.useBanana());
    document.getElementById('btn-snail-item-shell')?.addEventListener('click', () => game.useShell());
    document.getElementById('btn-snail-item-cheer')?.addEventListener('click', () => game.cheerTap());
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
            <div style="width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.04); border-radius: 4px; border: 1px solid #e2e8f0; flex-shrink: 0;">
              <img src="${UIManager.getItemIconPath(item)}" class="shop-item-icon-img" style="width: 24px; height: 24px; object-fit: contain; image-rendering: pixelated;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
              <span style="display: none; font-size: 16px;">${item.icon || '📦'}</span>
            </div>
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
              <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.04); border-radius: 4px; border: 1px solid #e2e8f0; flex-shrink: 0;">
                <img src="${UIManager.getItemIconPath(item)}" class="shop-item-icon-img" style="width: 22px; height: 22px; object-fit: contain; image-rendering: pixelated;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                <span style="display: none; font-size: 14px;">📦</span>
              </div>
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
