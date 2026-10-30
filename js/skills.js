// js/skills.js - Skill Strategy Pattern & SkillRegistry adhering to SOLID (SRP & OCP)

const SKILL_AIM_PROFILES = {
  three_snails: {range: 420, verticalRange: 48},
  power_strike: {range: 100, verticalRange: 48},
  slash_blast: {range: 90, verticalRange: 55},
  brandish: {range: 150, verticalRange: 55},
  energy_bolt: {range: 440, verticalRange: 48},
  magic_claw: {range: 150, verticalRange: 55},
  thunderbolt: {range: 260, verticalRange: 80},
  heal: {range: 280, verticalRange: 160},
  genesis: {range: 750, verticalRange: 400},
  arrow_blow: {range: 520, verticalRange: 48},
  double_shot: {range: 520, verticalRange: 48},
  arrow_bomb: {range: 520, verticalRange: 48},
  strafe: {range: 540, verticalRange: 48},
  hurricane: {range: 580, verticalRange: 48},
  lucky_seven: {range: 480, verticalRange: 48},
  double_stab: {range: 95, verticalRange: 48},
  savage_blow: {range: 110, verticalRange: 50},
  avenger: {range: 560, verticalRange: 55},
  drain: {range: 520, verticalRange: 48},
  shadow_web: {range: 300, verticalRange: 60},
  triple_throw: {range: 520, verticalRange: 48},
  boomerang_step: {range: 160, verticalRange: 55},
  assassinate: {range: 110, verticalRange: 50},
  panic: {range: 110, verticalRange: 50},
  coma: {range: 160, verticalRange: 55},
  charge_blow: {range: 130, verticalRange: 50},
  dragon_buster: {range: 150, verticalRange: 50},
  dragon_thresher: {range: 180, verticalRange: 55},
  dragon_roar: {range: 600, verticalRange: 400},
  sanctuary: {range: 750, verticalRange: 400},
  cold_beam: {range: 400, verticalRange: 80},
  ice_strike: {range: 280, verticalRange: 100},
  chain_lightning: {range: 380, verticalRange: 80},
  poison_mist: {range: 260, verticalRange: 60},
  paralyze: {range: 320, verticalRange: 60},
  meteor: {range: 750, verticalRange: 400},
  blizzard: {range: 750, verticalRange: 400},
  shining_ray: {range: 280, verticalRange: 100},
  iron_arrow: {range: 580, verticalRange: 48},
  piercing: {range: 640, verticalRange: 48},
  sniping: {range: 700, verticalRange: 55},
  arrow_rain: {range: 320, verticalRange: 120},
  somersault_kick: {range: 110, verticalRange: 50},
  double_fire: {range: 520, verticalRange: 48},
  backspin_blow: {range: 110, verticalRange: 50},
  energy_buster: {range: 400, verticalRange: 60},
  dragon_strike: {range: 420, verticalRange: 120},
  rapid_fire: {range: 560, verticalRange: 48},
  battleship_cannon: {range: 580, verticalRange: 60}
};

class Skill {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.baseMpCost = config.mpCost || 0;
    this.mpCost = this.baseMpCost ? Math.max(1, Math.ceil(this.baseMpCost * 0.25)) : 0;
    this.hpCost = config.hpCost || 0;
    this.dmgMult = config.dmgMult || 1.0;
    this.icon = config.icon || '⚔️';
    this.desc = config.desc || '';
    this.isBuffOrMobility = config.isBuffOrMobility || false;
    this.maxLevel = config.maxLevel || 20;
    this.handler = config.handler;
    this.aimProfile = SKILL_AIM_PROFILES[this.id];
  }

  canCast(user) {
    if (user.hp <= 0 || user.onLadder) return false;
    if (this.id === 'flash_jump' && user.weakenedTimer > 0) return false;
    if (user.skillCooldowns?.[this.id] > 0) return false;
    if (user.mp < this.getManaCost(user)) return false;
    if (this.hpCost > 0 && user.hp <= this.hpCost) return false;
    if (!this.isBuffOrMobility && user.attackTimer > 0) return false;
    return true;
  }

  consumeCosts(user) {
    user.mp = Math.max(0, user.mp - this.getManaCost(user));
    if (this.hpCost > 0) user.hp -= this.hpCost;
  }

  getManaCost(user) {
    return user.getPrimarySkillId?.() === this.id ? 0 : this.mpCost;
  }

  execute(user, game, skillInstance) {
    if (!this.canCast(user)) return false;
    user.attackAim = this.aimProfile && typeof CombatSystem !== 'undefined'
      ? CombatSystem.prepareAutoAim(user, game, this.aimProfile) : null;
    this.consumeCosts(user);
    const result = this.handler(user, game, skillInstance, this);
    if (result !== false) {
      const speed = user.getAttackSpeedFactor?.() || 1;
      if (!this.isBuffOrMobility) {
        user.attackTimer = Math.max(0.1, user.attackTimer / speed);
        user.attackAnimationDuration = user.attackTimer;
      }
      if (!user.skillCooldowns) user.skillCooldowns = {};
      user.skillCooldowns[this.id] = this.isBuffOrMobility ? Math.max(0.12, 0.3 / speed) : user.attackTimer;
      if (skillInstance) skillInstance.mpCost = this.getManaCost(user);
    }
    return result;
  }
}

class SkillRegistry {
  static skills = new Map();

  static register(config) {
    const skill = new Skill(config);
    this.skills.set(skill.id, skill);
    return skill;
  }

  static get(skillId) {
    return this.skills.get(skillId) || null;
  }

  static execute(skillId, user, game) {
    const skill = this.get(skillId);
    if (!skill) return false;
    const playerSkillData = user.skills ? user.skills[skillId] : null;
    return skill.execute(user, game, playerSkillData);
  }

  static schedule(user, game, delayMs, callback) {
    const map = game.map;
    const mapKey = map?.currentKey;
    const monsters = game.monsters;
    const run = () => {
      if (user.hp <= 0 || user.onLadder || game.map !== map || game.monsters !== monsters || game.map?.currentKey !== mapKey) return;
      callback();
    };
    if (delayMs === 0) run();
    else setTimeout(run, delayMs / (user.getAttackSpeedFactor?.() || 1));
  }

  static fireProjectile(user, game, options, aim = user.attackAim, facing = user.facing) {
    const direction = facing === 'right' ? 1 : -1;
    const x = user.x + direction * (options.offsetX ?? 16);
    const y = user.y + (options.offsetY ?? -16);
    const velocity = CombatSystem.projectileVelocity(user, game, aim, x, y, options.speed, facing);
    const projectile = new Projectile(x, y, velocity.vx, velocity.vy + (options.spreadY || 0),
      options.type, options.damage, options.isCrit, user, options);
    projectile.life = Math.min(projectile.life, (options.range || 520) / options.speed);
    if (options.starType) projectile.starType = options.starType;
    if (options.isShadow) projectile.isShadow = true;
    if (options.pierce || options.maxTargets > 1) {
      projectile.pierce = true;
      projectile.maxTargets = options.maxTargets || 6;
    }
    if (options.drainRate) projectile.drainRate = options.drainRate;
    game.projectiles.push(projectile);
    return projectile;
  }
}

// === Skill Implementations adhering to OCP ===

// 1. Beginner Skills
SkillRegistry.register({
  id: 'three_snails',
  name: '달팽이 세껍질',
  mpCost: 0,
  dmgMult: 1.5,
  maxLevel: 3,
  icon: '🐌',
  desc: '달팽이 껍질을 던져 원거리 타격',
  handler: (user, game, skillData, meta) => {
    user.attackTimer = user.attackDuration;
    window.audio.playAttack();
    const shellDmg = 40 + (skillData?.level || 1) * 20;
    SkillRegistry.fireProjectile(user, game, {type: 'snail_shell', speed: 480, range: 420,
      offsetY: -14, damage: shellDmg, isCrit: true});
    return true;
  }
});

SkillRegistry.register({
  id: 'flash_jump',
  name: '플래시 점프',
  mpCost: 6,
  maxLevel: 5,
  icon: '⚡',
  isBuffOrMobility: true,
  desc: '공중 2단 고속 도약',
  handler: (user, game) => {
    return user.flashJump();
  }
});

// 2. Warrior Skills
SkillRegistry.register({
  id: 'power_strike',
  name: '파워 스트라이크',
  mpCost: 0,
  dmgMult: 1.8,
  maxLevel: 20,
  icon: '⚔️',
  desc: '검을 강하게 내리쳐 큰 피해',
  handler: (user, game, skillData, meta) => {
    user.attackTimer = user.attackDuration * 1.1;
    window.audio.playPowerStrike();

    game.skillEffects.push({
      type: 'power_strike',
      x: user.facing === 'right' ? user.x + 30 : user.x - 30,
      y: user.y - 15,
      progress: 0,
      duration: 0.35
    });

    const hitBox = {
      x: user.facing === 'right' ? user.x - 25 : user.x - 95,
      y: user.y - 55,
      width: 120,
      height: 65
    };

    const mult = meta.dmgMult + (skillData?.level || 1) * 0.08;
    CombatSystem.executeMeleeAttack(user, hitBox, mult, game, { maxTargets: 1 });
    return true;
  }
});

