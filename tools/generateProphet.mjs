import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const baseDir = path.join("src", "data", "skills", "classes");
const prophetDir = path.join(baseDir, "Human Mystic", "Prophet");
const data = JSON.parse(fs.readFileSync("tmp_prophet_skills.json", "utf8"));

const pad = (id) => id.toString().padStart(4, "0");

// Manual templates for skills that don't have a base definition elsewhere.
const manualTemplates = {
  259: {
    category: "passive",
    powerType: "flat",
    target: "self",
    scope: "single",
    effects: [
      { stat: "pDef", mode: "flat" },
      { stat: "castSpeed", mode: "percent", value: 1 },
      { stat: "attackSpeed", mode: "percent", value: 1 },
    ],
    stackType: "heavy_armor_mastery",
    stackOrder: 1,
  },
  1032: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "bleedResist", mode: "percent", value: 20 }],
    stackType: "resist_bleed",
    stackOrder: 1,
  },
  1033: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "poisonResist", mode: "percent", value: 20 }],
    stackType: "resist_poison",
    stackOrder: 1,
  },
  1036: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "mDef", mode: "percent", value: 30 }],
    stackType: "magic_barrier",
    stackOrder: 1,
  },
  1045: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "maxHp", mode: "percent", value: 35 }],
    stackType: "bless_the_body",
    stackOrder: 1,
  },
  1048: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "maxMp", mode: "percent", value: 30 }],
    stackType: "bless_the_soul",
    stackOrder: 1,
  },
  1086: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "attackSpeed", mode: "percent", value: 33 }],
    stackType: "haste",
    stackOrder: 1,
  },
  1182: {
    category: "buff",
    powerType: "flat",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "waterResist", mode: "flat", value: 30 }],
    stackType: "resist_aqua",
    stackOrder: 1,
  },
  1189: {
    category: "buff",
    powerType: "flat",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "windResist", mode: "flat", value: 30 }],
    stackType: "resist_wind",
    stackOrder: 1,
  },
  1240: {
    category: "buff",
    powerType: "flat",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "accuracy", mode: "flat", value: 4 }],
    stackType: "guidance",
    stackOrder: 1,
  },
  1242: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "critDamage", mode: "percent", value: 35 }],
    stackType: "death_whisper",
    stackOrder: 1,
  },
  1243: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "shieldBlockRate", mode: "percent", value: 40 }],
    stackType: "bless_shield",
    stackOrder: 1,
  },
  1272: {
    category: "debuff",
    powerType: "none",
    target: "enemy",
    scope: "area",
    castTime: 4,
    cooldown: 20,
    duration: 8,
    chance: 30,
    effects: [],
    stackType: "fear",
    stackOrder: 1,
  },
  1062: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [
      { stat: "pAtk", mode: "percent" },
      { stat: "attackSpeed", mode: "percent" },
      { stat: "mAtk", mode: "percent" },
      { stat: "mAtk", mode: "percent" },
      { stat: "castSpeed", mode: "percent" },
      { stat: "runSpeed", mode: "flat" },
      { stat: "pDef", mode: "percent", multiplier: -1 },
      { stat: "mDef", mode: "percent", multiplier: -2 },
    ],
    stackType: "berserker_spirit",
    stackOrder: 1,
  },
  // passives/buffs общие: без уровней, только шаблоны для доп. полей
  213: {
    category: "passive",
    powerType: "flat",
    target: "self",
    scope: "single",
    effects: [{ stat: "maxMp", mode: "flat" }],
    stackType: "boost_mana",
    stackOrder: 1,
  },
  235: {
    category: "passive",
    powerType: "flat",
    target: "self",
    scope: "single",
    effects: [
      { stat: "mDef", mode: "flat" },
      { stat: "mAtk", mode: "flat" },
      { stat: "castSpeed", mode: "percent", value: 1 },
    ],
    stackType: "robe_mastery",
    stackOrder: 1,
  },
  249: {
    category: "passive",
    powerType: "flat",
    target: "self",
    scope: "single",
    effects: [{ stat: "hpRegen", mode: "flat" }],
    stackType: "hp_regen",
    stackOrder: 1,
  },
  1035: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "pAtk", mode: "percent", value: 15 }],
    stackType: "mental_shield",
    stackOrder: 1,
  },
  1040: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "runSpeed", mode: "flat", value: 20 }],
    stackType: "wind_walk",
    stackOrder: 1,
  },
  1068: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "pAtk", mode: "percent" }],
    stackType: "might",
    stackOrder: 1,
  },
  1044: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "attackSpeed", mode: "percent", value: 33 }],
    stackType: "wind_shackle",
    stackOrder: 1,
  },
  1045: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "maxHp", mode: "percent", value: 35 }],
    stackType: "bless_the_body",
    stackOrder: 1,
  },
  1191: {
    category: "buff",
    powerType: "percent",
    target: "ally",
    scope: "single",
    castTime: 4,
    cooldown: 6,
    duration: 1200,
    effects: [{ stat: "castSpeed", mode: "percent", value: 20 }],
    stackType: "greater_shield",
    stackOrder: 1,
  },
};

const allFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else allFiles.push(full);
  }
}
walk(baseDir);

