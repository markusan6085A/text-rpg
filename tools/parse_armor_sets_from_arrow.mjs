// tools/parse_armor_sets_from_arrow.mjs
// Парсить arrow.txt та оновлює armorSets.ts з правильними бонусами

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
let i = 0;

function isMarker(line) {
  return !line || 
         line === 'Human Fighter' || 
         line === 'Female' || 
         line.startsWith('A-') || 
         line.startsWith('B-') || 
         line.startsWith('C-') || 
         line.startsWith('D-') || 
         line.startsWith('No-') ||
         line.includes(' x ') ||
         line.includes('');
}

function isSetName(line) {
  if (!line || line.length < 3) return false;
  if (isMarker(line)) return false;
  
  // Перевіряємо, чи це назва сету
  return line.includes('Set') || 
         (line.includes('Heavy') && !line.includes('Armor') && !line.includes('Gloves') && !line.includes('Boots')) ||
         (line.includes('Light') && !line.includes('Armor') && !line.includes('Gloves') && !line.includes('Boots')) ||
         (line.includes('Magic') && !line.includes('Armor') && !line.includes('Gloves') && !line.includes('Boots')) ||
         line === 'Apella Plate Armor' ||
         line === 'Apella Brigandine' ||
         line === 'Apella Doublet';
}

function isBonusLine(line) {
  if (!line || line.length < 10) return false;
  if (isMarker(line)) return false;
  
  // Бонуси містять +, %, -, HP, MP, Speed, Def, Atk, тощо
  return (line.includes('+') || line.includes('%') || line.includes('-')) &&
         (line.includes('HP') || line.includes('MP') || line.includes('Speed') || 
          line.includes('Def') || line.includes('Atk') || line.includes('Spd') ||
          line.includes('Dex') || line.includes('Str') || line.includes('Con') ||
          line.includes('Int') || line.includes('Wit') || line.includes('Men') ||
          line.includes('Evasion') || line.includes('Resistance') || line.includes('Regen') ||
          line.includes('Weight') || line.includes('CP') || line.includes('Shield'));
}

function isPieceName(line) {
  if (!line || line.length < 3) return false;
  if (isMarker(line)) return false;
  if (isSetName(line)) return false;
  if (isBonusLine(line)) return false;
  
  // Назви частин містять ключові слова
  return line.includes('Helmet') || 
         line.includes('Circlet') || 
         line.includes('Breastplate') || 
         line.includes('Plate Armor') || 
         line.includes('Armor') || 
         line.includes('Gaiters') || 
         line.includes('Leggings') || 
         line.includes('Stockings') || 
         line.includes('Tunic') || 
         line.includes('Robe') || 
         line.includes('Gloves') || 
         line.includes('Gauntlets') || 
         line.includes('Boots') || 
         line.includes('Shield') ||
         line.includes('Shirt') ||
         line.includes('Leather') ||
         line.includes('Brigandine') ||
         line.includes('Doublet') ||
         line.includes('Solleret') ||
         line.includes('Sabaton') ||
         line.includes('Sandals') ||
         line.includes('Aketon');
}

while (i < lines.length) {
  const line = lines[i];
  
  if (isMarker(line)) {
    i++;
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
    
    i++;
    
    // Наступний рядок - бонуси
    if (i < lines.length && isBonusLine(lines[i])) {
      currentSet.bonus = lines[i];
      i++;
    }
    
    continue;
  }
  
  // Якщо є поточний сет, шукаємо частини
  if (currentSet && isPieceName(line)) {
    currentSet.pieces.push({
      name: line
    });
  }
  
  i++;
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
