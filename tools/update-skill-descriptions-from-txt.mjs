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
let collectingEnglishDesc = false;
let englishDescLines = [];

// Маппінг назв скілів (як вони в файлі -> як вони в коді)
const skillNameMap = {
  'Wind Shackle': 'Wind Shackle',
  'Death Whisper': 'Death Whisper',
  'Dryad Root': 'Dryad Root',
  'Guidance': 'Guidance',
  'Mental Shield': 'Mental Shield',
  'Might': 'Might',
  'Recharge': 'Recharge',
  'Resist Wind': 'Resist Wind',
  'Fast HP Recovery': 'Fast HP Recovery',
  'Fast Mana Recovery': 'Fast Mana Recovery',
  'Concentration': 'Concentration',
  'Empower': 'Empower',
  'Focus': 'Focus',
  'Greater Heal': 'Greater Heal',
  'Greater Battle Heal': 'Greater Battle Heal',
  'Greater Group Heal': 'Greater Group Heal',
  'Greater Empower': 'Greater Empower',
  'Shield': 'Shield',
  'Quick Recovery': 'Quick Recovery',
  'Cure Poison': 'Cure Poison',
  'Wild Magic': 'Wild Magic',
  'Vampiric Rage': 'Vampiric Rage',
};

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Шукаємо назву скілу та рівень (формат: "Skill Name\tSkill Name lv.1" або "Skill Name lv.1")
  const skillMatch = line.match(/^([A-Z][a-zA-Z\s]+?)\t([A-Z][a-zA-Z\s]+?)\s+lv\.(\d+)$/) ||
                    line.match(/^([A-Z][a-zA-Z\s]+?)\s+lv\.(\d+)$/);
  
  if (skillMatch) {
    // Зберігаємо попередній опис, якщо був
    if (currentSkillName && currentDescription) {
      skillDescriptions.set(currentSkillName, currentDescription);
    }
    
    // Починаємо новий скіл
    let skillName = (skillMatch[1] || skillMatch[2] || '').trim();
    if (skillName.includes('\t')) {
      skillName = skillName.split('\t')[0].trim();
    }
    
    currentSkillName = skillName;
    currentDescription = null;
    englishDescLines = [];
    collectingEnglishDesc = false;
    continue;
  }
  
  // Шукаємо англійський опис після табуляції (формат: "\tEnglish description here.")
  // Англійські описи зазвичай йдуть після табуляції та перед російським описом
  if (line.includes('\t') && !trimmed.match(/^\d/) && !trimmed.includes('SP') && !trimmed.includes('MP')) {
    const parts = line.split('\t');
    if (parts.length > 1) {
      const afterTab = parts[parts.length - 1].trim();
      // Перевіряємо, чи це англійський опис (починається з великої, містить англійські слова, не містить кирилицю)
      if (afterTab.length > 15 && 
          afterTab.length < 300 &&
          afterTab.match(/^[A-Z]/) &&
          !afterTab.match(/[А-Яа-яЁё]/) &&
          afterTab.match(/[a-z]/) &&
          !afterTab.match(/^\d/)) {
        currentDescription = afterTab;
        collectingEnglishDesc = true;
        englishDescLines = [afterTab];
        continue;
      }
    }
  }
  
  // Якщо збираємо англійський опис, продовжуємо збирати до знаходження російського
  if (collectingEnglishDesc && currentSkillName) {
    // Якщо знайшли рядок з "Эффект" або кирилицею, це кінець англійського опису
    if (trimmed.includes('Эффект') || trimmed.match(/[А-Яа-яЁё]/)) {
      collectingEnglishDesc = false;
      if (englishDescLines.length > 0) {
        currentDescription = englishDescLines.join(' ').trim();
      }
    } else if (trimmed.length > 0 && 
               trimmed.match(/^[A-Za-z]/) && 
               !trimmed.match(/^\d/) &&
               !trimmed.includes('SP') &&
               !trimmed.includes('MP') &&
               !trimmed.match(/сек|мин/)) {
      // Продовжуємо збирати англійський опис
      englishDescLines.push(trimmed);
    }
  }
}

// Зберігаємо останній опис
if (currentSkillName && currentDescription) {
  skillDescriptions.set(currentSkillName, currentDescription);
}

console.log(`Знайдено ${skillDescriptions.size} описів скілів:\n`);
skillDescriptions.forEach((desc, name) => {
  console.log(`${name}: ${desc.substring(0, 80)}...`);
});

// Тепер оновлюємо файли скілів
const skillsDir = path.join(__dirname, '..', 'src', 'data', 'skills', 'classes', 'DarkMystic');
const elderDir = path.join(skillsDir, 'ShillienElder');
const oracleDir = path.join(skillsDir, 'ShillienOracle');

function updateSkillFile(dir, skillName, description) {
  // Шукаємо файл з назвою скілу
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

