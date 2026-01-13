// tools/fix_raid_boss_drops.mjs
// Скрипт для оновлення ID предметів у дропах рейд-босів

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Завантажуємо дані з XML
const itemsFromXML = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'items_with_icons.json'), 'utf-8')
);

// Функція для генерації ключа з назви
function generateKey(name) {
  let key = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  if (/^\d/.test(key)) {
    key = `item_${key}`;
  }
  
  if (key.length < 3) {
    key = `item_${name}`;
  }
  
  return key;
}

// Створюємо маппінг старих ключів на нові
const oldToNewMap = {};

// Знаходимо всі C-grade предмети
const cGradeItems = itemsFromXML.filter(item => {
  const name = item.name.toLowerCase();
  const isCGrade = item.grade === 'C' || item.crystal_type === 'C';
  
  // Перевіряємо, чи це один з предметів, які використовуються в дропах
  const searchTerms = [
    'tsurugi', 'deathbreath', 'caliburs', 'paagrian hammer', 'club of nature',
    'mace of underworld', 'sages staff', 'crystal staff', 'cursed staff',
    'ghouls staff', 'grace dagger', 'dark screamer', 'cursed dagger',
    'paagrian axe', 'bec de corbin', 'scythe', 'saber sword of revolution',
    'saber elven long sword', 'steel plate helmet', 'chain hood', 'chain helmet',
    'cap of mana', 'chain mail shirt', 'chain gaiters', 'chain boots',
    'chain gloves', 'dwarven chain mail shirt', 'dwarven chain gaiters',
    'dwarven chain boots', 'dwarven chain gloves', 'karmian tunic',
    'karmian stockings', 'karmian boots', 'karmian gloves', 'demons tunic',
    'demons stockings', 'demons gloves', 'demons boots'
  ];
  
  return isCGrade && searchTerms.some(term => name.includes(term));
});

console.log('Знайдено C-grade предметів:', cGradeItems.length);
console.log('\nМаппінг старих ключів на нові:\n');

cGradeItems.forEach(item => {
  const newKey = generateKey(item.name);
  const oldKey = `c_${newKey}`;
  
  // Перевіряємо, чи старий ключ відрізняється від нового
  if (oldKey !== newKey) {
    oldToNewMap[oldKey] = newKey;
    console.log(`  ${oldKey} -> ${newKey} (${item.name})`);
  }
});

// Додаємо спеціальні випадки
const specialCases = {
  'c_deathbreath_sword': 'deathbreath_sword',
  'c_saber_sword_of_revolution': 'saber_sword_of_revolution',
  'c_saber_elven_long_sword': 'saber_elven_long_sword',
  'c_scythe': 'scythe',
};

Object.assign(oldToNewMap, specialCases);

console.log('\nСпеціальні випадки:');
Object.entries(specialCases).forEach(([old, newKey]) => {
  console.log(`  ${old} -> ${newKey}`);
});

// Тепер оновлюємо файли
const zoneFiles = [
  'gludin_village.ts',
  'gludin_highlands.ts',
  'gludin_plateau.ts',
  'floran_highlands.ts',
  'floran_peaks.ts',
];

const zonesDir = path.join(__dirname, '..', 'src', 'data', 'zones');

zoneFiles.forEach(fileName => {
  const filePath = path.join(zonesDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`\nФайл не знайдено: ${fileName}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let updated = false;
  
  Object.entries(oldToNewMap).forEach(([oldKey, newKey]) => {
    const regex = new RegExp(`"${oldKey}"`, 'g');
    if (content.includes(`"${oldKey}"`)) {
      content = content.replace(regex, `"${newKey}"`);
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`\n✅ Оновлено: ${fileName}`);
  } else {
    console.log(`\n⏭️  Пропущено (немає змін): ${fileName}`);
  }
});

console.log('\n✅ Готово!');