SkillRegistry.register({
  id: 'slash_blast',
  name: '슬래시 블러스트',
  mpCost: 8,
  hpCost: 4,
  dmgMult: 1.4,
  maxLevel: 20,
  icon: '🌀',
  desc: '회전하며 주변 다수 타격',
  handler: (user, game, skillData, meta) => {
    user.attackTimer = user.attackDuration * 1.2;
    window.audio.playSlashBlast();

    game.skillEffects.push({
      type: 'slash_blast',
      x: user.x,
      y: user.y - 15,
      progress: 0,
      duration: 0.4
    });

    const hitBox = {
      x: user.x - 90,
      y: user.y - 60,
      width: 180,
      height: 75
    };

    const mult = meta.dmgMult + (skillData?.level || 1) * 0.05;
    CombatSystem.executeMeleeAttack(user, hitBox, mult, game, { maxTargets: 6 });
    return true;
  }
});

SkillRegistry.register({
  id: 'iron_body',
  name: '아이언 바디',
  mpCost: 10,
  maxLevel: 20,
  icon: '🛡️',
  isBuffOrMobility: true,
  desc: '단단한 신체로 방어력 +25',
  handler: (user, game) => {
    user.buffs.iron_body = { name: '아이언 바디', icon: '🛡️', permanent: true, isPassive: true, duration: Infinity, maxDuration: Infinity };
    user.calcDerivedStats();
    game.spawnItemText(user.x, user.y - 45, '🛡️ [아이언 바디] 방어력 +25 상시 적용!');
    if (game.ui?.addChat) game.ui.addChat('system', '🛡️ [아이언 바디] 방어력이 25 증가하는 상시 패시브입니다.');
    window.audio?.playLevelUp?.();
    return true;
  }
});

SkillRegistry.register({
  id: 'rage',
  name: '분노',
  mpCost: 15,
  maxLevel: 20,
  icon: '🔥',
  isBuffOrMobility: true,
  desc: '공격력 +35 대폭 증가',
  handler: (user, game) => {
    user.buffs.rage = { name: '분노', icon: '🔥', permanent: true, isPassive: true, duration: Infinity, maxDuration: Infinity };
    user.calcDerivedStats();
    window.audio?.playLevelUp?.();
    game.spawnItemText(user.x, user.y - 45, '🔥 [분노] 공격력 +35 상시 적용!');
    if (game.ui?.addChat) game.ui.addChat('system', '🔥 [분노] 전사의 투지로 공격력이 35 상승하는 상시 패시브입니다.');
    return true;
  }
});

SkillRegistry.register({
  id: 'combo_attack',
  name: '콤보 어택',
  mpCost: 15,
  maxLevel: 20,
  icon: '🔮',
  isBuffOrMobility: true,
  desc: '타격 시 콤보 구슬 누적 공격력 증폭!',
  handler: (user, game) => {
    user.buffs.combo_attack = { name: '콤보 어택', icon: '🔮', permanent: true, isPassive: true, duration: Infinity, maxDuration: Infinity };
    user.comboCount = Math.max(1, user.comboCount || 1);
    user.calcDerivedStats();
    window.audio?.playLevelUp?.();
    game.spawnItemText(user.x, user.y - 45, '🔮 [콤보 어택] 상시 활성화!');
    if (game.ui?.addChat) game.ui.addChat('system', '🔮 [콤보 어택] 타격마다 콤보 구슬이 모여 공격력이 증폭되는 상시 패시브입니다.');
    return true;
  }
});

SkillRegistry.register({
  id: 'brandish',
  name: '브랜디쉬',
  mpCost: 16,
  dmgMult: 2.2,
  maxLevel: 30,
  icon: '⚡',
  desc: '거대한 십자 검기로 2연속 쾌도난마!',
  handler: (user, game, skillData, meta) => {
    user.attackTimer = user.attackDuration * 1.25;
    window.audio.playPowerStrike();

    game.skillEffects.push({
      type: 'brandish',
      x: user.facing === 'right' ? user.x + 45 : user.x - 45,
      y: user.y - 20,
      progress: 0,
      duration: 0.45
    });

    const hitBox = {
      x: user.facing === 'right' ? user.x - 30 : user.x - 120,
      y: user.y - 60,
      width: 150,
      height: 75
    };

    const mult = meta.dmgMult + (skillData?.level || 1) * 0.05;
    CombatSystem.executeMeleeAttack(user, hitBox, mult, game, { maxTargets: 3, hitsPerTarget: 2, hitDelay: 110 });
    return true;
  }
});

// 3. Magician Skills
SkillRegistry.register({
  id: 'energy_bolt',
  name: '에너지 볼트',
  mpCost: 6,
  dmgMult: 1.3,
  maxLevel: 20,
  icon: '🔮',
  desc: '비전 마법 탄환 전방 발사',
  handler: (user, game, skillData, meta) => {
    user.attackTimer = user.attackDuration;
    window.audio.playAttack();
    const { damage, isCrit } = user.getDamage();
    SkillRegistry.fireProjectile(user, game, {type: 'energy_bolt', speed: 440, range: 440,
      damage: Math.floor(damage * 1.4), isCrit});
    return true;
  }
});

SkillRegistry.register({
  id: 'magic_claw',
  name: '매직 클로',
  mpCost: 0,
  dmgMult: 1.3,
  maxLevel: 20,
  icon: '✨',
  desc: '보라색 마법 손톱 2연속 할퀴기',
  handler: (user, game, skillData, meta) => {
    user.attackTimer = user.attackDuration * 1.1;
    window.audio.playMagicClaw();

    const hitBox = {
      x: user.facing === 'right' ? user.x - 20 : user.x - 130,
      y: user.y - 55,
      width: 150,
      height: 65
    };

    game.skillEffects.push({
      type: 'magic_claw',
      x: user.facing === 'right' ? user.x + 50 : user.x - 50,
      y: user.y - 25,
      progress: 0,
      duration: 0.35
    });

    const mult = 1.1 + (skillData?.level || 1) * 0.06;
    CombatSystem.executeMeleeAttack(user, hitBox, mult, game, { maxTargets: 1, hitsPerTarget: 2, hitDelay: 120 });
    return true;
  }
});

SkillRegistry.register({
  id: 'teleport',
  name: '텔레포트',
  mpCost: 8,
  maxLevel: 5,
  icon: '🌌',
  isBuffOrMobility: true,
  desc: '지상 및 공중에서 바라보는/입력한 방향으로 즉시 순간이동 (점텔 지원)',
  handler: (user, game) => {
    const map = game.map;
    const halfWidth = (user.width || 24) / 2;
    const startX = user.x;
    const startY = user.y;

    const isUp = Boolean(game?.isActionPressed?.('climbUp'));
    const isDown = Boolean(game?.isActionPressed?.('climbDown'));
    const isJumpHeld = Boolean(game?.isActionPressed?.('jump'));
    const hDir = game?.getHorizontalDirection?.() || 0;
    if (hDir !== 0) user.facing = hDir > 0 ? 'right' : 'left';
    const dirSign = user.facing === 'right' ? 1 : -1;

    // If Jump is held while grounded, initiate jump first for seamless Jump-Teleport (점텔)
    if (isJumpHeld && user.onGround && typeof user.jump === 'function') {
      user.jump(hDir);
    }

    const wasGrounded = user.onGround;
    const previousY = user.y;
    const lvl = Math.max(1, user.skills?.teleport?.level || 1);
    const horizDist = 130 + (lvl - 1) * 28;
    const vertDist = 120 + (lvl - 1) * 22;

    if (isUp || isDown) {
      const targetY = previousY + (isUp ? -vertDist : vertDist);
      if (hDir !== 0) {
        user.x = Math.max(halfWidth, Math.min(map.width - halfWidth, user.x + dirSign * Math.floor(horizDist * 0.5)));
      }
      user.onLadder = false;
      user.currentLadder = null;
      const destination = map.findFootholdNear(user.x, targetY, 36);
      user.currentFoothold = destination;
      user.onGround = Boolean(destination);
      if (destination) {
        user.y = destination.getYAtX(user.x);
        user.vy = 0;
      } else if (!wasGrounded) {
        user.y = Number.isFinite(map.height)
          ? Math.max(20, Math.min(map.height - 10, targetY))
          : Math.max(20, targetY);
      }
    } else {
      user.x = Math.max(halfWidth, Math.min(map.width - halfWidth, user.x + dirSign * horizDist));
      user.onLadder = false;
      user.currentLadder = null;
      const destination = wasGrounded ? map.findFootholdNear(user.x, previousY, 16) : null;
      user.currentFoothold = destination;
      user.onGround = Boolean(destination);
      if (destination) {
        user.y = destination.getYAtX(user.x);
        user.vy = 0;
      }
    }

    if (game?.skillEffects) {
      game.skillEffects.push({
        type: 'teleport',
        x: user.x,
        y: user.y,
        startX,
        startY,
        endX: user.x,
        endY: user.y,
        progress: 0,
        duration: 0.28
      });
    }
    window.audio.playFlashJump();
    return true;
  }
});

