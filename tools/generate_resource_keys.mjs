// tools/generate_resource_keys.mjs
// Скрипт для генерації строкових ключів для ресурсів з XML

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Завантажуємо ресурси
const resourcesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mob_resources_by_level.json'), 'utf-8')
);

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
  
  return key;
}

// Створюємо маппінг ID -> ключ
const idToKeyMap = {};
const resourcesByLevelWithKeys = {};

Object.keys(resourcesData.byLevel).forEach(level => {
  resourcesByLevelWithKeys[level] = resourcesData.byLevel[level].map(resource => {
    const key = generateKey(resource.name, resource.id);
    idToKeyMap[resource.id] = key;
    return {
      ...resource,
      key: key
    };
  });
});

// Зберігаємо результат
const output = {
  idToKeyMap,
  byLevel: resourcesByLevelWithKeys,
  total: resourcesData.total
};

fs.writeFileSync(
  path.join(__dirname, 'resource_keys_map.json'),
  JSON.stringify(output, null, 2)
);

console.log(`✅ Створено маппінг для ${resourcesData.total} ресурсів`);
console.log(`📊 Ресурси згруповані по ${Object.keys(resourcesByLevelWithKeys).length} рівнях`);

// Виводимо статистику
Object.keys(resourcesByLevelWithKeys).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
  console.log(`   Рівень ${level}: ${resourcesByLevelWithKeys[level].length} ресурсів`);
});


