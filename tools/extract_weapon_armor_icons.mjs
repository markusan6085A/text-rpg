// tools/extract_weapon_armor_icons.mjs
// Скрипт для витягування ID зброї та броні з XML файлів та переносу іконок в папку WEP_ARROW

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Шляхи
const XML_DIR = path.join(__dirname, 'htmlскіли', 'items');
const ITEMS_ICONS_DIR = path.join(__dirname, '..', 'public', 'items', 'items');
const TARGET_DIR = path.join(__dirname, '..', 'public', 'items', 'drops', 'WEP_ARROW');

// Функція для парсингу XML файлу та витягування ID зброї та броні
function extractWeaponArmorIdsFromXML(filePath) {
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  const itemIds = [];
  
  // Регулярний вираз для знаходження всіх <item> тегів
  const itemRegex = /<item\s+id="(\d+)"\s+type="(Weapon|Armor)"\s+name="([^"]+)">/g;
  
  let match;
  while ((match = itemRegex.exec(xmlContent)) !== null) {
    const [, id, type] = match;
    itemIds.push({
      id: parseInt(id),
      type: type
    });
  }
  
  return itemIds;
}

// Функція для пошуку іконки за ID
function findIconFile(itemId) {
  const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
  
  for (const ext of extensions) {
    const filePath = path.join(ITEMS_ICONS_DIR, `${itemId}${ext}`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  
  return null;
}

// Головна функція
function main() {
  console.log('🔍 Пошук зброї та броні в XML файлах...\n');
  
  // Створюємо цільову папку, якщо її немає
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`✅ Створено папку: ${TARGET_DIR}\n`);
  }
  
  // Отримуємо всі XML файли
  const xmlFiles = fs.readdirSync(XML_DIR)
    .filter(file => file.endsWith('.xml'))
    .map(file => path.join(XML_DIR, file));
  
  console.log(`📁 Знайдено ${xmlFiles.length} XML файлів\n`);
  
  // Витягуємо ID зброї та броні з усіх XML файлів
  const allItemIds = new Set();
  let weaponsCount = 0;
  let armorCount = 0;
  
  for (const xmlFile of xmlFiles) {
    try {
      const items = extractWeaponArmorIdsFromXML(xmlFile);
      items.forEach(item => {
        allItemIds.add(item.id);
        if (item.type === 'Weapon') weaponsCount++;
        else if (item.type === 'Armor') armorCount++;
      });
    } catch (error) {
      console.error(`❌ Помилка при обробці ${path.basename(xmlFile)}:`, error.message);
    }
  }
  
  console.log(`📦 Знайдено ${allItemIds.size} унікальних ID предметів (${weaponsCount} зброї, ${armorCount} броні)\n`);
  
  // Шукаємо та копіюємо іконки
  let copied = 0;
  let notFound = 0;
  let errors = 0;
  
  console.log('🔄 Копіювання іконок...\n');
  
  for (const itemId of allItemIds) {
    const sourceFile = findIconFile(itemId);
    
    if (sourceFile) {
      try {
        const fileName = path.basename(sourceFile);
        const targetFile = path.join(TARGET_DIR, fileName);
        
        // Копіюємо файл тільки якщо його ще немає
        if (!fs.existsSync(targetFile)) {
          fs.copyFileSync(sourceFile, targetFile);
          copied++;
          
          if (copied % 100 === 0) {
            console.log(`  Копійовано ${copied} файлів...`);
          }
        }
      } catch (error) {
        console.error(`❌ Помилка при копіюванні ${itemId}:`, error.message);
        errors++;
      }
    } else {
      notFound++;
    }
  }
  
  console.log('\n✅ Готово!\n');
  console.log(`📊 Статистика:`);
  console.log(`  ✅ Копійовано: ${copied} файлів`);
  console.log(`  ❌ Не знайдено: ${notFound} файлів`);
  console.log(`  ⚠️  Помилок: ${errors} файлів`);
  console.log(`\n📁 Файли знаходяться в: ${TARGET_DIR}`);
}

main();


