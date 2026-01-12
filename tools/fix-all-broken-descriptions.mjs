import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skillsDir = path.join(__dirname, '..', 'src', 'data', 'skills', 'classes');

// Знаходимо всі файли скілів
const skillFiles = await glob('**/*.ts', {
  cwd: skillsDir,
  ignore: ['**/index.ts', '**/utils.ts', '**/skills.ts']
});

console.log(`Знайдено ${skillFiles.length} файлів скілів\n`);

let fixedCount = 0;

for (const file of skillFiles) {
  const filePath = path.join(skillsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Знаходимо рядок з description
  const descMatch = content.match(/description:\s*"([^"]+)"/);
  if (!descMatch) continue;
  
  const fullDescription = descMatch[1];
  
  // Перевіряємо, чи є битий текст (кирилиця, яка виглядає як mojibake)
  if (!fullDescription.match(/[Р-Я][Р-Я]/) && !fullDescription.match(/Р­|Рє|Рґ|РЅ|СЃ|Рї|РІ|Р°|Рё|Рѕ|С„|РЈ|Р›|РЎ|Р"/)) {
    continue; // Немає битого тексту
  }
  
  // Знаходимо англійський опис (до першого битого тексту)
  // Бітий текст зазвичай починається з "Эффект" або кирилиці
  let cleanDescription = fullDescription;
  
  // Видаляємо все після "Эффект" або першого битого тексту
  const brokenTextStart = cleanDescription.search(/Эффект|Р­|Рє|Рґ|РЅ|СЃ|Рї|РІ|Р°|Рё|Рѕ|С„|РЈ|Р›|РЎ|Р"/);
  if (brokenTextStart > 0) {
    cleanDescription = cleanDescription.substring(0, brokenTextStart).trim();
    // Видаляємо зайві пробіли та крапки в кінці
    cleanDescription = cleanDescription.replace(/\s+\.\s*$/, '.').replace(/\s+$/, '');
  }
  
  // Якщо опис занадто короткий, залишаємо оригінал
  if (cleanDescription.length < 10) {
    continue;
  }
  
  // Замінюємо опис
  content = content.replace(
    /description:\s*"([^"]+)"/,
    `description: "${cleanDescription.replace(/"/g, '\\"')}"`
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Виправлено: ${file}`);
    fixedCount++;
  }
}

console.log(`\nГотово! Виправлено ${fixedCount} файлів з ${skillFiles.length} перевірених.`);

