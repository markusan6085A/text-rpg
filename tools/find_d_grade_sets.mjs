// tools/find_d_grade_sets.mjs
// Скрипт для знаходження D-grade сетів з XML файлів

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const XML_DIR = path.join(__dirname, 'htmlскіли', 'items');

// Знаходимо всі D-grade броневі предмети
function findDGradeArmor() {
  const xmlFiles = fs.readdirSync(XML_DIR)
    .filter(file => file.endsWith('.xml'))
    .map(file => path.join(XML_DIR, file));

  const armorItems = [];

  for (const xmlFile of xmlFiles) {
    try {
      const xmlContent = fs.readFileSync(xmlFile, 'utf-8');
      
      // Шукаємо всі <item> теги з типом Armor та crystal_type="D"
      const itemRegex = /<item\s+id="(\d+)"\s+type="Armor"\s+name="([^"]+)">([\s\S]*?)<\/item>/g;
      
      let match;
      while ((match = itemRegex.exec(xmlContent)) !== null) {
        const [, id, name, content] = match;
        
        // Перевіряємо, чи це D-grade
        const crystalTypeMatch = content.match(/<set\s+name="crystal_type"\s+val="D"[^>]*>/i);
        
        if (crystalTypeMatch) {
          // Витягуємо bodypart
          const bodypartMatch = content.match(/<set\s+name="bodypart"\s+val="([^"]+)"[^>]*>/i);
          const bodypart = bodypartMatch ? bodypartMatch[1] : '';
          
          armorItems.push({
            id: parseInt(id),
            name: name,
            bodypart: bodypart
          });
        }
      }
    } catch (error) {
      console.error(`Помилка при обробці ${path.basename(xmlFile)}:`, error.message);
    }
  }

  return armorItems;
}

// Групуємо по сетах (за назвою)
function groupBySet(armorItems) {
  const sets = {};
  
  armorItems.forEach(item => {
    // Видаляємо суфікси типу "Heavy Armor", "Light Armor", "Robe" для групування
    let setKey = item.name
      .replace(/\s*(Heavy Armor|Light Armor|Robe)$/i, '')
      .replace(/\s*(Breastplate|Gaiters|Helmet|Gloves|Boots|Gauntlets|Tunic|Stockings|Shirt|Pants|Cap|Shoes|Circlet)$/i, '')
      .trim();
    
    // Додаткова нормалізація для типових D-grade сетів
    if (setKey.includes('Mithril')) setKey = 'Mithril';
    else if (setKey.includes('Cursed')) setKey = 'Cursed';
    else if (setKey.includes('Leather') && !setKey.includes('Plated')) setKey = 'Leather';
    else if (setKey.includes('Chain') && !setKey.includes('Dwarven')) setKey = 'Chain';
    
    if (!sets[setKey]) {
      sets[setKey] = [];
    }
    sets[setKey].push(item);
  });
  
  return sets;
}

// Головна функція
function main() {
  console.log('🔍 Пошук D-grade броні в XML файлах...\n');
  
  const armorItems = findDGradeArmor();
  console.log(`Знайдено ${armorItems.length} D-grade броневих предметів\n`);
  
  const sets = groupBySet(armorItems);
  
  // Виводимо сети, які мають 4+ предмети (повний сет)
  console.log('📦 D-grade сети (4+ предмети):\n');
  
  const fullSets = Object.entries(sets)
    .filter(([name, items]) => items.length >= 4)
    .sort((a, b) => b[1].length - a[1].length);
  
  fullSets.forEach(([setName, items]) => {
    console.log(`\n${setName} Set (${items.length} предметів):`);
    items.sort((a, b) => a.id - b.id).forEach(item => {
      console.log(`  ID ${item.id}: ${item.name} (${item.bodypart})`);
    });
  });
  
  // Виводимо перші 50 предметів для огляду
  console.log('\n\n📋 Перші 50 D-grade предметів (для огляду):\n');
  armorItems.slice(0, 50).sort((a, b) => a.id - b.id).forEach(item => {
    console.log(`ID ${item.id}: ${item.name} (${item.bodypart})`);
  });
}

main();