SkillRegistry.register({
  id: 'magic_guard',
  name: '매직 가드',
  mpCost: 15,
  maxLevel: 20,
  icon: '💎',
  isBuffOrMobility: true,
  desc: '받는 피해의 80%를 MP로 대체 흡수!',
  handler: (user, game) => {
    user.buffs.magic_guard = { name: '매직 가드', icon: '💎', permanent: true, isPassive: true, duration: Infinity, maxDuration: Infinity };
    window.audio?.playLevelUp?.();
    game.spawnItemText(user.x, user.y - 45, '💎 [매직 가드] 피해 80% MP 흡수 상시 적용!');
    if (game.ui?.addChat) game.ui.addChat('system', '💎 [매직 가드] 피격 피해의 80%를 MP로 대신 흡수하는 상시 패시브입니다.');
    return true;
  }
});

SkillRegistry.register({
  id: 'thunderbolt',
  name: '썬더볼트',
  mpCost: 20,
  dmgMult: 1.9,
  maxLevel: 30,
  icon: '⚡',
  desc: '하늘에서 번개가 쏟아지는 전 화면 광역기!',
  handler: (user, game, skillData, meta) => {
    user.attackTimer = user.attackDuration * 1.25;
    window.audio.playSlashBlast();

    game.skillEffects.push({
      type: 'thunderbolt',
      x: user.x,
      y: user.y - 20,
      progress: 0,
      duration: 0.55
    });

    const hitBox = {
      x: user.x - 260,
      y: user.y - 120,
      width: 520,
      height: 240
    };

    CombatSystem.executeMeleeAttack(user, hitBox, 1.9, game, { maxTargets: 6 });
    return true;
  }
});

SkillRegistry.register({
  id: 'holy_symbol',
  name: '홀리 심볼',
  mpCost: 25,
  maxLevel: 30,
  icon: '🕊️',
  isBuffOrMobility: true,
  desc: '60초간 치유 및 경험치 +50% 획득!',
  handler: (user, game) => {
    user.buffs.holy_symbol = { name: '홀리 심볼', icon: '🕊️', permanent: true, isPassive: true, duration: Infinity, maxDuration: Infinity };
    user.healHp(150);
    window.audio.playLevelUp();
    game.spawnItemText(user.x, user.y - 45, '🕊️ [홀리 심볼] 경험치 +50% 상시 적용!');
    if (game.ui?.addChat) game.ui.addChat('system', '🕊️ [홀리 심볼] 성스러운 은총으로 획득 경험치가 1.5배 증가하는 상시 패시브입니다.');
    return true;
  }
});

SkillRegistry.register({
  id: 'heal',
  name: '힐 (Heal)',
  mpCost: 18,
  maxLevel: 30,
  icon: '✝️',
  desc: '자신 HP 35% 치유 및 주변 언데드 몬스터 성속성 타격!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 0.9;
    window.audio?.playLevelUp?.();
    user.healHp(Math.floor(user.maxHp * 0.35));
    game.spawnItemText(user.x, user.y - 45, '✝️ [힐] HP 회복!');
    game.skillEffects.push({ type: 'heal', x: user.x, y: user.y, duration: 0.55, progress: 0 });

    if (typeof CombatSystem !== 'undefined' && CombatSystem.executeUndeadHolyHeal) {
      CombatSystem.executeUndeadHolyHeal(user, 360, 2.8, game);
    } else {
      const holyRange = 360;
      const { damage } = user.getDamage();
      game.monsters.forEach(m => {
        if (!m.isAlive()) return;
        const isUndead = Boolean(
          m.isUndead ||
          m.type === 'coolie_zombie' ||
          m.type === 'jr_wraith' ||
          m.type === 'zombie_mushroom' ||
          m.type === 'zombie_mushmom' ||
          m.type === 'death_teddy'
        );
        if (!isUndead) return;
        const dist = Math.hypot(m.x - user.x, m.y - user.y);
        if (dist <= holyRange) {
          const holyDmg = Math.floor(damage * 2.8);
          const hitDirection = user.x < m.x ? 'right' : 'left';
          m.takeDamage(holyDmg, true, hitDirection, game);
          game.damageDigits.push(new DamageDigit(m.x, m.y - 40, holyDmg, true));
          game.skillEffects.push({ type: 'holy_hit', x: m.x, y: m.y - 20, duration: 0.35, progress: 0 });
        }
      });
    }
    return true;
  }
});

SkillRegistry.register({
  id: 'genesis',
  name: '제네시스',
  mpCost: 35,
  maxLevel: 30,
  icon: '🌟',
  desc: '하늘에서 성스러운 빛의 기둥 4개가 쏟아지는 최강 마법!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.4;
    window.audio?.playAttack?.();
    game.skillEffects.push({ type: 'genesis', x: user.x, y: user.y, duration: 0.85, progress: 0 });

    const maxTargets = 6;
    let hitCount = 0;
    const { damage } = user.getDamage();
    game.monsters.forEach(m => {
      if (!m.isAlive() || hitCount >= maxTargets) return;
      const dist = Math.hypot(m.x - user.x, m.y - user.y);
      if (dist <= 750) {
        hitCount++;
        const holyDmg = Math.floor(damage * 3.5);
        m.takeDamage(holyDmg, game, user.x, true);
        game.damageDigits.push(new DamageDigit(m.x, m.y - 45, holyDmg, true));
      }
    });
    return true;
  }
});

// 4. Bowman Skills
SkillRegistry.register({
  id: 'arrow_blow',
  name: '애로우 블로우',
  mpCost: 0,
  dmgMult: 1.6,
  maxLevel: 20,
  icon: '🏹',
  desc: '관통하는 강력한 화살 1발',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration;
    window.audio.playAttack();
    const { damage } = user.getDamage();
    SkillRegistry.fireProjectile(user, game, {type: 'arrow', speed: 520, range: 520,
      damage: Math.floor(damage * 1.8), isCrit: true});
    return true;
  }
});

SkillRegistry.register({
  id: 'double_shot',
  name: '더블 샷',
  mpCost: 0,
  dmgMult: 1.25,
  maxLevel: 20,
  icon: '🎯',
  desc: '화살 2발을 고속 연속 발사',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.2;
    window.audio.playAttack();
    const aim = user.attackAim, facing = user.facing;
    for (let s = 0; s < 2; s++) {
      SkillRegistry.schedule(user, game, s * 140, () => {
        const { damage, isCrit } = user.getDamage();
        SkillRegistry.fireProjectile(user, game, {type: 'arrow', speed: 500, range: 520,
          damage: Math.floor(damage * 1.25), isCrit}, aim, facing);
      });
    }
    return true;
  }
});

SkillRegistry.register({
  id: 'focus',
  name: '포커스',
  mpCost: 8,
  maxLevel: 10,
  icon: '👁️',
  isBuffOrMobility: true,
  desc: '명중률 +25 및 이동속도 증가',
  handler: (user, game) => {
    user.buffs.focus = { name: '포커스', icon: '👁️', permanent: true, isPassive: true, duration: Infinity, maxDuration: Infinity };
    user.calcDerivedStats();
    user.walkSpeed = Math.min(5.5, user.walkSpeed + 0.6);
    game.spawnItemText(user.x, user.y - 45, '👁️ [포커스] 명중/이속 상시 증가!');
    if (game.ui?.addChat) game.ui.addChat('system', '👁️ [포커스] 명중률과 이동속도가 상승하는 상시 패시브입니다.');
    window.audio?.playLevelUp?.();
    return true;
  }
});

SkillRegistry.register({
  id: 'soul_arrow',
  name: '소울 애로우',
  mpCost: 12,
  maxLevel: 20,
  icon: '✨',
  isBuffOrMobility: true,
  desc: '황금 날개 활 버프! 공격력 +15!',
  handler: (user, game) => {
    user.buffs.soul_arrow = { name: '소울 애로우', icon: '✨', permanent: true, isPassive: true, duration: Infinity, maxDuration: Infinity };
    user.calcDerivedStats();
    window.audio?.playLevelUp?.();
    game.spawnItemText(user.x, user.y - 45, '✨ [소울 애로우] 공격력 +15 & 화살 무한 상시 적용!');
    if (game.ui?.addChat) game.ui.addChat('system', '✨ [소울 애로우] 화살 소비 없이 공격력이 15 증가하는 상시 패시브입니다.');
    return true;
  }
});

