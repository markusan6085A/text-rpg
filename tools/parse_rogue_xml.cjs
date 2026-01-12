const fs = require('fs');
const path = require('path');

// Список ID скілів Rogue з XML
const rogueSkillIds = [
  4,    // Dash
  16,   // Mortal Blow
  27,   // Unlock
  56,   // Power Shot
  96,   // Bleed
  99,   // Rapid Shot
  111,  // Ultimate Evasion
  113,  // Long Shot
  137,  // Critical Chance
  148,  // Vital Force
  168,  // Boost Attack Speed
  169,  // Quick Step
  171,  // Esprit
  193,  // Critical Power
  195,  // Boost Breath
  198,  // Boost Evasion
  208,  // Bow Mastery
  209,  // Dagger Mastery
  225,  // Acrobatic Move
  227,  // Light Armor Mastery (для Rogue)
  256,  // Accuracy
  312,  // Vicious Stance
];

// Функція для витягування значень з таблиці
function extractTableValues(text, tableName) {
  const regex = new RegExp(`<table name="${tableName.replace('#', '\\#')}">\\s*([^<]+)</table>`, 's');
  const match = text.match(regex);
  if (!match) return [];
  return match[1].trim().split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
}

// Функція для витягування значення з set
function extractSetValue(text, setName) {
  const regex = new RegExp(`<set name="${setName}" val="([^"]+)"`, 'i');
  const match = text.match(regex);
  return match ? match[1] : null;
}

