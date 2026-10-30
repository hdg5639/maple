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
  constructor(x, y, vx, vy, type, damage, isCrit, owner, options = {}) {
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
    this.hitTimer = 0; // 0.08s impact shrapnel linger (INV-4)
    this.starType = options.starType || owner?.activeStar || 'subi';
    this.trailHistory = [{ x, y }]; // 3-4 step Star Trail buffer (INV-4)
    this.isShadow = Boolean(options.isShadow);
    this.pierce = Boolean(options.pierce || options.maxTargets > 1 || type === 'avenger_star');
    this.maxTargets = options.maxTargets || (type === 'avenger_star' ? 6 : 1);
    this.hitTargets = new Set();
    this.drainRate = options.drainRate || 0;
  }

  update(dt, game) {
    this.prevX = this.x;
    this.prevY = this.y;

    if (this.hit) {
      this.hitTimer += dt;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;

    if (!this.trailHistory) this.trailHistory = [];
    this.trailHistory.unshift({ x: this.x, y: this.y });
    if (this.trailHistory.length > 5) this.trailHistory.pop();

    CombatSystem.resolveProjectileCollision(this, game);
  }
}

// Canonical Classic MapleStory Equipment Catalog
const MAPLE_EQUIPMENT_CATALOG = {
  swords: [
    { id: 'wp_wood_sword', iconPath: 'assets/items/wp_wood_sword.png', name: '초보자 목검', category: '전사 한손검', type: 'weapon', weaponType: 'sword', reqLevel: 0, atk: 7, str: 0, spd: 0, upgradeSlots: 7, icon: '🗡️', desc: '나무를 정성스레 깎아 만든 수련용 목검입니다.', color: '#b45309' },
    { id: 'wp_two_handed_sword', iconPath: 'assets/items/wp_two_handed_sword.png', name: '강철 양손검', category: '전사 양손검', type: 'weapon', weaponType: 'sword', reqLevel: 20, atk: 32, str: 1, spd: 0, upgradeSlots: 7, icon: '⚔️', desc: '단단한 강철을 벼려낸 묵직한 양손검입니다.', color: '#64748b' },
    { id: 'wp_highlander', iconPath: 'assets/items/wp_highlander.png', name: '하이랜더', category: '전사 양손검', type: 'weapon', weaponType: 'sword', reqLevel: 30, atk: 50, str: 2, spd: 5, attackSpeedBonus: 0.06, upgradeSlots: 7, icon: '⚔️', desc: '황금 코등이와 푸른 도신이 아름다운 모험가의 상징 명품 양손검입니다.', color: '#38bdf8' },
    { id: 'wp_zwei_hander', iconPath: 'assets/items/wp_zwei_hander.png', name: '츠바이한더', category: '전사 양손검', type: 'weapon', weaponType: 'sword', reqLevel: 50, atk: 65, str: 3, spd: 2, upgradeSlots: 7, icon: '⚔️', desc: '견고한 칼날과 웅장한 가드를 지닌 중기사의 명검입니다.', color: '#475569' },
    { id: 'wp_gryunhill', iconPath: 'assets/items/wp_gryunhill.png', name: '그륜힐', category: '전사 양손검', type: 'weapon', weaponType: 'sword', reqLevel: 70, atk: 75, str: 4, def: 5, spd: 0, upgradeSlots: 7, icon: '🗡️', desc: '붉은 톱날 날이 돋아난 거대하고 파괴적인 전설의 대검입니다.', color: '#ef4444' },
    { id: 'wp_spatha', iconPath: 'assets/items/wp_spatha.png', name: '스파타', category: '전사 양손검', type: 'weapon', weaponType: 'sword', reqLevel: 90, atk: 88, str: 6, spd: 3, upgradeSlots: 7, icon: '🗡️', desc: '고대 로마 영웅의 기운이 서린 쾌속의 명검입니다.', color: '#d97706' },
    { id: 'wp_dragon_claymore', iconPath: 'assets/items/wp_dragon_claymore.png', name: '드래곤 클레이모어', category: '전사 양손검', type: 'weapon', weaponType: 'sword', reqLevel: 110, atk: 95, str: 8, def: 12, spd: 3, upgradeSlots: 7, icon: '🐲', desc: '푸른 용의 날개와 영혼이 깃든 궁극의 드래곤 대검입니다.', color: '#06b6d4' }
  ],
  daggers: [
    { id: 'wp_beginner_dagger', iconPath: 'assets/items/wp_beginner_dagger.png', name: '초보자 대거', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 0, atk: 8, luk: 0, spd: 0, upgradeSlots: 7, icon: '🔪', desc: '가볍고 다루기 쉬운 기본 단검입니다.', color: '#94a3b8' },
    { id: 'wp_fruit_dagger', iconPath: 'assets/items/wp_fruit_dagger.png', name: '후르츠 대거', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 15, atk: 18, dex: 1, spd: 2, upgradeSlots: 7, icon: '🗡️', desc: '과일 깎기용이지만 칼날이 날카로운 실속형 단검입니다.', color: '#10b981' },
    { id: 'wp_taeguk_fan', iconPath: 'assets/items/wp_taeguk_fan.png', name: '태극 부채', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 35, atk: 35, luk: 2, spd: 10, attackSpeedBonus: 0.18, upgradeSlots: 7, icon: '🪭', desc: '화려한 태극 문양이 수놓아진 부채. 매우 빠른 공격속도를 자랑합니다.', color: '#ef4444' },
    { id: 'wp_geta', iconPath: 'assets/items/wp_geta.png', name: '게타', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 50, atk: 52, luk: 3, spd: 4, upgradeSlots: 7, icon: '🗡️', desc: '외날의 예리한 칼날을 가진 정통 닌자 탄토 단검입니다.', color: '#f59e0b' },
    { id: 'wp_kandine', iconPath: 'assets/items/wp_kandine.png', name: '칸디네', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 70, atk: 70, luk: 5, dex: 2, spd: 6, upgradeSlots: 7, icon: '🐍', desc: '물결치는 독사 모양의 날을 가진 은밀한 암살자의 보검입니다.', color: '#059669' },
    { id: 'wp_blood_dagger', iconPath: 'assets/items/wp_blood_dagger.png', name: '블러드 대거', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 90, atk: 85, luk: 7, dex: 3, spd: 8, upgradeSlots: 7, icon: '🗡️', desc: '피를 머금어 붉게 빛나는 전설의 암살 대거입니다.', color: '#b91c1c' },
    { id: 'wp_dragon_toenail', iconPath: 'assets/items/wp_dragon_toenail.png', name: '드래곤 토네일', category: '도적 단검', type: 'weapon', weaponType: 'dagger', reqLevel: 110, atk: 92, luk: 9, dex: 4, spd: 8, upgradeSlots: 7, icon: '🐉', desc: '드래곤의 날카로운 발톱을 가공하여 만든 최고급 명품 단검입니다.', color: '#dc2626' }
  ],
  stars: [
    { id: 'star_subi', starType: 'subi', name: '수비표창', category: '도적 표창', type: 'star', reqLevel: 10, atk: 15, count: 500, upgradeSlots: 15, icon: '✦', iconPath: 'assets/projectiles/stars/subi_icon.png', desc: '가장 널리 쓰이는 표준 4각 은빛 수리검입니다.', color: '#94a3b8' },
    { id: 'star_mokbi', starType: 'mokbi', name: '목비표창', category: '도적 표창', type: 'star', reqLevel: 15, atk: 17, count: 700, upgradeSlots: 15, icon: '🪵', iconPath: 'assets/projectiles/stars/mokbi_icon.png', desc: '청동과 나무를 결합하여 제작된 날카로운 십자 표창입니다.', color: '#b45309' },
    { id: 'star_kumbi', starType: 'kumbi', name: '금비표창', category: '도적 표창', type: 'star', reqLevel: 25, atk: 21, count: 800, upgradeSlots: 15, icon: '✨', iconPath: 'assets/projectiles/stars/kumbi_icon.png', desc: '찬란한 순금 빛으로 반짝이며 날아가는 4방 황금 표창입니다.', color: '#fbbf24' },
    { id: 'star_tobi', starType: 'tobi', name: '토비표창', category: '도적 표창', type: 'star', reqLevel: 35, atk: 23, count: 1000, upgradeSlots: 15, icon: '💫', iconPath: 'assets/projectiles/stars/tobi_icon.png', desc: '코발트 블루 날개에 바람의 소용돌이를 머금은 강력한 표창입니다.', color: '#3b82f6' },
    { id: 'star_steely', starType: 'steely', name: '뇌전수리검', category: '도적 표창', type: 'star', reqLevel: 50, atk: 25, count: 1000, upgradeSlots: 15, icon: '⚡', iconPath: 'assets/projectiles/stars/steely_icon.png', desc: '⚡ 푸른 번개와 스파크 방전 궤적의 뇌전수리검입니다.', color: '#00f5ff' },
    { id: 'star_ilbi', starType: 'ilbi', name: '일비표창', category: '도적 표창', type: 'star', reqLevel: 70, atk: 27, count: 800, upgradeSlots: 15, icon: '🔮', iconPath: 'assets/projectiles/stars/ilbi_icon.png', desc: '⭐ 흑요석 3단 유선형 날과 붉은 루비 코어의 전설 표창입니다.', color: '#dc2626' },
    { id: 'star_hwabi', starType: 'hwabi', name: '화비표창', category: '도적 표창', type: 'star', reqLevel: 70, atk: 27, count: 1200, upgradeSlots: 15, icon: '🔥', iconPath: 'assets/projectiles/stars/hwabi_icon.png', desc: '🔥 작열하는 붉은 화염의 6각 불꽃 수리검입니다.', color: '#ea580c' },
    { id: 'star_ultimate', starType: 'ultimate', name: '★ 궁극의 성광수리검 ★', category: '도적 표창', type: 'star', reqLevel: 100, atk: 35, count: 2000, upgradeSlots: 15, icon: '🌟', iconPath: 'assets/projectiles/stars/ultimate_icon.png', desc: '⭐ 신화의 경지에 도달한 8방향 성광의 궁극 수리검 (+12 이상 초월 강화)', color: '#f59e0b' }
  ],
  claws: [
    { id: 'wp_garnier', iconPath: 'assets/items/wp_garnier.png', name: '가니어', category: '도적 아대', type: 'weapon', weaponType: 'claw', reqLevel: 10, atk: 12, upgradeSlots: 7, icon: '🧤', desc: '도적이 최초로 착용하는 가죽 아대입니다.', color: '#78350f' },
    { id: 'wp_meba', iconPath: 'assets/items/wp_meba.png', name: '메바', category: '도적 아대', type: 'weapon', weaponType: 'claw', reqLevel: 25, atk: 22, luk: 1, spd: 5, attackSpeedBonus: 0.2, upgradeSlots: 7, icon: '🦅', desc: '매우 빠른 연사 속도를 지닌 도적들의 국민 아대입니다.', color: '#3b82f6' },
    { id: 'wp_scorp', iconPath: 'assets/items/wp_scorp.png', name: '스칼라피온', category: '도적 아대', type: 'weapon', weaponType: 'claw', reqLevel: 50, atk: 45, luk: 3, upgradeSlots: 7, icon: '🦂', desc: '전갈의 독침 형태를 본뜬 위협적인 날을 가진 아대입니다.', color: '#8b5cf6' },
    { id: 'wp_slain', iconPath: 'assets/items/wp_slain.png', name: '슬레인', category: '도적 아대', type: 'weapon', weaponType: 'claw', reqLevel: 60, atk: 58, luk: 4, spd: 5, upgradeSlots: 7, icon: '🦅', desc: '암흑의 깃털과 은빛 칼날이 번뜩이는 명품 아대입니다.', color: '#4338ca' },
    { id: 'wp_kandeo', iconPath: 'assets/items/wp_kandeo.png', name: '칸데오', category: '도적 아대', type: 'weapon', weaponType: 'claw', reqLevel: 70, atk: 65, luk: 5, upgradeSlots: 7, icon: '✨', desc: '황금 발톱이 장착되어 화려한 공격력을 자랑하는 상급 아대입니다.', color: '#f59e0b' },
    { id: 'wp_cobra_steer', iconPath: 'assets/items/wp_cobra_steer.png', name: '코브라스티어', category: '도적 아대', type: 'weapon', weaponType: 'claw', reqLevel: 90, atk: 78, luk: 7, spd: 6, upgradeSlots: 7, icon: '🐍', desc: '독사의 어금니처럼 치명적인 타격을 입히는 전설의 아대입니다.', color: '#059669' },
    { id: 'wp_dragon_sleve', iconPath: 'assets/items/wp_dragon_sleve.png', name: '드래곤 슬레브', category: '도적 아대', type: 'weapon', weaponType: 'claw', reqLevel: 110, atk: 88, luk: 8, spd: 6, upgradeSlots: 7, icon: '🐲', desc: '드래곤의 단단한 비늘로 제련된 최고급 아대입니다.', color: '#10b981' }
  ],
  bows: [
    { id: 'wp_hunter_bow', iconPath: 'assets/items/wp_hunter_bow.png', name: '사냥꾼의 활', category: '궁수 활', type: 'weapon', weaponType: 'bow', reqLevel: 10, atk: 14, upgradeSlots: 7, icon: '🏹', desc: '헤네시스 사냥꾼들이 애용하는 실용적인 활입니다.', color: '#84cc16' },
    { id: 'wp_battle_bow', iconPath: 'assets/items/wp_battle_bow.png', name: '배틀보우', category: '궁수 활', type: 'weapon', weaponType: 'bow', reqLevel: 25, atk: 28, spd: 2, upgradeSlots: 7, icon: '🏹', desc: '사냥과 전투 모두에 능한 표준형 활입니다.', color: '#a16207' },
    { id: 'wp_ryden', iconPath: 'assets/items/wp_ryden.png', name: '라이덴', category: '궁수 활', type: 'weapon', weaponType: 'bow', reqLevel: 35, atk: 42, dex: 1, spd: 2, upgradeSlots: 7, icon: '🏹', desc: '번개의 탄성을 지닌 날렵하고 아름다운 명품 활입니다.', color: '#38bdf8' },
    { id: 'wp_red_viper', iconPath: 'assets/items/wp_red_viper.png', name: '레드 바이퍼', category: '궁수 활', type: 'weapon', weaponType: 'bow', reqLevel: 50, atk: 55, dex: 3, spd: 4, upgradeSlots: 7, icon: '🏹', desc: '독사의 탄성을 응용한 날렵한 붉은 활입니다.', color: '#dc2626' },
    { id: 'wp_metus', iconPath: 'assets/items/wp_metus.png', name: '메투스', category: '궁수 활', type: 'weapon', weaponType: 'bow', reqLevel: 70, atk: 72, dex: 4, spd: 4, upgradeSlots: 7, icon: '🏹', desc: '바람의 정령이 깃들어 화살을 초고속으로 날리는 활입니다.', color: '#a855f7' },
    { id: 'wp_golden_hingel', iconPath: 'assets/items/wp_golden_hingel.png', name: '골든 힌겔', category: '궁수 활', type: 'weapon', weaponType: 'bow', reqLevel: 90, atk: 86, dex: 6, spd: 5, upgradeSlots: 7, icon: '🏹', desc: '황금빛 독수리의 날개를 형상화한 궁극의 명궁 활입니다.', color: '#eab308' },
    { id: 'wp_dragon_shinebow', iconPath: 'assets/items/wp_dragon_shinebow.png', name: '드래곤 샤인보우', category: '궁수 활', type: 'weapon', weaponType: 'bow', reqLevel: 110, atk: 94, dex: 8, spd: 6, upgradeSlots: 7, icon: '🐲', desc: '광채를 뿜어내는 용의 뼈로 만든 신화의 활입니다.', color: '#f59e0b' }
  ],
  wands: [
    { id: 'wp_wood_wand', iconPath: 'assets/items/wp_wood_wand.png', name: '나무 완드', category: '마법사 완드', type: 'weapon', weaponType: 'staff', reqLevel: 8, atk: 12, upgradeSlots: 7, icon: '🪄', desc: '자연의 기운이 깃든 기초 수련용 완드입니다.', color: '#ca8a04' },
    { id: 'wp_fairy_wand', iconPath: 'assets/items/wp_fairy_wand.png', name: '페어리 완드', category: '마법사 완드', type: 'weapon', weaponType: 'staff', reqLevel: 18, atk: 20, int: 2, upgradeSlots: 7, icon: '🪄', desc: '엘리니아 요정들의 축복이 깃든 신비로운 완드입니다.', color: '#a855f7' },
    { id: 'wp_wizard_wand', iconPath: 'assets/items/wp_wizard_wand.png', name: '위저드 완드', category: '마법사 완드', type: 'weapon', weaponType: 'staff', reqLevel: 30, atk: 40, int: 2, upgradeSlots: 7, icon: '🔮', desc: '정제된 마력석이 박힌 정식 마법사용 완드입니다.', color: '#3b82f6' },
    { id: 'wp_thorns', iconPath: 'assets/items/wp_thorns.png', name: '쏜즈', category: '마법사 완드', type: 'weapon', weaponType: 'staff', reqLevel: 48, atk: 52, int: 4, upgradeSlots: 7, icon: '🌿', desc: '장미 가시의 마력이 깃든 강력한 마법 완드입니다.', color: '#e11d48' },
    { id: 'wp_evil_wings', iconPath: 'assets/items/wp_evil_wings.png', name: '이블윙즈', category: '마법사 완드', type: 'weapon', weaponType: 'staff', reqLevel: 65, atk: 65, int: 6, upgradeSlots: 7, icon: '🦇', desc: '박쥐 날개 모양의 요사스러운 마력이 깃든 클래식 명품 완드입니다.', color: '#a855f7' },
    { id: 'wp_caig', iconPath: 'assets/items/wp_caig.png', name: '케이그', category: '마법사 완드', type: 'weapon', weaponType: 'staff', reqLevel: 88, atk: 78, int: 7, upgradeSlots: 7, icon: '🔮', desc: '심연의 마력을 증폭시키는 대마법사의 전설 지팡이입니다.', color: '#7c3aed' },
    { id: 'wp_dragon_wand', iconPath: 'assets/items/wp_dragon_wand.png', name: '드래곤 완드', category: '마법사 완드', type: 'weapon', weaponType: 'staff', reqLevel: 110, atk: 90, int: 9, upgradeSlots: 7, icon: '🐉', desc: '드래곤의 심장 보석이 박혀 무한한 마력을 뿜어내는 완드입니다.', color: '#ec4899' }
  ],
  helmets: [
    { id: 'helm_brown_bamboo', iconPath: 'assets/items/helm_brown_bamboo.png', name: '갈색 삿갓', category: '공용 모자', type: 'helmet', reqLevel: 10, def: 5, luk: 3, upgradeSlots: 7, icon: '👒', desc: '초반 도적과 모험가들의 영원한 명품 삿갓입니다.', color: '#b45309' },
    { id: 'helm_bone_helm', iconPath: 'assets/items/helm_bone_helm.png', name: '본헬름', category: '공용 모자', type: 'helmet', reqLevel: 35, def: 18, spd: 8, jump: 5, upgradeSlots: 7, icon: '💀', desc: '해골 뼈로 제작되어 이동속도를 비약적으로 상승시키는 명품 투구입니다.', color: '#e2e8f0' },
    { id: 'helm_maple_hat', iconPath: 'assets/items/helm_maple_hat.png', name: '메이플 모자', category: '공용 모자', type: 'helmet', reqLevel: 50, def: 35, str: 3, dex: 3, int: 3, luk: 3, upgradeSlots: 7, icon: '🍁', desc: '메이플 단풍잎 문양이 수놓아진 축제의 모자입니다.', color: '#ef4444' },
    { id: 'helm_zakum', iconPath: 'assets/items/helm_zakum.png', name: '자쿰의 투구', category: '공용 모자', type: 'helmet', reqLevel: 100, def: 75, str: 15, dex: 15, int: 15, luk: 15, upgradeSlots: 10, icon: '👑', desc: '고대 거신 자쿰을 쓰러뜨린 영웅의 절대적인 상징 투구입니다.', color: '#f59e0b' }
  ],
  overalls: [
    { id: 'top_blue_tunic', iconPath: 'assets/items/top_blue_tunic.png', name: '파란 튜닉', category: '전사 상의', type: 'top', reqLevel: 15, def: 12, upgradeSlots: 7, icon: '👕', desc: '활동성이 뛰어난 모험가용 가벼운 튜닉입니다.', color: '#3b82f6' },
    { id: 'bot_jean_pants', iconPath: 'assets/items/bot_jean_pants.png', name: '청바지', category: '공용 하의', type: 'bottom', reqLevel: 15, def: 10, upgradeSlots: 7, icon: '👖', desc: '질기고 튼튼한 모험가용 청바지입니다.', color: '#1d4ed8' },
    { id: 'ov_bone_armor', iconPath: 'assets/items/ov_bone_armor.png', name: '본 아머', category: '공용 전신', type: 'overall', reqLevel: 30, def: 35, str: 2, dex: 1, upgradeSlots: 10, icon: '🦺', desc: '뼈를 엮어 만든 가볍고 견고한 전신 갑옷입니다.', color: '#94a3b8' },
    { id: 'ov_sauna_robe', iconPath: 'assets/items/ov_sauna_robe.png', name: '사우나 가운', category: '공용 전신', type: 'overall', reqLevel: 50, def: 20, spd: 10, upgradeSlots: 10, icon: '👘', desc: '슬리피우드 호텔 사우나에서 증정하는 쾌속 이동의 명품 전신옷입니다.', color: '#f8fafc' },
    { id: 'ov_dark_pirate', iconPath: 'assets/items/ov_dark_pirate.png', name: '다크 파이렛', category: '공용 전신', type: 'overall', reqLevel: 70, def: 95, str: 5, dex: 5, upgradeSlots: 10, icon: '🥋', desc: '심해의 해적 선장이 입던 고위 전신 갑옷입니다.', color: '#1e293b' },
    { id: 'ov_dragon_robe', iconPath: 'assets/items/ov_dragon_robe.png', name: '드래곤 로브', category: '공용 전신', type: 'overall', reqLevel: 100, def: 145, str: 8, dex: 8, int: 8, luk: 8, upgradeSlots: 10, icon: '🐉', desc: '용의 비늘로 제련된 최상급 궁극의 전신 갑옷입니다.', color: '#047857' }
  ],
  gloves: [
    { id: 'glv_work_glove', iconPath: 'assets/items/glv_work_glove.png', name: '노가다 목장갑', category: '공용 장갑', type: 'glove', reqLevel: 10, def: 2, upgradeSlots: 7, icon: '🧤', desc: '장갑 공격력 주문서(장공) 작을 위한 전설의 국민 목장갑입니다.', color: '#f5f5f4' },
    { id: 'glv_leather_glove', iconPath: 'assets/items/glv_leather_glove.png', name: '가죽 장갑', category: '공용 장갑', type: 'glove', reqLevel: 40, def: 15, atk: 1, upgradeSlots: 7, icon: '🥊', desc: '단단한 가죽으로 손을 보호하는 전투용 장갑입니다.', color: '#78350f' },
    { id: 'glv_dark_cleave', iconPath: 'assets/items/glv_dark_cleave.png', name: '다크 클리브', category: '전사 장갑', type: 'glove', reqLevel: 70, def: 35, atk: 3, str: 3, upgradeSlots: 7, icon: '🧤', desc: '칠흑의 암흑 철판이 덧대어진 상급 전투 장갑입니다.', color: '#334155' },
    { id: 'glv_dragon_glove', iconPath: 'assets/items/glv_dragon_glove.png', name: '드래곤 글러브', category: '공용 장갑', type: 'glove', reqLevel: 100, def: 55, atk: 6, str: 4, dex: 4, int: 4, luk: 4, upgradeSlots: 7, icon: '🐲', desc: '드래곤의 발톱을 연마하여 제작된 전설의 공격 장갑입니다.', color: '#b91c1c' }
  ],
  shoes: [
    { id: 'sho_leather_boots', iconPath: 'assets/items/sho_leather_boots.png', name: '가죽 부츠', category: '공용 신발', type: 'shoe', reqLevel: 15, def: 8, spd: 3, upgradeSlots: 7, icon: '👞', desc: '부드러운 사슴 가죽으로 만들어진 기본 부츠입니다.', color: '#854d0e' },
    { id: 'sho_snow_shoes', iconPath: 'assets/items/sho_snow_shoes.png', name: '아이젠', category: '공용 신발', type: 'shoe', reqLevel: 30, def: 20, spd: 5, upgradeSlots: 7, icon: '👟', desc: '설원에서도 미끄러지지 않는 미끄럼 방지 쇠발톱 신발입니다.', color: '#0284c7' },
    { id: 'sho_wing_boots', iconPath: 'assets/items/sho_wing_boots.png', name: '윙 부츠', category: '공용 신발', type: 'shoe', reqLevel: 60, def: 40, spd: 10, jump: 5, upgradeSlots: 7, icon: '🥾', desc: '바람의 정령 날개가 달려 도약력이 강화된 신발입니다.', color: '#10b981' },
    { id: 'sho_dragon_boots', iconPath: 'assets/items/sho_dragon_boots.png', name: '드래곤 부츠', category: '공용 신발', type: 'shoe', reqLevel: 100, def: 65, spd: 12, jump: 8, str: 4, dex: 4, int: 4, luk: 4, upgradeSlots: 7, icon: '🐉', desc: '대지를 박차고 하늘을 날아오를 듯한 궁극의 드래곤 부츠입니다.', color: '#7c3aed' }
  ],
  capes: [
    { id: 'cape_ragged', iconPath: 'assets/items/cape_ragged.png', name: '허름한 망토', category: '공용 망토', type: 'cape', reqLevel: 25, def: 5, avoid: 10, upgradeSlots: 5, icon: '🧣', desc: '다소 낡았지만 몸을 가려주는 은밀한 망토입니다.', color: '#71717a' },
    { id: 'cape_icarus', iconPath: 'assets/items/cape_icarus.png', name: '이카루스의 망토', category: '공용 망토', type: 'cape', reqLevel: 42, def: 15, spd: 10, jump: 5, upgradeSlots: 5, icon: '🪽', desc: '하늘을 날고 싶어 하던 이카루스의 꿈이 담긴 명품 망토입니다.', color: '#38bdf8' },
    { id: 'cape_goblin', iconPath: 'assets/items/cape_goblin.png', name: '도깨비 망토', category: '공용 망토', type: 'cape', reqLevel: 70, def: 35, str: 3, dex: 3, int: 3, luk: 3, upgradeSlots: 7, icon: '🦹', desc: '도깨비의 신비한 마력이 서린 고급 망토입니다.', color: '#e11d48' }
  ],
  shields: [
    { id: 'shd_pan_lid', iconPath: 'assets/items/shd_pan_lid.png', name: '냄비 뚜껑', category: '공용 방패', type: 'shield', reqLevel: 10, def: 10, upgradeSlots: 7, icon: '🍳', desc: '초록버섯이 떨구는 전설의 가성비 냄비 뚜껑 방패입니다.', color: '#64748b' },
    { id: 'shd_wood_tower', iconPath: 'assets/items/shd_wood_tower.png', name: '우드 타워실드', category: '전사 방패', type: 'shield', reqLevel: 30, def: 25, hp: 50, upgradeSlots: 7, icon: '🛡️', desc: '단단한 참나무로 짠 거대한 수호 방패입니다.', color: '#92400e' },
    { id: 'shd_maple_shield', iconPath: 'assets/items/shd_maple_shield.png', name: '메이플 실드', category: '공용 방패', type: 'shield', reqLevel: 70, def: 45, atk: 2, upgradeSlots: 10, icon: '🛡️', desc: '모든 직업이 착용할 수 있는 축제의 만능 메이플 방패입니다.', color: '#ea580c' }
  ]
};
window.MAPLE_EQUIPMENT_CATALOG = MAPLE_EQUIPMENT_CATALOG;

