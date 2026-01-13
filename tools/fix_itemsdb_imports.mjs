// tools/fix_itemsdb_imports.mjs
// Скрипт для заміни всього вмісту itemsDB на імпорти

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const itemsDBPath = path.join(rootDir, 'src/data/items/itemsDB.ts');

// Читаємо файл
const content = fs.readFileSync(itemsDBPath, 'utf-8');
const lines = content.split('\n');

// Знаходимо початок itemsDB
let itemsDBStartIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export const itemsDB: Record<string, ItemDefinition> = {')) {
    itemsDBStartIndex = i;
    break;
  }
}

if (itemsDBStartIndex === -1) {
  console.error('Не знайдено export const itemsDB');
  process.exit(1);
}

// Знаходимо початок items (після ...itemsDBChunk4, або після останнього spread оператора)
let itemsStartIndex = itemsDBStartIndex + 1;
for (let i = itemsDBStartIndex; i < lines.length; i++) {
  if (lines[i].includes('...itemsDBChunk4,') || lines[i].includes('...itemsDBS,')) {
    itemsStartIndex = i + 1;
    break;
  }
}

// Знаходимо кінець itemsDB (}; перед itemsDBWithStarter або перед будь-яким export)
let itemsEndIndex = -1;
for (let i = itemsStartIndex; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  
  // Якщо знайшли }; і наступний рядок не порожній і не коментар, і містить itemsDBWithStarter або export
  if (trimmed === '};') {
    // Перевіряємо наступні рядки
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const nextLine = lines[j].trim();
      if (nextLine === '') continue;
      if (nextLine.startsWith('//')) continue;
      if (nextLine.includes('itemsDBWithStarter') || nextLine.startsWith('export')) {
        itemsEndIndex = i;
        break;
      }
    }
    if (itemsEndIndex !== -1) break;
  }
}

if (itemsEndIndex === -1) {
  console.error('Не знайдено кінець itemsDB');
  // Показуємо контекст навколо itemsStartIndex
  console.log('Контекст навколо itemsStartIndex:');
  for (let i = Math.max(0, itemsStartIndex - 5); i < Math.min(lines.length, itemsStartIndex + 20); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
  process.exit(1);
}

console.log(`Видаляємо рядки ${itemsStartIndex + 1} до ${itemsEndIndex + 1}`);

// Перевіряємо, чи вже є spread оператори
const hasSpreadOperators = lines.slice(itemsDBStartIndex, itemsStartIndex + 10).some(l => 
  l.includes('...itemsDBNG') || l.includes('...itemsDBD')
);

let newItemsContent = [];
if (!hasSpreadOperators) {
  // Додаємо spread оператори
  newItemsContent = [
    '  ...itemsDBChunk0,',
    '  ...itemsDBChunk1,',
    '  ...itemsDBChunk2,',
    '  ...itemsDBChunk3,',
    '  ...itemsDBChunk4,',
    '  ...itemsDBNG,',
    '  ...itemsDBD,',
    '  ...itemsDBC,',
    '  ...itemsDBB,',
    '  ...itemsDBA,',
    '  ...itemsDBS,',
  ];
} else {
  // Видаляємо все між останнім spread оператором і };
  // Знаходимо останній spread оператор
  let lastSpreadIndex = itemsStartIndex - 1;
  for (let i = itemsStartIndex - 1; i >= itemsDBStartIndex; i--) {
    if (lines[i].includes('...')) {
      lastSpreadIndex = i;
      break;
    }
  }
  // Беремо все до останнього spread оператора
  newItemsContent = lines.slice(itemsDBStartIndex + 1, lastSpreadIndex + 1);
  // Додаємо spread оператори якщо їх немає
  if (!newItemsContent.some(l => l.includes('...itemsDBNG'))) {
    newItemsContent.push('  ...itemsDBNG,');
    newItemsContent.push('  ...itemsDBD,');
    newItemsContent.push('  ...itemsDBC,');
    newItemsContent.push('  ...itemsDBB,');
    newItemsContent.push('  ...itemsDBA,');
    newItemsContent.push('  ...itemsDBS,');
  }
}

// Створюємо новий вміст
const newContent = [
  ...lines.slice(0, itemsDBStartIndex + 1),
  ...newItemsContent,
  ...lines.slice(itemsEndIndex),
].join('\n');

fs.writeFileSync(itemsDBPath, newContent, 'utf-8');
console.log('✓ Оновлено itemsDB.ts');
