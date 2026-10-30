// Run with: node --test test_buff_stats.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function createFixture() {
  const context = vm.createContext({ window: { audio: { playLevelUp() {} } } });
  for (const file of ['physics.js', 'entities.js', 'skills.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'js', file), 'utf8'), context, { filename: file });
  }
  const player = new context.window.Player();
  const game = { spawnItemText() {} };
  const map = { width: 2000, height: 2000, footholds: [] };
  const castIronBody = () => context.window.SkillRegistry.execute('iron_body', player, game);
  return { player, map, castIronBody };
}

test('Iron Body adds its advertised 25 defense through the registered skill', () => {
  const { player, castIronBody } = createFixture();
  const baseDefense = player.defense;
  assert.equal(castIronBody(), true);
  assert.equal(player.defense, baseDefense + 25);
});

test('recalculation and refreshing Iron Body never stack its defense bonus', () => {
  const { player, map, castIronBody } = createFixture();
  const baseDefense = player.defense;
  assert.equal(castIronBody(), true);
  for (let i = 0; i < 5; i++) player.calcDerivedStats();
  assert.equal(player.defense, baseDefense + 25);
  player.update(0.31, map); // Refresh after the common buff cast delay.
  assert.equal(castIronBody(), true);
  assert.equal(player.defense, baseDefense + 25);
});

test('Iron Body expires through Player.update and restores the original defense', () => {
  const { player, map, castIronBody } = createFixture();
  const baseDefense = player.defense;
  assert.equal(castIronBody(), true);
  assert.equal(player.defense, baseDefense + 25);
  player.buffs.iron_body.duration = 1 / 60;
  player.update(1 / 60, map);
  assert.equal(player.buffs.iron_body, undefined);
  assert.equal(player.defense, baseDefense);
});

test('equipment changes combine with Iron Body and survive its expiration', () => {
  const { player, map, castIronBody } = createFixture();
  const baseDefense = player.defense;
  const armor = { id: 'test_armor', def: 12, str: 5, equipped: true };
  player.inventory.equip.push(armor);
  player.calcDerivedStats();
  const equippedDefense = player.defense;
  assert.equal(equippedDefense, baseDefense + 13);
  assert.equal(castIronBody(), true);
  assert.equal(player.defense, equippedDefense + 25);
  armor.equipped = false;
  player.calcDerivedStats();
  assert.equal(player.defense, baseDefense + 25);
  armor.equipped = true;
  player.calcDerivedStats();
  assert.equal(player.defense, equippedDefense + 25);
  player.buffs.iron_body.duration = 1 / 60;
  player.update(1 / 60, map);
  assert.equal(player.defense, equippedDefense);
});
