// js/entities.js - Player, Monster, Drops, Projectiles, and Staggered Bouncing Damage Digits

class DamageDigit {
  constructor(char, x, y, delay, isCrit) {
    this.char = char;
    this.x = x;
    this.y = y;
    this.delay = delay;
    this.isCrit = isCrit;
    this.vy = -5.0;
    this.gravity = 0.4;
    this.life = 0.85;
    this.started = false;
  }

  update(dt) {
    if (this.delay > 0) {
      this.delay -= dt;
      return;
    }
    this.started = true;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life -= dt;
  }
}

class Projectile {
  constructor(x, y, vx, vy, type, damage, isCrit, owner) {
    this.id = Math.random();
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.damage = damage;
    this.isCrit = isCrit;
    this.owner = owner;
    this.life = 1.6;
    this.hit = false;
    this.starType = owner?.activeStar || 'steely';
  }

  update(dt, game) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;

    if (this.hit) return;

    CombatSystem.resolveProjectileCollision(this, game);
  }
}

// Canonical Classic MapleStory Equipment Catalog
const MAPLE_EQUIPMENT_CATALOG = {
  swords: [
    { id: 'wp_wood_sword', name: '초보자 목검', category: '전사 한손검', type: 'weapon', weaponType: 'sword', reqLevel: 0, atk: 7, str: 0, spd: 0, upgradeSlots: 7, icon: '🗡️', desc: '나무를 정성스레 깎아 만든 수련용 목검입니다.', color: '#b45309' },
    { id: 'wp_two_handed_sword', name: '강철 양손검', category: '전사 양손검', type: 'weapon', weaponType: 'sword', reqLevel: 20, atk: 32, str: 1, spd: 0, upgradeSlots: 7, icon: '⚔️', desc: '단단한 강철을 벼려낸 묵직한 양손검입니다.', color: '#64748b' },
    { id: 'wp_highlander', name: '하이랜더', category: '전사 양손검', type: 'weapon', weaponType: 'sword', reqLevel: 30, atk: 50, str: 2, spd: 5, attackSpeedBonus: 0.06, upgradeSlots: 7, icon: '⚔️', desc: '황금 코등이와 푸른 도신이 아름다운 모험가의 상징 명품 양손검입니다.', color: '#38bdf8' },
    { id: 'wp_gryunhill', name: '그륜힐', category: '전사 양손검', type: 'weapon', weaponType: 'sword', reqLevel: 70, atk: 75, str: 4, def: 5, spd: 0, upgradeSlots: 7, icon: '🗡️', desc: '붉은 톱날 날이 돋아난 거대하고 파괴적인 전설의 대검입니다.', color: '#ef4444' },
    { id: 'wp_dragon_claymore', name: '드래곤 클레이모어', category: '전사 양손검', type: 'weapon', weaponType: 'sword', reqLevel: 110, atk: 95, str: 8, def: 12, spd: 3, upgradeSlots: 7, icon: '🐲', desc: '푸른 용의 날개와 영혼이 깃든 궁극의 드래곤 대검입니다.', color: '#06b6d4' }
  ],
  daggers: [
    { id: 'wp_beginner_dagger', name: '초보자 대거', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 0, atk: 8, luk: 0, spd: 0, upgradeSlots: 7, icon: '🔪', desc: '가볍고 다루기 쉬운 기본 단검입니다.', color: '#94a3b8' },
    { id: 'wp_fruit_dagger', name: '후르츠 대거', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 15, atk: 18, dex: 1, spd: 2, upgradeSlots: 7, icon: '🗡️', desc: '과일 깎기용이지만 칼날이 날카로운 실속형 단검입니다.', color: '#10b981' },
    { id: 'wp_taeguk_fan', name: '태극 부채', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 35, atk: 35, luk: 2, spd: 10, attackSpeedBonus: 0.18, upgradeSlots: 7, icon: '🪭', desc: '화려한 태극 문양이 수놓아진 부채. 매우 빠른 공격속도를 자랑합니다.', color: '#ef4444' },
    { id: 'wp_geta', name: '게타', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 50, atk: 52, luk: 3, spd: 4, upgradeSlots: 7, icon: '🗡️', desc: '외날의 예리한 칼날을 가진 정통 닌자 탄토 단검입니다.', color: '#f59e0b' },
    { id: 'wp_kandine', name: '칸디네', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 70, atk: 70, luk: 5, dex: 2, spd: 6, upgradeSlots: 7, icon: '🐍', desc: '물결치는 독사 모양의 날을 가진 은밀한 암살자의 보검입니다.', color: '#059669' },
    { id: 'wp_dragon_toenail', name: '드래곤 토네일', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 110, atk: 92, luk: 9, dex: 4, spd: 8, upgradeSlots: 7, icon: '🐉', desc: '드래곤의 날카로운 발톱을 가공하여 만든 최고급 명품 단검입니다.', color: '#dc2626' }
  ],
  stars: [
    { id: 'star_subi', starType: 'subi', name: '수비표창', category: '도적 표창', type: 'star', reqLevel: 10, atk: 15, count: 500, icon: '⭐', desc: '가장 널리 쓰이는 표준 4각 은빛 수리검입니다.', color: '#94a3b8' },
    { id: 'star_mokbi', starType: 'mokbi', name: '목비표창', category: '도적 표창', type: 'star', reqLevel: 15, atk: 17, count: 700, icon: '🪵', desc: '청동과 나무를 결합하여 제작된 날카로운 십자 표창입니다.', color: '#b45309' },
    { id: 'star_kumbi', starType: 'kumbi', name: '금비표창', category: '도적 표창', type: 'star', reqLevel: 25, atk: 21, count: 800, icon: '🌟', desc: '찬란한 순금 빛으로 반짝이며 날아가는 4방 황금 표창입니다.', color: '#fbbf24' },
    { id: 'star_tobi', starType: 'tobi', name: '토비표창', category: '도적 표창', type: 'star', reqLevel: 35, atk: 23, count: 1000, icon: '💫', desc: '코발트 블루 날개에 바람의 소용돌이를 머금은 강력한 표창입니다.', color: '#3b82f6' },
    { id: 'star_steely', starType: 'steely', name: '뇌전수리검', category: '도적 표창', type: 'star', reqLevel: 50, atk: 25, count: 1000, icon: '⚡', desc: '⚡ 푸른 번개와 스파크 방전 궤적을 남기며 적을 강타하는 모험가 선망의 번개 수리검입니다.', color: '#00f5ff' },
    { id: 'star_ilbi', starType: 'ilbi', name: '일비표창', category: '도적 표창', type: 'star', reqLevel: 70, atk: 27, count: 800, icon: '🔮', desc: '⭐ 흑요석 3단 유선형 날과 붉은 루비 코어가 박힌 클래식 최고봉의 전설 표창입니다.', color: '#dc2626' },
    { id: 'star_hwabi', starType: 'hwabi', name: '화비표창', category: '도적 표창', type: 'star', reqLevel: 70, atk: 27, count: 1200, icon: '🔥', desc: '🔥 작열하는 붉은 화염의 불꽃을 휘감고 날아가는 화염 수리검입니다.', color: '#ea580c' }
  ],
  claws: [
    { id: 'wp_garnier', name: '가니어', category: '도적 아대', type: 'weapon', weaponType: 'claw', reqLevel: 10, atk: 12, upgradeSlots: 7, icon: '🧤', desc: '도적이 최초로 착용하는 가죽 아대입니다.', color: '#78350f' },
    { id: 'wp_meba', name: '메바', category: '도적 아대', type: 'weapon', weaponType: 'claw', reqLevel: 25, atk: 22, luk: 1, spd: 5, attackSpeedBonus: 0.2, upgradeSlots: 7, icon: '🦅', desc: '매우 빠른 연사 속도를 지닌 도적들의 국민 아대입니다.', color: '#3b82f6' },
    { id: 'wp_scorp', name: '스칼라피온', category: '도적 아대', type: 'weapon', weaponType: 'claw', reqLevel: 50, atk: 45, luk: 3, upgradeSlots: 7, icon: '🦂', desc: '전갈의 독침 형태를 본뜬 위협적인 날을 가진 아대입니다.', color: '#8b5cf6' },
    { id: 'wp_kandeo', name: '칸데오', category: '도적 아대', type: 'weapon', weaponType: 'claw', reqLevel: 70, atk: 65, luk: 5, upgradeSlots: 7, icon: '✨', desc: '황금 발톱이 장착되어 화려한 공격력을 자랑하는 상급 아대입니다.', color: '#f59e0b' },
    { id: 'wp_dragon_sleve', name: '드래곤 슬레브', category: '도적 아대', type: 'weapon', weaponType: 'claw', reqLevel: 110, atk: 88, luk: 8, spd: 6, upgradeSlots: 7, icon: '🐲', desc: '드래곤의 단단한 비늘로 제련된 최고급 아대입니다.', color: '#10b981' }
  ],
  bows: [
    { id: 'wp_hunter_bow', name: '사냥꾼의 활', category: '궁수 활', type: 'weapon', weaponType: 'bow', reqLevel: 10, atk: 14, upgradeSlots: 7, icon: '🏹', desc: '헤네시스 사냥꾼들이 애용하는 실용적인 활입니다.', color: '#84cc16' },
    { id: 'wp_ryden', name: '라이덴', category: '궁수 활', type: 'weapon', weaponType: 'bow', reqLevel: 35, atk: 38, dex: 2, spd: 4, attackSpeedBonus: 0.12, upgradeSlots: 7, icon: '⚡', desc: '번개의 탄성을 지닌 신속한 명품 활입니다.', color: '#06b6d4' },
    { id: 'wp_metus', name: '메투스', category: '궁수 활', type: 'weapon', weaponType: 'bow', reqLevel: 70, atk: 68, dex: 5, upgradeSlots: 7, icon: '🎯', desc: '백발백중의 명중률을 자랑하는 전설의 활입니다.', color: '#f97316' },
    { id: 'wp_dragon_shinebow', name: '드래곤 샤인보우', category: '궁수 활', type: 'weapon', weaponType: 'bow', reqLevel: 110, atk: 92, dex: 8, upgradeSlots: 7, icon: '🌟', desc: '드래곤의 영혼이 담긴 황금빛 광채의 궁극의 활입니다.', color: '#eab308' }
  ],
  wands: [
    { id: 'wp_wood_wand', name: '나무 완드', category: '마법사 완드', type: 'weapon', weaponType: 'staff', reqLevel: 8, atk: 10, int: 1, upgradeSlots: 7, icon: '🪄', desc: '엘리니아 숲의 성스러운 나뭇가지로 깎은 완드입니다.', color: '#15803d' },
    { id: 'wp_wizard_wand', name: '위저드 완드', category: '마법사 완드', type: 'weapon', weaponType: 'staff', reqLevel: 30, atk: 32, int: 3, upgradeSlots: 7, icon: '🔮', desc: '푸른 마력석이 박힌 정식 마법사용 완드입니다.', color: '#3b82f6' },
    { id: 'wp_evil_wings', name: '이블윙즈', category: '마법사 완드', type: 'weapon', weaponType: 'staff', reqLevel: 65, atk: 65, int: 6, upgradeSlots: 7, icon: '🦇', desc: '박쥐 날개 모양의 요사스러운 마력이 깃든 클래식 명품 완드입니다.', color: '#a855f7' },
    { id: 'wp_dragon_wand', name: '드래곤 완드', category: '마법사 완드', type: 'weapon', weaponType: 'staff', reqLevel: 110, atk: 90, int: 9, upgradeSlots: 7, icon: '🐉', desc: '드래곤의 심장 보석이 박혀 무한한 마력을 뿜어내는 완드입니다.', color: '#ec4899' }
  ]
};
window.MAPLE_EQUIPMENT_CATALOG = MAPLE_EQUIPMENT_CATALOG;

