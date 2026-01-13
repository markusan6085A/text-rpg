import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо текстовий файл
const txtPath = path.join(__dirname, 'htmlскіли', 'Shillien Elder.txt');
const content = fs.readFileSync(txtPath, { encoding: 'utf-8' });

const lines = content.split('\n');
const skillDescriptions = new Map(); // Map<skillName, description>

let currentSkillName = null;
let currentDescription = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Шукаємо назву скілу та рівень
  const skillMatch = line.match(/^([A-Z][a-zA-Z\s]+?)\t([A-Z][a-zA-Z\s]+?)\s+lv\.(\d+)$/) ||
                    line.match(/^([A-Z][a-zA-Z\s]+?)\s+lv\.(\d+)$/);
  
  if (skillMatch) {
    // Зберігаємо попередній опис, якщо був
    if (currentSkillName && currentDescription) {
      // Зберігаємо тільки якщо ще не збережено або новий опис довший
      if (!skillDescriptions.has(currentSkillName) || 
          skillDescriptions.get(currentSkillName).length < currentDescription.length) {
        skillDescriptions.set(currentSkillName, currentDescription);
      }
    }
    
    // Починаємо новий скіл
    let skillName = (skillMatch[1] || skillMatch[2] || '').trim();
    if (skillName.includes('\t')) {
      skillName = skillName.split('\t')[0].trim();
    }
    
    currentSkillName = skillName;
    currentDescription = null;
    continue;
  }
  
  // Шукаємо англійський опис - він зазвичай йде після табуляції та містить англійські слова
  // Формат: "\tEnglish description here."
  if (line.includes('\t') && currentSkillName) {
    const parts = line.split('\t');
    if (parts.length > 1) {
      const afterTab = parts[parts.length - 1].trim();
      
      // Перевіряємо, чи це англійський опис
      // Має бути: довжина 15-300 символів, починається з великої, містить англійські літери, не містить кирилицю
      if (afterTab.length >= 15 && 
          afterTab.length <= 300 &&
          afterTab.match(/^[A-Z]/) &&
          afterTab.match(/[a-z]/) &&
          !afterTab.match(/[А-Яа-яЁё]/) &&
          !afterTab.match(/^\d/) &&
          !afterTab.includes('SP') &&
          !afterTab.includes('MP') &&
          !afterTab.match(/сек|мин/) &&
          (afterTab.includes('.') || afterTab.includes('Effect') || afterTab.includes('Power'))) {
        
        // Це англійський опис
        if (!currentDescription || currentDescription.length < afterTab.length) {
          currentDescription = afterTab;
        }
      }
    }
  }
}

// Зберігаємо останній опис
if (currentSkillName && currentDescription) {
  if (!skillDescriptions.has(currentSkillName) || 
      skillDescriptions.get(currentSkillName).length < currentDescription.length) {
    skillDescriptions.set(currentSkillName, currentDescription);
  }
}

console.log(`Знайдено ${skillDescriptions.size} описів скілів:\n`);
skillDescriptions.forEach((desc, name) => {
  console.log(`${name}: ${desc.substring(0, 100)}...`);
});

// Тепер оновлюємо файли скілів
const skillsDir = path.join(__dirname, '..', 'src', 'data', 'skills', 'classes', 'DarkMystic');
const elderDir = path.join(skillsDir, 'ShillienElder');
const oracleDir = path.join(skillsDir, 'ShillienOracle');

function updateSkillFile(dir, skillName, description) {
  const files = fs.readdirSync(dir).filter(f => f.startsWith('skill_') && f.endsWith('.ts'));
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Перевіряємо, чи це правильний файл (за назвою скілу)
    const nameMatch = content.match(/name:\s*["']([^"']+)["']/);
    if (nameMatch && nameMatch[1] === skillName) {
      // Оновлюємо опис
      const newContent = content.replace(
        /description:\s*["']([^"']+)["']/,
        `description: "${description.replace(/"/g, '\\"')}"`
      );
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✓ Оновлено: ${file} (${skillName})`);
      return true;
    }
  }
  
  return false;
}

console.log(`\n\nОновлюю файли скілів...\n`);

let updated = 0;
skillDescriptions.forEach((description, skillName) => {
  // Спробуємо знайти в ShillienElder
  if (updateSkillFile(elderDir, skillName, description)) {
    updated++;
  } else if (updateSkillFile(oracleDir, skillName, description)) {
    updated++;
  } else {
    console.log(`⚠ Не знайдено файл для: ${skillName}`);
  }
});

console.log(`\nГотово! Оновлено ${updated} файлів з ${skillDescriptions.size} описів.`);

