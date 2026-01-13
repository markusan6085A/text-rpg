// tools/generate_material_resources.mjs
// Скрипт для витягування тільки material ресурсів з XML та групування по рівнях

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Шляхи
const XML_DIR = path.join(__dirname, 'htmlскіли', 'ітемс');
const OUTPUT_FILE = path.join(__dirname, 'material_resources_by_level.json');

// Функція для парсингу XML файлу та витягування material ресурсів
function extractMaterialResourcesFromXML(filePath) {
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  const resources = [];
  
  // Регулярний вираз для знаходження всіх <item> тегів
  const itemRegex = /<item\s+id="(\d+)"\s+type="(\w+)"\s+name="([^"]+)">([\s\S]*?)<\/item>/g;
  
  let match;
  while ((match = itemRegex.exec(xmlContent)) !== null) {
    const [, id, type, name, content] = match;
    
    // Перевіряємо, чи це EtcItem
    if (type === 'EtcItem') {
      // Перевіряємо etcitem_type - тільки material
      const etcitemTypeRegex = /<set\s+name="etcitem_type"\s+val="([^"]+)"\s*\/?>/i;
      const etcitemMatch = etcitemTypeRegex.exec(content);
      
      if (etcitemMatch) {
        const etcitemType = etcitemMatch[1].toLowerCase();
        
        // Тільки material ресурси
        if (etcitemType === 'material') {
          // Витягуємо ціну для групування по рівнях
          const priceRegex = /<set\s+name="price"\s+val="(\d+)"\s*\/?>/i;
          const priceMatch = priceRegex.exec(content);
          const price = priceMatch ? parseInt(priceMatch[1]) : 0;
          
          // Генеруємо ключ з назви
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
          
          resources.push({
            id: parseInt(id),
            name: name,
            key: key,
            price: price
          });
        }
      }
    }
  }
  
  return resources;
}

// Функція для групування ресурсів по рівнях (на основі ціни)
function groupResourcesByLevel(resources) {
  const grouped = {};
  
  // Групуємо ресурси по рівнях на основі ціни
  const levelRanges = [
    { min: 0, max: 500, level: 1 },      // 1-20 лвл мобів
    { min: 500, max: 1500, level: 20 },  // 20-30 лвл мобів
    { min: 1500, max: 3000, level: 30 }, // 30-40 лвл мобів
    { min: 3000, max: 6000, level: 40 }, // 40-50 лвл мобів
    { min: 6000, max: 12000, level: 50 }, // 50-60 лвл мобів
    { min: 12000, max: 25000, level: 60 }, // 60-70 лвл мобів
    { min: 25000, max: Infinity, level: 70 }, // 70+ лвл мобів
  ];
  
  resources.forEach(resource => {
    for (const range of levelRanges) {
      if (resource.price >= range.min && resource.price < range.max) {
        if (!grouped[range.level]) {
          grouped[range.level] = [];
        }
        grouped[range.level].push(resource);
        break;
      }
    }
  });
  
  return grouped;
}

// Головна функція
function main() {
  console.log('🔍 Витягування material ресурсів з XML файлів...\n');
  
  // Отримуємо всі XML файли
  const xmlFiles = fs.readdirSync(XML_DIR)
    .filter(file => file.endsWith('.xml'))
    .map(file => path.join(XML_DIR, file));
  
  console.log(`📁 Знайдено ${xmlFiles.length} XML файлів\n`);
  
  // Витягуємо material ресурси з усіх XML файлів
  const allResources = [];
  
  for (const xmlFile of xmlFiles) {
    try {
      const resources = extractMaterialResourcesFromXML(xmlFile);
      allResources.push(...resources);
    } catch (error) {
      console.error(`❌ Помилка при обробці ${path.basename(xmlFile)}:`, error.message);
    }
  }
  
  console.log(`📦 Знайдено ${allResources.length} material ресурсів\n`);
  
  // Групуємо ресурси по рівнях
  const groupedByLevel = groupResourcesByLevel(allResources);
  
  console.log('📊 Material ресурси згруповані по рівнях:');
  Object.keys(groupedByLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
    console.log(`   Рівень ${level}: ${groupedByLevel[level].length} ресурсів`);
  });
  
  // Створюємо список ключів для кожного рівня (для використання в коді)
  const keysByLevel = {};
  Object.keys(groupedByLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
    keysByLevel[level] = groupedByLevel[level].map(r => r.key);
  });
  
  // Зберігаємо результат
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    total: allResources.length,
    byLevel: groupedByLevel,
    keysByLevel: keysByLevel,
    all: allResources
  }, null, 2));
  
  console.log(`\n✅ Результати збережено в: ${OUTPUT_FILE}`);
  console.log(`\n📋 Приклад ключів для рівня 1 (перші 10):`);
  if (keysByLevel['1'] && keysByLevel['1'].length > 0) {
    keysByLevel['1'].slice(0, 10).forEach(key => console.log(`   - ${key}`));
  }
}

main();


