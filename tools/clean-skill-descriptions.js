import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skillsDir = path.join(__dirname, '..', 'src', 'data', 'skills', 'classes', 'DarkMystic', 'ShillienElder');
const files = fs.readdirSync(skillsDir).filter(f => f.startsWith('skill_') && f.endsWith('.ts'));

console.log(`Очищаю описи в ${files.length} файлах скілів...\n`);

files.forEach(file => {
  const filePath = path.join(skillsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Знаходимо рядок з description
  const descMatch = content.match(/description:\s*"([^"]+)"/);
  if (!descMatch) return;
  
  const oldDesc = descMatch[1];
  
  // Очищаємо від заміщених символів (ромбиків) та кирилиці
  // Залишаємо тільки англійські літери, цифри, пробіли та основні знаки пунктуації
  let cleanDesc = oldDesc
    // Видаляємо всі заміщені символи (ромбики) - це символи, які не є ASCII
    .replace(/[^\x00-\x7F]+/g, ' ')
    // Видаляємо подвійні пробіли
    .replace(/\s+/g, ' ')
    .trim();
  
  // Якщо опис починається з назви скілу, видаляємо дублікати
  const nameMatch = content.match(/name:\s*"([^"]+)"/);
  if (nameMatch) {
    const skillName = nameMatch[1];
    // Видаляємо повторення назви скілу на початку
    cleanDesc = cleanDesc.replace(new RegExp(`^${skillName}\\s+${skillName}\\s*`, 'i'), '');
    cleanDesc = cleanDesc.replace(new RegExp(`^${skillName}\\s+`, 'i'), '');
  }
  
  // Видаляємо технічні дані (SP cost, MP cost, level info)
  cleanDesc = cleanDesc
    .replace(/\s+lv\.\d+\s+/gi, ' ')
    .replace(/\d+\s+\d+\s+SP/gi, '')
    .replace(/MP:\s*\d+/gi, '')
    .replace(/\(\d+\s*\+\s*\d+\)/g, '')
    .replace(/\d+\.\d+\s*сек/gi, '')
    .replace(/\d+\s*сек/gi, '')
    .replace(/Power\s+\d+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Якщо опис занадто короткий або порожній, використовуємо назву скілу
  if (cleanDesc.length < 10) {
    cleanDesc = nameMatch ? `${nameMatch[1]}.` : 'Skill description.';
  }
  
  // Обмежуємо довжину
  if (cleanDesc.length > 200) {
    cleanDesc = cleanDesc.substring(0, 197) + '...';
  }
  
  // Замінюємо в файлі
  const newContent = content.replace(
    /description:\s*"[^"]+"/,
    `description: "${cleanDesc}"`
  );
  
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✓ Очищено ${file}`);
});

console.log(`\n✅ Очищено ${files.length} файлів!`);


