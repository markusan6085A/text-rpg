import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо JSON з даними
const jsonPath = path.join(__dirname, 'shillien-elder-skills-ready.json');
const skillsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log(`Генерую файли для ${skillsData.length} скілів...\n`);

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

// Генеруємо файли
let skillIdCounter = 1201; // Починаємо з 1201
const generatedFiles = [];

skillsData.forEach((skill, index) => {
  const skillName = skill.name;
  const categoryInfo = skillCategoryMap[skillName] || { 
    category: skill.category === 'active' ? 'buff' : 'passive', 
    target: 'self', 
    scope: 'single' 
  };
  
  // Генеруємо ID (тимчасовий, користувач сам додасть правильні)
  const skillId = skillIdCounter++;
  const skillFileName = `skill_${skillId}.ts`;
  const skillFilePath = path.join(__dirname, '..', 'src', 'data', 'skills', 'classes', 'DarkMystic', 'ShillienElder', skillFileName);
  
  // Формуємо levels
  const levelsCode = skill.levels.map(level => {
    return `  { level: ${level.level}, spCost: ${level.spCost}, mpCost: ${level.mpCost}, power: ${level.power} }`;
  }).join(',\n');
  
  // Отримуємо опис (англійський або російський)
  const description = skill.levels[0]?.description || skill.levels[0]?.descriptionRu || skillName;
  const cleanDescription = description.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200);
  
  // Визначаємо cooldown (беремо максимальний з рівнів)
  const maxCooldown = Math.max(...skill.levels.map(l => l.cooldown || 0));
  
  // Генеруємо код файлу
  const fileContent = `import { SkillDefinition } from "../../../types";
import { heroRequiredLevel } from "./utils";

const levels = [
${levelsCode}
].map((entry) => ({
  level: entry.level,
  requiredLevel: heroRequiredLevel(entry.level),
  spCost: entry.spCost,
  mpCost: entry.mpCost,
  power: entry.power,
}));

export const skill_${skillId}: SkillDefinition = {
  id: ${skillId}, // TODO: Оновити з правильним ID
  code: "DME_${skillId}",
  name: "${skillName}",
  description: "${cleanDescription}",
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
  generatedFiles.push({ skillId, skillName, fileName: skillFileName });
  
  console.log(`✓ Створено ${skillFileName} для "${skillName}" (ID: ${skillId}, ${skill.levels.length} рівнів)`);
});

console.log(`\n✅ Створено ${generatedFiles.length} файлів скілів!`);
console.log(`\nНаступні кроки:`);
console.log(`1. Оновити ID скілів в файлах (зараз тимчасові: ${skillIdCounter - skillsData.length}-${skillIdCounter - 1})`);
console.log(`2. Оновити іконки в файлах (зараз тимчасові)`);
console.log(`3. Додати експорти в index.ts`);


