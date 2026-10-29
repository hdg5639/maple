// js/shop.js - Classic Town General Store & Equipment Merchant System

const SHOP_ITEMS_FOR_SALE = [
  { id: 'red_potion', name: '빨간 포션', price: 50, type: 'use', count: 1, healHp: 50, icon: '🧪', desc: 'HP를 50 회복시켜 줍니다.' },
  { id: 'orange_potion', name: '주황 포션', price: 160, type: 'use', count: 1, healHp: 150, icon: '🧪', desc: 'HP를 150 회복시켜 줍니다.' },
  { id: 'white_potion', name: '하얀 포션', price: 320, type: 'use', count: 1, healHp: 300, icon: '🧪', desc: 'HP를 300 회복시켜 줍니다.' },
  { id: 'blue_potion', name: '파란 포션', price: 100, type: 'use', count: 1, healMp: 50, icon: '💙', desc: 'MP를 50 회복시켜 줍니다.' },
  { id: 'mana_elixir', name: '마나 엘릭서', price: 620, type: 'use', count: 1, healMp: 300, icon: '💧', desc: 'MP를 300 회복시켜 줍니다.' },
  { id: 'town_scroll', name: '마을 귀환 주문서', price: 300, type: 'use', count: 1, icon: '📜', desc: '가장 가까운 마을(헤네시스)로 즉시 귀환합니다.' },
  { id: 'scroll_atk_100', name: '무기 공격력 주문서 100%', price: 1000, type: 'use', itemType: 'scroll', count: 1, rate: 1, bonusAtk: 1, icon: '📜', desc: '무기 공격력 +1. 성공률 100%, 강화 수수료 별도.' },
  { id: 'scroll_atk_60', name: '무기 공격력 주문서 60%', price: 2000, type: 'use', itemType: 'scroll', count: 1, rate: 0.6, bonusAtk: 2, icon: '📜', desc: '무기 공격력 +2. 성공률 60%, 강화 수수료 별도.' },
  { id: 'scroll_atk_10', name: '무기 공격력 주문서 10%', price: 3000, type: 'use', itemType: 'scroll', count: 1, rate: 0.1, bonusAtk: 5, icon: '📜', desc: '무기 공격력 +5. 성공률 10%, 강화 수수료 별도.' },
  { id: 'scroll_def_100', name: '방어구 방어력 주문서 100%', price: 800, type: 'use', itemType: 'scroll', count: 1, rate: 1, bonusDef: 2, icon: '📜', desc: '방어구 방어력 +2. 성공률 100%, 강화 수수료 별도.' }
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
  'zakum_helm': 50000
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
