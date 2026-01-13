// tools/merge_custom_items.mjs
// Скрипт для злиття кастомних предметів зі старого itemsDB.ts до нового згенерованого

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Завантажуємо дані з XML (щоб знати які ID вже є)
const itemsFromXML = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'items_with_icons.json'), 'utf-8')
);

const xmlItemIds = new Set(itemsFromXML.map(item => item.id));

// Читаємо старий itemsDB.ts
const oldItemsDBPath = path.join(__dirname, '..', 'src', 'data', 'items', 'itemsDB.ts');
const oldItemsDBContent = fs.readFileSync(oldItemsDBPath, 'utf-8');

// Знаходимо всі предмети в старому файлі
const customItems = [];

// Регулярний вираз для знаходження предметів
const itemRegex = /^\s+([a-z_]+):\s*\{[\s\S]*?^\s+\},/gm;
let match;

while ((match = itemRegex.exec(oldItemsDBContent)) !== null) {
  const itemKey = match[1];
  const itemContent = match[0];
  
  // Пропускаємо starterKitDefault та інші не-предмети
  if (itemKey === 'starterKitDefault' || itemKey.startsWith('export')) {
    continue;
  }
  
  // Шукаємо ID в контенті
  const idMatch = itemContent.match(/id:\s*"([^"]+)"/);
  if (!idMatch) continue;
  
  const itemId = idMatch[1];
  
  // Перевіряємо чи це кастомний предмет (не з XML)
  // Кастомні предмети: quest_*, coin_*, coins_*, silver, та інші спеціальні
  const isCustom = 
    itemId.startsWith('quest_') ||
    itemId.startsWith('coin_') ||
    itemId.startsWith('coins_') ||
    itemId === 'silver' ||
    itemId.includes('bless_') ||
    itemId.includes('_bless_') ||
    !xmlItemIds.has(parseInt(itemId)) && !/^\d+$/.test(itemId);
  
  if (isCustom) {
    // Парсимо дані предмета
    const nameMatch = itemContent.match(/name:\s*"([^"]+)"/);
    const kindMatch = itemContent.match(/kind:\s*"([^"]+)"/);
    const slotMatch = itemContent.match(/slot:\s*"([^"]+)"/);
    const iconMatch = itemContent.match(/icon:\s*"([^"]+)"/);
    const descMatch = itemContent.match(/description:\s*"([^"]+)"/);
    const gradeMatch = itemContent.match(/grade:\s*"([^"]+)"/);
    const armorTypeMatch = itemContent.match(/armorType:\s*"([^"]+)"/);
    
    // Парсимо stats
    let stats = null;
    const statsMatch = itemContent.match(/stats:\s*\{([^}]+)\}/);
    if (statsMatch) {
      try {
        stats = JSON.parse(`{${statsMatch[1]}}`);
      } catch (e) {
        // Якщо не вдалося розпарсити, залишаємо null
      }
    }
    
    customItems.push({
      key: itemKey,
      id: itemId,
      name: nameMatch ? nameMatch[1] : itemId,
      kind: kindMatch ? kindMatch[1] : 'resource',
      slot: slotMatch ? slotMatch[1] : 'resource',
      icon: iconMatch ? iconMatch[1] : `/items/drops/items/${itemId}.jpg`,
      description: descMatch ? descMatch[1] : itemId,
      grade: gradeMatch ? gradeMatch[1] : null,
      armorType: armorTypeMatch ? armorTypeMatch[1] : null,
      stats: stats,
    });
  }
}

console.log(`Знайдено ${customItems.length} кастомних предметів`);

// Читаємо згенерований файл
const generatedPath = path.join(__dirname, '..', 'src', 'data', 'items', 'itemsDB_generated.ts');
let generatedContent = fs.readFileSync(generatedPath, 'utf-8');

// Додаємо кастомні предмети перед закриваючою дужкою
const insertPosition = generatedContent.lastIndexOf('};');
if (insertPosition !== -1) {
  let customItemsCode = '\n  // ===== CUSTOM ITEMS (from old itemsDB.ts) =====\n';
  
  customItems.forEach(item => {
    let statsCode = '';
    if (item.stats && Object.keys(item.stats).length > 0) {
      statsCode = `,\n    stats: ${JSON.stringify(item.stats)}`;
    }
    
    let extraFields = '';
    if (item.grade) {
      extraFields += `,\n    grade: "${item.grade}"`;
    }
    if (item.armorType) {
      extraFields += `,\n    armorType: "${item.armorType}"`;
    }
    
    customItemsCode += `  ${item.key}: {\n`;
    customItemsCode += `    id: "${item.id}",\n`;
    customItemsCode += `    name: "${item.name}",\n`;
    customItemsCode += `    kind: "${item.kind}",\n`;
    customItemsCode += `    slot: "${item.slot}",\n`;
    customItemsCode += `    icon: "${item.icon}",\n`;
    customItemsCode += `    description: "${item.description}"${statsCode}${extraFields}\n`;
    customItemsCode += `  },\n`;
  });
  
  generatedContent = 
    generatedContent.slice(0, insertPosition) + 
    customItemsCode + 
    generatedContent.slice(insertPosition);
  
  // Зберігаємо оновлений файл
  fs.writeFileSync(generatedPath, generatedContent, 'utf-8');
  console.log(`✅ Додано ${customItems.length} кастомних предметів до itemsDB_generated.ts`);
} else {
  console.error('❌ Не вдалося знайти місце для вставки кастомних предметів');
}

// Також зберігаємо starterKitDefault якщо він є
const starterKitMatch = oldItemsDBContent.match(/export const starterKitDefault\s*=\s*\{[\s\S]*?\};/);
if (starterKitMatch) {
  const starterKitCode = starterKitMatch[0];
  const finalContent = generatedContent + '\n\n' + starterKitCode;
  fs.writeFileSync(generatedPath, finalContent, 'utf-8');
  console.log('✅ Додано starterKitDefault');
}

console.log('\n✅ Готово! Тепер можна замінити itemsDB.ts на itemsDB_generated.ts');

