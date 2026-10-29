// js/network.js - Real-Time Multiplayer Networking & Remote Player Entity Manager

class RemotePlayer {
  constructor(data) {
    this.id = data.id;
    this.name = data.name || '모험가';
    this.job = data.job || '초보자';
    this.level = data.level || 1;
    this.fame = data.fame || 0;
    this.currentMap = data.currentMap || 'henesys_hhg';

    // Position & Target for smooth interpolation (Lerp)
    this.x = data.x || 1050;
    this.y = data.y || 1320;
    this.targetX = this.x;
    this.targetY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.facing = data.facing || 'left';
    this.onLadder = data.onLadder || false;
    this.action = data.action || 'stand_0';
    this.attackTimer = 0;
    this.attackDuration = 0.35;

    // Speech bubble
    this.speechText = null;
    this.speechTimer = 0;

    // Dimensions
    this.width = 30;
    this.height = 42;
    this.hp = 100;
  }

  update(dt) {
    // Smooth lerp towards targetX/Y received from network
    const lerpFactor = Math.min(1.0, dt * 16.0);
    this.x += (this.targetX - this.x) * lerpFactor;
    this.y += (this.targetY - this.y) * lerpFactor;

    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
    }

    if (this.speechTimer > 0) {
      this.speechTimer -= dt;
      if (this.speechTimer <= 0) {
        this.speechText = null;
      }
    }
  }

  setTargetPosition(x, y, vx, vy, facing, onLadder, action) {
    this.targetX = x;
    this.targetY = y;
    this.vx = vx;
    this.vy = vy;
    this.facing = facing;
    this.onLadder = onLadder;
    if (action) this.action = action;
  }

  triggerAction(action, skillId, game) {
    this.attackTimer = this.attackDuration;
    if (window.audio) {
      if (skillId === 'power_strike' || skillId === 'slash_blast') {
        window.audio.playPowerStrike();
      } else if (skillId === 'magic_claw') {
        window.audio.playMagicClaw();
      } else {
        window.audio.playAttack();
      }
    }

    // Spawn cosmetic skill effect for peers
    if (game && skillId) {
      game.skillEffects.push({
        type: skillId,
        x: this.facing === 'right' ? this.x + 30 : this.x - 30,
        y: this.y - 15,
        progress: 0,
        duration: 0.35
      });
    }
  }

  say(text) {
    this.speechText = text;
    this.speechTimer = 4.0;
  }
}

class NetworkManager {
  constructor(game) {
    this.game = game;
    this.ws = null;
    this.connected = false;
    this.myClientId = null;
    this.remotePlayers = new Map(); // id -> RemotePlayer
    this.authenticated = false;
    this.currentAccount = null;

    // Throttled movement sender (every 40ms = 25Hz)
    this.lastSendTime = 0;
    this.sendInterval = 40;

    this.init();
  }

  init() {
    this.connect();
  }

