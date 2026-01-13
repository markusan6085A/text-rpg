import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо JSON з даними (з правильними requiredLevel)
const jsonPath = path.join(__dirname, 'shillien-elder-skills-with-hero-levels.json');
const skillsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log(`Генерую файли для ${skillsData.length} скілів з правильними requiredLevel...\n`);

// Маппінг назв скілів на category, target, scope
const skillCategoryMap = {
  'Anti Magic': { category: 'passive', target: 'self', scope: 'single' },
  'Boost Mana': { category: 'passive', target: 'self', scope: 'single' },
  'Fast Spell Casting': { category: 'passive', target: 'self', scope: 'single' },
  'Light Armor Mastery': { category: 'passive', target: 'self', scope: 'single' },
  'Robe Mastery': { category: 'passive', target: 'self', scope: 'single' },
  'Weapon Mastery': { category: 'passive', target: 'self', scope: 'single' },
  'Fast HP Recovery': { category: 'passive', target: 'self', scope: 'single' },
  'Fast Mana Recovery': { category: 'passive', target: 'self', scope: 'single' },
  'Quick Recovery': { category: 'passive', target: 'self', scope: 'single' },
  
  'Wind Shackle': { category: 'debuff', target: 'enemy', scope: 'single' },
  'Dryad Root': { category: 'debuff', target: 'enemy', scope: 'single' },
  
  'Death Whisper': { category: 'buff', target: 'self', scope: 'single' },
  'Guidance': { category: 'buff', target: 'self', scope: 'single' },
  'Mental Shield': { category: 'buff', target: 'self', scope: 'single' },
  'Might': { category: 'buff', target: 'self', scope: 'single' },
  'Resist Wind': { category: 'buff', target: 'self', scope: 'single' },
  'Concentration': { category: 'buff', target: 'self', scope: 'single' },
  'Empower': { category: 'buff', target: 'self', scope: 'single' },
  'Focus': { category: 'buff', target: 'self', scope: 'single' },
  'Shield': { category: 'buff', target: 'self', scope: 'single' },
  'Vampiric Rage': { category: 'buff', target: 'self', scope: 'single' },
  'Greater Empower': { category: 'buff', target: 'self', scope: 'single' },
  'Kiss of Eva': { category: 'buff', target: 'self', scope: 'single' },
  'Wild Magic': { category: 'buff', target: 'self', scope: 'single' },
  
  'Recharge': { category: 'heal', target: 'self', scope: 'single' },
  'Greater Heal': { category: 'heal', target: 'ally', scope: 'single' },
  'Greater Group Heal': { category: 'heal', target: 'ally', scope: 'party' },
  'Purify': { category: 'heal', target: 'ally', scope: 'single' },
  'Cure Poison': { category: 'heal', target: 'ally', scope: 'single' },
};

// Маппінг назв скілів на описи
const skillDescriptions = {
  'Anti Magic': 'Increases Magic Defense.',
  'Boost Mana': 'Increases maximum MP.',
  'Fast Spell Casting': 'Increases spell casting speed.',
  'Light Armor Mastery': 'Increases P. Def., Casting Spd., Atk. Spd. and MP regeneration when wearing light armor.',
  'Robe Mastery': 'Increases P. Def. when wearing a robe.',
  'Weapon Mastery': 'Increases P. Atk. and M. Atk.',
  'Fast HP Recovery': 'Increases HP recovery speed.',
  'Fast Mana Recovery': 'Increases MP Recovery Speed.',
  'Quick Recovery': 'Time between magic reuse shortens.',
  'Wind Shackle': 'Spirit of the Wind attacks, reducing target\'s Atk. Spd.',
  'Dryad Root': 'Instantly throws an enemy into a state of hold. While the effect lasts, the target cannot receive any additional hold attack.',
  'Death Whisper': 'Temporarily increases critical attack.',
  'Guidance': 'Temporarily increases Accuracy.',
  'Mental Shield': 'Temporarily increases resistance to Hold, Sleep, Fear, and Mental attacks.',
  'Might': 'Temporarily increases P. Atk.',
  'Resist Wind': 'Temporarily increases resistance to attack by wind.',
  'Concentration': 'Temporarily lowers the probability of magic being canceled due to damage.',
  'Empower': 'Temporarily increases M. Atk.',
  'Focus': 'Temporarily increases critical attack rate.',
  'Purify': 'Heals paralysis, cures poisoning and stops bleeding.',
  'Shield': 'Temporarily increases P. Def.',
  'Vampiric Rage': 'Partially restores HP using damage inflicted upon the enemy.',
  'Greater Empower': 'Temporarily increases M. Atk.',
  'Kiss of Eva': 'Temporarily increases lung capacity.',
  'Cure Poison': 'Cures poisoning.',
  'Wild Magic': 'Temporarily increases critical attack rate of magic attacks.',
  'Recharge': 'Restores one\'s MP.',
  'Greater Heal': 'Restores HP.',
  'Greater Group Heal': 'Restores party members\' HP.',
};

// Генеруємо файли
let skillIdCounter = 1201;
const generatedFiles = [];

skillsData.forEach((skill, index) => {
  const skillName = skill.name;
  const categoryInfo = skillCategoryMap[skillName] || { 
    category: skill.category === 'active' ? 'buff' : 'passive', 
    target: 'self', 
    scope: 'single' 
  };
  
  const skillId = skillIdCounter++;
  const skillFileName = `skill_${skillId}.ts`;
  const skillFilePath = path.join(__dirname, '..', 'src', 'data', 'skills', 'classes', 'DarkMystic', 'ShillienElder', skillFileName);
  
  // Формуємо levels з правильним requiredLevel
  const levelsCode = skill.levels.map(level => {
    return `  { level: ${level.level}, requiredLevel: ${level.requiredLevel}, spCost: ${level.spCost}, mpCost: ${level.mpCost}, power: ${level.power} }`;
  }).join(',\n');
  
  const description = skillDescriptions[skillName] || `${skillName}.`;
  
  // Визначаємо cooldown (беремо максимальний з рівнів)
  const maxCooldown = Math.max(...skill.levels.map(l => l.cooldown || 0));
  
  // Генеруємо код файлу
  const fileContent = `import { SkillDefinition } from "../../../types";

const levels = [
${levelsCode}
];

export const skill_${skillId}: SkillDefinition = {
  id: ${skillId}, // TODO: Оновити з правильним ID
  code: "DME_${skillId}",
  name: "${skillName}",
  description: "${description}",
  icon: "/skills/Skill${skillId}_0.jpg", // TODO: Оновити з правильною іконкою
  category: "${categoryInfo.category}",
  powerType: "none",
  target: "${categoryInfo.target}",
  scope: "${categoryInfo.scope}",
${maxCooldown > 0 ? `  cooldown: ${maxCooldown},` : ''}
  levels,
};
`;

  // Записуємо файл
  fs.writeFileSync(skillFilePath, fileContent, 'utf-8');
  generatedFiles.push({ skillId, skillName, fileName: skillFileName, levelsCount: skill.levels.length });
  
  console.log(`✓ Створено ${skillFileName} для "${skillName}" (ID: ${skillId}, ${skill.levels.length} рівнів)`);
});

console.log(`\n✅ Перегенеровано ${generatedFiles.length} файлів скілів з правильними requiredLevel!`);