SkillRegistry.register({
  id: 'arrow_bomb',
  name: '애로우 밤',
  mpCost: 16,
  dmgMult: 1.8,
  maxLevel: 30,
  icon: '💣',
  desc: '화살 폭탄이 폭발하며 광역 타격!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.1;
    window.audio.playAttack();
    const { damage } = user.getDamage();
    SkillRegistry.fireProjectile(user, game, {type: 'arrow_bomb', speed: 520, range: 520,
      damage: Math.floor(damage * 1.8), isCrit: true});
    return true;
  }
});

SkillRegistry.register({
  id: 'strafe',
  name: '스트레이프',
  mpCost: 20,
  dmgMult: 0.9,
  maxLevel: 30,
  icon: '🎯',
  desc: '황금 화살 4발을 초고속 시차 연사!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.1;
    window.audio?.playAttack?.();
    const aim = user.attackAim, facing = user.facing;
    game.skillEffects.push({ type: 'strafe', x: user.x, y: user.y, facing: user.facing, duration: 0.45, progress: 0 });
    for (let s = 0; s < 4; s++) {
      SkillRegistry.schedule(user, game, s * 60, () => {
        const { damage, isCrit } = user.getDamage();
        SkillRegistry.fireProjectile(user, game, {
          type: 'arrow', speed: 620, range: 540,
          offsetX: 18, offsetY: -16 + (s * 3 - 4.5),
          damage: Math.floor(damage * 0.9), isCrit
        }, aim, facing);
      });
    }
    return true;
  }
});

SkillRegistry.register({
  id: 'hurricane',
  name: '폭풍의 시',
  mpCost: 6,
  dmgMult: 1.4,
  maxLevel: 30,
  icon: '🌪️',
  desc: '초고속으로 기관총 화살 난사!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 0.8;
    window.audio.playAttack();
    const aim = user.attackAim, facing = user.facing;
    for (let s = 0; s < 4; s++) {
      SkillRegistry.schedule(user, game, s * 70, () => {
        const { damage, isCrit } = user.getDamage();
        SkillRegistry.fireProjectile(user, game, {type: 'arrow', speed: 580, range: 580,
          offsetX: 18, offsetY: -16 + (s * 4 - 6), damage: Math.floor(damage * 1.3), isCrit}, aim, facing);
      });
    }
    return true;
  }
});

// 5. Thief Skills
SkillRegistry.register({
  id: 'lucky_seven',
  name: '럭키 세븐',
  mpCost: 0,
  dmgMult: 1.7,
  maxLevel: 30,
  icon: '⭐',
  desc: '수리검을 전방으로 투척하는 도적 핵심기 (전직 시 2차: 트리플 3연타, 3차: 쿼드러플 4연타, 4차: 펜타 5연타로 자동 진화!)',
  handler: (user, game, skillData) => {
    user.attackTimer = user.attackDuration * 1.1;
    window.audio?.playAttack?.();
    const aim = user.attackAim, facing = user.facing;
    const activeStar = user.activeStar || 'steely';

    // Job Tier auto-scaling: 1st tier (로그/도적) = 2, 2nd tier (어쌔신) = 3 (트리플), 3차 (허밋) = 4 (쿼드), 4차 (나이트로드) = 5 (펜타)
    const tier = Math.max(1, user.jobTier || 1);
    const tierStarCount = Math.max(2, Math.min(5, tier + 1));
    const lvl = (user.skills?.lucky_seven?.level || 1);
    const starCount = Math.max(tierStarCount, (lvl >= 30 ? 5 : lvl >= 20 ? 4 : lvl >= 10 ? 3 : 2));
    let baseMult = 1.7 + (starCount - 2) * 0.15 + (lvl - 1) * 0.02;

    // 1. Primary Throw (Player)
    for (let s = 0; s < starCount; s++) {
      SkillRegistry.schedule(user, game, s * 65, () => {
        const { damage, isCrit } = user.getDamage();
        const starDmg = Math.floor(damage * baseMult);
        const spread = (s - (starCount - 1) / 2) * 18;
        SkillRegistry.fireProjectile(user, game, {
          type: 'shuriken',
          speed: 600,
          range: 520,
          offsetY: -16 + (s * 4 - (starCount * 2)),
          spreadY: spread,
          damage: starDmg,
          isCrit: isCrit || s === 0,
          starType: activeStar
        }, aim, facing);
      });
    }

    // 2. Shadow Partner Mirror Throw (0.08s delay clone replication)
    if (user.hasShadowPartner && user.hasShadowPartner()) {
      for (let s = 0; s < starCount; s++) {
        SkillRegistry.schedule(user, game, 80 + s * 65, () => {
          const { damage } = user.getDamage();
          const shadowDmg = Math.max(1, Math.floor(damage * baseMult * 0.5));
          const spread = (s - (starCount - 1) / 2) * 18;
          SkillRegistry.fireProjectile(user, game, {
            type: 'shuriken',
            speed: 600,
            range: 520,
            offsetX: facing === 'right' ? -14 : 14,
            offsetY: -16 + (s * 4 - (starCount * 2)),
            spreadY: spread,
            damage: shadowDmg,
            isCrit: false,
            starType: activeStar,
            isShadow: true
          }, aim, facing);
        });
      }
    }

    return true;
  }
});

SkillRegistry.register({
  id: 'double_stab',
  name: '더블 스탭',
  mpCost: 0,
  dmgMult: 1.3,
  maxLevel: 20,
  icon: '🗡️',
  desc: '단검으로 급소 2연속 찌르기 (쉐도우 파트너 시 4연타)',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 0.9;
    window.audio?.playAttack?.();

    const hitBox = {
      x: user.facing === 'right' ? user.x - 20 : user.x - 75,
      y: user.y - 48,
      width: 95,
      height: 58
    };

    CombatSystem.executeMeleeAttack(user, hitBox, 1.3, game, { maxTargets: 1, hitsPerTarget: 2, hitDelay: 100 });

    // 쉐도우 파트너 분신 복제: 2타 추가 (총 4연타)
    if (user.hasShadowPartner && user.hasShadowPartner()) {
      SkillRegistry.schedule(user, game, 80, () => {
        const shadowBox = {
          x: user.facing === 'right' ? user.x - 36 : user.x - 59,
          y: user.y - 48,
          width: 95,
          height: 58
        };
        CombatSystem.executeMeleeAttack(user, shadowBox, 0.65, game, { maxTargets: 1, hitsPerTarget: 2, hitDelay: 100 });
      });
    }
    return true;
  }
});

SkillRegistry.register({
  id: 'savage_blow',
  name: '새비지 블로우',
  mpCost: 18,
  dmgMult: 0.8,
  maxLevel: 30,
  icon: '⚔️',
  desc: '시프의 상징! 단검으로 6연속 초고속 절삭 난무! (쉐도우 파트너 시 12연타 대폭발)',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.25;
    window.audio?.playAttack?.();
    game.skillEffects.push({ type: 'savage_blow', x: user.x, y: user.y, facing: user.facing, duration: 0.45, progress: 0 });

    const dir = user.facing === 'right' ? 1 : -1;
    const targets = game.monsters.filter(m => {
      if (!m.isAlive()) return false;
      const inFront = dir > 0 ? (m.x >= user.x - 20 && m.x <= user.x + 130) : (m.x <= user.x + 20 && m.x >= user.x - 130);
      return inFront && Math.abs(m.y - user.y) <= 55;
    });

    // 1. Primary 6-hit Strike
    for (let h = 0; h < 6; h++) {
      SkillRegistry.schedule(user, game, h * 38, () => {
        targets.forEach(m => {
          if (!m.isAlive()) return;
          const { damage, isCrit } = user.getDamage();
          const savageDmg = Math.floor(damage * 0.85);
          m.takeDamage(savageDmg, game, user.x, isCrit);
          game.damageDigits.push(new DamageDigit(m.x + (Math.random() * 20 - 10), m.y - 30 - h * 8, savageDmg, isCrit));
        });
      });
    }

    // 2. Shadow Partner Mirror 6-hit Replication (총 12연타!)
    if (user.hasShadowPartner && user.hasShadowPartner()) {
      for (let h = 0; h < 6; h++) {
        SkillRegistry.schedule(user, game, 80 + h * 38, () => {
          targets.forEach(m => {
            if (!m.isAlive()) return;
            const { damage } = user.getDamage();
            const shadowDmg = Math.max(1, Math.floor(damage * 0.85 * 0.5));
            m.takeDamage(shadowDmg, game, user.x, false);
            game.damageDigits.push(new DamageDigit(m.x + (Math.random() * 20 - 10), m.y - 30 - h * 8 - 4, shadowDmg, false));
          });
        });
      }
    }
    return true;
  }
});

