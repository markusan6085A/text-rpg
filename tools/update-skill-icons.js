import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Шлях до папки з іконками
const iconsDir = path.join(__dirname, '..', 'public', 'skills');
// Шлях до папки зі скілами
const skillsDir = path.join(__dirname, '..', 'src', 'data', 'skills', 'classes', 'DarkMystic', 'ShillienElder');

console.log('Шукаю іконки в:', iconsDir);
console.log('Оновлюю скіли в:', skillsDir);

// Отримуємо список всіх файлів іконок
const iconFiles = fs.readdirSync(iconsDir).filter(file => 
  /\.(jpg|jpeg|gif|png)$/i.test(file)
);

console.log(`\nЗнайдено ${iconFiles.length} іконок\n`);

// Створюємо мапу: skill ID -> іконка
const iconMap = new Map();

iconFiles.forEach(file => {
  // Шукаємо числа в назві файлу (наприклад, Skill1201_0.jpg -> 1201)
  const match = file.match(/(\d{4})/);
  if (match) {
    const skillId = parseInt(match[1]);
    iconMap.set(skillId, file);
  }
});

console.log('Мапа іконок:');
iconMap.forEach((icon, id) => {
  console.log(`  Skill ${id} -> ${icon}`);
});

// Оновлюємо файли скілів
const skillFiles = fs.readdirSync(skillsDir).filter(file => 
  file.startsWith('skill_') && file.endsWith('.ts')
);

console.log(`\nОновлюю ${skillFiles.length} файлів скілів...\n`);

let updated = 0;
let notFound = 0;

skillFiles.forEach(file => {
  const filePath = path.join(skillsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Витягуємо ID скілу з назви файлу (skill_1201.ts -> 1201)
  const match = file.match(/skill_(\d+)\.ts/);
  if (!match) return;
  
  const skillId = parseInt(match[1]);
  const iconFile = iconMap.get(skillId);
  
  if (iconFile) {
    // Оновлюємо шлях до іконки
    const iconPath = `/skills/${iconFile}`;
    const oldPattern = /icon:\s*"[^"]*",\s*\/\/\s*TODO:.*/;
    const newIcon = `icon: "${iconPath}",`;
    
    if (oldPattern.test(content)) {
      content = content.replace(oldPattern, newIcon);
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ ${file} -> ${iconFile}`);
      updated++;
    } else {
      // Спробуємо знайти будь-який icon рядок
      const iconPattern = /icon:\s*"[^"]*"/;
      if (iconPattern.test(content)) {
        content = content.replace(iconPattern, `icon: "${iconPath}"`);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✓ ${file} -> ${iconFile} (оновлено без TODO)`);
        updated++;
      }
    }
  } else {
    console.log(`✗ ${file} -> іконка не знайдена для ID ${skillId}`);
    notFound++;
  }
});

console.log(`\n✅ Оновлено: ${updated} файлів`);
console.log(`⚠️  Не знайдено іконок: ${notFound} файлів`);


