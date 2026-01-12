import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо HTML файл з UTF-8
const htmlPath = path.join(__dirname, 'htmlскіли', 'Shillien Elder - База знаний Л2.htm');
const htmlContent = fs.readFileSync(htmlPath, { encoding: 'utf-8' });

console.log(`Розмір файлу: ${htmlContent.length} символів\n`);

// Шукаємо всі таблиці
const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
const tables = [];
let match;
while ((match = tableRegex.exec(htmlContent)) !== null) {
  tables.push(match[1]);
}

console.log(`Знайдено таблиць: ${tables.length}\n`);

// Шукаємо назви скілів (англійські назви, зазвичай з великої літери, 2+ слова)
const skillNamePattern = /<a[^>]*href="#skill\d+"[^>]*>([A-Z][a-zA-Z\s]{5,50})<\/a>/gi;
const skillNames = [];
const seenNames = new Set();
while ((match = skillNamePattern.exec(htmlContent)) !== null) {
  const name = match[1].trim();
  if (!seenNames.has(name) && name.length > 3) {
    seenNames.add(name);
    skillNames.push(name);
  }
}

console.log(`Знайдено назв скілів: ${skillNames.length}`);
console.log(`Назви: ${skillNames.join(', ')}\n`);

// Шукаємо всі якорі (name="...")
const anchorRegex = /<a[^>]*name="([^"]+)"[^>]*>/gi;
const anchors = [];
while ((match = anchorRegex.exec(htmlContent)) !== null) {
  anchors.push(match[1]);
}

console.log(`Знайдено якорів: ${anchors.length}`);
console.log(`Перші 20 якорів: ${anchors.slice(0, 20).join(', ')}\n`);

// Шукаємо структуру зі скілами - шукаємо таблиці з назвами та ID
const skills = [];
const skillSections = htmlContent.split(/<a[^>]*name="skill\d+"[^>]*>/i);

console.log(`Знайдено секцій скілів: ${skillSections.length - 1}\n`);

// Обробляємо кожну секцію
for (let i = 1; i < skillSections.length; i++) {
  const section = skillSections[i].substring(0, 5000); // Перші 5000 символів секції
  
  // Шукаємо ID скілу
  const idMatch = section.match(/(?:skill|ID|id|№)[\s:]*(\d{4,5})/i);
  if (!idMatch) continue;
  
  const skillId = parseInt(idMatch[1]);
  if (skillId < 1000 || skillId > 20000) continue;
  
  // Шукаємо назву
  const nameMatch = section.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i) ||
                   section.match(/<td[^>]*>([A-Z][a-zA-Z\s]{5,50})<\/td>/i) ||
                   section.match(/<a[^>]*>([A-Z][a-zA-Z\s]{5,50})<\/a>/i);
  
  if (!nameMatch) continue;
  
  const skillName = nameMatch[1].trim();
  
  // Шукаємо опис
  const descMatch = section.match(/<td[^>]*>([А-Яа-яЁё\s,\.:;()\-]{30,500})<\/td>/i);
  const description = descMatch ? descMatch[1].trim() : '';
  
  // Шукаємо рівні
  const levels = [];
  const levelRows = section.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  
  levelRows.forEach(row => {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length >= 2) {
      const levelText = cells[0].replace(/<[^>]+>/g, '').trim();
      const spText = (cells[1] || '').replace(/<[^>]+>/g, '').trim();
      const mpText = (cells[2] || '').replace(/<[^>]+>/g, '').trim();
      
      const levelMatch = levelText.match(/(\d+)/);
      const spMatch = spText.match(/(\d+)/);
      const mpMatch = mpText.match(/(\d+)/);
      
      if (levelMatch) {
        levels.push({
          level: parseInt(levelMatch[1]),
          spCost: spMatch ? parseInt(spMatch[1]) : 0,
          mpCost: mpMatch ? parseInt(mpMatch[1]) : 0,
          requiredLevel: parseInt(levelMatch[1]) * 4 + 40 // Shillien Elder starts at 40
        });
      }
    }
  });
  
  skills.push({
    id: skillId,
    name: skillName,
    description: description,
    levels: levels
  });
}

// Сортуємо за ID
skills.sort((a, b) => a.id - b.id);

console.log(`\nЗнайдено ${skills.length} скілів:\n`);
skills.forEach(skill => {
  console.log(`ID: ${skill.id}, Name: ${skill.name}, Levels: ${skill.levels.length}`);
  if (skill.description) {
    console.log(`  Опис: ${skill.description.substring(0, 60)}...`);
  }
});

// Зберігаємо
const outputPath = path.join(__dirname, 'shillien-elder-skills-parsed.json');
fs.writeFileSync(outputPath, JSON.stringify(skills, null, 2), 'utf-8');
console.log(`\nДані збережено в ${outputPath}`);

if (skills.length > 0) {
  console.log(`\nПриклад першого скілу:\n${JSON.stringify(skills[0], null, 2)}`);
}

