// tools/parse_armor_sets_simple.mjs
// Простий парсер для arrow.txt

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

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Пропускаємо порожні та маркери
  if (!line || line === 'Human Fighter' || line === 'Female') {
    continue;
  }
  
  // Пропускаємо рядки з " x " (статистики)
  if (line.includes(' x ')) {
    continue;
  }
  
  // Пропускаємо рядки з ""
  if (line.includes('')) {
    continue;
  }
  
  // Пропускаємо маркери грейдів
  if (line.startsWith('A-') || line.startsWith('B-') || line.startsWith('C-') || line.startsWith('D-') || line.startsWith('No-')) {
    continue;
  }
  
  // Якщо рядок містить "Set" або закінчується на "Heavy"/"Light"/"Magic" (але не є частиною назви предмета)
  if (line.includes('Set') || 
      (line.endsWith(' Heavy') && !line.includes('Armor') && !line.includes('Gloves') && !line.includes('Boots')) ||
      (line.endsWith(' Light') && !line.includes('Armor') && !line.includes('Gloves') && !line.includes('Boots')) ||
      (line.includes('Magic Set')) ||
      line === 'Apella Plate Armor' ||
      line === 'Apella Brigandine' ||
      line === 'Apella Doublet') {
    
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
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine && 
          !nextLine.includes(' x ') && 
          !nextLine.includes('') &&
          nextLine.length > 10 &&
          (nextLine.includes('+') || nextLine.includes('%') || nextLine.includes('-'))) {
        currentSet.bonus = nextLine;
        i++; // Пропускаємо рядок з бонусами
      }
    }
    continue;
  }
  
  // Якщо є поточний сет, шукаємо частини
  if (currentSet) {
    // Перевіряємо, чи це назва частини
    const isPiece = line.includes('Helmet') || 
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
                    line.includes('Shirt') ||
                    (line.includes('Leather') && (line.includes('Armor') || line.includes('Shirt'))) ||
                    line.includes('Brigandine') ||
                    line.includes('Doublet') ||
                    line.includes('Solleret') ||
                    line.includes('Sabaton') ||
                    line.includes('Sandals') ||
                    line.includes('Aketon');
    
    if (isPiece && line.length > 5) {
      currentSet.pieces.push({
        name: line
      });
    }
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




