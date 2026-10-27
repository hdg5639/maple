// js/ui.js - Retro Maple UI Windows, Job Selector, Quickslot Customization

class UIManager {
  constructor(game) {
    this.game = game;
    this.initWindows();
    this.initHotkeys();
    this.initDraggableWindows();
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

    addQuickslotAction('quick-slot-attack', () => this.game.player.normalAttack(this.game));
    addQuickslotAction('quick-slot-1', () => {
      const skillId = this.game.getClassSkillId(0);
      if (skillId) this.game.player.useSkill(skillId, this.game);
    });
    addQuickslotAction('quick-slot-2', () => {
      const skillId = this.game.getClassSkillId(1);
      if (skillId) this.game.player.useSkill(skillId, this.game);
    });
    addQuickslotAction('quick-slot-3', () => {
      const skillId = this.game.getClassSkillId(2);
      if (skillId) this.game.player.useSkill(skillId, this.game);
    });
    addQuickslotAction('quick-slot-4', () => {
      const skillId = this.game.getClassSkillId(3) || 'flash_jump';
      if (skillId) this.game.player.useSkill(skillId, this.game);
    });
    addQuickslotAction('quick-slot-jump', () => this.game.player.jump());
    addQuickslotAction('quick-slot-loot', () => this.game.pickUpNearbyDrops());
    addQuickslotAction('quick-slot-potion-red', () => this.game.player.usePotion('red_potion'));
    addQuickslotAction('quick-slot-potion-blue', () => this.game.player.usePotion('blue_potion'));
    addQuickslotAction('quick-slot-autohunt', () => this.game.autoHunt.toggle());
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
      if (e.target.tagName === 'INPUT') return;

      const code = e.code;
      if (code === 'KeyS') this.toggleWindow('win-stats');
      else if (code === 'KeyI') this.toggleWindow('win-inventory');
      else if (code === 'KeyK') this.toggleWindow('win-skills');
      else if (code === 'KeyO') this.toggleWindow('win-auto-config');
      else if (code === 'KeyR') this.game.autoHunt.toggle();
      else if (code === 'KeyB') this.game.spawnBoss();
      else if (code === 'Digit1') this.game.player.usePotion('red_potion');
      else if (code === 'Digit2') this.game.player.usePotion('blue_potion');
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
      const expPct = Math.max(0, Math.min(100, (player.exp / player.maxExp) * 100));
      expFill.style.width = `${expPct}%`;
      expText.innerText = `${player.exp} [${expPct.toFixed(1)}%]`;
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

  updateQuickslotsForJob(job) {
    const q1 = document.getElementById('quick-slot-1');
    const q2 = document.getElementById('quick-slot-2');
    const q3 = document.getElementById('quick-slot-3');
    const q4 = document.getElementById('quick-slot-4');

    if (job === '전사') {
      if (q1) { q1.title = '파워 스트라이크 [Shift/Q]'; q1.querySelector('.slot-icon').innerText = '⚔️'; }
      if (q2) { q2.title = '슬래시 블러스트 [W]'; q2.querySelector('.slot-icon').innerText = '🌀'; }
      if (q3) { q3.title = '아이언 바디 [E]'; q3.querySelector('.slot-icon').innerText = '🛡️'; }
      if (q4) { q4.title = '회복력 향상 [F]'; q4.querySelector('.slot-icon').innerText = '❤️'; }
    } else if (job === '마법사') {
      if (q1) { q1.title = '에너지 볼트 [Shift/Q]'; q1.querySelector('.slot-icon').innerText = '🔮'; }
      if (q2) { q2.title = '매직 클로 [W]'; q2.querySelector('.slot-icon').innerText = '✨'; }
      if (q3) { q3.title = '텔레포트 [E]'; q3.querySelector('.slot-icon').innerText = '🌌'; }
      if (q4) { q4.title = '회복력 [F]'; q4.querySelector('.slot-icon').innerText = '❤️'; }
    } else if (job === '궁수') {
      if (q1) { q1.title = '애로우 블로우 [Shift/Q]'; q1.querySelector('.slot-icon').innerText = '🏹'; }
      if (q2) { q2.title = '더블 샷 [W]'; q2.querySelector('.slot-icon').innerText = '🎯'; }
      if (q3) { q3.title = '포커스 [E]'; q3.querySelector('.slot-icon').innerText = '👁️'; }
      if (q4) { q4.title = '회복력 [F]'; q4.querySelector('.slot-icon').innerText = '❤️'; }
    } else if (job === '도적') {
      if (q1) { q1.title = '럭키 세븐 [Shift/Q]'; q1.querySelector('.slot-icon').innerText = '⭐'; }
      if (q2) { q2.title = '더블 스탭 [W]'; q2.querySelector('.slot-icon').innerText = '🗡️'; }
      if (q3) { q3.title = '플래시 점프 [E]'; q3.querySelector('.slot-icon').innerText = '⚡'; }
      if (q4) { q4.title = '헤이스트 [F]'; q4.querySelector('.slot-icon').innerText = '💨'; }
    }
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
    const items = p.inventory[tabName] || [];

    const mesoEl = document.getElementById('inven-meso-amount');
    if (mesoEl) mesoEl.innerText = p.meso.toLocaleString();

    for (let i = 0; i < 24; i++) {
      const slot = document.createElement('div');
      slot.className = 'inven-slot';

      if (items[i]) {
        const item = items[i];

        if (tabName === 'equip') {
          if (item.equipped) slot.classList.add('equipped');
          slot.title = `${item.name} [${item.equipped ? '장착 중' : '미장착'}]\n공격력: +${item.atk || 0} / 방어력: +${item.def || 0}\n남은 업그레이드 가능 횟수: ${item.upgradeSlots || 0}회\n(클릭하여 장착/해제)`;
        } else if (tabName === 'use' && item.type === 'scroll') {
          slot.title = `${item.name} x${item.count}\n성공률: ${(item.rate * 100)}%\n성공 시 공격력 +${item.bonusAtk}\n(클릭하여 장착 무기에 주문서 사용)`;
        } else {
          slot.title = `${item.name}${item.count ? ' x' + item.count : ''}`;
        }

        let icon = '📦';
        if (item.id === 'red_potion') icon = '🧪';
        else if (item.id === 'blue_potion') icon = '💙';
        else if (item.type === 'scroll') icon = '📜';
        else if (item.type === 'weapon') icon = '🗡️';
        else if (item.type === 'hat') icon = '🧢';
        else if (item.id === 'pan_lid') icon = '🍳';
        else if (item.id === 'zakum_helm') icon = '👑';
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
              p.scrollWeapon(item, this.game);
              this.renderInventoryTab('use');
              this.updateStatsWindow();
              this.updateHUD();
            } else if (item.count > 0) {
              p.usePotion(item.id);
              this.renderInventoryTab('use');
            }
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
          <div style="font-size: 9px; color: #854d0e;">${skill.desc || ''}</div>
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
          this.game.changeMap(dest.map, dest.x, dest.y);
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
          this.game.changeMap(dest.map, dest.x, dest.y);
        });
        choicesEl.appendChild(btn);
      });
    } else if (npc.type === 'adobis') {
      textEl.innerText = '자쿰의 제단에 오신 것을 환영합니다. 제단에 불의 눈을 바쳐 고대 거신 자쿰을 깨우시겠습니까?';
      const choices = [
        { text: '🔥 자쿰 레이드 시작 (자쿰 소환)', action: () => this.game.spawnZakumBoss() },
        { text: '헤네시스로 안전하게 귀환하기', action: () => this.game.changeMap('henesys_hhg', 1050, 1320) }
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
          text: '🏅 장로스탄의 칭찬 받기 (인기도 +5 획득)',
          action: () => {
            this.game.player.fame = (this.game.player.fame || 0) + 5;
            window.audio.playLevelUp();
            this.game.spawnItemText(this.game.player.x, this.game.player.y - 45, '★ 인기도 +5 획득! ★');
            this.addChat('system', '🌟 [장로스탄의 보상] 인기도가 +5 상승했습니다!');
            this.updateStatsWindow();
          }
        },
        { text: '헤네시스 사냥터 1로 바로 가기', action: () => this.game.changeMap('henesys_hhg', 1050, 1320) }
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
}

window.UIManager = UIManager;