class Player {
  static MAX_LEVEL = 200;

  static expRequiredForLevel(level) {
    let required = 15;
    for (let current = 2; current <= Math.min(Player.MAX_LEVEL, Math.max(1, level)); current++) {
      required = Math.min(Number.MAX_SAFE_INTEGER, Math.floor(required * 1.5 + current * 10));
    }
    return required;
  }

  constructor(x = 400, y = 1318) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 24;
    this.height = 36;
    this.facing = 'right';

    this.onGround = false;
    this.currentFoothold = null;
    this.onLadder = false;
    this.currentLadder = null;
    this.ladderCooldown = 0;
    this.dropThroughTimer = 0;

    this.attackTimer = 0;
    this.attackDuration = 0.26;
    this.attackAnimationDuration = this.attackDuration;
    this.skillCooldowns = {};
    this.invincibleTimer = 0;

    this.name = '단풍모험가';
    this.job = '초보자';
    this.level = 1;
    this.exp = 0;
    this.maxExp = 15;

    this.str = 12;
    this.dex = 8;
    this.int = 4;
    this.luk = 4;
    this.fame = 0;
    this.ap = 5;
    this.sp = 3;
    this.speechText = null;
    this.speechTimer = 0;
    this.weakenedTimer = 0;
    this.buffs = {}; // Active buffs with durations
    this.comboCount = 0; // Combo attack count (0~5)

    this.walkSpeed = 3.6;
    this.jumpForce = Physics.JUMP_VELOCITY;
    this.ladderSpeed = 2.4;
    this.horizontalInput = 0;
    this.horizontalImpulseTimer = 0;
    this.weaponType = 'sword';
    this.activeStar = 'steely'; // Default signature 뇌전수리검

    this.meso = 10000; // Starting adventurer bonus
    this.inventory = {
      equip: [
        { item_uuid: 'eq_starter_wood_sword', id: 'wp_wood_sword', name: '초보자 목검', category: '전사 한손검', type: 'weapon', weaponType: 'sword', atk: 7, statVariation: 0, upgradeSlots: 7, successCount: 0, equipped: true },
        { item_uuid: 'eq_starter_bandana', id: 'eq_bandana', name: '빨간 띠', type: 'hat', def: 3, statVariation: 0, upgradeSlots: 7, successCount: 0, equipped: true },
        { item_uuid: 'eq_sample_highlander', id: 'wp_highlander', name: '하이랜더', category: '전사 양손검', type: 'weapon', weaponType: 'sword', reqLevel: 30, atk: 50, str: 2, spd: 5, statVariation: 0, upgradeSlots: 7, successCount: 0, equipped: false, icon: '⚔️', desc: '황금 코등이와 푸른 도신의 명품 양손검' },
        { item_uuid: 'eq_sample_gryunhill', id: 'wp_gryunhill', name: '그륜힐', category: '전사 양손검', type: 'weapon', weaponType: 'sword', reqLevel: 70, atk: 75, str: 4, def: 5, statVariation: 0, upgradeSlots: 7, successCount: 0, equipped: false, icon: '🗡️', desc: '붉은 톱날 날이 돋아난 거대 전설 대검' },
        { item_uuid: 'eq_sample_dragon_claymore', id: 'wp_dragon_claymore', name: '드래곤 클레이모어', category: '전사 양손검', type: 'weapon', weaponType: 'sword', reqLevel: 110, atk: 95, str: 8, def: 12, statVariation: 0, upgradeSlots: 7, successCount: 0, equipped: false, icon: '🐲', desc: '푸른 용의 날개와 영혼의 궁극 대검' },
        { item_uuid: 'eq_sample_taeguk_fan', id: 'wp_taeguk_fan', name: '태극 부채', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 35, atk: 35, luk: 2, spd: 10, statVariation: 0, upgradeSlots: 7, successCount: 0, equipped: false, icon: '🪭', desc: '태극 문양 부채. 매우 빠른 공격속도' },
        { item_uuid: 'eq_sample_kandine', id: 'wp_kandine', name: '칸디네', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 70, atk: 70, luk: 5, dex: 2, spd: 6, statVariation: 0, upgradeSlots: 7, successCount: 0, equipped: false, icon: '🐍', desc: '독사 모양 물결 날의 암살자 보검' },
        { item_uuid: 'eq_sample_meba', id: 'wp_meba', name: '메바', category: '도적 아대', type: 'weapon', weaponType: 'claw', reqLevel: 25, atk: 22, luk: 1, spd: 5, statVariation: 0, upgradeSlots: 7, successCount: 0, equipped: false, icon: '🦅', desc: '빠른 연사 속도의 도적 국민 아대' },
        { item_uuid: 'eq_sample_steely', id: 'star_steely', starType: 'steely', name: '뇌전수리검', category: '도적 표창', type: 'star', reqLevel: 50, atk: 25, count: 1000, statVariation: 0, upgradeSlots: 0, successCount: 0, equipped: true, icon: '⚡', desc: '⚡ 푸른 번개와 스파크 방전 궤적의 번개 수리검' },
        { item_uuid: 'eq_sample_ilbi', id: 'star_ilbi', starType: 'ilbi', name: '일비표창', category: '도적 표창', type: 'star', reqLevel: 70, atk: 27, count: 800, statVariation: 0, upgradeSlots: 0, successCount: 0, equipped: false, icon: '🔮', desc: '⭐ 흑요석 3단 유선형 날과 붉은 루비 코어의 전설 표창' },
        { item_uuid: 'eq_sample_tobi', id: 'star_tobi', starType: 'tobi', name: '토비표창', category: '도적 표창', type: 'star', reqLevel: 35, atk: 23, count: 1000, statVariation: 0, upgradeSlots: 0, successCount: 0, equipped: false, icon: '💫', desc: '코발트 블루 날개에 바람 소용돌이 표창' },
        { item_uuid: 'eq_sample_hwabi', id: 'star_hwabi', starType: 'hwabi', name: '화비표창', category: '도적 표창', type: 'star', reqLevel: 70, atk: 27, count: 1200, statVariation: 0, upgradeSlots: 0, successCount: 0, equipped: false, icon: '🔥', desc: '🔥 작열하는 붉은 화염의 불꽃 수리검' },
        { item_uuid: 'eq_sample_ryden', id: 'wp_ryden', name: '라이덴', category: '궁수 활', type: 'weapon', weaponType: 'bow', reqLevel: 35, atk: 38, dex: 2, spd: 4, statVariation: 0, upgradeSlots: 7, successCount: 0, equipped: false, icon: '⚡', desc: '번개의 탄성을 지닌 신속한 명품 활' },
        { item_uuid: 'eq_sample_evil_wings', id: 'wp_evil_wings', name: '이블윙즈', category: '마법사 완드', type: 'weapon', weaponType: 'staff', reqLevel: 65, atk: 65, int: 6, statVariation: 0, upgradeSlots: 7, successCount: 0, equipped: false, icon: '🦇', desc: '박쥐 날개 모양 마력의 클래식 명품 완드' }
      ],
      use: [
        { id: 'red_potion', name: '빨간 포션', count: 15, healHp: 50 },
        { id: 'blue_potion', name: '파란 포션', count: 10, healMp: 50 },
        { id: 'scroll_atk_60', name: '무기 공격력 주문서 60%', type: 'scroll', count: 2, rate: 0.6, bonusAtk: 2 },
        { id: 'scroll_atk_10', name: '무기 공격력 주문서 10%', type: 'scroll', count: 1, rate: 0.1, bonusAtk: 5 },
        { id: 'scroll_atk_100', name: '무기 공격력 주문서 100%', type: 'scroll', count: 3, rate: 1, bonusAtk: 1 },
        { id: 'scroll_def_100', name: '방어구 방어력 주문서 100%', type: 'scroll', count: 2, rate: 1, bonusDef: 2 }
      ],
      setup: [
        { id: 'chair_relax', name: '릴렉스 체어', type: 'chair', count: 1, desc: '휴식을 취하며 10초마다 HP를 50 회복합니다.' }
      ],
      etc: [
        { id: 'snail_shell', name: '달팽이의 껍질', count: 0 },
        { id: 'slime_liquid', name: '물컹물컹한 액체', count: 0 },
        { id: 'mushroom_cap', name: '주황버섯의 갓', count: 0 }
      ],
      cash: []
    };
    this.ensureItemUUIDs();

