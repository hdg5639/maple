// Run with: node --test test_rpg_progression.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function fixture() {
  const saved = new Map();
  const context = vm.createContext({
    window: {audio: new Proxy({}, {get: () => () => {}}), sprites: {spawnLandingDust() {}}},
    localStorage: {setItem: (key, value) => saved.set(key, value), getItem: key => saved.get(key) ?? null},
    console, setTimeout() {}
  });
  for (const name of ['sprite_grounding', 'physics', 'shop', 'storage', 'entities', 'skills']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'js', name + '.js'), 'utf8'), context,
      {filename: name + '.js'});
  }
  const player = new context.window.Player();
  let saves = 0;
  const experience = [];
  const game = {player, map: {currentKey: 'henesys_hhg'}, skillEffects: [],
    ui: new Proxy({}, {get: () => () => {}}), autoHunt: {recordKill() {}},
    spawnExpText(_x, _y, amount) {experience.push(amount);}, spawnItemText() {}, spawnMesoText() {}, spawnDrop() {},
    saveProgress() {saves++; return context.window.StorageManager.save(player, 'henesys_hhg');}};
  context.window.game = game;
  return {context, player, game, saved, experience, saves: () => saves,
    readSave: () => context.window.StorageManager.load(),
    random: value => vm.runInContext(`Math.random = () => ${value}`, context)};
}

test('every playable job has a larger survivability and mana pool without compounding recalculations', () => {
  const {player} = fixture();
  for (const job of ['초보자', '전사', '마법사', '궁수', '도적']) {
    player.setJob(job);
    assert.ok(player.maxHp >= 300);
    assert.ok(player.maxMp >= 100);
    assert.equal(player.hp, player.maxHp);
    const hp = player.maxHp, mp = player.maxMp;
    for (let i = 0; i < 5; i++) player.calcDerivedStats();
    assert.equal(player.maxHp, hp);
    assert.equal(player.maxMp, mp);
  }
});

test('alive players recover HP/MP in two seconds while dead players never regenerate back to life', () => {
  const {player} = fixture();
  const map = {width: 2000, height: 2000, footholds: []};
  player.hp = 1;
  player.mp = 0;
  player.update(2, map);
  assert.ok(player.hp > 1 && player.mp > 0);
  player.hp = 0;
  player.update(2, map);
  assert.equal(player.hp, 0);
});

test('the shared revive path returns dead players to a safe town with usable resources', () => {
  const {player, game, readSave} = fixture();
  let destination = null;
  game.changeMap = key => { destination = key; };
  player.hp = 0;
  player.mp = 0;
  player.buffs.rage = {duration: 40};
  assert.equal(player.revive(game), true);
  assert.equal(destination, 'henesys_town');
  assert.equal(player.hp, player.maxHp);
  assert.equal(player.mp, player.maxMp);
  assert.ok(player.invincibleTimer > 0);
  assert.equal(Object.keys(player.buffs).length, 0);
  assert.equal(readSave().hp, player.maxHp);
  assert.equal(player.revive(game), false, 'living players could use revival as free healing');
});

test('crossing the EXP threshold grants exactly one level, AP/SP and a saved full recovery', () => {
  const {player, game, readSave, experience} = fixture();
  const threshold = player.maxExp, ap = player.ap, sp = player.sp;
  player.hp = 1;
  player.mp = 0;
  assert.equal(player.gainExp(threshold, game), threshold);
  assert.equal(player.level, 2);
  assert.equal(player.exp, 0);
  assert.equal(player.ap, ap + 5);
  assert.equal(player.sp, sp + 3);
  assert.equal(player.hp, player.maxHp);
  assert.equal(player.mp, player.maxMp);
  assert.equal(game.skillEffects.filter(effect => effect.type === 'level_up').length, 1);
  assert.equal(readSave().level, 2);
  assert.equal(readSave().exp, 0);
  assert.deepEqual(experience, [threshold]);
});

test('one EXP reward can cross several levels while preserving its leftover EXP', () => {
  const {player, game, context, readSave} = fixture();
  const Player = context.window.Player;
  const reward = Player.expRequiredForLevel(1) + Player.expRequiredForLevel(2) + 10;
  player.gainExp(reward, game);
  assert.equal(player.level, 3);
  assert.equal(player.exp, 10);
  assert.equal(player.maxExp, Player.expRequiredForLevel(3));
  assert.equal(readSave().exp, 10);
  assert.equal(readSave().level, 3);
});