// 100% Separated Coordi Closet Catalog (0% Combat Stat Impact, Pure Visual Customization)
const MAPLE_COORDI_CATALOG = {
  hat: [
    { id: 'hat_transparent', slot: 'hat', name: '투명 모자', icon: '✨', color: '#38bdf8', desc: '모자 외형을 숨기고 헤어스타일을 깔끔하게 드러냅니다.' },
    { id: 'hat_crown', slot: 'hat', name: '메이플 골드 크라운', icon: '👑', color: '#f59e0b', desc: '황금빛 루비가 박힌 클래식 메이플 왕관 코디입니다.' },
    { id: 'hat_mushcap', slot: 'hat', name: '주황버섯 인형 모자', icon: '🍄', iconPath: 'assets/items/mushroom_cap.png', color: '#ea580c', desc: '귀여운 주황버섯 도트 감성의 푹신한 인형 모자입니다.' },
    { id: 'hat_bandana', slot: 'hat', name: '모험가 빨간 두건', icon: '🧣', color: '#ef4444', desc: '헤네시스 모험가의 정통 붉은 머리띠 코디입니다.' },
    { id: 'hat_star_ribbon', slot: 'hat', name: '별빛 리본 머리핀', icon: '🎀', iconPath: 'assets/items/ribbon.png', color: '#ec4899', desc: '반짝이는 별 장식이 달린 핑크 리본입니다.' }
  ],
  face: [
    { id: 'face_blush', slot: 'faceAcc', name: '발그레 복숭아 홍조', icon: '🍑', color: '#f472b6', desc: '양 볼을 사랑스럽게 물들이는 핑크빛 홍조입니다.' },
    { id: 'face_leaf', slot: 'faceAcc', name: '단풍잎 물기', icon: '🍁', color: '#dc2626', desc: '입가에 붉은 단풍잎을 물고 있는 낭만 코디입니다.' },
    { id: 'eye_sunglasses', slot: 'eyeAcc', name: '블랙 쿨 선글라스', icon: '🕶️', color: '#1e293b', desc: '자유시장 인싸들의 필수 블랙 선글라스입니다.' },
    { id: 'eye_star_patch', slot: 'eyeAcc', name: '샤이닝 스타 안대', icon: '⭐', color: '#eab308', desc: '황금 별 모양 포인트 안대입니다.' }
  ],
  clothes: [
    { id: 'clothes_hoodie', slot: 'clothes', name: '헤네시스 개나리 후드티', icon: '👕', color: '#facc15', desc: '산뜻한 노란색 캐주얼 후드 코디입니다.' },
    { id: 'clothes_royal', slot: 'clothes', name: '오르비스 로얄 코트', icon: '🧥', color: '#2563eb', desc: '고풍스러운 금장 푸른 제복 코트입니다.' },
    { id: 'clothes_school', slot: 'clothes', name: '메이플 아카데미 교복', icon: '👔', color: '#475569', desc: '단정한 클래식 아카데미 교복입니다.' }
  ],
  cape: [
    { id: 'cape_angel_wings', iconPath: 'assets/items/cape_angel_wings.png', slot: 'cape', name: '세라핌 천사의 날개', icon: '🪽', color: '#38bdf8', desc: '등 뒤에서 순백의 빛을 내뿜는 천사 날개입니다.' },
    { id: 'cape_icarus', iconPath: 'assets/items/cape_icarus.png', slot: 'cape', name: '이카루스의 푸른 망토', icon: '🧣', color: '#0284c7', desc: '바람을 가르는 하늘빛 명품 망토입니다.' },
    { id: 'cape_balrog_wings', iconPath: 'assets/items/cape_balrog_wings.png', slot: 'cape', name: '발록의 칠흑 날개', icon: '🦇', color: '#7f1d1d', desc: '심연의 마력이 깃든 다크 드래곤 윙입니다.' }
  ],
  weaponSkin: [
    { id: 'ws_transparent', slot: 'weaponSkin', name: '투명 무기', icon: '🫧', color: '#94a3b8', desc: '무기 외형을 숨겨 깔끔한 맨손 코디를 연출합니다.' },
    { id: 'ws_rose', slot: 'weaponSkin', name: '정열의 붉은 장미', icon: '🌹', color: '#e11d48', desc: '공격할 때마다 꽃잎 향기가 흩날리는 장미 코디 무기입니다.' },
    { id: 'ws_flame_katana', slot: 'weaponSkin', name: '홍련의 화염도', icon: '🔥', color: '#ea580c', desc: '타오르는 붉은 검기를 두른 코디용 명검입니다.' },
    { id: 'ws_star_wand', slot: 'weaponSkin', name: '별빛 요술봉', icon: '🪄', iconPath: 'assets/projectiles/stars/ultimate_icon.png', color: '#a855f7', desc: '황금 별빛이 반짝이는 마법봉 스킨입니다.' }
  ]
};
const BOSS_RAID_CATALOG = [
  {
    type: 'mano',
    name: '마노',
    title: '달팽이들의 무지개 군주',
    level: 20,
    hp: 2500,
    atk: 55,
    def: 35,
    exp: 1200,
    tier: '필드 보스',
    tierColor: '#22c55e',
    lairMap: 'henesys_hhg',
    lairName: '헤네시스 사냥터1',
    trophyId: 'trophy_mano',
    trophyName: '무지개빛 달팽이 껍질',
    gimmickDesc: '🌈 무지개 재생 치유(HP 회복) · 꼬마 달팽이 호위대 소환 · 충격파'
  },
  {
    type: 'stumpy',
    name: '스텀피',
    title: '페리온 고원의 고목 괴수',
    level: 35,
    hp: 6000,
    atk: 115,
    def: 65,
    exp: 2400,
    tier: '필드 보스',
    tierColor: '#84cc16',
    lairMap: 'perion_boar',
    lairName: '와일드보어의 땅',
    trophyId: 'trophy_stumpy',
    trophyName: '고목나무의 심장',
    gimmickDesc: '🪓 고목 대지진 충격파 (점프 회피) · 다크 엑스스텀프 소환'
  },
  {
    type: 'king_slime',
    name: '킹슬라임',
    title: '파티퀘스트 거대 슬라임 왕',
    level: 40,
    hp: 8000,
    atk: 160,
    def: 75,
    exp: 3600,
    tier: '돌파 1단계 보스',
    tierColor: '#10b981',
    lairMap: 'kerning_pq',
    lairName: '첫번째 동행: 킹슬라임의 방',
    trophyId: 'trophy_king_slime',
    trophyName: '물컹물컹한 왕관 (무기 1단계 돌파)',
    gimmickDesc: '💧 슈퍼 점프 대지진 · 버블링 분열 소환 · 점액 탄성 충격파'
  },
  {
    type: 'faust',
    name: '파우스트',
    title: '엘리니아 악령의 숲 지배자',
    level: 50,
    hp: 18000,
    atk: 185,
    def: 110,
    exp: 6500,
    tier: '필드 보스',
    tierColor: '#a855f7',
    lairMap: 'ellinia',
    lairName: '엘리니아 마법도서관 외곽',
    trophyId: 'trophy_faust',
    trophyName: '악령의 원숭이 인형',
    gimmickDesc: '⚡ 숲의 저주 낙뢰 · 맹독 암흑 안개 생성 · 커즈아이 소환'
  },
  {
    type: 'mushmom',
    name: '머쉬맘',
    title: '버섯 동산의 거대 여왕',
    level: 60,
    hp: 4500,
    atk: 75,
    def: 80,
    exp: 12000,
    tier: '돌파 2단계 보스',
    tierColor: '#f97316',
    lairMap: 'henesys_hhg',
    lairName: '헤네시스 사냥터1',
    trophyId: 'trophy_mushmom',
    trophyName: '거대 버섯의 포자 (무기 2단계 돌파)',
    gimmickDesc: '🍄 전체 포자 대지진 (착지 순간 점프 회피 필수) · 냄비 뚜껑 드롭'
  },
  {
    type: 'dyle',
    name: '다일',
    title: '방황의 늪 거대 악어 군주',
    level: 65,
    hp: 35000,
    atk: 240,
    def: 145,
    exp: 18000,
    tier: '필드 보스',
    tierColor: '#14b8a6',
    lairMap: 'kerning_subway',
    lairName: '지하철 1호선 2구역',
    trophyId: 'trophy_dyle',
    trophyName: '늪지대 악어의 가죽',
    gimmickDesc: '🐊 맹렬한 초고속 돌진 물어뜯기 · 늪지 수압 파동포'
  },
  {
    type: 'zombie_mushmom',
    name: '좀비머쉬맘',
    title: '개미굴 심연의 부패한 여왕',
    level: 65,
    hp: 42000,
    atk: 255,
    def: 150,
    exp: 22000,
    tier: '돌파 3단계 보스',
    tierColor: '#9333ea',
    lairMap: 'ant_tunnel',
    lairName: '개미굴 광장',
    trophyId: 'trophy_zombie_mushmom',
    trophyName: '부식된 죽은 포자 (무기 3단계 돌파)',
    gimmickDesc: '☠️ 맹독 포자 구름 살포 · 언데드 좀비버섯 소환 · 부패 대지진'
  },
  {
    type: 'jr_balrog',
    name: '주니어 발록',
    title: '저주받은 신전의 마왕',
    level: 80,
    hp: 50000,
    atk: 280,
    def: 160,
    exp: 45000,
    tier: '돌파 4단계 보스',
    tierColor: '#ef4444',
    lairMap: 'sleepy_dungeon',
    lairName: '슬리피우드 저주받은 신전',
    trophyId: 'trophy_jr_balrog',
    trophyName: '지옥의 붉은 가죽 (무기 4단계 돌파)',
    gimmickDesc: '🔥 메테오 화염 기둥 · 지옥 낙뢰 소환 · 일비표창 드롭'
  },
  {
    type: 'crimson_balrog',
    name: '크림슨 발록',
    title: '오르비스 항로 하늘의 사신',
    level: 100,
    hp: 100000,
    atk: 420,
    def: 320,
    exp: 95000,
    tier: '돌파 6단계 레이드',
    tierColor: '#dc2626',
    lairMap: 'ship_orbis',
    lairName: '오르비스행 비행선 갑판',
    trophyId: 'trophy_crimson_balrog',
    trophyName: '홍련의 악마 날개 (무기 6단계 돌파)',
    gimmickDesc: '☄️ 3연속 홍련의 심판 화염기둥 · 천공 낙뢰 · 혼돈의 주문서 드롭'
  },
  {
    type: 'manon',
    name: '마뇽',
    title: '폐광 심연의 붉은 와이번 제왕',
    level: 105,
    hp: 120000,
    atk: 450,
    def: 340,
    exp: 130000,
    tier: '심연 레이드 보스',
    tierColor: '#0284c7',
    lairMap: 'el_nath_deadmine',
    lairName: '엘나스 폐광 시련의 동굴',
    trophyId: 'trophy_manon',
    trophyName: '마뇽의 울음소리 비늘',
    gimmickDesc: '🐉 드래곤 파이어 브레스 · 용의 포효 충격파 · 화염 기둥'
  },
  {
    type: 'papulatus',
    name: '파풀라투스',
    title: '시계탑 최하층 차원의 균열 지배자',
    level: 125,
    hp: 160000,
    atk: 520,
    def: 380,
    exp: 260000,
    tier: '시계탑 군단 보스',
    tierColor: '#6366f1',
    lairMap: 'ludi_clocktower',
    lairName: '시계탑 최하층: 잊혀진 시간의 길',
    trophyId: 'trophy_papulatus',
    trophyName: '차원의 균열 조각',
    gimmickDesc: '⏰ 차원의 시한폭탄 설치 · 시공간 균열 레이저 · 동면 자가치유'
  },
  {
    type: 'zakum',
    name: '자쿰 (8팔+본체)',
    title: '폐광 제단의 고대 화염 거신',
    level: 140,
    hp: 220000,
    atk: 85,
    def: 40,
    exp: 450000,
    tier: '돌파 5단계 고대신',
    tierColor: '#eab308',
    lairMap: 'zakum_altar',
    lairName: '자쿰의 제단',
    trophyId: 'trophy_zakum',
    trophyName: '자쿰의 불꽃 다이아 (무기 5단계 돌파)',
    gimmickDesc: '👑 8팔 독립 부위파괴 페이즈 · HP/MP 1/1 저주 마법진 · 자쿰의 투구'
  },
  {
    type: 'horntail',
    name: '혼테일',
    title: '생명의 동굴 최종 신화 암흑 삼두용',
    level: 160,
    hp: 250000,
    atk: 620,
    def: 450,
    exp: 1500000,
    tier: '돌파 6단계 최종신화',
    tierColor: '#38bdf8',
    lairMap: 'horntail_cave',
    lairName: '생명의 동굴: 혼테일의 동굴',
    trophyId: 'trophy_horntail',
    trophyName: '혼테일의 삼두용 비늘 (무기 6단계 돌파)',
    gimmickDesc: '🐲 삼두용 원소 대재앙(화염·빙결·전격 브레스) · 암흑 메테오 · 대지진'
  },
  {
    type: 'pianus',
    name: '피아누스',
    title: '아쿠아로드 심해의 고대 심해어 군주',
    level: 110,
    hp: 180000,
    atk: 580,
    def: 420,
    exp: 1400000,
    tier: '심해 레이드 보스',
    tierColor: '#0ea5e9',
    lairMap: 'pianus_cave',
    lairName: '피아누스의 동굴',
    trophyId: 'trophy_pianus',
    trophyName: '피아누스의 비늘 (무기 5단계 돌파 가능)',
    gimmickDesc: '🐟 1/1 레이저 포격 · 심해 낙석(스킬 봉인/암흑) · 블러드붐 소환'
  },
  {
    type: 'alishar',
    name: '알리샤르',
    title: '루디브리엄 차원의 균열 파티퀘스트 지배자',
    level: 56,
    hp: 35000,
    atk: 240,
    def: 150,
    exp: 150000,
    tier: '파티퀘스트 보스',
    tierColor: '#8b5cf6',
    lairMap: 'ludi_clocktower',
    lairName: '루디브리엄 차원의 균열',
    trophyId: 'trophy_alishar',
    trophyName: '알리샤르의 차원 파편 (무기 2단계 돌파 가능)',
    gimmickDesc: '👁️ 킹블록골렘 소환 · 버프 해제 · 시야 암흑'
  },
  {
    type: 'griffey',
    name: '그리프',
    title: '리프레 숲의 천공 와 이번 제왕',
    level: 105,
    hp: 120000,
    atk: 480,
    def: 360,
    exp: 950000,
    tier: '천공 레이드 보스',
    tierColor: '#f59e0b',
    lairMap: 'perion_boar',
    lairName: '그리프의 바위산',
    trophyId: 'trophy_griffey',
    trophyName: '그리프의 뿔 (무기 4단계 돌파 가능)',
    gimmickDesc: '⚡ 번개 폭풍 낙하 · 천공 활강 넉백'
  },
  {
    type: 'timer',
    name: '타이머',
    title: '루디브리엄 시계탑 뻐꾸기 필드 보스',
    level: 59,
    hp: 24000,
    atk: 220,
    def: 140,
    exp: 120000,
    tier: '시간 필드 보스',
    tierColor: '#06b6d4',
    lairMap: 'ludi_clocktower',
    lairName: '시간의 소용돌이',
    trophyId: 'trophy_timer',
    trophyName: '타이머의 뻐꾸기 태엽 (무기 2단계 돌파 가능)',
    gimmickDesc: '⏰ 시공간 왜곡(슬로우) · 시계 폭탄 투척'
  },
];

window.MAPLE_COORDI_CATALOG = MAPLE_COORDI_CATALOG;
window.BOSS_RAID_CATALOG = BOSS_RAID_CATALOG;