    this.calcDerivedStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    this.skills = {};
    this.initSkillsForJob('초보자');

    this.regenTimer = 0;
  }

  healHp(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  healMp(amount) {
    this.mp = Math.min(this.maxMp, this.mp + amount);
  }

  usePotion(potionId) {
    if (this.hp <= 0) return false;
    const pot = this.inventory.use.find(p => p.id === potionId);
    if (!pot || pot.count <= 0) return false;
    if (potionId === 'town_scroll') {
      if (!window.game?.changeMap) return false;
      pot.count--;
      window.game.changeMap('henesys_town');
      this.persistProgress();
      return true;
    }
    if (!pot.healHp && !pot.healMp && typeof SHOP_ITEMS_FOR_SALE !== 'undefined') {
      const template = SHOP_ITEMS_FOR_SALE.find(item => item.id === potionId);
      if (template?.healHp) pot.healHp = template.healHp;
      if (template?.healMp) pot.healMp = template.healMp;
    }
    if (!pot.healHp && !pot.healMp) return false;
    pot.count--;
    if (pot.healHp) this.healHp(pot.healHp);
    if (pot.healMp) this.healMp(pot.healMp);
    if (window.audio) window.audio.playPickItem();
    this.persistProgress();
    return true;
  }

  takeDamage(amount, game = null, fromX = null) {
    if (this.invincibleTimer > 0) return 0;
    if (this.buffs && this.buffs.dark_site) return 0; // Dark Site stealth ignores collision damage!

    // Magic Guard calculation: 80% absorbed by MP if available
    let hpDmg = amount;
    if (this.buffs && this.buffs.magic_guard && this.mp > 0) {
      const absorbed = Math.min(this.mp, Math.floor(amount * 0.8));
      this.mp -= absorbed;
      hpDmg = Math.max(1, amount - absorbed);
    }

    this.hp = Math.max(0, this.hp - hpDmg);
    this.invincibleTimer = 1.2; // 1.2s authentic i-Frame

    if (window.audio) {
      window.audio.playHit();
    }

    // Damage releases ropes before applying an airborne impulse.
    if (this.onLadder) Physics.detachFromLadder(this);
    if (fromX !== null) {
      this.horizontalImpulseTimer = 0.18;
      this.vx = (this.x >= fromX ? 1 : -1) * 3.6;
      this.vy = -2.8;
      this.onGround = false;
      this.currentFoothold = null;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.say('마을로 귀환합니다...');
      if (game) {
        setTimeout(() => {
          if (this.hp <= 0) this.revive(game);
        }, 1500);
      }
    }

    return hpDmg;
  }

  revive(game = window.game) {
    if (this.hp > 0 || !game?.changeMap) return false;
    this.buffs = {};
    this.comboCount = 0;
    this.walkSpeed = this.job === '도적' ? 4.2 : (this.job === '궁수' ? 3.8 : 3.6);
    this.jumpForce = Physics.JUMP_VELOCITY;
    this.calcDerivedStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.invincibleTimer = 2;
    this.attackTimer = 0;
    this.skillCooldowns = {};
    this.horizontalImpulseTimer = 0;
    game.changeMap('henesys_town');
    game.ui?.updateHUD?.();
    game.ui?.updateStatsWindow?.();
    this.persistProgress(game);
    return true;
  }

  onLand() {
    window.sprites.spawnLandingDust(this.x, this.y);
  }

  initSkillsForJob(job) {
    if (job === '전사') {
      this.skills = {
        power_strike: { name: '파워 스트라이크', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.8, icon: '⚔️', desc: '단일 적에게 치명타 일격' },
        slash_blast: { name: '슬래시 블러스트', level: 1, maxLevel: 20, mpCost: 10, hpCost: 6, dmgMult: 1.4, icon: '🌀', desc: '360도 회전 베기 주변 적 타격' },
        iron_body: { name: '아이언 바디', level: 1, maxLevel: 10, mpCost: 8, icon: '🛡️', desc: '물리 방어력 +25 상승 버프' },
        rage: { name: '분노 (Rage)', level: 1, maxLevel: 20, mpCost: 12, icon: '🔥', desc: '60초간 공격력 +35 대폭 증폭!' },
        combo_attack: { name: '콤보 어택', level: 1, maxLevel: 20, mpCost: 15, icon: '🔮', desc: '타격 시 콤보 구슬 누적 공격력 증폭!' },
        brandish: { name: '브랜디쉬', level: 1, maxLevel: 30, mpCost: 16, dmgMult: 2.2, hits: 2, icon: '⚡', desc: '거대한 십자 검기로 2연속 쾌도난마!' },
        recovery: { name: '회복력 향상', level: 1, maxLevel: 10, passive: true, icon: '❤️', desc: '주기적으로 HP 자동 회복' }
      };
      this.weaponType = 'sword';
      this.walkSpeed = 3.6;
    } else if (job === '마법사') {
      this.skills = {
        energy_bolt: { name: '에너지 볼트', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.3, icon: '🔮', desc: '비전 마법 탄환 전방 발사' },
        magic_claw: { name: '매직 클로', level: 1, maxLevel: 20, mpCost: 10, dmgMult: 1.3, hits: 2, icon: '✨', desc: '보라색 마법 손톱 2연속 할퀴기' },
        teleport: { name: '텔레포트', level: 1, maxLevel: 5, mpCost: 8, icon: '🌌', desc: '바라보는 방향으로 즉시 순간이동' },
        magic_guard: { name: '매직 가드', level: 1, maxLevel: 20, mpCost: 15, icon: '💎', desc: '받는 피해의 80%를 MP로 대체 흡수!' },
        thunderbolt: { name: '썬더볼트', level: 1, maxLevel: 30, mpCost: 20, dmgMult: 1.9, icon: '⚡', desc: '하늘에서 번개가 쏟아지는 전 화면 광역기!' },
        holy_symbol: { name: '홀리 심볼', level: 1, maxLevel: 30, mpCost: 25, icon: '🕊️', desc: '60초간 치유 및 경험치 +50% 획득!' },
        recovery: { name: '회복력 향상', level: 1, maxLevel: 10, passive: true, icon: '❤️', desc: 'MP 자동 회복량 증가' }
      };
      this.weaponType = 'staff';
      this.walkSpeed = 3.6;
    } else if (job === '궁수') {
      this.skills = {
        arrow_blow: { name: '애로우 블로우', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.6, icon: '🏹', desc: '관통하는 강력한 화살 1발' },
        double_shot: { name: '더블 샷', level: 1, maxLevel: 20, mpCost: 10, dmgMult: 1.25, hits: 2, icon: '🎯', desc: '화살 2발을 고속 연속 발사' },
        focus: { name: '포커스', level: 1, maxLevel: 10, mpCost: 8, icon: '👁️', desc: '명중률 +25 및 이동속도 증가' },
        soul_arrow: { name: '소울 애로우', level: 1, maxLevel: 20, mpCost: 12, icon: '✨', desc: '황금 날개 활 버프! 공격력 +15!' },
        arrow_bomb: { name: '애로우 밤', level: 1, maxLevel: 30, mpCost: 16, dmgMult: 1.8, icon: '💣', desc: '화살 폭탄이 폭발하며 광역 스턴!' },
        hurricane: { name: '폭풍의 시', level: 1, maxLevel: 30, mpCost: 6, dmgMult: 1.4, icon: '🌪️', desc: '초고속으로 기관총 화살 난사!' },
        recovery: { name: '회복력 향상', level: 1, maxLevel: 10, passive: true, icon: '❤️', desc: 'HP/MP 주기적 회복' }
      };
      this.weaponType = 'bow';
      this.walkSpeed = 3.8;
    } else if (job === '도적') {
      this.skills = {
        lucky_seven: { name: '럭키 세븐', level: 1, maxLevel: 20, mpCost: 8, dmgMult: 1.6, hits: 2, icon: '⭐', desc: '수리검 2개를 투척하는 고화력기' },
        double_stab: { name: '더블 스탭', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.3, hits: 2, icon: '🗡️', desc: '단검으로 급소 2연속 찌르기' },
        flash_jump: { name: '플래시 점프', level: 1, maxLevel: 5, mpCost: 6, icon: '⚡', desc: '공중 2단 고속 도약' },
        haste: { name: '헤이스트', level: 1, maxLevel: 20, mpCost: 12, icon: '💨', desc: '이동속도 5.6 & 점프력 극대화!' },
        dark_site: { name: '다크 사이트', level: 1, maxLevel: 10, mpCost: 8, icon: '👤', desc: '투명화 은신! 몬스터 충돌 무시!' },
        shadow_partner: { name: '쉐도우 파트너', level: 1, maxLevel: 30, mpCost: 24, icon: '👥', desc: '붉은 그림자 분신 소환 2배 타격!' },
        avenger: { name: '어벤저', level: 1, maxLevel: 30, mpCost: 18, dmgMult: 1.9, icon: '🌀', desc: '거대한 회전 수리검으로 다수 적 관통!' }
      };
      this.weaponType = 'claw';
      this.walkSpeed = 4.2;
    } else {
      this.skills = {
        three_snails: { name: '달팽이 세껍질', level: 1, maxLevel: 3, mpCost: 3, dmgMult: 1.5, icon: '🐌', desc: '달팽이 껍질을 던져 원거리 타격' },
        power_strike: { name: '파워 스트라이크', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.8, icon: '⚔️', desc: '검을 강하게 내리쳐 큰 피해' },
        slash_blast: { name: '슬래시 블러스트', level: 1, maxLevel: 20, mpCost: 8, hpCost: 4, dmgMult: 1.4, icon: '🌀', desc: '회전하며 주변 다수 타격' },
        flash_jump: { name: '플래시 점프', level: 1, maxLevel: 5, mpCost: 5, icon: '⚡', desc: '공중 2단 고속 도약' },
        recovery: { name: '회복력 향상', level: 1, maxLevel: 10, passive: true, icon: '❤️', desc: '주기적 HP/MP 자동 회복' }
      };
      this.weaponType = 'sword';
      this.walkSpeed = 3.6;
    }
    this.syncSkillCosts();
  }

  syncSkillCosts() {
    if (typeof SkillRegistry === 'undefined') return;
    for (const [id, data] of Object.entries(this.skills || {})) {
      const skill = SkillRegistry.get(id);
      if (skill) data.mpCost = skill.getManaCost(this);
    }
  }

  getAttackSpeedFactor() {
    return 1 + Math.max(0, Math.min(0.5, this.attackSpeedBonus || 0));
  }

  getAttackDuration(multiplier = 1) {
    return Math.max(0.1, this.attackDuration * multiplier / this.getAttackSpeedFactor());
  }

  calcDerivedStats() {
    let equipAtk = 0;
    let equipDef = 0;
    let equipStr = 0;
    let equipDex = 0;
    let equipInt = 0;
    let equipLuk = 0;
    let attackSpeedBonus = 0;

    if (this.inventory && this.inventory.equip) {
      this.inventory.equip.forEach(eq => {
        if (eq.equipped) {
          equipAtk += eq.atk || 0;
          equipDef += eq.def || 0;
          equipStr += eq.str || 0;
          equipDex += eq.dex || 0;
          equipInt += eq.int || 0;
          equipLuk += eq.luk || 0;
          const canonical = Object.values(MAPLE_EQUIPMENT_CATALOG).flat().find(item => item.id === eq.id);
          const speedBonus = eq.attackSpeedBonus ?? canonical?.attackSpeedBonus ?? 0;
          attackSpeedBonus += Number.isFinite(speedBonus) ? speedBonus : 0;
        }
      });
    }

    this.totalStr = this.str + equipStr;
    this.totalDex = this.dex + equipDex;
    this.totalInt = this.int + equipInt;
    this.totalLuk = this.luk + equipLuk;
    this.attackSpeedBonus = Math.max(0, Math.min(0.5, attackSpeedBonus));

    // Classic Maple Accuracy & Defense formulas
    this.accuracy = Math.floor(this.totalDex * 0.8 + this.totalLuk * 0.5);
    if (this.job === '마법사') {
      this.accuracy = Math.floor(this.totalInt * 0.1 + this.totalLuk * 0.4 + this.totalDex * 0.3);
    }
    // Apply active buff stat modifications
    if (this.buffs) {
      if (this.buffs.rage) equipAtk += 35;
      if (this.buffs.iron_body) equipDef += 25;
      if (this.buffs.focus) this.accuracy += 25;
      if (this.buffs.soul_arrow) equipAtk += 15;
    }

    this.defense = Math.floor(this.totalStr * 0.2 + this.totalDex * 0.1) + equipDef;

    if (this.job === '전사') {
      this.maxHp = 120 + this.level * 28 + this.totalStr * 6;
      this.maxMp = 30 + this.level * 8 + this.totalInt * 2;
      this.minAtk = Math.max(6, Math.floor(this.totalStr * 1.2 + this.totalDex * 0.4 + this.level * 3) + equipAtk);
      this.maxAtk = Math.max(10, Math.floor(this.totalStr * 1.8 + this.totalDex * 0.6 + this.level * 4) + equipAtk);
    } else if (this.job === '마법사') {
      this.maxHp = 60 + this.level * 14 + this.totalStr * 2;
      this.maxMp = 140 + this.level * 30 + this.totalInt * 7;
      this.minAtk = Math.max(8, Math.floor(this.totalInt * 1.4 + this.totalLuk * 0.4 + this.level * 3) + equipAtk);
      this.maxAtk = Math.max(12, Math.floor(this.totalInt * 2.0 + this.totalLuk * 0.6 + this.level * 4) + equipAtk);
    } else if (this.job === '궁수') {
      this.maxHp = 80 + this.level * 18 + this.totalStr * 3;
      this.maxMp = 50 + this.level * 12 + this.totalInt * 3;
      this.minAtk = Math.max(7, Math.floor(this.totalDex * 1.3 + this.totalStr * 0.5 + this.level * 3) + equipAtk);
      this.maxAtk = Math.max(11, Math.floor(this.totalDex * 1.9 + this.totalStr * 0.7 + this.level * 4) + equipAtk);
    } else if (this.job === '도적') {
      this.maxHp = 85 + this.level * 20 + this.totalStr * 3;
      this.maxMp = 60 + this.level * 14 + this.totalInt * 3;
      this.minAtk = Math.max(8, Math.floor(this.totalLuk * 1.4 + this.totalDex * 0.5 + this.level * 3) + equipAtk);
      this.maxAtk = Math.max(12, Math.floor(this.totalLuk * 2.1 + this.totalDex * 0.7 + this.level * 5) + equipAtk);
    } else {
      this.maxHp = 70 + this.level * 18 + this.totalStr * 4;
      this.maxMp = 35 + this.level * 10 + this.totalInt * 3;
      this.minAtk = Math.max(4, Math.floor(this.totalStr * 0.9 + this.totalDex * 0.4 + this.level * 2) + equipAtk);
      this.maxAtk = Math.max(8, Math.floor(this.totalStr * 1.5 + this.totalDex * 0.6 + this.level * 3) + equipAtk);
    }
    // The local action-RPG ruleset provides room for sustained combat across every job.
    this.maxHp = Math.max(300, Math.round(this.maxHp * 3));
    this.maxMp = Math.max(100, Math.round(this.maxMp * 2));
    if (Number.isFinite(this.hp)) this.hp = Math.min(this.hp, this.maxHp);
    if (Number.isFinite(this.mp)) this.mp = Math.min(this.mp, this.maxMp);
  }

  persistProgress(game = window.game, immediate = false) {
    if (game?.saveProgress) return game.saveProgress(immediate);
    if (typeof StorageManager !== 'undefined') return StorageManager.save(this, game?.map?.currentKey);
    return false;
  }

  getHitBox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    };
  }

  checkHit(target) {
    if (!target) return true;
    // Guaranteed hit if target level <= player level (removes fake 50% beginner misses)
    if ((target.level || 1) <= this.level) return true;
    const avoid = target.avoid || 5;
    const levelDiff = Math.max(0, (target.level || 1) - this.level);
    const needAcc = Math.floor(avoid * (1.84 + 0.07 * levelDiff));
    if (this.accuracy >= needAcc) return true;
    const hitRate = Math.max(0.50, this.accuracy / needAcc);
    return Math.random() < hitRate;
  }

  equipItem(item) {
    if (!item) return;
    if (item.type === 'star' || item.starType) {
      this.inventory.equip.forEach(eq => {
        if (eq.type === 'star' || eq.starType) eq.equipped = false;
      });
      item.equipped = true;
      this.activeStar = item.starType;
    } else if (item.type === 'weapon') {
      this.inventory.equip.forEach(eq => {
        if (eq.type === 'weapon') eq.equipped = false;
      });
      item.equipped = true;
      this.weaponType = item.weaponType || 'sword';
    } else {
      this.inventory.equip.forEach(eq => {
        if (eq.type === item.type) eq.equipped = false;
      });
      item.equipped = true;
    }
    this.calcDerivedStats();
    this.persistProgress();
  }

  equipById(itemId) {
    let item = this.inventory.equip.find(eq => eq.id === itemId);
    if (!item) {
      // Find from MAPLE_EQUIPMENT_CATALOG
      for (const cat of Object.values(MAPLE_EQUIPMENT_CATALOG)) {
        const found = cat.find(i => i.id === itemId);
        if (found) {
          item = { ...found, upgradeSlots: found.upgradeSlots || 7, equipped: false };
          this.inventory.equip.push(item);
          break;
        }
      }
    }
    if (item) {
      this.equipItem(item);
      return item;
    }
    return null;
  }

  ensureItemUUIDs() {
    if (!this.inventory) this.inventory = {};
    if (!this.inventory.equip) this.inventory.equip = [];
    if (!this.inventory.use) this.inventory.use = [];
    if (!this.inventory.setup) this.inventory.setup = [];
    if (!this.inventory.etc) this.inventory.etc = [];
    if (!this.inventory.cash) this.inventory.cash = [];
    this.inventory.equip.forEach(eq => {
      if (!eq.item_uuid) {
        eq.item_uuid = 'eq_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      }
      if (eq.upgradeSlots === undefined) eq.upgradeSlots = 7;
      if (eq.successCount === undefined) eq.successCount = 0;
      if (eq.statVariation === undefined) eq.statVariation = 0;
    });
  }

  toggleEquip(item) {
    if (!item) return false;
    if (item.equipped) {
      const MAX_EQUIP_SLOTS = 24;
      const unequippedCount = this.inventory.equip.filter(eq => !eq.equipped).length;
      if (unequippedCount >= MAX_EQUIP_SLOTS) {
        if (window.game?.ui?.addChat) {
          window.game.ui.addChat('system', '❌ 장비 인벤토리 공간이 부족하여 장착을 해제할 수 없습니다.');
        }
        return false;
      }
      item.equipped = false;
    } else {
      this.equipItem(item);
      return true;
    }
    this.calcDerivedStats();
    this.persistProgress(window.game, true);
    return true;
  }

  getEnhancementFee(item) {
    const level = Math.max(0, Number(item?.reqLevel) || 0);
    return Math.min(5000, 250 + level * 25 + Math.max(0, Number(item?.enhancements) || 0) * 100);
  }

  canUseEquipmentScroll(item, scroll) {
    if (!item || !scroll || scroll.type !== 'scroll') return false;
    if (scroll.bonusDef !== undefined) return item.type !== 'weapon' && item.type !== 'star' && Number.isFinite(item.upgradeSlots);
    return item.type === 'weapon' && Number.isFinite(item.upgradeSlots);
  }

  enhanceEquipment(item, scroll, game = window.game) {
    const reject = message => { this.say(message); return false; };
    if (!this.inventory.equip.includes(item) || !this.inventory.use.includes(scroll)) return reject('소지 중인 장비와 주문서를 선택하세요.');
    if (!this.canUseEquipmentScroll(item, scroll)) return reject('이 장비에 사용할 수 없는 주문서입니다.');
    if (!Number.isInteger(item.upgradeSlots) || item.upgradeSlots <= 0) return reject('남은 업그레이드 횟수가 없습니다.');
    if (!Number.isInteger(scroll.count) || scroll.count <= 0) return reject('주문서가 없습니다.');
    const fee = this.getEnhancementFee(item);
    if (this.meso < fee) return reject(`강화 수수료 ${fee.toLocaleString()} 메소가 필요합니다.`);
    const rate = Number(scroll.rate ?? 0.6);
    const stat = scroll.bonusDef !== undefined ? 'def' : 'atk';
    const bonus = Number(stat === 'def' ? scroll.bonusDef : (scroll.bonusAtk ?? 2));
    if (!Number.isFinite(rate) || rate < 0 || rate > 1 || !Number.isFinite(bonus) || bonus <= 0) return reject('올바른 강화 주문서가 아닙니다.');

    const success = Math.random() < rate;
    this.meso -= fee;
    scroll.count--;
    item.upgradeSlots--;
    if (success) {
      item[stat] = (Number(item[stat]) || 0) + bonus;
      item.enhancements = (Number(item.enhancements) || 0) + 1;
    }
    if (scroll.count === 0) this.inventory.use.splice(this.inventory.use.indexOf(scroll), 1);
    this.calcDerivedStats();
    this.lastEnhancementResult = {success, fee, stat, bonus: success ? bonus : 0,
      itemName: item.name, remainingSlots: item.upgradeSlots};
    this.persistProgress(game);
    const resultText = success
      ? `${item.name} 강화 성공! ${stat === 'atk' ? '공격력' : '방어력'} +${bonus}`
      : `${item.name} 강화 실패. 기존 능력치는 유지됩니다.`;
    window.audio?.[success ? 'playScrollSuccess' : 'playScrollFail']?.();
    game?.spawnItemText?.(this.x, this.y - 45, resultText);
    game?.ui?.addChat?.('system', `[강화] ${resultText} (수수료 ${fee.toLocaleString()} 메소, 남은 횟수 ${item.upgradeSlots})`);
    game?.ui?.updateHUD?.();
    game?.ui?.updateStatsWindow?.();
    return this.lastEnhancementResult;
  }

  scrollWeapon(scrollItem, game = window.game) {
    const item = this.inventory.equip.find(eq => eq.equipped && this.canUseEquipmentScroll(eq, scrollItem));
    if (!item) { this.say('주문서에 맞는 장비를 장착하세요.'); return false; }
    return Boolean(this.enhanceEquipment(item, scrollItem, game));
  }

  setJob(jobName) {
    this.job = jobName;
    this.buffs = {};
    this.comboCount = 0;
    if (jobName === '전사') {
      this.str = Math.max(25, this.str);
      this.equipById('wp_highlander');
    } else if (jobName === '마법사') {
      this.int = Math.max(25, this.int);
      this.equipById('wp_evil_wings');
    } else if (jobName === '궁수') {
      this.dex = Math.max(25, this.dex);
      this.equipById('wp_ryden');
    } else if (jobName === '도적') {
      this.luk = Math.max(25, this.luk);
      this.equipById('wp_meba');
      this.equipById('star_steely');
    }

    this.initSkillsForJob(jobName);
    this.calcDerivedStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.persistProgress();
  }

  getDamage() {
    const range = this.maxAtk - this.minAtk;
    const base = this.minAtk + Math.floor(Math.random() * (range + 1));
    const critRate = this.job === '도적' ? 0.45 : (this.job === '궁수' ? 0.35 : 0.22);
    const isCrit = Math.random() < critRate;
    const dmg = isCrit ? Math.floor(base * 1.6) : base;
    return { damage: dmg, isCrit };
  }

  say(text) {
    this.speechText = text;
    this.speechTimer = 4.0;
  }

  update(dt, map) {
    if (this.attackTimer > 0) this.attackTimer -= dt;
    for (const id of Object.keys(this.skillCooldowns)) {
      this.skillCooldowns[id] = Math.max(0, this.skillCooldowns[id] - dt);
    }
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.ladderCooldown > 0) this.ladderCooldown = Math.max(0, this.ladderCooldown - dt);
    if (this.weakenedTimer > 0) this.weakenedTimer = Math.max(0, this.weakenedTimer - dt);

    if (this.speechTimer > 0) {
      this.speechTimer -= dt;
      if (this.speechTimer <= 0) this.speechText = null;
    }

    this.regenTimer += dt;
    if (this.regenTimer >= 2 && this.hp > 0) {
      this.regenTimer -= 2;
      const rec = (this.skills.recovery?.level || 1) * 4;
      this.healHp(Math.max(8, Math.ceil(this.maxHp * 0.03)) + rec);
      this.healMp(Math.max(8, Math.ceil(this.maxMp * 0.08)) + rec);
    }

    // Update active buffs & expiration
    let buffsChanged = false;
    for (const [key, b] of Object.entries(this.buffs)) {
      b.duration -= dt;
      if (b.duration <= 0) {
        delete this.buffs[key];
        buffsChanged = true;
        if (key === 'haste') {
          this.walkSpeed = this.job === '도적' ? 4.2 : (this.job === '궁수' ? 3.8 : 3.6);
          this.jumpForce = Physics.JUMP_VELOCITY;
        }
        if (key === 'combo_attack') {
          this.comboCount = 0;
        }
      }
    }
    if (buffsChanged) {
      this.calcDerivedStats();
    }

    Physics.updateEntityFixed(this, map, dt);
  }

  setHorizontalInput(direction) {
    this.horizontalInput = this.hp > 0 ? Math.sign(direction) : 0;
    if (!this.onLadder && this.horizontalInput) this.facing = direction > 0 ? 'right' : 'left';
  }

  moveLeft() { this.setHorizontalInput(-1); }
  moveRight() { this.setHorizontalInput(1); }
  stopHorizontal() { this.setHorizontalInput(0); }

  jump(horizontalDirection = 0) {
    if (this.hp <= 0 || this.weakenedTimer > 0) return false;
    if (this.onLadder) {
      const direction = Math.sign(horizontalDirection);
      if (!direction) return false; // Classic ropes require Left/Right + Jump to dismount.
      Physics.detachFromLadder(this);
      this.vy = this.jumpForce * 0.85;
      this.vx = direction * 3.5;
      this.horizontalImpulseTimer = 0.1;
      this.facing = direction > 0 ? 'right' : 'left';
      window.audio.playJump();
      return true;
    }
    if (!this.onGround || this.attackTimer > 0) return false;
    this.vy = this.jumpForce;
    this.onGround = false;
    this.currentFoothold = null;
    window.audio.playJump();
    return true;
  }

  flashJump() {
    if (this.hp <= 0 || this.onLadder || this.weakenedTimer > 0) return false;
    this.vx = (this.facing === 'right' ? 1 : -1) * 8.5;
    this.vy = -3.8;
    this.horizontalImpulseTimer = 0.12;
    this.onGround = false;
    this.currentFoothold = null;
    window.audio.playFlashJump();
    return true;
  }

  dropThrough(map = window.game?.map) {
    if (this.hp <= 0 || this.weakenedTimer > 0 || this.onLadder ||
        !this.onGround || !this.currentFoothold?.canDropThrough) return false;
    if (map && !map.footholds.some(fh => !fh.isProp && fh.width > 0 &&
        this.x >= fh.x1 && this.x <= fh.x2 && fh.getYAtX(this.x) > this.y + 1 &&
        fh.getYAtX(this.x) - this.y < 600)) return false;
    this.dropThroughFoothold = this.currentFoothold;
    this.dropThroughUntilY = this.y + 10;
    this.dropThroughTimer = 18;
    this.vy = 2.5;
    this.onGround = false;
    this.currentFoothold = null;
    return true;
  }

  climbUp(map) {
    if (this.hp <= 0 || this.ladderCooldown > 0) return;
    if (!this.onLadder) {
      const ladder = Physics.checkLadderGrab(this, map, 'up');
      if (ladder) Physics.attachToLadder(this, ladder);
    }
    if (this.onLadder) this.vy = -this.ladderSpeed;
  }

  climbDown(map) {
    if (this.hp <= 0 || this.ladderCooldown > 0) return;
    if (!this.onLadder) {
      const ladder = Physics.checkLadderGrab(this, map, 'down');
      if (ladder) Physics.attachToLadder(this, ladder);
    }
    if (this.onLadder) this.vy = this.ladderSpeed;
  }

  stopVerticalClimb() {
    if (this.onLadder) this.vy = 0;
  }

  getPrimarySkillId() {
    switch (this.job) {
      case '초보자': return 'three_snails';
      case '전사': return 'power_strike';
      case '마법사': return 'magic_claw';
      case '궁수': return 'arrow_blow';
      case '도적':
        return this.weaponType === 'dagger' ? 'double_stab' : 'lucky_seven';
      default: return 'three_snails';
    }
  }

  getPrimarySkillName() {
    switch (this.job) {
      case '초보자': return '달팽이 세껍질';
      case '전사': return '파워 스트라이크';
      case '마법사': return '매직 클로';
      case '궁수': return '애로우 블로우';
      case '도적':
        return this.weaponType === 'dagger' ? '더블 스탭' : '럭키 세븐';
      default: return '기본 스킬';
    }
  }

  getPrimarySkillIcon() {
    switch (this.job) {
      case '초보자': return '🐌';
      case '전사': return '⚔️';
      case '마법사': return '✨';
      case '궁수': return '🏹';
      case '도적':
        return this.weaponType === 'dagger' ? '🗡️' : '⭐';
      default: return '⚔️';
    }
  }

  // Primary basic skill attack (replaces normal attack with job signature skill)
  primaryAttack(game) {
    const primarySkill = this.getPrimarySkillId();
    const res = this.useSkill(primarySkill, game);
    if (res) return true;
    return this.normalAttack(game);
  }

  normalAttack(game) {
    if (this.hp <= 0 || this.onLadder || this.attackTimer > 0) return false;
    CombatSystem.prepareAutoAim(this, game, {range: 75, verticalRange: 48});
    this.attackTimer = this.getAttackDuration();
    this.attackAnimationDuration = this.attackTimer;
    window.audio.playAttack();
    const hitBox = {
      x: this.facing === 'right' ? this.x - 20 : this.x - 75,
      y: this.y - 48,
      width: 95,
      height: 58
    };
    return CombatSystem.executeMeleeAttack(this, hitBox, 1.0, game);
  }

  useSkill(skillId, game) {
    this.syncSkillCosts();
    const skill = this.skills ? this.skills[skillId] : null;
    if (!skill || skill.level <= 0) return false;
    return SkillRegistry.execute(skillId, this, game);
  }

  gainExp(amount, game = window.game) {
    if (!Number.isFinite(amount) || amount <= 0 || this.level >= Player.MAX_LEVEL) return 0;
    const gained = Math.floor(amount * (this.buffs?.holy_symbol ? 1.5 : 1));
    if (gained <= 0) return 0;
    this.exp = Math.max(0, Number.isFinite(this.exp) ? this.exp : 0) + gained;
    this.maxExp = Player.expRequiredForLevel(this.level);
    let gainedLevels = 0;
    while (this.level < Player.MAX_LEVEL && this.exp >= this.maxExp) {
      this.exp -= this.maxExp;
      this.levelUp(game);
      gainedLevels++;
    }
    if (this.level >= Player.MAX_LEVEL) this.exp = 0;
    game?.spawnExpText?.(this.x, this.y - 35, gained);
    if (gainedLevels && this.job === '초보자' && this.level >= 10) game?.ui?.showJobAdvancementModal?.();
    game?.ui?.updateHUD?.();
    if (gainedLevels) {
      game?.ui?.updateStatsWindow?.();
      game?.ui?.updateSkillsWindow?.();
    }
    this.persistProgress(game);
    return gained;
  }

  levelUp(game = window.game) {
    if (this.level >= Player.MAX_LEVEL) return false;
    this.level++;
    this.ap += 5;
    this.sp += 3;
    this.maxExp = Player.expRequiredForLevel(this.level);
    this.calcDerivedStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    window.audio?.playLevelUp?.();
    game?.skillEffects?.push({
      type: 'level_up',
      x: this.x,
      y: this.y,
      progress: 0,
      duration: 1.6
    });

    this.persistProgress(game);
    return true;
  }

  advanceJob(newJob) {
    this.setJob(newJob);
  }

  addMeso(amount, game) {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    this.meso += amount;
    window.audio?.playPickItem?.();
    game?.spawnMesoText?.(this.x, this.y - 35, amount);
    this.persistProgress(game);
    return true;
  }

  addItem(itemId, name, count = 1, game) {
    if (!Number.isInteger(count) || count <= 0) return false;
    const template = typeof SHOP_ITEMS_FOR_SALE !== 'undefined'
      ? SHOP_ITEMS_FOR_SALE.find(item => item.id === itemId) : null;
    const list = template?.type === 'use' || this.inventory.use.some(item => item.id === itemId)
      ? this.inventory.use : this.inventory.etc;
    const existing = list.find(item => item.id === itemId);
    if (existing) existing.count += count;
    else list.push(template ? {...template, type: template.itemType || 'potion', count} : {id: itemId, name, count});
    window.audio?.playPickItem?.();
    game?.spawnItemText?.(this.x, this.y - 35, name);
    this.persistProgress(game);
    return true;
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }
}

