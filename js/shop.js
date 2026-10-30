// js/shop.js - Classic Town General Store & Equipment Merchant System

const SHOP_ITEMS_FOR_SALE = [
  // 1. 소비 아이템 & 포션
  { id: 'red_potion', iconPath: 'assets/items/red_potion.png', name: '빨간 포션', price: 50, type: 'use', count: 1, healHp: 50, icon: '🧪', desc: 'HP를 50 회복시켜 줍니다.' },
  { id: 'orange_potion', iconPath: 'assets/items/orange_potion.png', name: '주황 포션', price: 160, type: 'use', count: 1, healHp: 150, icon: '🧪', desc: 'HP를 150 회복시켜 줍니다.' },
  { id: 'white_potion', iconPath: 'assets/items/white_potion.png', name: '하얀 포션', price: 320, type: 'use', count: 1, healHp: 300, icon: '🧪', desc: 'HP를 300 회복시켜 줍니다.' },
  { id: 'blue_potion', iconPath: 'assets/items/blue_potion.png', name: '파란 포션', price: 100, type: 'use', count: 1, healMp: 50, icon: '💙', desc: 'MP를 50 회복시켜 줍니다.' },
  { id: 'mana_elixir', iconPath: 'assets/items/mana_elixir.png', name: '마나 엘릭서', price: 620, type: 'use', count: 1, healMp: 300, icon: '💧', desc: 'MP를 300 회복시켜 줍니다.' },
  { id: 'town_scroll', iconPath: 'assets/items/town_scroll.png', name: '마을 귀환 주문서', price: 300, type: 'use', count: 1, icon: '📜', desc: '가장 가까운 마을(헤네시스)로 즉시 귀환합니다.' },

  // 2. 클래식 강화 주문서
  { id: 'scroll_atk_100', iconPath: 'assets/items/scroll_atk_100.png', name: '무기 공격력 주문서 100%', price: 1000, type: 'use', itemType: 'scroll', count: 1, rate: 1, bonusAtk: 1, icon: '📜', desc: '무기 공격력 +1. 성공률 100%, 강화 수수료 별도.' },
  { id: 'scroll_atk_60', iconPath: 'assets/items/scroll_atk_60.png', name: '무기 공격력 주문서 60%', price: 2000, type: 'use', itemType: 'scroll', count: 1, rate: 0.6, bonusAtk: 2, icon: '📜', desc: '무기 공격력 +2. 성공률 60%, 강화 수수료 별도.' },
  { id: 'scroll_atk_10', iconPath: 'assets/items/scroll_atk_10.png', name: '무기 공격력 주문서 10%', price: 3000, type: 'use', itemType: 'scroll', count: 1, rate: 0.1, bonusAtk: 5, icon: '📜', desc: '무기 공격력 +5. 성공률 10%, 강화 수수료 별도.' },
  { id: 'scroll_def_100', iconPath: 'assets/items/scroll_def_100.png', name: '방어구 방어력 주문서 100%', price: 800, type: 'use', itemType: 'scroll', count: 1, rate: 1, bonusDef: 2, icon: '📜', desc: '방어구 방어력 +2. 성공률 100%, 강화 수수료 별도.' },
  { id: 'scroll_glove_atk_60', iconPath: 'assets/items/scroll_glove_atk_60.png', name: '장갑 공격력 주문서 60%', price: 3500, type: 'use', itemType: 'scroll', targetCategory: 'armor', count: 1, rate: 0.6, bonusAtk: 2, icon: '🧤', desc: '방어구/장갑에 물리 공격력 +2를 부여하는 전설의 장공 주문서 (성공률 60%).' },
  { id: 'scroll_shoe_speed_60', iconPath: 'assets/items/scroll_shoe_speed_60.png', name: '신발 이동속도 주문서 60%', price: 1800, type: 'use', itemType: 'scroll', targetCategory: 'armor', count: 1, rate: 0.6, bonusSpd: 2, bonusDef: 1, icon: '👟', desc: '방어구/신발에 이동속도 +2 및 방어력 +1을 부여합니다 (성공률 60%).' },
  { id: 'scroll_cursed_atk_70', iconPath: 'assets/items/scroll_cursed_atk_70.png', name: '저주받은 공격력 주문서 70%', price: 2500, type: 'use', itemType: 'scroll', scrollKind: 'cursed', count: 1, rate: 0.7, destroyRate: 0.5, bonusAtk: 2, bonusStat: 1, icon: '🟣', desc: '성공률 70% 무기 공격력 +2, 주스탯 +1 (실패 시 50% 확률로 장비 파괴 위험)' },
  { id: 'scroll_cursed_atk_30', iconPath: 'assets/items/scroll_cursed_atk_30.png', name: '저주받은 공격력 주문서 30%', price: 4500, type: 'use', itemType: 'scroll', scrollKind: 'cursed', count: 1, rate: 0.3, destroyRate: 0.5, bonusAtk: 5, bonusStat: 3, icon: '🟣', desc: '성공률 30% 무기 공격력 +5, 주스탯 +3 (실패 시 50% 확률로 장비 파괴 위험)' },
  { id: 'scroll_chaos_60', iconPath: 'assets/items/scroll_chaos_60.png', name: '혼돈의 주문서 60%', price: 6000, type: 'use', itemType: 'scroll', scrollKind: 'chaos', count: 1, rate: 0.6, chaosRange: 5, icon: '🌀', desc: '성공률 60%! 장비의 기존 옵션 수치를 -5 ~ +5 사이로 무작위 재조정합니다.' },
  { id: 'scroll_clean_slate_10', iconPath: 'assets/items/scroll_clean_slate_10.png', name: '백의 주문서 10%', price: 5000, type: 'use', itemType: 'scroll', scrollKind: 'clean_slate', count: 1, rate: 0.1, icon: '🤍', desc: '성공률 10%! 실패로 차감된 업그레이드 가능 횟수를 1회 복구합니다.' },

  // 3. 클래식 인기 명품 장비 & 방어구 상점
  { id: 'helm_brown_bamboo', iconPath: 'assets/items/helm_brown_bamboo.png', name: '갈색 삿갓', price: 1500, type: 'helmet', category: '공용 모자', reqLevel: 10, def: 5, luk: 3, upgradeSlots: 7, icon: '👒', desc: 'LUK +3의 초반 필수 명품 삿갓입니다.' },
  { id: 'glv_work_glove', iconPath: 'assets/items/glv_work_glove.png', name: '노가다 목장갑', price: 2000, type: 'glove', category: '공용 장갑', reqLevel: 10, def: 2, upgradeSlots: 7, icon: '🧤', desc: '장공 주문서를 발라 공격력을 극대화하는 국민 목장갑입니다.' },
  { id: 'shd_pan_lid', iconPath: 'assets/items/shd_pan_lid.png', name: '냄비 뚜껑', price: 3000, type: 'shield', category: '공용 방패', reqLevel: 10, def: 10, upgradeSlots: 7, icon: '🍳', desc: '가볍고 방어력이 뛰어난 전설의 냄비 뚜껑입니다.' },
  { id: 'cape_ragged', iconPath: 'assets/items/cape_ragged.png', name: '허름한 망토', price: 2500, type: 'cape', category: '공용 망토', reqLevel: 25, def: 5, avoid: 10, upgradeSlots: 5, icon: '🧣', desc: '회피율을 높여주는 다소 낡은 망토입니다.' },
  { id: 'sho_snow_shoes', iconPath: 'assets/items/sho_snow_shoes.png', name: '아이젠', price: 5000, type: 'shoe', category: '공용 신발', reqLevel: 30, def: 20, spd: 5, upgradeSlots: 7, icon: '👟', desc: '설원 미끄럼 방지 및 이동속도 +5 신발입니다.' },
  { id: 'ov_bone_armor', iconPath: 'assets/items/ov_bone_armor.png', name: '본 아머', price: 6000, type: 'overall', category: '공용 전신', reqLevel: 30, def: 35, str: 2, dex: 1, upgradeSlots: 10, icon: '🦺', desc: '단단한 뼈를 엮어 만든 레벨 30제 전신 갑옷입니다.' },
  { id: 'helm_bone_helm', iconPath: 'assets/items/helm_bone_helm.png', name: '본헬름', price: 12000, type: 'helmet', category: '공용 모자', reqLevel: 35, def: 18, spd: 8, jump: 5, upgradeSlots: 7, icon: '💀', desc: '이동속도 +8, 점프력 +5의 최고급 명품 투구입니다.' },
  { id: 'ov_sauna_robe', iconPath: 'assets/items/ov_sauna_robe.png', name: '사우나 가운', price: 15000, type: 'overall', category: '공용 전신', reqLevel: 50, def: 20, spd: 10, upgradeSlots: 10, icon: '👘', desc: '이동속도 +10 및 10회 업그레이드 슬롯의 명품 가운입니다.' },

  // 4. 레벨별 클래식 무기 상점
  { id: 'wp_two_handed_sword', iconPath: 'assets/items/wp_two_handed_sword.png', name: '강철 양손검', price: 4000, type: 'weapon', weaponType: 'sword', category: '전사 양손검', reqLevel: 20, atk: 32, str: 1, upgradeSlots: 7, icon: '⚔️', desc: '20레벨 전사들을 위한 묵직한 강철 양손검입니다.' },
  { id: 'wp_highlander', iconPath: 'assets/items/wp_highlander.png', name: '하이랜더', price: 10000, type: 'weapon', weaponType: 'sword', category: '전사 양손검', reqLevel: 30, atk: 50, str: 2, spd: 5, attackSpeedBonus: 0.06, upgradeSlots: 7, icon: '⚔️', desc: '30레벨 2차 전직 모험가의 상징 명품 양손검입니다.' },
  { id: 'wp_meba', iconPath: 'assets/items/wp_meba.png', name: '메바', price: 8000, type: 'weapon', weaponType: 'claw', category: '도적 아대', reqLevel: 25, atk: 22, luk: 1, spd: 5, attackSpeedBonus: 0.2, upgradeSlots: 7, icon: '🦅', desc: '매우 빠른 연사 속도를 자랑하는 도적 국민 아대입니다.' },
  { id: 'star_kumbi', name: '금비표창', price: 7000, type: 'star', starType: 'kumbi', category: '도적 표창', reqLevel: 25, atk: 21, count: 800, upgradeSlots: 15, icon: '✨', iconPath: 'assets/projectiles/stars/kumbi_icon.png', desc: '찬란한 순금 빛으로 날아가는 4방 황금 표창입니다.' },
  { id: 'wp_ryden', iconPath: 'assets/items/wp_ryden.png', name: '라이덴', price: 10000, type: 'weapon', weaponType: 'bow', category: '궁수 활', reqLevel: 35, atk: 42, dex: 1, spd: 2, upgradeSlots: 7, icon: '🏹', desc: '번개의 탄성을 지닌 날렵한 명품 활입니다.' },
  { id: 'wp_wizard_wand', iconPath: 'assets/items/wp_wizard_wand.png', name: '위저드 완드', price: 9000, type: 'weapon', weaponType: 'staff', category: '마법사 완드', reqLevel: 30, atk: 40, int: 2, upgradeSlots: 7, icon: '🔮', desc: '정제된 마력석이 박힌 30레벨 마법사용 완드입니다.' }
];

