// tools/update_itemsdb_from_xml.mjs
// Скрипт для оновлення itemsDB.ts з використанням даних з XML

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Завантажуємо дані з XML
const itemsFromXML = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'items_with_icons.json'), 'utf-8')
);

// Створюємо маппінг ID → дані
const itemsMap = new Map();
itemsFromXML.forEach(item => {
  itemsMap.set(item.id, item);
});

console.log(`Завантажено ${itemsMap.size} предметів з XML`);

// Функція для генерації ID з назви (для itemsDB)
function generateItemId(name, id) {
  // Прибираємо спеціальні символи та перетворюємо на lowercase з підкресленнями
  let itemId = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  // Якщо ID дуже короткий або порожній, використовуємо ID
  if (itemId.length < 3) {
    itemId = `item_${id}`;
  }
  
  return itemId;
}

// Функція для визначення типу предмета
function getItemKind(item) {
  if (item.type === 'Weapon') {
    return 'weapon';
  }
  if (item.type === 'Armor') {
    if (item.slot === 'head') return 'helmet';
    if (item.slot === 'boots') return 'boots';
    if (item.slot === 'gloves') return 'gloves';
    if (item.slot === 'legs') return 'armor';
    if (item.slot === 'armor') return 'armor';
    if (item.slot === 'shield') return 'shield';
    return 'armor';
  }
  if (item.type === 'EtcItem') {
    if (item.etcitemType === 'material') return 'resource';
    if (item.etcitemType === 'potion') return 'consumable';
    if (item.etcitemType === 'scroll') return 'other';
    return 'resource';
  }
  return 'other';
}

// Генеруємо TypeScript код для itemsDB
function generateItemsDB() {
  let code = `// src/data/items/itemsDB.ts
// AUTO-GENERATED from XML files
// DO NOT EDIT MANUALLY - use tools/update_itemsdb_from_xml.mjs

export interface ItemDefinition {
  id: string;
  name: string;
  kind: string;
  icon: string;
  description: string;
  stats?: any;
  slot: string;
  restoreHp?: number;
  restoreMp?: number;
  armorType?: "light" | "heavy" | "robe";
  grade?: "NG" | "D" | "C" | "B" | "A" | "S";
}

export const itemsDB: Record<string, ItemDefinition> = {\n`;

  // Сортуємо по ID
  const sortedItems = Array.from(itemsMap.values()).sort((a, b) => a.id - b.id);
  
  sortedItems.forEach((item, index) => {
    const itemId = generateItemId(item.name, item.id);
    const kind = getItemKind(item);
    const icon = `/items/drops/items/${item.id}.jpg`;
    const description = `${item.name} (ID: ${item.id})`;
    
    // Формуємо stats об'єкт
    let statsCode = '';
    if (Object.keys(item.stats).length > 0) {
      statsCode = `,\n    stats: ${JSON.stringify(item.stats)}`;
    }
    
    // Формуємо додаткові поля
    let extraFields = '';
    if (item.grade) {
      extraFields += `,\n    grade: "${item.grade}"`;
    }
    if (item.armorType) {
      extraFields += `,\n    armorType: "${item.armorType}"`;
    }
    if (item.slot) {
      // slot вже є в основному об'єкті
    }
    
    code += `  ${itemId}: {\n`;
    code += `    id: "${itemId}",\n`;
    code += `    name: "${item.name}",\n`;
    code += `    kind: "${kind}",\n`;
    code += `    slot: "${item.slot || 'other'}",\n`;
    code += `    icon: "${icon}",\n`;
    code += `    description: "${description}"${statsCode}${extraFields}\n`;
    code += `  },\n`;
    
    if ((index + 1) % 100 === 0) {
      console.log(`Згенеровано ${index + 1}/${sortedItems.length} предметів...`);
    }
  });
  
  code += `};\n`;
  
  return code;
}

// Головна функція
function main() {
  console.log('Генерація itemsDB.ts...');
  
  const itemsDBCode = generateItemsDB();
  
  // Зберігаємо в файл
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'items', 'itemsDB_generated.ts');
  fs.writeFileSync(outputPath, itemsDBCode, 'utf-8');
  
  console.log(`\n✅ itemsDB.ts згенеровано: ${outputPath}`);
  console.log(`Всього предметів: ${itemsMap.size}`);
  console.log(`\n⚠️  УВАГА: Це новий файл itemsDB_generated.ts`);
  console.log(`   Перевірте його та замініть itemsDB.ts, якщо все правильно!`);
}

main();