// Canonical Classic MapleStory N-th Job Advancement & Progressive Skill Evolution Tree
// [전직 단계별 공식: 1개 기존 스킬 진화 강화 + 1개 신규 시그니처 스킬 추가]
const JOB_ADVANCEMENT_SPEC = {
  // 1차 전직 (Lv.10: 초보자 -> 4대 기본 직업군)
  1: {
    minLevel: 10,
    options: [
      {
        job: '전사',
        tier: 1,
        title: '강인한 검과 투지의 수호자',
        icon: '⚔️',
        desc: '높은 체력과 강력한 근접 파괴력을 자랑하는 1차 전사',
        weaponType: 'sword',
        weaponId: 'wp_two_handed_sword',
        enhancedSkill: null,
        newSkill: { id: 'power_strike', name: '파워 스트라이크', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.8, icon: '⚔️', desc: '검을 강하게 내리쳐 단일 적에게 치명타 일격' },
        passive: { id: 'iron_body', name: '아이언 바디', icon: '🛡️', permanent: true, isPassive: true, desc: '[상시 패시브] 물리 방어력 +25 증가' }
      },
      {
        job: '마법사',
        tier: 1,
        title: '원소 마법과 공간 도약의 지배자',
        icon: '🔮',
        desc: '강력한 마력 탄환과 텔레포트 기동성을 지닌 1차 마법사',
        weaponType: 'staff',
        weaponId: 'wp_wooden_staff',
        enhancedSkill: null,
        newSkill: { id: 'magic_claw', name: '매직 클로', level: 1, maxLevel: 20, mpCost: 10, dmgMult: 1.3, hits: 2, icon: '✨', desc: '보라색 마법 손톱 2연속 할퀴기' },
        passive: { id: 'magic_guard', name: '매직 가드', icon: '💎', permanent: true, isPassive: true, desc: '[상시 패시브] 받는 피해의 80%를 MP로 대체 흡수' },
        extraSkill: { id: 'teleport', name: '텔레포트', level: 1, maxLevel: 5, mpCost: 8, icon: '🌌', desc: '바라보는 방향으로 즉시 순간이동 (점텔 가능)' }
      },
      {
        job: '궁수',
        tier: 1,
        title: '정확도와 크리티컬 저격의 달인',
        icon: '🏹',
        desc: '긴 사거리와 정밀한 조준 사격을 구사하는 1차 궁수',
        weaponType: 'bow',
        weaponId: 'wp_ryden',
        enhancedSkill: null,
        newSkill: { id: 'arrow_blow', name: '애로우 블로우', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.6, icon: '🏹', desc: '관통하는 강력한 화살 1발 발사' },
        passive: { id: 'focus', name: '포커스', icon: '👁️', permanent: true, isPassive: true, desc: '[상시 패시브] 명중률 +25 증가' }
      },
      {
        job: '도적',
        tier: 1,
        title: '표창 투척과 암습의 그림자 모험가',
        icon: '⭐',
        desc: '날렵한 기동성과 원거리 표창 투척을 구사하는 1차 도적',
        weaponType: 'claw',
        weaponId: 'wp_meba',
        enhancedSkill: null,
        newSkill: { id: 'lucky_seven', name: '럭키 세븐', level: 1, maxLevel: 30, mpCost: 0, dmgMult: 1.7, hits: 2, icon: '⭐', desc: '표창 2발 투척 (N차 전직 시 트리플/쿼드/펜타 스로우로 진화!)' },
        passive: { id: 'nimble_body', name: '님블 바디', icon: '💨', permanent: true, isPassive: true, desc: '[상시 패시브] 이동속도 4.2 & 회피율 증가' }
      }
    ]
  },
  // 2차 전직 (Lv.30: 1개 강화 + 1개 추가)
  2: {
    minLevel: 30,
    branches: {
      '전사': {
        nextJob: '파이터',
        tier: 2,
        title: '광역 검기와 투지를 각성한 2차 전사',
        icon: '⚔️',
        desc: '파워스트라이크가 슬래시블러스트로 진화하고 분노를 각성',
        weaponType: 'sword',
        weaponId: 'wp_highlander',
        enhancedSkill: { targetId: 'power_strike', newId: 'slash_blast', name: '슬래시 블러스트', level: 1, maxLevel: 20, mpCost: 8, hpCost: 4, dmgMult: 1.5, icon: '🌀', desc: '★ [1개 스킬 진화] 파워스트라이크가 360도 광역 회전 베기로 진화!' },
        newSkill: { id: 'rage', name: '분노 (Rage)', level: 1, maxLevel: 20, passive: true, icon: '🔥', desc: '★ [1개 신규 추가] [상시 패시브] 물리 공격력 +35 영구 증가' }
      },
      '마법사': {
        nextJob: '위자드',
        tier: 2,
        title: '광역 번개와 폭풍 손톱을 구사하는 2차 마법사',
        icon: '⚡',
        desc: '매직클로가 3연타로 진화하고 썬더볼트 광역기를 습득',
        weaponType: 'staff',
        weaponId: 'wp_evil_wings',
        enhancedSkill: { targetId: 'magic_claw', name: '강화 매직 클로 (3연타)', level: 10, maxLevel: 20, mpCost: 12, dmgMult: 1.6, hits: 3, icon: '✨', desc: '★ [1개 스킬 진화] 매직클로가 3연속 폭풍 손톱으로 강화 진화! (2타 → 3타)' },
        newSkill: { id: 'thunderbolt', name: '썬더볼트', level: 1, maxLevel: 30, mpCost: 20, dmgMult: 1.9, icon: '⚡', desc: '★ [1개 신규 추가] 하늘에서 번개가 쏟아지는 광역 전격!' }
      },
      '궁수': {
        nextJob: '헌터',
        tier: 2,
        title: '고속 2연사 사격술을 개화한 2차 궁수',
        icon: '🎯',
        desc: '애로우블로우가 더블샷으로 진화하고 소울애로우를 습득',
        weaponType: 'bow',
        weaponId: 'wp_ryden',
        enhancedSkill: { targetId: 'arrow_blow', newId: 'double_shot', name: '더블 샷', level: 1, maxLevel: 20, mpCost: 10, dmgMult: 1.3, hits: 2, icon: '🎯', desc: '★ [1개 스킬 진화] 단발 화살이 2발 고속 연속 발사로 진화!' },
        newSkill: { id: 'soul_arrow', name: '소울 애로우', level: 1, maxLevel: 20, passive: true, icon: '✨', desc: '★ [1개 신규 추가] [상시 패시브] 화살 영구 무한 & 물리 공격력 +15' }
      },
      '도적': {
        nextJob: '어쌔신',
        tier: 2,
        title: '트리플 스로우와 질풍의 기동성을 얻은 2차 표도',
        icon: '💨',
        desc: '럭키세븐이 3발 연속 투척으로 진화하고 헤이스트 습득',
        weaponType: 'claw',
        weaponId: 'wp_meba',
        enhancedSkill: { targetId: 'lucky_seven', name: '트리플 스로우 (럭키세븐 2차 진화)', level: 10, maxLevel: 30, mpCost: 0, dmgMult: 1.85, hits: 3, icon: '⭐', desc: '★ [1개 스킬 진화] 럭키세븐이 3발 연속 투척 트리플 스로우로 개화!' },
        newSkill: { id: 'haste', name: '헤이스트', level: 1, maxLevel: 20, passive: true, icon: '💨', desc: '★ [1개 신규 추가] [상시 패시브] 이동속도 5.6 & 사다리 등반속도 상시 극대화' }
      }
    }
  },
  // 3차 전직 (Lv.70: 1개 강화 + 1개 추가)
  3: {
    minLevel: 70,
    branches: {
      '파이터': {
        nextJob: '크루세이더',
        tier: 3,
        title: '콤보 구슬을 누적하여 궁극을 벼리는 3차 전사',
        icon: '🛡️',
        desc: '슬래시블러스트가 검기로 진화하고 콤보어택을 습득',
        weaponType: 'sword',
        weaponId: 'wp_gryunhill',
        enhancedSkill: { targetId: 'slash_blast', name: '검기 슬래시 블러스트', level: 20, maxLevel: 20, mpCost: 12, hpCost: 6, dmgMult: 2.0, icon: '🌀', desc: '★ [1개 스킬 진화] 거대한 검기 파동을 일으켜 피해량 2배 폭증!' },
        newSkill: { id: 'combo_attack', name: '콤보 어택', level: 1, maxLevel: 20, passive: true, icon: '🔮', desc: '★ [1개 신규 추가] [상시 패시브] 타격 시 콤보 구슬 누적 및 대미지 폭증' }
      },
      '위자드': {
        nextJob: '메이지',
        tier: 3,
        title: '연쇄 전격과 성스러운 축복을 내리는 3차 마법사',
        icon: '🕊️',
        desc: '썬더볼트가 체인전격으로 진화하고 홀리심볼을 습득',
        weaponType: 'staff',
        weaponId: 'wp_evil_wings',
        enhancedSkill: { targetId: 'thunderbolt', name: '체인 썬더볼트', level: 20, maxLevel: 30, mpCost: 24, dmgMult: 2.4, icon: '⚡', desc: '★ [1개 스킬 진화] 화면 전역에 연쇄 번개를 쏟아부어 대미지 폭증!' },
        newSkill: { id: 'holy_symbol', name: '홀리 심볼', level: 1, maxLevel: 30, passive: true, icon: '🕊️', desc: '★ [1개 신규 추가] [상시 패시브] 사냥 시 획득 경험치 +50% 상시 증가' }
      },
      '헌터': {
        nextJob: '레인저',
        tier: 3,
        title: '4연사 관통 사격과 폭발 화살을 구사하는 3차 궁수',
        icon: '💣',
        desc: '더블샷이 4연사 스트레이프로 진화하고 애로우밤을 습득',
        weaponType: 'bow',
        weaponId: 'wp_ryden',
        enhancedSkill: { targetId: 'double_shot', newId: 'strafe', name: '스트레이프', level: 1, maxLevel: 30, mpCost: 18, dmgMult: 1.0, hits: 4, icon: '🎯', desc: '★ [1개 스킬 진화] 4발의 연속 관통 화살을 초고속 시차 연사!' },
        newSkill: { id: 'arrow_bomb', name: '애로우 밤', level: 1, maxLevel: 30, mpCost: 16, dmgMult: 1.8, icon: '💣', desc: '★ [1개 신규 추가] 화살 폭탄이 폭발하며 광역 스턴!' }
      },
      '어쌔신': {
        nextJob: '허밋',
        tier: 3,
        title: '그림자 분신과 쿼드러플 표창을 지배하는 3차 도적',
        icon: '👥',
        desc: '럭키세븐이 4발 연속 투척으로 진화하고 쉐도우파트너 습득',
        weaponType: 'claw',
        weaponId: 'wp_meba',
        enhancedSkill: { targetId: 'lucky_seven', name: '쿼드러플 스로우 (럭키세븐 3차 진화)', level: 20, maxLevel: 30, mpCost: 0, dmgMult: 2.0, hits: 4, icon: '⭐', desc: '★ [1개 스킬 진화] 표창을 4발 연속 투척하는 쿼드러플 스로우로 진화!' },
        newSkill: { id: 'shadow_partner', name: '쉐도우 파트너', level: 1, maxLevel: 30, passive: true, icon: '👥', desc: '★ [1개 신규 추가] [상시 패시브] 붉은 그림자 분신이 50% 추가타 상시 연계' }
      }
    }
  },
  // 4차 전직 (Lv.120: 1개 강화 + 1개 추가)
  4: {
    minLevel: 120,
    branches: {
      '크루세이더': {
        nextJob: '히어로',
        tier: 4,
        title: '쾌도난마로 전장을 평정하는 4차 궁극의 전사',
        icon: '👑',
        desc: '콤보어택이 어드밴스드로 진화하고 브랜디쉬를 습득',
        weaponType: 'sword',
        weaponId: 'wp_dragon_claymore',
        enhancedSkill: { targetId: 'combo_attack', name: '어드밴스드 콤보', level: 20, maxLevel: 20, passive: true, icon: '🔮', desc: '★ [1개 스킬 진화] 콤보 구슬 최대 10개 누적 및 피해량 2.5배 폭증!' },
        newSkill: { id: 'brandish', name: '브랜디쉬', level: 1, maxLevel: 30, mpCost: 16, dmgMult: 2.2, hits: 2, icon: '⚡', desc: '★ [1개 신규 추가] 거대한 십자 검기로 2연속 쾌도난마 광역 난무!' }
      },
      '메이지': {
        nextJob: '아크메이지',
        tier: 4,
        title: '천상의 빛으로 전장을 초토화하는 4차 궁극의 마법사',
        icon: '🌟',
        desc: '텔레포트가 마스터리로 진화하고 제네시스를 습득',
        weaponType: 'staff',
        weaponId: 'wp_evil_wings',
        enhancedSkill: { targetId: 'teleport', name: '텔레포트 마스터리', level: 5, maxLevel: 5, mpCost: 6, icon: '🌌', desc: '★ [1개 스킬 진화] 순간이동 거리 대폭 증가 및 도착 지점 충격파 발생!' },
        newSkill: { id: 'genesis', name: '제네시스', level: 1, maxLevel: 30, mpCost: 35, dmgMult: 3.5, icon: '🌟', desc: '★ [1개 신규 추가] 하늘에서 성스러운 빛의 기둥 4개가 쏟아지는 최강 마법!' }
      },
      '레인저': {
        nextJob: '보우마스터',
        tier: 4,
        title: '기관총 화살 폭풍을 난사하는 4차 궁극의 궁수',
        icon: '🌪️',
        desc: '스트레이프가 극대화되고 폭풍의 시를 습득',
        weaponType: 'bow',
        weaponId: 'wp_ryden',
        enhancedSkill: { targetId: 'strafe', name: '얼티밋 스트레이프', level: 30, maxLevel: 30, mpCost: 20, dmgMult: 1.25, hits: 4, icon: '🎯', desc: '★ [1개 스킬 진화] 4연속 화살의 크리티컬 100% 확정 및 방어율 무시!' },
        newSkill: { id: 'hurricane', name: '폭풍의 시', level: 1, maxLevel: 30, mpCost: 6, dmgMult: 1.4, icon: '🌪️', desc: '★ [1개 신규 추가] 초고속으로 기관총 화살 연속 난사 궁극기!' }
      },
      '허밋': {
        nextJob: '나이트로드',
        tier: 4,
        title: '5발 펜타 표창과 암흑 풍마수리검의 4차 궁극의 표도',
        icon: '✦',
        desc: '럭키세븐이 5발 펜타로 극대화되고 어벤저를 습득',
        weaponType: 'claw',
        weaponId: 'wp_meba',
        enhancedSkill: { targetId: 'lucky_seven', name: '펜타 스로우 (럭키세븐 최종 진화)', level: 30, maxLevel: 30, mpCost: 0, dmgMult: 2.2, hits: 5, icon: '⭐', desc: '★ [1개 스킬 진화] 표창을 5발 쾌속 투척하는 펜타 스로우로 극대화!' },
        newSkill: { id: 'avenger', name: '어벤저', level: 1, maxLevel: 30, mpCost: 18, dmgMult: 1.9, icon: '🌀', desc: '★ [1개 신규 추가] 거대한 회전 암흑 수리검으로 전방의 모든 적 관통 격멸!' }
      }
    }
  }
};
window.JOB_ADVANCEMENT_SPEC = JOB_ADVANCEMENT_SPEC;

class Player {
  static MAX_LEVEL = 200;

  static BREAKTHROUGH_TIERS = [
    {
      tier: 1,
      levelRange: 'Lv.1 → Lv.10',
      nextLevel: 10,
      bossType: 'king_slime',
      bossName: '마노 / 킹슬라임',
      trophyId: 'trophy_king_slime',
      trophyIds: ['trophy_king_slime', 'trophy_mano'],
      trophyName: '물컹물컹한 왕관 / 무지개빛 달팽이 껍질',
      prefix: '말랑한',
      bonusAtk: 5,
      auraColor: '#22c55e',
      traitDesc: '크리티컬 확률 +5% · 점프력 증가',
      traits: { critRate: 0.05, jumpBonus: 0.5 }
    },
    {
      tier: 2,
      levelRange: 'Lv.10 → Lv.20',
      nextLevel: 20,
      bossType: 'mushmom',
      bossName: '스텀피 / 머쉬맘',
      trophyId: 'trophy_mushmom',
      trophyIds: ['trophy_mushmom', 'trophy_stumpy', 'trophy_alishar', 'trophy_timer'],
      trophyName: '거대 버섯의 포자 / 고목나무의 심장',
      prefix: '거대한',
      bonusAtk: 8,
      auraColor: '#f97316',
      traitDesc: '최종 대미지 +6% · 최대 HP +150',
      traits: { totalDamagePercent: 6, bonusHp: 150 }
    },
    {
      tier: 3,
      levelRange: 'Lv.20 → Lv.30',
      nextLevel: 30,
      bossType: 'zombie_mushroom',
      bossName: '파우스트 / 다일 / 좀비머쉬맘',
      trophyId: 'trophy_zombie_mushmom',
      trophyIds: ['trophy_zombie_mushmom', 'trophy_faust', 'trophy_dyle'],
      trophyName: '부식된 죽은 포자 / 악령의 인형 / 악어 가죽',
      prefix: '부식된',
      bonusAtk: 12,
      auraColor: '#a855f7',
      traitDesc: '크리티컬 대미지 +10%',
      traits: { critDamage: 0.10 }
    },
    {
      tier: 4,
      levelRange: 'Lv.30 → Lv.40',
      nextLevel: 40,
      bossType: 'jr_balrog',
      bossName: '주니어 발록',
      trophyId: 'trophy_jr_balrog',
      trophyIds: ['trophy_jr_balrog', 'trophy_griffey'],
      trophyName: '지옥의 붉은 가죽',
      prefix: '지옥의',
      bonusAtk: 18,
      auraColor: '#ef4444',
      traitDesc: '보스 몬스터 공격 시 대미지 +15% · 크리티컬 확률 +5%',
      traits: { bossDamagePercent: 15, critRate: 0.05 }
    },
    {
      tier: 5,
      levelRange: 'Lv.40 → Lv.50',
      nextLevel: 50,
      bossType: 'zakum',
      bossName: '마뇽 / 파풀라투스 / 자쿰',
      trophyId: 'trophy_zakum',
      trophyIds: ['trophy_zakum', 'trophy_manon', 'trophy_papulatus', 'trophy_pianus'],
      trophyName: '자쿰의 불꽃 다이아 / 마뇽 비늘 / 차원의 균열 조각',
      prefix: '태초의',
      bonusAtk: 28,
      auraColor: '#facc15',
      traitDesc: '물리/마법 공격력 +10% · 크리티컬 대미지 +15%',
      traits: { atkPercent: 10, critDamage: 0.15 }
    },
    {
      tier: 6,
      levelRange: 'Lv.50 → Lv.60',
      nextLevel: 60,
      bossType: 'crimson_balrog',
      bossName: '크림슨 발록 / 혼테일',
      trophyId: 'trophy_horntail',
      trophyIds: ['trophy_horntail', 'trophy_crimson_balrog'],
      trophyName: '혼테일의 삼두용 비늘 / 홍련의 악마 날개',
      prefix: '신화의',
      bonusAtk: 40,
      auraColor: '#38bdf8',
      traitDesc: '올스탯 +10% · 몬스터 방어율 무시 +20% · 공격속도 1단계 상승',
      traits: { allStatPercent: 10, ignoreDefPercent: 20, attackSpeedBonus: 0.12 }
    }
  ];

