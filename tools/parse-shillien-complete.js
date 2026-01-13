import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо HTML файл з UTF-8
const htmlPath = path.join(__dirname, 'htmlскіли', 'Shillien Elder - База знаний Л2.htm');
console.log(`Читаю файл: ${htmlPath}`);
console.log(`Файл існує: ${fs.existsSync(htmlPath)}\n`);

const htmlContent = fs.readFileSync(htmlPath, { encoding: 'utf-8' });
console.log(`Розмір файлу: ${htmlContent.length} символів\n`);

// Шукаємо всі посилання на скіли
const skillLinkPattern = /<a[^>]*href="#skill(\d+)"[^>]*>([^<]+)<\/a>/gi;
const skillLinks = [];
let match;
while ((match = skillLinkPattern.exec(htmlContent)) !== null) {
  skillLinks.push({
    hash: match[1],
    name: match[2].trim()
  });
}

console.log(`Знайдено посилань на скіли: ${skillLinks.length}`);
skillLinks.forEach(link => {
  console.log(`  Hash: ${link.hash}, Name: ${link.name}`);
});

// Тепер шукаємо деталі для кожного скілу
// Шукаємо якорі та таблиці з даними
const skills = [];

skillLinks.forEach(link => {
  // Шукаємо секцію з цим хешем
  const hashPattern = new RegExp(`<a[^>]*name="skill${link.hash}"[^>]*>`, 'i');
  const anchorMatch = htmlContent.match(hashPattern);
  
  if (!anchorMatch) {
    // Якщо немає якоря, шукаємо посилання
    const linkPattern = new RegExp(`<a[^>]*href="#skill${link.hash}"[^>]*>`, 'i');
    const linkMatch = htmlContent.match(linkPattern);
    if (linkMatch) {
      const linkIndex = htmlContent.indexOf(linkMatch[0]);
      const section = htmlContent.substring(linkIndex, Math.min(linkIndex + 15000, htmlContent.length));
      
      // Шукаємо ID скілу
      const idMatch = section.match(/(?:skill|ID|id|№)[\s:]*(\d{4,5})/i);
      const skillId = idMatch ? parseInt(idMatch[1]) : null;
      
      // Шукаємо опис
      const descMatch = section.match(/([А-Яа-яЁё\s,\.:;()\-]{30,500})/);
      const description = descMatch ? descMatch[1].trim() : '';
      
      // Шукаємо рівні в таблицях
      const levels = [];
      const tableRows = section.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
      
      tableRows.forEach(row => {
        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
        if (cells.length >= 2) {
          const cellText = cells.map(c => c.replace(/<[^>]+>/g, '').trim()).join(' ');
          const levelMatch = cellText.match(/(?:Level|Lv|Уровень)[\s:]*(\d+)/i);
          const spMatch = cellText.match(/(?:SP|sp)[\s:]*(\d+)/i);
          const mpMatch = cellText.match(/(?:MP|mp)[\s:]*(\d+)/i);
          
          if (levelMatch) {
            levels.push({
              level: parseInt(levelMatch[1]),
              spCost: spMatch ? parseInt(spMatch[1]) : 0,
              mpCost: mpMatch ? parseInt(mpMatch[1]) : 0,
              requiredLevel: parseInt(levelMatch[1]) * 4 + 40
            });
          }
        }
      });
      
      if (skillId || link.name) {
        skills.push({
          id: skillId || parseInt(link.hash.substring(0, 4)),
          name: link.name,
          description: description,
          levels: levels.length > 0 ? levels : [{ level: 1, spCost: 0, mpCost: 0, requiredLevel: 40 }]
        });
      }
    }
  }
});

// Видаляємо дублікати
const uniqueSkills = [];
const seenIds = new Set();
skills.forEach(skill => {
  if (!seenIds.has(skill.id)) {
    seenIds.add(skill.id);
    uniqueSkills.push(skill);
  }
});

uniqueSkills.sort((a, b) => a.id - b.id);

console.log(`\nЗнайдено ${uniqueSkills.length} скілів:\n`);
uniqueSkills.forEach(skill => {
  console.log(`ID: ${skill.id}, Name: ${skill.name}, Levels: ${skill.levels.length}`);
  if (skill.description) {
    console.log(`  Опис: ${skill.description.substring(0, 80)}...`);
  }
});

// Зберігаємо
const outputPath = path.join(__dirname, 'shillien-elder-skills-complete.json');
fs.writeFileSync(outputPath, JSON.stringify(uniqueSkills, null, 2), 'utf-8');
console.log(`\nДані збережено в ${outputPath}`);


