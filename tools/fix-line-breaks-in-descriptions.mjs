import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skillsDir = path.join(__dirname, '..', 'src', 'data', 'skills', 'classes', 'DarkMystic');

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
  
  // Знаходимо description з реальними переносами рядків (не \n\n)
  // Патерн: description: "текст\n\nросійський текст"
  const multilineDescPattern = /description:\s*"([^"]*(?:\r?\n\r?\n[А-Яа-яЁё][^"]*)?)"/;
  const match = content.match(multilineDescPattern);
  
  if (match && match[1].includes('\n')) {
    // Замінюємо реальні переноси на \n\n
    const fixedDescription = match[1]
      .replace(/\r?\n\r?\n/g, '\\n\\n')
      .replace(/\r?\n/g, ' ');
    
    content = content.replace(
      multilineDescPattern,
      `description: "${fixedDescription}"`
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Виправлено: ${file}`);
      fixedCount++;
    }
  }
}

console.log(`\nГотово! Виправлено ${fixedCount} файлів з ${skillFiles.length} перевірених.`);