// === Monster Class ===
class Monster {
  constructor(type, x, y) {
    this.id = Math.random();
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = Math.random() < 0.5 ? 'left' : 'right';
    this.onGround = false;
    this.currentFoothold = null;
    this.hitTimer = 0;
    this.hitstopTimer = 0;
    this.hitFlashTimer = 0;
    this.state = 'alive';
    this.dyingDuration = 0.45;
    this.dyingTimer = 0;
    this.dropsSpawned = false;
    this.rewardsGranted = false;
    this.quakePending = false;

    this.initMonsterType(type);
    this.hp = this.maxHp;

    this.moveTimer = Math.random() * 2;
    this.moveDir = 0;
  }

  initMonsterType(type) {
    switch (type) {
      case 'horny_mushroom':
      case 'shroom':
      case 'stump': {
        const definitions = {
          horny_mushroom: ['뿔버섯', 22, 300, 35, 90, 30, 7, 1.4, 38, 40],
          shroom: ['스포아', 2, 20, 5, 17, 0, 0, 0.8, 26, 24],
          stump: ['스텀프', 4, 40, 8, 30, 0, 0, 0.5, 36, 36]
        };
        [this.name, this.level, this.maxHp, this.exp, this.atk, this.def, this.avoid,
          this.speed, this.width, this.height] = definitions[type];
        this.dropTable = [
          {type:'meso', chance:0.9, min:10, max:80},
          {type:'blue_potion', name:'파란 포션', chance:0.3}
        ];
        break;
      }
      case 'snail':
        this.name = '달팽이';
        this.level = 1;
        this.maxHp = 15;
        this.exp = 3;
        this.atk = 2;
        this.def = 2;
        this.avoid = 1;
        this.speed = 0.6;
        this.width = 24;
        this.height = 18;
        this.dropTable = [
          { type: 'meso', chance: 0.7, min: 2, max: 8 },
          { type: 'snail_shell', name: '달팽이의 껍질', chance: 0.6 }
        ];
        break;
      case 'blue_snail':
        this.name = '파란달팽이';
        this.level = 2;
        this.maxHp = 30;
        this.exp = 5;
        this.atk = 5;
        this.def = 4;
        this.avoid = 2;
        this.speed = 0.8;
        this.width = 24;
        this.height = 18;
        this.dropTable = [
          { type: 'meso', chance: 0.75, min: 5, max: 14 },
          { type: 'snail_shell', name: '파란달팽이 껍질', chance: 0.6 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.15 }
        ];
        break;
      case 'red_snail':
        this.name = '빨간달팽이';
        this.level = 4;
        this.maxHp = 50;
        this.exp = 8;
        this.atk = 9;
        this.def = 8;
        this.avoid = 4;
        this.speed = 1.0;
        this.width = 24;
        this.height = 18;
        this.dropTable = [
          { type: 'meso', chance: 0.8, min: 10, max: 25 },
          { type: 'snail_shell', name: '빨간달팽이 껍질', chance: 0.65 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.25 }
        ];
        break;
      case 'slime':
        this.name = '슬라임';
        this.level = 6;
        this.maxHp = 90;
        this.exp = 14;
        this.atk = 14;
        this.def = 10;
        this.avoid = 5;
        this.speed = 1.2;
        this.width = 30;
        this.height = 24;
        this.dropTable = [
          { type: 'meso', chance: 0.85, min: 15, max: 40 },
          { type: 'slime_liquid', name: '물컹물컹한 액체', chance: 0.7 },
          { type: 'blue_potion', name: '파란 포션', chance: 0.25 }
        ];
        break;
      case 'orange_mushroom':
        this.name = '주황버섯';
        this.level = 8;
        this.maxHp = 150;
        this.exp = 22;
        this.atk = 20;
        this.def = 15;
        this.avoid = 8;
        this.speed = 1.3;
        this.width = 32;
        this.height = 28;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 25, max: 65 },
          { type: 'mushroom_cap', name: '주황버섯의 갓', chance: 0.75 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.3 },
          { type: 'blue_potion', name: '파란 포션', chance: 0.2 }
        ];
        break;
      case 'ribbon_pig':
        this.name = '리본돼지';
        this.level = 10;
        this.maxHp = 220;
        this.exp = 32;
        this.atk = 28;
        this.def = 22;
        this.avoid = 12;
        this.speed = 2.0;
        this.width = 36;
        this.height = 26;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 35, max: 90 },
          { type: 'etc', name: '돼지의 리본', chance: 0.8 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.35 }
        ];
        break;
      case 'green_mushroom':
        this.name = '초록버섯';
        this.level = 12;
        this.maxHp = 300;
        this.exp = 42;
        this.atk = 36;
        this.def = 30;
        this.avoid = 15;
        this.speed = 1.4;
        this.width = 34;
        this.height = 30;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 50, max: 120 },
          { type: 'etc', name: '초록버섯의 갓', chance: 0.75 },
          { type: 'blue_potion', name: '파란 포션', chance: 0.4 }
        ];
        break;
      case 'zombie_mushroom':
        this.name = '좀비버섯';
        this.level = 15;
        this.maxHp = 420;
        this.exp = 60;
        this.atk = 48;
        this.def = 45;
        this.avoid = 22;
        this.speed = 1.4;
        this.width = 36;
        this.height = 32;
        this.dropTable = [
          { type: 'meso', chance: 0.95, min: 65, max: 160 },
          { type: 'etc', name: '죽은자의 부적', chance: 0.8 },
          { type: 'blue_potion', name: '파란 포션', chance: 0.45 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.15 }
        ];
        break;
      case 'mushmom':
        this.name = '★ 머쉬맘 (BOSS) ★';
        this.level = 60;
        this.maxHp = 4500;
        this.exp = 950;
        this.atk = 75;
        this.def = 80;
        this.avoid = 35;
        this.speed = 1.6;
        this.width = 119;
        this.height = 110;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 1000, max: 2500 },
          { type: 'red_potion', name: '빨간 포션', chance: 1.0, count: 5 },
          { type: 'blue_potion', name: '파란 포션', chance: 1.0, count: 5 },
          { type: 'etc', name: '머쉬맘의 포자', chance: 1.0 },
          { type: 'equip', name: '냄비 뚜껑', chance: 0.65 },
          { type: 'scroll_atk_10', name: '무기 공격력 주문서 10%', chance: 0.4 }
        ];
        break;
      default:
        this.initMonsterType('snail');
    }
  }

  isAlive() {
    return this.hp > 0 && this.state !== 'dying' && this.state !== 'dead';
  }

  isDying() {
    return this.state === 'dying';
  }

  getHitBox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    };
  }

  getHitBoxes() {
    return [this.getHitBox()];
  }

  getLevel() {
    return this.level || 1;
  }

  getAvoid() {
    return this.avoid || 5;
  }

  getDefense() {
    return this.def || 0;
  }

  update(dt, player, map, game) {
    if (this.state === 'dying') {
      this.dyingTimer -= dt;
      if (this.dyingTimer <= 0) {
        this.state = 'dead';
      }
      return;
    }
    if (!this.isAlive()) return;

    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);

    // Hitstop Freeze
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
    }

    this.moveTimer -= dt;
    if (this.moveTimer <= 0) {
      this.moveTimer = 1.5 + Math.random() * 2.5;
      const r = Math.random();
      if (r < 0.4) {
        this.moveDir = -1;
        this.facing = 'left';
      } else if (r < 0.8) {
        this.moveDir = 1;
        this.facing = 'right';
      } else {
        this.moveDir = 0;
      }

      if ((this.type === 'slime' || this.type === 'orange_mushroom' || this.type === 'mushmom') && this.onGround && Math.random() < 0.6) {
        this.vy = -6.5;
        this.onGround = false;
        this.currentFoothold = null;
        if (this.type === 'mushmom') {
          this.quakePending = true;
          game?.spawnItemText?.(this.x, this.y - this.height - 12, '⚠️ 머쉬맘이 뛰어오릅니다!');
        }
      }
    }

    if (this.onGround && this.hitTimer <= 0) {
      this.vx = this.moveDir * this.speed;
    }

    // Soft horizontal separation between monsters on same platform (prevents stacking)
    if (game && game.monsters) {
      for (let j = 0; j < game.monsters.length; j++) {
        const other = game.monsters[j];
        if (other !== this && other.isAlive() && Math.abs(other.y - this.y) < 16) {
          const distX = this.x - other.x;
          if (Math.abs(distX) < 26) {
            this.vx += (distX >= 0 ? 0.35 : -0.35);
          }
        }
      }
    }

    // Foothold Edge Boundary Check (Only reverse if there is no continuous foothold)
    if (this.currentFoothold && this.onGround) {
      if (this.x - 10 <= this.currentFoothold.x1) {
        const contLeft = map.findConnectingFoothold(this.currentFoothold, this.x - 10, 'left');
        if (!contLeft) {
          this.moveDir = 1;
          this.facing = 'right';
        }
      } else if (this.x + 10 >= this.currentFoothold.x2) {
        const contRight = map.findConnectingFoothold(this.currentFoothold, this.x + 10, 'right');
        if (!contRight) {
          this.moveDir = -1;
          this.facing = 'left';
        }
      }
    }

    const wasGrounded = this.onGround;
    Physics.updateEntityFixed(this, map, dt);
    if (this.type === 'mushmom' && this.quakePending && !wasGrounded && this.onGround) {
      this.quakePending = false;
      window.sprites?.spawnLandingDust?.(this.x, this.y);
      game?.triggerScreenShake?.(0.25, 5);
      if (player.hp > 0 && player.onGround && player.invincibleTimer <= 0 &&
          Math.abs(player.x - this.x) <= 240 && Math.abs(player.y - this.y) <= 28) {
        const damage = player.takeDamage(Math.round(this.atk * 0.8), game, this.x);
        if (damage > 0) game?.spawnDamageText?.(player.x, player.y - 25, damage, false, 'player');
      }
    }

    if (player.hp > 0 && player.invincibleTimer <= 0) {
      const pBox = {
        x: player.x - player.width / 2,
        y: player.y - player.height,
        width: player.width,
        height: player.height
      };
      if (player.checkCollision(pBox, this.getHitBox())) {
        const dmg = player.takeDamage(this.atk, game, this.x);
        if (dmg > 0) {
          game.spawnDamageText(player.x, player.y - 25, dmg, false, 'player');
        }
      }
    }
  }

  takeDamage(amount, isCrit, fromDir, gameOrPlayer) {
    if (!this.isAlive() || !Number.isFinite(amount) || amount <= 0) return false;
    this.hp -= amount;
    this.hitTimer = 0.15;
    this.hitstopTimer = 0.08; // 0.08s hitstop!
    this.hitFlashTimer = 0.12;
    window.audio.playHit();

    // Parabolic knockback
    const hitDir = (fromDir === 'right' ? 1 : -1);
    this.vx = hitDir * 3.2;
    this.vy = -2.0;
    this.onGround = false;
    this.currentFoothold = null;

    if (this.hp <= 0) {
      this.hp = 0;
      let player = null;
      let game = null;
      if (gameOrPlayer) {
        if (typeof gameOrPlayer.gainExp === 'function') {
          player = gameOrPlayer;
          game = window.game;
        } else if (gameOrPlayer.player) {
          player = gameOrPlayer.player;
          game = gameOrPlayer;
        }
      }
      this.startDying(player, game);
    }
  }

  startDying(player, game) {
    if (this.state === 'dying' || this.state === 'dead') return;
    this.state = 'dying';
    this.dyingTimer = this.dyingDuration;
    this.vx = 0;
    this.vy = 0;
    this.hitstopTimer = 0;
    this.hitFlashTimer = 0;
    this.quakePending = false;
    window.audio.playMonsterDie();

    const actualPlayer = (player && typeof player.gainExp === 'function') 
      ? player 
      : ((game && game.player && typeof game.player.gainExp === 'function') ? game.player : (window.game?.player));

    if (!this.rewardsGranted && actualPlayer && typeof actualPlayer.gainExp === 'function') {
      this.rewardsGranted = true;
      const rewardGame = game || window.game;
      const gained = actualPlayer.gainExp(this.exp, rewardGame);
      rewardGame?.autoHunt?.recordKill?.(Number.isFinite(gained) ? gained : this.exp, 0);
    }
    this.spawnDrops(game || window.game);
  }

  spawnDrops(game) {
    if (this.dropsSpawned || !game || !game.spawnDrop) return;
    this.dropsSpawned = true;
    this.dropTable.forEach(drop => {
      if (Math.random() <= drop.chance) {
        if (drop.type === 'meso') {
          const amt = Math.floor(drop.min + Math.random() * (drop.max - drop.min + 1));
          game.spawnDrop('meso', amt, this.x + (Math.random() * 20 - 10), this.y - 10);
        } else if (drop.type === 'red_potion') {
          game.spawnDrop('red_potion', drop.count || 1, this.x + (Math.random() * 20 - 10), this.y - 10);
        } else if (drop.type === 'blue_potion') {
          game.spawnDrop('blue_potion', drop.count || 1, this.x + (Math.random() * 20 - 10), this.y - 10);
        } else {
          game.spawnDrop(drop.type, drop.count || 1, this.x + (Math.random() * 20 - 10), this.y - 10, drop.name);
        }
      }
    });

    // Potion drop bonus (Authentic Maple: 35% Red potion, 35% Blue potion)
    if (Math.random() < 0.35) {
      game.spawnDrop('red_potion', 1, this.x + (Math.random() * 24 - 12), this.y - 12);
    }
    if (Math.random() < 0.35) {
      game.spawnDrop('blue_potion', 1, this.x + (Math.random() * 24 - 12), this.y - 12);
    }
  }

  die(player, game) {
    this.startDying(player, game);
  }
}

