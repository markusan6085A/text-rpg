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
const skills = [];
const lines = content.split('\n');

let currentSkill = null;
let currentLevel = null;
let inActiveSkills = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Перевіряємо, чи це заголовок рівня
  if (line.match(/Shillien Elder Level \d+:/)) {
    const levelMatch = line.match(/Level (\d+)/);
    if (levelMatch) {
      console.log(`Знайдено рівень: ${levelMatch[1]}`);
    }
    continue;
  }
  
  // Перевіряємо, чи це розділ "Пасивні скіли" або "Активні скіли"
  if (line.includes('Пасивні скіли') || line.includes('Пассивные умения')) {
    inActiveSkills = false;
    continue;
  }
  if (line.includes('Активні скіли') || line.includes('Активные умения')) {
    inActiveSkills = true;
    continue;
  }
  
  // Шукаємо назву скілу та рівень (формат: "Skill Name	Skill Name lv.X")
  const skillNameMatch = line.match(/^([A-Z][a-zA-Z\s]+)\t([A-Z][a-zA-Z\s]+)\s+lv\.(\d+)$/);
  if (skillNameMatch) {
    const skillName = skillNameMatch[1].trim();
    const level = parseInt(skillNameMatch[3]);
    
    // Якщо це новий скіл або новий рівень існуючого скілу
    if (!currentSkill || currentSkill.name !== skillName) {
      // Зберігаємо попередній скіл
      if (currentSkill) {
        skills.push(currentSkill);
      }
      
      // Створюємо новий скіл
      currentSkill = {
        name: skillName,
        levels: [],
        category: inActiveSkills ? 'active' : 'passive',
        description: '',
        descriptionRu: ''
      };
    }
    
    currentLevel = {
      level: level,
      spCost: 0,
      mpCost: 0,
      castTime: 0,
      cooldown: 0,
      power: 0,
      description: '',
      descriptionRu: ''
    };
    
    // Читаємо наступні рядки для цього рівня
    let j = i + 1;
    while (j < lines.length && !lines[j].trim().match(/^[A-Z][a-zA-Z\s]+\t[A-Z]/)) {
      const nextLine = lines[j].trim();
      
      // SP cost
      if (nextLine.match(/SP/)) {
        const spMatch = nextLine.match(/(\d+)\s+SP/);
        if (spMatch) {
          currentLevel.spCost = parseInt(spMatch[1].replace(/\s/g, ''));
        }
      }
      
      // MP cost (формат: "Потрібно MP: X (Y + Z)")
      if (nextLine.match(/Потрібно MP|MP:/)) {
        const mpMatch = nextLine.match(/(\d+)\s*\(/);
        if (mpMatch) {
          currentLevel.mpCost = parseInt(mpMatch[1]);
        }
      }
      
      // Cast time (формат: "Час: X сек.")
      if (nextLine.match(/Час:|Cast/)) {
        const castMatch = nextLine.match(/(\d+(?:\.\d+)?)\s*сек/);
        if (castMatch) {
          currentLevel.castTime = parseFloat(castMatch[1]);
        }
      }
      
      // Cooldown (формат: "Кулдаун: X сек.")
      if (nextLine.match(/Кулдаун|Cooldown/)) {
        const cdMatch = nextLine.match(/(\d+)\s*сек/);
        if (cdMatch) {
          currentLevel.cooldown = parseInt(cdMatch[1]);
        }
      }
      
      // Power (формат: "Power X")
      if (nextLine.match(/Power\s+(\d+)/)) {
        const powerMatch = nextLine.match(/Power\s+(\d+)/);
        if (powerMatch) {
          currentLevel.power = parseInt(powerMatch[1]);
        }
      }
      
      // Опис англійською (зазвичай після SP cost)
      if (nextLine.length > 20 && !nextLine.match(/\d/) && nextLine.match(/[A-Z]/)) {
        if (!currentLevel.description) {
          currentLevel.description = nextLine;
        }
      }
      
      // Опис російською (починається з "Застосовує" або "Наносить")
      if (nextLine.match(/Застосовує|Наносить|Відновлює/)) {
        currentLevel.descriptionRu = nextLine;
      }
      
      j++;
    }
    
    // Додаємо рівень до скілу
    currentSkill.levels.push(currentLevel);
    i = j - 1; // Пропускаємо оброблені рядки
  }
}

// Додаємо останній скіл
if (currentSkill) {
  skills.push(currentSkill);
}

// Групуємо скіли за назвою та об'єднуємо рівні
const groupedSkills = new Map();
skills.forEach(skill => {
  if (!groupedSkills.has(skill.name)) {
    groupedSkills.set(skill.name, {
      name: skill.name,
      category: skill.category,
      levels: []
    });
  }
  
  const grouped = groupedSkills.get(skill.name);
  skill.levels.forEach(level => {
    // Перевіряємо, чи рівень вже є
    const existing = grouped.levels.find(l => l.level === level.level);
    if (!existing) {
      grouped.levels.push(level);
    } else {
      // Оновлюємо дані, якщо вони кращі
      if (level.spCost > 0) existing.spCost = level.spCost;
      if (level.mpCost > 0) existing.mpCost = level.mpCost;
      if (level.castTime > 0) existing.castTime = level.castTime;
      if (level.cooldown > 0) existing.cooldown = level.cooldown;
      if (level.power > 0) existing.power = level.power;
      if (level.description) existing.description = level.description;
      if (level.descriptionRu) existing.descriptionRu = level.descriptionRu;
    }
  });
});

// Конвертуємо в масив та сортуємо
const finalSkills = Array.from(groupedSkills.values());
finalSkills.forEach(skill => {
  skill.levels.sort((a, b) => a.level - b.level);
});

console.log(`\nЗнайдено ${finalSkills.length} унікальних скілів:\n`);
finalSkills.forEach(skill => {
  console.log(`${skill.name} (${skill.category}): ${skill.levels.length} рівнів`);
  skill.levels.forEach(level => {
    console.log(`  Lv ${level.level}: SP ${level.spCost}, MP ${level.mpCost}, Cast ${level.castTime}s, CD ${level.cooldown}s`);
  });
});

// Зберігаємо результати
const outputPath = path.join(__dirname, 'shillien-elder-skills-parsed.json');
fs.writeFileSync(outputPath, JSON.stringify(finalSkills, null, 2), 'utf-8');
console.log(`\nДані збережено в ${outputPath}`);


