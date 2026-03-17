#!/usr/bin/env node
/**
 * Fix mojibake in mobs.ts — map broken strings to correct
 * File uses ѕ (0455) for о and є (0454) for к in mojibake
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Adapt map's broken strings to file encoding (from extract-mojibake.mjs analysis)
function toFileEncoding(broken) {
  return broken
    .replace(/\u043E/g, "\u0455") // о → ѕ
    .replace(/\u043A/g, "\u0454") // к → є
    .replace(/\u0436/g, "\u00B6") // ж → ¶
    .replace(/\u0434/g, "\u0491") // д → ґ
    .replace(/\u042C/g, "\u040A") // ь → Њ
    .replace(/\u2019/g, "\u2018"); // ' — file uses 2018
}

const mapPath = path.resolve(__dirname, "mobs-fix-map.json");
const MAP = JSON.parse(fs.readFileSync(mapPath, "utf8"));

const filePath = path.resolve(__dirname, "..", "src/data/world/l2dop/mobs.ts");
let content = fs.readFileSync(filePath, "utf8");
let count = 0;

for (const [broken, correct] of MAP) {
  for (const candidate of [broken, toFileEncoding(broken)]) {
    if (content.includes(candidate)) {
      content = content.split(candidate).join(correct);
      count++;
      break;
    }
  }
}

fs.writeFileSync(filePath, content, "utf8");
console.log("Fixed", count, "unique strings");
