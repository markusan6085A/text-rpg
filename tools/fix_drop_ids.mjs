// tools/fix_drop_ids.mjs
// Скрипт для оновлення ID предметів у дропах з новими ключами з itemsDB

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Завантажуємо дані з XML
const itemsFromXML = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'items_with_icons.json'), 'utf-8')
);

// Створюємо маппінг ID → ключ
const idToKeyMap = new Map();
itemsFromXML.forEach(item => {
  let key = item.name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  if (/^\d/.test(key)) {
    key = `item_${key}`;
  }
  
  if (key.length < 3) {
    key = `item_${item.id}`;
  }
  
  // Зберігаємо маппінг ID → ключ
  idToKeyMap.set(item.id, key);
});

// Маппінг старих ключів на нові (для предметів, які не знайдені за ID)
const oldToNewKeyMap = {
  'd_bastard_sword': 'bastard_sword',
  'd_saber': 'saber',
  'd_heavy_mace': 'heavy_mace',
  'd_helmet_leather': 'leather_helmet',
  'd_armor_leather': 'leather_shirt', // або інший правильний ключ
  'd_gaiters_leather': 'leather_pants', // або інший правильний ключ
  'd_enchant_weapon_scroll': 'scroll_enchant_weapon_grade_d',
  'd_enchant_armor_scroll': 'scroll_enchant_armor_grade_d',
  'coin_of_fair': 'coin_of_fair',
  'coins_gold': 'coins_gold',
};

// Знаходимо правильні ключі для D-grade предметів
const dGradeItems = itemsFromXML.filter(item => {
  const name = item.name.toLowerCase();
  return (name.includes('bastard sword') || 
          name.includes('saber') || 
          name.includes('heavy mace') ||
          name.includes('leather helmet') ||
          name.includes('leather armor') ||
          name.includes('leather gaiters')) &&
         (item.grade === 'D' || item.crystal_type === 'D');
});

console.log('D-grade items found:');
dGradeItems.forEach(item => {
  let key = item.name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  if (/^\d/.test(key)) {
    key = `item_${key}`;
  }
  
  if (key.length < 3) {
    key = `item_${item.id}`;
  }
  
  console.log(`  ${item.name} (ID: ${item.id}) -> ${key}`);
});

// Знаходимо правильні ключі для enchant scrolls
const enchantScrolls = itemsFromXML.filter(item => {
  const name = item.name.toLowerCase();
  return name.includes('enchant') && 
         (name.includes('weapon') || name.includes('armor')) &&
         (item.grade === 'D' || item.crystal_type === 'D');
});

console.log('\nD-grade enchant scrolls found:');
enchantScrolls.forEach(item => {
  let key = item.name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  if (/^\d/.test(key)) {
    key = `item_${key}`;
  }
  
  if (key.length < 3) {
    key = `item_${item.id}`;
  }
  
  console.log(`  ${item.name} (ID: ${item.id}) -> ${key}`);
});

console.log('\nМаппінг для оновлення:');
Object.entries(oldToNewKeyMap).forEach(([old, newKey]) => {
  console.log(`  ${old} -> ${newKey}`);
});