SkillRegistry.register({
  id: 'haste',
  name: '헤이스트',
  mpCost: 12,
  maxLevel: 20,
  icon: '💨',
  isBuffOrMobility: true,
  desc: '이동속도 5.6 & 점프력 극대화!',
  handler: (user, game) => {
    user.buffs.haste = { name: '헤이스트', icon: '💨', permanent: true, isPassive: true, duration: Infinity, maxDuration: Infinity };
    user.walkSpeed = 5.6;
    user.jumpForce = -11.5;
    game.spawnItemText(user.x, user.y - 45, '💨 [헤이스트] 극상의 기동력 상시 적용!');
    if (game.ui?.addChat) game.ui.addChat('system', '💨 [헤이스트] 이동속도 5.6과 점프력이 상시 강화되는 패시브입니다.');
    window.audio?.playFlashJump?.();
    return true;
  }
});

SkillRegistry.register({
  id: 'dark_site',
  name: '다크 사이트',
  mpCost: 8,
  maxLevel: 10,
  icon: '👤',
  isBuffOrMobility: true,
  desc: '투명화 은신! 몬스터 충돌 무시!',
  handler: (user, game) => {
    user.buffs.dark_site = { name: '다크 사이트', icon: '👤', duration: 30, maxDuration: 30 };
    window.audio?.playFlashJump?.();
    game.spawnItemText(user.x, user.y - 45, '👤 [다크 사이트] 투명 은신!');
    if (game.ui?.addChat) game.ui.addChat('system', '👤 [다크 사이트] 그림자 속으로 숨어 30초간 몬스터 충돌 피해를 무시합니다.');
    return true;
  }
});

SkillRegistry.register({
  id: 'shadow_partner',
  name: '쉐도우 파트너',
  mpCost: 24,
  maxLevel: 30,
  icon: '👥',
  isBuffOrMobility: true,
  desc: '붉은 그림자 분신 소환! 모든 공격 및 투사체 2배 복제 난무!',
  handler: (user, game) => {
    user.buffs.shadow_partner = { name: '쉐도우 파트너', icon: '👥', permanent: true, isPassive: true, duration: Infinity, maxDuration: Infinity };
    window.audio?.playFlashJump?.();
    game.spawnItemText(user.x, user.y - 45, '👥 [쉐도우 파트너] 그림자 분신 2배 복제 활성화!');
    if (game.ui?.addChat) game.ui.addChat('system', '👥 [쉐도우 파트너] 붉은 그림자 분신이 상시 동행하여 표창/단검의 모든 공격을 시차를 두고 50% 추가 복제합니다.');
    return true;
  }
});

// ★ 어벤저 (Avenger) - 최대 6체 일렬 관통 거대 수리검 & 쉐도우 파트너 2단 관통 난무!
SkillRegistry.register({
  id: 'avenger',
  name: '어벤저',
  mpCost: 18,
  dmgMult: 2.1,
  maxLevel: 30,
  icon: '🌀',
  desc: '거대한 회전 수리검을 던져 최대 6마리의 적을 일렬로 관통! (분신 동시 시전)',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.15;
    window.audio?.playAttack?.();
    const aim = user.attackAim, facing = user.facing;
    const { damage, isCrit } = user.getDamage();
    const activeStar = user.activeStar || 'steely';

    // 1. Primary Avenger Giant Star (Pierce max 6 enemies)
    SkillRegistry.fireProjectile(user, game, {
      type: 'avenger_star',
      speed: 560,
      range: 580,
      offsetX: 20,
      damage: Math.floor(damage * 2.1),
      isCrit: isCrit,
      starType: activeStar,
      pierce: true,
      maxTargets: 6
    }, aim, facing);

    // 2. Shadow Partner Mirror Avenger Star (Pierce max 6 enemies, 50% dmg)
    if (user.hasShadowPartner && user.hasShadowPartner()) {
      SkillRegistry.schedule(user, game, 80, () => {
        const { damage: shadowBase } = user.getDamage();
        SkillRegistry.fireProjectile(user, game, {
          type: 'avenger_star',
          speed: 560,
          range: 580,
          offsetX: facing === 'right' ? -14 : 14,
          offsetY: -14,
          damage: Math.max(1, Math.floor(shadowBase * 2.1 * 0.5)),
          isCrit: false,
          starType: activeStar,
          pierce: true,
          maxTargets: 6,
          isShadow: true
        }, aim, facing);
      });
    }

    game.spawnItemText(user.x, user.y - 45, '🌀 [어벤저] 거대 수리검 6체 일렬 관통!');
    return true;
  }
});

// ★ 드레인 (Drain) - 어쌔신 핵심 흡혈 표창 투척기
SkillRegistry.register({
  id: 'drain',
  name: '드레인',
  mpCost: 14,
  dmgMult: 1.8,
  maxLevel: 30,
  icon: '🩸',
  desc: '표창으로 적을 타격하고 가한 피해량의 45%를 체력으로 흡혈!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.05;
    window.audio?.playAttack?.();
    const aim = user.attackAim, facing = user.facing;
    const { damage, isCrit } = user.getDamage();
    const activeStar = user.activeStar || 'steely';

    // 1. Primary Drain Shuriken
    SkillRegistry.fireProjectile(user, game, {
      type: 'shuriken',
      speed: 620,
      range: 520,
      offsetX: 18,
      damage: Math.floor(damage * 1.8),
      isCrit: isCrit,
      starType: activeStar,
      drainRate: 0.45
    }, aim, facing);

    // 2. Shadow Partner Mirror Drain
    if (user.hasShadowPartner && user.hasShadowPartner()) {
      SkillRegistry.schedule(user, game, 80, () => {
        const { damage: shadowBase } = user.getDamage();
        SkillRegistry.fireProjectile(user, game, {
          type: 'shuriken',
          speed: 620,
          range: 520,
          offsetX: facing === 'right' ? -14 : 14,
          offsetY: -14,
          damage: Math.max(1, Math.floor(shadowBase * 1.8 * 0.5)),
          isCrit: false,
          starType: activeStar,
          isShadow: true,
          drainRate: 0.45
        }, aim, facing);
      });
    }

    game.spawnItemText(user.x, user.y - 45, '🩸 [드레인] 흡혈 표창 투척!');
    return true;
  }
});

// ★ 쉐도우 웹 (Shadow Web) - 3차 허밋 핵심 적 다수 속박기
SkillRegistry.register({
  id: 'shadow_web',
  name: '쉐도우 웹',
  mpCost: 16,
  dmgMult: 1.2,
  maxLevel: 20,
  icon: '🕸️',
  desc: '그림자 거미줄로 전방 최대 6체의 적을 5초간 제자리에 속박!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.1;
    window.audio?.playFlashJump?.();

    const dir = user.facing === 'right' ? 1 : -1;
    const targets = game.monsters.filter(m => {
      if (!m.isAlive()) return false;
      const inFront = dir > 0 ? (m.x >= user.x && m.x <= user.x + 280) : (m.x <= user.x && m.x >= user.x - 280);
      return inFront && Math.abs(m.y - user.y) <= 60;
    }).slice(0, 6);

    targets.forEach(m => {
      m.snaredTimer = 5.0; // 5초간 이동 정지 속박
      const { damage, isCrit } = user.getDamage();
      const webDmg = Math.floor(damage * 1.2);
      m.takeDamage(webDmg, game, user.x, isCrit);
      game.damageDigits.push(new DamageDigit(m.x, m.y - 30, webDmg, isCrit));
      game.skillEffects.push({ type: 'shadow_web', x: m.x, y: m.y - 15, duration: 0.8, progress: 0 });
    });

    game.spawnItemText(user.x, user.y - 45, '🕸️ [쉐도우 웹] 그림자 거미줄 속박!');
    return true;
  }
});

window.Skill = Skill;
window.SkillRegistry = SkillRegistry;

// ==========================================
// ★ 6대 전 직업군 클래식 핵심 스킬 전수 구현 ★
// ==========================================

// --- [WARRIOR] 콤보/차지/용기사 핵심기 ---

SkillRegistry.register({
  id: 'panic',
  name: '패닉',
  mpCost: 20,
  dmgMult: 3.5,
  maxLevel: 30,
  icon: '💥',
  desc: '콤보 구슬을 소모하여 적 하나에게 치명타와 암흑 부여!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.1;
    window.audio?.playAttack?.();
    const hitBox = { x: user.facing === 'right' ? user.x - 10 : user.x - 90, y: user.y - 48, width: 100, height: 60 };
    CombatSystem.executeMeleeAttack(user, hitBox, 3.5, game, { maxTargets: 1, hitsPerTarget: 1 });
    game.shakeTimer = 0.25; game.shakeMagnitude = 4;
    game.spawnItemText(user.x, user.y - 45, '💥 [패닉] 치명적 암흑 일격 작렬!');
    return true;
  }
});