const ITEM_SELL_PRICES = {
  'snail_shell': 2,
  'blue_snail_shell': 3,
  'red_snail_shell': 5,
  'slime_liquid': 8,
  'mushroom_cap': 10,
  'ribbon': 12,
  'red_potion': 25,
  'blue_potion': 50,
  'orange_potion': 80,
  'white_potion': 160,
  'mana_elixir': 310,
  'pan_lid': 2500,
  'shd_pan_lid': 2500,
  'zakum_helm': 50000,
  'helm_zakum': 50000,
  'helm_brown_bamboo': 1000,
  'glv_work_glove': 1500,
  'sho_snow_shoes': 3500,
  'cape_ragged': 1800,
  'helm_bone_helm': 8000,
  'ov_sauna_robe': 10000,
  'wp_two_handed_sword': 3000,
  'wp_highlander': 7000,
  'wp_meba': 5500,
  'star_kumbi': 4500,
  'wp_ryden': 7000,
  'wp_wizard_wand': 6500
};

class ShopSystem {
  static buyItem(player, shopItem, game) {
    if (!player || !shopItem) return false;
    const offer = SHOP_ITEMS_FOR_SALE.find(item => item.id === shopItem.id);
    if (!offer || !Number.isFinite(offer.price) || offer.price < 0) return false;
    const existing = player.inventory.use.find(item => item.id === offer.id);
    if (!existing && player.inventory.use.length >= 24) {
      game?.ui?.addChat?.('system', '소비 인벤토리 공간이 부족합니다.');
      return false;
    }
    if (player.meso < offer.price) {
      game?.ui?.addChat?.('system', '메소가 부족합니다.');
      return false;
    }
    player.meso -= offer.price;
    if (window.audio) window.audio.playPickItem();

    if (offer.type === 'use') {
      if (existing) {
        existing.count += 1;
        if (offer.healHp !== undefined) existing.healHp = offer.healHp;
        if (offer.healMp !== undefined) existing.healMp = offer.healMp;
      } else {
        player.inventory.use.push({...offer, type: offer.itemType || 'potion', count: 1});
      }
    } else {
      // Equipment / Weapons / Stars purchase
      if (player.inventory.equip.length >= 24) {
        game?.ui?.addChat?.('system', '장비 인벤토리 공간이 부족합니다.');
        return false;
      }
      const newEquip = {
        ...offer,
        item_uuid: 'eq_shop_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        statVariation: 0,
        upgradeSlots: offer.upgradeSlots || 7,
        successCount: 0,
        equipped: false
      };
      player.inventory.equip.push(newEquip);
      game?.ui?.renderInventoryTab?.('equip');
    }
    player.persistProgress?.(game);
    if (game?.ui) {
      game.ui.updateHUD();
      game.ui.renderInventoryTab('use');
      game.ui.addChat('system', `🛍️ [구매 완료] ${offer.name} 1개를 ${offer.price} 메소에 구매했습니다.`);
    }
    return true;
  }

