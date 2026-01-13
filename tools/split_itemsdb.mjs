// tools/split_itemsdb.mjs
// Скрипт для розділення великого itemsDB.ts на частини

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Завантажуємо дані з XML
const itemsFromXML = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'items_with_icons.json'), 'utf-8')
);

// Глобальний Map для відстеження використаних ключів
const usedKeys = new Map();

console.log(`Завантажено ${itemsFromXML.length} предметів`);

// Розділяємо на частини по 1000 предметів
const CHUNK_SIZE = 1000;
const chunks = [];

for (let i = 0; i < itemsFromXML.length; i += CHUNK_SIZE) {
  chunks.push(itemsFromXML.slice(i, i + CHUNK_SIZE));
}

console.log(`Розділено на ${chunks.length} частин`);

// Генеруємо файли для кожної частини
chunks.forEach((chunk, chunkIndex) => {
  let code = `// src/data/items/itemsDB_chunk_${chunkIndex}.ts
// AUTO-GENERATED from XML files - Part ${chunkIndex + 1} of ${chunks.length}

import type { ItemDefinition } from './itemsDB.types';

export const itemsDBChunk${chunkIndex}: Record<string, ItemDefinition> = {\n`;

  chunk.forEach((item) => {
    const itemId = generateItemId(item.name, item.id);
    const kind = getItemKind(item);
    const icon = `/items/drops/items/${item.id}.jpg`;
    const description = `${item.name} (ID: ${item.id})`;
    
    let statsCode = '';
    if (Object.keys(item.stats).length > 0) {
      statsCode = `,\n    stats: ${JSON.stringify(item.stats)}`;
    }
    
    let extraFields = '';
    if (item.grade) {
      extraFields += `,\n    grade: "${item.grade}"`;
    }
    if (item.armorType) {
      extraFields += `,\n    armorType: "${item.armorType}"`;
    }
    
    code += `  ${itemId}: {\n`;
    code += `    id: "${itemId}",\n`;
    code += `    name: "${item.name}",\n`;
    code += `    kind: "${kind}",\n`;
    code += `    slot: "${item.slot || 'other'}",\n`;
    code += `    icon: "${icon}",\n`;
    code += `    description: "${description}"${statsCode}${extraFields}\n`;
    code += `  },\n`;
  });
  
  code += `};\n`;
  
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'items', `itemsDB_chunk_${chunkIndex}.ts`);
  fs.writeFileSync(outputPath, code, 'utf-8');
  console.log(`Згенеровано chunk ${chunkIndex + 1}/${chunks.length}`);
});

// Генеруємо головний файл itemsDB.ts
let mainCode = `// src/data/items/itemsDB.ts
// AUTO-GENERATED from XML files
// DO NOT EDIT MANUALLY - use tools/split_itemsdb.mjs

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

`;

// Додаємо імпорти для всіх chunk'ів
for (let i = 0; i < chunks.length; i++) {
  mainCode += `import { itemsDBChunk${i} } from './itemsDB_chunk_${i}';\n`;
}

mainCode += `\n// Об'єднуємо всі частини\n`;
mainCode += `export const itemsDB: Record<string, ItemDefinition> = {\n`;

for (let i = 0; i < chunks.length; i++) {
  mainCode += `  ...itemsDBChunk${i},\n`;
}

mainCode += `};\n\n`;

// Додаємо starterKitDefault зі старого файлу
mainCode += `export const starterKitDefault = {
  adena: 200,

  items: [
    // Броня
    "ng_helmet_leather",
    "ng_armor_t02",
    "ng_gaiters_t02",
    "ng_gloves_leather",
    "ng_boots_leather",
    "ng_tower_shield",
    
    // Зброя (одна з трьох на вибір - за замовчуванням булава)
    "ng_buzdygan",
    
    // Зілля та расходники
    "potion_hp_scarlet",
    "potion_mp_blue",
    "potion_cp",
    "soulshot_ng_silver",
    "spiritshot_ng",
  ],

  quantities: {
    potion_hp_scarlet: 20,
    potion_mp_blue: 20,
    potion_cp: 10,
    soulshot_ng_silver: 200,
    spiritshot_ng: 200,
  },
};\n`;

const mainOutputPath = path.join(__dirname, '..', 'src', 'data', 'items', 'itemsDB.ts');
fs.writeFileSync(mainOutputPath, mainCode, 'utf-8');

console.log(`\n✅ Головний файл itemsDB.ts згенеровано`);

// Допоміжні функції
function generateItemId(name, id) {
  let itemId = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  // Якщо починається з цифри, додаємо префікс
  if (/^\d/.test(itemId)) {
    itemId = `item_${itemId}`;
  }
  
  if (itemId.length < 3) {
    itemId = `item_${id}`;
  }
  
  // Перевіряємо на дублікати та додаємо ID якщо потрібно
  if (usedKeys.has(itemId)) {
    // Якщо ключ вже використовується, додаємо ID для унікальності
    itemId = `${itemId}_${id}`;
  }
  
  usedKeys.set(itemId, id);
  return itemId;
}

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

