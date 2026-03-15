#!/usr/bin/env node
/**
 * Екстракція міст, зон та мобів з l2dop lineage.sql
 * Запуск: node tools/extractL2dopWorld.mjs
 * Потрібно: lineage.sql у ../l2dop/lineage.sql
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const L2DOP_SQL = path.resolve(__dirname, "../l2dop/lineage.sql");
const OUTPUT_DIR = path.resolve(__dirname, "../src/data/world/l2dop");

// Маппінг item_id -> string id (з droplistMapping)
const ITEM_MAP = {
  57: "adena", 1864: "stem", 1865: "varnish", 1866: "suede", 1867: "animal_skin",
  1868: "thread", 1869: "iron_ore", 1870: "coal", 1871: "charcoal", 1872: "animal_bone",
  1873: "silver_nugget", 1874: "oriharukon_ore", 1875: "stone_of_purity",
  1876: "mithril_ore", 1877: "adamantite_nugget", 1880: "steel", 1881: "coarse_bone_powder",
  1882: "leather", 1884: "cord", 1885: "high_grade_suede", 1894: "crafted_leather",
  4039: "mold_glue", 4040: "mold_lubricant", 4041: "mold_hardener",
  4042: "enria", 4043: "asofe", 4044: "thons",
};

/** Парсинг VALUES з MySQL INSERT - простий split з підтримкою quote */
function parseValues(line) {
  const match = line.match(/VALUES\s*\((.+)\)\s*;?\s*$/s);
  if (!match) return null;
  const inner = match[1];
  const values = [];
  let i = 0;
  while (i < inner.length) {
    const c = inner[i];
    if (c === "'") {
      let s = "";
      i++;
      while (i < inner.length) {
        if (inner[i] === "'" && inner[i + 1] === "'") {
          s += "'";
          i += 2;
        } else if (inner[i] === "'") {
          i++;
          break;
        } else {
          s += inner[i];
          i++;
        }
      }
      values.push(s);
    } else if (c === "n" && inner.substring(i, i + 4) === "null") {
      values.push(null);
      i += 4;
    } else if (/[\d-]/.test(c)) {
      let s = "";
      while (i < inner.length && /[\d.-]/.test(inner[i])) {
        s += inner[i];
        i++;
      }
      values.push(s);
    } else if (/\s/.test(c) || c === ",") {
      i++;
    } else {
      i++;
    }
  }
  return values;
}

/** location prefix -> city id */
const LOC_TO_CITY = {
  gludio: "l2dop_gludio", giran: "l2dop_giran", dion: "l2dop_dion",
  oren: "l2dop_oren", aden: "l2dop_aden", heine: "l2dop_heine",
  goddard: "l2dop_goddard", rune: "l2dop_rune", schuttgart: "l2dop_schuttgart",
  innadrile: "l2dop_innadrile", talking: "l2dop_talking", gludin: "l2dop_gludin",
};
const CITY_NAMES = {
  l2dop_gludio: "Gludio (L2)", l2dop_giran: "Giran (L2)", l2dop_dion: "Dion (L2)",
  l2dop_oren: "Oren (L2)", l2dop_aden: "Aden (L2)", l2dop_heine: "Heine (L2)",
  l2dop_gludin: "Gludin (L2)", l2dop_innadrile: "Innadril (L2)",
  l2dop_talking: "Talking Island (L2)", l2dop_goddard: "Goddard (L2)",
  l2dop_rune: "Rune (L2)", l2dop_schuttgart: "Schuttgart (L2)",
};

function getCityFromLocation(loc) {
  if (!loc || loc === "unset") return null;
  const lower = loc.toLowerCase();
  for (const [prefix, cityId] of Object.entries(LOC_TO_CITY)) {
    if (lower.startsWith(prefix)) return cityId;
  }
  return null;
}

