#!/usr/bin/env node
/**
 * Копіює іконки ресурсів у public/items/drops/resources/
 * 
 * Варіант 1: Іконки в папці по ID (1870.jpg, 1880.jpg...)
 *   node scripts/copy-resource-icons.mjs ./path/to/l2/icons
 * 
 * Варіант 2: Іконки вже є з людськими іменами (Coal.jpg, Steel.jpg...)
 *   node scripts/copy-resource-icons.mjs ./public/items/drops/resources
 *   (просто перевірить наявність і виведе що бракує)
 * 
 * Маппінг L2 item_id → ім'я файлу для itemsDB
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = path.join(__dirname, '..', 'public', 'items', 'drops', 'resources');

const ITEM_ID_TO_FILENAME = {
  1864: 'Strum.jpg',      // stem
  1865: 'Varnish.jpg',
  1866: 'Suede.jpg',
  1867: 'Animal_Skin.jpg',
  1868: 'Thread.jpg',
  1869: 'Iron_Ore.jpg',
  1870: 'Coal.jpg',
  1871: 'Charcoal.jpg',
  1872: 'Animal_Bones.jpg',
  1873: 'Silver_Nugget.jpg',
  1874: 'Oriharukon_Ore.jpg',
  1875: 'Stone_of_Purity.jpg',
  1876: 'Mithril_Ore.jpg',
  1877: 'Adamantite_Nugget.jpg',
  1880: 'Steel.jpg',
  1881: 'Coarse_Bone_Powder.jpg',
  1882: 'Leather.jpg',
  1884: 'Cord.jpg',
  1885: 'High-grade_Suede.jpg',
  1894: 'Crafted_Leather.jpg',
  4039: 'Mold_Glue.jpg',
  4040: 'Mold_Lubricant.jpg',
  4041: 'Mold_Hardener.jpg',
  4042: 'Enria.jpg',
  4043: 'Asofe.jpg',
  4044: 'Thons.jpg',
};

function findIcon(sourceDir, itemId, targetName) {
  const byId = path.join(sourceDir, `${itemId}.jpg`);
  const byIdPng = path.join(sourceDir, `${itemId}.png`);
  const byName = path.join(sourceDir, targetName);
  if (fs.existsSync(byId)) return byId;
  if (fs.existsSync(byIdPng)) return byIdPng;
  if (fs.existsSync(byName)) return byName;
  return null;
}

function main() {
  const sourceDir = process.argv[2];
  if (!sourceDir || !fs.existsSync(sourceDir)) {
    console.log(`
Використання: node scripts/copy-resource-icons.mjs <шлях до папки з іконками>

Папка може містити:
  - файли по ID: 1870.jpg, 1880.jpg, 1876.jpg...
  - або з іменами: Coal.jpg, Steel.jpg, Mithril_Ore.jpg...

Іконки будуть скопійовані в: public/items/drops/resources/

Якщо у тебе вже є Coal.jpg, Steel.jpg в папці resources - додай їх у git:
  git add public/items/drops/resources/Coal.jpg
  git add public/items/drops/resources/Steel.jpg
  ... (або git add public/items/drops/resources/*.jpg)
  git commit -m "feat: add resource icons"
  git push
`);
    process.exit(1);
  }

  if (!fs.existsSync(TARGET)) fs.mkdirSync(TARGET, { recursive: true });

  let copied = 0;
  let missing = [];

  for (const [itemId, targetName] of Object.entries(ITEM_ID_TO_FILENAME)) {
    const src = findIcon(sourceDir, itemId, targetName);
    const dst = path.join(TARGET, targetName);
    if (src) {
      try {
        fs.copyFileSync(src, dst);
        console.log(`✅ ${targetName}`);
        copied++;
      } catch (e) {
        console.error(`❌ ${targetName}:`, e.message);
      }
    } else {
      missing.push(`${targetName} (id ${itemId})`);
    }
  }

  console.log(`\n📊 Скопійовано: ${copied}`);
  if (missing.length) {
    console.log(`\n⚠️ Не знайдено: ${missing.join(', ')}`);
  }
}

main();
