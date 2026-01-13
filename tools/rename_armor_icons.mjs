// Скрипт для перейменування іконок з формату armor_tXX_YY_iZZ.png у формат {itemId}.jpg
// Використовує маппінг між кодами сетів та itemId

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Маппінг між кодами сетів та itemId для B-grade
// Формат: armor_t{setCode}_{part}_{index}.png
// Де:
// - setCode: t64 (Zubei), t65 (Blue Wolf), t76 (Avadon?), t77 (?), t85 (?), t90 (Doom?)
// - part: ul (helmet), u (chest), l (legs), g (gloves), b (boots)
// - index: i00, i01, i02 (зазвичай i00 для Heavy, i01 для Light, i02 для Robe)

const ARMOR_SET_MAPPING = {
  // B Grade Sets
  t64: { // Zubei Set
    ul: 503, // Zubei's Helmet
    u: 357,  // Zubei's Breastplate
    l: 383,  // Zubei's Gaiters
    g: { i00: 5710, i01: 5711, i02: 5712 }, // Heavy, Light, Robe
    b: { i00: 5726, i01: 5727, i02: 5728 }, // Heavy, Light, Robe
  },
  t65: { // Blue Wolf Set
    ul: 2416, // Blue Wolf Helmet
    u: 358,   // Blue Wolf Breastplate
    l: 2380,  // Blue Wolf Gaiters
    g: { i00: 5718, i01: 5719, i02: 5720 }, // Heavy, Light, Robe
    b: { i00: 5734, i01: 5735, i02: 5736 }, // Heavy, Light, Robe
  },
  t76: { // Avadon Set (припущення)
    ul: 2415, // Avadon Circlet
    u: { i00: 0, i01: 0, i02: 2406 }, // Avadon Breastplate/Leather/Robe
    l: { i00: 0, i01: 0, i02: 2406 }, // Avadon Gaiters/Leather/Robe (robe займає обидва)
    g: { i00: 5714, i01: 5715, i02: 5716 }, // Heavy, Light, Robe
    b: { i00: 5730, i01: 5731, i02: 5732 }, // Heavy, Light, Robe
  },
  t77: { // Можливо інший Avadon варіант
    ul: 2415,
    u: { i00: 0, i01: 0, i02: 2406 },
    l: { i00: 0, i01: 0, i02: 2406 },
    g: { i00: 5714, i01: 5715, i02: 5716 },
    b: { i00: 5730, i01: 5731, i02: 5732 },
  },
  t85: { // Можливо Doom Set
    ul: 0, // Doom Helmet (потрібно знайти ID)
    u: { i00: 0, i01: 0, i02: 0 }, // Doom Plate/Leather/Tunic
    l: { i00: 0, i01: 0, i02: 0 },
    g: { i00: 5722, i01: 5723, i02: 5724 }, // Heavy, Light, Robe
    b: { i00: 5738, i01: 5739, i02: 5740 }, // Heavy, Light, Robe
  },
  t90: { // Можливо інший Doom варіант
    ul: 0,
    u: { i00: 0, i01: 0, i02: 0 },
    l: { i00: 0, i01: 0, i02: 0 },
    g: { i00: 5722, i01: 5723, i02: 5724 },
    b: { i00: 5738, i01: 5739, i02: 5740 },
  },
  
  // A Grade Sets
  t80: { // Dark Crystal Set
    ul: 512, // Dark Crystal Helmet
    u: 365,  // Dark Crystal Breastplate
    l: 388,  // Dark Crystal Gaiters
    g: { i00: 5765, i01: 5766, i02: 5767 }, // Heavy, Light, Robe
    b: { i00: 5777, i01: 5778, i02: 5779 }, // Heavy, Light, Robe
  },
  t81: { // Dark Crystal Set (альтернативний)
    ul: 512,
    u: 365,
    l: 388,
    g: { i00: 5765, i01: 5766, i02: 5767 },
    b: { i00: 5777, i01: 5778, i02: 5779 },
  },
  t82: { // Dark Crystal Set (альтернативний)
    ul: 512,
    u: 365,
    l: 388,
    g: { i00: 5765, i01: 5766, i02: 5767 },
    b: { i00: 5777, i01: 5778, i02: 5779 },
  },
  t83: { // Majestic Set
    ul: 2419, // Majestic Circlet
    u: { i00: 0, i01: 0, i02: 2409 }, // Majestic Plate/Leather/Robe
    l: { i00: 0, i01: 0, i02: 2409 }, // Majestic Plate/Leather/Robe (robe займає обидва)
    g: { i00: 5774, i01: 5775, i02: 5776 }, // Heavy, Light, Robe
    b: { i00: 5786, i01: 5787, i02: 5788 }, // Heavy, Light, Robe
  },
  t84: { // Majestic Set (альтернативний)
    ul: 2419,
    u: { i00: 0, i01: 0, i02: 2409 },
    l: { i00: 0, i01: 0, i02: 2409 },
    g: { i00: 5774, i01: 5775, i02: 5776 },
    b: { i00: 5786, i01: 5787, i02: 5788 },
  },
  t85: { // Doom Set (B-grade) - вже є вище, але можливо також використовується для A-grade
    ul: 0,
    u: { i00: 0, i01: 0, i02: 0 },
    l: { i00: 0, i01: 0, i02: 0 },
    g: { i00: 5722, i01: 5723, i02: 5724 },
    b: { i00: 5738, i01: 5739, i02: 5740 },
  },
  t86: { // Tallum Set
    ul: 547, // Tallum Helmet
    u: 2382, // Tallum Plate Armor (займає armor і legs)
    l: 2382, // Tallum Plate Armor (займає armor і legs)
    g: { i00: 5768, i01: 5769, i02: 5770 }, // Heavy, Light, Robe
    b: { i00: 5780, i01: 5781, i02: 5782 }, // Heavy, Light, Robe
  },
  t87: { // Tallum Set (альтернативний)
    ul: 547,
    u: 2382,
    l: 2382,
    g: { i00: 5768, i01: 5769, i02: 5770 },
    b: { i00: 5780, i01: 5781, i02: 5782 },
  },
  t88: { // Tallum Set (альтернативний)
    ul: 547,
    u: 2382,
    l: 2382,
    g: { i00: 5768, i01: 5769, i02: 5770 },
    b: { i00: 5780, i01: 5781, i02: 5782 },
  },
  t89: { // Nightmare Set
    ul: 0, // Nightmare Helmet (потрібно знайти ID)
    u: { i00: 374, i01: 0, i02: 0 }, // Armor of Nightmare (займає armor і legs)
    l: { i00: 374, i01: 0, i02: 0 }, // Armor of Nightmare (займає armor і legs)
    g: { i00: 5771, i01: 5772, i02: 5773 }, // Heavy, Light, Robe
    b: { i00: 5783, i01: 5784, i02: 5785 }, // Heavy, Light, Robe
  },
  t90: { // Doom Set (B-grade) - вже є вище
    ul: 0,
    u: { i00: 0, i01: 0, i02: 0 },
    l: { i00: 0, i01: 0, i02: 0 },
    g: { i00: 5722, i01: 5723, i02: 5724 },
    b: { i00: 5738, i01: 5739, i02: 5740 },
  },
  t91: { // Nightmare Set (альтернативний)
    ul: 0,
    u: { i00: 374, i01: 0, i02: 0 },
    l: { i00: 374, i01: 0, i02: 0 },
    g: { i00: 5771, i01: 5772, i02: 5773 },
    b: { i00: 5783, i01: 5784, i02: 5785 },
  },
  t92: { // Nightmare Set (альтернативний)
    ul: 0,
    u: { i00: 374, i01: 0, i02: 0 },
    l: { i00: 374, i01: 0, i02: 0 },
    g: { i00: 5771, i01: 5772, i02: 5773 },
    b: { i00: 5783, i01: 5784, i02: 5785 },
  },
  t93: { // Nightmare Set (альтернативний)
    ul: 0,
    u: { i00: 374, i01: 0, i02: 0 },
    l: { i00: 374, i01: 0, i02: 0 },
    g: { i00: 5771, i01: 5772, i02: 5773 },
    b: { i00: 5783, i01: 5784, i02: 5785 },
  },
};

