// tools/split_itemsdb_by_grade.mjs
// Скрипт для розділення itemsDB.ts по грейдах

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

// Знаходимо початок items (після ...itemsDBChunk4,)
let itemsStartIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('...itemsDBChunk4,')) {
    itemsStartIndex = i + 1;
    break;
  }
}

if (itemsStartIndex === -1) {
  console.error('Не знайдено початок items (після ...itemsDBChunk4,)');
  process.exit(1);
}

// Знаходимо кінець itemsDB (}; перед export const itemsDBWithStarter)
let itemsEndIndex = -1;
for (let i = itemsStartIndex; i < lines.length; i++) {
  if (lines[i].trim() === '};' && i + 1 < lines.length) {
    // Перевіряємо, чи наступний рядок не порожній і містить itemsDBWithStarter
    const nextLine = lines[i + 1].trim();
    if (nextLine === '' || nextLine.startsWith('//') || lines[i + 2]?.includes('itemsDBWithStarter')) {
      itemsEndIndex = i;
      break;
    }
  }
}

if (itemsEndIndex === -1) {
  // Спробуємо знайти }; який перед itemsDBWithStarter
  for (let i = lines.length - 1; i >= itemsStartIndex; i--) {
    if (lines[i].includes('itemsDBWithStarter')) {
      // Шукаємо }; перед цим рядком
      for (let j = i - 1; j >= itemsStartIndex; j--) {
        if (lines[j].trim() === '};') {
          itemsEndIndex = j;
          break;
        }
      }
      break;
    }
  }
}

if (itemsEndIndex === -1) {
  console.error('Не знайдено кінець itemsDB');
  console.log('Шукаємо рядки навколо itemsDBWithStarter:');
  for (let i = Math.max(0, lines.length - 50); i < lines.length; i++) {
    if (lines[i].includes('itemsDBWithStarter') || lines[i].includes('};')) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
  process.exit(1);
}

console.log(`Items починаються з рядка ${itemsStartIndex + 1}, закінчуються на рядку ${itemsEndIndex + 1}`);

// Витягуємо items
const itemsLines = lines.slice(itemsStartIndex, itemsEndIndex + 1);

// Розділяємо items по грейдах
const itemsByGrade = {
  NG: [],
  D: [],
  C: [],
  B: [],
  A: [],
  S: [],
};

let currentItem = [];
let currentItemKey = null;
let braceDepth = 0;
let inItem = false;
let currentGrade = null;
let lastSectionComment = [];

for (let i = 0; i < itemsLines.length; i++) {
  const line = itemsLines[i];
  const trimmedLine = line.trim();
  
  // Коментарі секцій
  if (trimmedLine.startsWith('// =====')) {
    lastSectionComment = [line];
    continue;
  }
  
  // Порожні рядки між коментарями
  if (trimmedLine === '' && lastSectionComment.length > 0) {
    lastSectionComment.push(line);
    continue;
  }
  
  // Початок item: key: {
  const itemStartMatch = trimmedLine.match(/^(\w+):\s*\{/);
  if (itemStartMatch && !inItem) {
    inItem = true;
    braceDepth = 1;
    currentItem = [...lastSectionComment, line];
    lastSectionComment = [];
    currentGrade = null;
    continue;
  }
  
  // Якщо в середині item
  if (inItem) {
    currentItem.push(line);
    
    // Шукаємо grade
    if (trimmedLine.includes('grade:')) {
      const gradeMatch = trimmedLine.match(/grade:\s*["']([A-Z]+)["']/);
      if (gradeMatch) {
        currentGrade = gradeMatch[1];
      }
    }
    
    // Рахуємо дужки
    let openBraces = 0;
    let closeBraces = 0;
    for (const char of line) {
      if (char === '{') openBraces++;
      if (char === '}') closeBraces++;
    }
    braceDepth += openBraces - closeBraces;
    
    // Якщо дужки закриті
    if (braceDepth === 0) {
      // Визначаємо grade (якщо немає, то NG)
      const grade = currentGrade || 'NG';
      if (itemsByGrade[grade]) {
        itemsByGrade[grade].push(...currentItem);
        // Додаємо порожній рядок після item
        if (i + 1 < itemsLines.length && itemsLines[i + 1].trim() === '') {
          itemsByGrade[grade].push('');
        }
      }
      
      currentItem = [];
      inItem = false;
      currentGrade = null;
      braceDepth = 0;
    }
  } else {
    // Якщо не в item, зберігаємо коментарі для наступного item
    if (trimmedLine.startsWith('//') || trimmedLine === '') {
      lastSectionComment.push(line);
    }
  }
}

// Створюємо файли для кожного грейду
const gradeFiles = {
  NG: 'itemsDB_ng.ts',
  D: 'itemsDB_d.ts',
  C: 'itemsDB_c.ts',
  B: 'itemsDB_b.ts',
  A: 'itemsDB_a.ts',
  S: 'itemsDB_s.ts',
};

const gradeNames = {
  NG: 'itemsDBNG',
  D: 'itemsDBD',
  C: 'itemsDBC',
  B: 'itemsDBB',
  A: 'itemsDBA',
  S: 'itemsDBS',
};

// Підраховуємо кількість items в кожному грейді
for (const [grade, fileName] of Object.entries(gradeFiles)) {
  const items = itemsByGrade[grade] || [];
  const filePath = path.join(rootDir, 'src/data/items', fileName);
  
  // Видаляємо порожні рядки в кінці
  while (items.length > 0 && items[items.length - 1].trim() === '') {
    items.pop();
  }
  
  const fileContent = `// src/data/items/${fileName}
// ${grade}-Grade items

import type { ItemDefinition } from './itemsDB.types';

export const ${gradeNames[grade]}: Record<string, ItemDefinition> = {
${items.join('\n')}
};
`;
  
  fs.writeFileSync(filePath, fileContent, 'utf-8');
  
  // Підраховуємо кількість items (ключі з :)
  const itemCount = items.filter(l => l.trim().match(/^\w+:\s*\{/)).length;
  console.log(`✓ Створено ${fileName}: ${itemCount} items`);
}

console.log('\nГотово! Тепер потрібно оновити itemsDB.ts для імпорту з нових файлів.');
