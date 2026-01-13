// tools/find_missing_drop_items.mjs
// Знайти предмети в дропах, які не існують в itemsDB

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Завантажуємо itemsDB
const itemsDBPath = path.join(__dirname, '..', 'src', 'data', 'items', 'itemsDB.ts');
let itemsDBContent = fs.readFileSync(itemsDBPath, 'utf-8');

// Витягуємо всі ключі з itemsDB (простий regex)
const itemsDBKeys = new Set();
const keyRegex = /^\s+([a-z_][a-z0-9_]*):\s*\{/gm;
let match;
while ((match = keyRegex.exec(itemsDBContent)) !== null) {
  itemsDBKeys.add(match[1]);
}

console.log(`Знайдено ${itemsDBKeys.size} ключів в itemsDB\n`);

// Завантажуємо дані з XML для маппінгу
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

// Створюємо маппінг назва -> ключ
const nameToKeyMap = new Map();
itemsFromXML.forEach(item => {
  const key = generateKey(item.name);
  nameToKeyMap.set(item.name.toLowerCase(), key);
});

// Знаходимо всі файли з зонами
const zonesDir = path.join(__dirname, '..', 'src', 'data', 'zones');
const zoneFiles = fs.readdirSync(zonesDir).filter(f => f.endsWith('.ts'));

const missingItems = new Map(); // drop.id -> { file, line, suggestedKey }

zoneFiles.forEach(fileName => {
  const filePath = path.join(zonesDir, fileName);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Шукаємо id: "..." в дропах
    const idMatch = line.match(/id:\s*"([^"]+)"/);
    if (idMatch) {
      const dropId = idMatch[1];
      
      // Пропускаємо спеціальні ID
      if (dropId === 'adena' || dropId.startsWith('rb_') || dropId.includes('_drop')) {
        return;
      }
      
      // Перевіряємо, чи існує в itemsDB
      if (!itemsDBKeys.has(dropId)) {
        if (!missingItems.has(dropId)) {
          missingItems.set(dropId, []);
        }
        missingItems.get(dropId).push({
          file: fileName,
          line: index + 1,
          content: line.trim()
        });
      }
    }
  });
});

console.log(`Знайдено ${missingItems.size} унікальних предметів, які не існують в itemsDB:\n`);

// Спробуємо знайти правильні ключі для них
const suggestions = new Map();

missingItems.forEach((locations, dropId) => {
  // Спробуємо знайти за назвою (прибираємо префікс c_, d_, b_, a_, s_)
  const nameWithoutPrefix = dropId.replace(/^[cdbas]_/, '');
  
  // Шукаємо в XML за назвою
  const found = itemsFromXML.find(item => {
    const itemKey = generateKey(item.name);
    return itemKey === nameWithoutPrefix || itemKey === dropId;
  });
  
  if (found) {
    const correctKey = generateKey(found.name);
    suggestions.set(dropId, correctKey);
    console.log(`✅ ${dropId} -> ${correctKey} (${found.name})`);
    locations.forEach(loc => {
      console.log(`   ${loc.file}:${loc.line}`);
    });
  } else {
    console.log(`❌ ${dropId} - не знайдено в XML`);
    locations.forEach(loc => {
      console.log(`   ${loc.file}:${loc.line}: ${loc.content}`);
    });
  }
  console.log('');
});

// Виводимо статистику
console.log(`\nСтатистика:`);
console.log(`- Унікальних відсутніх предметів: ${missingItems.size}`);
console.log(`- Знайдено правильних ключів: ${suggestions.size}`);
console.log(`- Не знайдено: ${missingItems.size - suggestions.size}`);