// Функція для отримання itemId з назви файлу
function getItemIdFromFileName(fileName) {
  // Формат: armor_t{setCode}_{part}_{index}.png
  const match = fileName.match(/armor_t(\d+)_([a-z]+)_i(\d+)\.png/);
  if (!match) return null;
  
  const [, setCode, part, index] = match;
  const setKey = `t${setCode}`;
  const indexKey = `i${index.padStart(2, '0')}`;
  
  if (!ARMOR_SET_MAPPING[setKey]) {
    console.warn(`⚠️  Невідомий сет: ${setKey}`);
    return null;
  }
  
  const setMapping = ARMOR_SET_MAPPING[setKey];
  
  // Для частин, які мають різні версії (gloves, boots)
  if (part === 'g' || part === 'b') {
    if (setMapping[part] && typeof setMapping[part] === 'object') {
      return setMapping[part][indexKey] || null;
    }
  }
  
  // Для інших частин (helmet, chest, legs)
  if (setMapping[part]) {
    if (typeof setMapping[part] === 'object') {
      return setMapping[part][indexKey] || null;
    }
    return setMapping[part];
  }
  
  return null;
}

// Головна функція
function main() {
  // Використовуємо абсолютний шлях до папки icons на рівні Desktop
  const iconsDir = path.join('C:', 'Users', 'KDFX Modes', 'Desktop', 'icons');
  // Використовуємо відносний шлях до public папки проекту
  const targetDir = path.join(__dirname, '..', 'public', 'items', 'drops', 'items');
  
  if (!fs.existsSync(iconsDir)) {
    console.error(`❌ Папка з іконками не знайдена: ${iconsDir}`);
    return;
  }
  
  // Створюємо цільову папку, якщо її немає
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`✅ Створено папку: ${targetDir}`);
  }
  
  const files = fs.readdirSync(iconsDir).filter(f => f.startsWith('armor_t') && f.endsWith('.png'));
  console.log(`\n📁 Знайдено ${files.length} файлів для обробки\n`);
  
  let renamed = 0;
  let skipped = 0;
  let errors = 0;
  
  files.forEach(file => {
    const itemId = getItemIdFromFileName(file);
    
    if (!itemId || itemId === 0) {
      console.log(`⏭️  Пропущено: ${file} (не знайдено itemId)`);
      skipped++;
      return;
    }
    
    const sourcePath = path.join(iconsDir, file);
    const targetPath = path.join(targetDir, `${itemId}.jpg`);
    
    try {
      // Копіюємо файл з перейменуванням у .jpg
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ ${file} -> ${itemId}.jpg`);
      renamed++;
    } catch (error) {
      console.error(`❌ Помилка при копіюванні ${file}:`, error.message);
      errors++;
    }
  });
  
  console.log(`\n📊 Результати:`);
  console.log(`   ✅ Перейменовано: ${renamed}`);
  console.log(`   ⏭️  Пропущено: ${skipped}`);
  console.log(`   ❌ Помилок: ${errors}`);
  console.log(`\n💡 Іконки скопійовані в: ${targetDir}`);
}

main();

