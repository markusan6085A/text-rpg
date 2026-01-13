const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'htmlскіли', 'Spellsinger.txt');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

const skills = new Map();
let currentHeroLevel = null;
let inActiveSkills = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Визначаємо рівень героя
  const heroLevelMatch = line.match(/^Spellsinger Level (\d+):/);
  if (heroLevelMatch) {
    currentHeroLevel = parseInt(heroLevelMatch[1]);
    continue;
  }
  
  // Визначаємо, чи це активні скіли
  if (line.includes('Активні скіли') || line.includes('Активные скілы')) {
    inActiveSkills = true;
    continue;
  }
  
  // Визначаємо, чи це пасивні скіли
  if (line.includes('Пасивні скіли') || line.includes('Пассивные скілы')) {
    inActiveSkills = false;
    continue;
  }
  
  // Шукаємо назву скіла та рівень
  const skillNameMatch = line.match(/^([A-Z][a-zA-Z\s:]+?)\t([A-Z][a-zA-Z\s]+?)\s+lv\.(\d+)$/);
  
  if (skillNameMatch && currentHeroLevel) {
    let skillName = (skillNameMatch[1] || skillNameMatch[2] || '').trim();
    if (skillName.includes('\t')) {
      skillName = skillName.split('\t')[0].trim();
    }
    const skillLevel = parseInt(skillNameMatch[skillNameMatch.length - 1]);
    
    if (!skills.has(skillName)) {
      skills.set(skillName, {
        name: skillName,
        category: inActiveSkills ? 'active' : 'passive',
        levels: []
      });
    }
    
    const skill = skills.get(skillName);
    
    const currentLevel = {
      level: skillLevel,
      requiredLevel: currentHeroLevel,
      spCost: 0,
      mpCost: 0,
      castTime: 0,
      cooldown: 0,
      power: 0,
    };
    
    // Читаємо наступні рядки
    let j = i + 1;
    const skillLines = [line];
    
    while (j < lines.length) {
      const nextLine = lines[j].trim();
      if (nextLine.match(/^[A-Z][a-zA-Z\s]+?\s+lv\.\d+$/) || 
          nextLine.match(/^[A-Z][a-zA-Z\s]+?\t[A-Z][a-zA-Z\s]+?\s+lv\.\d+$/) ||
          nextLine.match(/^Spellsinger Level/)) {
        break;
      }
      skillLines.push(nextLine);
      j++;
    }
    
    const blockText = skillLines.join(' ');
    
    // SP cost
    const spMatch = blockText.match(/(\d+(?:\s+\d+)*)\s+SP/);
    if (spMatch) {
      currentLevel.spCost = parseInt(spMatch[1].replace(/\s/g, ''));
    }
    
    // MP cost
    const mpMatch = blockText.match(/MP[:\s]+(\d+)/);
    if (mpMatch) {
      currentLevel.mpCost = parseInt(mpMatch[1]);
    }
    
    // Cast time
    const castMatch = blockText.match(/Каст[:\s]+(\d+(?:\.\d+)?)\s*с/);
    if (castMatch) {
      currentLevel.castTime = parseFloat(castMatch[1]);
    }
    
    // Cooldown
    const cdMatch = blockText.match(/КД[:\s]+(\d+(?:\.\d+)?)\s*с/);
    if (cdMatch) {
      currentLevel.cooldown = parseFloat(cdMatch[1]);
    }
    
    // Power
    const powerMatch = blockText.match(/Power\s+(\d+(?:\.\d+)?)/);
    if (powerMatch) {
      currentLevel.power = parseFloat(powerMatch[1]);
    }
    
    skill.levels.push(currentLevel);
  }
}

// Виводимо результат
console.log(JSON.stringify(Array.from(skills.values()), null, 2));

