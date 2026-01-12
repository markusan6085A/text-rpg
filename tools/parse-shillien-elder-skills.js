import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо HTML файл
const htmlPath = path.join(__dirname, 'htmlскіли', 'Shillien Elder - База знаний Л2.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// Простий парсер для витягування даних про скіли з HTML таблиць
// Шукаємо таблиці зі скілами
const skillTableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
const tables = htmlContent.match(skillTableRegex) || [];

console.log(`Знайдено ${tables.length} таблиць`);

// Функція для витягування тексту з HTML
function extractText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Функція для витягування ID скілу (якщо є)
function extractSkillId(text) {
  const match = text.match(/(?:skill|id)[\s:]*(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

// Функція для витягування назви скілу
function extractSkillName(text) {
  // Шукаємо назви в заголовках або перших рядках таблиць
  const nameMatch = text.match(/(?:<h[1-6][^>]*>|<td[^>]*>)([^<]+)/i);
  return nameMatch ? nameMatch[1].trim() : null;
}

// Парсимо таблиці та витягуємо дані
const skills = [];
let currentSkill = null;

// Шукаємо всі рядки таблиць з даними про скіли
const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
let match;

while ((match = rowRegex.exec(htmlContent)) !== null) {
  const rowHtml = match[1];
  const rowText = extractText(rowHtml);
  
  // Пропускаємо порожні рядки та заголовки
  if (!rowText || rowText.length < 5) continue;
  
  // Шукаємо ID скілу
  const skillId = extractSkillId(rowText);
  if (skillId && skillId > 1000) { // Фільтруємо тільки реальні ID скілів
    if (currentSkill) {
      skills.push(currentSkill);
    }
    currentSkill = {
      id: skillId,
      name: extractSkillName(rowText) || `Skill ${skillId}`,
      description: '',
      levels: []
    };
  }
  
  // Якщо знайшли опис
  if (rowText.toLowerCase().includes('описание') || rowText.toLowerCase().includes('description')) {
    const descMatch = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
    if (descMatch && currentSkill) {
      currentSkill.description = extractText(descMatch[1]);
    }
  }
  
  // Шукаємо рівні скілу (Level, SP, MP тощо)
  if (rowText.match(/level|уровень|sp|mp|cost/i) && currentSkill) {
    const cells = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length >= 3) {
      const levelText = extractText(cells[0]);
      const spText = extractText(cells[1] || '');
      const mpText = extractText(cells[2] || '');
      
      const levelMatch = levelText.match(/(\d+)/);
      const spMatch = spText.match(/(\d+)/);
      const mpMatch = mpText.match(/(\d+)/);
      
      if (levelMatch) {
        currentSkill.levels.push({
          level: parseInt(levelMatch[1]),
          spCost: spMatch ? parseInt(spMatch[1]) : 0,
          mpCost: mpMatch ? parseInt(mpMatch[1]) : 0,
          requiredLevel: parseInt(levelMatch[1]) * 4 + 20 // Приблизна формула
        });
      }
    }
  }
}

if (currentSkill) {
  skills.push(currentSkill);
}

console.log(`\nЗнайдено ${skills.length} скілів:\n`);
skills.forEach(skill => {
  console.log(`ID: ${skill.id}, Name: ${skill.name}, Levels: ${skill.levels.length}`);
});

// Зберігаємо результати в JSON
const outputPath = path.join(__dirname, 'shillien-elder-skills.json');
fs.writeFileSync(outputPath, JSON.stringify(skills, null, 2), 'utf-8');
console.log(`\nДані збережено в ${outputPath}`);


