// tools/generate_mob_resources.mjs
// Скрипт для витягування ресурсів з XML та генерації дропів/спойлів для мобів

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Шляхи
const XML_DIR = path.join(__dirname, 'htmlскіли', 'ітемс');
const OUTPUT_FILE = path.join(__dirname, 'mob_resources_by_level.json');

// Типи ресурсів, які потрібно витягнути
const RESOURCE_TYPES = ['material', 'recipe', 'potion', 'scroll', 'quest', 'scrl_enchant_am', 'scrl_enchant_wp'];

// Функція для парсингу XML файлу та витягування ресурсів
function extractResourcesFromXML(filePath) {
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  const resources = [];
  
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
          // Витягуємо ціну для групування по рівнях
          const priceRegex = /<set\s+name="price"\s+val="(\d+)"\s*\/?>/i;
          const priceMatch = priceRegex.exec(content);
          const price = priceMatch ? parseInt(priceMatch[1]) : 0;
          
          resources.push({
            id: parseInt(id),
            name: name,
            type: etcitemType,
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
  // Нижчі рівні: 0-1000, Середні: 1000-5000, Високі: 5000-20000, Дуже високі: 20000+
  const levelRanges = [
    { min: 0, max: 500, level: 1 },      // 1-20
    { min: 500, max: 1500, level: 20 },  // 20-30
    { min: 1500, max: 3000, level: 30 }, // 30-40
    { min: 3000, max: 6000, level: 40 }, // 40-50
    { min: 6000, max: 12000, level: 50 }, // 50-60
    { min: 12000, max: 25000, level: 60 }, // 60-70
    { min: 25000, max: Infinity, level: 70 }, // 70+
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
  console.log('🔍 Витягування ресурсів з XML файлів...\n');
  
  // Отримуємо всі XML файли
  const xmlFiles = fs.readdirSync(XML_DIR)
    .filter(file => file.endsWith('.xml'))
    .map(file => path.join(XML_DIR, file));
  
  console.log(`📁 Знайдено ${xmlFiles.length} XML файлів\n`);
  
  // Витягуємо ресурси з усіх XML файлів
  const allResources = [];
  
  for (const xmlFile of xmlFiles) {
    try {
      const resources = extractResourcesFromXML(xmlFile);
      allResources.push(...resources);
    } catch (error) {
      console.error(`❌ Помилка при обробці ${path.basename(xmlFile)}:`, error.message);
    }
  }
  
  console.log(`📦 Знайдено ${allResources.length} ресурсів\n`);
  
  // Групуємо ресурси по рівнях
  const groupedByLevel = groupResourcesByLevel(allResources);
  
  console.log('📊 Ресурси згруповані по рівнях:');
  Object.keys(groupedByLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
    console.log(`   Рівень ${level}: ${groupedByLevel[level].length} ресурсів`);
  });
  
  // Зберігаємо результат
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    total: allResources.length,
    byLevel: groupedByLevel,
    all: allResources
  }, null, 2));
  
  console.log(`\n✅ Результати збережено в: ${OUTPUT_FILE}`);
}

main();


