#!/usr/bin/env node
/**
 * Fix remaining mojibake in mobs.ts - champion names, RB names, suffixes.
 * Uses block replacement by regex to avoid encoding issues with mojibake strings.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.resolve(__dirname, "..", "src/data/world/l2dop/mobs.ts");
let content = fs.readFileSync(filePath, "utf8");

// Block replacements: [regex, replacement]
const GLUDIO_RB_EXTRA = `const GLUDIO_RB_EXTRA_NAMES: Record<string, string[]> = {
  "01": ["Страж Окраїни", "Вартовий Окраїни", "Повелитель Окраїни", "Тиран Окраїни", "Лорд Окраїни"],
  "02": ["Король Лугів", "Страж Лугів", "Дракон Лугів", "Тиран Лугів", "Вождь Лугів"],
  "03": ["Дракон Рощі", "Король Рощі", "Тиран Рощі", "Страж Рощі", "Лорд Рощі"],
  "04": ["Тиран Болота", "Король Болота", "Дракон Болота", "Страж Болота", "Повелитель Болота"],
  "05": ["Дракон Руїн", "Страж Руїн", "Тиран Руїн", "Король Руїн", "Вождь Руїн"],
  "06": ["Тиран Ящерів", "Король Ящерів", "Страж Ящерів", "Дракон Ящерів", "Повелитель Ящерів"],
  "07": ["Король Орків", "Тиран Орків", "Страж Орків", "Вождь Орків", "Дракон Орків"],
  "08": ["Король Печер", "Тиран Печер", "Страж Печер", "Дракон Печер", "Повелитель Печер"],
};`;

const ADEN_RB_EXTRA = `const ADEN_RB_EXTRA_NAMES: Record<string, string[]> = {
  "01": ["Вартовий Окраїни", "Повелитель Окраїни", "Тиран Окраїни", "Лорд Окраїни", "Дракон Окраїни"],
  "02": ["Король Долини", "Страж Долини", "Тиран Долини", "Повелитель Долини", "Архонт Долини"],
  "03": ["Дракон Долини", "Король Долини", "Тиран Магії", "Страж Магії", "Повелитель Магії"],
  "04": ["Тиран Страті", "Король Страті", "Дракон Страті", "Страж Страті", "Повелитель Страті"],
  "05": ["Дракон Скелетів", "Страж Скелетів", "Тиран Скелетів", "Король Кістей", "Повелитель Кістей"],
  "06": ["Тиран Воїни", "Король Воїни", "Страж Воїни", "Дракон Болота", "Повелитель Воїни"],
  "07": ["Король Темряви", "Тиран Темряви", "Страж Підземелля", "Архонт Темряви", "Повелитель Темряви"],
  "08": ["Король Фортеці", "Тиран Фортеці", "Вартовий Окраїни", "Дракон Фортеці", "Повелитель Фортеці"],
};`;

// Gludio champion: names object
const GLUDIO_NAMES = `    "01": "Окраїнський Громила", "02": "Луговий Вождь", "03": "Рощовий Лорд", "04": "Болотний Тінь",
    "05": "Руїнний Страх", "06": "Ящір-Тиран", "07": "Орк-Тетрарх", "08": "Печерний Лорд",`;

// Gludio suffixes and baseName
const GLUDIO_SUFFIXES = `  const suffixes = ["I", "II", "III", "IV", "V", "Громила", "Тиран"];`;
const GLUDIO_BASENAME = `  const baseName = names[zoneNum] ?? "Глоріо Чемпіон";`;

// Aden champion: names object
const ADEN_NAMES = `    "01": "Окраїнський Страж", "02": "Долинний Вождь", "03": "Магічний Тиран", "04": "Лорд Лугів-Кат",
    "05": "Скелет-Лорд", "06": "Воїняний Повелитель", "07": "Темний Архонт", "08": "Фортечний Імператор",`;
const ADEN_SUFFIXES = `  const suffixes = ["I", "II", "III", "IV", "V", "Стража", "Тиран"];`;

// Structure-based regex: "01": "val", "02": "val", ... format (matches both Gludio and Aden)
const NAMES_LINES_REGEX = /("01": )"[^"]+", ("02": )"[^"]+", ("03": )"[^"]+", ("04": )"[^"]+",\s*\n\s*("05": )"[^"]+", ("06": )"[^"]+", ("07": )"[^"]+", ("08": )"[^"]+",/g;

const GLUDIO_SUFFIXES_REGEX = /(const suffixes = \["I", "II", "III", "IV", "V", )"[^"]+", "[^"]+"\];/;
const GLUDIO_BASENAME_REGEX = /(const baseName = names\[zoneNum\] \?\? )"[^"]+";/;

const replacements = [
  [/const GLUDIO_RB_EXTRA_NAMES: Record<string, string\[\]> = \{\s*\n[\s\S]*?\n\};/, GLUDIO_RB_EXTRA],
  [/const ADEN_RB_EXTRA_NAMES: Record<string, string\[\]> = \{\s*\n[\s\S]*?\n\};/, ADEN_RB_EXTRA],
  [GLUDIO_SUFFIXES_REGEX, `$1"Громила", "Тиран"];`],
  [GLUDIO_BASENAME_REGEX, `$1"Глоріо Чемпіон";`],
];

let count = 0;
for (const [regex, replacement] of replacements) {
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    count++;
  }
}

// Names: first match = Gludio, second = Aden
let namesMatchCount = 0;
content = content.replace(NAMES_LINES_REGEX, () => {
  namesMatchCount++;
  const replaced = namesMatchCount <= 1 ? GLUDIO_NAMES : ADEN_NAMES;
  if (replaced) count++;
  return replaced;
});
count += Math.min(namesMatchCount, 2);

fs.writeFileSync(filePath, content, "utf8");
console.log("Fixed", count, "blocks");
