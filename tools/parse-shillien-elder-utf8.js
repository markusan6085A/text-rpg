import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо HTML файл з UTF-8 кодуванням
const htmlPath = path.join(__dirname, 'htmlскіли', 'Shillien Elder - База знаний Л2.htm');
console.log(`Читаю файл: ${htmlPath}`);

// Читаємо з явним вказівкою UTF-8
const htmlContent = fs.readFileSync(htmlPath, { encoding: 'utf-8' });

console.log(`Розмір файлу: ${htmlContent.length} символів`);
console.log(`Перші 500 символів:\n${htmlContent.substring(0, 500)}\n`);

// Перевіряємо, чи є UTF-8 meta tag
const hasUtf8Meta = htmlContent.includes('<meta charset="UTF-8">') || 
                    htmlContent.includes('<meta charset="utf-8">') ||
                    htmlContent.includes('charset="UTF-8"') ||
                    htmlContent.includes('charset="utf-8"');
console.log(`Містить UTF-8 meta tag: ${hasUtf8Meta}\n`);

// Шукаємо всі якорі скілів (#skill...)
const skillAnchorRegex = /<a[^>]*name="skill(\d+)"[^>]*>/gi;
const skillAnchors = [];
let match;
while ((match = skillAnchorRegex.exec(htmlContent)) !== null) {
  skillAnchors.push({
    hash: match[1],
    fullMatch: match[0]
  });
}

console.log(`Знайдено якорів скілів: ${skillAnchors.length}`);

// Шукаємо посилання на скіли з назвами
const skillLinkRegex = /<a[^>]*href="#skill(\d+)"[^>]*>([^<]+)<\/a>/gi;
const skillLinks = [];
while ((match = skillLinkRegex.exec(htmlContent)) !== null) {
  skillLinks.push({
    hash: match[1],
    name: match[2].trim()
  });
}

console.log(`Знайдено посилань на скіли: ${skillLinks.length}`);

// Шукаємо таблиці зі скілами - шукаємо структуру з ID
const skillIdRegex = /(?:skill|ID|id)[\s:]*(\d{4,5})/gi;
const skillIds = [];
const seenIds = new Set();
while ((match = skillIdRegex.exec(htmlContent)) !== null) {
  const id = parseInt(match[1]);
  if (id >= 1000 && id < 20000 && !seenIds.has(id)) {
    seenIds.add(id);
    skillIds.push(id);
  }
}

console.log(`Знайдено можливих ID скілів: ${skillIds.length}`);
console.log(`Перші 30 ID: ${skillIds.slice(0, 30).join(', ')}\n`);

// Створюємо мапу скілів
const skillsMap = new Map();

// Додаємо скіли з посилань
skillLinks.forEach(link => {
  if (!skillsMap.has(link.hash)) {
    skillsMap.set(link.hash, {
      hash: link.hash,
      name: link.name,
      levels: [],
      description: '',
      id: null
    });
  }
});

// Шукаємо таблиці з деталями скілів (після якоря)
skillAnchors.forEach(anchor => {
  const anchorIndex = htmlContent.indexOf(anchor.fullMatch);
  if (anchorIndex === -1) return;
  
  // Шукаємо таблицю після якоря (наступні 10000 символів)
  const section = htmlContent.substring(anchorIndex, Math.min(anchorIndex + 10000, htmlContent.length));
  
  const skill = skillsMap.get(anchor.hash) || { hash: anchor.hash, name: '', levels: [], description: '', id: null };
  
  // Шукаємо ID скілу в секції
  const idMatch = section.match(/(?:skill|ID|id)[\s:]*(\d{4,5})/i);
  if (idMatch) {
    skill.id = parseInt(idMatch[1]);
  }
  
  // Шукаємо назву скілу в заголовку
  const nameMatch = section.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
  if (nameMatch && !skill.name) {
    skill.name = nameMatch[1].trim();
  }
  
  // Шукаємо опис
  const descMatch = section.match(/<td[^>]*>([А-Яа-яЁё\s,\.:;()\-]{30,800})<\/td>/i);
  if (descMatch) {
    const desc = descMatch[1].trim();
    if (desc.length > 30 && desc.length < 1000) {
      skill.description = desc;
    }
  }
  
  // Шукаємо рівні скілу в таблицях
  const levelRows = section.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  levelRows.forEach(row => {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length >= 3) {
      const levelText = cells[0].replace(/<[^>]+>/g, '').trim();
      const spText = (cells[1] || '').replace(/<[^>]+>/g, '').trim();
      const mpText = (cells[2] || '').replace(/<[^>]+>/g, '').trim();
      
      const levelMatch = levelText.match(/(\d+)/);
      const spMatch = spText.match(/(\d+)/);
      const mpMatch = mpText.match(/(\d+)/);
      
      if (levelMatch) {
        skill.levels.push({
          level: parseInt(levelMatch[1]),
          spCost: spMatch ? parseInt(spMatch[1]) : 0,
          mpCost: mpMatch ? parseInt(mpMatch[1]) : 0,
          requiredLevel: parseInt(levelMatch[1]) * 4 + 20
        });
      }
    }
  });
  
  skillsMap.set(anchor.hash, skill);
});

// Конвертуємо в масив та фільтруємо
const skills = Array.from(skillsMap.values())
  .filter(s => s.name && s.id)
  .sort((a, b) => (a.id || 0) - (b.id || 0));

console.log(`\nЗнайдено ${skills.length} скілів з ID:\n`);
skills.forEach(skill => {
  console.log(`ID: ${skill.id}, Name: ${skill.name}, Hash: ${skill.hash}, Levels: ${skill.levels.length}`);
  if (skill.description) {
    console.log(`  Опис: ${skill.description.substring(0, 80)}...`);
  }
});

// Зберігаємо результати
const outputPath = path.join(__dirname, 'shillien-elder-skills-final.json');
fs.writeFileSync(outputPath, JSON.stringify(skills, null, 2), 'utf-8');
console.log(`\nДані збережено в ${outputPath}`);

// Показуємо приклад
if (skills.length > 0) {
  console.log(`\nПриклад першого скілу:\n${JSON.stringify(skills[0], null, 2)}`);
}


