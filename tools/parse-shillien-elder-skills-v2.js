import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо HTML файл
const htmlPath = path.join(__dirname, 'htmlскіли', 'Shillien Elder - База знаний Л2.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

console.log(`Розмір файлу: ${htmlContent.length} символів\n`);

// Шукаємо всі посилання на рівні (Level 40, Level 44, тощо)
const levelLinks = htmlContent.match(/<a[^>]*href="#level\d+"[^>]*>([^<]+)<\/a>/gi) || [];
console.log(`Знайдено посилань на рівні: ${levelLinks.length}`);

// Шукаємо якорі з рівнями
const levelAnchors = htmlContent.match(/<a[^>]*name="level\d+"[^>]*>/gi) || [];
console.log(`Знайдено якорів рівнів: ${levelAnchors.length}\n`);

// Шукаємо таблиці зі скілами - шукаємо по структурі
// Зазвичай скіли в таблицях з назвами, описом, рівнями
const skillPatterns = [
  // Паттерн 1: Назва скілу в заголовку
  /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi,
  // Паттерн 2: Таблиці з даними
  /<table[^>]*class="[^"]*skill[^"]*"[^>]*>([\s\S]*?)<\/table>/gi,
  // Паттерн 3: Рядки з ID скілів
  /(?:skill|id)[\s:]*(\d{4,})/gi,
];

// Витягуємо всі можливі ID скілів (4+ цифри)
const skillIdMatches = htmlContent.match(/\b(\d{4,})\b/g) || [];
const uniqueSkillIds = [...new Set(skillIdMatches.map(id => parseInt(id)).filter(id => id >= 1000 && id < 10000))];
console.log(`Знайдено унікальних ID (1000-9999): ${uniqueSkillIds.length}`);
console.log(`Перші 20: ${uniqueSkillIds.slice(0, 20).join(', ')}\n`);

// Шукаємо назви скілів (англійські назви, зазвичай з великої літери)
const skillNamePattern = /<td[^>]*>([A-Z][a-zA-Z\s]{3,40})<\/td>/g;
const nameMatches = [];
let match;
while ((match = skillNamePattern.exec(htmlContent)) !== null) {
  const name = match[1].trim();
  if (name.length > 3 && name.length < 50 && !name.match(/^\d+$/)) {
    nameMatches.push(name);
  }
}

console.log(`Знайдено можливих назв скілів: ${nameMatches.length}`);
console.log(`Перші 20: ${nameMatches.slice(0, 20).join(', ')}\n`);

// Шукаємо описи скілів (російською)
const descriptionPattern = /<td[^>]*>([А-Яа-яЁё\s,\.:;]{20,200})<\/td>/g;
const descriptions = [];
while ((match = descriptionPattern.exec(htmlContent)) !== null) {
  const desc = match[1].trim();
  if (desc.length > 20 && desc.length < 300) {
    descriptions.push(desc);
  }
}

console.log(`Знайдено можливих описів: ${descriptions.length}`);
console.log(`Перші 3: ${descriptions.slice(0, 3).map(d => d.substring(0, 50) + '...').join('\n')}\n`);

// Зберігаємо всі знайдені дані
const output = {
  skillIds: uniqueSkillIds.slice(0, 50), // Перші 50 ID
  skillNames: [...new Set(nameMatches)].slice(0, 50), // Унікальні назви
  descriptions: descriptions.slice(0, 20), // Перші 20 описів
  levelLinks: levelLinks.slice(0, 20), // Перші 20 посилань
};

const outputPath = path.join(__dirname, 'shillien-elder-raw-data.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`Сирий дані збережено в ${outputPath}`);

// Також зберігаємо фрагмент HTML для аналізу
const htmlFragment = htmlContent.substring(htmlContent.indexOf('Shillien Elder'), Math.min(htmlContent.indexOf('Shillien Elder') + 10000, htmlContent.length));
const fragmentPath = path.join(__dirname, 'html-fragment.txt');
fs.writeFileSync(fragmentPath, htmlFragment, 'utf-8');
console.log(`Фрагмент HTML збережено в ${fragmentPath}`);