// === Drop Item Class ===
class DropItem {
  constructor(type, amount, x, y, name = '') {
    this.id = Math.random();
    this.type = type;
    this.amount = amount;
    this.name = name;
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 3.2;
    this.vy = -4.5;
    this.width = 16;
    this.height = 14;
    this.onGround = false;
    this.currentFoothold = null;
    this.life = 60.0;
  }

  update(dt, map) {
    this.life -= dt;
    if (!this.onGround) {
      this.vx *= 0.95;
    } else {
      this.vx = 0;
    }
    Physics.updateEntityFixed(this, map, dt);
  }

  canPickUp(player) {
    const dist = Math.hypot(this.x - player.x, this.y - (player.y - 15));
    return dist < 32;
  }
}

// === Floating Text Class ===
class FloatingText {
  constructor(x, y, text, type = 'damage', isCrit = false) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.type = type;
    this.isCrit = isCrit;
    this.life = 1.0;
    this.vy = -1.2;
  }

  update(dt) {
    this.y += this.vy;
    this.life -= dt * 1.1;
  }
}

// === Zakum Boss Class (Body + 8 Independently Damageable Arms) ===
class ZakumBoss {
  constructor(x = 600, y = 350) {
    this.id = 'zakum';
    this.name = '★ 자쿰 (ZAKUM BOSS) ★';
    this.x = x;
    this.y = y; // Body sprite center; setGroundPosition converts the arena floor anchor.
    this.level = 140;
    this.maxHp = 100000;
    this.hp = this.maxHp;
    this.width = 385;
    this.height = 398;
    this.hitTimer = 0;
    this.hitstopTimer = 0;
    this.atk = 85;
    this.state = 'alive';
    this.phase = 'arms';
    this.animationTime = 0;
    this.dyingDuration = 0.9;
    this.dyingTimer = 0;
    this.rewardsGranted = false;
    // WZ mob 8800003..8800010 alternate left/right. Every part shares the
    // same WZ origin; its exported PNG padding is resolved by baked metadata.
    this.arms = Array.from({length: 8}, (_, index) => ({
      id: index + 1, name: `자쿰의 ${index + 1}번째 팔`, sourceMobId: 8800003 + index
    })).map(arm => ({...arm, maxHp: 15000, hp: 15000, isAlive: true,
      hitTimer: 0, state: 'alive', dyingTimer: 0, dyingDuration: 0.35}));
    this.activeSpells = [];
    this.spellCooldown = 3.5;
  }

