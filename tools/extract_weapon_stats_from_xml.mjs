// tools/extract_weapon_stats_from_xml.mjs
// Витягує pAtk, mAtk, rCrit, pAtkSpd, castSpeed з XML файлів для зброї

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XML_DIR = path.join(__dirname, "htmlскіли", "items");
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "items", "weaponStatsFromXml.json");

function extractWeaponStatsFromXml(content) {
  const weapons = [];
  const itemRegex = /<item\s+id="(\d+)"\s+type="Weapon"\s+name="([^"]*)">[\s\S]*?<\/item>/g;
  let m;
  while ((m = itemRegex.exec(content)) !== null) {
    const [, id, name] = m;
    const block = m[0];
    const stats = {};
    const pAtkM = block.match(/stat="pAtk"\s+val="(\d+)"/);
    const mAtkM = block.match(/stat="mAtk"\s+val="(\d+)"/);
    const rCritM = block.match(/stat="rCrit"\s+val="(\d+)"/);
    const pAtkSpdM = block.match(/stat="pAtkSpd"\s+val="(\d+)"/);
    const mAtkSpdM = block.match(/stat="mAtkSpd"\s+val="(\d+)"/);
    const mCritM = block.match(/stat="mCrit"\s+val="(\d+)"/);
    if (pAtkM) stats.pAtk = parseInt(pAtkM[1], 10);
    if (mAtkM) stats.mAtk = parseInt(mAtkM[1], 10);
    if (rCritM) stats.rCrit = parseInt(rCritM[1], 10);
    if (pAtkSpdM) stats.pAtkSpd = parseInt(pAtkSpdM[1], 10);
    if (mAtkSpdM) stats.castSpeed = parseInt(mAtkSpdM[1], 10);
    if (mCritM) stats.mCrit = parseInt(mCritM[1], 10);
    if (stats.pAtk !== undefined || stats.mAtk !== undefined) {
      weapons.push({ id: parseInt(id, 10), name, ...stats });
    }
  }
  return weapons;
}

const allWeapons = {};
const files = fs.readdirSync(XML_DIR).filter((f) => f.endsWith(".xml"));

for (const file of files) {
  const filePath = path.join(XML_DIR, file);
  const content = fs.readFileSync(filePath, "utf-8");
  const items = extractWeaponStatsFromXml(content);
  for (const w of items) {
    allWeapons[w.id] = {
      pAtk: w.pAtk,
      mAtk: w.mAtk,
      rCrit: w.rCrit,
      pAtkSpd: w.pAtkSpd,
      ...(w.castSpeed ? { castSpeed: w.castSpeed } : {}),
    };
  }
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allWeapons, null, 2), "utf-8");
console.log(`Extracted ${Object.keys(allWeapons).length} weapon stats to ${OUTPUT_PATH}`);
