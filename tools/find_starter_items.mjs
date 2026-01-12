// tools/find_starter_items.mjs
// Скрипт для пошуку предметів стартового набору за іконками

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Завантажуємо backup itemsDB для пошуку
const backupPath = path.join(__dirname, '..', 'src', 'data', 'items', 'itemsDB.backup.ts');
const backupContent = fs.readFileSync(backupPath, 'utf-8');

// Шукаємо предмети за іконками
const iconPatterns = [
  '/items/drops/arrom_ng/Tunic of Devotion',
  '/items/drops/arrom_ng/Stockings of Devotion',
  '/items/drops/arrom_ng/Devotion Gloves',
  '/items/drops/arrom_ng/Native Tunic',
  '/items/drops/arrom_ng/Native Helmet',
  '/items/drops/arrom_ng/Native Pants',
  '/items/drops/arrom_ng/Native Gloves',
  '/items/drops/arrom_ng/Weapon_mace_i00',
  '/items/drops/arrom_ng/Weapon_iron_hammer_i00',
  '/items/drops/arrom_ng/Shield_leather_shield_i00',
];

console.log('Пошук предметів за іконками...\n');

iconPatterns.forEach(pattern => {
  const regex = new RegExp(pattern.replace(/\//g, '\\/').replace(/\./g, '\\.'), 'i');
  const matches = backupContent.match(new RegExp(`(\\w+):\\s*{[^}]*"icon":\\s*"[^"]*${pattern.replace(/\[/g, '\\[').replace(/\]/g, '\\]')}[^"]*"[^}]*"id":\\s*"([^"]+)"`, 'si'));
  
  if (matches) {
    console.log(`${pattern}:`);
    console.log(`  Key: ${matches[1]}`);
    console.log(`  ID: ${matches[2]}`);
    console.log('');
  } else {
    // Спробуємо інший підхід - шукаємо всі збіги з icon
    const allMatches = backupContent.match(new RegExp(`(\\w+):\\s*{[^}]*"icon":\\s*"[^"]*${pattern.split('/').pop().replace(/\./g, '\\.')}[^"]*"`, 'gi'));
    if (allMatches) {
      console.log(`${pattern}: знайдено ${allMatches.length} збігів`);
      allMatches.slice(0, 3).forEach(m => {
        const idMatch = m.match(/"id":\s*"([^"]+)"/);
        if (idMatch) console.log(`  ID: ${idMatch[1]}`);
      });
      console.log('');
    }
  }
});


