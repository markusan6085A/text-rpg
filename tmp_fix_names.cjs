// Temporary script to fix corrupted skill names/descriptions (HumanMystic).
// Runs once with: node tmp_fix_names.js
const fs = require("fs");
const path = require("path");

const nameMap = {
  10: "Призвать кубик бури",
  1328: "Масс. призыв кубика бури",
  1279: "Призвать связывающий кубик",
  1299: "Ульт. защита саммона",
  1300: "Исцеление саммона",
  1301: "Благословение саммона",
  1111: "Призвать Кэт Кота",
  1225: "Призвать Мью Кота",
  1276: "Призвать Кай Кота",
  1331: "Призвать Королеву Котов",
  1126: "Восполнение MP саммона",
  1127: "Лечение саммона",
  1139: "Магический щит саммона",
  1140: "Физический щит саммона",
  1141: "Ускорение саммона",
  1144: "Легкая поступь саммона",
  143: "Мастерство кубиков",
  258: "Мастерство легкой брони",
  146: "Антимагия",
  164: "Быстрое восстановление",
  212: "Ускоренное восстановление HP",
  213: "Увеличение MP",
  228: "Быстрое чтение заклинаний",
  229: "Ускоренное восстановление MP",
  234: "Мастерство роб",
  249: "Мастерство оружия",
  1262: "Передача боли",
};

const baseDir = path.join("src", "data", "skills", "classes", "HumanMystic");
const files = [];
const walk = (dir) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile() && e.name.endsWith(".ts") && e.name !== "index.ts") {
      files.push(p);
    }
  });
};
walk(baseDir);

let updated = 0;
files.forEach((p) => {
  let txt = fs.readFileSync(p, "utf8");
  const idMatch = txt.match(/id:\s*(\d+)/);
  if (!idMatch) return;
  const id = parseInt(idMatch[1], 10);
  const currentNameMatch = txt.match(/name:\s*"([^"]*)"/);
  const currentName = currentNameMatch ? currentNameMatch[1] : "";
  const needFix = currentName.includes("?") || nameMap[id];
  if (!needFix) return;
  const newName = nameMap[id] || `Навык ${id}`;
  txt = txt.replace(/name:\s*"([^"]*)"/, `name: "${newName}"`);
  txt = txt.replace(/description:\s*"([^"]*)"/, `description: "${newName}"`);
  fs.writeFileSync(p, txt, "utf8");
  updated += 1;
});

console.log(`Processed ${files.length} files, fixed ${updated}`);
