// js/skills.js - Skill Strategy Pattern & SkillRegistry adhering to SOLID (SRP & OCP)

class Skill {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.mpCost = config.mpCost || 0;
    this.hpCost = config.hpCost || 0;
    this.dmgMult = config.dmgMult || 1.0;
    this.icon = config.icon || '⚔️';
    this.desc = config.desc || '';
    this.isBuffOrMobility = config.isBuffOrMobility || false;
    this.maxLevel = config.maxLevel || 20;
    this.handler = config.handler;
  }

  canCast(user) {
    if (user.hp <= 0 || user.onLadder) return false;
    if (this.id === 'flash_jump' && user.weakenedTimer > 0) return false;
    const isPrimary = Boolean(user.getPrimarySkillId && user.getPrimarySkillId() === this.id);
    if (!isPrimary && this.mpCost > 0 && user.mp < this.mpCost) return false;
    if (this.hpCost > 0 && user.hp <= this.hpCost) return false;
    if (!this.isBuffOrMobility && user.attackTimer > 0) return false;
    return true;
  }

  consumeCosts(user) {
    const isPrimary = Boolean(user.getPrimarySkillId && user.getPrimarySkillId() === this.id);
    if (!isPrimary && this.mpCost > 0) {
      user.mp = Math.max(0, user.mp - this.mpCost);
    }
    if (this.hpCost > 0) user.hp -= this.hpCost;
  }

  execute(user, game, skillInstance) {
    if (!this.canCast(user)) return false;
    this.consumeCosts(user);
    return this.handler(user, game, skillInstance, this);
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
    const dirSign = user.facing === 'right' ? 1 : -1;
    const shellDmg = 40 + (skillData?.level || 1) * 20;
    game.projectiles.push(new Projectile(user.x + dirSign * 16, user.y - 14, dirSign * 480, 0, 'snail_shell', shellDmg, true, user));
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
    user.buffs.iron_body = { name: '아이언 바디', icon: '🛡️', duration: 60, maxDuration: 60 };
    user.calcDerivedStats();
    game.spawnItemText(user.x, user.y - 45, '🛡️ [아이언 바디] 방어력 +25!');
    if (game.ui?.addChat) game.ui.addChat('system', '🛡️ [아이언 바디] 단단한 신체로 방어력이 25 증가했습니다.');
    window.audio.playLevelUp();
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
    user.buffs.rage = { name: '분노', icon: '🔥', duration: 60, maxDuration: 60 };
    user.calcDerivedStats();
    window.audio.playLevelUp();
    game.spawnItemText(user.x, user.y - 45, '🔥 [분노] 공격력 +35 대폭 증가!');
    if (game.ui?.addChat) game.ui.addChat('system', '🔥 [분노] 전사의 투지가 불타올라 60초간 공격력이 35 상승했습니다.');
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
    user.buffs.combo_attack = { name: '콤보 어택', icon: '🔮', duration: 60, maxDuration: 60 };
    user.comboCount = 1;
    user.calcDerivedStats();
    window.audio.playLevelUp();
    game.spawnItemText(user.x, user.y - 45, '🔮 [콤보 어택] 활성화!');
    if (game.ui?.addChat) game.ui.addChat('system', '🔮 [콤보 어택] 타격마다 콤보 구슬이 모여 공격력이 증폭됩니다.');
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
    const dirSign = user.facing === 'right' ? 1 : -1;
    const { damage, isCrit } = user.getDamage();
    game.projectiles.push(new Projectile(user.x + dirSign * 16, user.y - 16, dirSign * 440, 0, 'energy_bolt', Math.floor(damage * 1.4), isCrit, user));
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
  desc: '바라보는 방향으로 즉시 순간이동',
  handler: (user, game) => {
    const dirSign = user.facing === 'right' ? 1 : -1;
    const wasGrounded = user.onGround;
    const previousY = user.y;
    const halfWidth = (user.width || 24) / 2;
    const map = game.map;
    user.x = Math.max(halfWidth, Math.min(map.width - halfWidth, user.x + dirSign * 130));
    user.onLadder = false;
    user.currentLadder = null;
    const destination = wasGrounded ? map.findFootholdNear(user.x, previousY, 16) : null;
    user.currentFoothold = destination;
    user.onGround = Boolean(destination);
    if (destination) {
      user.y = destination.getYAtX(user.x);
      user.vy = 0;
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
    user.buffs.magic_guard = { name: '매직 가드', icon: '💎', duration: 60, maxDuration: 60 };
    window.audio.playLevelUp();
    game.spawnItemText(user.x, user.y - 45, '💎 [매직 가드] 피해 80% MP 흡수!');
    if (game.ui?.addChat) game.ui.addChat('system', '💎 [매직 가드] 60초간 피격 피해의 80%를 MP로 대신 흡수합니다.');
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
    user.buffs.holy_symbol = { name: '홀리 심볼', icon: '🕊️', duration: 60, maxDuration: 60 };
    user.healHp(150);
    window.audio.playLevelUp();
    game.spawnItemText(user.x, user.y - 45, '🕊️ [홀리 심볼] 경험치 +50% 버프!');
    if (game.ui?.addChat) game.ui.addChat('system', '🕊️ [홀리 심볼] 성스러운 은총으로 60초간 획득 경험치가 1.5배 증가합니다.');
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
    const dirSign = user.facing === 'right' ? 1 : -1;
    const { damage } = user.getDamage();
    game.projectiles.push(new Projectile(user.x + dirSign * 16, user.y - 16, dirSign * 520, 0, 'arrow', Math.floor(damage * 1.8), true, user));
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
    const dirSign = user.facing === 'right' ? 1 : -1;
    for (let s = 0; s < 2; s++) {
      setTimeout(() => {
        const { damage, isCrit } = user.getDamage();
        game.projectiles.push(new Projectile(user.x + dirSign * 16, user.y - 16, dirSign * 500, 0, 'arrow', Math.floor(damage * 1.25), isCrit, user));
      }, s * 140);
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
    user.buffs.focus = { name: '포커스', icon: '👁️', duration: 60, maxDuration: 60 };
    user.calcDerivedStats();
    user.walkSpeed = Math.min(5.5, user.walkSpeed + 0.6);
    game.spawnItemText(user.x, user.y - 45, '👁️ [포커스] 명중/이속 증가!');
    if (game.ui?.addChat) game.ui.addChat('system', '👁️ [포커스] 정신을 집중하여 명중률과 이동속도가 상승했습니다.');
    window.audio.playLevelUp();
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
    user.buffs.soul_arrow = { name: '소울 애로우', icon: '✨', duration: 60, maxDuration: 60 };
    user.calcDerivedStats();
    window.audio.playLevelUp();
    game.spawnItemText(user.x, user.y - 45, '✨ [소울 애로우] 공격력 +15!');
    if (game.ui?.addChat) game.ui.addChat('system', '✨ [소울 애로우] 빛의 화살이 깃들어 60초간 공격력이 15 증가합니다.');
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
    const dirSign = user.facing === 'right' ? 1 : -1;
    const { damage } = user.getDamage();
    game.projectiles.push(new Projectile(user.x + dirSign * 16, user.y - 16, dirSign * 520, 0, 'arrow_bomb', Math.floor(damage * 1.8), true, user));
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
    const dirSign = user.facing === 'right' ? 1 : -1;
    for (let s = 0; s < 4; s++) {
      setTimeout(() => {
        const { damage, isCrit } = user.getDamage();
        game.projectiles.push(new Projectile(user.x + dirSign * 18, user.y - 16 + (s * 4 - 6), dirSign * 580, 0, 'arrow', Math.floor(damage * 1.3), isCrit, user));
      }, s * 70);
    }
    return true;
  }
});

// 5. Thief Skills
SkillRegistry.register({
  id: 'lucky_seven',
  name: '럭키 세븐',
  mpCost: 0,
  dmgMult: 1.6,
  maxLevel: 20,
  icon: '⭐',
  desc: '수리검 2개를 투척하는 고화력기',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.1;
    window.audio.playAttack();
    const dirSign = user.facing === 'right' ? 1 : -1;
    const activeStar = user.activeStar || 'steely';
    for (let s = 0; s < 2; s++) {
      setTimeout(() => {
        const { damage } = user.getDamage();
        const starDmg = Math.floor(damage * 1.7);
        const proj = new Projectile(user.x + dirSign * 16, user.y - 16 + (s * 8 - 4), dirSign * 560, (s * 40 - 20), 'shuriken', starDmg, true, user);
        proj.starType = activeStar;
        game.projectiles.push(proj);
      }, s * 100);
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
  desc: '단검으로 급소 2연속 찌르기',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 0.9;
    window.audio.playAttack();

    const hitBox = {
      x: user.facing === 'right' ? user.x - 20 : user.x - 75,
      y: user.y - 48,
      width: 95,
      height: 58
    };

    CombatSystem.executeMeleeAttack(user, hitBox, 1.3, game, { maxTargets: 1, hitsPerTarget: 2, hitDelay: 100 });
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
    user.buffs.haste = { name: '헤이스트', icon: '💨', duration: 60, maxDuration: 60 };
    user.walkSpeed = 5.6;
    user.jumpForce = -11.5;
    game.spawnItemText(user.x, user.y - 45, '💨 [헤이스트] 극상의 기동력!');
    if (game.ui?.addChat) game.ui.addChat('system', '💨 [헤이스트] 바람의 가호를 받아 이동속도와 점프력이 비약적으로 상승했습니다!');
    window.audio.playFlashJump();
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
    window.audio.playFlashJump();
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
  desc: '붉은 그림자 분신 소환 2배 타격!',
  handler: (user, game) => {
    user.buffs.shadow_partner = { name: '쉐도우 파트너', icon: '👥', duration: 60, maxDuration: 60 };
    window.audio.playFlashJump();
    game.spawnItemText(user.x, user.y - 45, '👥 [쉐도우 파트너] 그림자 분신!');
    if (game.ui?.addChat) game.ui.addChat('system', '👥 [쉐도우 파트너] 붉은 그림자 분신이 소환되어 모든 공격을 복사합니다.');
    return true;
  }
});

SkillRegistry.register({
  id: 'avenger',
  name: '어벤저',
  mpCost: 18,
  dmgMult: 1.9,
  maxLevel: 30,
  icon: '🌀',
  desc: '거대한 회전 수리검으로 다수 적 관통!',
  handler: (user, game) => {
    user.attackTimer = user.attackDuration * 1.15;
    window.audio.playAttack();
    const dirSign = user.facing === 'right' ? 1 : -1;
    const { damage } = user.getDamage();
    const activeStar = user.activeStar || 'steely';
    const proj = new Projectile(user.x + dirSign * 20, user.y - 16, dirSign * 500, 0, 'avenger_star', Math.floor(damage * 1.9), true, user);
    proj.starType = activeStar;
    game.projectiles.push(proj);
    return true;
  }
});

window.Skill = Skill;
window.SkillRegistry = SkillRegistry;
