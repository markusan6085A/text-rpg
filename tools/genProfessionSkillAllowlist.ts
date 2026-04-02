/**
 * Генерує server/src/professionSkillAllowlist.json — скіли з гільдії за професією,
 * список додаткових скілів і мапи для normalizeProfessionId (як на клієнті).
 * Запуск: npx tsx tools/genProfessionSkillAllowlist.ts
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ProfessionId } from "../src/data/skills/professionTypes.ts";
import { AdditionalSkills } from "../src/data/skills/additional/index.ts";
import { getSkillsForProfession, PROFESSION_OPTIONS } from "../src/data/skills/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Дубль server/src/data/skills/index.ts API_VARIANT_TO_PROFESSION_ID — узгоджувати при зміні клієнта. */
const API_VARIANT_TO_PROFESSION_ID: Record<string, ProfessionId> = {
  shillien_saint: "dark_mystic_shillien_saint",
  shillien_elder: "dark_mystic_shillien_elder",
  shillien_oracle: "dark_mystic_oracle",
  dark_wizard: "dark_mystic_dark_wizard",
  spellhowler: "dark_mystic_spellhowler",
  storm_screamer: "dark_mystic_storm_screamer",
  phantom_summoner: "dark_mystic_phantom_summoner",
  spectral_master: "dark_mystic_spectral_master",
  orc_destroyer: "orc_fighter_destroyer",
  destroyer: "orc_fighter_destroyer",
  orc_raider: "orc_fighter_raider",
  orc_monk: "orc_fighter_monk",
  tyrant: "orc_fighter_tyrant",
  orc_shaman: "orc_mystic_shaman",
  warcryer: "orc_mystic_warcryer",
  overlord: "orc_mystic_overlord",
  dominator: "orc_mystic_dominator",
  doomcryer: "orc_mystic_doomcryer",
  prophet: "human_mystic_prophet",
  bishop: "human_mystic_bishop",
  hierophant: "human_mystic_hierophant",
  cardinal: "human_mystic_cardinal",
  cleric: "human_mystic_cleric",
  wizard: "human_mystic_wizard",
  warlock: "human_mystic_warlock",
  sorcerer: "human_mystic_sorcerer",
  necromancer: "human_mystic_necromancer",
  elven_elder: "elven_mystic_elven_elder",
  elven_oracle: "elven_mystic_oracle",
  evas_saint: "elven_mystic_evas_saint",
  eva_saint: "elven_mystic_evas_saint",
  spellsinger: "elven_mystic_spellsinger",
  mystic_muse: "elven_mystic_mystic_muse",
  elemental_summoner: "elven_mystic_elemental_summoner",
  elemental_master: "elven_mystic_elemental_master",
  elven_wizard: "elven_mystic_elven_wizard",
  shillien_knight: "dark_fighter_shillien_knight",
  shillien_templar: "dark_fighter_shillien_templar",
  bladedancer: "dark_fighter_bladedancer",
  spectral_dancer: "dark_fighter_spectral_dancer",
  phantom_ranger: "dark_fighter_phantom_ranger",
  ghost_sentinel: "dark_fighter_ghost_sentinel",
  palus_knight: "dark_fighter_palus_knight",
  assassin: "dark_fighter_assassin",
  temple_knight: "elven_fighter_temple_knight",
  evas_templar: "elven_fighter_evas_templar",
  sword_singer: "elven_fighter_swordsinger",
  swordsinger: "elven_fighter_swordsinger",
  sword_muse: "elven_fighter_sword_muse",
  silver_ranger: "elven_fighter_silver_ranger",
  moonlight_sentinel: "elven_fighter_moonlight_sentinel",
  plainswalker: "elven_fighter_plainswalker",
  wind_rider: "elven_fighter_wind_rider",
  elven_knight: "elven_fighter_elven_knight",
  elven_scout: "elven_fighter_elven_scout",
  paladin: "human_fighter_paladin",
  gladiator: "human_fighter_gladiator",
  warlord: "human_fighter_warlord",
  duelist: "human_fighter_duelist",
  dreadnought: "human_fighter_dreadnought",
  phoenix_knight: "human_fighter_phoenix_knight",
  hell_knight: "human_fighter_hell_knight",
  dark_avenger: "human_fighter_dark_avenger",
  human_knight: "human_fighter_human_knight",
  hawkeye: "human_fighter_hawkeye",
  treasure_hunter: "human_fighter_treasure_hunter",
  sagittarius: "human_fighter_sagittarius",
  adventurer: "human_fighter_adventurer",
  rogue: "human_fighter_rogue",
  warrior: "human_fighter_warrior",
  titan: "orc_fighter_titan",
  scavenger: "dwarven_fighter_scavenger",
  bounty_hunter: "dwarven_fighter_bounty_hunter",
  fortune_seeker: "dwarven_fighter_fortune_seeker",
  artisan: "dwarven_fighter_artisan",
  warsmith: "dwarven_fighter_warsmith",
  maestro: "dwarven_fighter_maestro",
  grand_khavatari: "orc_fighter_grand_khavatari",
};

const labelToProfessionId: Record<string, ProfessionId> = Object.fromEntries(
  PROFESSION_OPTIONS.map((o) => [o.label.toLowerCase(), o.id])
) as Record<string, ProfessionId>;

const byProfessionId: Record<string, string[]> = {};

for (const { id: pid } of PROFESSION_OPTIONS) {
  const skills = getSkillsForProfession(pid);
  byProfessionId[pid] = [...new Set(skills.map((s) => String(s.id)))];
}

const additionalSkillIds = [...new Set(Object.values(AdditionalSkills).map((s) => String(s.id)))];

const payload = {
  byProfessionId,
  additionalSkillIds,
  labelToProfessionId,
  apiVariantToProfessionId: API_VARIANT_TO_PROFESSION_ID as Record<string, string>,
};

const target = join(__dirname, "..", "server", "src", "professionSkillAllowlist.json");
writeFileSync(target, JSON.stringify(payload), "utf8");
console.log("Wrote", target, "professions:", Object.keys(byProfessionId).length, "additional:", additionalSkillIds.length);
