import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Маппінг англійських описів на російські переклади
const translations = {
  "Increases Magic Defense.": "Увеличивает магическую защиту.",
  "Increases spell casting speed.": "Увеличивает скорость каста заклинаний.",
  "Increases P. Def., Casting Spd., Atk. Spd. and MP regeneration when wearing light armor.": "Увеличивает физ. защиту, скорость каста, скорость атаки и регенерацию MP при ношении легкой брони.",
  "Increases P. Def. when wearing a robe.": "Увеличивает физ. защиту при ношении мантии.",
  "Increases P. Atk. and M. Atk.": "Увеличивает физ. атаку и маг. атаку.",
  "Increases HP recovery speed.": "Увеличивает скорость восстановления HP.",
  "Increases MP Recovery Speed.": "Увеличивает скорость восстановления MP.",
  "Time between magic reuse shortens.": "Сокращает время между повторным использованием магии.",
  "Spirit of the Wind attacks, reducing target's Atk. Spd.": "Атака духом ветра, снижает скорость атаки цели.",
  "Instantly throws an enemy into a state of hold. While the effect lasts, the target cannot receive any additional hold attack.": "Мгновенно вводит врага в состояние удержания. Пока действует эффект, цель не может получить дополнительную атаку удержания.",
  "Temporarily increases critical attack.": "Временно увеличивает критическую атаку.",
  "Temporarily increases Accuracy.": "Временно увеличивает точность.",
  "Temporarily increases resistance to Hold, Sleep, Fear, and Mental attacks.": "Временно увеличивает сопротивление к удержанию, сну, страху и ментальным атакам.",
  "Temporarily increases P. Atk.": "Временно увеличивает физ. атаку.",
  "Temporarily increases resistance to attack by wind.": "Временно увеличивает сопротивление к атакам ветром.",
  "Temporarily lowers the probability of magic being canceled due to damage.": "Временно снижает вероятность отмены магии из-за урона.",
  "Temporarily increases M. Atk.": "Временно увеличивает маг. атаку.",
  "Temporarily increases critical attack rate.": "Временно увеличивает шанс критической атаки.",
  "Heals paralysis, cures poisoning and stops bleeding.": "Лечит паралич, излечивает отравление и останавливает кровотечение.",
  "Temporarily increases P. Def.": "Временно увеличивает физ. защиту.",
  "Partially restores HP using damage inflicted upon the enemy.": "Частично восстанавливает HP за счет урона, нанесенного врагу.",
  "Temporarily increases lung capacity.": "Временно увеличивает объем легких.",
  "Cures poisoning.": "Излечивает отравление.",
  "Temporarily increases critical attack rate of magic attacks.": "Временно увеличивает шанс критической атаки магических атак.",
  "Restores one's MP.": "Восстанавливает MP.",
  "Restores HP.": "Восстанавливает HP.",
  "Restores party members' HP.": "Восстанавливает HP членов группы.",
  "Quickly recovers HP. Dark Elf Oracle progression (20-35).": "Быстро восстанавливает HP. Прогрессия Темного Эльфа Оракула (20-35).",
  "Recovers HP. Dark Elf Oracle progression (20-35).": "Восстанавливает HP. Прогрессия Темного Эльфа Оракула (20-35).",
  "Recovers party member's HP. Dark Elf Oracle progression (20-35).": "Восстанавливает HP членов группы. Прогрессия Темного Эльфа Оракула (20-35).",
  "Increases maximum MP.": "Увеличивает максимальный MP.",
  "Doubles the spell casting speed when wearing a robe jacket and robe pants.": "Удваивает скорость каста заклинаний при ношении мантии и штанов мантии.",
  "Increases MP recovery speed when wearing a robe jacket and robe pants.": "Увеличивает скорость восстановления MP при ношении мантии и штанов мантии.",
};

const skillsDir = path.join(__dirname, '..', 'src', 'data', 'skills', 'classes', 'DarkMystic');

// Знаходимо всі файли скілів
const skillFiles = await glob('**/*.ts', {
  cwd: skillsDir,
  ignore: ['**/index.ts', '**/utils.ts', '**/skills.ts']
});

console.log(`Знайдено ${skillFiles.length} файлів скілів\n`);

let updatedCount = 0;

for (const file of skillFiles) {
  const filePath = path.join(skillsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Знаходимо рядок з description
  const descMatch = content.match(/description:\s*"([^"]+)"/);
  if (!descMatch) continue;
  
  const fullDescription = descMatch[1];
  
  // Перевіряємо, чи вже є російський переклад (є \n\n)
  if (fullDescription.includes('\n\n')) {
    continue; // Вже є переклад
  }
  
  // Шукаємо переклад для цього опису
  const russianTranslation = translations[fullDescription];
  
  if (russianTranslation) {
    // Додаємо російський переклад (екрануємо переноси рядків)
    const newDescription = `${fullDescription}\\n\\n${russianTranslation}`;
    content = content.replace(
      /description:\s*"([^"]+)"/,
      `description: "${newDescription.replace(/"/g, '\\"')}"`
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Оновлено: ${file}`);
      console.log(`  "${fullDescription.substring(0, 50)}..." -> додано російський переклад\n`);
      updatedCount++;
    }
  }
}

console.log(`\nГотово! Оновлено ${updatedCount} файлів з ${skillFiles.length} перевірених.`);

