// tools/extract_resource_icons.mjs
// Скрипт для витягування ID ресурсів з XML файлів та переносу іконок в папку resoures

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Шляхи
const XML_DIR = path.join(__dirname, 'htmlскіли', 'ітемс');
const ITEMS_ICONS_DIR = path.join(__dirname, '..', 'public', 'items', 'drops', 'items');
const RESOURCES_ICONS_DIR = path.join(__dirname, '..', 'public', 'items', 'drops', 'resoures');

// Типи ресурсів, які потрібно витягнути
const RESOURCE_TYPES = ['material', 'recipe', 'potion', 'scroll', 'quest', 'scrl_enchant_am', 'scrl_enchant_wp'];

// Функція для парсингу XML файлу та витягування ID ресурсів
function extractResourceIdsFromXML(filePath) {
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  const resourceIds = [];
  
  // Регулярний вираз для знаходження всіх <item> тегів
  const itemRegex = /<item\s+id="(\d+)"\s+type="(\w+)"\s+name="([^"]+)">([\s\S]*?)<\/item>/g;
  
  let match;
  while ((match = itemRegex.exec(xmlContent)) !== null) {
    const [, id, type, name, content] = match;
    
    // Перевіряємо, чи це EtcItem
    if (type === 'EtcItem') {
      // Перевіряємо etcitem_type
      const etcitemTypeRegex = /<set\s+name="etcitem_type"\s+val="([^"]+)"\s*\/?>/i;
      const etcitemMatch = etcitemTypeRegex.exec(content);
      
      if (etcitemMatch) {
        const etcitemType = etcitemMatch[1].toLowerCase();
        
        // Перевіряємо, чи це тип ресурсу
        if (RESOURCE_TYPES.some(rt => etcitemType.includes(rt))) {
          resourceIds.push(parseInt(id));
        }
      }
    }
  }
  
  return resourceIds;
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
  console.log('🔍 Пошук ресурсів в XML файлах...\n');
  
  // Створюємо папку resoures, якщо її немає
  if (!fs.existsSync(RESOURCES_ICONS_DIR)) {
    fs.mkdirSync(RESOURCES_ICONS_DIR, { recursive: true });
    console.log(`✅ Створено папку: ${RESOURCES_ICONS_DIR}\n`);
  }
  
  // Отримуємо всі XML файли
  const xmlFiles = fs.readdirSync(XML_DIR)
    .filter(file => file.endsWith('.xml'))
    .map(file => path.join(XML_DIR, file));
  
  console.log(`📁 Знайдено ${xmlFiles.length} XML файлів\n`);
  
  // Витягуємо ID ресурсів з усіх XML файлів
  const allResourceIds = new Set();
  
  for (const xmlFile of xmlFiles) {
    try {
      const resourceIds = extractResourceIdsFromXML(xmlFile);
      resourceIds.forEach(id => allResourceIds.add(id));
    } catch (error) {
      console.error(`❌ Помилка при обробці ${path.basename(xmlFile)}:`, error.message);
    }
  }
  
  console.log(`📦 Знайдено ${allResourceIds.size} унікальних ID ресурсів\n`);
  
  // Шукаємо та переносимо іконки
  let copied = 0;
  let notFound = 0;
  let errors = 0;
  
  console.log('🔄 Перенесення іконок...\n');
  
  for (const itemId of allResourceIds) {
    const sourcePath = findIconFile(itemId);
    
    if (!sourcePath) {
      // console.log(`⚠️  Іконка не знайдена для ID: ${itemId}`);
      notFound++;
      continue;
    }
    
    const fileName = path.basename(sourcePath);
    const targetPath = path.join(RESOURCES_ICONS_DIR, fileName);
    
    try {
      // Копіюємо файл (не переміщуємо, щоб не втратити оригінал)
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ ${itemId} -> ${fileName}`);
      copied++;
    } catch (error) {
      console.error(`❌ Помилка при копіюванні ${fileName}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\n📊 Результати:`);
  console.log(`   ✅ Скопійовано: ${copied}`);
  console.log(`   ⚠️  Не знайдено: ${notFound}`);
  console.log(`   ❌ Помилок: ${errors}`);
  console.log(`\n💡 Іконки ресурсів скопійовані в: ${RESOURCES_ICONS_DIR}`);
}

main();