// Функція для парсингу скіла
function parseSkill(skillId) {
  // Визначаємо файл за ID
  const fileNum = Math.floor(skillId / 100) * 100;
  const fileName = `${String(fileNum).padStart(4, '0')}-${String(fileNum + 99).padStart(4, '0')}.xml`;
  const filePath = path.join('tools', 'htmlскіли', 'скілил2', fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return null;
  }

  const xml = fs.readFileSync(filePath, 'utf8');
  
  // Знаходимо скіл за ID
  const skillRegex = new RegExp(`<skill id="${skillId}"[^>]*>([\\s\\S]*?)</skill>`, 'i');
  const skillMatch = xml.match(skillRegex);
  
  if (!skillMatch) {
    console.log(`Skill ${skillId} not found in ${fileName}`);
    return null;
  }

  const skillText = skillMatch[0];
  
  // Витягуємо назву та кількість рівнів
  const nameMatch = skillText.match(/name="([^"]+)"/);
  const levelsMatch = skillText.match(/levels="(\d+)"/);
  const name = nameMatch ? nameMatch[1] : 'Unknown';
  const levels = levelsMatch ? parseInt(levelsMatch[1]) : 1;

  // Витягуємо таблиці
  const mpConsume = extractTableValues(skillText, '#mpConsume');
  const mpConsumeInit = extractTableValues(skillText, '#mpConsume_Init');
  const power = extractTableValues(skillText, '#power');
  const magicLvl = extractTableValues(skillText, '#magicLvl');
  
  // Для пасивних скілів витягуємо значення з таблиць статів
  const pAtk = extractTableValues(skillText, '#pAtk');
  const pDef = extractTableValues(skillText, '#pDef');
  const rEvas = extractTableValues(skillText, '#rEvas');
  const mDef = extractTableValues(skillText, '#mDef');
  const maxHp = extractTableValues(skillText, '#hp');
  const maxMp = extractTableValues(skillText, '#mp');
  const regHp = extractTableValues(skillText, '#hp');
  const regMp = extractTableValues(skillText, '#regMp');
  const rate = extractTableValues(skillText, '#rate');
  const crit = extractTableValues(skillText, '#crit');
  const critPower = extractTableValues(skillText, '#critPower');
  const runSpd = extractTableValues(skillText, '#spd');
  const breath = extractTableValues(skillText, '#breath');
  
  // Визначаємо, яке значення використовувати для power
  let powerValues = power;
  if (powerValues.length === 0) {
    // Для пасивних скілів використовуємо значення з таблиць статів
    if (pAtk.length > 0) powerValues = pAtk;
    else if (pDef.length > 0) powerValues = pDef;
    else if (rEvas.length > 0) powerValues = rEvas;
    else if (mDef.length > 0) powerValues = mDef;
    else if (maxHp.length > 0) powerValues = maxHp;
    else if (maxMp.length > 0) powerValues = maxMp;
    else if (regHp.length > 0) powerValues = regHp;
    else if (regMp.length > 0) powerValues = regMp;
    else if (rate.length > 0) powerValues = rate;
    else if (crit.length > 0) powerValues = crit;
    else if (critPower.length > 0) powerValues = critPower;
    else if (runSpd.length > 0) powerValues = runSpd;
    else if (breath.length > 0) powerValues = breath;
  }
  
  // Витягуємо параметри
  const operateType = extractSetValue(skillText, 'operateType') || 'OP_ACTIVE';
  const skillType = extractSetValue(skillText, 'skillType') || 'PDAM';
  const target = extractSetValue(skillText, 'target') || 'TARGET_ONE';
  const reuseDelay = extractSetValue(skillText, 'reuseDelay');
  const hitTime = extractSetValue(skillText, 'hitTime');
  
  // Парсимо рівні
  // Для Rogue (1-ша професія, 20-40 лвл) має бути максимум 10 рівнів
  // Використовуємо magicLvl з XML, якщо він є, інакше формулу: requiredLevel = 20 + (level - 1) * 2.22 (округлено)
  const maxLevels = 10; // Для 1-ї професії максимум 10 рівнів
  const skillLevels = [];
  
  for (let i = 0; i < levels; i++) {
    const level = i + 1;
    
    // Якщо є magicLvl в XML, використовуємо його (це рівень героя для цього рівня скіла)
    let reqLvl;
    if (magicLvl && magicLvl.length > i) {
      reqLvl = magicLvl[i];
    } else {
      // Формула для 10 рівнів від 20 до 40: 20, 22, 24, 26, 28, 30, 32, 34, 36, 40
      if (level === 10) {
        reqLvl = 40;
      } else {
        reqLvl = 20 + (level - 1) * 2;
      }
    }
    
    // Обмежуємо requiredLevel до 40 для Rogue - пропускаємо рівні з requiredLevel > 40
    if (reqLvl > 40) {
      continue;
    }
    
    // Обмежуємо кількість рівнів до 10
    if (skillLevels.length >= maxLevels) {
      break;
    }
    
    const mp = (mpConsumeInit?.[i] || 0) + (mpConsume?.[i] || 0);
    const pow = powerValues?.[i] || 0;
    
    skillLevels.push({
      level: skillLevels.length + 1, // Перенумеровуємо рівні
      requiredLevel: reqLvl,
      spCost: 0, // TODO: витягти з Rogue.txt
      mpCost: Math.round(mp),
      power: pow, // Не округлюємо для пасивних скілів, щоб зберегти десяткові значення
    });
  }

  // Визначаємо категорію
  const category = operateType === 'OP_PASSIVE' ? 'passive' : 
                   skillType === 'BUFF' ? 'buff' :
                   skillType === 'PDAM' ? 'physical_attack' : 'magic_attack';
  
  const powerType = power.length > 0 && power[0] > 0 ? 'damage' : 'none';
  const targetMapped = target === 'TARGET_SELF' ? 'self' : 
                       target === 'TARGET_ONE' ? 'enemy' : 'ally';
  const scope = target === 'TARGET_MULTIFACE' ? 'area' : 'single';
  const castTime = hitTime ? parseFloat(hitTime) / 1000 : 0;
  const cooldown = reuseDelay ? parseFloat(reuseDelay) / 1000 : 0;

  return {
    id: skillId,
    name,
    levels: skillLevels,
    category,
    powerType,
    target: targetMapped,
    scope,
    castTime,
    cooldown,
  };
}

// Головна функція
function main() {
  const skills = {};
  
  for (const skillId of rogueSkillIds) {
    try {
      const skill = parseSkill(skillId);
      if (skill) {
        skills[skillId] = skill;
      }
    } catch (err) {
      console.error(`Error parsing skill ${skillId}:`, err.message);
    }
  }
  
  // Зберігаємо в JSON
  fs.writeFileSync('tmp_rogue_skills.json', JSON.stringify(skills, null, 2));
  console.log(`Parsed ${Object.keys(skills).length} skills`);
  console.log('Saved to tmp_rogue_skills.json');
}

main();
