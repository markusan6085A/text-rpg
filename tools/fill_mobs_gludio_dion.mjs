// tools/fill_mobs_gludio_dion.mjs
// Додає мобів у міста Talking Island / Gludio / Dion (зони 1–40 lvl)
// Запуск: node tools/fill_mobs_gludio_dion.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORLD_DIR = path.resolve(__dirname, "../src/data/world");

// Маленький утил: пошук зони за id
function upsertMobs(cityJson, zoneId, mobs) {
  const z = cityJson.zones.find((z) => z.id === zoneId);
  if (!z) {
    console.warn(`! Зона '${zoneId}' не знайдена у ${cityJson.name}`);
    return;
  }
  z.mobs = mobs;
}

// Наближені до L2 параметри: шанси дропа в межах жанру
// ресурс 1–50%, еквіп 0.2–0.8%
const MOBS = {
  // Talking Island Village
  talking_island_village: {
    okrestnosti_talking_island: [
      { name: "Gremlin", level: 3, hp: 45, exp: 12, adenaMin: 4, adenaMax: 10, dropResourcePct: 25, dropEquipPct: 0.3 },
      { name: "Keltir", level: 4, hp: 60, exp: 16, adenaMin: 5, adenaMax: 12, dropResourcePct: 26, dropEquipPct: 0.3 },
      { name: "Grey Wolf", level: 5, hp: 85, exp: 20, adenaMin: 8, adenaMax: 20, dropResourcePct: 28, dropEquipPct: 0.35 },
      { name: "Orc Grunt", level: 7, hp: 110, exp: 28, adenaMin: 12, adenaMax: 26, dropResourcePct: 30, dropEquipPct: 0.35 }
    ],
    elven_ruins: [
      { name: "Undine", level: 12, hp: 210, exp: 55, adenaMin: 25, adenaMax: 55, dropResourcePct: 35, dropEquipPct: 0.45 },
      { name: "Skeleton Scout", level: 10, hp: 160, exp: 40, adenaMin: 18, adenaMax: 40, dropResourcePct: 32, dropEquipPct: 0.4 },
      { name: "Skeleton Archer", level: 13, hp: 240, exp: 64, adenaMin: 30, adenaMax: 65, dropResourcePct: 36, dropEquipPct: 0.45 },
      { name: "Undine Noble", level: 15, hp: 300, exp: 78, adenaMin: 36, adenaMax: 80, dropResourcePct: 38, dropEquipPct: 0.5 }
    ]
  },

  // Town of Gludio
  town_of_gludio: {
    ruins_of_agony: [
      { name: "Zombie Soldier", level: 22, hp: 520, exp: 180, adenaMin: 90, adenaMax: 190, dropResourcePct: 32, dropEquipPct: 0.48 },
      { name: "Zombie Warrior", level: 24, hp: 610, exp: 210, adenaMin: 100, adenaMax: 210, dropResourcePct: 33, dropEquipPct: 0.5 },
      { name: "Drevanul", level: 26, hp: 800, exp: 260, adenaMin: 140, adenaMax: 260, dropResourcePct: 34, dropEquipPct: 0.5 }
    ],
    ant_nest: [
      { name: "Ant Scout", level: 28, hp: 700, exp: 240, adenaMin: 130, adenaMax: 260, dropResourcePct: 35, dropEquipPct: 0.5 },
      { name: "Ant Soldier", level: 32, hp: 980, exp: 320, adenaMin: 160, adenaMax: 320, dropResourcePct: 36, dropEquipPct: 0.52 },
      { name: "Ant Warrior Captain", level: 34, hp: 1200, exp: 380, adenaMin: 190, adenaMax: 360, dropResourcePct: 38, dropEquipPct: 0.55 }
    ]
  },

  // Town of Dion
  town_of_dion: {
    execution_grounds: [
      { name: "Hangman Tree", level: 30, hp: 880, exp: 320, adenaMin: 160, adenaMax: 330, dropResourcePct: 36, dropEquipPct: 0.55 },
      { name: "Hanged Man Ripper", level: 32, hp: 980, exp: 360, adenaMin: 180, adenaMax: 360, dropResourcePct: 37, dropEquipPct: 0.56 },
      { name: "Disgraced Skeleton", level: 34, hp: 1100, exp: 400, adenaMin: 190, adenaMax: 380, dropResourcePct: 38, dropEquipPct: 0.58 }
    ],
    cruma_marshlands: [
      { name: "Marsh Stakato", level: 34, hp: 900, exp: 360, adenaMin: 180, adenaMax: 380, dropResourcePct: 36, dropEquipPct: 0.55 },
      { name: "Rotting Golem", level: 38, hp: 1200, exp: 480, adenaMin: 220, adenaMax: 500, dropResourcePct: 40, dropEquipPct: 0.6 }
    ],
    cruma_tower: [
      { name: "Porta", level: 36, hp: 1400, exp: 520, adenaMin: 240, adenaMax: 520, dropResourcePct: 38, dropEquipPct: 0.6 },
      { name: "Excuro", level: 40, hp: 1800, exp: 680, adenaMin: 300, adenaMax: 650, dropResourcePct: 40, dropEquipPct: 0.62 },
      { name: "Catherok", level: 42, hp: 2100, exp: 760, adenaMin: 340, adenaMax: 720, dropResourcePct: 42, dropEquipPct: 0.65 }
    ]
  }
};

// Файли, які змінюємо (мають існувати, бо їх згенерував gen_world.mjs)
const FILES = {
  talking_island_village: "talking_island_village.json",
  town_of_gludio: "town_of_gludio.json",
  town_of_dion: "town_of_dion.json"
};

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}
function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf-8");
  console.log("✔ оновлено", path.relative(process.cwd(), p));
}

for (const [cityId, file] of Object.entries(FILES)) {
  const full = path.join(WORLD_DIR, file);
  if (!fs.existsSync(full)) {
    console.warn(`! Пропущено: немає файла ${full}`);
    continue;
  }
  const json = loadJson(full);
  const mapping = MOBS[cityId] || {};
  for (const [zoneId, mobs] of Object.entries(mapping)) {
    upsertMobs(json, zoneId, mobs);
  }
  saveJson(full, json);
}

console.log("\nГотово! Моби для Talking Island / Gludio / Dion додані.");
