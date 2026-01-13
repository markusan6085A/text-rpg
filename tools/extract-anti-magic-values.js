import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо текстовий файл
const txtPath = path.join(__dirname, 'htmlскіли', 'Shillien Elder.txt');
const content = fs.readFileSync(txtPath, { encoding: 'utf-8' });

const lines = content.split('\n');
const antiMagicValues = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Шукаємо рядки з Anti Magic
  if (line.includes('Anti Magic') && line.includes('lv.')) {
    // Читаємо наступні рядки для знаходження значення
    let j = i + 1;
    while (j < lines.length && j < i + 5) {
      const nextLine = lines[j].trim();
      // Шукаємо "на XX" або "на XX." (кирилиця)
      const match = nextLine.match(/на\s+(\d+(?:\.\d+)?)/);
      if (match) {
        const value = parseFloat(match[1]);
        // Витягуємо рівень скілу
        const levelMatch = line.match(/lv\.(\d+)/);
        if (levelMatch) {
          const skillLevel = parseInt(levelMatch[1]);
          antiMagicValues.push({ level: skillLevel, mDef: value });
          break;
        }
      }
      j++;
    }
  }
}

// Сортуємо за рівнем
antiMagicValues.sort((a, b) => a.level - b.level);

console.log('Знайдені значення Anti Magic:\n');
antiMagicValues.forEach(item => {
  console.log(`Level ${item.level}: +${item.mDef} mDef`);
});

// Зберігаємо в JSON
const outputPath = path.join(__dirname, 'anti-magic-values.json');
fs.writeFileSync(outputPath, JSON.stringify(antiMagicValues, null, 2), 'utf-8');
console.log(`\nДані збережено в ${outputPath}`);


