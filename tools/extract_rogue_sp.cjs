const fs = require('fs');

// Читаємо Rogue.txt
const txt = fs.readFileSync('tools/htmlскіли/Rogue.txt', 'utf8');
const lines = txt.split('\n');

// Мапа для зберігання SP cost по скілам та рівням
const spMap = new Map(); // key: "skillName:level", value: spCost

let currentSkill = null;
let currentLevel = null;

lines.forEach(line => {
  // Шукаємо назву скіла та рівень
  const skillMatch = line.match(/^([A-Z][a-zA-Z ]+)\t([A-Z][a-zA-Z ]+(?: lv\.?\s*(\d+))?)/);
  if (skillMatch) {
    currentSkill = skillMatch[1].trim();
    const levelMatch = skillMatch[3];
    currentLevel = levelMatch ? parseInt(levelMatch, 10) : 1;
  }
  
  // Шукаємо SP cost
  const spMatch = line.match(/(\d[\d ]+)\s*SP/);
  if (spMatch && currentSkill) {
    const sp = parseInt(spMatch[1].replace(/\s+/g, ''), 10);
    const key = `${currentSkill}:${currentLevel || 1}`;
    spMap.set(key, sp);
  }
});

// Читаємо tmp_rogue_skills.json
const skills = JSON.parse(fs.readFileSync('tmp_rogue_skills.json', 'utf8'));

// Оновлюємо SP cost
Object.values(skills).forEach(skill => {
  skill.levels.forEach(level => {
    const key = `${skill.name}:${level.level}`;
    const sp = spMap.get(key);
    if (sp) {
      level.spCost = sp;
    }
  });
});

// Зберігаємо оновлений JSON
fs.writeFileSync('tmp_rogue_skills.json', JSON.stringify(skills, null, 2));
console.log('Updated SP costs in tmp_rogue_skills.json');