  static expRequiredForLevel(level) {
    if (level <= 1) return 50;
    if (level >= Player.MAX_LEVEL) return 0;
    // Balanced Mega-EXP Curve: 풍성한 수천~수만 단위 경험치 획득에 맞춘 쾌속 성장 곡선
    if (level < 10) {
      return Math.floor(50 + (level - 1) * 216); // Lv.1: 50, Lv.10: 2000
    } else if (level < 30) {
      return Math.floor(2000 + (level - 10) * 1150); // Lv.10: 2000, Lv.20: 13500, Lv.30: 25000
    } else if (level < 70) {
      return Math.floor(25000 + (level - 30) * 5625); // Lv.30: 25000, Lv.50: 137500, Lv.70: 250000
    } else if (level < 120) {
      return Math.floor(250000 + (level - 70) * 35000); // Lv.70: 250000, Lv.100: 1300000, Lv.120: 2000000
    } else {
      return Math.floor(2000000 + (level - 120) * 225000); // Lv.120: 2000000, Lv.140: 6500000, Lv.200: 20000000
    }
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
    this.jobTier = 0;
    this.level = 1;
    this.exp = 0;
    this.maxExp = Player.expRequiredForLevel(1);

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
    this.poseHistory = []; // Trail history for Shadow Partner and visual afterimages
    this.bossKills = {}; // Boss Hunter Encyclopedia kill tracker (13 bosses)
    this.jobTier = 0;
    this.selectedMobility = 'flash_jump'; // 'flash_jump' or 'teleport' (전직업 자유 선택 지원)

    this.walkSpeed = 3.6;
    this.jumpForce = Physics.JUMP_VELOCITY;
    this.ladderSpeed = 2.8;
    this.horizontalInput = 0;
    this.horizontalImpulseTimer = 0;
    this.weaponType = 'sword';
    this.activeStar = 'subi'; // Default base shuriken (evolves through enhancement)

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
        { item_uuid: 'eq_starter_evolving_star', id: 'star_evolving', starType: 'subi', name: '수비표창', category: '도적 표창', type: 'star', reqLevel: 10, atk: 15, count: 1000, statVariation: 0, upgradeSlots: 15, enhancements: 0, successCount: 0, equipped: true, icon: '✦', iconPath: 'assets/projectiles/stars/subi_icon.png', desc: '가장 기본적인 은빛 4각 십자 수리검 (강화 주문서로 진화 가능)', color: '#94a3b8' },
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

    // 100% Separated Coordi & Beauty State (0% Combat Stat Impact)
    const defaultCoordi = {
      skinTone: 'default',
      hairColor: '#d97706',
      eyeColor: '#1e3a8a',
      hat: null,
      faceAcc: null,
      eyeAcc: null,
      clothes: null,
      shoes: null,
      gloves: null,
      cape: null,
      weaponSkin: null
    };
    this.coordi = { ...defaultCoordi };
    this.coordiPresets = [
      { ...defaultCoordi },
      { ...defaultCoordi, hat: 'hat_crown', cape: 'cape_angel_wings', faceAcc: 'face_blush' },
      { ...defaultCoordi, hat: 'hat_bandana', eyeAcc: 'eye_sunglasses', cape: 'cape_balrog_wings', weaponSkin: 'ws_flame_katana' }
    ];
    this.activeCoordiPreset = 0;
    this.coordiCloset = Object.values(MAPLE_COORDI_CATALOG).flat().map(item => item.id);

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
    this.walkSpeed = (this.job === '어쌔신' || this.job === '시프' || this.job === '도적') ? 5.6 : (this.job === '궁수' ? 3.8 : 3.6);
    this.jumpForce = Physics.JUMP_VELOCITY;
    this.applyJobPassives();
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

  grantMilestoneRewards(level, game) {
    if (!game) return;
    const rewards = {
      10: { meso: 10000, msg: '🎉 Lv.10 달성 축하! 1차 전직 가능 & 10,000 메소 + 포션 50개 지급!', items: [{id:'red_potion', count:50}, {id:'blue_potion', count:50}] },
      20: { meso: 20000, msg: '🎉 Lv.20 달성 축하! 20,000 메소 + 무기 공격력 주문서 100% 3장 지급!', items: [{id:'scroll_atk_100', count:3}] },
      30: { meso: 50000, msg: '🎉 Lv.30 달성 축하! 2차 전직 가능 & 50,000 메소 + 장공 60% 지급!', items: [{id:'scroll_glove_atk_60', count:1}, {id:'white_potion', count:50}] },
      50: { meso: 100000, msg: '🎉 Lv.50 달성 축하! 100,000 메소 + 신이 60% + 무공 60% 2장 지급!', items: [{id:'scroll_shoe_speed_60', count:1}, {id:'scroll_atk_60', count:2}] },
      70: { meso: 300000, msg: '🎉 Lv.70 달성 축하! 3차 전직 가능 & 300,000 메소 + 혼돈의 주문서 60% 지급!', items: [{id:'scroll_chaos_60', count:1}, {id:'mana_elixir', count:50}] },
      100: { meso: 500000, msg: '🎉 Lv.100 달성 축하! 500,000 메소 + 백의 주문서 10% 2장 지급!', items: [{id:'scroll_clean_slate_10', count:2}] },
      120: { meso: 1000000, msg: '🎉 Lv.120 달성 축하! 4차 전직 가능 & 1,000,000 메소 + 혼돈의 주문서 2장 지급!', items: [{id:'scroll_chaos_60', count:2}] }
    };
    const reward = rewards[level];
    if (reward) {
      this.meso += reward.meso || 0;
      reward.items?.forEach(it => {
        const offer = (window.SHOP_ITEMS_FOR_SALE || []).find(s => s.id === it.id);
        if (offer) {
          const existing = this.inventory.use.find(u => u.id === it.id);
          if (existing) existing.count += it.count;
          else this.inventory.use.push({ ...offer, count: it.count, type: offer.itemType || 'potion' });
        }
      });
      game.spawnItemText?.(this.x, this.y - 55, reward.msg);
      game.ui?.addChat?.('system', `🎁 [레벨업 축하 보상] ${reward.msg}`);
    }
  }

  reconcileSP() {
    // 1. Calculate theoretical total earned SP
    // Base Lv.1: 3 SP, Lv.2~200: +3 SP per level.
    // Plus job advancement bonuses: 1st tier +1, 2nd tier +1, 3rd tier +1, 4th tier +3.
    const tierBonus = (this.jobTier >= 1 ? 1 : 0) +
                      (this.jobTier >= 2 ? 1 : 0) +
                      (this.jobTier >= 3 ? 1 : 0) +
                      (this.jobTier >= 4 ? 3 : 0);
    const expectedTotalSP = 3 + Math.max(0, this.level - 1) * 3 + tierBonus;

    // 2. Calculate spent SP across all skills
    let spentSP = 0;
    for (const [id, skill] of Object.entries(this.skills || {})) {
      if (skill && Number.isFinite(skill.level) && skill.level > 1) {
        spentSP += (skill.level - 1);
      }
    }

    // 3. If current SP + spentSP < expectedTotalSP, automatically refund the deficit!
    const currentTotal = (Number.isFinite(this.sp) ? this.sp : 0) + spentSP;
    if (currentTotal < expectedTotalSP) {
      const missingSP = expectedTotalSP - currentTotal;
      this.sp = (Number.isFinite(this.sp) ? this.sp : 0) + missingSP;
      console.log(`[SP INTEGRITY RESTORED] Recovered ${missingSP} SP! (Expected: ${expectedTotalSP}, Spent: ${spentSP}, Current SP: ${this.sp})`);
    } else if (!Number.isFinite(this.sp) || this.sp < 0) {
      this.sp = Math.max(0, expectedTotalSP - spentSP);
    }
    return this.sp;
  }

  resetSkillsAndRefundSP() {
    const tierBonus = (this.jobTier >= 1 ? 1 : 0) +
                      (this.jobTier >= 2 ? 1 : 0) +
                      (this.jobTier >= 3 ? 1 : 0) +
                      (this.jobTier >= 4 ? 3 : 0);
    const expectedTotalSP = 3 + Math.max(0, this.level - 1) * 3 + tierBonus;
    for (const [id, skill] of Object.entries(this.skills || {})) {
      if (skill) skill.level = 1;
    }
    this.sp = expectedTotalSP;
    this.persistProgress();
    return this.sp;
  }

  toggleMobilitySkill(game = window.game) {
    this.selectedMobility = (this.selectedMobility === 'teleport') ? 'flash_jump' : 'teleport';
    const isFJ = this.selectedMobility === 'flash_jump';
    const msg = isFJ ? '⚡ [기동 스킬 전환] 플래시 점프로 변경되었습니다!' : '🌌 [기동 스킬 전환] 텔레포트(점텔 가능)로 변경되었습니다!';
    window.audio?.playFlashJump?.();
    game?.spawnItemText?.(this.x, this.y - 45, isFJ ? '⚡ 플래시 점프 선택!' : '🌌 텔레포트 선택!');
    game?.ui?.addChatMessage?.('시스템', msg, 'system');

    // Update quickslot binding for mobility slot (swap flash_jump <-> teleport)
    if (this.quickslotBindings && Array.isArray(this.quickslotBindings)) {
      for (let i = 0; i < this.quickslotBindings.length; i++) {
        if (this.quickslotBindings[i] === 'flash_jump' && !isFJ) {
          this.quickslotBindings[i] = 'teleport';
        } else if (this.quickslotBindings[i] === 'teleport' && isFJ) {
          this.quickslotBindings[i] = 'flash_jump';
        }
      }
    }
    game?.ui?.updateQuickslotsForJob?.(this.job);
    game?.ui?.updateSkillsWindow?.();
    this.persistProgress(game);
    return this.selectedMobility;
  }

  initSkillsForJob(job) {
    // Preserve any existing skill levels across job transitions/reloads!
    const existingSkills = {};
    if (this.skills) {
      for (const [id, s] of Object.entries(this.skills)) {
        if (s && Number.isFinite(s.level) && s.level > 0) existingSkills[id] = s.level;
      }
    }

    const warriorJobs = ['전사', '검사', '파이터', '크루세이더', '히어로'];
    const magicianJobs = ['마법사', '매지션', '위자드', '메이지', '아크메이지'];
    const bowmanJobs = ['궁수', '아처', '헌터', '레인저', '보우마스터'];
    const thiefJobs = ['도적', '로그', '어쌔신', '허밋', '나이트로드'];
    const banditJobs = ['시프', '시프마스터', '섀도어'];

    if (warriorJobs.includes(job)) {
      this.skills = {
        power_strike: { name: '파워 스트라이크', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.8, icon: '⚔️', desc: '검을 강하게 내리쳐 단일 적에게 치명타 일격' },
        slash_blast: { name: '슬래시 블러스트', level: 1, maxLevel: 20, mpCost: 10, hpCost: 6, dmgMult: 1.4, icon: '🌀', desc: '360도 회전 베기 주변 적 타격' },
        brandish: { name: '브랜디쉬', level: 1, maxLevel: 30, mpCost: 16, dmgMult: 2.2, hits: 2, icon: '⚡', desc: '거대한 십자 검기로 2연속 쾌도난마!' },
        panic: { name: '패닉', level: 1, maxLevel: 30, mpCost: 20, dmgMult: 3.5, icon: '💥', desc: '콤보 구슬을 소모하여 치명적 단타와 암흑 부여!' },
        coma: { name: '코마', level: 1, maxLevel: 30, mpCost: 22, dmgMult: 2.2, icon: '💫', desc: '콤보 구슬을 소모하여 최대 6체의 적에게 광역 기절 폭발!' },
        dragon_buster: { name: '드래곤 버스터', level: 1, maxLevel: 30, mpCost: 16, dmgMult: 1.7, hits: 3, icon: '🔱', desc: '창 끝으로 전방 3마리를 초고속 3연속 찌르기!' },
        dragon_roar: { name: '드래곤 로어', level: 1, maxLevel: 30, mpCost: 35, hpCost: 30, dmgMult: 2.6, icon: '🐉', desc: '체력을 소모하여 전 화면에 용의 포효 작렬 및 3초 스턴!' },
        sanctuary: { name: '생츄어리', level: 1, maxLevel: 30, mpCost: 50, dmgMult: 3.8, icon: '✝️', desc: '거대한 신성 망치를 지면에 내리꽂아 전 화면 15체 궤멸!' },
        iron_body: { name: '아이언 바디', level: 1, maxLevel: 10, passive: true, icon: '🛡️', desc: '[패시브] 물리 방어력 +25 상시 증가' },
        rage: { name: '분노 (Rage)', level: 1, maxLevel: 20, passive: true, icon: '🔥', desc: '[패시브] 물리 공격력 +35 상시 증가' },
        combo_attack: { name: '콤보 어택', level: 1, maxLevel: 20, passive: true, icon: '🔮', desc: '[패시브] 타격 시 콤보 충전 및 대미지 증폭' },
        recovery: { name: '회복력 향상', level: 1, maxLevel: 10, passive: true, icon: '❤️', desc: '[패시브] 주기적으로 HP 자동 회복' }
      };
      this.weaponType = 'sword';
      this.walkSpeed = 3.6;
    } else if (magicianJobs.includes(job)) {
      this.skills = {
        energy_bolt: { name: '에너지 볼트', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.3, icon: '🔮', desc: '비전 마법 탄환 전방 발사' },
        magic_claw: { name: '매직 클로', level: 1, maxLevel: 20, mpCost: 10, dmgMult: 1.3, hits: 2, icon: '✨', desc: '보라색 마법 손톱 2연속 할퀴기' },
        thunderbolt: { name: '썬더볼트', level: 1, maxLevel: 30, mpCost: 20, dmgMult: 1.9, icon: '⚡', desc: '하늘에서 번개가 쏟아지는 광역 전격!' },
        cold_beam: { name: '콜드 빔', level: 1, maxLevel: 30, mpCost: 16, dmgMult: 2.2, icon: '❄️', desc: '수빙 기둥을 낙하시켜 단일 적 확정 3.5초 동결 타격!' },
        ice_strike: { name: '아이스 스트라이크', level: 1, maxLevel: 30, mpCost: 26, dmgMult: 2.1, icon: '🧊', desc: '지면에서 거대한 빙산 폭발을 일으켜 6체 동결 광역기!' },
        chain_lightning: { name: '체인 라이트닝', level: 1, maxLevel: 30, mpCost: 28, dmgMult: 2.4, icon: '⚡', desc: '첫 적 적중 후 주변 5체로 번개가 연쇄 전이되는 전설의 마법!' },
        meteor: { name: '메테오', level: 1, maxLevel: 30, mpCost: 55, dmgMult: 3.6, icon: '☄️', desc: '하늘에서 거대 운석군이 낙하하는 불·독 궁극 광역기!' },
        blizzard: { name: '블리자드', level: 1, maxLevel: 30, mpCost: 55, dmgMult: 3.6, icon: '🌨️', desc: '전 화면을 절대영도로 얼려버리는 썬·콜 궁극 광역기!' },
        heal: { name: '힐 (Heal)', level: 1, maxLevel: 30, mpCost: 18, icon: '✝️', desc: '자신 HP 35% 치유 및 주변 언데드 몬스터 성속성 타격!' },
        genesis: { name: '제네시스', level: 1, maxLevel: 30, mpCost: 35, dmgMult: 3.5, icon: '🌟', desc: '하늘에서 성스러운 빛의 기둥 4개가 쏟아지는 최강 마법!' },
        magic_guard: { name: '매직 가드', level: 1, maxLevel: 20, passive: true, icon: '💎', desc: '[패시브] 받는 피해의 80%를 MP로 상시 대체 흡수' },
        holy_symbol: { name: '홀리 심볼', level: 1, maxLevel: 30, passive: true, icon: '🕊️', desc: '[패시브] 사냥 시 획득 경험치 +50% 상시 증가' },
        recovery: { name: '회복력 향상', level: 1, maxLevel: 10, passive: true, icon: '❤️', desc: '[패시브] MP 자동 회복량 증가' }
      };
      this.weaponType = 'staff';
      this.walkSpeed = 3.6;
    } else if (bowmanJobs.includes(job)) {
      this.skills = {
        arrow_blow: { name: '애로우 블로우', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.6, icon: '🏹', desc: '관통하는 강력한 화살 1발' },
        double_shot: { name: '더블 샷', level: 1, maxLevel: 20, mpCost: 10, dmgMult: 1.25, hits: 2, icon: '🎯', desc: '화살 2발을 고속 연속 발사' },
        iron_arrow: { name: '아이언 애로우', level: 1, maxLevel: 30, mpCost: 16, dmgMult: 1.8, icon: '🏹', desc: '강철 화살로 최대 6마리의 적을 일렬로 관통!' },
        piercing: { name: '피어싱', level: 1, maxLevel: 30, mpCost: 26, dmgMult: 2.0, icon: '🎯', desc: '관통할 때마다 대미지가 1.2배씩 폭증하는 신궁의 관통포!' },
        sniping: { name: '스나이핑', level: 1, maxLevel: 30, mpCost: 35, dmgMult: 10.0, icon: '👁️', desc: '일반 몬스터 100% 즉사 판정, 보스에게 극딜을 꽂는 일격필살 저격!' },
        arrow_bomb: { name: '애로우 밤', level: 1, maxLevel: 30, mpCost: 16, dmgMult: 1.8, icon: '💣', desc: '화살 폭탄이 폭발하며 광역 스턴!' },
        arrow_rain: { name: '에로우 레인', level: 1, maxLevel: 30, mpCost: 22, dmgMult: 1.9, icon: '🌧️', desc: '하늘 높이 화살을 쏘아 올려 머리 위로 화살비를 쏟아붓는 광역기!' },
        strafe: { name: '스트레이프', level: 1, maxLevel: 30, mpCost: 20, dmgMult: 0.9, hits: 4, icon: '🎯', desc: '황금 화살 4발을 초고속 시차 연사!' },
        hurricane: { name: '폭풍의 시', level: 1, maxLevel: 30, mpCost: 6, dmgMult: 1.4, icon: '🌪️', desc: '초고속으로 기관총 화살 난사!' },
        sharp_eyes: { name: '샤프 아이즈', level: 1, maxLevel: 30, passive: true, icon: '🦅', desc: '[패시브] 크리티컬 확률 +15%, 크리 대미지 +40% 상시 증가' },
        focus: { name: '포커스', level: 1, maxLevel: 10, passive: true, icon: '👁️', desc: '[패시브] 명중률 +25 상시 증가' },
        soul_arrow: { name: '소울 애로우', level: 1, maxLevel: 20, passive: true, icon: '✨', desc: '[패시브] 화살 영구 무한 & 물리 공격력 +15' },
        recovery: { name: '회복력 향상', level: 1, maxLevel: 10, passive: true, icon: '❤️', desc: '[패시브] HP/MP 주기적 회복' }
      };
      this.weaponType = 'bow';
      this.walkSpeed = 3.8;
    } else if (thiefJobs.includes(job)) {
      this.skills = {
        lucky_seven: { name: '럭키 세븐', level: 1, maxLevel: 30, mpCost: 0, dmgMult: 1.7, hits: 2, icon: '⭐', desc: '표창 투척기 (Lv.10 트리플, Lv.20 쿼드, Lv.30 펜타 스로우 진화)' },
        avenger: { name: '어벤저', level: 1, maxLevel: 30, mpCost: 18, dmgMult: 2.1, icon: '🌀', desc: '거대한 회전 풍마수리검으로 최대 6마리 일렬 관통!' },
        drain: { name: '드레인', level: 1, maxLevel: 30, mpCost: 14, dmgMult: 1.8, icon: '🩸', desc: '표창으로 적을 타격하고 가한 피해의 45%를 체력으로 흡혈!' },
        shadow_web: { name: '쉐도우 웹', level: 1, maxLevel: 20, mpCost: 16, dmgMult: 1.2, icon: '🕸️', desc: '그림자 거미줄로 전방 다수의 적을 5초간 제자리에 속박!' },
        dark_site: { name: '다크 사이트', level: 1, maxLevel: 10, mpCost: 8, icon: '👤', desc: '투명화 은신! 몬스터 바디 충돌 무시!' },
        triple_throw: { name: '트리플 스로우', level: 1, maxLevel: 30, mpCost: 20, dmgMult: 2.0, hits: 3, icon: '⭐⭐⭐', desc: '표창 3발을 연속 투척! (분신 연동 시 총 6발 난사)' },
        meso_explosion: { name: '메소 익스플로전', level: 1, maxLevel: 30, mpCost: 25, dmgMult: 1.6, icon: '💰', desc: '바닥에 드롭된 동전을 일거에 연쇄 폭파시켜 방어 무시 초토화!' },
        boomerang_step: { name: '부메랑 스텝', level: 1, maxLevel: 30, mpCost: 26, dmgMult: 2.8, icon: '🪃', desc: '전방 4체의 적을 순간이동하며 X자 난무 후 100% 기절!' },
        haste: { name: '헤이스트', level: 1, maxLevel: 20, passive: true, icon: '💨', desc: '[패시브] 이동속도 5.6 & 사다리 등반속도 상시 증가' },
        shadow_partner: { name: '쉐도우 파트너', level: 1, maxLevel: 30, passive: true, icon: '👥', desc: '[패시브] 붉은 그림자 분신이 50% 추가타 상시 연계' }
      };
      if (job === '도적' || job === '로그') {
        this.skills.double_stab = { name: '더블 스탭', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.3, hits: 2, icon: '🗡️', desc: '단검으로 급소 2연속 찌르기' };
        this.skills.savage_blow = { name: '새비지 블로우', level: 1, maxLevel: 30, mpCost: 18, dmgMult: 0.8, hits: 6, icon: '⚔️', desc: '시프의 상징! 단검으로 6연속 초고속 절삭 난무!' };
      }
      this.weaponType = 'claw';
      this.walkSpeed = 4.2;
    } else if (banditJobs.includes(job)) {
      this.skills = {
        double_stab: { name: '더블 스탭', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.3, hits: 2, icon: '🗡️', desc: '단검으로 급소 2연속 찌르기' },
        savage_blow: { name: '새비지 블로우', level: 1, maxLevel: 30, mpCost: 18, dmgMult: 0.8, hits: 6, icon: '⚔️', desc: '시프의 상징! 단검으로 6연속 초고속 절삭 난무!' },
        dark_site: { name: '다크 사이트', level: 1, maxLevel: 10, mpCost: 8, icon: '👤', desc: '투명화 은신! 몬스터 바디 충돌 무시!' },
        haste: { name: '헤이스트', level: 1, maxLevel: 20, passive: true, icon: '💨', desc: '[패시브] 이동속도 5.6 & 사다리 등반속도 상시 증가' },
        shadow_partner: { name: '쉐도우 파트너', level: 1, maxLevel: 30, passive: true, icon: '👥', desc: '[패시브] 붉은 그림자 분신이 50% 추가타 상시 연계' }
      };
      this.weaponType = 'dagger';
      this.walkSpeed = 4.2;
    } else {
      this.skills = {
        three_snails: { name: '달팽이 세껍질', level: 1, maxLevel: 3, mpCost: 3, dmgMult: 1.5, icon: '🐌', desc: '달팽이 껍질을 던져 원거리 타격' },
        power_strike: { name: '파워 스트라이크', level: 1, maxLevel: 20, mpCost: 6, dmgMult: 1.8, icon: '⚔️', desc: '검을 강하게 내리쳐 큰 피해' },
        slash_blast: { name: '슬래시 블러스트', level: 1, maxLevel: 20, mpCost: 8, hpCost: 4, dmgMult: 1.4, icon: '🌀', desc: '회전하며 주변 다수 타격' },
        recovery: { name: '회복력 향상', level: 1, maxLevel: 10, passive: true, icon: '❤️', desc: '[패시브] 주기적 HP/MP 자동 회복' }
      };
      this.weaponType = 'sword';
      this.walkSpeed = 3.6;
    }

    // UNIVERSAL MOBILITY SKILLS: Both Flash Jump & Teleport available to EVERY JOB!
    this.skills.flash_jump = {
      name: '플래시 점프',
      level: existingSkills.flash_jump || 1,
      maxLevel: 5,
      mpCost: 5,
      icon: '⚡',
      desc: '공중 2단 고속 도약 (전직업 기동 선택 지원)'
    };
    this.skills.teleport = {
      name: '텔레포트',
      level: existingSkills.teleport || 1,
      maxLevel: 5,
      mpCost: 8,
      icon: '🌌',
      desc: '바라보는 방향으로 즉시 순간이동 (점텔 가능, 전직업 기동 선택 지원)'
    };

    // Restore preserved skill levels
    for (const [id, lvl] of Object.entries(existingSkills)) {
      if (this.skills[id]) {
        this.skills[id].level = Math.max(lvl, this.skills[id].level || 1);
      }
    }

    this.applyJobPassives();
    this.syncSkillCosts();
    this.reconcileSP();
  }

  applyJobPassives() {
    if (!this.buffs) this.buffs = {};

    // Remove old permanent buffs that don't belong to current job
    for (const [key, b] of Object.entries(this.buffs)) {
      if (b.permanent && !b.custom) {
        delete this.buffs[key];
      }
    }

    const warriorJobs = ['전사', '검사', '파이터', '크루세이더', '히어로'];
    const magicianJobs = ['마법사', '매지션', '위자드', '메이지', '아크메이지'];
    const bowmanJobs = ['궁수', '아처', '헌터', '레인저', '보우마스터'];
    const thiefJobs = ['도적', '로그', '어쌔신', '허밋', '나이트로드', '시프', '시프마스터', '섀도어'];

    if (warriorJobs.includes(this.job)) {
      this.buffs.iron_body = { name: '아이언 바디', icon: '🛡️', permanent: true, isPassive: true, desc: '물리 방어력 +25 (상시 적용)' };
      this.buffs.rage = { name: '분노 (Rage)', icon: '🔥', permanent: true, isPassive: true, desc: '공격력 +35 (상시 적용)' };
      this.buffs.combo_attack = { name: '콤보 어택', icon: '⚔️', permanent: true, isPassive: true, desc: '타격 시 콤보 충전 (상시 적용)' };
    } else if (magicianJobs.includes(this.job)) {
      this.buffs.magic_guard = { name: '매직 가드', icon: '💎', permanent: true, isPassive: true, desc: '피격 시 80% MP 대체 (상시 적용)' };
      this.buffs.holy_symbol = { name: '홀리 심볼', icon: '🕊️', permanent: true, isPassive: true, desc: '사냥 경험치 +50% (상시 적용)' };
    } else if (bowmanJobs.includes(this.job)) {
      this.buffs.focus = { name: '포커스', icon: '👁️', permanent: true, isPassive: true, desc: '명중률 +25 (상시 적용)' };
      this.buffs.soul_arrow = { name: '소울 애로우', icon: '✨', permanent: true, isPassive: true, desc: '화살 무한 & 공격력 +15 (상시 적용)' };
    } else if (thiefJobs.includes(this.job)) {
      this.buffs.haste = { name: '헤이스트', icon: '💨', permanent: true, isPassive: true, desc: '이동속도 5.6 & 사다리 속도 (상시 적용)' };
      this.buffs.shadow_partner = { name: '쉐도우 파트너', icon: '👥', permanent: true, isPassive: true, desc: '분신 50% 추가타 (상시 적용)' };
      this.walkSpeed = 5.6;
    }
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
    let equipSpd = 0;
    let attackSpeedBonus = 0;
    let bonusCritRate = 0;
    let bonusCritDamage = 0;
    let totalDamagePercent = 0;
    let bossDamagePercent = 0;
    let atkPercent = 0;
    let allStatPercent = 0;
    let ignoreDefPercent = 0;
    let bonusHp = 0;

    if (this.inventory && this.inventory.equip) {
      this.inventory.equip.forEach(eq => {
        if (eq.equipped) {
          equipAtk += eq.atk || 0;
          equipDef += eq.def || 0;
          equipStr += eq.str || 0;
          equipDex += eq.dex || 0;
          equipInt += eq.int || 0;
          equipLuk += eq.luk || 0;
          equipSpd += eq.spd || 0;
          const canonical = Object.values(MAPLE_EQUIPMENT_CATALOG).flat().find(item => item.id === eq.id);
          const speedBonus = eq.attackSpeedBonus ?? canonical?.attackSpeedBonus ?? 0;
          attackSpeedBonus += Number.isFinite(speedBonus) ? speedBonus : 0;
          if (eq.awakenedTraits) {
            bonusCritRate += Number(eq.awakenedTraits.critRate) || 0;
            bonusCritDamage += Number(eq.awakenedTraits.critDamage) || 0;
            totalDamagePercent += Number(eq.awakenedTraits.totalDamagePercent) || 0;
            bossDamagePercent += Number(eq.awakenedTraits.bossDamagePercent) || 0;
            atkPercent += Number(eq.awakenedTraits.atkPercent) || 0;
            allStatPercent += Number(eq.awakenedTraits.allStatPercent) || 0;
            ignoreDefPercent += Number(eq.awakenedTraits.ignoreDefPercent) || 0;
            bonusHp += Number(eq.awakenedTraits.bonusHp) || 0;
          }
        }
      });
    }

    // Boss Hunter Encyclopedia Collection Bonus (per unique boss defeated)
    const uniqueBossKills = this.bossKills ? Object.values(this.bossKills).filter(v => Number(v) > 0).length : 0;
    if (uniqueBossKills > 0) {
      equipAtk += uniqueBossKills * 3;
      equipStr += uniqueBossKills * 2;
      equipDex += uniqueBossKills * 2;
      equipInt += uniqueBossKills * 2;
      equipLuk += uniqueBossKills * 2;
      bossDamagePercent += uniqueBossKills * 2;
      bonusHp += uniqueBossKills * 50;
    }

    const statMult = 1 + Math.max(0, allStatPercent) / 100;
    this.totalStr = Math.floor((this.str + equipStr) * statMult);
    this.totalDex = Math.floor((this.dex + equipDex) * statMult);
    this.totalInt = Math.floor((this.int + equipInt) * statMult);
    this.totalLuk = Math.floor((this.luk + equipLuk) * statMult);
    this.attackSpeedBonus = Math.max(0, Math.min(0.5, attackSpeedBonus));
    this.bonusCritRate = bonusCritRate;
    this.bonusCritDamage = bonusCritDamage;
    this.totalDamagePercent = totalDamagePercent;
    this.bossDamagePercent = bossDamagePercent;
    this.atkPercent = atkPercent;
    this.allStatPercent = allStatPercent;
    this.ignoreDefPercent = ignoreDefPercent;
    this.equipSpdBonus = equipSpd;

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
      this.maxHp = 150 + this.level * 35 + this.totalStr * 8;
      this.maxMp = 40 + this.level * 10 + this.totalInt * 3;
      this.minAtk = Math.max(22, Math.floor(this.totalStr * 1.8 + this.totalDex * 0.6 + this.level * 5) + equipAtk);
      this.maxAtk = Math.max(35, Math.floor(this.totalStr * 2.6 + this.totalDex * 0.9 + this.level * 7) + equipAtk);
    } else if (this.job === '마법사') {
      this.maxHp = 80 + this.level * 18 + this.totalStr * 3;
      this.maxMp = 180 + this.level * 40 + this.totalInt * 9;
      this.minAtk = Math.max(24, Math.floor(this.totalInt * 1.9 + this.totalLuk * 0.6 + this.level * 5) + equipAtk);
      this.maxAtk = Math.max(38, Math.floor(this.totalInt * 2.8 + this.totalLuk * 0.9 + this.level * 7) + equipAtk);
    } else if (this.job === '궁수') {
      this.maxHp = 100 + this.level * 22 + this.totalStr * 4;
      this.maxMp = 70 + this.level * 16 + this.totalInt * 4;
      this.minAtk = Math.max(22, Math.floor(this.totalDex * 1.8 + this.totalStr * 0.7 + this.level * 5) + equipAtk);
      this.maxAtk = Math.max(35, Math.floor(this.totalDex * 2.6 + this.totalStr * 1.0 + this.level * 7) + equipAtk);
    } else if ((this.job === '어쌔신' || this.job === '시프' || this.job === '도적')) {
      this.maxHp = 110 + this.level * 25 + this.totalStr * 4;
      this.maxMp = 80 + this.level * 18 + this.totalInt * 4;
      this.minAtk = Math.max(24, Math.floor(this.totalLuk * 1.9 + this.totalDex * 0.7 + this.level * 5) + equipAtk);
      this.maxAtk = Math.max(38, Math.floor(this.totalLuk * 2.8 + this.totalDex * 1.0 + this.level * 7) + equipAtk);
    } else {
      // Beginner baseline: Punchy & crisp (one-shot snails, 2-shot slimes)
      this.maxHp = 90 + this.level * 22 + this.totalStr * 5;
      this.maxMp = 50 + this.level * 12 + this.totalInt * 4;
      this.minAtk = Math.max(18, Math.floor(this.totalStr * 1.4 + this.totalDex * 0.6 + this.level * 4) + equipAtk);
      this.maxAtk = Math.max(28, Math.floor(this.totalStr * 2.0 + this.totalDex * 0.8 + this.level * 5) + equipAtk);
    }
    if (atkPercent > 0) {
      const atkMult = 1 + atkPercent / 100;
      this.minAtk = Math.floor(this.minAtk * atkMult);
      this.maxAtk = Math.floor(this.maxAtk * atkMult);
    }
    // The local action-RPG ruleset provides room for sustained combat across every job.
    this.maxHp = Math.max(300, Math.round(this.maxHp * 3) + bonusHp);
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
      if (eq.maxUpgradeSlots === undefined) eq.maxUpgradeSlots = eq.upgradeSlots;
      if (eq.successCount === undefined) eq.successCount = 0;
      if (eq.statVariation === undefined) eq.statVariation = 0;
      if (eq.starForce === undefined) eq.starForce = 0;
      if (eq.type === 'weapon') {
        if (eq.weaponLevel === undefined) eq.weaponLevel = 1;
        if (eq.weaponExp === undefined) eq.weaponExp = 0;
        if (eq.isBreakthroughReady === undefined) eq.isBreakthroughReady = false;
        if (eq.breakthroughTier === undefined) eq.breakthroughTier = 0;
        if (!eq.awakenedTraits) {
          eq.awakenedTraits = {
            critRate: 0,
            critDamage: 0,
            totalDamagePercent: 0,
            bossDamagePercent: 0,
            atkPercent: 0,
            allStatPercent: 0,
            ignoreDefPercent: 0,
            bonusHp: 0
          };
        }
      }
    });
  }

  // --- PILLAR 1: 100% SEPARATED COORDI CLOSET & PRESETS ---
  equipCoordi(slot, itemId, game = window.game) {
    if (!this.coordi) return false;
    let targetSlot = slot;
    if (slot === 'face') {
      if (itemId === null) {
        this.coordi.faceAcc = null;
        this.coordi.eyeAcc = null;
        if (this.coordiPresets && this.coordiPresets[this.activeCoordiPreset || 0]) {
          this.coordiPresets[this.activeCoordiPreset || 0] = { ...this.coordi };
        }
        this.persistProgress(game);
        return true;
      }
      targetSlot = String(itemId).startsWith('eye_') ? 'eyeAcc' : 'faceAcc';
    }
    const validSlots = ['hat', 'faceAcc', 'eyeAcc', 'clothes', 'shoes', 'gloves', 'cape', 'weaponSkin', 'skinTone', 'hairColor', 'eyeColor'];
    if (!validSlots.includes(targetSlot)) return false;
    if (this.coordi[targetSlot] === itemId && !['skinTone', 'hairColor', 'eyeColor'].includes(targetSlot)) {
      this.coordi[targetSlot] = null;
    } else {
      this.coordi[targetSlot] = itemId;
    }
    if (this.coordiPresets && this.coordiPresets[this.activeCoordiPreset || 0]) {
      this.coordiPresets[this.activeCoordiPreset || 0] = { ...this.coordi };
    }
    this.persistProgress(game);
    return true;
  }

  switchCoordiPreset(index, game = window.game) {
    if (!Array.isArray(this.coordiPresets) || index < 0 || index >= this.coordiPresets.length) return false;
    this.activeCoordiPreset = index;
    this.coordi = { ...this.coordiPresets[index] };
    window.audio?.playPickItem?.();
    game?.spawnItemText?.(this.x, this.y - 45, `✨ 코디 프리셋 #${index + 1} 적용 완료!`);
    this.persistProgress(game);
    return true;
  }

  // --- PILLAR 2: WEAPON MASTERY EXP & 6-TIER BOSS BREAKTHROUGH ---
  gainWeaponExp(amount = 10, game = window.game) {
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    const wp = this.inventory?.equip?.find(eq => eq.equipped && eq.type === 'weapon');
    if (!wp) return 0;
    const tier = wp.breakthroughTier || 0;
    if (tier >= Player.BREAKTHROUGH_TIERS.length) {
      wp.weaponExp = 100;
      wp.isBreakthroughReady = false;
      return 100;
    }
    if (wp.isBreakthroughReady || (wp.weaponExp || 0) >= 100) {
      wp.weaponExp = 100;
      wp.isBreakthroughReady = true;
      return 100;
    }
    wp.weaponExp = Math.min(100, Math.round(((wp.weaponExp || 0) + amount) * 10) / 10);
    if (wp.weaponExp >= 100) {
      wp.weaponExp = 100;
      wp.isBreakthroughReady = true;
      const tierCfg = Player.BREAKTHROUGH_TIERS[tier];
      game?.spawnItemText?.(this.x, this.y - 52, `🌟 [${wp.name}] 숙련도 100%! (${tierCfg.trophyName} 돌파 가능)`);
      game?.ui?.addChat?.('system', `🔥 [무기 숙련도 100%] ${wp.name}의 한계 돌파 준비가 완료되었습니다! 필요 재료: [${tierCfg.trophyName}] (${tierCfg.bossName} 드롭)`);
    }
    return wp.weaponExp;
  }

  executeWeaponBreakthrough(weapon = null, game = window.game) {
    const reject = msg => { this.say(msg); return false; };
    const target = weapon || this.inventory?.equip?.find(eq => eq.equipped && eq.type === 'weapon');
    if (!target || target.type !== 'weapon') return reject('돌파할 무기를 선택하거나 장착하세요.');
    const tierIdx = target.breakthroughTier || 0;
    const tierCfg = Player.BREAKTHROUGH_TIERS[tierIdx];
    if (!tierCfg) return reject('이미 최종 신화 단계까지 한계 돌파를 완료한 무기입니다.');
    if (!target.isBreakthroughReady && (target.weaponExp || 0) < 100) {
      return reject(`무기 숙련도가 100%여야 한계 돌파가 가능합니다. (현재 ${target.weaponExp || 0}%)`);
    }
    const allowedTrophies = Array.isArray(tierCfg.trophyIds) ? tierCfg.trophyIds : [tierCfg.trophyId];
    const trophy = this.inventory?.etc?.find(it => (allowedTrophies.includes(it.id) || it.name === tierCfg.trophyName) && it.count > 0);
    if (!trophy) {
      return reject(`[${tierCfg.trophyName}] 전리품이 필요합니다. (${tierCfg.bossName} 처치 시 획득)`);
    }

    trophy.count--;
    if (trophy.count <= 0) {
      const idx = this.inventory.etc.indexOf(trophy);
      if (idx >= 0) this.inventory.etc.splice(idx, 1);
    }

    target.breakthroughTier = tierIdx + 1;
    target.weaponLevel = tierCfg.nextLevel;
    target.weaponExp = 0;
    target.isBreakthroughReady = false;
    target.atk = (Number(target.atk) || 0) + tierCfg.bonusAtk;
    target.upgradeSlots = (Number(target.upgradeSlots) || 0) + 1;
    target.maxUpgradeSlots = (Number(target.maxUpgradeSlots) || 7) + 1;
    target.auraColor = tierCfg.auraColor;

    const baseName = String(target.name || '무기').replace(/^\[[^\]]+\]\s*/, '');
    target.name = `[${tierCfg.prefix}] ${baseName}`;

    if (!target.awakenedTraits) {
      target.awakenedTraits = { critRate: 0, critDamage: 0, totalDamagePercent: 0, bossDamagePercent: 0, atkPercent: 0, allStatPercent: 0, ignoreDefPercent: 0, bonusHp: 0 };
    }
    for (const [k, v] of Object.entries(tierCfg.traits || {})) {
      if (k === 'attackSpeedBonus') {
        target.attackSpeedBonus = (Number(target.attackSpeedBonus) || 0) + v;
      } else if (k === 'jumpBonus') {
        this.jumpForce = Math.min(-9.8, Physics.JUMP_VELOCITY - v);
      } else {
        target.awakenedTraits[k] = (Number(target.awakenedTraits[k]) || 0) + v;
      }
    }

    this.calcDerivedStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    window.audio?.playBreakthrough?.();
    game?.triggerScreenShake?.(0.35, 6);
    game?.skillEffects?.push({ type: 'level_up', x: this.x, y: this.y, progress: 0, duration: 1.5 });
    const msg = `👑 [한계 돌파 ${target.breakthroughTier}단계] ${target.name} 각성! (공격력 +${tierCfg.bonusAtk}, ${tierCfg.traitDesc})`;
    game?.spawnItemText?.(this.x, this.y - 55, `★ 한계 돌파 성공! ${target.name} ★`);
    game?.ui?.addChat?.('system', msg);
    game?.ui?.updateHUD?.();
    game?.ui?.updateStatsWindow?.();
    this.persistProgress(game, true);
    return {
      success: true,
      tier: target.breakthroughTier,
      weaponLevel: target.weaponLevel,
      itemName: target.name,
      bonusAtk: tierCfg.bonusAtk,
      traitDesc: tierCfg.traitDesc
    };
  }

  // --- STAR FORCE 1★ ~ 5★ ENHANCEMENT (WHEN UPGRADE SLOTS === 0) ---
  enhanceStarForce(item = null, game = window.game) {
    const reject = msg => { this.say(msg); return false; };
    const target = item || this.inventory?.equip?.find(eq => eq.equipped && eq.type === 'weapon');
    if (!target || !this.inventory.equip.includes(target)) return reject('스타포스 강화할 장비를 선택하세요.');
    if ((target.upgradeSlots ?? 7) > 0) return reject('업그레이드 가능 횟수가 0회인 장비만 스타포스 강화가 가능합니다.');
    const currentStars = target.starForce || 0;
    if (currentStars >= 5) return reject('이미 최대 스타포스(5★)에 도달한 장비입니다.');

    const starRates = [0.85, 0.70, 0.55, 0.40, 0.30];
    const starFees = [1500, 3000, 6000, 12000, 25000];
    const starAtkBonus = [2, 3, 4, 6, 9];
    const rate = starRates[currentStars];
    const fee = starFees[currentStars];
    const bonusAtk = starAtkBonus[currentStars];

    if (this.meso < fee) return reject(`스타포스 강화 비용 ${fee.toLocaleString()} 메소가 필요합니다.`);
    this.meso -= fee;
    const success = Math.random() < rate;
    if (success) {
      target.starForce = currentStars + 1;
      if (target.type === 'weapon' || target.type === 'star') {
        target.atk = (Number(target.atk) || 0) + bonusAtk;
      } else {
        target.def = (Number(target.def) || 0) + bonusAtk * 2;
        target.atk = (Number(target.atk) || 0) + Math.ceil(bonusAtk * 0.5);
      }
      target.str = (Number(target.str) || 0) + 1;
      target.dex = (Number(target.dex) || 0) + 1;
      target.int = (Number(target.int) || 0) + 1;
      target.luk = (Number(target.luk) || 0) + 1;
      window.audio?.playStarForce?.();
    } else {
      window.audio?.playScrollFail?.();
    }
    this.calcDerivedStats();
    this.persistProgress(game, true);
    const resText = success
      ? `⭐ 스타포스 ${target.starForce}★ 달성! (${target.name} 공격력 +${bonusAtk}, 올스탯 +1)`
      : `💫 스타포스 ${currentStars + 1}★ 강화 실패... (등급 유지)`;
    game?.spawnItemText?.(this.x, this.y - 45, resText);
    game?.ui?.addChat?.('system', `[스타포스] ${resText} (비용 ${fee.toLocaleString()} 메소)`);
    game?.ui?.updateHUD?.();
    game?.ui?.updateStatsWindow?.();
    return { success, starForce: target.starForce || 0, fee, bonusAtk: success ? bonusAtk : 0, itemName: target.name };
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

  syncStarEvolution(item) {
    if (!item || item.type !== 'star') return;
    const count = item.enhancements || 0;
    let starType = 'subi';
    let name = '수비표창';
    let baseAtk = 15;
    let icon = '✦';
    let desc = '가장 기본적인 은빛 4각 십자 수리검 (강화 주문서로 진화 가능)';
    let color = '#94a3b8';

    if (count >= 12) {
      starType = 'ultimate';
      name = `★ 궁극의 성광수리검 +${count} ★`;
      baseAtk = 35;
      icon = '🌟';
      desc = '⭐ 신화의 경지에 도달한 8방향 성광의 궁극 수리검 (+12 이상 초월 강화)';
      color = '#f59e0b';
    } else if (count >= 10) {
      starType = 'hwabi';
      name = `화비표창 +${count}`;
      baseAtk = 29;
      icon = '🔥';
      desc = '🔥 작열하는 붉은 화염의 6각 불꽃 수리검 (+10~+11 강화)';
      color = '#ea580c';
    } else if (count >= 9) {
      starType = 'ilbi';
      name = `일비표창 +${count}`;
      baseAtk = 27;
      icon = '🔮';
      desc = '🔮 흑요석 3단 유선형 날과 붉은 루비 코어의 전설 표창 (+9 강화)';
      color = '#dc2626';
    } else if (count >= 7) {
      starType = 'steely';
      name = `뇌전수리검 +${count}`;
      baseAtk = 25;
      icon = '⚡';
      desc = '⚡ 푸른 번개와 스파크 방전 궤적의 뇌전수리검 (+7~+8 강화)';
      color = '#00f5ff';
    } else if (count >= 5) {
      starType = 'tobi';
      name = `토비표창 +${count}`;
      baseAtk = 23;
      icon = '💫';
      desc = '💫 코발트 블루 날개에 바람 소용돌이 표창 (+5~+6 강화)';
      color = '#3b82f6';
    } else if (count >= 3) {
      starType = 'kumbi';
      name = `금비표창 +${count}`;
      baseAtk = 21;
      icon = '✨';
      desc = '✨ 찬란한 황금빛 4각 수리검 (+3~+4 강화)';
      color = '#fbbf24';
    } else if (count >= 1) {
      starType = 'mokbi';
      name = `목비표창 +${count}`;
      baseAtk = 17;
      icon = '🪵';
      desc = '🪵 청동과 목재를 덧댄 클래식 4각 표창 (+1~+2 강화)';
      color = '#b45309';
    } else {
      name = '수비표창';
    }

    item.starType = starType;
    item.name = name;
    item.atk = baseAtk + (count * 2);
    item.icon = icon;
    item.iconPath = `assets/projectiles/stars/${starType}_icon.png`;
    item.desc = desc;
    item.color = color;
    if (item.equipped) {
      this.activeStar = starType;
    }
  }

  canUseEquipmentScroll(item, scroll) {
    if (!item || !scroll || scroll.type !== 'scroll') return false;
    if (!Number.isFinite(item.upgradeSlots)) return false;
    if (scroll.scrollKind === 'clean_slate' || scroll.scrollKind === 'chaos') return true;
    if (scroll.targetCategory === 'armor') return item.type !== 'weapon' && item.type !== 'star';
    if (scroll.bonusDef !== undefined) return item.type !== 'weapon' && item.type !== 'star';
    return item.type === 'weapon' || item.type === 'star';
  }

  enhanceEquipment(item, scroll, game = window.game) {
    const reject = message => { this.say(message); return false; };
    if (!this.inventory.equip.includes(item) || !this.inventory.use.includes(scroll)) return reject('소지 중인 장비와 주문서를 선택하세요.');
    if (!this.canUseEquipmentScroll(item, scroll)) return reject('이 장비에 사용할 수 없는 주문서입니다.');
    if (!Number.isInteger(scroll.count) || scroll.count <= 0) return reject('주문서가 없습니다.');

    // Clean Slate Scroll (백의 주문서 10%): restores 1 lost upgrade slot
    if (scroll.scrollKind === 'clean_slate') {
      const maxSlots = item.maxUpgradeSlots ?? 7;
      const usedSlots = (item.enhancements || 0) + item.upgradeSlots;
      if (item.upgradeSlots >= maxSlots && usedSlots >= maxSlots) return reject('복구할 업그레이드 횟수가 없습니다.');
      const fee = this.getEnhancementFee(item);
      if (this.meso < fee) return reject(`강화 수수료 ${fee.toLocaleString()} 메소가 필요합니다.`);
      const rate = Number(scroll.rate ?? 0.1);
      const success = Math.random() < rate;
      this.meso -= fee;
      scroll.count--;
      if (success) item.upgradeSlots++;
      if (scroll.count === 0) this.inventory.use.splice(this.inventory.use.indexOf(scroll), 1);
      this.lastEnhancementResult = { success, fee, stat: 'slots', bonus: success ? 1 : 0, itemName: item.name, remainingSlots: item.upgradeSlots };
      this.persistProgress(game);
      const msg = success ? `${item.name} 백의 주문서 성공! 업그레이드 횟수 +1 복구!` : `${item.name} 백의 주문서 실패.`;
      window.audio?.[success ? 'playScrollSuccess' : 'playScrollFail']?.();
      game?.spawnItemText?.(this.x, this.y - 45, msg);
      game?.ui?.addChat?.('system', `[백의 주문서] ${msg}`);
      return this.lastEnhancementResult;
    }

    if (!Number.isInteger(item.upgradeSlots) || item.upgradeSlots <= 0) return reject('남은 업그레이드 횟수가 없습니다.');
    const fee = this.getEnhancementFee(item);
    if (this.meso < fee) return reject(`강화 수수료 ${fee.toLocaleString()} 메소가 필요합니다.`);
    const rate = Number(scroll.rate ?? 0.6);

    // Chaos Scroll (혼돈의 주문서 60%): randomizes stats -5 ~ +5
    if (scroll.scrollKind === 'chaos') {
      const success = Math.random() < rate;
      this.meso -= fee;
      scroll.count--;
      item.upgradeSlots--;
      let deltaAtk = 0;
      if (success) {
        const range = Number(scroll.chaosRange) || 5;
        deltaAtk = Math.floor(Math.random() * (range * 2 + 1)) - range;
        if (deltaAtk === 0) deltaAtk = 2;
        if (item.type === 'weapon' || item.type === 'star') {
          item.atk = Math.max(1, (Number(item.atk) || 0) + deltaAtk);
        } else {
          item.def = Math.max(0, (Number(item.def) || 0) + deltaAtk);
          item.atk = Math.max(0, (Number(item.atk) || 0) + Math.max(-1, Math.floor(deltaAtk / 2)));
        }
        item.enhancements = (Number(item.enhancements) || 0) + 1;
        item.successCount = item.enhancements;
      }
      if (scroll.count === 0) this.inventory.use.splice(this.inventory.use.indexOf(scroll), 1);
      this.calcDerivedStats();
      this.lastEnhancementResult = { success, fee, stat: 'atk', bonus: deltaAtk, itemName: item.name, remainingSlots: item.upgradeSlots };
      this.persistProgress(game);
      const msg = success ? `${item.name} 혼돈의 주문서 발동! (능력치 ${deltaAtk >= 0 ? '+' + deltaAtk : deltaAtk} 변화)` : `${item.name} 혼돈의 주문서 실패.`;
      window.audio?.[success ? 'playScrollSuccess' : 'playScrollFail']?.();
      game?.spawnItemText?.(this.x, this.y - 45, msg);
      game?.ui?.addChat?.('system', `[혼돈 강화] ${msg}`);
      return this.lastEnhancementResult;
    }

    const stat = scroll.bonusDef !== undefined && scroll.bonusAtk === undefined ? 'def' : 'atk';
    const bonus = Number(stat === 'def' ? scroll.bonusDef : (scroll.bonusAtk ?? 2));
    if (!Number.isFinite(rate) || rate < 0 || rate > 1 || !Number.isFinite(bonus) || bonus <= 0) return reject('올바른 강화 주문서가 아닙니다.');

    const success = Math.random() < rate;
    this.meso -= fee;
    scroll.count--;
    item.upgradeSlots--;
    let destroyed = false;
    if (success) {
      item[stat] = (Number(item[stat]) || 0) + bonus;
      if (scroll.bonusSpd) item.spd = (Number(item.spd) || 0) + Number(scroll.bonusSpd);
      if (scroll.bonusStat) {
        item.str = (Number(item.str) || 0) + Number(scroll.bonusStat);
        item.dex = (Number(item.dex) || 0) + Number(scroll.bonusStat);
        item.int = (Number(item.int) || 0) + Number(scroll.bonusStat);
        item.luk = (Number(item.luk) || 0) + Number(scroll.bonusStat);
      }
      item.enhancements = (Number(item.enhancements) || 0) + 1;
      item.successCount = item.enhancements;
      if (item.type === 'star') {
        this.syncStarEvolution(item);
      }
    } else if (scroll.scrollKind === 'cursed' && Math.random() < (scroll.destroyRate ?? 0.5)) {
      // Cursed scroll failure penalty: resets upgrade slot & degrades 1 enhancement safely without deleting starter weapon
      destroyed = true;
      item.atk = Math.max(1, (Number(item.atk) || 1) - 1);
    }
    if (scroll.count === 0) this.inventory.use.splice(this.inventory.use.indexOf(scroll), 1);
    this.calcDerivedStats();
    this.lastEnhancementResult = {success, destroyed, fee, stat, bonus: success ? bonus : 0,
      itemName: item.name, remainingSlots: item.upgradeSlots};
    this.persistProgress(game);
    const resultText = success
      ? `${item.name} 강화 성공! ${stat === 'atk' ? '공격력' : '방어력'} +${bonus}`
      : (destroyed ? `💥 저주 발동! ${item.name} 강화 실패 및 손상 (공격력 -1)` : `${item.name} 강화 실패. 기존 능력치는 유지됩니다.`);
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

  static JOB_TIERS = {
    '초보자': 0,
    '전사': 1, '검사': 1,
    '마법사': 1, '매지션': 1,
    '궁수': 1, '아처': 1,
    '도적': 1, '로그': 1,
    '파이터': 2, '위자드': 2, '헌터': 2, '어쌔신': 2, '시프': 2,
    '크루세이더': 3, '메이지': 3, '레인저': 3, '허밋': 3, '시프마스터': 3,
    '히어로': 4, '아크메이지': 4, '보우마스터': 4, '나이트로드': 4, '섀도어': 4
  };

  changeJob(jobName, game = window.game) {
    if (game?.changePlayerJob) {
      game.changePlayerJob(jobName);
      return true;
    }
    this.setJob(jobName);
    return true;
  }

  setJob(jobName) {
    this.job = jobName;
    const tierMap = Player.JOB_TIERS || {
      '초보자': 0,
      '전사': 1, '검사': 1,
      '마법사': 1, '매지션': 1,
      '궁수': 1, '아처': 1,
      '도적': 1, '로그': 1,
      '파이터': 2, '위자드': 2, '헌터': 2, '어쌔신': 2, '시프': 2,
      '크루세이더': 3, '메이지': 3, '레인저': 3, '허밋': 3, '시프마스터': 3,
      '히어로': 4, '아크메이지': 4, '보우마스터': 4, '나이트로드': 4, '섀도어': 4
    };
    if (tierMap[jobName] !== undefined) {
      this.jobTier = tierMap[jobName];
    }

    this.buffs = {};
    this.skillCooldowns = {};
    this.attackTimer = 0;
    this.comboCount = 0;

    const warriorJobs = ['전사', '검사', '파이터', '크루세이더', '히어로'];
    const magicianJobs = ['마법사', '매지션', '위자드', '메이지', '아크메이지'];
    const bowmanJobs = ['궁수', '아처', '헌터', '레인저', '보우마스터'];
    const thiefClawJobs = ['도적', '로그', '어쌔신', '허밋', '나이트로드'];
    const thiefDaggerJobs = ['시프', '시프마스터', '섀도어'];

    if (warriorJobs.includes(jobName)) {
      this.str = Math.max(25, this.str);
      const wp = jobName === '히어로' ? 'wp_dragon_claymore' : (jobName === '크루세이더' ? 'wp_gryunhill' : 'wp_highlander');
      this.equipById(wp);
      this.weaponType = 'sword';
    } else if (magicianJobs.includes(jobName)) {
      this.int = Math.max(25, this.int);
      this.equipById('wp_evil_wings');
      this.weaponType = 'staff';
    } else if (bowmanJobs.includes(jobName)) {
      this.dex = Math.max(25, this.dex);
      this.equipById('wp_ryden');
      this.weaponType = 'bow';
    } else if (thiefClawJobs.includes(jobName)) {
      this.luk = Math.max(25, this.luk);
      this.equipById('wp_meba');
      this.weaponType = 'claw';
      let star = this.inventory.equip.find(eq => eq.type === 'star' && eq.equipped);
      if (!star) star = this.inventory.equip.find(eq => eq.type === 'star');
      if (!star) star = this.equipById('subi_star');
      if (star) {
        this.equipItem(star);
        this.syncStarEvolution(star);
      }
    } else if (thiefDaggerJobs.includes(jobName)) {
      this.luk = Math.max(25, this.luk);
      this.equipById('wp_taeguk_fan');
      this.weaponType = 'dagger';
    } else if (jobName === '초보자') {
      this.equipById('wp_wood_sword');
      this.weaponType = 'sword';
    }

    this.initSkillsForJob(jobName);
    this.calcDerivedStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.persistProgress(window.game, true);
  }

  getDamage() {
    const range = this.maxAtk - this.minAtk;
    const base = this.minAtk + Math.floor(Math.random() * (range + 1));
    const critRate = (this.job === '어쌔신' || this.job === '시프' || this.job === '도적') ? 0.45 : (this.job === '궁수' ? 0.35 : 0.22);
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
      if (b.permanent && !Number.isFinite(b.duration)) continue; // Passive buffs with Infinity duration are permanent!
      b.duration -= dt;
      if (b.duration <= 0) {
        delete this.buffs[key];
        buffsChanged = true;
        if (key === 'haste') {
          this.walkSpeed = (this.job === '어쌔신' || this.job === '시프' || this.job === '도적') ? 5.6 : (this.job === '궁수' ? 3.8 : 3.6);
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

    // Record pose history for Shadow Partner and visual afterimages
    if (!this.poseHistory) this.poseHistory = [];
    this.poseHistory.unshift({
      x: this.x,
      y: this.y,
      facing: this.facing,
      onGround: this.onGround,
      onLadder: this.onLadder,
      attackTimer: this.attackTimer
    });
    if (this.poseHistory.length > 20) this.poseHistory.pop();
  }

  hasShadowPartner() {
    return Boolean(this.buffs && this.buffs.shadow_partner);
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
      this.vy = this.jumpForce * 0.92;
      this.vx = direction * 3.5;
      this.horizontalImpulseTimer = 0.14;
      this.ladderCooldown = 0.25;
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
    const lvl = Math.max(1, this.skills?.flash_jump?.level || 1);
    const speedBoost = 6.6 + (lvl - 1) * 1.15;
    const verticalBoost = -4.2 - (lvl - 1) * 0.55;
    this.vx = (this.facing === 'right' ? 1 : -1) * speedBoost;
    this.vy = verticalBoost;
    this.horizontalImpulseTimer = 0.12 + lvl * 0.02;
    this.onGround = false;
    this.currentFoothold = null;
    window.audio?.playFlashJump?.();
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
    if (this.onLadder) {
      const spd = this.buffs?.haste ? 3.8 : (this.ladderSpeed || 2.8);
      this.vy = -spd;
      this.climbAnimTimer = (this.climbAnimTimer || 0) + 0.016;
    }
  }

  climbDown(map) {
    if (this.hp <= 0 || this.ladderCooldown > 0) return;
    if (!this.onLadder) {
      const ladder = Physics.checkLadderGrab(this, map, 'down');
      if (ladder) Physics.attachToLadder(this, ladder);
    }
    if (this.onLadder) {
      const spd = this.buffs?.haste ? 3.8 : (this.ladderSpeed || 2.8);
      this.vy = spd;
      this.climbAnimTimer = (this.climbAnimTimer || 0) + 0.016;
    }
  }

  stopVerticalClimb() {
    if (this.onLadder) this.vy = 0;
  }

  getPrimarySkillId() {
    switch (this.job) {
      // 0차 초보자
      case '초보자': return 'three_snails';

      // 전사 계열 (1차 ~ 4차)
      case '전사': return 'power_strike';
      case '파이터':
      case '크루세이더': return 'slash_blast';
      case '히어로': return 'brandish';

      // 마법사 계열 (1차 ~ 4차)
      case '마법사': return 'magic_claw';
      case '위자드':
      case '메이지': return 'thunderbolt';
      case '아크메이지': return 'genesis';

      // 궁수 계열 (1차 ~ 4차)
      case '궁수': return 'arrow_blow';
      case '헌터': return 'double_shot';
      case '레인저': return 'strafe';
      case '보우마스터': return 'hurricane';

      // 도적 계열 (1차 ~ 4차)
      case '도적':
        return this.weaponType === 'dagger' ? 'double_stab' : 'lucky_seven';
      case '어쌔신':
      case '허밋':
      case '나이트로드': return 'lucky_seven';
      case '시프': return 'savage_blow';

      default: return 'three_snails';
    }
  }

  getPrimarySkillName() {
    switch (this.job) {
      case '초보자': return '달팽이 세껍질';
      case '전사': return '파워 스트라이크';
      case '파이터':
      case '크루세이더': return '슬래시 블러스트';
      case '히어로': return '브랜디쉬';
      case '마법사': return '매직 클로';
      case '위자드':
      case '메이지': return '썬더볼트';
      case '아크메이지': return '제네시스';
      case '궁수': return '애로우 블로우';
      case '헌터': return '더블 샷';
      case '레인저': return '스트레이프';
      case '보우마스터': return '폭풍의 시';
      case '어쌔신':
      case '허밋':
      case '나이트로드': return this.skills?.lucky_seven?.name || '럭키 세븐';
      case '시프':
      case '시프마스터':
      case '섀도어': return '새비지 블로우';
      case '도적':
        return this.weaponType === 'dagger' ? '새비지 블로우' : (this.skills?.lucky_seven?.name || '럭키 세븐');
      default: return '기본 스킬';
    }
  }

  getPrimarySkillIcon() {
    switch (this.job) {
      case '초보자': return '🐌';
      case '전사': return '⚔️';
      case '파이터':
      case '크루세이더': return '🌀';
      case '히어로': return '⚡';
      case '마법사': return '✨';
      case '위자드':
      case '메이지': return '⚡';
      case '아크메이지': return '🌟';
      case '궁수': return '🏹';
      case '헌터':
      case '레인저': return '🎯';
      case '보우마스터': return '🌪️';
      case '어쌔신':
      case '허밋':
      case '나이트로드': return '⭐';
      case '시프':
      case '시프마스터':
      case '섀도어': return '⚔️';
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

    // ★ 표도(도적 계열) 아대 착용 시 일반 공격 표창 투척 강제 (불변 규격 INV-1)
    const isClawUser = this.weaponType === 'claw' || ['도적', '어쌔신', '허밋', '나이트로드'].includes(this.job);
    if (isClawUser) {
      this.attackTimer = this.getAttackDuration();
      this.attackAnimationDuration = this.attackTimer;
      window.audio?.playAttack?.();
      const activeStar = this.activeStar || 'subi';
      const tier = Math.max(1, this.jobTier || 1);
      const starCount = Math.max(2, Math.min(5, tier + 1));
      const aim = this.attackAim, facing = this.facing;

      for (let s = 0; s < starCount; s++) {
        SkillRegistry.schedule(this, game, s * 65, () => {
          const { damage, isCrit } = this.getDamage();
          const spread = (s - (starCount - 1) / 2) * 16;
          SkillRegistry.fireProjectile(this, game, {
            type: 'shuriken',
            speed: 600,
            range: 520,
            offsetX: 16,
            offsetY: -16 + (s * 4 - (starCount * 2)),
            spreadY: spread,
            damage: Math.max(1, Math.floor(damage / (starCount > 2 ? 1.15 : 1.0))),
            isCrit: isCrit || s === 0,
            starType: activeStar
          }, aim, facing);
        });
      }

      // Shadow Partner Mirror Throw for normal attack
      if (this.hasShadowPartner && this.hasShadowPartner()) {
        for (let s = 0; s < starCount; s++) {
          SkillRegistry.schedule(this, game, 80 + s * 65, () => {
            const { damage: shadowDmg } = this.getDamage();
            const spread = (s - (starCount - 1) / 2) * 16;
            SkillRegistry.fireProjectile(this, game, {
              type: 'shuriken',
              speed: 600,
              range: 520,
              offsetX: facing === 'right' ? -14 : 14,
              offsetY: -16 + (s * 4 - (starCount * 2)),
              spreadY: spread,
              damage: Math.max(1, Math.floor(shadowDmg * 0.5 / (starCount > 2 ? 1.15 : 1.0))),
              isCrit: false,
              starType: activeStar,
              isShadow: true
            }, aim, facing);
          });
        }
      }
      return true;
    }

    // 전사 / 궁수 / 초보자 기본 근접 공격
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

  gainExp(amount, game = window.game, isBoss = false) {
    if (!Number.isFinite(amount) || amount <= 0 || this.level >= Player.MAX_LEVEL) return 0;
    const hsMult = this.buffs?.holy_symbol ? 1.5 : 1.0;
    let gained = Math.floor(amount * hsMult);
    if (gained <= 0) return 0;

    // Safety guard against massive multi-level over-skipping:
    // A single non-boss kill cannot exceed maxExp (prevent jumping 5-10 levels at once)
    if (!isBoss) {
      gained = Math.min(gained, this.maxExp);
    }

    this.exp = Math.max(0, Number.isFinite(this.exp) ? this.exp : 0) + gained;
    this.maxExp = Player.expRequiredForLevel(this.level);
    let gainedLevels = 0;
    const maxAllowedLevels = isBoss ? 5 : 1;
    while (this.level < Player.MAX_LEVEL && this.exp >= this.maxExp && gainedLevels < maxAllowedLevels) {
      this.exp -= this.maxExp;
      this.levelUp(game);
      gainedLevels++;
      this.maxExp = Player.expRequiredForLevel(this.level);
    }
    // Prevent carrying over excessive EXP from non-boss kills
    if (!isBoss && this.exp >= this.maxExp && this.level < Player.MAX_LEVEL) {
      this.exp = Math.min(this.exp, Math.floor(this.maxExp * 0.8));
    }
    if (this.level >= Player.MAX_LEVEL) this.exp = 0;
    game?.spawnExpText?.(this.x, this.y - 35, gained);
    if (gainedLevels && this.canAdvanceJob() > 0) game?.ui?.showJobAdvancementModal?.();
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
    this.reconcileSP();
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

    // Milestone Level-Up Celebratory Rewards & Notifications
    this.grantMilestoneRewards(this.level, game);

    this.persistProgress(game);
    return true;
  }

  
  canAdvanceJob() {
    if (this.jobTier === 0 && this.level >= 10) return 1;
    if (this.jobTier === 1 && this.level >= 30) return 2;
    if (this.jobTier === 2 && this.level >= 70) return 3;
    if (this.jobTier === 3 && this.level >= 120) return 4;
    return 0;
  }

  getNextJobAdvancement() {
    const nextTier = this.canAdvanceJob();
    if (!nextTier) return null;
    const tierSpec = JOB_ADVANCEMENT_SPEC[nextTier];
    if (!tierSpec) return null;
    if (nextTier === 1) {
      return { tier: 1, options: tierSpec.options };
    }
    const branch = tierSpec.branches[this.job];
    if (!branch) return null;
    return { tier: nextTier, branch };
  }

  advanceJob(targetJobName, game = window.game) {
    const nextTier = this.canAdvanceJob();
    if (!nextTier) return false;

    if (nextTier === 1) {
      const opt = JOB_ADVANCEMENT_SPEC[1].options.find(o => o.job === targetJobName);
      if (!opt) return false;
      this.job = opt.job;
      this.jobTier = 1;
      this.weaponType = opt.weaponType;
      this.equipById(opt.weaponId);
      if (opt.newSkill) {
        const prevLevel = this.skills[opt.newSkill.id]?.level || 1;
        this.skills[opt.newSkill.id] = { ...opt.newSkill, level: prevLevel };
      }
      if (opt.passive) this.buffs[opt.passive.id] = { ...opt.passive };
      if (opt.extraSkill) {
        const prevLevel = this.skills[opt.extraSkill.id]?.level || 1;
        this.skills[opt.extraSkill.id] = { ...opt.extraSkill, level: prevLevel };
      }
      if (opt.job === '도적') {
        const star = this.inventory.equip.find(eq => eq.type === 'star');
        if (star) { this.equipItem(star); this.syncStarEvolution(star); }
      }
    } else {
      const tierSpec = JOB_ADVANCEMENT_SPEC[nextTier];
      const branch = tierSpec?.branches[this.job];
      if (!branch) return false;

      this.job = branch.nextJob;
      this.jobTier = nextTier;
      if (branch.weaponId) this.equipById(branch.weaponId);

      // 1. [스킬 1개 진화 강화] - Invested SP & level preserved!
      if (branch.enhancedSkill) {
        const enh = branch.enhancedSkill;
        const prevLevel = (enh.targetId && this.skills[enh.targetId]?.level) || 1;
        if (enh.newId && enh.targetId && enh.newId !== enh.targetId) {
          delete this.skills[enh.targetId];
          this.skills[enh.newId] = { ...enh, level: Math.max(prevLevel, enh.level || 1) };
        } else if (enh.targetId && this.skills[enh.targetId]) {
          Object.assign(this.skills[enh.targetId], enh, { level: Math.max(prevLevel, enh.level || 1) });
        } else if (enh.targetId) {
          this.skills[enh.targetId] = { ...enh, level: Math.max(prevLevel, enh.level || 1) };
        }
      }

      // 2. [스킬 1개 신규 추가]
      if (branch.newSkill) {
        if (branch.newSkill.passive) {
          this.buffs[branch.newSkill.id] = { ...branch.newSkill, permanent: true, isPassive: true };
        }
        const existingLvl = this.skills[branch.newSkill.id]?.level || 1;
        this.skills[branch.newSkill.id] = { ...branch.newSkill, level: existingLvl };
      }
    }

    // Award advancement bonus SP & reconcile
    this.sp += (nextTier === 4 ? 3 : 1);
    this.reconcileSP();

    // Ensure universal mobility skills remain intact
    if (!this.skills.flash_jump) {
      this.skills.flash_jump = { name: '플래시 점프', level: 1, maxLevel: 5, mpCost: 5, icon: '⚡', desc: '공중 2단 고속 도약 (전직업 기동 선택 지원)' };
    }
    if (!this.skills.teleport) {
      this.skills.teleport = { name: '텔레포트', level: 1, maxLevel: 5, mpCost: 8, icon: '🌌', desc: '바라보는 방향으로 즉시 순간이동 (점텔 가능, 전직업 기동 선택 지원)' };
    }

    this.applyJobPassives();
    this.syncSkillCosts();
    this.calcDerivedStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    // Visual & Sound Feedback
    window.audio?.playLevelUp?.();
    game?.spawnItemText?.(this.x, this.y - 50, `★ [${this.jobTier}차 전직 성공] ${this.job}! ★`);
    if (game?.ui?.addChatMessage) {
      game.ui.addChatMessage('시스템', `🎉 축하합니다! ${this.jobTier}차 전직을 완료하여 [${this.job}]이(가) 되었습니다! (보너스 SP 획득, 1개 스킬 강화 & 1개 신규 스킬 추가)`, 'system');
    }
    game?.ui?.updateHUD?.();
    game?.ui?.updateQuickslotsForJob?.(this.job, false);
    game?.ui?.updateSkillsWindow?.();
    game?.ui?.updateStatsWindow?.();
    this.persistProgress(game);
    return true;
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
    if (String(itemId).endsWith('_star') && window.MAPLE_EQUIPMENT_CATALOG?.stars) {
      const starFound = window.MAPLE_EQUIPMENT_CATALOG.stars.find(s => s.id === itemId);
      if (starFound && !this.inventory.equip.some(eq => eq.id === itemId)) {
        if (this.inventory.equip.length < 24) {
          this.inventory.equip.push({ ...starFound, upgradeSlots: 7, equipped: false });
          this.ensureItemUUIDs();
        }
      }
    }
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

  recordBossKill(bossType, bossName = '', game = window.game) {
    if (!bossType) return;
    if (!this.bossKills) this.bossKills = {};
    const prevKills = Number(this.bossKills[bossType]) || 0;
    this.bossKills[bossType] = prevKills + 1;
    this.calcDerivedStats();
    const totalUnique = Object.values(this.bossKills).filter(v => Number(v) > 0).length;
    if (prevKills === 0) {
      const label = bossName || bossType;
      game?.spawnItemText?.(this.x, this.y - 62, `🏆 [보스 도감 등록] ${label} 첫 토벌! (컬렉션 ${totalUnique}/13: 공+${totalUnique * 3}, 보공+${totalUnique * 2}%)`);
      game?.ui?.addChatMessage?.('시스템', `🏆 [보스 헌터 도감] ${label} 첫 토벌 성공! 영구 컬렉션 보너스 적용 (누적 ${totalUnique}/13종: 공격력 +${totalUnique * 3}, 올스탯 +${totalUnique * 2}, 보스 대미지 +${totalUnique * 2}%, 최대 HP +${totalUnique * 50})`, 'system');
    }
    this.persistProgress(game, true);
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
    this.snaredTimer = 0; // Shadow Web root duration
    this.state = 'alive';
    this.dyingDuration = 0.45;
    this.dyingTimer = 0;
    this.dropsSpawned = false;
    this.rewardsGranted = false;
    this.quakePending = false;
    this.bossSkillTimer = 2.6 + Math.random() * 1.4;
    this.activeBossSpells = [];
    this.enraged = false;
    this.summonCount = 0;

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
          horny_mushroom: ['뿔버섯', 22, 600, 1200, 90, 30, 7, 1.4, 38, 40],
          shroom: ['스포아', 2, 25, 35, 17, 0, 0, 0.8, 26, 24],
          stump: ['스텀프', 4, 65, 65, 30, 0, 0, 0.5, 36, 36]
        };
        [this.name, this.level, this.maxHp, this.exp, this.atk, this.def, this.avoid,
          this.speed, this.width, this.height] = definitions[type];
        const dropMap = {
          horny_mushroom: [
            { type: 'meso', chance: 0.9, min: 25, max: 80 },
            { type: 'horny_mushroom_cap', name: '뿔버섯의 갓', chance: 0.7 },
            { type: 'blue_potion', name: '파란 포션', chance: 0.3 }
          ],
          shroom: [
            { type: 'meso', chance: 0.75, min: 5, max: 15 },
            { type: 'mushroom_cap', name: '주황버섯의 갓', chance: 0.6 },
            { type: 'red_potion', name: '빨간 포션', chance: 0.2 }
          ],
          stump: [
            { type: 'meso', chance: 0.8, min: 10, max: 30 },
            { type: 'tree_branch', name: '나뭇가지', chance: 0.7 },
            { type: 'red_potion', name: '빨간 포션', chance: 0.2 }
          ]
        };
        this.dropTable = dropMap[type] || [
          {type:'meso', chance:0.9, min:10, max:80},
          {type:'blue_potion', name:'파란 포션', chance:0.3}
        ];
        break;
      }
      case 'snail':
        this.name = '달팽이';
        this.level = 1;
        this.maxHp = 15;
        this.exp = 30;
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
        this.exp = 50;
        this.atk = 5;
        this.def = 4;
        this.avoid = 2;
        this.speed = 0.8;
        this.width = 24;
        this.height = 18;
        this.dropTable = [
          { type: 'meso', chance: 0.75, min: 5, max: 14 },
          { type: 'blue_snail_shell', name: '파란달팽이 껍질', chance: 0.6 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.15 }
        ];
        break;
      case 'red_snail':
        this.name = '빨간달팽이';
        this.level = 4;
        this.maxHp = 50;
        this.exp = 80;
        this.atk = 9;
        this.def = 8;
        this.avoid = 4;
        this.speed = 1.0;
        this.width = 24;
        this.height = 18;
        this.dropTable = [
          { type: 'meso', chance: 0.8, min: 10, max: 25 },
          { type: 'red_snail_shell', name: '빨간달팽이 껍질', chance: 0.65 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.25 }
        ];
        break;
      case 'slime':
        this.name = '슬라임';
        this.level = 6;
        this.maxHp = 90;
        this.exp = 150;
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
        this.exp = 300;
        this.atk = 20;
        this.def = 15;
        this.avoid = 8;
        this.speed = 1.3;
        this.width = 32;
        this.height = 28;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 25, max: 65 },
          { type: 'orange_mushroom_cap', name: '주황버섯의 갓', chance: 0.75 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.3 },
          { type: 'blue_potion', name: '파란 포션', chance: 0.2 }
        ];
        break;
      case 'ribbon_pig':
        this.name = '리본돼지';
        this.level = 10;
        this.maxHp = 220;
        this.exp = 400;
        this.atk = 28;
        this.def = 22;
        this.avoid = 12;
        this.speed = 2.0;
        this.width = 36;
        this.height = 26;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 35, max: 90 },
          { type: 'ribbon', name: '돼지의 리본', chance: 0.8 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.35 }
        ];
        break;
      case 'green_mushroom':
        this.name = '초록버섯';
        this.level = 12;
        this.maxHp = 300;
        this.exp = 600;
        this.atk = 36;
        this.def = 30;
        this.avoid = 15;
        this.speed = 1.4;
        this.width = 34;
        this.height = 30;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 50, max: 120 },
          { type: 'green_mushroom_cap', name: '초록버섯의 갓', chance: 0.75 },
          { type: 'blue_potion', name: '파란 포션', chance: 0.4 }
        ];
        break;
      case 'zombie_mushroom':
        this.name = '좀비버섯';
        this.level = 15;
        this.maxHp = 420;
        this.exp = 800;
        this.atk = 48;
        this.def = 45;
        this.avoid = 22;
        this.speed = 1.4;
        this.width = 36;
        this.height = 32;
        this.isUndead = true;
        this.dropTable = [
          { type: 'meso', chance: 0.95, min: 65, max: 160 },
          { type: 'zombie_mushroom_charm', name: '죽은자의 부적', chance: 0.8 },
          { type: 'trophy_zombie_mushmom', name: '부식된 죽은 포자', chance: 0.35 },
          { type: 'blue_potion', name: '파란 포션', chance: 0.45 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.15 }
        ];
        break;
            case 'mushmom':
        this.name = '★ 머쉬맘 (BOSS) ★';
        this.level = 60;
        this.maxHp = 4500;
        this.exp = 100000;
        this.atk = 75;
        this.def = 80;
        this.avoid = 35;
        this.speed = 1.6;
        this.width = 119;
        this.height = 110;
        this.isBoss = true;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 50000, max: 120000 },
          { type: 'trophy_mushmom', name: '거대 버섯의 포자', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 1, chance: 1.0 },
          { type: 'shd_pan_lid', name: '냄비 뚜껑', chance: 0.7 },
          { type: 'ilbi_star', name: '일비 표창', chance: 0.2 },
          { type: 'scroll_atk_10', name: '무기 공격력 주문서 10%', chance: 0.45 },
          { type: 'scroll_cursed_atk_70', name: '저주받은 공격력 주문서 70%', chance: 0.5 },
          { type: 'white_potion', name: '하얀 포션', count: 15, chance: 1.0 },
          { type: 'mana_elixir', name: '마나 엘릭서', count: 15, chance: 1.0 }
        ];
        break;
      case 'pig':
        this.name = '돼지';
        this.level = 7;
        this.maxHp = 80;
        this.exp = 200;
        this.atk = 24;
        this.def = 10;
        this.avoid = 6;
        this.speed = 1.8;
        this.width = 34;
        this.height = 24;
        this.dropTable = [
          { type: 'meso', chance: 0.85, min: 20, max: 50 },
          { type: 'pig_ribbon', name: '돼지의 머리', chance: 0.7 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.25 }
        ];
        break;
      case 'wild_boar':
        this.name = '와일드보어';
        this.level = 25;
        this.maxHp = 550;
        this.exp = 2000;
        this.atk = 110;
        this.def = 40;
        this.avoid = 12;
        this.speed = 2.4;
        this.width = 48;
        this.height = 36;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 80, max: 220 },
          { type: 'orange_potion', name: '주황 포션', chance: 0.4 },
          { type: 'wild_boar_tooth', name: '와일드보어의 어금니', chance: 0.75 }
        ];
        break;
      case 'octopus':
        this.name = '옥토퍼스';
        this.level = 12;
        this.maxHp = 200;
        this.exp = 500;
        this.atk = 48;
        this.def = 18;
        this.avoid = 8;
        this.speed = 1.2;
        this.width = 36;
        this.height = 32;
        this.dropTable = [
          { type: 'meso', chance: 0.85, min: 40, max: 110 },
          { type: 'blue_potion', name: '파란 포션', chance: 0.3 },
          { type: 'octopus_leg', name: '옥토퍼스의 다리', chance: 0.7 }
        ];
        break;
      case 'bubbling':
        this.name = '버블링';
        this.level = 15;
        this.maxHp = 240;
        this.exp = 700;
        this.atk = 55;
        this.def = 22;
        this.avoid = 16;
        this.speed = 1.3;
        this.width = 32;
        this.height = 30;
        this.dropTable = [
          { type: 'meso', chance: 0.85, min: 45, max: 120 },
          { type: 'red_potion', name: '빨간 포션', chance: 0.35 },
          { type: 'slime_liquid', name: '방울 액체', chance: 0.75 }
        ];
        break;
      case 'jr_wraith':
        this.name = '주니어 레이스';
        this.level = 35;
        this.maxHp = 1200;
        this.exp = 4000;
        this.atk = 145;
        this.def = 55;
        this.avoid = 18;
        this.speed = 1.2;
        this.width = 40;
        this.height = 46;
        this.isUndead = true;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 150, max: 380 },
          { type: 'white_potion', name: '하얀 포션', chance: 0.4 },
          { type: 'mana_elixir', name: '마나 엘릭서', chance: 0.3 },
          { type: 'jr_wraith_cloth', name: '식탁보', chance: 0.7 }
        ];
        break;
      case 'coolie_zombie':
        this.name = '쿨리 좀비';
        this.level = 57;
        this.maxHp = 4500;
        this.exp = 15000;
        this.atk = 220;
        this.def = 110;
        this.avoid = 15;
        this.speed = 0.85;
        this.width = 46;
        this.height = 56;
        this.isUndead = true;
        this.dropTable = [
          { type: 'meso', chance: 0.95, min: 350, max: 900 },
          { type: 'white_potion', name: '하얀 포션', count: 2, chance: 0.5 },
          { type: 'mana_elixir', name: '마나 엘릭서', count: 2, chance: 0.45 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.1 },
          { type: 'ilbi_star', name: '일비 표창', chance: 0.12 },
          { type: 'coolie_zombie_tooth', name: '좀비의 잃어버린 이빨', chance: 0.85 }
        ];
        break;
      case 'drake':
        this.name = '드레이크';
        this.level = 50;
        this.maxHp = 3200;
        this.exp = 10000;
        this.atk = 195;
        this.def = 95;
        this.avoid = 16;
        this.speed = 1.4;
        this.width = 58;
        this.height = 52;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 250, max: 700 },
          { type: 'white_potion', name: '하얀 포션', chance: 0.45 },
          { type: 'scroll_def_100', name: '방어구 방어력 주문서 100%', chance: 0.2 },
          { type: 'steely_star', name: '뇌전 수리검', chance: 0.15 },
          { type: 'drake_blood', name: '드레이크의 피', chance: 0.75 }
        ];
        break;
            case 'king_slime':
        this.name = '★ 킹슬라임 (BOSS) ★';
        this.level = 40;
        this.maxHp = 8000;
        this.exp = 50000;
        this.atk = 160;
        this.def = 75;
        this.avoid = 12;
        this.speed = 1.1;
        this.width = 95;
        this.height = 80;
        this.isBoss = true;
        this.dyingDuration = 0.8;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 20000, max: 45000 },
          { type: 'trophy_king_slime', name: '물컹물컹한 왕관', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 1, chance: 1.0 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.6 },
          { type: 'slime_liquid', name: '물컹물컹한 액체', count: 20, chance: 1.0 },
          { type: 'white_potion', name: '하얀 포션', count: 10, chance: 1.0 },
          { type: 'mana_elixir', name: '마나 엘릭서', count: 10, chance: 1.0 }
        ];
        break;
            case 'jr_balrog':
        this.name = '★ 주니어 발록 (BOSS) ★';
        this.level = 80;
        this.maxHp = 50000;
        this.exp = 300000;
        this.atk = 280;
        this.def = 160;
        this.avoid = 28;
        this.speed = 1.5;
        this.width = 110;
        this.height = 100;
        this.isBoss = true;
        this.dyingDuration = 0.9;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 150000, max: 350000 },
          { type: 'trophy_jr_balrog', name: '지옥의 붉은 가죽', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 2, chance: 1.0 },
          { type: 'ilbi_star', name: '일비 표창', chance: 0.45 },
          { type: 'scroll_atk_10', name: '무기 공격력 주문서 10%', chance: 0.5 },
          { type: 'scroll_cursed_atk_30', name: '저주받은 공격력 주문서 30%', chance: 0.5 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.7 },
          { type: 'elixir', name: '엘릭서', count: 5, chance: 0.95 }
        ];
        break;
            case 'crimson_balrog':
        this.name = '★ 크림슨 발록 (RAID BOSS) ★';
        this.level = 100;
        this.maxHp = 100000;
        this.exp = 600000;
        this.atk = 420;
        this.def = 320;
        this.avoid = 40;
        this.speed = 1.6;
        this.width = 130;
        this.height = 120;
        this.isBoss = true;
        this.dyingDuration = 1.0;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 400000, max: 900000 },
          { type: 'trophy_crimson_balrog', name: '홍련의 악마 날개', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 3, chance: 1.0 },
          { type: 'ilbi_star', name: '일비 표창', chance: 0.6 },
          { type: 'helm_zakum', name: '👑 자쿰의 투구', chance: 0.35 },
          { type: 'scroll_chaos_60', name: '혼돈의 주문서 60%', chance: 0.65 },
          { type: 'scroll_atk_10', name: '무기 공격력 주문서 10%', chance: 0.6 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.85 },
          { type: 'power_elixir', name: '파워 엘릭서', count: 5, chance: 0.95 }
        ];
        break;
      case 'axe_stump':
        this.name = '엑스스텀프';
        this.level = 17;
        this.maxHp = 300;
        this.exp = 1000;
        this.atk = 62;
        this.def = 25;
        this.avoid = 8;
        this.speed = 0.8;
        this.width = 40;
        this.height = 42;
        this.dropTable = [
          { type: 'meso', chance: 0.88, min: 45, max: 110 },
          { type: 'orange_potion', name: '주황 포션', chance: 0.35 },
          { type: 'tree_branch', name: '나뭇가지', chance: 0.75 }
        ];
        break;
      case 'dark_axe_stump':
        this.name = '다크 엑스스텀프';
        this.level = 22;
        this.maxHp = 450;
        this.exp = 1500;
        this.atk = 95;
        this.def = 35;
        this.avoid = 10;
        this.speed = 0.9;
        this.width = 42;
        this.height = 44;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 65, max: 160 },
          { type: 'orange_potion', name: '주황 포션', chance: 0.4 },
          { type: 'firewood', name: '장작', chance: 0.75 }
        ];
        break;
      case 'fire_boar':
        this.name = '파이어보어';
        this.level = 32;
        this.maxHp = 1000;
        this.exp = 3000;
        this.atk = 135;
        this.def = 50;
        this.avoid = 15;
        this.speed = 2.5;
        this.width = 50;
        this.height = 38;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 120, max: 280 },
          { type: 'white_potion', name: '하얀 포션', chance: 0.4 },
          { type: 'fire_boar_tooth', name: '파이어보어의 송곳니', chance: 0.75 }
        ];
        break;
      case 'curse_eye':
        this.name = '커즈아이';
        this.level = 35;
        this.maxHp = 1250;
        this.exp = 4000;
        this.atk = 150;
        this.def = 60;
        this.avoid = 18;
        this.speed = 1.5;
        this.width = 42;
        this.height = 34;
        this.dropTable = [
          { type: 'meso', chance: 0.9, min: 140, max: 320 },
          { type: 'mana_elixir', name: '마나 엘릭서', chance: 0.4 },
          { type: 'curse_eye_tail', name: '커즈아이의 꼬리', chance: 0.75 }
        ];
        break;
      case 'jr_necki':
        this.name = '주니어 네키';
        this.level = 21;
        this.maxHp = 380;
        this.exp = 1200;
        this.atk = 82;
        this.def = 28;
        this.avoid = 22;
        this.speed = 2.0;
        this.width = 34;
        this.height = 28;
        this.dropTable = [
          { type: 'meso', chance: 0.88, min: 55, max: 140 },
          { type: 'blue_potion', name: '파란 포션', chance: 0.4 },
          { type: 'necki_skin', name: '주니어 네키의 가죽', chance: 0.75 }
        ];
        break;
      case 'tauromacis':
        this.name = '타우로마시스';
        this.level = 70;
        this.maxHp = 12000;
        this.exp = 35000;
        this.atk = 275;
        this.def = 165;
        this.avoid = 24;
        this.speed = 1.6;
        this.width = 76;
        this.height = 72;
        this.dropTable = [
          { type: 'meso', chance: 0.95, min: 450, max: 1100 },
          { type: 'white_potion', name: '하얀 포션', count: 2, chance: 0.5 },
          { type: 'mana_elixir', name: '마나 엘릭서', count: 2, chance: 0.5 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.18 },
          { type: 'tauromacis_horn', name: '타우로마시스의 뿔', chance: 0.8 }
        ];
        break;
      case 'death_teddy':
        this.name = '데스테니';
        this.level = 85;
        this.maxHp = 28000;
        this.exp = 60000;
        this.atk = 340;
        this.def = 210;
        this.avoid = 28;
        this.speed = 1.3;
        this.width = 68;
        this.height = 74;
        this.isUndead = true;
        this.dropTable = [
          { type: 'meso', chance: 0.95, min: 650, max: 1600 },
          { type: 'white_potion', name: '하얀 포션', count: 3, chance: 0.55 },
          { type: 'mana_elixir', name: '마나 엘릭서', count: 3, chance: 0.55 },
          { type: 'scroll_atk_10', name: '무기 공격력 주문서 10%', chance: 0.15 },
          { type: 'ilbi_star', name: '일비 표창', chance: 0.18 },
          { type: 'death_teddy_soul', name: '봉인된 테디베어 영혼', chance: 0.8 }
        ];
        break;
            case 'mano':
        this.name = '★ 마노 (BOSS) ★';
        this.level = 20;
        this.maxHp = 2500;
        this.exp = 15000;
        this.atk = 55;
        this.def = 35;
        this.avoid = 10;
        this.speed = 0.9;
        this.width = 76;
        this.height = 68;
        this.isBoss = true;
        this.dyingDuration = 0.75;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 3000, max: 7000 },
          { type: 'trophy_mano', name: '무지개빛 달팽이 껍질', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 1, chance: 1.0 },
          { type: 'scroll_atk_100', name: '무기 공격력 주문서 100%', chance: 0.8 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.4 },
          { type: 'red_potion', name: '빨간 포션', count: 15, chance: 1.0 },
          { type: 'blue_potion', name: '파란 포션', count: 15, chance: 1.0 }
        ];
        break;
            case 'stumpy':
        this.name = '★ 스텀피 (BOSS) ★';
        this.level = 35;
        this.maxHp = 6000;
        this.exp = 30000;
        this.atk = 115;
        this.def = 65;
        this.avoid = 14;
        this.speed = 1.1;
        this.width = 88;
        this.height = 84;
        this.isBoss = true;
        this.dyingDuration = 0.8;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 10000, max: 25000 },
          { type: 'trophy_stumpy', name: '고목나무의 심장', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 1, chance: 1.0 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.6 },
          { type: 'white_potion', name: '하얀 포션', count: 10, chance: 0.95 },
          { type: 'mana_elixir', name: '마나 엘릭서', count: 10, chance: 0.95 }
        ];
        break;
            case 'faust':
        this.name = '★ 파우스트 (BOSS) ★';
        this.level = 50;
        this.maxHp = 18000;
        this.exp = 80000;
        this.atk = 185;
        this.def = 110;
        this.avoid = 20;
        this.speed = 1.4;
        this.width = 84;
        this.height = 86;
        this.isBoss = true;
        this.dyingDuration = 0.85;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 35000, max: 80000 },
          { type: 'trophy_faust', name: '악령의 원숭이 인형', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 1, chance: 1.0 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.7 },
          { type: 'scroll_cursed_atk_70', name: '저주받은 공격력 주문서 70%', chance: 0.4 },
          { type: 'mana_elixir', name: '마나 엘릭서', count: 15, chance: 0.95 }
        ];
        break;
            case 'dyle':
        this.name = '★ 다일 (BOSS) ★';
        this.level = 65;
        this.maxHp = 35000;
        this.exp = 150000;
        this.atk = 240;
        this.def = 145;
        this.avoid = 24;
        this.speed = 1.6;
        this.width = 116;
        this.height = 76;
        this.isBoss = true;
        this.dyingDuration = 0.85;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 70000, max: 150000 },
          { type: 'trophy_dyle', name: '늪지대 악어의 가죽', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 2, chance: 1.0 },
          { type: 'steely_star', name: '뇌전 수리검', chance: 0.5 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.75 },
          { type: 'scroll_atk_10', name: '무기 공격력 주문서 10%', chance: 0.4 }
        ];
        break;
            case 'zombie_mushmom':
        this.name = '★ 좀비머쉬맘 (BOSS) ★';
        this.level = 65;
        this.maxHp = 42000;
        this.exp = 180000;
        this.atk = 255;
        this.def = 150;
        this.avoid = 25;
        this.speed = 1.5;
        this.width = 118;
        this.height = 108;
        this.isBoss = true;
        this.isUndead = true;
        this.dyingDuration = 0.85;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 80000, max: 180000 },
          { type: 'trophy_zombie_mushmom', name: '부식된 죽은 포자', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 2, chance: 1.0 },
          { type: 'ilbi_star', name: '일비 표창', chance: 0.4 },
          { type: 'scroll_atk_10', name: '무기 공격력 주문서 10%', chance: 0.5 },
          { type: 'scroll_cursed_atk_30', name: '저주받은 공격력 주문서 30%', chance: 0.5 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.7 }
        ];
        break;
            case 'manon':
        this.name = '★ 마뇽 (RAID BOSS) ★';
        this.level = 105;
        this.maxHp = 120000;
        this.exp = 800000;
        this.atk = 450;
        this.def = 340;
        this.avoid = 36;
        this.speed = 1.5;
        this.width = 128;
        this.height = 124;
        this.isBoss = true;
        this.dyingDuration = 0.95;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 500000, max: 1200000 },
          { type: 'trophy_manon', name: '마뇽의 울음소리 비늘', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 3, chance: 1.0 },
          { type: 'scroll_chaos_60', name: '혼돈의 주문서 60%', chance: 0.65 },
          { type: 'scroll_atk_10', name: '무기 공격력 주문서 10%', chance: 0.6 },
          { type: 'power_elixir', name: '파워 엘릭서', count: 8, chance: 0.95 }
        ];
        break;
            case 'papulatus':
        this.name = '★ 파풀라투스 (RAID BOSS) ★';
        this.level = 125;
        this.maxHp = 160000;
        this.exp = 1200000;
        this.atk = 520;
        this.def = 380;
        this.avoid = 38;
        this.speed = 1.6;
        this.width = 132;
        this.height = 128;
        this.isBoss = true;
        this.dyingDuration = 1.0;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 800000, max: 1800000 },
          { type: 'trophy_papulatus', name: '차원의 균열 조각', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 4, chance: 1.0 },
          { type: 'scroll_chaos_60', name: '혼돈의 주문서 60%', chance: 0.75 },
          { type: 'helm_zakum', name: '👑 자쿰의 투구', chance: 0.4 },
          { type: 'power_elixir', name: '파워 엘릭서', count: 10, chance: 0.95 }
        ];
        break;
      case 'pianus':
        this.name = '★ 피아누스 (DEEP SEA BOSS) ★';
        this.level = 110;
        this.maxHp = 180000;
        this.exp = 1400000;
        this.atk = 580;
        this.def = 420;
        this.avoid = 35;
        this.speed = 0;
        this.width = 160;
        this.height = 130;
        this.isBoss = true;
        this.dyingDuration = 1.0;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 1000000, max: 2000000 },
          { type: 'trophy_pianus', name: '피아누스의 비늘', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 5, chance: 1.0 },
          { type: 'scroll_chaos_60', name: '혼돈의 주문서 60%', chance: 0.8 },
          { type: 'scroll_atk_10', name: '무기 공격력 주문서 10%', chance: 0.6 },
          { type: 'power_elixir', name: '파워 엘릭서', count: 10, chance: 1.0 },
          { type: 'elixir', name: '엘릭서', count: 10, chance: 1.0 }
        ];
        break;
      case 'alishar':
        this.name = '★ 알리샤르 (PQ BOSS) ★';
        this.level = 56;
        this.maxHp = 35000;
        this.exp = 150000;
        this.atk = 240;
        this.def = 150;
        this.avoid = 20;
        this.speed = 1.2;
        this.width = 96;
        this.height = 100;
        this.isBoss = true;
        this.dyingDuration = 0.8;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 250000, max: 500000 },
          { type: 'trophy_alishar', name: '알리샤르의 차원 파편', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 2, chance: 1.0 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.7 },
          { type: 'mana_elixir', name: '마나 엘릭서', count: 20, chance: 0.95 },
          { type: 'white_potion', name: '하얀 포션', count: 30, chance: 0.95 }
        ];
        break;
      case 'griffey':
        this.name = '★ 그리프 (RAID BOSS) ★';
        this.level = 105;
        this.maxHp = 120000;
        this.exp = 950000;
        this.atk = 480;
        this.def = 360;
        this.avoid = 32;
        this.speed = 1.8;
        this.width = 136;
        this.height = 128;
        this.isBoss = true;
        this.dyingDuration = 1.0;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 700000, max: 1500000 },
          { type: 'trophy_griffey', name: '그리프의 뿔', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 4, chance: 1.0 },
          { type: 'scroll_chaos_60', name: '혼돈의 주문서 60%', chance: 0.65 },
          { type: 'scroll_armor_dex_60', name: '전신 갑옷 민첩성 주문서 60%', chance: 0.6 },
          { type: 'power_elixir', name: '파워 엘릭서', count: 8, chance: 0.95 }
        ];
        break;
      case 'timer':
        this.name = '★ 타이머 (FIELD BOSS) ★';
        this.level = 59;
        this.maxHp = 24000;
        this.exp = 120000;
        this.atk = 220;
        this.def = 140;
        this.avoid = 18;
        this.speed = 1.4;
        this.width = 76;
        this.height = 72;
        this.isBoss = true;
        this.dyingDuration = 0.8;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 200000, max: 400000 },
          { type: 'trophy_timer', name: '타이머의 뻐꾸기 태엽', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 2, chance: 1.0 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.6 },
          { type: 'mana_elixir', name: '마나 엘릭서', count: 15, chance: 0.9 }
        ];
        break;
            case 'horntail':
        this.name = '★ 혼테일 (MYTHIC BOSS) ★';
        this.level = 160;
        this.maxHp = 250000;
        this.exp = 5000000;
        this.atk = 620;
        this.def = 450;
        this.avoid = 42;
        this.speed = 1.4;
        this.width = 152;
        this.height = 144;
        this.isBoss = true;
        this.dyingDuration = 1.1;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 3000000, max: 6000000 },
          { type: 'trophy_horntail', name: '혼테일의 삼두용 비늘', chance: 1.0 },
          { type: 'boss_coin', name: '보스 토벌 주화', count: 8, chance: 1.0 },
          { type: 'helm_zakum', name: '👑 자쿰의 투구', chance: 0.85 },
          { type: 'scroll_chaos_60', name: '혼돈의 주문서 60%', count: 2, chance: 1.0 },
          { type: 'scroll_atk_10', name: '무기 공격력 주문서 10%', chance: 0.75 },
          { type: 'power_elixir', name: '파워 엘릭서', count: 20, chance: 1.0 }
        ];
        break;
      case 'zakum':
        this.name = '★ 자쿰 (ZAKUM) ★';
        this.level = 140;
        this.maxHp = 220000;
        this.exp = 2000000;
        this.atk = 85;
        this.def = 40;
        this.avoid = 20;
        this.speed = 0;
        this.width = 180;
        this.height = 160;
        this.isBoss = true;
        this.dyingDuration = 1.2;
        this.dropTable = [
          { type: 'meso', chance: 1.0, min: 50000, max: 150000 },
          { type: 'trophy_zakum', name: '자쿰의 불꽃 다이아', chance: 1.0 },
          { type: 'helm_zakum', name: '자쿰의 투구', chance: 0.85 },
          { type: 'scroll_atk_60', name: '무기 공격력 주문서 60%', chance: 0.8 }
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

      if ((this.type === 'slime' || this.type === 'bubbling' || this.type === 'orange_mushroom' || this.isBoss) && this.onGround && Math.random() < 0.6) {
        this.vy = -6.5;
        this.onGround = false;
        this.currentFoothold = null;
        if (this.isBoss) {
          this.quakePending = true;
          game?.spawnItemText?.(this.x, this.y - this.height - 12, `⚠️ ${this.name}이(가) 뛰어오릅니다!`);
        }
      }
    }

    if (this.snaredTimer > 0) {
      this.snaredTimer -= dt;
      this.moveDir = 0;
      this.vx = 0;
    } else if (this.onGround && this.hitTimer <= 0) {
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
    if (this.isBoss && this.quakePending && !wasGrounded && this.onGround) {
      this.quakePending = false;
      window.sprites?.spawnLandingDust?.(this.x, this.y);
      game?.triggerScreenShake?.(0.25, 5);
      if (player.hp > 0 && player.onGround && player.invincibleTimer <= 0 &&
          Math.abs(player.x - this.x) <= 240 && Math.abs(player.y - this.y) <= 28) {
        const damage = player.takeDamage(Math.round(this.atk * 0.8), game, this.x);
        if (damage > 0) game?.spawnDamageText?.(player.x, player.y - 25, damage, false, 'player');
      }
    }

    if (this.isBoss) {
      this.updateBossMechanics(dt, player, map, game);
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

  updateBossMechanics(dt, player, map, game) {
    if (!this.enraged && this.hp > 0 && this.hp <= this.maxHp * 0.4) {
      this.enraged = true;
      this.speed = Math.min(3.4, this.speed * 1.32);
      this.atk = Math.round(this.atk * 1.2);
      game?.triggerScreenShake?.(0.4, 6);
      game?.spawnItemText?.(this.x, this.y - this.height - 25, `🔥 [광폭화] ${this.name}의 분노가 폭발합니다! (공격력·이동속도 상승)`);
      game?.ui?.addChatMessage?.('시스템', `⚠️ [BOSS 광폭화] ${this.name}의 체력이 40% 이하로 떨어져 광폭화 상태에 돌입했습니다!`, 'system');
    }

    if (!this.activeBossSpells) this.activeBossSpells = [];
    for (let i = this.activeBossSpells.length - 1; i >= 0; i--) {
      const spell = this.activeBossSpells[i];
      spell.timer += dt;
      if (!spell.triggered && spell.timer >= spell.duration) {
        spell.triggered = true;
        spell.lingerTimer = 0.45;
        game?.triggerScreenShake?.(0.22, 4);
        if (player && player.hp > 0 && player.invincibleTimer <= 0) {
          const pBox = player.getHitBox();
          let hit = false;
          if (spell.type === 'shockwave') {
            hit = player.onGround && Math.abs(player.x - spell.x) <= (spell.radius || 220) && Math.abs(player.y - spell.y) <= 36;
          } else {
            const w = spell.width || 64;
            const h = spell.height || 180;
            const sBox = { x: spell.x - w / 2, y: spell.y - h, width: w, height: h + 12 };
            hit = player.checkCollision(pBox, sBox);
          }
          if (hit) {
            const dmg = player.takeDamage(spell.damage || Math.round(this.atk * 0.85), game, spell.x);
            if (dmg > 0) game?.spawnDamageText?.(player.x, player.y - 25, dmg, false, 'player');
            if (spell.type === 'poison_cloud' || spell.type === 'time_bomb') {
              player.weakenedTimer = Math.max(player.weakenedTimer || 0, 2.0);
            }
          }
        }
      } else if (spell.triggered) {
        spell.lingerTimer -= dt;
        if (spell.lingerTimer <= 0) {
          this.activeBossSpells.splice(i, 1);
        }
      }
    }

    this.bossSkillTimer -= dt * (this.enraged ? 1.35 : 1.0);
    if (this.bossSkillTimer <= 0 && player && player.hp > 0) {
      this.bossSkillTimer = 3.2 + Math.random() * 2.0;
      this.executeBossPattern(player, map, game);
    }
  }

  summonMinion(minionType, offsetX, map, game) {
    if (!game || !map || (this.summonCount || 0) >= 6) return;
    const aliveMinions = game.monsters.filter(m => m !== this && m.isAlive()).length;
    if (aliveMinions >= Math.max(12, game.maxMonsters || 16)) return;
    const rawX = Math.max(60, Math.min(map.width - 60, this.x + offsetX));
    const point = map.resolvePosition(rawX, this.y);
    const fh = map.findSpawnFoothold(point.x, point.y) || this.currentFoothold;
    if (!fh) return;
    const minion = new Monster(minionType, point.x, fh.getYAtX(point.x));
    minion.onGround = true;
    minion.currentFoothold = fh;
    game.monsters.push(minion);
    this.summonCount = (this.summonCount || 0) + 1;
  }

  executeBossPattern(player, map, game) {
    if (!player || !this.isAlive()) return;
    const px = player.x;
    const py = player.y;
    const dir = px >= this.x ? 1 : -1;
    this.facing = dir > 0 ? 'right' : 'left';
    const spellDmg = Math.max(12, Math.round(this.atk * 0.9));

    switch (this.type) {
      case 'mano': {
        if (this.hp < this.maxHp * 0.85 && Math.random() < 0.45) {
          const healAmt = Math.round(this.maxHp * 0.06);
          this.hp = Math.min(this.maxHp, this.hp + healAmt);
          game?.spawnItemText?.(this.x, this.y - this.height - 18, `🌈 마노의 무지개 재생! (+${healAmt} HP)`);
        } else {
          this.summonMinion('red_snail', dir * 70, map, game);
          this.activeBossSpells.push({ type: 'shockwave', x: this.x, y: this.y, radius: 190, duration: 0.85, timer: 0, damage: spellDmg, color: '#22c55e', label: '🌈 무지개 파동' });
          game?.spawnItemText?.(this.x, this.y - this.height - 18, '🌈 마노가 무지개 파동과 호위 달팽이를 소환합니다!');
        }
        break;
      }
      case 'stumpy': {
        this.activeBossSpells.push({ type: 'shockwave', x: this.x, y: this.y, radius: 220, duration: 0.85, timer: 0, damage: spellDmg, color: '#a16207', label: '🪓 고목 지진파' });
        if (Math.random() < 0.5) this.summonMinion('dark_axe_stump', dir * 85, map, game);
        game?.spawnItemText?.(this.x, this.y - this.height - 18, '🪓 스텀피의 고목 대지진! 점프하여 회피하세요!');
        break;
      }
      case 'king_slime': {
        this.activeBossSpells.push({ type: 'shockwave', x: px, y: py, radius: 230, duration: 0.8, timer: 0, damage: spellDmg, color: '#10b981', label: '💧 슬라임 왕관 낙하' });
        if (Math.random() < 0.5) this.summonMinion('bubbling', dir * 75, map, game);
        game?.spawnItemText?.(this.x, this.y - this.height - 18, '💧 킹슬라임의 점액 대지진 & 버블링 분열!');
        break;
      }
      case 'faust': {
        this.activeBossSpells.push({ type: 'lightning', x: px, y: py, width: 56, height: 220, duration: 0.75, timer: 0, damage: spellDmg, color: '#a855f7', label: '⚡ 숲의 저주 낙뢰' });
        this.activeBossSpells.push({ type: 'poison_cloud', x: px + dir * 55, y: py, width: 90, height: 80, duration: 0.9, timer: 0, damage: Math.round(spellDmg * 0.8), color: '#7e22ce', label: '☠️ 악령 독안개' });
        game?.spawnItemText?.(this.x, this.y - this.height - 18, '⚡ 파우스트가 숲의 저주 낙뢰를 내립니다!');
        break;
      }
      case 'mushmom': {
        this.activeBossSpells.push({ type: 'shockwave', x: this.x, y: this.y, radius: 260, duration: 0.85, timer: 0, damage: spellDmg, color: '#f97316', label: '🍄 머쉬맘 대지진' });
        game?.spawnItemText?.(this.x, this.y - this.height - 18, '🍄 머쉬맘의 거대 포자 충격파! 점프 회피!');
        break;
      }
      case 'dyle': {
        this.vx = dir * 5.8;
        this.activeBossSpells.push({ type: 'shockwave', x: px, y: py, radius: 210, duration: 0.75, timer: 0, damage: spellDmg, color: '#0d9488', label: '🐊 늪지 수압 파동' });
        game?.spawnItemText?.(this.x, this.y - this.height - 18, '🐊 다일의 맹렬한 돌진 & 늪지 수압포!');
        break;
      }
      case 'zombie_mushmom': {
        this.activeBossSpells.push({ type: 'poison_cloud', x: px - 45, y: py, width: 95, height: 90, duration: 0.85, timer: 0, damage: spellDmg, color: '#9333ea', label: '☠️ 맹독 포자 구름' });
        this.activeBossSpells.push({ type: 'poison_cloud', x: px + 45, y: py, width: 95, height: 90, duration: 0.85, timer: 0, damage: spellDmg, color: '#9333ea', label: '☠️ 맹독 포자 구름' });
        if (Math.random() < 0.45) this.summonMinion('zombie_mushroom', dir * 80, map, game);
        game?.spawnItemText?.(this.x, this.y - this.height - 18, '☠️ 좀비머쉬맘의 부패한 맹독 포자 구름 살포!');
        break;
      }
      case 'jr_balrog': {
        this.activeBossSpells.push({ type: 'fire_pillar', x: px, y: py, width: 64, height: 210, duration: 0.8, timer: 0, damage: spellDmg, color: '#ef4444', label: '🔥 지옥 메테오' });
        this.activeBossSpells.push({ type: 'lightning', x: px + (Math.random() * 120 - 60), y: py, width: 52, height: 240, duration: 0.7, timer: 0, damage: spellDmg, color: '#38bdf8', label: '⚡ 마왕의 낙뢰' });
        game?.spawnItemText?.(this.x, this.y - this.height - 18, '🔥 주니어 발록의 메테오 화염 기둥 & 낙뢰!');
        break;
      }
      case 'crimson_balrog': {
        for (const off of [-80, 0, 80]) {
          this.activeBossSpells.push({ type: 'fire_pillar', x: px + off, y: py, width: 60, height: 220, duration: 0.85, timer: 0, damage: spellDmg, color: '#dc2626', label: '☄️ 홍련의 심판' });
        }
        game?.spawnItemText?.(this.x, this.y - this.height - 18, '☄️ 크림슨 발록의 3연속 홍련 화염 심판!');
        break;
      }
      case 'manon': {
        this.activeBossSpells.push({ type: 'dragon_breath', x: this.x + dir * 130, y: this.y, width: 180, height: 110, duration: 0.8, timer: 0, damage: spellDmg, color: '#f97316', label: '🐉 마뇽의 화염 브레스' });
        this.activeBossSpells.push({ type: 'fire_pillar', x: px, y: py, width: 68, height: 210, duration: 0.85, timer: 0, damage: spellDmg, color: '#ef4444', label: '🔥 용의 화염주' });
        game?.spawnItemText?.(this.x, this.y - this.height - 18, '🐉 마뇽의 드래곤 브레스 & 용의 포효!');
        break;
      }
      case 'papulatus': {
        this.activeBossSpells.push({ type: 'time_bomb', x: px - 50, y: py, width: 85, height: 95, duration: 0.9, timer: 0, damage: spellDmg, color: '#6366f1', label: '⏰ 차원 시한폭탄' });
        this.activeBossSpells.push({ type: 'time_bomb', x: px + 50, y: py, width: 85, height: 95, duration: 0.9, timer: 0, damage: spellDmg, color: '#6366f1', label: '⏰ 차원 시한폭탄' });
        this.activeBossSpells.push({ type: 'lightning', x: px, y: py, width: 58, height: 240, duration: 0.75, timer: 0, damage: spellDmg, color: '#38bdf8', label: '🌌 시공간 균열' });
        game?.spawnItemText?.(this.x, this.y - this.height - 18, '⏰ 파풀라투스의 차원 시한폭탄 & 시공간 레이저!');
        break;
      }
      case 'horntail': {
        this.activeBossSpells.push({ type: 'fire_pillar', x: px - 90, y: py, width: 72, height: 240, duration: 0.8, timer: 0, damage: spellDmg, color: '#ef4444', label: '🔥 좌두 화염 브레스' });
        this.activeBossSpells.push({ type: 'lightning', x: px, y: py, width: 68, height: 260, duration: 0.75, timer: 0, damage: spellDmg, color: '#38bdf8', label: '⚡ 중두 썬더 스톰' });
        this.activeBossSpells.push({ type: 'dragon_breath', x: px + 90, y: py, width: 140, height: 120, duration: 0.85, timer: 0, damage: spellDmg, color: '#06b6d4', label: '❄️ 우두 빙결 브레스' });
        game?.spawnItemText?.(this.x, this.y - this.height - 18, '🐲 혼테일의 삼두용 원소 대재앙 (화염·전격·빙결) 발동!');
        break;
      }
      default: {
        this.activeBossSpells.push({ type: 'shockwave', x: this.x, y: this.y, radius: 200, duration: 0.85, timer: 0, damage: spellDmg, color: '#f59e0b', label: '💥 보스 충격파' });
        break;
      }
    }
  }

  takeDamage(amount, isCrit, fromDir, gameOrPlayer) {
    if (!this.isAlive() || !Number.isFinite(amount) || amount <= 0) return false;

    let crit = false;
    let hitDirection = 'right';
    let player = null;
    let game = null;

    if (isCrit && typeof isCrit === 'object' && (isCrit.player || isCrit.monsters || isCrit.map)) {
      game = isCrit;
      player = game.player;
      const fromX = fromDir;
      crit = Boolean(gameOrPlayer);
      hitDirection = (typeof fromX === 'number' && fromX > this.x) ? 'left' : 'right';
    } else {
      crit = Boolean(isCrit);
      hitDirection = (typeof fromDir === 'number') ? (fromDir > this.x ? 'left' : 'right') : (fromDir === 'right' ? 'right' : 'left');
      if (gameOrPlayer) {
        if (typeof gameOrPlayer.gainExp === 'function') {
          player = gameOrPlayer;
          game = window.game;
        } else if (gameOrPlayer.player) {
          player = gameOrPlayer.player;
          game = gameOrPlayer;
        }
      }
    }
    if (!player && window.game?.player) player = window.game.player;
    if (!game && window.game) game = window.game;

    this.hp -= amount;
    this.hitTimer = 0.15;
    this.hitstopTimer = 0.08; // 0.08s hitstop!
    this.hitFlashTimer = 0.12;
    window.audio?.playHit?.();

    // Parabolic knockback
    const hitDir = (hitDirection === 'right' ? 1 : -1);
    this.vx = hitDir * 3.2;
    this.vy = -2.0;
    this.onGround = false;
    this.currentFoothold = null;

    if (this.hp <= 0) {
      this.hp = 0;
      this.startDying(player, game);
    }
    return true;
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
    this.activeBossSpells = [];
    window.audio.playMonsterDie();

    const actualPlayer = (player && typeof player.gainExp === 'function') 
      ? player 
      : ((game && game.player && typeof game.player.gainExp === 'function') ? game.player : (window.game?.player));

    if (!this.rewardsGranted && actualPlayer && typeof actualPlayer.gainExp === 'function') {
      this.rewardsGranted = true;
      const rewardGame = game || window.game;
      const gained = actualPlayer.gainExp(this.exp, rewardGame, this.isBoss);
      actualPlayer.gainWeaponExp?.(this.isBoss ? 35 : Math.max(8, Math.min(25, Math.ceil((this.level || 1) * 1.2))), rewardGame);
      if (this.isBoss) {
        actualPlayer.recordBossKill?.(this.type, this.name, rewardGame);
      }
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

    // Record pose history for Shadow Partner and visual afterimages
    if (!this.poseHistory) this.poseHistory = [];
    this.poseHistory.unshift({
      x: this.x,
      y: this.y,
      facing: this.facing,
      onGround: this.onGround,
      onLadder: this.onLadder,
      attackTimer: this.attackTimer
    });
    if (this.poseHistory.length > 20) this.poseHistory.pop();
  }

  hasShadowPartner() {
    return Boolean(this.buffs && this.buffs.shadow_partner);
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
    if (!this.isAlive()) return false;
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

    // 1. 경험치 (450,000 EXP) 및 무기 숙련도
    const gained = player?.gainExp?.(450000, game);
    player?.gainWeaponExp?.(100, game);
    player?.addItem?.('trophy_zakum', '자쿰의 불꽃 다이아', 1, game);
    player?.addItem?.('boss_coin', '보스 토벌 주화', 5, game);
    player?.recordBossKill?.('zakum', this.name, game);
    game.autoHunt?.recordKill?.(Number.isFinite(gained) ? gained : 450000, 0);

    // 2. 화면 전체 방사형 드롭 폭포 (총 2,000,000 메소: 20만 메소 10뭉치)
    const y = this.getGroundY() - 8;
    for (let i = -5; i <= 5; i++) {
      if (i === 0) continue;
      game.spawnDrop('meso', 200000, this.x + (i * 32), y);
    }

    // 3. 엘릭서 & 파워 엘릭서 (각 10개)
    game.spawnDrop('power_elixir', 10, this.x - 70, y, '파워 엘릭서');
    game.spawnDrop('elixir', 10, this.x + 70, y, '엘릭서');

    // 4. 자쿰의 투구 (확정 드롭)
    game.spawnDrop('equip', 1, this.x, y, '👑 자쿰의 투구');

    // 5. 최고급 주문서 3종 확정 드롭
    game.spawnDrop('scroll_chaos_60', 1, this.x - 110, y, '혼돈의 주문서 60%');
    game.spawnDrop('scroll_chaos_60', 1, this.x + 110, y, '혼돈의 주문서 60%');
    game.spawnDrop('scroll_atk_10', 1, this.x - 45, y, '무기 공격력 주문서 10%');
    game.spawnDrop('scroll_cursed_atk_30', 1, this.x + 45, y, '저주받은 공격력 주문서 30%');

    // 6. 보스 토벌 주화 5개 드롭
    game.spawnDrop('boss_coin', 5, this.x, y - 20, '보스 토벌 주화');

    game.spawnItemText(this.x, this.y - 70, '👑 ★ 자쿰 레이드 클리어! 드롭 폭포 폭발! ★ 👑');
    game.triggerScreenShake?.(0.65, 12);
    window.audio?.playBreakthrough?.();
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

// === Horntail Mythic Raid Boss Class (3 Independent Heads + Wings + Body) ===
class HorntailBoss {
  constructor(x = 600, y = 350) {
    this.id = 'horntail';
    this.type = 'horntail';
    this.name = '★ 혼테일 (HORNTAIL MYTHIC BOSS) ★';
    this.x = x;
    this.y = y;
    this.level = 160;
    this.maxHp = 250000;
    this.hp = 70000; // Body phase HP
    this.width = 190;
    this.height = 180;
    this.hitTimer = 0;
    this.hitstopTimer = 0;
    this.atk = 620;
    this.state = 'alive';
    this.phase = 'heads'; // 'heads' -> 'body' -> 'dying' -> 'dead'
    this.animationTime = 0;
    this.dyingDuration = 1.2;
    this.dyingTimer = 0;
    this.rewardsGranted = false;
    this.isBoss = true;
    this.facing = 'left';

    // 4 Independent destructible parts
    this.parts = [
      { id: 'left_head', name: '혼테일의 좌측 머리 (화염)', maxHp: 45000, hp: 45000, isAlive: true, offsetX: -60, offsetY: -120, width: 70, height: 75, state: 'alive', hitTimer: 0 },
      { id: 'middle_head', name: '혼테일의 중앙 머리 (전격/저주)', maxHp: 60000, hp: 60000, isAlive: true, offsetX: 0, offsetY: -145, width: 76, height: 80, state: 'alive', hitTimer: 0 },
      { id: 'right_head', name: '혼테일의 우측 머리 (빙결)', maxHp: 45000, hp: 45000, isAlive: true, offsetX: 60, offsetY: -120, width: 70, height: 75, state: 'alive', hitTimer: 0 },
      { id: 'wings', name: '혼테일의 거대 날개', maxHp: 30000, hp: 30000, isAlive: true, offsetX: 0, offsetY: -60, width: 170, height: 85, state: 'alive', hitTimer: 0 }
    ];

    this.activeSpells = [];
    this.spellCooldown = 2.8;
  }

  get activeBossSpells() {
    return this.activeSpells;
  }
  set activeBossSpells(val) {
    this.activeSpells = val;
  }

  executeBossPattern(player, map, game) {
    return this.castSpell(player, game);
  }

  getLevel() { return this.level; }
  getAvoid() { return 42; }
  getDefense() { return 450; }
  isAlive() { return this.state === 'alive' && (this.hp > 0 || this.parts.some(p => p.isAlive)); }
  isDying() { return this.state === 'dying'; }

  getGroundY() { return this.y; }

  setGroundPosition(x, groundY) {
    this.x = x;
    this.y = groundY;
    return this;
  }

  getHitBoxes() {
    if (!this.isAlive()) return [];
    const aliveParts = this.parts.filter(p => p.isAlive);
    if (aliveParts.length > 0) {
      return aliveParts.map(part => ({
        type: 'arm',
        target: part,
        x: this.x + part.offsetX - part.width / 2,
        y: this.y + part.offsetY - part.height,
        width: part.width,
        height: part.height
      }));
    }
    return [{
      type: 'body',
      target: this,
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    }];
  }

  takeDamage(amount, isCrit, fromDir, game, hitTarget = null) {
    if (!this.isAlive() || !Number.isFinite(amount) || amount <= 0) return false;
    const aliveParts = this.parts.some(p => p.isAlive);
    if (aliveParts) {
      const part = hitTarget?.target && this.parts.includes(hitTarget.target)
        ? hitTarget.target
        : this.parts.find(p => p.isAlive);
      if (!part || !part.isAlive) return false;
      part.hp = Math.max(0, part.hp - amount);
      part.hitTimer = 0.15;
      if (part.hp === 0) {
        part.isAlive = false;
        part.state = 'dead';
        game?.spawnItemText?.(this.x + part.offsetX, this.y + part.offsetY, `💥 [${part.name}] 부위 파괴!`);
        window.audio?.playMonsterDie?.();
        if (!this.parts.some(p => p.isAlive)) {
          this.phase = 'body';
          game?.spawnItemText?.(this.x, this.y - 120, '🔥 [혼테일] 모든 머리와 날개 파괴! 본체 타격 가능!');
          game?.ui?.addChatMessage?.('시스템', '🔥 [혼테일 레이드] 삼두용의 모든 부위가 파괴되었습니다! 최종 본체 타격 페이즈 진입!', 'system');
        }
      }
    } else {
      this.hp = Math.max(0, this.hp - amount);
      this.hitTimer = 0.15;
    }

    this.hitstopTimer = 0.08;
    window.audio?.playHit?.();
    if (this.hp === 0 && !this.parts.some(p => p.isAlive)) {
      this.startDying(game?.player, game);
    }
    return true;
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
    for (const part of this.parts) {
      part.hitTimer = Math.max(0, part.hitTimer - dt);
    }

    // Body Contact Damage
    const playerBox = player.getHitBox();
    const bodyBox = { x: this.x - this.width / 2, y: this.y - this.height, width: this.width, height: this.height };
    if (player.hp > 0 && player.invincibleTimer <= 0 && CombatSystem.checkAABB(playerBox, bodyBox)) {
      const dmg = player.takeDamage(this.atk, game, this.x);
      if (dmg > 0) game.spawnDamageText(player.x, player.y - 25, dmg, false, 'player');
    }

    // Spells Execution
    for (let i = this.activeSpells.length - 1; i >= 0; i--) {
      const spell = this.activeSpells[i];
      spell.timer += dt;
      if (spell.timer < spell.duration) continue;
      const spellBox = { x: spell.x - (spell.width || 60) / 2, y: spell.y - (spell.height || 200), width: spell.width || 60, height: spell.height || 200 };
      if (player.hp > 0 && player.invincibleTimer <= 0 && CombatSystem.checkAABB(player.getHitBox(), spellBox)) {
        if (spell.isOneToOne) {
          player.hp = 1;
          player.mp = 1;
          player.weakenedTimer = 4;
          player.invincibleTimer = 1.5;
          window.audio?.playHit?.();
          game?.triggerScreenShake?.(0.8, 8);
          game?.spawnItemText?.(player.x, player.y - 30, '💀 1/1 저주! HP 1 / MP 1');
          game?.ui?.addChatMessage?.('시스템', '⚠️ [혼테일 기믹] HP/MP 1 및 허약 저주 발동! 즉시 엘릭서를 복용하세요!', 'system');
        } else {
          const damage = player.takeDamage(spell.damage || 180, game, spell.x);
          if (damage > 0) game.spawnDamageText(player.x, player.y - 25, damage, false, 'player');
        }
      }
      this.activeSpells.splice(i, 1);
    }

    this.spellCooldown -= dt;
    if (this.spellCooldown <= 0 && player.hp > 0) {
      this.spellCooldown = 2.4 + Math.random() * 2.2;
      this.castSpell(player, game);
    }
  }

  castSpell(player, game) {
    if (!this.isAlive()) return false;
    const px = (player && player.x !== undefined) ? player.x : (this.x - 120);
    const py = (player && player.y !== undefined) ? player.y : this.y;
    window.audio?.playBossRoar?.();
    const roll = Math.random();

    if (roll < 0.25) {
      // 1/1 저주 (중앙 머리 기믹)
      this.activeSpells.push({ type: 'one_to_one', x: px, y: py, width: 80, height: 220, duration: 1.1, timer: 0, damage: 0, isOneToOne: true, color: '#a855f7', label: '💀 1/1 마법진' });
      game?.spawnItemText?.(px, py - 60, '⚠️ ★ 혼테일의 1/1 암흑 마법진 전개! ★');
    } else if (roll < 0.55) {
      // 좌두/중두 화염/전격 연타
      this.activeSpells.push({ type: 'fire_pillar', x: px - 60, y: py, width: 70, height: 240, duration: 0.8, timer: 0, damage: 220, color: '#ef4444', label: '🔥 좌두 화염 브레스' });
      this.activeSpells.push({ type: 'lightning', x: px + 60, y: py, width: 64, height: 260, duration: 0.75, timer: 0, damage: 240, color: '#38bdf8', label: '⚡ 중두 썬더스톰' });
      game?.spawnItemText?.(px, py - 60, '🔥⚡ 혼테일 화염 브레스 & 썬더스톰 연타!');
    } else {
      // 우두 빙결 브레스
      this.activeSpells.push({ type: 'dragon_breath', x: px, y: py, width: 140, height: 130, duration: 0.85, timer: 0, damage: 200, color: '#06b6d4', label: '❄️ 우두 빙결 폭풍' });
      game?.spawnItemText?.(px, py - 60, '❄️ 혼테일 우두 빙결 폭풍!');
    }
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
    window.audio?.playMonsterDie?.();
    return true;
  }

  grantRewards(player, game) {
    if (this.rewardsGranted || !game) return;
    this.rewardsGranted = true;

    // 1. 경험치 (1,500,000 EXP) 및 무기 숙련도
    const gained = player?.gainExp?.(1500000, game);
    player?.gainWeaponExp?.(100, game);
    player?.addItem?.('trophy_horntail', '혼테일의 삼두용 비늘', 1, game);
    player?.addItem?.('boss_coin', '보스 토벌 주화', 8, game);
    player?.recordBossKill?.('horntail', this.name, game);
    game.autoHunt?.recordKill?.(Number.isFinite(gained) ? gained : 1500000, 0);

    // 2. 화면 가득 쏟아지는 드롭 폭포 (총 3,000,000 메소: 25만 메소 12뭉치)
    const y = this.y - 10;
    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;
      game.spawnDrop('meso', 250000, this.x + (i * 30), y);
    }

    // 3. 파워 엘릭서 20개
    game.spawnDrop('power_elixir', 20, this.x - 90, y, '파워 엘릭서');

    // 4. 자쿰의 투구 & 혼돈의 주문서 60% 2장 확정 드롭
    game.spawnDrop('equip', 1, this.x, y, '👑 자쿰의 투구');
    game.spawnDrop('scroll_chaos_60', 1, this.x - 120, y, '혼돈의 주문서 60%');
    game.spawnDrop('scroll_chaos_60', 1, this.x + 120, y, '혼돈의 주문서 60%');
    game.spawnDrop('scroll_atk_10', 1, this.x + 60, y, '무기 공격력 주문서 10%');

    // 5. 보스 주화 8개
    game.spawnDrop('boss_coin', 8, this.x, y - 24, '보스 토벌 주화');

    game.spawnItemText(this.x, this.y - 90, '🐲 👑 ★ 혼테일 신화 레이드 완벽 토벌! 드롭 폭포! ★ 👑 🐲');
    game.triggerScreenShake?.(0.75, 14);
    window.audio?.playBreakthrough?.();
  }

  die(player, game) { return this.startDying(player, game); }
}

window.HorntailBoss = HorntailBoss;
window.ZakumBoss = ZakumBoss;
window.NPC = NPC;
window.Portal = Portal;
window.DropItem = DropItem;
window.FloatingText = FloatingText;
