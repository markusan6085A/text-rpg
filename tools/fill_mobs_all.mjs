// tools/fill_mobs_all.mjs — з детальними логами
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORLD_DIR = path.resolve(__dirname, "../src/data/world");
const PACKS_DIR = path.resolve(__dirname, "../src/data/mobs/by-zone");

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

function statForLevel(level) {
  const hp = Math.round(40 + level * level * 3.2);
  const exp = Math.round(6 + level * (18 + level * 1.6));
  const adenaMin = Math.round(level * (4 + level * 1.6));
  const adenaMax = Math.round(adenaMin * (1.9 + Math.random() * 0.6));
  const dropResourcePct = clamp(Math.round(22 + level * 0.5 + Math.random() * 18), 12, 50);
  const dropEquipPct = clamp(parseFloat((0.25 + level * 0.007 + Math.random() * 0.35).toFixed(2)), 0.2, 0.8);
  return { hp, exp, adenaMin, adenaMax, dropResourcePct, dropEquipPct };
}
const BANK = {
  RUINS: ["Skeleton Scout","Skeleton Archer","Drevanul","Zombie Soldier","Zombie Warrior","Undead Priest"],
  FOREST: ["Grey Wolf","Dire Wolf","Spider Hunter","Orc Marauder","Bandit Scout","Elpy"],
  PLAINS: ["Langk Lizardman","Leto Lizardman","Gnoll","Orc Fighter","Ogre","Highland Buffalo"],
  MARSH: ["Marsh Stakato","Stakato Worker","Stakato Soldier","Swamp Spirit","Rotting Golem","Will-o'-the-Wisp"],
  CAVE: ["Stone Golem","Gargoyle","Porta","Excuro","Catherok","Ant Warrior"],
  ANT: ["Ant Scout","Ant Soldier","Ant Warrior Captain","Nurse Ant","Ant Drone","Ant Overseer"],
  DRAGON: ["Dragon Bearer","Dragon Peltast","Dragon Knight","Dragon Priest","Drake","Wyrm"],
  HOT: ["Hot Springs Buffalo","Hot Springs Antelope","Hot Springs Flava","Hot Springs Atrox","Native Buffalo","Native Antelope"],
  ARGOS: ["Eye of Splendor","Angel of Splendor","Wisp of Splendor","Seal Angel","Seal Archangel","Angel Overseer"],
  VARKA: ["Varka Silenos Recruit","Varka Silenos Shaman","Varka Silenos Officer","Varka Silenos Warrior","Varka Silenos Captain","Varka Chief"],
  KETRA: ["Ketra Orc Scout","Ketra Orc Shaman","Ketra Orc Footman","Ketra Orc Warrior","Ketra Orc Officer","Ketra Chief"],
  MONASTERY: ["Monastic Guard","Monastic Knight","Monk Disciple","Ascetic","Acolyte","Preacher"],
  PRIMEVAL: ["Velociraptor","Pterosaur","Tyrannosaurus","Ancient Lizard","Deinonychus","Ornithomimus"],
  SPORES: ["Rotting Tree","Spore Zombie","Fungus","Mycoknight","Poison Mushroom","Spore Guard"],
  OUTLAW: ["Outlaw Archer","Outlaw Scout","Bandit Warrior","Bandit Rogue","Rogue Leader","Marauder"],
  DEVILS: ["Pirate Zombie","Cursed Man","Specter Pirate","Ghost Corsair","Undead Captain","Sea Spirit"],
  TOI: ["Angelit","Hames Orc","Erin Ediunce","Shaman of ToI","Rai","Lilim Knight"],
  SEA: ["Siren","Crokian","Alligator","Crokian Lad","Ocean Spirit","Water Nymph"],
  DESERT: ["Sand Golem","Desert Scorpion","Dune Raider","Cactus Spirit","Dust Devil","Nomad Warrior"],
  CRYPT: ["Bone Grinder","Grave Wanderer","Disgraced Knight","Fallen Guard","Corrupted Monk","Tomb Warden"],
  FROZEN: ["Ice Golem","Frost Buffalo","Ice Spirit","Snow Cougar","Frost Bat","Ice Guardian"],
};
function pickBiome(zoneName) {
  const s = zoneName.toLowerCase();
  if (s.includes("ant")) return "ANT";
  if (s.includes("cruma")) return "CAVE";
  if (s.includes("marsh") || s.includes("swamp")) return "MARSH";
  if (s.includes("ruin")) return "RUINS";
  if (s.includes("forest")) return "FOREST";
  if (s.includes("valley")) return "PLAINS";
  if (s.includes("dragon")) return "DRAGON";
  if (s.includes("devil")) return "DEVILS";
  if (s.includes("forge")) return "HOT";
  if (s.includes("hot spring")) return "HOT";
  if (s.includes("argos")) return "ARGOS";
  if (s.includes("varka")) return "VARKA";
  if (s.includes("ketra")) return "KETRA";
  if (s.includes("monastery")) return "MONASTERY";
  if (s.includes("primeval")) return "PRIMEVAL";
  if (s.includes("spore")) return "SPORES";
  if (s.includes("outlaw") || s.includes("bandit")) return "OUTLAW";
  if (s.includes("isle") || s.includes("island") || s.includes("eva") || s.includes("alligator")) return "SEA";
  if (s.includes("desert") || s.includes("wasteland")) return "DESERT";
  if (s.includes("crypt") || s.includes("pavel") || s.includes("disgrace")) return "CRYPT";
  if (s.includes("ice") || s.includes("frozen")) return "FROZEN";
  if (s.includes("tower of insolence") || s.includes("toi")) return "TOI";
  if (s.includes("golem") || s.includes("mine") || s.includes("cave") || s.includes("ivory")) return "CAVE";
  return "PLAINS";
}
function genMobs(zone) {
  const names = BANK[pickBiome(zone.name)] || BANK.PLAINS;
  const count = Math.max(6, Math.ceil((zone.levelMax - zone.levelMin + 1) / 3));
  const arr = [];
  for (let i = 0; i < count; i++) {
    const lvl = clamp(zone.levelMin + Math.round(((i + 0.5) / count) * (zone.levelMax - zone.levelMin)), zone.levelMin, zone.levelMax);
    const base = names[i % names.length];
    const suffix = count > names.length ? ` ${i + 1}` : "";
    const s = statForLevel(lvl);
    arr.push({ name: base + suffix, level: lvl, ...s });
  }
  return arr;
}
function tryReadPack(cityId, zoneId) {
  const p = path.join(PACKS_DIR, cityId, `${zoneId}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf-8"));
    if (Array.isArray(j.mobs)) return j.mobs;
  } catch (e) {
    console.error("× JSON помилка у пакеті:", p, e.message);
  }
  return null;
}

function processWorld(file) {
  const full = path.join(WORLD_DIR, file);
  const city = JSON.parse(fs.readFileSync(full, "utf-8"));
  const cityId = city.id;

  console.log(`\n↪ ${city.name} [${cityId}]`);
  for (const zone of city.zones) {
    const zoneId = zone.id;
    const pack = tryReadPack(cityId, zoneId);
    if (pack) {
      zone.mobs = pack;
      console.log(`  ✔ ПАКЕТ: ${zone.name}  (${cityId}/${zoneId}.json)`);
    } else {
      zone.mobs = genMobs(zone);
      console.log(`  • AUTO : ${zone.name}  (${zone.levelMin}-${zone.levelMax})`);
    }
  }
  fs.writeFileSync(full, JSON.stringify(city, null, 2), "utf-8");
  console.log("  ✓ Збережено:", path.relative(process.cwd(), full));
}

(function main() {
  if (!fs.existsSync(WORLD_DIR)) {
    console.error("Не знайдено src/data/world — спочатку: node tools/gen_world.mjs");
    process.exit(1);
  }
  const files = fs.readdirSync(WORLD_DIR).filter(f => f.endsWith(".json"));
  if (files.length === 0) {
    console.error("У src/data/world немає *.json — згенеруй: node tools/gen_world.mjs");
    process.exit(1);
  }
  files.forEach(processWorld);
  console.log("\nГотово: пакети підхоплені, інші зони заповнені автоматично.");
})();
