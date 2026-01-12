import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо HTML файл
const htmlPath = path.join(__dirname, 'htmlскіли', 'Shillien Elder - База знаний Л2.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

console.log(`Розмір файлу: ${htmlContent.length} символів\n`);

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

// Створюємо мапу скілів
const skillsMap = new Map();

// Додаємо скіли з посилань
skillLinks.forEach(link => {
  if (!skillsMap.has(link.hash)) {
    skillsMap.set(link.hash, {
      hash: link.hash,
      name: link.name,
      levels: []
    });
  }
});

// Шукаємо таблиці з деталями скілів (після якоря)
skillAnchors.forEach(anchor => {
  const anchorIndex = htmlContent.indexOf(anchor.fullMatch);
  if (anchorIndex === -1) return;
  
  // Шукаємо таблицю після якоря (наступні 5000 символів)
  const section = htmlContent.substring(anchorIndex, anchorIndex + 5000);
  
  // Шукаємо назву скілу в заголовку
  const nameMatch = section.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
  if (nameMatch) {
    const skill = skillsMap.get(anchor.hash) || { hash: anchor.hash, name: '', levels: [] };
    skill.name = nameMatch[1].trim();
    skillsMap.set(anchor.hash, skill);
  }
  
  // Шукаємо опис
  const descMatch = section.match(/<td[^>]*>([А-Яа-яЁё\s,\.:;]{30,500})<\/td>/i);
  if (descMatch) {
    const skill = skillsMap.get(anchor.hash) || { hash: anchor.hash, name: '', levels: [] };
    skill.description = descMatch[1].trim();
    skillsMap.set(anchor.hash, skill);
  }
  
  // Шукаємо рівні скілу в таблицях
  const levelRows = section.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  levelRows.forEach(row => {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length >= 3) {
      const levelText = cells[0].replace(/<[^>]+>/g, '').trim();
      const spText = cells[1]?.replace(/<[^>]+>/g, '').trim() || '';
      const mpText = cells[2]?.replace(/<[^>]+>/g, '').trim() || '';
      
      const levelMatch = levelText.match(/(\d+)/);
      const spMatch = spText.match(/(\d+)/);
      const mpMatch = mpText.match(/(\d+)/);
      
      if (levelMatch) {
        const skill = skillsMap.get(anchor.hash) || { hash: anchor.hash, name: '', levels: [] };
        skill.levels.push({
          level: parseInt(levelMatch[1]),
          spCost: spMatch ? parseInt(spMatch[1]) : 0,
          mpCost: mpMatch ? parseInt(mpMatch[1]) : 0,
          requiredLevel: parseInt(levelMatch[1]) * 4 + 20
        });
        skillsMap.set(anchor.hash, skill);
      }
    }
  });
});

// Конвертуємо в масив
const skills = Array.from(skillsMap.values()).filter(s => s.name);

console.log(`\nЗнайдено ${skills.length} скілів:\n`);
skills.forEach(skill => {
  console.log(`Hash: ${skill.hash}, Name: ${skill.name}, Levels: ${skill.levels.length}`);
  if (skill.description) {
    console.log(`  Опис: ${skill.description.substring(0, 60)}...`);
  }
});

// Зберігаємо результати
const outputPath = path.join(__dirname, 'shillien-elder-skills-parsed.json');
fs.writeFileSync(outputPath, JSON.stringify(skills, null, 2), 'utf-8');
console.log(`\nДані збережено в ${outputPath}`);

// Також створюємо приклад одного скілу для перевірки
if (skills.length > 0) {
  const exampleSkill = skills[0];
  console.log(`\nПриклад скілу:\n${JSON.stringify(exampleSkill, null, 2)}`);
}