test('job changes save the final new skill roster and fully restored resource pools', () => {
  const {player, readSave} = fixture();
  player.mp = 1;
  player.setJob('마법사');
  const saved = readSave();
  assert.equal(saved.job, '마법사');
  assert.equal(saved.hp, player.maxHp);
  assert.equal(saved.mp, player.maxMp);
  assert.ok(saved.skills.magic_claw && saved.skills.energy_bolt);
  assert.equal(saved.skills.three_snails, undefined);
});

test('Holy Symbol returns the actual credited reward and invalid EXP rewards are ignored', () => {
  const {player, game, experience} = fixture();
  player.buffs.holy_symbol = {duration: 60};
  assert.equal(player.gainExp(4, game), 6);
  assert.equal(player.exp, 6);
  assert.deepEqual(experience, [6]);
  for (const value of [0, -1, Infinity, NaN]) assert.equal(player.gainExp(value, game), 0);
  assert.equal(player.exp, 6);
});

test('the level cap cannot grant repeated AP/SP or loop on huge rewards', () => {
  const {player, game, context} = fixture();
  player.level = context.window.Player.MAX_LEVEL - 1;
  player.maxExp = context.window.Player.expRequiredForLevel(player.level);
  player.gainExp(player.maxExp, game);
  assert.equal(player.level, 200);
  assert.equal(player.exp, 0);
  const ap = player.ap, sp = player.sp;
  assert.equal(player.gainExp(Number.MAX_SAFE_INTEGER, game), 0);
  assert.equal(player.level, 200);
  assert.equal(player.ap, ap);
  assert.equal(player.sp, sp);
});

test('an actual monster death credits EXP once through the player progression path', () => {
  const {context, player, game, experience} = fixture();
  const monster = new context.window.Monster('snail', 500, 200);
  monster.takeDamage(monster.maxHp + 1, false, 'right', game);
  monster.takeDamage(monster.maxHp + 1, false, 'right', game);
  assert.equal(experience.length, 1);
  assert.equal(experience[0], monster.exp);
  assert.equal(player.exp, monster.exp);
});

test('guaranteed weapon enhancement consumes one scroll, one slot and the disclosed meso fee', () => {
  const {player, game, readSave} = fixture();
  const weapon = player.inventory.equip.find(item => item.equipped && item.type === 'weapon');
  const scroll = player.inventory.use.find(item => item.id === 'scroll_atk_100');
  const before = {atk: weapon.atk, maxAtk: player.maxAtk, slots: weapon.upgradeSlots, count: scroll.count, meso: player.meso};
  const fee = player.getEnhancementFee(weapon);
  const result = player.enhanceEquipment(weapon, scroll, game);
  assert.equal(result.success, true);
  assert.equal(weapon.atk, before.atk + 1);
  assert.equal(player.maxAtk, before.maxAtk + 1);
  assert.equal(weapon.upgradeSlots, before.slots - 1);
  assert.equal(scroll.count, before.count - 1);
  assert.equal(player.meso, before.meso - fee);
  assert.equal(readSave().inventory.equip.find(item => item.id === weapon.id).atk, weapon.atk);
  assert.equal(readSave().meso, player.meso);
});

test('a zero-percent failed enhancement charges resources but preserves existing equipment stats', () => {
  const {player, game, random, readSave} = fixture();
  random(0);
  const weapon = player.inventory.equip.find(item => item.equipped && item.type === 'weapon');
  const scroll = {id: 'forced_failure', type: 'scroll', count: 1, rate: 0, bonusAtk: 99};
  player.inventory.use.push(scroll);
  const before = {atk: weapon.atk, maxAtk: player.maxAtk, slots: weapon.upgradeSlots, meso: player.meso};
  const fee = player.getEnhancementFee(weapon);
  const result = player.enhanceEquipment(weapon, scroll, game);
  assert.equal(result.success, false);
  assert.equal(weapon.atk, before.atk);
  assert.equal(player.maxAtk, before.maxAtk);
  assert.equal(weapon.upgradeSlots, before.slots - 1);
  assert.equal(player.meso, before.meso - fee);
  assert.equal(player.inventory.use.includes(scroll), false);
  assert.equal(readSave().inventory.equip.find(item => item.id === weapon.id).upgradeSlots, weapon.upgradeSlots);
});