const candidates = allFiles.filter(
  (f) =>
    /skill/i.test(f) &&
    !f.includes(`${path.sep}Prophet${path.sep}`) &&
    !f.endsWith(".map")
);

function findBaseFile(id) {
  const suffix = pad(id).toLowerCase();
  const list = candidates
    .filter((f) => f.toLowerCase().includes(suffix))
    .sort((a, b) => {
      const aMystic = a.includes("Human Mystic") ? 0 : 1;
      const bMystic = b.includes("Human Mystic") ? 0 : 1;
      if (aMystic !== bMystic) return aMystic - bMystic;
      return a.length - b.length;
    });
  return list[0];
}

const moduleCache = new Map();
async function loadDef(file, id) {
  if (!file) return null;
  if (moduleCache.has(file)) return moduleCache.get(file);
  try {
    const mod = await import(pathToFileURL(file));
    const def = Object.values(mod).find(
      (v) => v && typeof v === "object" && "id" in v && v.id === id
    );
    moduleCache.set(file, def ?? null);
    return def ?? null;
  } catch (e) {
    moduleCache.set(file, null);
    return null;
  }
}

const toTs = (obj) =>
  JSON.stringify(obj, null, 2).replace(/\"([a-zA-Z0-9_]+)\":/g, "$1:");

const skillIds = Object.keys(data).map(Number);

const buildLevels = (base, levels) => {
  const maxBase = base?.levels?.length
    ? Math.max(...base.levels.map((l) => l.level))
    : 0;
  const usesEffectValue = base?.effects?.some((e) => e.value !== undefined);
  const basePower =
    base?.levels && base.levels.length
      ? base.levels[base.levels.length - 1].power ?? 0
      : 0;

  return levels
    .filter((lvl) => lvl.level > maxBase)
    .map((lvl) => ({
      level: lvl.level,
      requiredLevel: lvl.requiredLevel ?? 0,
      spCost: lvl.spCost ?? 0,
      mpCost: lvl.mpCost ?? 0,
      power: usesEffectValue ? basePower : lvl.power ?? 0,
    }));
};

const outputs = [];

for (const id of skillIds) {
  const baseFile = findBaseFile(id);
  const baseDef = await loadDef(baseFile, id);
  const levels = buildLevels(baseDef, data[id].levels);
  if (!levels.length && baseDef && !manualTemplates[id]) {
    // ничего не добавляем — берём базовое определение как есть
    continue;
  }

  const template = manualTemplates[id];

  let def;
  if (template) {
    const base = baseDef && Object.keys(baseDef).length ? baseDef : {};
    const baseLevels = Array.isArray(base.levels) ? base.levels : [];
    const templateLevels = Array.isArray(template.levels) ? template.levels : [];
    const mergedLevelsRaw = [
      ...baseLevels,
      ...templateLevels,
      ...(levels.length ? levels : []),
    ].filter(Boolean);
    const dedupByLevel = new Map();
    mergedLevelsRaw.forEach((lvl) => {
      if (!lvl || typeof lvl.level !== "number") return;
      if (!dedupByLevel.has(lvl.level)) dedupByLevel.set(lvl.level, lvl);
    });
    const mergedLevels = Array.from(dedupByLevel.values()).sort(
      (a, b) => (a.level || 0) - (b.level || 0)
    );
    def = {
      id,
      code: `HM_${pad(id)}`,
      name: data[id].name,
      description: data[id].shortDesc,
      icon: `/skills/skill${pad(id)}.gif`,
      ...base,
      ...template,
      levels: mergedLevels,
    };
  } else if (baseDef) {
    const baseLevels = Array.isArray(baseDef.levels) ? baseDef.levels : [];
    const extra = Array.isArray(levels) ? levels : [];
    const mergedLevels = [...baseLevels, ...extra].sort((a, b) => (a.level || 0) - (b.level || 0));
    def = { ...baseDef, levels: mergedLevels };
  } else {
    def = {
      id,
      code: `HM_${pad(id)}`,
      name: data[id].name,
      description: data[id].shortDesc,
      icon: `/skills/skill${pad(id)}.gif`,
      ...(template ?? {}),
      levels,
    };
  }

  // Normalize level power for skills that use fixed effect values.
  const effectHasValue = def.effects?.some((e) => e.value !== undefined);
  if (effectHasValue && def.levels) {
    const basePower = baseDef?.levels?.[0]?.power ?? 0;
    def.levels = def.levels.map((lvl) => ({
      ...lvl,
      power: basePower,
    }));
  }

  // Ensure we preserve name/description/icon if manual template was used.
  def.name = def.name ?? data[id].name;
  def.description = def.description ?? data[id].shortDesc;
  def.icon = def.icon ?? `/skills/skill${pad(id)}.gif`;

  const filePath = path.join(prophetDir, `skill_${pad(id)}.ts`);
  const content = `import { SkillDefinition } from "../../../types";

export const skill_${pad(id)}: SkillDefinition = ${toTs(def)};
`;
  fs.writeFileSync(filePath, content);
  outputs.push(filePath);
}

console.log(`Generated ${outputs.length} files:`);
outputs.forEach((f) => console.log(` - ${f}`));
