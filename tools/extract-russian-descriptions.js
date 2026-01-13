import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо текстовий файл
const txtPath = path.join(__dirname, 'htmlскіли', 'Shillien Elder.txt');
const content = fs.readFileSync(txtPath, { encoding: 'utf-8' });

const lines = content.split('\n');
const descriptions = new Map();

let currentSkillName = null;
let currentSkillLevel = null;
let collectingDescription = false;
let descriptionLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Шукаємо назву скілу та рівень
  const skillMatch = line.match(/^([A-Z][a-zA-Z\s]+?)\s+lv\.(\d+)$/) || 
                    line.match(/^([A-Z][a-zA-Z\s]+?)\t([A-Z][a-zA-Z\s]+?)\s+lv\.(\d+)$/);
  
  if (skillMatch) {
    // Зберігаємо попередній опис, якщо був
    if (currentSkillName && descriptionLines.length > 0) {
      const key = `${currentSkillName}_${currentSkillLevel}`;
      const desc = descriptionLines.join(' ').trim();
      if (desc && desc.length > 10) {
        descriptions.set(key, desc);
      }
    }
    
    // Починаємо новий скіл
    currentSkillName = (skillMatch[1] || skillMatch[2] || '').trim();
    if (currentSkillName.includes('\t')) {
      currentSkillName = currentSkillName.split('\t')[0].trim();
    }
    currentSkillLevel = parseInt(skillMatch[skillMatch.length - 1]);
    descriptionLines = [];
    collectingDescription = false;
    continue;
  }
  
  // Шукаємо рядок з "Эффект" - це початок російського опису
  if (line.includes('Эффект') || line.includes('Эффект')) {
    collectingDescription = true;
    descriptionLines = [line];
    continue;
  }
  
  // Збираємо опис
  if (collectingDescription) {
    // Якщо рядок починається з "-", це частина опису
    if (line.startsWith('-') || line.match(/^[А-Яа-я]/)) {
      descriptionLines.push(line);
    } else if (line.length === 0) {
      // Порожній рядок - кінець опису
      if (currentSkillName && descriptionLines.length > 0) {
        const key = `${currentSkillName}_${currentSkillLevel}`;
        const desc = descriptionLines.join(' ').trim();
        if (desc && desc.length > 10) {
          descriptions.set(key, desc);
        }
      }
      collectingDescription = false;
      descriptionLines = [];
    }
  }
}

// Зберігаємо останній опис
if (currentSkillName && descriptionLines.length > 0) {
  const key = `${currentSkillName}_${currentSkillLevel}`;
  const desc = descriptionLines.join(' ').trim();
  if (desc && desc.length > 10) {
    descriptions.set(key, desc);
  }
}

console.log(`Знайдено ${descriptions.size} описів:\n`);
descriptions.forEach((desc, key) => {
  console.log(`${key}:`);
  console.log(`  ${desc.substring(0, 100)}...`);
  console.log('');
});

// Зберігаємо в JSON
const outputPath = path.join(__dirname, 'russian-descriptions.json');
const output = Object.fromEntries(descriptions);
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`\nДані збережено в ${outputPath}`);