function main() {
  if (!fs.existsSync(L2DOP_SQL)) {
    console.error("Не знайдено:", L2DOP_SQL);
    process.exit(1);
  }

  const content = fs.readFileSync(L2DOP_SQL, "utf-8");
  const lines = content.split("\n");

  const npcMap = new Map();       // id -> {name, level, hp, mp, patk, pdef, matk, mdef, exp, sp, type}
  const droplistByEid = new Map(); // eid -> [{drop, min, max, category, chance}]
  const spawnByLocation = new Map(); // location -> [{npcid, name, lvl}]

  let inNpc = false, inDroplist = false, inSpawnlist = false;

  for (const line of lines) {
    if (line.includes("INSERT INTO `npc`")) {
      inNpc = true;
      inDroplist = false;
      inSpawnlist = false;
    } else if (line.includes("INSERT INTO `droplist`")) {
      inNpc = false;
      inDroplist = true;
      inSpawnlist = false;
    } else if (line.includes("INSERT INTO `spawnlist`")) {
      inNpc = false;
      inDroplist = false;
      inSpawnlist = true;
    } else if (line.startsWith("INSERT INTO `")) {
      inNpc = false;
      inDroplist = false;
      inSpawnlist = false;
    }

    if (inNpc) {
      const v = parseValues(line);
      if (v && v.length >= 20 && v[11] === "L2Monster") {
        const id = v[0];
        npcMap.set(id, {
          id, name: v[2], level: parseInt(v[9], 10) || 1,
          hp: parseInt(v[13], 10) || 100, mp: parseInt(v[14], 10) || 0,
          patk: parseInt(v[24], 10) || 10, pdef: parseInt(v[25], 10) || 10,
          matk: parseInt(v[26], 10) || 0, mdef: parseInt(v[27], 10) || 10,
          exp: parseInt(v[22], 10) || 0, sp: parseInt(v[23], 10) || 0,
        });
      }
    } else if (inDroplist) {
      const v = parseValues(line);
      if (v && v.length >= 6) {
        const eid = v[0];
        if (!droplistByEid.has(eid)) droplistByEid.set(eid, []);
        droplistByEid.get(eid).push({
          drop: parseInt(v[1], 10), min: parseInt(v[2], 10), max: parseInt(v[3], 10),
          category: parseInt(v[4], 10), chance: parseInt(v[5], 10),
        });
      }
    } else if (inSpawnlist) {
      const v = parseValues(line);
      if (v && v.length >= 26) {
        const npcid = v[1];
        const location = v[25];
        const name = v[8] || "";
        const lvl = parseInt(v[7], 10) || 1;
        if (location && location !== "unset" && npcMap.has(npcid)) {
          if (!spawnByLocation.has(location)) spawnByLocation.set(location, []);
          spawnByLocation.get(location).push({ npcid, name, lvl });
        }
      }
    }
  }

  // Skip chests, doors, etc (name contains Сундук, Дверь, etc)
  const skipNames = /сундук|дверь|door|chest|trap|ловушка|башн/i;
  for (const [loc, arr] of spawnByLocation.entries()) {
    spawnByLocation.set(loc, arr.filter((s) => !skipNames.test(s.name)));
  }

  // Build zones: location -> {cityId, mobs}
  const zonesByCity = new Map();
  for (const [location, spawns] of spawnByLocation.entries()) {
    if (spawns.length === 0) continue;
    const cityId = getCityFromLocation(location);
    if (!cityId) continue;

    const uniqueMobs = new Map(); // npcid -> {npc, spawns}
    for (const s of spawns) {
      const npc = npcMap.get(s.npcid);
      if (!npc) continue;
      if (!uniqueMobs.has(s.npcid)) uniqueMobs.set(s.npcid, { npc, count: 0 });
      uniqueMobs.get(s.npcid).count++;
    }

    const mobs = [];
    for (const [npcid, { npc }] of uniqueMobs.entries()) {
      const drops = [];
      const spoil = [];
      const list = droplistByEid.get(npcid) || [];
      for (const d of list) {
        if (d.category === 0 && d.drop === 57) {
          // adena
          drops.push({
            id: "adena",
            kind: "adena",
            chance: Math.min(1, d.chance / 1000000),
            min: d.min,
            max: d.max,
          });
        } else if (d.category === 0 && ITEM_MAP[d.drop]) {
          drops.push({
            id: ITEM_MAP[d.drop],
            kind: "resource",
            chance: Math.min(1, d.chance / 1000000),
            min: d.min,
            max: d.max,
          });
        } else if (d.category === 1 && ITEM_MAP[d.drop]) {
          spoil.push({
            id: ITEM_MAP[d.drop],
            kind: "resource",
            chance: Math.min(1, d.chance / 1000000),
            min: d.min,
            max: d.max,
          });
        }
      }

      const adenaEntry = drops.find((x) => x.id === "adena");
      const adenaMin = adenaEntry ? adenaEntry.min : Math.floor(npc.level * 5);
      const adenaMax = adenaEntry ? adenaEntry.max : Math.floor(npc.level * 10);
      const dropChance = drops.some((x) => x.id !== "adena") ? 0.25 : 0;

      mobs.push({
        id: `l2dop_mob_${npcid}`,
        name: npc.name,
        level: npc.level,
        hp: npc.hp,
        mp: npc.mp,
        pAtk: npc.patk,
        mAtk: npc.matk,
        pDef: npc.pdef,
        mDef: npc.mdef,
        exp: npc.exp,
        sp: npc.sp,
        adenaMin,
        adenaMax,
        dropChance,
        drops: drops.filter((x) => x.id !== "adena").length ? drops : undefined,
        spoil: spoil.length ? spoil : undefined,
      });
    }

    if (mobs.length === 0) continue;

    const zoneId = `l2dop_${location.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
    const minLvl = Math.min(...mobs.map((m) => m.level));
    const maxLvl = Math.max(...mobs.map((m) => m.level));
    const zone = {
      id: zoneId,
      name: location,
      cityId,
      minLevel: minLvl,
      maxLevel: maxLvl,
      tpCost: 5000 + minLvl * 200,
      mobs,
    };

    if (!zonesByCity.has(cityId)) zonesByCity.set(cityId, []);
    zonesByCity.get(cityId).push(zone);
  }

  // Cities
  const cities = [];
  for (const [cityId, zones] of zonesByCity.entries()) {
    const name = CITY_NAMES[cityId] || cityId;
    const tpCost = 35000;
    cities.push({ id: cityId, name, tpCost });
  }

  // Limit zones per city to avoid huge output (take first 3 zones per city as sample)
  const maxZonesPerCity = 5;
  const finalZones = [];
  for (const zones of zonesByCity.values()) {
    zones.sort((a, b) => a.minLevel - b.minLevel);
    finalZones.push(...zones.slice(0, maxZonesPerCity));
  }

  // Write cities.ts
  const citiesTs = `// Auto-generated from l2dop lineage.sql - run: node tools/extractL2dopWorld.mjs
import type { City } from "../types";

export const L2DOP_CITIES: City[] = ${JSON.stringify(cities, null, 2)};
`;
  fs.writeFileSync(path.join(OUTPUT_DIR, "cities.ts"), citiesTs);

  // Write zones.ts
  const zonesTs = `// Auto-generated from l2dop lineage.sql - run: node tools/extractL2dopWorld.mjs
import type { Zone } from "../types";

export const L2DOP_ZONES: Zone[] = ${JSON.stringify(finalZones, null, 2)};
`;
  fs.writeFileSync(path.join(OUTPUT_DIR, "zones.ts"), zonesTs);

  // Зібрати всіх унікальних мобів і згенерувати mobsFromLineage.ts
  const seenNpc = new Set();
  for (const arr of spawnByLocation.values()) {
    for (const s of arr) seenNpc.add(s.npcid);
  }
  const mobsLines = [];
  mobsLines.push("// Auto-generated from lineage.sql - run: node tools/extractL2dopWorld.mjs");
  mobsLines.push("import type { Mob } from \"../types\";");
  mobsLines.push("import type { DropEntry } from \"../../combat/types\";");
  mobsLines.push("");
  mobsLines.push("function drop(id: string, kind: \"adena\" | \"resource\" | \"equipment\" | \"other\", chance: number, min: number, max: number): DropEntry {");
  mobsLines.push("  return { id, kind, chance, min, max };");
  mobsLines.push("}");
  mobsLines.push("");

  const sortedNpc = [...seenNpc].sort((a, b) => Number(a) - Number(b));
  for (const npcid of sortedNpc) {
    const npc = npcMap.get(npcid);
    if (!npc) continue;
    const drops = [];
    const spoil = [];
    const list = droplistByEid.get(npcid) || [];
    for (const d of list) {
      if (d.category === 0 && d.drop === 57) {
        drops.push({ id: "adena", kind: "adena", chance: Math.min(1, d.chance / 1000000), min: d.min, max: d.max });
      } else if (d.category === 0 && ITEM_MAP[d.drop]) {
        drops.push({ id: ITEM_MAP[d.drop], kind: "resource", chance: Math.min(1, d.chance / 1000000), min: d.min, max: d.max });
      } else if (d.category === 1 && ITEM_MAP[d.drop]) {
        spoil.push({ id: ITEM_MAP[d.drop], kind: "resource", chance: Math.min(1, d.chance / 1000000), min: d.min, max: d.max });
      }
    }
    const adenaEntry = drops.find((x) => x.id === "adena");
    const adenaMin = adenaEntry ? adenaEntry.min : Math.floor(npc.level * 5);
    const adenaMax = adenaEntry ? adenaEntry.max : Math.floor(npc.level * 10);
    const adenaChance = list.find((d) => d.drop === 57);
    const dropChance = adenaChance ? Math.min(1, adenaChance.chance / 1000000) : 0.7;

    const fmt = (c) => Math.round(c * 10000) / 10000;
    const ds = drops.filter((x) => x.id !== "adena").map((d) => `    drop("${d.id}", "resource", ${fmt(d.chance)}, ${d.min}, ${d.max})`).join(",\n");
    const ss = spoil.map((s) => `    drop("${s.id}", "resource", ${fmt(s.chance)}, ${s.min}, ${s.max})`).join(",\n");
    const nameEsc = npc.name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    mobsLines.push(`export const L2DOP_MOB_${npcid}: Mob = {`);
    mobsLines.push(`  id: "l2dop_${npcid}",`);
    mobsLines.push(`  name: "${nameEsc}",`);
    mobsLines.push(`  level: ${npc.level},`);
    mobsLines.push(`  hp: ${npc.hp},`);
    mobsLines.push(`  mp: ${npc.mp},`);
    mobsLines.push(`  pAtk: ${npc.patk},`);
    mobsLines.push(`  mAtk: ${npc.matk},`);
    mobsLines.push(`  pDef: ${npc.pdef},`);
    mobsLines.push(`  mDef: ${npc.mdef},`);
    mobsLines.push(`  exp: ${npc.exp},`);
    mobsLines.push(`  sp: ${npc.sp},`);
    mobsLines.push(`  adenaMin: ${adenaMin},`);
    mobsLines.push(`  adenaMax: ${adenaMax},`);
    mobsLines.push(`  dropChance: ${dropChance},`);
    if (ds) mobsLines.push(`  drops: [\n${ds},\n  ],`);
    if (ss) mobsLines.push(`  spoil: [\n${ss},\n  ],`);
    mobsLines.push("};");
    mobsLines.push("");
  }
  const mobsTs = mobsLines.join("\n");
  fs.writeFileSync(path.join(OUTPUT_DIR, "mobsFromLineage.ts"), mobsTs);

  console.log("OK: cities=%d zones=%d mobs=%d → cities.ts, zones.ts, mobsFromLineage.ts", cities.length, finalZones.length, sortedNpc.length);
}

main();