  connect() {
    const host = window.location.hostname || 'localhost';
    const locPort = parseInt(window.location.port);
    const wsPort = locPort ? (locPort + 1) : 8001;
    const wsUrl = `ws://${host}:${wsPort}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
        this.updateConnectionBadge(true);
        console.log(`[NET] Connected to OpenMaple Multiplayer Server: ${wsUrl}`);
        if (this.game.ui?.addChat) {
          this.game.ui.addChat('system', '🌐 [멀티플레이] LAN 게임 서버에 연결되었습니다! 다른 플레이어와 실시간 동기화됩니다.');
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.updateConnectionBadge(false);
        this.remotePlayers.clear();
        console.log('[NET] Disconnected from server. Reconnecting in 3s...');
        setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = (err) => {
        this.connected = false;
        this.updateConnectionBadge(false);
      };

      this.ws.onmessage = (e) => {
        try {
          const data = jsonParseSafe(e.data);
          if (data) this.handleMessage(data);
        } catch (err) {
          console.error('[NET MSG ERROR]', err);
        }
      };
    } catch (e) {
      this.connected = false;
      this.updateConnectionBadge(false);
    }
  }

  updateConnectionBadge(isOnline) {
    const badge = document.getElementById('net-status-badge');
    if (badge) {
      if (isOnline) {
        badge.className = 'net-badge-online';
        badge.innerHTML = '🟢 LAN 온라인';
        badge.title = '실시간 멀티플레이 서버에 정상 연결됨';
      } else {
        badge.className = 'net-badge-offline';
        badge.innerHTML = '⚪ 로컬 오프라인';
        badge.title = '단독 로컬 모드로 플레이 중 (서버 미연결)';
      }
    }
  }

  handleMessage(msg) {
    const type = msg.type;

    if (type === 'welcome') {
      this.myClientId = msg.id;
      this.updateOnlineCount(msg.onlineCount);
    } else if (type === 'auth_result') {
      alert(msg.message);
    } else if (type === 'auth_login_success') {
      this.authenticated = true;
      this.currentAccount = msg.character;
      this.applyCharacterData(msg.character);
      this.updateOnlineCount(msg.onlineCount);
      const modal = document.getElementById('modal-maple-login');
      if (modal) modal.style.display = 'none';
      if (this.game.ui?.addChat) {
        this.game.ui.addChat('system', `🎉 [로그인 완료] ${msg.character.name} 모험가님, 환영합니다! 서버 클라우드 저장이 활성화되었습니다.`);
      }
      this.game.spawnItemText(this.game.player.x, this.game.player.y - 45, '★ 로그인 성공! ★');
    } else if (type === 'room_players') {
      this.remotePlayers.clear();
      (msg.players || []).forEach(p => {
        if (p.id !== this.myClientId) {
          this.remotePlayers.set(p.id, new RemotePlayer(p));
        }
      });
    } else if (type === 'player_join') {
      const p = msg.player;
      if (p.id !== this.myClientId) {
        this.remotePlayers.set(p.id, new RemotePlayer(p));
        if (this.game.ui?.addChat) {
          this.game.ui.addChat('system', `👋 [접속] [${p.job}] ${p.name}님이 맵에 나타났습니다.`);
        }
      }
    } else if (type === 'player_leave') {
      if (this.remotePlayers.has(msg.id)) {
        const rp = this.remotePlayers.get(msg.id);
        this.remotePlayers.delete(msg.id);
        if (this.game.ui?.addChat && rp) {
          this.game.ui.addChat('system', `🚪 [이동] ${rp.name}님이 다른 곳으로 이동했습니다.`);
        }
      }
    } else if (type === 'peer_move') {
      const rp = this.remotePlayers.get(msg.id);
      if (rp) {
        rp.setTargetPosition(msg.x, msg.y, msg.vx, msg.vy, msg.facing, msg.onLadder, msg.action);
      }
    } else if (type === 'peer_action') {
      const rp = this.remotePlayers.get(msg.id);
      if (rp) {
        rp.triggerAction(msg.action, msg.skillId, this.game);
      }
    } else if (type === 'chat_broadcast') {
      const rp = this.remotePlayers.get(msg.senderId);
      if (rp) {
        rp.say(msg.text);
      } else if (msg.senderId === this.myClientId && this.game.player) {
        this.game.player.say(msg.text);
      }
      if (this.game.ui?.addChat) {
        this.game.ui.addChat(msg.channel === '파티' ? 'party' : (msg.channel === '길드' ? 'guild' : 'all'), `${msg.senderName} : ${msg.text}`);
      }
    } else if (type === 'fame_broadcast') {
      if (this.game.ui?.addChat) {
        this.game.ui.addChat('system', `🌟 [인기도 UP] ${msg.fromName}님이 ${msg.targetName}님의 인기도를 올려주었습니다! (현재: ${msg.newFame})`);
      }
      if (this.game.player && this.game.player.name === msg.targetName) {
        this.game.player.fame = msg.newFame;
        if (window.audio) window.audio.playLevelUp();
        this.game.spawnItemText(this.game.player.x, this.game.player.y - 45, '★ 인기도 +1 상승! ★');
        this.game.ui.updateStatsWindow();
      }
      const rp = Array.from(this.remotePlayers.values()).find(p => p.name === msg.targetName);
      if (rp) {
        rp.fame = msg.newFame;
        this.game.spawnItemText(rp.x, rp.y - 45, '★ 인기도 +1! ★');
      }
    }
  }

  updateOnlineCount(cnt) {
    const el = document.getElementById('hud-online-count');
    if (el) el.innerText = `👥 접속자: ${cnt || 1}명`;
  }

  applyCharacterData(data) {
    const p = this.game.player;
    if (!p) return;
    this.game.restorePlayerData(data);
    this.game.ui?.updateStatsWindow();
    this.game.ui?.updateSkillsWindow();
  }

  // --- Client Outbound API ---
  register(username, password) {
    if (!this.connected) {
      alert('서버에 연결되어 있지 않습니다. 로컬 오프라인 모드로 실행됩니다.');
      return;
    }
    this.send({
      type: 'auth_register',
      username,
      password
    });
  }

  login(username, password) {
    if (!this.connected) {
      alert('서버에 연결되어 있지 않습니다. 로컬 오프라인 모드로 실행됩니다.');
      return;
    }
    this.send({
      type: 'auth_login',
      username,
      password
    });
  }

  saveCurrentCharacter() {
    if (!this.connected || !this.authenticated || !this.currentAccount) return;
    const p = this.game.player;
    const charData = {
      charId: this.currentAccount.charId,
      level: p.level,
      exp: p.exp,
      hp: p.hp,
      maxHp: p.maxHp,
      mp: p.mp,
      maxMp: p.maxMp,
      str: p.str,
      dex: p.dex,
      int: p.int,
      luk: p.luk,
      ap: p.ap,
      sp: p.sp,
      fame: p.fame || 0,
      meso: p.meso,
      currentMap: this.game.map.currentKey,
      x: p.x,
      y: p.y,
      inventory: p.inventory,
      skills: p.skills,
      quickslots: p.quickslotBindings || []
    };
    this.send({
      type: 'save_character',
      character: charData,
      timestamp: Date.now()
    });
  }

  sendMove(player, currentMapKey) {
    if (!this.connected) return;
    const now = performance.now();
    if (now - this.lastSendTime < this.sendInterval) return;
    this.lastSendTime = now;

    let action = 'stand_0';
    if (player.onLadder) action = 'ladder_0';
    else if (!player.onGround) action = 'jump_0';
    else if (player.vx !== 0) action = 'walk_0';

    this.send({
      type: 'player_move',
      x: Math.round(player.x),
      y: Math.round(player.y),
      vx: player.vx,
      vy: player.vy,
      facing: player.facing,
      onLadder: player.onLadder,
      action: action,
      currentMap: currentMapKey
    });
  }

  sendAction(action, skillId) {
    if (!this.connected) return;
    this.send({
      type: 'player_action',
      action: action,
      skillId: skillId
    });
  }

  sendChat(text, channel = 'ALL') {
    if (!this.connected) {
      // Local fallback
      if (this.game.player) this.game.player.say(text);
      if (this.game.ui?.addChat) this.game.ui.addChat('all', `나 : ${text}`);
      return;
    }
    this.send({
      type: 'chat_message',
      text: text,
      channel: channel
    });
  }

  sendFameUp(targetName) {
    if (!this.connected) {
      alert('오프라인 모드에서는 인기도를 올릴 수 없습니다.');
      return;
    }
    this.send({
      type: 'fame_up',
      targetName: targetName
    });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  update(dt) {
    for (const rp of this.remotePlayers.values()) {
      rp.update(dt);
    }
  }

  drawRemotePlayers(ctx) {
    for (const rp of this.remotePlayers.values()) {
      window.sprites.drawPlayer(ctx, rp);
    }
  }
}

function jsonParseSafe(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

window.NetworkManager = NetworkManager;
window.RemotePlayer = RemotePlayer;
