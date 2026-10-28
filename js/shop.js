// js/shop.js - Classic Town General Store & Equipment Merchant System

const SHOP_ITEMS_FOR_SALE = [
  { id: 'red_potion', name: '빨간 포션', price: 50, type: 'use', count: 1, icon: '🧪', desc: 'HP를 약 50 회복시켜 줍니다.' },
  { id: 'orange_potion', name: '주황 포션', price: 160, type: 'use', count: 1, icon: '🧪', desc: 'HP를 약 150 회복시켜 줍니다.' },
  { id: 'white_potion', name: '하얀 포션', price: 320, type: 'use', count: 1, icon: '🧪', desc: 'HP를 약 300 회복시켜 줍니다.' },
  { id: 'blue_potion', name: '파란 포션', price: 100, type: 'use', count: 1, icon: '💙', desc: 'MP를 약 50 회복시켜 줍니다.' },
  { id: 'mana_elixir', name: '마나 엘릭서', price: 620, type: 'use', count: 1, icon: '💧', desc: 'MP를 약 300 회복시켜 줍니다.' },
  { id: 'town_scroll', name: '마을 귀환 주문서', price: 300, type: 'use', count: 1, icon: '📜', desc: '가장 가까운 마을(헤네시스)로 즉시 귀환합니다.' },
  { id: 'scroll_atk_60', name: '무기 공격력 주문서 60%', price: 12000, type: 'use', itemType: 'scroll', count: 1, rate: 0.6, bonusAtk: 2, icon: '📜', desc: '무기에 공격력 +2를 부여합니다. (성공률 60%)' }
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
    if (player.meso < shopItem.price) {
      alert('메소가 부족합니다!');
      return false;
    }

    player.meso -= shopItem.price;
    if (window.audio) window.audio.playPickItem();

    if (shopItem.type === 'use') {
      const existing = player.inventory.use.find(i => i.id === shopItem.id);
      if (existing) {
        existing.count += 1;
      } else {
        player.inventory.use.push({
          id: shopItem.id,
          name: shopItem.name,
          type: shopItem.itemType || 'potion',
          count: 1,
          rate: shopItem.rate,
          bonusAtk: shopItem.bonusAtk
        });
      }
    }

    if (game.ui) {
      game.ui.updateHUD();
      game.ui.renderInventoryTab('use');
      game.ui.addChat('system', `🛍️ [구매 완료] ${shopItem.name} 1개를 ${shopItem.price} 메소에 구매했습니다.`);
    }
    return true;
  }

  static sellItem(player, tabName, index, game) {
    if (!player) return false;
    const list = player.inventory[tabName];
    if (!list || !list[index]) return false;

    const item = list[index];
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
    if (game.ui) {
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
