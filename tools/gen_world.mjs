// tools/gen_world.mjs
// Генерує ТІЛЬКИ основні міста з нормальним набором окрестностей.
// УВАГА: перед записом чистить src/data/world/*.json
// Запуск: node tools/gen_world.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const OUT_DIR    = path.resolve(__dirname, "../src/data/world");

// helpers
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const city = (name, tpCost, zones) => ({
  id: slug(name), name, tpCost,
  zones: zones.map(z => ({
    id: slug(z.name), name: z.name,
    levelMin: z.min, levelMax: z.max, tpCost: z.tp, mobs: []
  }))
});

// === ТВОЇ ОСНОВНІ МІСТА ===
const DATA = [
  city("Floran Village", 10000, [
    { name: "Floran Agricultural Area", min: 20, max: 30, tp: 900 },
    { name: "Plains of Dion",          min: 25, max: 35, tp: 1100 },
    { name: "Beehive",                  min: 28, max: 36, tp: 1200 },
    { name: "Execution Grounds",        min: 25, max: 35, tp: 1200 }
  ]),

  city("Gludin Village", 32000, [
    { name: "Windmill Hill",                 min: 12, max: 20, tp: 600 },
    { name: "Abandoned Camp",                min: 18, max: 25, tp: 800 },
    { name: "Langk Lizardmen Dwellings",     min: 24, max: 30, tp: 1200 },
    { name: "Forgotten Temple (entrance)",   min: 30, max: 40, tp: 2200 },
    { name: "Wastelands",                    min: 24, max: 34, tp: 1300 }
  ]),

  city("Heine", 43000, [
    { name: "Alligator Island",          min: 45, max: 55, tp: 2400 },
    { name: "Devil's Isle Shores",       min: 55, max: 62, tp: 3000 },
    { name: "Garden of Eva (upper)",     min: 58, max: 66, tp: 4200 },
    { name: "Primeval Isle",             min: 75, max: 80, tp: 9000 }
  ]),

  city("Hunters Village", 10000, [
    { name: "Forest of Outlaws",         min: 58, max: 66, tp: 3300 },
    { name: "Blazing Swamp",             min: 68, max: 76, tp: 4800 },
    { name: "Forge of the Gods (upper)", min: 76, max: 80, tp: 4300 },
    { name: "Varka Silenos Encampment",  min: 72, max: 80, tp: 6000 },
    { name: "Ketra Orc Outpost",         min: 72, max: 80, tp: 6000 }
  ]),

  city("Rune Township", 10000, [
    { name: "Swamp of Screams",      min: 66, max: 74, tp: 3000 },
    { name: "Forest of the Dead",    min: 65, max: 74, tp: 3200 },
    { name: "Valley of Saints",      min: 70, max: 78, tp: 5000 },
    { name: "Monastery of Silence",  min: 80, max: 80, tp: 14000 }
  ]),

  city("Town of Aden", 37000, [
    { name: "Forest of Mirrors",   min: 58, max: 68, tp: 3600 },
    { name: "Silent Valley",       min: 70, max: 76, tp: 5200 },
    { name: "Giants Cave",         min: 68, max: 76, tp: 5200 },
    { name: "Forsaken Plains",     min: 60, max: 68, tp: 4200 }
  ]),

  city("Town of Dion", 57000, [
    { name: "Floran Agricultural Area", min: 20, max: 30, tp: 900 },
    { name: "Execution Grounds",        min: 25, max: 35, tp: 1200 },
    { name: "Cruma Marshlands",         min: 30, max: 40, tp: 2200 },
    { name: "Cruma Tower Lv1",          min: 35, max: 45, tp: 3000 },
    { name: "Cruma Tower Lv2",          min: 45, max: 52, tp: 3600 }
  ]),

  city("Town of Giran", 59000, [
    { name: "Death Pass",           min: 45, max: 55, tp: 2600 },
    { name: "Dragon Valley",        min: 47, max: 60, tp: 4400 },
    { name: "Antharas' Lair (outer)", min: 60, max: 76, tp: 7800 },
    { name: "Breka's Stronghold",   min: 40, max: 52, tp: 3100 },
    { name: "Devil's Isle (pirates)", min: 58, max: 64, tp: 3600 }
  ]),

  city("Town of Gludio", 53000, [
    { name: "Ruins of Agony",   min: 18, max: 27, tp: 900 },
    { name: "Ruins of Despair", min: 20, max: 30, tp: 1100 },
    { name: "Ant Nest",         min: 25, max: 34, tp: 1700 },
    { name: "Forgotten Temple", min: 30, max: 40, tp: 2200 },
    { name: "Wastelands",       min: 24, max: 34, tp: 1300 }
  ]),

  city("Town of Goddard", 10000, [
    { name: "Hot Springs",         min: 66, max: 76, tp: 2300 },
    { name: "Wall of Argos",       min: 72, max: 80, tp: 3200 },
    { name: "Forge of the Gods (lower)", min: 78, max: 80, tp: 5000 },
    { name: "Stakato Nest",        min: 70, max: 80, tp: 5200 }
  ]),

  city("Town of Oren", 10000, [
    { name: "Ivory Tower Crater", min: 48, max: 56, tp: 2600 },
    { name: "Sea of Spores",      min: 52, max: 60, tp: 3300 },
    { name: "Enchanted Valley (lower)", min: 49, max: 57, tp: 2800 },
    { name: "Enchanted Valley (upper)", min: 57, max: 62, tp: 3600 },
    { name: "Forest of Evil",     min: 44, max: 52, tp: 2400 }
  ]),

  city("Town of Schuttgart", 10000, [
    { name: "Crypts of Disgrace",     min: 63, max: 70, tp: 3100 },
    { name: "Den of Evil",            min: 66, max: 74, tp: 3400 },
    { name: "Pavel Ruins",            min: 60, max: 68, tp: 3200 },
    { name: "Frozen Labyrinth",       min: 68, max: 76, tp: 3800 },
    { name: "Ice Queen's Castle (approach)", min: 70, max: 78, tp: 5200 }
  ])
];

// ——— Очистити старі world-файли ———
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith(".json")) fs.unlinkSync(path.join(OUT_DIR, f));
}

// ——— Записати нові ———
for (const c of DATA) {
  const file = path.join(OUT_DIR, `${c.id}.json`);
  fs.writeFileSync(file, JSON.stringify(c, null, 2), "utf-8");
  console.log("✔", path.relative(process.cwd(), file));
}
console.log(`\nГотово! Створено ${DATA.length} основних міст у ${OUT_DIR}`);