  getLevel() { return this.level; }
  getAvoid() { return 25; }
  getDefense() { return 40; }
  isAlive() { return this.state === 'alive' && this.hp > 0; }
  isDying() { return this.state === 'dying'; }

  getPartGeometry(part = 'body', arm = null) {
    const isArm = part === 'arm';
    const framesPerSecond = isArm ? 5 : 4;
    const frame = Math.floor(this.animationTime * framesPerSecond) % 8;
    const metadata = isArm ? window.BOSS_SPRITE_GEOMETRY?.arms?.[arm.id] : window.BOSS_SPRITE_GEOMETRY?.body;
    const sprite = isArm ? window.sprites?.zakum?.arms?.[arm.id]?.[frame] : window.sprites?.zakum?.body?.[frame];
    const spriteWidth = metadata?.width || sprite?.naturalWidth || (isArm ? 100 : this.width);
    const spriteHeight = metadata?.height || sprite?.naturalHeight || (isArm ? 100 : this.height);
    const bounds = metadata?.frames?.[frame] || [0, 0, spriteWidth, spriteHeight];
    const bodyMetadata = window.BOSS_SPRITE_GEOMETRY?.body;
    const bodyHeight = bodyMetadata?.height || this.height;
    const bodyOrigin = bodyMetadata?.origins?.[0] || [this.width / 2, bodyHeight / 2];
    const origin = metadata?.origins?.[frame] || [spriteWidth / 2, spriteHeight / 2];
    // Keep this.y's body-center contract for camera/spells, while assembling
    // all nine sprites at the original shared WZ origin. The PNGs already
    // contain their limb animation: an extra per-arm bob detaches the joints.
    const originX = this.x;
    const originY = this.y + bodyOrigin[1] - bodyHeight / 2;
    const drawX = Math.round(originX - origin[0]);
    const drawY = Math.round(originY - origin[1]);
    return {frame, drawX, drawY, spriteWidth, spriteHeight,
      sourceWidth: spriteWidth, sourceHeight: spriteHeight,
      originX, originY, maskRects: metadata?.maskRects?.[frame],
      x: drawX + bounds[0], y: drawY + bounds[1],
      width: bounds[2] - bounds[0], height: bounds[3] - bounds[1]};
  }