test('enhancement rejects insufficient funds, incompatible or unowned items without mutations', () => {
  const {player, game, saves} = fixture();
  const weapon = player.inventory.equip.find(item => item.equipped && item.type === 'weapon');
  const attack = player.inventory.use.find(item => item.id === 'scroll_atk_100');
  const defense = player.inventory.use.find(item => item.id === 'scroll_def_100');
  player.meso = 0;
  const before = JSON.stringify(player.inventory);
  assert.equal(player.enhanceEquipment(weapon, attack, game), false);
  player.meso = 10000;
  assert.equal(player.enhanceEquipment(weapon, defense, game), false);
  assert.equal(player.enhanceEquipment({...weapon}, attack, game), false);
  assert.equal(JSON.stringify(player.inventory), before);
  assert.equal(saves(), 0);
});

test('exhausted equipment cannot consume another scroll or another fee', () => {
  const {player, game, saves} = fixture();
  const weapon = player.inventory.equip.find(item => item.equipped && item.type === 'weapon');
  const scroll = player.inventory.use.find(item => item.id === 'scroll_atk_100');
  weapon.upgradeSlots = 0;
  const count = scroll.count, meso = player.meso;
  assert.equal(player.enhanceEquipment(weapon, scroll, game), false);
  assert.equal(scroll.count, count);
  assert.equal(player.meso, meso);
  assert.equal(saves(), 0);
});

test('armor enhancement applies once and unequipping removes both original and enhanced defense', () => {
  const {player, game} = fixture();
  const armor = player.inventory.equip.find(item => item.equipped && item.type === 'hat');
  const scroll = player.inventory.use.find(item => item.id === 'scroll_def_100');
  const initialDefense = player.defense, originalArmorDefense = armor.def;
  player.enhanceEquipment(armor, scroll, game);
  assert.equal(player.defense, initialDefense + 2);
  player.calcDerivedStats();
  assert.equal(player.defense, initialDefense + 2);
  player.toggleEquip(armor);
  assert.equal(player.defense, initialDefense - originalArmorDefense);
  player.toggleEquip(armor);
  assert.equal(player.defense, initialDefense + 2);
});

test('weapon speed bonuses derive from the equipped weapon and roll back on switching', () => {
  const {player} = fixture();
  player.equipById('wp_meba');
  assert.ok(player.attackSpeedBonus > 0);
  player.equipById('wp_wood_sword');
  assert.equal(player.attackSpeedBonus, 0);
});

test('purchased potions retain healing metadata and restore the advertised HP', () => {
  const {player, game, context} = fixture();
  const offer = context.window.SHOP_ITEMS_FOR_SALE.find(item => item.id === 'orange_potion');
  const meso = player.meso;
  assert.equal(context.window.ShopSystem.buyItem(player, {...offer, price: 0}, game), true);
  assert.equal(player.meso, meso - offer.price, 'purchase did not use the canonical shop price');
  player.hp = 1;
  assert.equal(player.usePotion('orange_potion'), true);
  assert.equal(player.hp, 151);
});

test('equipped items cannot be sold, and unequipped enhanced equipment sells without stale stats', () => {
  const {player, game, context, readSave} = fixture();
  const weapon = player.inventory.equip.find(item => item.equipped && item.type === 'weapon');
  const scroll = player.inventory.use.find(item => item.id === 'scroll_atk_100');
  player.enhanceEquipment(weapon, scroll, game);
  const index = player.inventory.equip.indexOf(weapon);
  assert.equal(context.window.ShopSystem.sellItem(player, 'equip', index, game), false);
  player.toggleEquip(weapon);
  const unequippedAttack = player.maxAtk;
  assert.equal(context.window.ShopSystem.sellItem(player, 'equip', index, game), true);
  assert.equal(player.maxAtk, unequippedAttack);
  assert.equal(player.inventory.equip.includes(weapon), false);
  assert.equal(readSave().inventory.equip.some(item => item.id === weapon.id), false);
});

test('a full consumable inventory cannot charge for an invisible extra shop item', () => {
  const {player, game, context} = fixture();
  player.inventory.use = Array.from({length: 24}, (_, i) => ({id: `full-${i}`, count: 1}));
  const offer = context.window.SHOP_ITEMS_FOR_SALE.find(item => item.id === 'orange_potion');
  const meso = player.meso;
  assert.equal(context.window.ShopSystem.buyItem(player, offer, game), false);
  assert.equal(player.meso, meso);
  assert.equal(player.inventory.use.length, 24);
});
