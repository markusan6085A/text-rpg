import fs from "fs";
import path from "path";

const dir = path.join("src", "data", "skills", "classes", "Human Mystic", "Prophet");
const data = JSON.parse(fs.readFileSync("tmp_prophet_skills.json", "utf8"));

const translate = {
  "Increases M. Def.": "Повышает магическую защиту.",
  "Time between magic reuse shortens.": "Уменьшает время отката магических умений.",
  "Increases one's maximum HP.": "Увеличивает максимальный запас HP.",
  "Increases HP recovery speed.": "Ускоряет восстановление HP.",
  "Increases maximum MP.": "Увеличивает максимальный запас MP.",
  "Spell casting speed increases.": "Увеличивает скорость чтения заклинаний.",
  "Increases MP Recovery Speed.": "Ускоряет восстановление MP.",
  "Increases P. Def. when wearing a robe.": "Повышает физическую защиту в одежде типа Robe.",
  "Increases P. Def., Casting Spd., Atk. Spd. and MP regeneration when wearing light armor.":
    "Повышает физическую защиту, скорость каста, скорость атаки и регенерацию MP в лёгких доспехах.",
  "Increases P. Atk. and M. Atk.": "Повышает физическую и магическую атаку.",
  "Increases P. Def., Casting Spd., and Atk. Spd. when wearing heavy armor.":
    "Повышает физическую защиту, скорость каста и атаку в тяжёлых доспехах.",
  "Temporarily increases resistance to bleeding. Effect 1.": "Временно повышает сопротивление кровотечению. Эффект 1.",
  "Temporarily increases resistance to poison. Effect 1.": "Временно повышает сопротивление яду. Эффект 1.",
  "Temporarily increases resistance to Hold, Sleep, Fear, and Mental attacks. Enchant Time: the duration of one's skill usage is increased. Effect 2.":
    "Временно повышает сопротивление удержанию, сну, страху и ментальным атакам. Эффект 2.",
  "Temporarily increases M. Def. Effect 2.": "Временно повышает магическую защиту. Эффект 2.",
  "Temporarily increases P. Def. Effect 3.": "Временно повышает физическую защиту. Эффект 3.",
  "Temporarily increases HP recovery. Effect 2.": "Временно ускоряет восстановление HP. Эффект 2.",
  "Temporarily increases maximum HP. Effect 1.": "Временно увеличивает максимальный запас HP. Эффект 1.",
  "Temporarily increases maximum MP. Effect 1.": "Временно увеличивает максимальный запас MP. Эффект 1.",
  "Temporarily reduces P. Def., M. Def. and increases P. Atk., M. Atk., Atk. Spd., Casting Spd., and Speed. Effect 2.":
    "Временно снижает физ/маг защиту и повышает физ/маг атаку, скорость атаки, скорость каста и скорость бега. Эффект 2.",
  "Temporarily increases P. Atk. Effect 3.": "Временно повышает физическую атаку. Эффект 3.",
  "Temporarily increases lung capacity. Effect 2.": "Временно увеличивает запас дыхания под водой. Эффект 2.",
  "Temporarily increases critical attack rate. Effect 2.": "Временно увеличивает шанс критической атаки. Эффект 2.",
  "Temporarily lowers the probability of magic being canceled due to damage. Effect 3.":
    "Временно уменьшает шанс сбивания каста при получении урона. Эффект 3.",
  "Temporarily increases Casting Spd. Effect 3.": "Временно повышает скорость каста. Эффект 3.",
  "Temporarily increases Atk. Spd. Effect 1.": "Временно повышает скорость атаки. Эффект 1.",
  "Temporarily increases tolerance to attack by water. Effect 1.": "Временно повышает сопротивление атакам водой. Эффект 1.",
  "Temporarily increases resistance to attack by wind. Effect 1.": "Временно повышает сопротивление атакам ветром. Эффект 1.",
  "Temporarily increases resistance to attacks by fire. Effect 2.": "Временно повышает сопротивление атакам огнём. Эффект 2.",
  "Instantly throws an enemy into a state of hold. While the effect lasts, the target cannot receive any additional hold attack.":
    "Мгновенно обездвиживает цель; пока эффект активен, дополнительные удержания не накладываются.",
  "Temporarily increases Accuracy. Effect 1.": "Временно повышает точность. Эффект 1.",
  "Temporarily increases critical attack. Effect 1.": "Временно увеличивает силу критической атаки. Эффект 1.",
  "Temporarily increases shield defense rate. Effect 1.": "Временно повышает шанс блока щитом. Эффект 1.",
  "Instills fear into one's enemies and causes them to flee.": "Насылает страх на врагов, заставляя их бежать.",
};

let updated = 0;
for (const file of fs.readdirSync(dir)) {
  if (!file.startsWith("skill_") || !file.endsWith(".ts")) continue;
  const id = Number(file.match(/skill_(\d+)\.ts/)?.[1]);
  const skill = data[id];
  if (!skill) continue;
  const ru = translate[skill.shortDesc];
  if (!ru) continue;

  const full = path.join(dir, file);
  let text = fs.readFileSync(full, "utf8");
  text = text.replace(/description: \"[^\"]*\"/, `description: "${ru}"`);
  fs.writeFileSync(full, text, "utf8");
  updated++;
}

console.log(`Updated ${updated} descriptions to Russian.`);
