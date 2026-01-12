import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skillsDir = path.join(__dirname, '..', 'src', 'data', 'skills', 'classes', 'DarkMystic', 'ShillienElder');
const files = fs.readdirSync(skillsDir).filter(f => f.startsWith('skill_') && f.endsWith('.ts'));

console.log(`Очищаю описи в ${files.length} файлах скілів...\n`);

// Маппінг назв скілів на короткі описи
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

files.forEach(file => {
  const filePath = path.join(skillsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Отримуємо назву скілу
  const nameMatch = content.match(/name:\s*"([^"]+)"/);
  if (!nameMatch) return;
  
  const skillName = nameMatch[1];
  
  // Використовуємо готовий опис або створюємо простий
  let cleanDesc = skillDescriptions[skillName] || `${skillName}.`;
  
  // Замінюємо в файлі
  const newContent = content.replace(
    /description:\s*"[^"]+"/,
    `description: "${cleanDesc}"`
  );
  
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✓ Очищено ${file} - "${skillName}"`);
});

console.log(`\n✅ Очищено ${files.length} файлів!`);


