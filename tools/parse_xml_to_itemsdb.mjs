// tools/parse_xml_to_itemsdb.mjs
// Скрипт для парсингу XML файлів та оновлення itemsDB.ts

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Шлях до XML файлів
const XML_DIR = path.join(__dirname, 'htmlскіли', 'ітемс');
// Шлях до itemsDB.ts
const ITEMS_DB_PATH = path.join(__dirname, '..', 'src', 'data', 'items', 'itemsDB.ts');
// Шлях до папки з іконками
const ICONS_DIR = path.join(__dirname, '..', 'public', 'items', 'drops', 'items');

// Функція для парсингу XML файлу (простий regex парсинг)
function parseXMLFile(filePath) {
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  const items = [];
  
  // Регулярний вираз для знаходження всіх <item> тегів
  const itemRegex = /<item\s+id="(\d+)"\s+type="(\w+)"\s+name="([^"]+)">([\s\S]*?)<\/item>/g;
  
  let match;
  while ((match = itemRegex.exec(xmlContent)) !== null) {
    const [, id, type, name, content] = match;
    
    const itemData = {
      id: parseInt(id),
      type: type,
      name: name,
      stats: {},
      slot: null,
      grade: null,
      armorType: null,
      weaponType: null,
      etcitemType: null,
    };
    
    // Парсимо <set> теги
    const setRegex = /<set\s+name="([^"]+)"\s+val="([^"]+)"\s*\/?>/g;
    let setMatch;
    while ((setMatch = setRegex.exec(content)) !== null) {
      const [, setName, setVal] = setMatch;
      
      switch(setName) {
        case 'bodypart':
          itemData.slot = mapBodypartToSlot(setVal);
          break;
        case 'crystal_type':
          itemData.grade = setVal;
          break;
        case 'armor_type':
          itemData.armorType = setVal.toLowerCase();
          break;
        case 'weapon_type':
          itemData.weaponType = setVal;
          break;
        case 'etcitem_type':
          itemData.etcitemType = setVal;
          break;
      }
    }
    
    // Парсимо <for> блоки зі статами
    const forRegex = /<for>([\s\S]*?)<\/for>/g;
    let forMatch;
    while ((forMatch = forRegex.exec(content)) !== null) {
      const forContent = forMatch[1];
      
      // Парсимо <set> в <for>
      const forSetRegex = /<set\s+[^>]*stat="(\w+)"\s+val="(\d+)"\s*\/?>/g;
      let forSetMatch;
      while ((forSetMatch = forSetRegex.exec(forContent)) !== null) {
        const [, stat, val] = forSetMatch;
        const intVal = parseInt(val);
        
        if (stat === 'pAtk') itemData.stats.pAtk = intVal;
        if (stat === 'mAtk') itemData.stats.mAtk = intVal;
        if (stat === 'pDef') itemData.stats.pDef = intVal;
        if (stat === 'mDef') itemData.stats.mDef = intVal;
        if (stat === 'rCrit') itemData.stats.rCrit = intVal;
        if (stat === 'pAtkSpd') itemData.stats.pAtkSpd = intVal;
        if (stat === 'mAtkSpd') itemData.stats.mAtkSpd = intVal;
      }
      
      // Парсимо <add> в <for>
      const forAddRegex = /<add\s+[^>]*stat="(\w+)"\s+val="(\d+)"\s*\/?>/g;
      let forAddMatch;
      while ((forAddMatch = forAddRegex.exec(forContent)) !== null) {
        const [, stat, val] = forAddMatch;
        const intVal = parseInt(val);
        
        if (stat === 'pDef') itemData.stats.pDef = intVal;
        if (stat === 'mDef') itemData.stats.mDef = intVal;
      }
    }
    
    items.push(itemData);
  }
  
  return items;
}

// Маппінг bodypart на slot
function mapBodypartToSlot(bodypart) {
  const mapping = {
    'rhand': 'weapon',
    'lhand': 'shield',
    'chest': 'armor',
    'legs': 'legs',
    'head': 'head',
    'gloves': 'gloves',
    'feet': 'boots',
    'fullarmor': 'armor', // Роба займає обидва слоти
    'underwear': 'underwear',
    'back': 'cloak',
    'hair': 'hair',
    'face': 'face',
    'neck': 'necklace',
    'rear': 'earring_right',
    'lear': 'earring_left',
    'rfinger': 'ring_right',
    'lfinger': 'ring_left',
  };
  return mapping[bodypart] || bodypart;
}

// Функція для визначення типу предмета
function getItemKind(item) {
  if (item.type === 'Weapon') {
    return 'weapon';
  }
  if (item.type === 'Armor') {
    if (item.slot === 'head') return 'helmet';
    if (item.slot === 'boots') return 'boots';
    if (item.slot === 'gloves') return 'gloves';
    if (item.slot === 'legs') return 'armor';
    if (item.slot === 'armor') return 'armor';
    if (item.slot === 'shield') return 'shield';
    return 'armor';
  }
  if (item.type === 'EtcItem') {
    // Перевіряємо etcitem_type
    // Це буде потрібно додати в парсинг
    return 'resource';
  }
  return 'other';
}

// Перевірка чи існує іконка
function iconExists(itemId) {
  const iconPath = path.join(ICONS_DIR, `${itemId}.jpg`);
  return fs.existsSync(iconPath);
}

// Головна функція
async function main() {
  console.log('Початок парсингу XML файлів...');
  
  // Отримуємо всі XML файли
  const xmlFiles = fs.readdirSync(XML_DIR)
    .filter(file => file.endsWith('.xml'))
    .map(file => path.join(XML_DIR, file))
    .sort();
  
  console.log(`Знайдено ${xmlFiles.length} XML файлів`);
  
  // Парсимо всі файли
  const allItems = [];
  for (const file of xmlFiles) {
    console.log(`Парсинг ${path.basename(file)}...`);
    const items = await parseXMLFile(file);
    allItems.push(...items);
  }
  
  console.log(`Всього знайдено ${allItems.length} предметів`);
  
  // Фільтруємо тільки ті, що мають іконки
  const itemsWithIcons = allItems.filter(item => iconExists(item.id));
  console.log(`Предметів з іконками: ${itemsWithIcons.length}`);
  
  // Групуємо по типах для статистики
  const stats = {
    weapon: 0,
    armor: 0,
    etcitem: 0,
    withIcons: itemsWithIcons.length,
  };
  
  allItems.forEach(item => {
    if (item.type === 'Weapon') stats.weapon++;
    if (item.type === 'Armor') stats.armor++;
    if (item.type === 'EtcItem') stats.etcitem++;
  });
  
  console.log('\nСтатистика:');
  console.log(`  Зброя: ${stats.weapon}`);
  console.log(`  Броня: ${stats.armor}`);
  console.log(`  Ресурси/Інше: ${stats.etcitem}`);
  console.log(`  З іконками: ${stats.withIcons}`);
  
  // Зберігаємо дані в JSON для подальшого використання
  const outputPath = path.join(__dirname, 'items_from_xml.json');
  fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2));
  console.log(`\nДані збережено в ${outputPath}`);
  
  // Зберігаємо тільки предмети з іконками
  const itemsWithIconsPath = path.join(__dirname, 'items_with_icons.json');
  fs.writeFileSync(itemsWithIconsPath, JSON.stringify(itemsWithIcons, null, 2));
  console.log(`Предмети з іконками збережено в ${itemsWithIconsPath}`);
}

main().catch(console.error);