  setGroundPosition(x, groundY) {
    const metadata = window.BOSS_SPRITE_GEOMETRY?.body;
    const height = metadata?.height || this.height;
    const footY = metadata?.frames?.[0]?.[3] ?? 387;
    this.x = x;
    this.y = groundY - (footY - height / 2);
    return this;
  }

  getGroundY() {
    const geometry = this.getPartGeometry();
    return geometry.y + geometry.height;
  }

  getHitBoxes() {
    if (!this.isAlive()) return [];
    const aliveArms = this.arms.filter(arm => arm.isAlive);
    if (aliveArms.length) {
      const occluder = this.getPartGeometry(); // The statue is drawn in front of its shoulders.
      return aliveArms.map(arm => ({...this.getPartGeometry('arm', arm),
        type: 'arm', target: arm, occluder}));
    }
    return [{...this.getPartGeometry(), type: 'body', target: this}];
  }

  takeDamage(amount, isCrit, fromDir, game, hitTarget = null) {
    if (!this.isAlive() || !Number.isFinite(amount) || amount <= 0) return false;
    const aliveArms = this.arms.some(arm => arm.isAlive);
    if (aliveArms) {
      const arm = hitTarget?.type === 'arm' ? hitTarget.target : null;
      if (!arm || !this.arms.includes(arm) || !arm.isAlive) return false;
      arm.hp = Math.max(0, arm.hp - amount);
      arm.hitTimer = 0.15;
      if (arm.hp === 0) {
        arm.isAlive = false;
        arm.state = 'dying';
        arm.dyingTimer = arm.dyingDuration;
        const geometry = this.getPartGeometry('arm', arm);
        game?.spawnItemText?.(geometry.x + geometry.width / 2, geometry.y, '💥 팔 파괴!');
        window.audio.playMonsterDie();
        if (!this.arms.some(part => part.isAlive)) this.phase = 'body';
      }
    } else {
      if (hitTarget && hitTarget.type !== 'body') return false;
      this.hp = Math.max(0, this.hp - amount);
      this.hitTimer = 0.15;
    }
    this.hitstopTimer = 0.08;
    window.audio.playHit();
    if (this.hp === 0) this.startDying(game?.player, game);
    return true;
  }