  static sellItem(player, tabName, index, game) {
    if (!player || !['equip', 'use', 'etc'].includes(tabName) || !Number.isInteger(index)) return false;
    const list = player.inventory[tabName];
    if (!list || !list[index]) return false;

    const item = list[index];
    if (item.equipped) {
      game?.ui?.addChat?.('system', '장착 중인 장비는 해제한 뒤 판매하세요.');
      return false;
    }
    if (item.count !== undefined && (!Number.isInteger(item.count) || item.count <= 0)) return false;
    const unitPrice = ITEM_SELL_PRICES[item.id] || Math.max(1, Math.floor((item.price || 10) * 0.4));
    const countToSell = item.count ? Math.min(item.count, 10) : 1;
    const totalGain = unitPrice * countToSell;

    player.meso += totalGain;
    if (item.count) {
      item.count -= countToSell;
      if (item.count <= 0) {
        list.splice(index, 1);
      }
    } else {
      list.splice(index, 1);
    }

    if (window.audio) window.audio.playPickItem();
    player.calcDerivedStats?.();
    player.persistProgress?.(game);
    if (game?.ui) {
      game.ui.updateHUD();
      game.ui.renderInventoryTab(tabName);
      game.ui.addChat('system', `💰 [판매 완료] ${item.name} x${countToSell}을(를) 판매하여 ${totalGain} 메소를 획득했습니다.`);
    }
    return true;
  }
}

window.ShopSystem = ShopSystem;
window.SHOP_ITEMS_FOR_SALE = SHOP_ITEMS_FOR_SALE;
window.ITEM_SELL_PRICES = ITEM_SELL_PRICES;