SkillRegistry.register({
  id: 'coma',
  name: '코마',
  mpCost: 22,
  dmgMult: 2.2,
  maxLevel: 30,
  icon: '💫',
  desc: '콤보 구슬을 소모하여 최대 6체의 적에게 광역 기절 폭발!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.15;
    window.audio?.playAttack?.();
    const hitBox = { x: user.x - 80, y: user.y - 50, width: 160, height: 65 };
    CombatSystem.executeMeleeAttack(user, hitBox, 2.2, game, { maxTargets: 6, hitsPerTarget: 1 });
    game.shakeTimer = 0.3; game.shakeMagnitude = 5;
    game.spawnItemText(user.x, user.y - 45, '💫 [코마] 6체 광역 기절 폭발!');
    return true;
  }
});

SkillRegistry.register({
  id: 'elemental_charge',
  name: '속성 차지',
  mpCost: 25,
  maxLevel: 30,
  icon: '⚡',
  isBuffOrMobility: true,
  desc: '무기에 화/수/전/성 4대 원소를 인챈트하여 약점 1.5배 증폭!',
  handler: (user, game) => {
    user.buffs.elemental_charge = { name: '속성 차지', icon: '⚡', permanent: true, isPassive: true };
    user.weaponElement = 'holy';
    window.audio?.playFlashJump?.();
    game.spawnItemText(user.x, user.y - 45, '⚡ [속성 차지] 성스러운 원소 인챈트 활성화!');
    return true;
  }
});

SkillRegistry.register({
  id: 'charge_blow',
  name: '차지 블로우',
  mpCost: 18,
  dmgMult: 2.5,
  maxLevel: 30,
  icon: '🔨',
  desc: '차지된 원소의 힘을 일거에 방출하여 6마리 강타!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.1;
    window.audio?.playAttack?.();
    const hitBox = { x: user.facing === 'right' ? user.x - 15 : user.x - 115, y: user.y - 50, width: 130, height: 60 };
    CombatSystem.executeMeleeAttack(user, hitBox, 2.5, game, { maxTargets: 6, hitsPerTarget: 1 });
    return true;
  }
});

SkillRegistry.register({
  id: 'dragon_buster',
  name: '드래곤 버스터',
  mpCost: 16,
  dmgMult: 1.7,
  maxLevel: 30,
  icon: '🔱',
  desc: '창 끝으로 전방 3마리의 적을 초고속 3연속 찌르기!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.15;
    window.audio?.playAttack?.();
    const hitBox = { x: user.facing === 'right' ? user.x - 15 : user.x - 135, y: user.y - 48, width: 150, height: 55 };
    for (let h = 0; h < 3; h++) {
      SkillRegistry.schedule(user, game, h * 42, () => {
        CombatSystem.executeMeleeAttack(user, hitBox, 1.7, game, { maxTargets: 3, hitsPerTarget: 1 });
      });
    }
    return true;
  }
});

SkillRegistry.register({
  id: 'dragon_thresher',
  name: '드래곤 쓰레셔',
  mpCost: 18,
  dmgMult: 2.4,
  maxLevel: 30,
  icon: '🌪️',
  desc: '폴암을 크게 휘둘러 6체의 적을 관통 넉백!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.2;
    window.audio?.playAttack?.();
    const hitBox = { x: user.facing === 'right' ? user.x - 20 : user.x - 160, y: user.y - 52, width: 180, height: 65 };
    CombatSystem.executeMeleeAttack(user, hitBox, 2.4, game, { maxTargets: 6, hitsPerTarget: 1 });
    return true;
  }
});

SkillRegistry.register({
  id: 'dragon_roar',
  name: '드래곤 로어',
  mpCost: 35,
  hpCost: 30,
  dmgMult: 2.6,
  maxLevel: 30,
  icon: '🐉',
  desc: '체력을 소모하여 전 화면에 용의 포효 작렬 및 3초 스턴!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.4;
    window.audio?.playAttack?.();
    CombatSystem.executeFullMapUltimate(user, 'dragon_roar', 15, 2.6, game);
    game.spawnItemText(user.x, user.y - 45, '🐉 [드래곤 로어] 전 화면 용의 포효!');
    return true;
  }
});

SkillRegistry.register({
  id: 'sanctuary',
  name: '생츄어리',
  mpCost: 50,
  dmgMult: 3.8,
  maxLevel: 30,
  icon: '✝️',
  desc: '거대한 신성 망치를 지면에 내리꽂아 전 화면 15체 궤멸!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.4;
    window.audio?.playAttack?.();
    CombatSystem.executeFullMapUltimate(user, 'sanctuary', 15, 3.8, game);
    game.spawnItemText(user.x, user.y - 45, '✝️ [생츄어리] 신의 심판 망치 낙하!');
    return true;
  }
});

SkillRegistry.register({
  id: 'berserk',
  name: '버서크',
  maxLevel: 30,
  icon: '🩸',
  isBuffOrMobility: true,
  desc: '체력 50% 이하 유지 시 공격력 2.1배 폭증 상시 패시브',
  handler: (user, game) => {
    user.buffs.berserk = { name: '버서크', icon: '🩸', permanent: true, isPassive: true };
    game.spawnItemText(user.x, user.y - 45, '🩸 [버서크] 광전사의 피 각성!');
    return true;
  }
});

// --- [MAGICIAN] 썬콜/불독/비숍 원소 및 광역 궁극기 ---

SkillRegistry.register({
  id: 'cold_beam',
  name: '콜드 빔',
  mpCost: 16,
  dmgMult: 2.2,
  maxLevel: 30,
  icon: '❄️',
  desc: '수빙 기둥을 낙하시켜 단일 적 확정 3.5초 동결 타격!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration;
    window.audio?.playAttack?.();
    const hitBox = { x: user.facing === 'right' ? user.x : user.x - 220, y: user.y - 60, width: 220, height: 70 };
    CombatSystem.executeMeleeAttack(user, hitBox, 2.2, game, { maxTargets: 1, hitsPerTarget: 1 });
    return true;
  }
});

SkillRegistry.register({
  id: 'ice_strike',
  name: '아이스 스트라이크',
  mpCost: 26,
  dmgMult: 2.1,
  maxLevel: 30,
  icon: '🧊',
  desc: '지면에서 거대한 빙산 폭발을 일으켜 6체 동결 광역기!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.15;
    window.audio?.playAttack?.();
    const hitBox = { x: user.x - 140, y: user.y - 70, width: 280, height: 80 };
    CombatSystem.executeMeleeAttack(user, hitBox, 2.1, game, { maxTargets: 6, hitsPerTarget: 1 });
    game.skillEffects.push({ type: 'ice_strike', x: user.x, y: user.y, duration: 0.45, progress: 0 });
    return true;
  }
});

SkillRegistry.register({
  id: 'chain_lightning',
  name: '체인 라이트닝',
  mpCost: 28,
  dmgMult: 2.4,
  maxLevel: 30,
  icon: '⚡',
  desc: '첫 적 적중 후 주변 5체로 번개가 연쇄 전이되는 전설의 마법!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.1;
    window.audio?.playAttack?.();
    CombatSystem.executeChainLightning(user, 5, 2.4, game);
    return true;
  }
});

SkillRegistry.register({
  id: 'poison_mist',
  name: '포이즌 미스트',
  mpCost: 30,
  dmgMult: 1.5,
  maxLevel: 30,
  icon: '🧪',
  desc: '필드에 거대한 독안개를 살포하여 몬스터 체력을 고갈!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.1;
    window.audio?.playFlashJump?.();
    const hitBox = { x: user.x - 130, y: user.y - 60, width: 260, height: 70 };
    CombatSystem.executeMeleeAttack(user, hitBox, 1.5, game, { maxTargets: 8, hitsPerTarget: 1 });
    game.skillEffects.push({ type: 'poison_mist', x: user.x, y: user.y, duration: 1.2, progress: 0 });
    game.spawnItemText(user.x, user.y - 45, '🧪 [포이즌 미스트] 맹독 안개 살포!');
    return true;
  }
});

SkillRegistry.register({
  id: 'paralyze',
  name: '페럴라이즈',
  mpCost: 24,
  dmgMult: 1.8,
  maxLevel: 30,
  icon: '🐍',
  desc: '독화염 복합 속성 4연타 공격 및 마비!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.15;
    window.audio?.playAttack?.();
    const hitBox = { x: user.facing === 'right' ? user.x : user.x - 180, y: user.y - 50, width: 180, height: 60 };
    for (let h = 0; h < 4; h++) {
      SkillRegistry.schedule(user, game, h * 45, () => {
        CombatSystem.executeMeleeAttack(user, hitBox, 1.8, game, { maxTargets: 1, hitsPerTarget: 1 });
      });
    }
    return true;
  }
});

