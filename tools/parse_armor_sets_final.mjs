// tools/parse_armor_sets_final.mjs
// Парсить arrow.txt та витягує сеті з бонусами та частинами

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const arrowFile = path.join(__dirname, 'htmlскіли', 'arrow.txt');
const content = fs.readFileSync(arrowFile, 'utf-8');
const lines = content.split('\n').map(l => l.trim());

const sets = [];
let currentSet = null;

function shouldSkip(line) {
  if (!line) return true;
  if (line === 'Human Fighter' || line === 'Female') return true;
  if (line.startsWith('A-') || line.startsWith('B-') || line.startsWith('C-') || line.startsWith('D-') || line.startsWith('No-')) return true;
  if (line.includes(' x ')) return true; // Статистики
  if (/[^\x20-\x7E]/.test(line) && line.length < 20) return true; // Спеціальні символи (короткі рядки)
  return false;
}

function isSetName(line) {
  if (!line || line.length < 3) return false;
  if (shouldSkip(line)) return false;
  
  // Назва сету містить "Set" або закінчується на "Heavy"/"Light"/"Magic"
  return line.includes('Set') || 
         line === 'Dark Crystal Heavy' ||
         line === 'Dark Crystal Light' ||
         line === 'Majestic Heavy' ||
         line === 'Majestic Light' ||
         line === 'Nightmare Heavy' ||
         line === 'Nightmare Light' ||
         line === 'Tallum Heavy' ||
         line === 'Tallum Light' ||
         line === 'Avadon Heavy' ||
         line === 'Avadon Light' ||
         line === "Blue Wolve's Heavy" ||
         line === "Blue Wolve's Light" ||
         line === 'Zubei Heavy' ||
         line === 'Zubei Light' ||
         line === 'Doom Plate Heavy' ||
         line === 'Doom Light' ||
         line === 'Apella Plate Armor' ||
         line === 'Apella Brigandine' ||
         line === 'Apella Doublet';
}

function isBonusLine(line) {
  if (!line || line.length < 10) return false;
  if (shouldSkip(line)) return false;
  
  // Бонуси містять +, %, -, та ключові слова
  return (line.includes('+') || line.includes('%') || line.includes('-')) &&
         (line.includes('HP') || line.includes('MP') || line.includes('Speed') || 
          line.includes('Def') || line.includes('Atk') || line.includes('Spd') ||
          line.includes('Dex') || line.includes('Str') || line.includes('Con') ||
          line.includes('Int') || line.includes('Wit') || line.includes('Men') ||
          line.includes('Evasion') || line.includes('Resistance') || line.includes('Regen') ||
          line.includes('Weight') || line.includes('CP') || line.includes('Shield') ||
          line.includes('Accuracy') || line.includes('Casting') || line.includes('moving'));
}

function isPieceName(line) {
  if (!line || line.length < 5) return false;
  if (shouldSkip(line)) return false;
  if (isSetName(line)) return false;
  if (isBonusLine(line)) return false;
  
  // Назви частин містять ключові слова
  return line.includes('Helmet') || 
         line.includes('Circlet') || 
         line.includes('Breastplate') || 
         line.includes('Plate Armor') || 
         line.includes('Gaiters') || 
         line.includes('Leggings') || 
         line.includes('Stockings') || 
         line.includes('Tunic') || 
         line.includes('Robe') || 
         line.includes('Gloves') || 
         line.includes('Gauntlets') || 
         line.includes('Boots') || 
         line.includes('Shield') ||
         (line.includes('Shirt') && !line.includes(' x ')) ||
         (line.includes('Leather') && (line.includes('Armor') || line.includes('Shirt'))) ||
         (line.includes('Brigandine') && !line.includes(' x ')) ||
         (line.includes('Doublet') && !line.includes(' x ')) ||
         line.includes('Solleret') ||
         line.includes('Sabaton') ||
         line.includes('Sandals') ||
         line.includes('Aketon');
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (shouldSkip(line)) {
    continue;
  }
  
  // Перевіряємо, чи це назва сету
  if (isSetName(line)) {
    // Зберігаємо попередній сет
    if (currentSet && currentSet.pieces.length > 0) {
      sets.push(currentSet);
    }
    
    // Створюємо новий сет
    currentSet = {
      name: line,
      bonus: null,
      pieces: []
    };
    
    // Наступний рядок - бонуси
    if (i + 1 < lines.length && isBonusLine(lines[i + 1])) {
      currentSet.bonus = lines[i + 1];
      i++; // Пропускаємо рядок з бонусами
    }
    continue;
  }
  
  // Якщо є поточний сет, шукаємо частини
  if (currentSet && isPieceName(line)) {
    currentSet.pieces.push({
      name: line
    });
  }
}

// Додаємо останній сет
if (currentSet && currentSet.pieces.length > 0) {
  sets.push(currentSet);
}

console.log(`Знайдено ${sets.length} сетів:\n`);
sets.forEach((set, idx) => {
  console.log(`${idx + 1}. ${set.name}`);
  if (set.bonus) console.log(`   Бонуси: ${set.bonus}`);
  console.log(`   Частини (${set.pieces.length}):`);
  set.pieces.forEach(p => console.log(`     - ${p.name}`));
  console.log('');
});

// Зберігаємо результат
const outputFile = path.join(__dirname, 'armor_sets_parsed.json');
fs.writeFileSync(outputFile, JSON.stringify(sets, null, 2), 'utf-8');
console.log(`\nРезультат збережено в ${outputFile}`);
