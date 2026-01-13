import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо текстовий файл з UTF-8
const txtPath = path.join(__dirname, 'htmlскіли', 'Shillien Elder.txt');
const content = fs.readFileSync(txtPath, { encoding: 'utf-8' });

console.log(`Розмір файлу: ${content.length} символів\n`);

// Парсимо скіли
const skills = new Map();
const lines = content.split('\n');

let inActiveSkills = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Перевіряємо, чи це заголовок рівня
  if (line.match(/Shillien Elder Level \d+:/)) {
    continue;
  }
  
  // Перевіряємо, чи це розділ
  if (line.includes('Пасивні') || line.includes('Пассивные')) {
    inActiveSkills = false;
    continue;
  }
  if (line.includes('Активні') || line.includes('Активные')) {
    inActiveSkills = true;
    continue;
  }
  
  // Шукаємо назву скілу та рівень
  const skillNameMatch = line.match(/^([A-Z][a-zA-Z\s]+?)\s+lv\.(\d+)$/) || 
                        line.match(/^([A-Z][a-zA-Z\s]+?)\t([A-Z][a-zA-Z\s]+?)\s+lv\.(\d+)$/);
  
  if (skillNameMatch) {
    let skillName = (skillNameMatch[1] || skillNameMatch[2] || '').trim();
    if (skillName.includes('\t')) {
      skillName = skillName.split('\t')[0].trim();
    }
    const level = parseInt(skillNameMatch[skillNameMatch.length - 1]);
    
    if (!skills.has(skillName)) {
      skills.set(skillName, {
        name: skillName,
        category: inActiveSkills ? 'active' : 'passive',
        levels: []
      });
    }
    
    const skill = skills.get(skillName);
    
    const currentLevel = {
      level: level,
      spCost: 0,
      mpCost: 0,
      cooldown: 0,
      power: 0,
      description: '',
      descriptionRu: ''
    };
    
    // Читаємо наступні рядки
    let j = i + 1;
    const skillLines = [line];
    
    while (j < lines.length) {
      const nextLine = lines[j].trim();
      if (nextLine.match(/^[A-Z][a-zA-Z\s]+?\s+lv\.\d+$/) || 
          nextLine.match(/^[A-Z][a-zA-Z\s]+?\t[A-Z][a-zA-Z\s]+?\s+lv\.\d+$/) ||
          nextLine.match(/^Shillien Elder Level/)) {
        break;
      }
      skillLines.push(nextLine);
      j++;
    }
    
    const blockText = skillLines.join(' ');
    
    // SP cost
    const spMatch = blockText.match(/(?:^|\s)(\d+(?:\s+\d+)*)\s+SP/);
    if (spMatch) {
      const spValue = spMatch[1].replace(/\s/g, '');
      if (parseInt(spValue) > 100) {
        currentLevel.spCost = parseInt(spValue);
      }
    }
    
    // MP cost
    const mpMatch = blockText.match(/MP[:\s]+(\d+)/) || blockText.match(/(\d+)\s*\(\d+\s*\+\s*\d+\)/);
    if (mpMatch) {
      currentLevel.mpCost = parseInt(mpMatch[1]);
    }
    
    // Cooldown - шукаємо числа перед "сек" в рядках
    // Зазвичай cooldown більше 5 секунд
    for (const skillLine of skillLines) {
      const cdMatch = skillLine.match(/(\d+)\s*сек/);
      if (cdMatch) {
        const cdValue = parseInt(cdMatch[1]);
        if (cdValue >= 5 && cdValue > currentLevel.cooldown) {
          currentLevel.cooldown = cdValue;
        }
      }
    }
    
    // Power
    const powerMatch = blockText.match(/Power[:\s]+(\d+)/);
    if (powerMatch) {
      currentLevel.power = parseInt(powerMatch[1]);
    }
    
    // Опис англійською
    const descMatch = blockText.match(/([A-Z][^А-Яа-яЁё]{30,200})/);
    if (descMatch) {
      currentLevel.description = descMatch[1].trim().substring(0, 200);
    }
    
    // Опис російською
    const descRuMatch = blockText.match(/(Застосовує[^А-Яа-яЁё]*[А-Яа-яЁё\s,\.:;()\-]{30,500})/);
    if (descRuMatch) {
      currentLevel.descriptionRu = descRuMatch[1].trim().substring(0, 500);
    }
    
    const existingLevel = skill.levels.find(l => l.level === level);
    if (!existingLevel) {
      skill.levels.push(currentLevel);
    } else {
      if (currentLevel.spCost > 0) existingLevel.spCost = currentLevel.spCost;
      if (currentLevel.mpCost > 0) existingLevel.mpCost = currentLevel.mpCost;
      if (currentLevel.cooldown > 0) existingLevel.cooldown = currentLevel.cooldown;
      if (currentLevel.power > 0) existingLevel.power = currentLevel.power;
      if (currentLevel.description) existingLevel.description = currentLevel.description;
      if (currentLevel.descriptionRu) existingLevel.descriptionRu = currentLevel.descriptionRu;
    }
    
    i = j - 1;
  }
}

// Конвертуємо в масив та сортуємо
const finalSkills = Array.from(skills.values());
finalSkills.forEach(skill => {
  skill.levels.sort((a, b) => a.level - b.level);
});

console.log(`\nЗнайдено ${finalSkills.length} унікальних скілів:\n`);
finalSkills.forEach(skill => {
  console.log(`${skill.name} (${skill.category}): ${skill.levels.length} рівнів`);
  if (skill.levels.length > 0) {
    const firstLevel = skill.levels[0];
    console.log(`  Lv ${firstLevel.level}: SP ${firstLevel.spCost}, MP ${firstLevel.mpCost}, CD ${firstLevel.cooldown}s, Power ${firstLevel.power}`);
  }
});

// Зберігаємо результати
const outputPath = path.join(__dirname, 'shillien-elder-skills-ready.json');
fs.writeFileSync(outputPath, JSON.stringify(finalSkills, null, 2), 'utf-8');
console.log(`\nДані збережено в ${outputPath}`);