SkillRegistry.register({
  id: 'meteor',
  name: '메테오',
  mpCost: 55,
  dmgMult: 3.6,
  maxLevel: 30,
  icon: '☄️',
  desc: '하늘에서 거대 운석군이 낙하하는 불·독 궁극 광역기!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.4;
    window.audio?.playAttack?.();
    CombatSystem.executeFullMapUltimate(user, 'meteor', 15, 3.6, game);
    game.spawnItemText(user.x, user.y - 45, '☄️ [메테오] 거대 운석군 지면 강타!');
    return true;
  }
});

SkillRegistry.register({
  id: 'blizzard',
  name: '블리자드',
  mpCost: 55,
  dmgMult: 3.6,
  maxLevel: 30,
  icon: '🌨️',
  desc: '전 화면을 절대영도로 얼려버리는 썬·콜 궁극 광역기!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.4;
    window.audio?.playAttack?.();
    CombatSystem.executeFullMapUltimate(user, 'blizzard', 15, 3.6, game);
    game.spawnItemText(user.x, user.y - 45, '🌨️ [블리자드] 절대영도 눈보라 쇄도!');
    return true;
  }
});

SkillRegistry.register({
  id: 'shining_ray',
  name: '샤이닝 레이',
  mpCost: 24,
  dmgMult: 2.3,
  maxLevel: 30,
  icon: '✨',
  desc: '성스러운 빛의 기둥을 내려꽂아 최대 6체를 타격하고 기절!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.1;
    window.audio?.playAttack?.();
    const hitBox = { x: user.x - 120, y: user.y - 65, width: 240, height: 75 };
    CombatSystem.executeMeleeAttack(user, hitBox, 2.3, game, { maxTargets: 6, hitsPerTarget: 1 });
    return true;
  }
});

// --- [BOWMAN] 석궁 관통 / 폭풍의 시 / 샤프아이즈 ---

SkillRegistry.register({
  id: 'iron_arrow',
  name: '아이언 애로우',
  mpCost: 16,
  dmgMult: 1.8,
  maxLevel: 30,
  icon: '🏹',
  desc: '강철 화살로 최대 6마리의 적을 일렬로 관통!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.05;
    window.audio?.playAttack?.();
    const aim = user.attackAim, facing = user.facing;
    const { damage, isCrit } = user.getDamage();
    SkillRegistry.fireProjectile(user, game, {
      type: 'iron_arrow',
      speed: 640,
      range: 580,
      offsetX: 20,
      damage: Math.floor(damage * 1.8),
      isCrit: isCrit,
      pierce: true,
      maxTargets: 6
    }, aim, facing);
    game.spawnItemText(user.x, user.y - 45, '🏹 [아이언 애로우] 6체 일렬 관통!');
    return true;
  }
});

SkillRegistry.register({
  id: 'piercing',
  name: '피어싱',
  mpCost: 26,
  dmgMult: 2.0,
  maxLevel: 30,
  icon: '🎯',
  desc: '관통할 때마다 대미지가 1.2배씩 폭증하는 신궁의 관통포!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.2;
    window.audio?.playAttack?.();
    const aim = user.attackAim, facing = user.facing;
    const { damage, isCrit } = user.getDamage();
    SkillRegistry.fireProjectile(user, game, {
      type: 'piercing_arrow',
      speed: 680,
      range: 640,
      offsetX: 22,
      damage: Math.floor(damage * 2.0),
      isCrit: isCrit,
      pierce: true,
      maxTargets: 6,
      pierceScale: 1.2
    }, aim, facing);
    game.spawnItemText(user.x, user.y - 45, '🎯 [피어싱] 관통 증폭포 발사!');
    return true;
  }
});

SkillRegistry.register({
  id: 'sniping',
  name: '스나이핑',
  mpCost: 35,
  dmgMult: 10.0,
  maxLevel: 30,
  icon: '👁️',
  desc: '일반 몬스터 100% 즉사 판정, 보스에게 극딜을 꽂는 일격필살 저격!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.3;
    window.audio?.playAttack?.();
    const aim = user.attackAim, facing = user.facing;
    const { damage } = user.getDamage();
    SkillRegistry.fireProjectile(user, game, {
      type: 'sniper_bullet',
      speed: 850,
      range: 700,
      offsetX: 24,
      damage: Math.max(99999, damage * 10),
      isCrit: true,
      pierce: false,
      maxTargets: 1
    }, aim, facing);
    game.shakeTimer = 0.35; game.shakeMagnitude = 6;
    game.spawnItemText(user.x, user.y - 45, '👁️ [스나이핑] 일격필살 저격 작렬!');
    return true;
  }
});

SkillRegistry.register({
  id: 'arrow_rain',
  name: '에로우 레인',
  mpCost: 22,
  dmgMult: 1.9,
  maxLevel: 30,
  icon: '🌧️',
  desc: '하늘 높이 화살을 쏘아 올려 머리 위로 화살비를 쏟아붓는 광역기!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.15;
    window.audio?.playAttack?.();
    const hitBox = { x: user.x - 150, y: user.y - 80, width: 300, height: 90 };
    CombatSystem.executeMeleeAttack(user, hitBox, 1.9, game, { maxTargets: 6, hitsPerTarget: 1 });
    game.skillEffects.push({ type: 'arrow_rain', x: user.x, y: user.y, duration: 0.5, progress: 0 });
    return true;
  }
});

SkillRegistry.register({
  id: 'sharp_eyes',
  name: '샤프 아이즈',
  maxLevel: 30,
  icon: '🦅',
  isBuffOrMobility: true,
  desc: '크리티컬 확률 +15%, 크리티컬 최대 대미지 +40% 상시 패시브',
  handler: (user, game) => {
    user.buffs.sharp_eyes = { name: '샤프 아이즈', icon: '🦅', permanent: true, isPassive: true };
    user.bonusCritRate = 0.15;
    user.bonusCritDamage = 0.40;
    game.spawnItemText(user.x, user.y - 45, '🦅 [샤프 아이즈] 매의 눈 각성!');
    return true;
  }
});

// --- [THIEF] 트리플스로우 / 메소익스플로전 / 부메랑스텝 / 암살 ---

SkillRegistry.register({
  id: 'triple_throw',
  name: '트리플 스로우',
  mpCost: 20,
  dmgMult: 2.0,
  maxLevel: 30,
  icon: '⭐⭐⭐',
  desc: '표창 3발을 연속 투척! (분신 연동 시 총 6발 난사)',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.15;
    window.audio?.playAttack?.();
    const aim = user.attackAim, facing = user.facing;
    const activeStar = user.activeStar || 'steely';

    for (let s = 0; s < 3; s++) {
      SkillRegistry.schedule(user, game, s * 60, () => {
        const { damage, isCrit } = user.getDamage();
        SkillRegistry.fireProjectile(user, game, {
          type: 'shuriken',
          speed: 620,
          range: 520,
          offsetX: 18,
          damage: Math.floor(damage * 2.0),
          isCrit: isCrit || s === 0,
          starType: activeStar
        }, aim, facing);
      });
    }

    if (user.hasShadowPartner && user.hasShadowPartner()) {
      for (let s = 0; s < 3; s++) {
        SkillRegistry.schedule(user, game, 80 + s * 60, () => {
          const { damage: shadowDmg } = user.getDamage();
          SkillRegistry.fireProjectile(user, game, {
            type: 'shuriken',
            speed: 620,
            range: 520,
            offsetX: facing === 'right' ? -14 : 14,
            damage: Math.max(1, Math.floor(shadowDmg * 2.0 * 0.5)),
            isCrit: false,
            starType: activeStar,
            isShadow: true
          }, aim, facing);
        });
      }
    }
    return true;
  }
});

SkillRegistry.register({
  id: 'meso_explosion',
  name: '메소 익스플로전',
  mpCost: 25,
  dmgMult: 1.6,
  maxLevel: 30,
  icon: '💰',
  desc: '바닥에 드롭된 동전을 일거에 연쇄 폭파시켜 방어 무시 초토화!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.1;
    window.audio?.playAttack?.();
    CombatSystem.executeMesoExplosion(user, 340, 12, 1.6, game);
    return true;
  }
});

