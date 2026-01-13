// tools/generate_resources_itemsdb.mjs
// Скрипт для генерації itemsDB тільки з ресурсів (material, potion, scroll, quest тощо)
// Видаляє старі зброї та доспехи, додає тільки ресурси з XML

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Шляхи
const XML_DIR = path.join(__dirname, 'htmlскіли', 'ітемс');
const ITEMS_ICONS_DIR = path.join(__dirname, '..', 'public', 'items', 'drops', 'items');
const RESOURCES_ICONS_DIR = path.join(__dirname, '..', 'public', 'items', 'drops', 'resoures');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'items');

// Типи ресурсів, які потрібно додати
const RESOURCE_TYPES = ['material', 'recipe', 'potion', 'scroll', 'quest', 'scrl_enchant_am', 'scrl_enchant_wp'];

// Глобальний Map для відстеження використаних ключів
const usedKeys = new Map();

// Функція для генерації ключа з назви
function generateKey(name, id) {
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
    key = `item_${id}`;
  }
  
  // Перевіряємо на дублікати та додаємо ID якщо потрібно
  const originalKey = key;
  let counter = 1;
  while (usedKeys.has(key)) {
    key = `${originalKey}_${id}`;
    counter++;
  }
  
  usedKeys.set(key, id);
  return key;
}

// Функція для перевірки існування іконки
function iconExists(itemId) {
  // Спочатку перевіряємо в resoures
  const resourcesPath = path.join(RESOURCES_ICONS_DIR, `${itemId}.jpg`);
  if (fs.existsSync(resourcesPath)) return true;
  
  // Потім перевіряємо в items
  const itemsPath = path.join(ITEMS_ICONS_DIR, `${itemId}.jpg`);
  if (fs.existsSync(itemsPath)) return true;
  
  // Перевіряємо інші розширення
  const extensions = ['.png', '.gif', '.bmp'];
  for (const ext of extensions) {
    if (fs.existsSync(path.join(RESOURCES_ICONS_DIR, `${itemId}${ext}`))) return true;
    if (fs.existsSync(path.join(ITEMS_ICONS_DIR, `${itemId}${ext}`))) return true;
  }
  
  return false;
}

// Функція для визначення шляху до іконки
function getIconPath(itemId) {
  // Спочатку перевіряємо в resoures
  const resourcesPath = path.join(RESOURCES_ICONS_DIR, `${itemId}.jpg`);
  if (fs.existsSync(resourcesPath)) {
    return `/items/drops/resoures/${itemId}.jpg`;
  }
  
  // Потім перевіряємо в items
  const itemsPath = path.join(ITEMS_ICONS_DIR, `${itemId}.jpg`);
  if (fs.existsSync(itemsPath)) {
    return `/items/drops/items/${itemId}.jpg`;
  }
  
  // Перевіряємо інші розширення
  const extensions = ['.png', '.gif', '.bmp'];
  for (const ext of extensions) {
    const resourcesExtPath = path.join(RESOURCES_ICONS_DIR, `${itemId}${ext}`);
    if (fs.existsSync(resourcesExtPath)) {
      return `/items/drops/resoures/${itemId}${ext}`;
    }
    const itemsExtPath = path.join(ITEMS_ICONS_DIR, `${itemId}${ext}`);
    if (fs.existsSync(itemsExtPath)) {
      return `/items/drops/items/${itemId}${ext}`;
    }
  }
  
  return `/items/drops/resoures/${itemId}.jpg`; // Дефолтний шлях
}

// Функція для визначення типу предмета (kind)
function getItemKind(etcitemType) {
  const type = etcitemType.toLowerCase();
  if (type.includes('material')) return 'resource';
  if (type.includes('potion')) return 'consumable';
  if (type.includes('scroll')) return 'consumable';
  if (type.includes('quest')) return 'quest';
  if (type.includes('recipe')) return 'resource';
  return 'resource';
}

// Функція для визначення слота
function getSlot(etcitemType) {
  const type = etcitemType.toLowerCase();
  if (type.includes('material')) return 'resource';
  if (type.includes('potion')) return 'consumable';
  if (type.includes('scroll')) return 'consumable';
  if (type.includes('quest')) return 'quest';
  if (type.includes('recipe')) return 'resource';
  return 'resource';
}

// Функція для парсингу XML файлу
function parseXMLFile(filePath) {
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  const items = [];
  
  // Регулярний вираз для знаходження всіх <item> тегів
  const itemRegex = /<item\s+id="(\d+)"\s+type="(\w+)"\s+name="([^"]+)">([\s\S]*?)<\/item>/g;
  
  let match;
  while ((match = itemRegex.exec(xmlContent)) !== null) {
    const [, id, type, name, content] = match;
    
    // Тільки EtcItem (ресурси)
    if (type === 'EtcItem') {
      // Перевіряємо etcitem_type
      const etcitemTypeRegex = /<set\s+name="etcitem_type"\s+val="([^"]+)"\s*\/?>/i;
      const etcitemMatch = etcitemTypeRegex.exec(content);
      
      if (etcitemMatch) {
        const etcitemType = etcitemMatch[1];
        const etcitemTypeLower = etcitemType.toLowerCase();
        
        // Перевіряємо, чи це тип ресурсу
        if (RESOURCE_TYPES.some(rt => etcitemTypeLower.includes(rt))) {
          const itemId = parseInt(id);
          
          // Перевіряємо, чи є іконка (обов'язково для ресурсів)
          if (iconExists(itemId)) {
            const key = generateKey(name, itemId);
            
            items.push({
              id: itemId,
              key: key,
              name: name,
              etcitemType: etcitemType,
              kind: getItemKind(etcitemType),
              slot: getSlot(etcitemType),
              icon: getIconPath(itemId)
            });
          }
        }
      }
    }
  }
  
  return items;
}

