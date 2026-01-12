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
  // Формат: "Skill Name	Skill Name lv.X" або "Skill Name lv.X"
  const skillNameMatch = line.match(/^([A-Z][a-zA-Z\s]+?)\s+lv\.(\d+)$/) || 
                        line.match(/^([A-Z][a-zA-Z\s]+?)\t([A-Z][a-zA-Z\s]+?)\s+lv\.(\d+)$/);
  
  if (skillNameMatch) {
    // Отримуємо назву (перша частина або друга, якщо є табуляція)
    let skillName = (skillNameMatch[1] || skillNameMatch[2] || '').trim();
    // Якщо назва містить табуляцію, беремо першу частину
    if (skillName.includes('\t')) {
      skillName = skillName.split('\t')[0].trim();
    }
    const level = parseInt(skillNameMatch[skillNameMatch.length - 1]);
    
    // Створюємо або отримуємо скіл
    if (!skills.has(skillName)) {
      skills.set(skillName, {
        name: skillName,
        category: inActiveSkills ? 'active' : 'passive',
        levels: []
      });
    }
    
    const skill = skills.get(skillName);
    
    // Створюємо новий рівень
    const currentLevel = {
      level: level,
      spCost: 0,
      mpCost: 0,
      castTime: 0,
      cooldown: 0,
      power: 0,
      description: '',
      descriptionRu: ''
    };
    
    // Читаємо наступні рядки для цього рівня (до наступного скілу або до кінця)
    let j = i + 1;
    const skillLines = [line]; // Починаємо з поточного рядка
    
    while (j < lines.length) {
      const nextLine = lines[j].trim();
      
      // Якщо знайшли наступний скіл, зупиняємося
      if (nextLine.match(/^[A-Z][a-zA-Z\s]+?\s+lv\.\d+$/) || 
          nextLine.match(/^[A-Z][a-zA-Z\s]+?\t[A-Z][a-zA-Z\s]+?\s+lv\.\d+$/) ||
          nextLine.match(/^Shillien Elder Level/)) {
        break;
      }
      
      skillLines.push(nextLine);
      j++;
    }
    
    // Парсимо дані з рядків
    const blockText = skillLines.join(' ');
    
    // SP cost (формат: "13 000 SP" або "13000 SP" або "1 000 000 SP")
    // Шукаємо після назви скілу, але не включаючи рівень
    const spMatch = blockText.match(/(?:^|\s)(\d+(?:\s+\d+)*)\s+SP/);
    if (spMatch) {
      const spValue = spMatch[1].replace(/\s/g, '');
      // Перевіряємо, що це не рівень скілу (рівні зазвичай < 50)
      if (parseInt(spValue) > 100) {
        currentLevel.spCost = parseInt(spValue);
      }
    }
    
    // MP cost (формат: "Потрібно MP: 35 (7 + 28)" або "MP: 35" або просто "35 (7 + 28)")
    const mpMatch = blockText.match(/MP[:\s]+(\d+)/) || blockText.match(/(\d+)\s*\(\d+\s*\+\s*\d+\)/);
    if (mpMatch) {
      currentLevel.mpCost = parseInt(mpMatch[1]);
    }
    
    // Cast time та Cooldown - шукаємо числа перед "сек" в окремих рядках
    // Формат: "Час: 1.5 сек." або "Кулдаун: 8 сек."
    for (const skillLine of skillLines) {
      // Cast time (зазвичай менше 10)
      const castMatch = skillLine.match(/(\d+(?:\.\d+)?)\s*сек/);
      if (castMatch) {
        const castValue = parseFloat(castMatch[1]);
        if (castValue > 0 && castValue < 10 && currentLevel.castTime === 0) {
          currentLevel.castTime = castValue;
        }
      }
      
      // Cooldown (зазвичай більше за cast time)
      const cdMatch = skillLine.match(/(\d+)\s*сек/);
      if (cdMatch) {
        const cdValue = parseInt(cdMatch[1]);
        if (cdValue > currentLevel.castTime && cdValue > 0) {
          currentLevel.cooldown = cdValue;
        }
      }
    }
    
    // Power (формат: "Power 66" або "Power: 66")
    const powerMatch = blockText.match(/Power[:\s]+(\d+)/);
    if (powerMatch) {
      currentLevel.power = parseInt(powerMatch[1]);
    }
    
    // Опис англійською (довгий текст англійською, без кирилиці)
    const descMatch = blockText.match(/([A-Z][^А-Яа-яЁё]{30,200})/);
    if (descMatch) {
      currentLevel.description = descMatch[1].trim().substring(0, 200);
    }
    
    // Опис російською (починається з "Застосовує", "Наносить", "Відновлює")
    const descRuMatch = blockText.match(/(Застосовує[^А-Яа-яЁё]*[А-Яа-яЁё\s,\.:;()\-]{30,500})/);
    if (descRuMatch) {
      currentLevel.descriptionRu = descRuMatch[1].trim().substring(0, 500);
    }
    
    // Додаємо рівень до скілу (якщо такого рівня ще немає)
    const existingLevel = skill.levels.find(l => l.level === level);
    if (!existingLevel) {
      skill.levels.push(currentLevel);
    } else {
      // Оновлюємо дані
      if (currentLevel.spCost > 0) existingLevel.spCost = currentLevel.spCost;
      if (currentLevel.mpCost > 0) existingLevel.mpCost = currentLevel.mpCost;
      if (currentLevel.castTime > 0) existingLevel.castTime = currentLevel.castTime;
      if (currentLevel.cooldown > 0) existingLevel.cooldown = currentLevel.cooldown;
      if (currentLevel.power > 0) existingLevel.power = currentLevel.power;
      if (currentLevel.description) existingLevel.description = currentLevel.description;
      if (currentLevel.descriptionRu) existingLevel.descriptionRu = currentLevel.descriptionRu;
    }
    
    i = j - 1; // Пропускаємо оброблені рядки
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
    console.log(`  Lv ${firstLevel.level}: SP ${firstLevel.spCost}, MP ${firstLevel.mpCost}, Cast ${firstLevel.castTime}s, CD ${firstLevel.cooldown}s, Power ${firstLevel.power}`);
  }
});

// Зберігаємо результати
const outputPath = path.join(__dirname, 'shillien-elder-skills-complete.json');
fs.writeFileSync(outputPath, JSON.stringify(finalSkills, null, 2), 'utf-8');
console.log(`\nДані збережено в ${outputPath}`);

// Показуємо приклад активного скілу з cast time
const activeSkill = finalSkills.find(s => s.category === 'active' && s.levels.length > 0 && s.levels[0].castTime > 0);
if (activeSkill) {
  console.log(`\nПриклад активного скілу з cast time:\n${JSON.stringify(activeSkill.levels[0], null, 2)}`);
} else {
  // Показуємо будь-який активний скіл
  const anyActive = finalSkills.find(s => s.category === 'active' && s.levels.length > 0);
  if (anyActive) {
    console.log(`\nПриклад активного скілу:\n${JSON.stringify(anyActive.levels[0], null, 2)}`);
  }
}