SkillRegistry.register({
  id: 'meso_guard',
  name: '메소 가드',
  maxLevel: 20,
  icon: '🪙',
  isBuffOrMobility: true,
  desc: '피격 피해의 50%를 메소로 대체 감쇄하는 상시 패시브',
  handler: (user, game) => {
    user.buffs.meso_guard = { name: '메소 가드', icon: '🪙', permanent: true, isPassive: true };
    game.spawnItemText(user.x, user.y - 45, '🪙 [메소 가드] 동전 방어막 상시 가동!');
    return true;
  }
});

SkillRegistry.register({
  id: 'boomerang_step',
  name: '부메랑 스텝',
  mpCost: 26,
  dmgMult: 2.8,
  maxLevel: 30,
  icon: '🪃',
  desc: '전방 4체의 적을 순간이동하며 X자 난무 후 100% 기절!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.25;
    window.audio?.playAttack?.();
    const hitBox = { x: user.facing === 'right' ? user.x : user.x - 160, y: user.y - 50, width: 160, height: 60 };
    CombatSystem.executeMeleeAttack(user, hitBox, 2.8, game, { maxTargets: 4, hitsPerTarget: 2, hitDelay: 80 });
    game.skillEffects.push({ type: 'boomerang_step', x: user.x, y: user.y, duration: 0.45, progress: 0 });
    return true;
  }
});

SkillRegistry.register({
  id: 'assassinate',
  name: '암살',
  mpCost: 30,
  dmgMult: 2.5,
  maxLevel: 30,
  icon: '🗡️',
  desc: '은신 상태에서 4연속 찌르기 후 마지막 일격 대폭발!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.35;
    window.audio?.playAttack?.();
    const hitBox = { x: user.facing === 'right' ? user.x - 10 : user.x - 110, y: user.y - 48, width: 110, height: 55 };
    for (let h = 0; h < 4; h++) {
      SkillRegistry.schedule(user, game, h * 50, () => {
        CombatSystem.executeMeleeAttack(user, hitBox, 2.5, game, { maxTargets: 1, hitsPerTarget: 1 });
      });
    }
    SkillRegistry.schedule(user, game, 250, () => {
      CombatSystem.executeMeleeAttack(user, hitBox, 4.2, game, { maxTargets: 1, hitsPerTarget: 1 });
      game.shakeTimer = 0.3; game.shakeMagnitude = 5;
    });
    return true;
  }
});

// --- [PIRATE] 체술 킥/총기 난사/영룡/전함 배틀쉽 ---

SkillRegistry.register({
  id: 'somersault_kick',
  name: '써머솔트킥',
  mpCost: 12,
  dmgMult: 2.1,
  maxLevel: 20,
  icon: '🦵',
  desc: '공중제비를 돌며 전방 3마리의 적을 걷어차는 범위기!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 0.95;
    window.audio?.playAttack?.();
    const hitBox = { x: user.facing === 'right' ? user.x - 10 : user.x - 110, y: user.y - 50, width: 110, height: 60 };
    CombatSystem.executeMeleeAttack(user, hitBox, 2.1, game, { maxTargets: 3, hitsPerTarget: 1 });
    return true;
  }
});

SkillRegistry.register({
  id: 'double_fire',
  name: '더블 파이어',
  mpCost: 8,
  dmgMult: 1.5,
  maxLevel: 20,
  icon: '🔫',
  desc: '쌍권총으로 2발의 총탄을 속사!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 0.9;
    window.audio?.playAttack?.();
    const aim = user.attackAim, facing = user.facing;
    const { damage, isCrit } = user.getDamage();
    for (let s = 0; s < 2; s++) {
      SkillRegistry.schedule(user, game, s * 65, () => {
        SkillRegistry.fireProjectile(user, game, {
          type: 'bullet',
          speed: 680,
          range: 520,
          offsetX: 18,
          damage: Math.floor(damage * 1.5),
          isCrit: isCrit
        }, aim, facing);
      });
    }
    return true;
  }
});

SkillRegistry.register({
  id: 'backspin_blow',
  name: '백스핀블로우',
  mpCost: 16,
  dmgMult: 2.2,
  maxLevel: 20,
  icon: '💫',
  desc: '뒤돌아 팔꿈치로 강타하여 3체의 적을 넉백 및 기절!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.05;
    window.audio?.playAttack?.();
    const hitBox = { x: user.facing === 'right' ? user.x - 15 : user.x - 115, y: user.y - 48, width: 115, height: 55 };
    CombatSystem.executeMeleeAttack(user, hitBox, 2.2, game, { maxTargets: 3, hitsPerTarget: 1 });
    return true;
  }
});

SkillRegistry.register({
  id: 'energy_buster',
  name: '에너지 버스터',
  mpCost: 20,
  dmgMult: 2.6,
  maxLevel: 30,
  icon: '💥',
  desc: '기공 아우라를 완충 방출하여 4체를 관통 타격!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.15;
    window.audio?.playAttack?.();
    const aim = user.attackAim, facing = user.facing;
    const { damage, isCrit } = user.getDamage();
    SkillRegistry.fireProjectile(user, game, {
      type: 'energy_blast',
      speed: 600,
      range: 440,
      offsetX: 20,
      damage: Math.floor(damage * 2.6),
      isCrit: isCrit,
      pierce: true,
      maxTargets: 4
    }, aim, facing);
    return true;
  }
});

SkillRegistry.register({
  id: 'transform',
  name: '트랜스폼',
  mpCost: 30,
  maxLevel: 20,
  icon: '⚡',
  isBuffOrMobility: true,
  desc: '초사이언 형태로 변신하여 스탠스 100% 및 능력치 폭증!',
  handler: (user, game) => {
    user.buffs.transform = { name: '트랜스폼', icon: '⚡', permanent: true, isPassive: true };
    game.spawnItemText(user.x, user.y - 45, '⚡ [트랜스폼] 마인 초사이언 각성!');
    return true;
  }
});

SkillRegistry.register({
  id: 'dragon_strike',
  name: '드래곤 스트라이크',
  mpCost: 35,
  dmgMult: 3.1,
  maxLevel: 30,
  icon: '🐲',
  desc: '거대 영룡을 소환하여 전방 지면을 통째로 붕괴시키는 광역기!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.35;
    window.audio?.playAttack?.();
    const hitBox = { x: user.facing === 'right' ? user.x : user.x - 300, y: user.y - 70, width: 300, height: 90 };
    CombatSystem.executeMeleeAttack(user, hitBox, 3.1, game, { maxTargets: 6, hitsPerTarget: 2, hitDelay: 70 });
    game.shakeTimer = 0.4; game.shakeMagnitude = 6;
    game.spawnItemText(user.x, user.y - 45, '🐲 [드래곤 스트라이크] 영룡 지면 붕괴 작렬!');
    return true;
  }
});

SkillRegistry.register({
  id: 'time_leap',
  name: '타임 리프',
  mpCost: 40,
  maxLevel: 30,
  icon: '⏳',
  isBuffOrMobility: true,
  desc: '파티원 전체의 모든 스킬 쿨타임을 즉시 0초로 초기화!',
  handler: (user, game) => {
    user.skillCooldowns = {};
    window.audio?.playFlashJump?.();
    game.spawnItemText(user.x, user.y - 45, '⏳ [타임 리프] 모든 스킬 쿨타임 초기화!');
    return true;
  }
});

SkillRegistry.register({
  id: 'rapid_fire',
  name: '래피드 파이어',
  mpCost: 6,
  dmgMult: 1.6,
  maxLevel: 30,
  icon: '🔥',
  desc: '쌍권총을 들고 초당 8.3발의 총탄을 머신건처럼 난사!',
  handler: (user, game) => {
    user.attackTimer = 0.12;
    window.audio?.playAttack?.();
    const aim = user.attackAim, facing = user.facing;
    const { damage, isCrit } = user.getDamage();
    SkillRegistry.fireProjectile(user, game, {
      type: 'bullet',
      speed: 720,
      range: 560,
      offsetX: 20,
      damage: Math.floor(damage * 1.6),
      isCrit: isCrit
    }, aim, facing);
    return true;
  }
});

SkillRegistry.register({
  id: 'battleship',
  name: '배틀쉽 캐논',
  mpCost: 28,
  dmgMult: 2.8,
  maxLevel: 30,
  icon: '🚢',
  desc: '비행 전함에 탑승하여 4연속 함포 포격을 난사!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.2;
    window.audio?.playAttack?.();
    const aim = user.attackAim, facing = user.facing;
    for (let c = 0; c < 4; c++) {
      SkillRegistry.schedule(user, game, c * 55, () => {
        const { damage, isCrit } = user.getDamage();
        SkillRegistry.fireProjectile(user, game, {
          type: 'cannonball',
          speed: 620,
          range: 580,
          offsetX: 24,
          damage: Math.floor(damage * 2.8),
          isCrit: isCrit
        }, aim, facing);
      });
    }
    game.shakeTimer = 0.3; game.shakeMagnitude = 5;
    return true;
  }
});