// Функція для генерації коду одного предмета
function generateItemCode(item) {
  const iconPath = item.icon.replace(/\\/g, '/');
  
  return `  ${item.key}: {
    id: "${item.key}",
    name: ${JSON.stringify(item.name)},
    kind: "${item.kind}",
    icon: "${iconPath}",
    description: "",
    slot: "${item.slot}",
  },`;
}

// Функція для генерації коду chunk файлу
function generateChunkCode(items, chunkIndex) {
  const itemsCode = items.map(item => generateItemCode(item)).join('\n');
  
  return `// src/data/items/itemsDB_chunk_${chunkIndex}.ts
// AUTO-GENERATED from XML files
// DO NOT EDIT MANUALLY

import type { ItemDefinition } from './itemsDB.types';

export const itemsDBChunk${chunkIndex}: Record<string, ItemDefinition> = {
${itemsCode}
};
`;
}

// Головна функція
function main() {
  console.log('🔍 Витягування ресурсів з XML файлів...\n');
  
  // Отримуємо всі XML файли
  const xmlFiles = fs.readdirSync(XML_DIR)
    .filter(file => file.endsWith('.xml'))
    .map(file => path.join(XML_DIR, file))
    .sort();
  
  console.log(`📁 Знайдено ${xmlFiles.length} XML файлів\n`);
  
  // Парсимо всі файли
  const allItems = [];
  for (const xmlFile of xmlFiles) {
    try {
      const items = parseXMLFile(xmlFile);
      allItems.push(...items);
    } catch (error) {
      console.error(`❌ Помилка при обробці ${path.basename(xmlFile)}:`, error.message);
    }
  }
  
  console.log(`📦 Знайдено ${allItems.length} ресурсів з іконками\n`);
  
  // Сортуємо за ключем для стабільності
  allItems.sort((a, b) => a.key.localeCompare(b.key));
  
  // Розділяємо на chunks (по 1000 предметів в кожному)
  const CHUNK_SIZE = 1000;
  const chunks = [];
  for (let i = 0; i < allItems.length; i += CHUNK_SIZE) {
    chunks.push(allItems.slice(i, i + CHUNK_SIZE));
  }
  
  console.log(`📊 Створено ${chunks.length} chunks\n`);
  
  // Очищаємо старі chunk файли
  for (let i = 0; i < 10; i++) {
    const chunkPath = path.join(OUTPUT_DIR, `itemsDB_chunk_${i}.ts`);
    if (fs.existsSync(chunkPath)) {
      fs.writeFileSync(chunkPath, generateChunkCode([], i));
    }
  }
  
  // Генеруємо нові chunk файли
  for (let i = 0; i < chunks.length; i++) {
    const chunkPath = path.join(OUTPUT_DIR, `itemsDB_chunk_${i}.ts`);
    const chunkCode = generateChunkCode(chunks[i], i);
    fs.writeFileSync(chunkPath, chunkCode);
    console.log(`✅ Створено chunk ${i}: ${chunks[i].length} предметів`);
  }
  
  // Очищаємо решту chunk файлів, якщо їх більше ніж потрібно
  for (let i = chunks.length; i < 10; i++) {
    const chunkPath = path.join(OUTPUT_DIR, `itemsDB_chunk_${i}.ts`);
    if (fs.existsSync(chunkPath)) {
      fs.writeFileSync(chunkPath, generateChunkCode([], i));
    }
  }
  
  console.log(`\n✅ Готово! Згенеровано ${allItems.length} ресурсів в ${chunks.length} chunk файлах`);
  console.log(`\n📋 Статистика:`);
  const stats = {
    material: 0,
    potion: 0,
    scroll: 0,
    quest: 0,
    recipe: 0,
    other: 0
  };
  
  allItems.forEach(item => {
    const type = item.etcitemType.toLowerCase();
    if (type.includes('material')) stats.material++;
    else if (type.includes('potion')) stats.potion++;
    else if (type.includes('scroll')) stats.scroll++;
    else if (type.includes('quest')) stats.quest++;
    else if (type.includes('recipe')) stats.recipe++;
    else stats.other++;
  });
  
  console.log(`   Material: ${stats.material}`);
  console.log(`   Potion: ${stats.potion}`);
  console.log(`   Scroll: ${stats.scroll}`);
  console.log(`   Quest: ${stats.quest}`);
  console.log(`   Recipe: ${stats.recipe}`);
  console.log(`   Other: ${stats.other}`);
}

main();