  getSpellHitBox(spell) {
    if (spell.type === 'lightning') return {x: spell.x - 24, y: 0, width: 48, height: spell.y + 12};
    if (spell.isOneToOne) return {x: spell.x - 55, y: spell.y - 160, width: 110, height: 172};
    return {x: spell.x - 30, y: spell.y - 200, width: 60, height: 212};
  }

  update(dt, player, map, game) {
    if (this.isDying()) {
      this.animationTime += dt;
      this.dyingTimer = Math.max(0, this.dyingTimer - dt);
      if (this.dyingTimer === 0) {
        this.grantRewards(this.rewardPlayer || player, this.rewardGame || game);
        this.state = 'dead';
        this.phase = 'dead';
      }
      return;
    }
    if (!this.isAlive()) return;
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      return;
    }
    this.animationTime += dt;
    this.hitTimer = Math.max(0, this.hitTimer - dt);
    for (const arm of this.arms) {
      arm.hitTimer = Math.max(0, arm.hitTimer - dt);
      if (arm.state === 'dying') {
        arm.dyingTimer = Math.max(0, arm.dyingTimer - dt);
        if (arm.dyingTimer === 0) arm.state = 'dead';
      }
    }
    const playerBox = player.getHitBox();
    if (player.hp > 0 && player.invincibleTimer <= 0 && CombatSystem.checkAABB(playerBox, this.getPartGeometry())) {
      const damage = player.takeDamage(this.atk, game, this.x);
      if (damage > 0) game.spawnDamageText(player.x, player.y - 25, damage, false, 'player');
    }
    for (let index = this.activeSpells.length - 1; index >= 0; index--) {
      const spell = this.activeSpells[index];
      spell.timer += dt;
      if (spell.timer < spell.duration) continue;
      if (player.hp > 0 && player.invincibleTimer <= 0 && CombatSystem.checkAABB(player.getHitBox(), this.getSpellHitBox(spell))) {
        if (spell.isOneToOne) {
          player.hp = 1;
          player.mp = 1;
          player.weakenedTimer = 4;
          player.invincibleTimer = 1.5;
          window.audio.playHit();
          game.triggerScreenShake?.(0.8, 8);
          game.spawnItemText(player.x, player.y - 30, '💀 1/1 저주! HP 1 / MP 1');
          game.ui?.addChat?.('system', '⚠️ [자쿰 기믹] HP/MP 1 및 허약 상태! 즉시 물약을 드세요.');
        } else {
          const damage = player.takeDamage(spell.damage, game, spell.x);
          if (damage > 0) game.spawnDamageText(player.x, player.y - 25, damage, false, 'player');
        }
      }
      this.activeSpells.splice(index, 1);
    }
    this.spellCooldown -= dt;
    if (this.spellCooldown <= 0 && player.hp > 0) {
      this.spellCooldown = 3.2 + Math.random() * 2.8;
      this.castSpell(player, game);
    }
  }

  castSpell(player, game) {
    if (!this.isAlive() || player.hp <= 0) return false;
    const roll = Math.random();
    window.audio.playBossRoar();
    let spell;
    if (roll < 0.25) {
      spell = {type: 'one_to_one', x: player.x, y: player.y, duration: 1.2, damage: 0, isOneToOne: true};
      game.spawnItemText(player.x, player.y - 65, '⚠️ ★ 자쿰의 1/1 마법진 전개! ★');
    } else if (roll < 0.65) {
      spell = {type: 'fire_pillar', x: player.x, y: player.y, duration: 0.8, damage: 45};
      game.spawnItemText(player.x, player.y - 60, '🔥 화염 기둥 경고!');
    } else {
      spell = {type: 'lightning', x: player.x + Math.random() * 80 - 40, y: player.y, duration: 0.6, damage: 55};
      game.spawnItemText(player.x, player.y - 60, '⚡ 낙뢰 경고!');
    }
    this.activeSpells.push({...spell, timer: 0});
    return true;
  }

  startDying(player, game) {
    if (this.state !== 'alive') return false;
    this.hp = 0;
    this.state = 'dying';
    this.phase = 'dying';
    this.dyingTimer = this.dyingDuration;
    this.hitstopTimer = 0;
    this.activeSpells = [];
    this.rewardPlayer = player;
    this.rewardGame = game;
    window.audio.playMonsterDie();
    return true;
  }

  grantRewards(player, game) {
    if (this.rewardsGranted || !game) return;
    this.rewardsGranted = true;
    const gained = player?.gainExp?.(15000, game);
    game.autoHunt?.recordKill?.(Number.isFinite(gained) ? gained : 15000, 0);
    const y = this.getGroundY() - 8;
    game.spawnDrop('meso', 50000, this.x - 40, y);
    game.spawnDrop('meso', 50000, this.x + 40, y);
    game.spawnDrop('red_potion', 20, this.x - 80, y);
    game.spawnDrop('blue_potion', 20, this.x + 80, y);
    game.spawnDrop('equip', 1, this.x, y, '👑 자쿰의 투구');
    game.spawnItemText(this.x, this.y - 60, '👑 ★ 자쿰 레이드 클리어! ★ 👑');
  }

  die(player, game) { return this.startDying(player, game); }
}


// === NPC Class ===
class NPC {
  constructor(name, type, x, y, dialog) {
    this.name = name;
    this.type = type;
    this.x = x;
    this.y = y;
    this.dialog = dialog;
    this.width = type.includes('cab') ? 122 : 52;
    this.height = 70;
  }
}

// === Portal Class ===
class Portal {
  constructor(x, y, targetMap, targetX, targetY, name) {
    this.x = x;
    this.y = y;
    this.targetMap = targetMap;
    this.targetX = targetX;
    this.targetY = targetY;
    this.name = name;
  }
}

window.DamageDigit = DamageDigit;
window.Projectile = Projectile;
window.Player = Player;
window.Monster = Monster;
window.ZakumBoss = ZakumBoss;
window.NPC = NPC;
window.Portal = Portal;
window.DropItem = DropItem;
window.FloatingText = FloatingText;
