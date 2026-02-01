import type { SkillDefinition } from "./types";
import type { ProfessionId } from "./professionTypes";

/**
 * Отримує скіли для професії з урахуванням фільтрації за requiredLevel
 */
export function getSkillsForProfession(
  professionId: ProfessionId | null,
  normalizeProfessionId: (id: ProfessionId | string | null) => ProfessionId | null,
  getSkillModulesForProfession: (professionId: ProfessionId | null) => Record<string, any>[],
  skillsDB: Record<number, SkillDefinition>
): SkillDefinition[] {
  console.log(`[getSkillsForProfession] 🔍 Отримую скіли для професії:`, professionId);
  const pid = normalizeProfessionId(professionId);
  const modules = getSkillModulesForProfession(professionId);
  console.log(`[getSkillsForProfession] 📦 Модулі скілів:`, {
    count: modules.length,
    moduleKeys: modules.map((m, i) => `Module ${i}: ${Object.keys(m || {}).length} skills`),
  });
  const canonical = skillsDB;
  
  // Скіли, які потрібно виключити для ShillienSaint
  const excludedSkillIdsForShillienSaint = new Set([
    1208, // Seal of Binding
    1209, // Seal of Poison
    1210, // Seal of Gloom
    1213, // Seal of Mirage
    1221, // Blaze
    1223, // Surrender To Earth
  ]);
  
  // collect allowed levels per skill from modules in the profession chain
  const allowedLevels = new Map<number, Set<number>>();
  modules.forEach((m) => {
    Object.values(m || {}).forEach((sk) => {
      if (!sk || typeof sk.id !== "number") return;
      const id = sk.id;
      
      // Виключаємо скіли для ShillienSaint
      if (pid === "dark_mystic_shillien_saint" && excludedSkillIdsForShillienSaint.has(id)) {
        return;
      }
      
      const set = allowedLevels.get(id) || new Set<number>();
      (sk.levels || []).forEach((lvl: any) => {
        if (lvl && typeof lvl.level === "number") set.add(lvl.level);
      });
      allowedLevels.set(id, set);
    });
  });

  const result: SkillDefinition[] = [];
  allowedLevels.forEach((levelsSet, id) => {
    const base = canonical[id];
    if (!base) return;

    let filteredLevels = (base.levels || []).filter((lvl: any) => levelsSet.has(lvl.level));
    
    // Для Rogue (1-ша професія, 20-40 лвл) фільтруємо рівні за requiredLevel <= 40
    if (pid === "human_fighter_rogue") {
      filteredLevels = filteredLevels.filter((lvl: any) => 
        lvl.requiredLevel !== undefined && lvl.requiredLevel <= 40
      );
    }
    
      // Для Hawkeye (2-га професія, 40-76 лвл) фільтруємо рівні за requiredLevel >= 40 && <= 76
      // Але також показуємо скіли з Rogue (requiredLevel <= 40)
      if (pid === "human_fighter_hawkeye") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 76
        );
      }
      
      // Для TreasureHunter (2-га професія, 40-74 лвл) фільтруємо рівні за requiredLevel >= 40 && <= 74
      // Але також показуємо скіли з Rogue (requiredLevel <= 40)
      if (pid === "human_fighter_treasure_hunter") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 74
        );
      }
      
      // Для Sagittarius (3-тя професія, 76-78 лвл) показуємо скіли з усіх попередніх професій
      // Rogue (<= 40), Hawkeye (40-76), Sagittarius (76-78)
      if (pid === "human_fighter_sagittarius") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 78
        );
      }
      
      // Для Adventurer (3-тя професія, 76-78 лвл) показуємо скіли з усіх попередніх професій
      // Rogue (<= 40), TreasureHunter (40-74), Adventurer (76-78)
      if (pid === "human_fighter_adventurer") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 78
        );
      }
      
      // Для Orc Fighter (базова професія, 1-20 лвл) фільтруємо рівні за requiredLevel <= 20
      if (pid === "orc_fighter") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 20
        );
      }
      
      // Для Orc Raider (1-ша професія, 20-40 лвл) показуємо скіли з усіх попередніх професій
      // Orc Fighter (<= 20), Orc Raider (20-40)
      if (pid === "orc_fighter_raider") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 40
        );
      }
      
      // Для Destroyer (2-га професія, 40-76 лвл) показуємо скіли з усіх попередніх професій
      // Orc Fighter (<= 20), Orc Raider (20-40), Destroyer (40-76)
      if (pid === "orc_fighter_destroyer") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 76
        );
      }
      if (pid === "orc_fighter_titan") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 78
        );
      }
      if (pid === "orc_fighter_monk") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 36
        );
      }
      if (pid === "orc_fighter_tyrant") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 74
        );
      }
      if (pid === "orc_fighter_grand_khavatari") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 79
        );
      }
      
      // Dwarven Fighter chain
      // Для базової професії (1-20 лвл) фільтруємо рівні за requiredLevel <= 20
      if (pid === "dwarven_fighter") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 20
        );
      }
      // Для Artisan (1-ша професія, 20-36 лвл) показуємо скіли з усіх попередніх професій
      // Dwarven Fighter (<= 20), Artisan (20-36)
      if (pid === "dwarven_fighter_artisan") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 36
        );
      }
      // Для Warsmith (2-га професія, 40-74 лвл) показуємо скіли з усіх попередніх професій
      // Dwarven Fighter (<= 20), Artisan (20-36), Warsmith (40-74)
      if (pid === "dwarven_fighter_warsmith") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 74
        );
      }
      // Для Maestro (3-тя професія, 76-78 лвл) показуємо скіли з усіх попередніх професій
      // Dwarven Fighter (<= 20), Artisan (20-36), Warsmith (40-74), Maestro (76-78)
      if (pid === "dwarven_fighter_maestro") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 78
        );
      }
      // Для Scavenger (1-ша професія, 20-40 лвл) показуємо скіли з усіх попередніх професій
      // Dwarven Fighter (<= 20), Scavenger (20-40)
      if (pid === "dwarven_fighter_scavenger") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 40
        );
      }
      // Для Bounty Hunter (2-га професія, 40+ лвл) показуємо скіли з усіх попередніх професій
      // Dwarven Fighter (<= 20), Scavenger (20-40), Bounty Hunter (40+)
      if (pid === "dwarven_fighter_bounty_hunter") {
        // Не фільтруємо за requiredLevel - показуємо всі скіли з попередніх професій
        // filteredLevels залишається як є (всі рівні з попередніх професій)
      }
      
      // Dark Fighter chain
      // Для базової професії (1-20 лвл) фільтруємо рівні за requiredLevel <= 20
      if (pid === "dark_fighter") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 20
        );
      }
      // Для Assassin (1-ша професія, 20-40 лвл) показуємо скіли з усіх попередніх професій
      // Dark Fighter (<= 20), Assassin (20-40)
      if (pid === "dark_fighter_assassin") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 40
        );
      }
      // Для Phantom Ranger (2-га професія, 40-74 лвл) показуємо скіли з усіх попередніх професій
      // Dark Fighter (<= 20), Assassin (20-40), Phantom Ranger (40-74)
      if (pid === "dark_fighter_phantom_ranger") {
        filteredLevels = filteredLevels.filter((lvl: any) =>
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 74
        );
      }
      // Для Ghost Sentinel (3-тя професія, 76-78 лвл) показуємо скіли з усіх попередніх професій
      // Dark Fighter (<= 20), Assassin (20-40), Phantom Ranger (40-74), Ghost Sentinel (76-78)
      if (pid === "dark_fighter_ghost_sentinel") {
        filteredLevels = filteredLevels.filter((lvl: any) =>
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 78
        );
      }
      // Для Palus Knight (1-ша професія, 20-40 лвл) показуємо скіли з усіх попередніх професій
      // Dark Fighter (<= 20), Palus Knight (20-40)
      if (pid === "dark_fighter_palus_knight") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 40
        );
      }
      // Для Shillien Knight (2-га професія, 40-76 лвл) показуємо скіли з усіх попередніх професій
      // Dark Fighter (<= 20), Palus Knight (20-40), Shillien Knight (40-76)
      if (pid === "dark_fighter_shillien_knight") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 76
        );
      }
      // Для Shillien Templar (3-тя професія, 76-78 лвл) показуємо скіли з усіх попередніх професій
      // Dark Fighter (<= 20), Palus Knight (20-40), Shillien Knight (40-76), Shillien Templar (76-78)
      if (pid === "dark_fighter_shillien_templar") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 78
        );
      }
      // Для Bladedancer (2-га професія, 40-74 лвл) показуємо скіли з усіх попередніх професій
      // Dark Fighter (<= 20), Palus Knight (20-40), Bladedancer (40-74)
      if (pid === "dark_fighter_bladedancer") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 74
        );
      }
      // Для Spectral Dancer (3-тя професія, 76-78 лвл) показуємо скіли з усіх попередніх професій
      // Dark Fighter (<= 20), Palus Knight (20-40), Bladedancer (40-74), Spectral Dancer (76-78)
      if (pid === "dark_fighter_spectral_dancer") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 78
        );
      }
      
      // Elven Fighter chain
      // Для базової професії (1-20 лвл) фільтруємо рівні за requiredLevel <= 20
      if (pid === "elven_fighter") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 20
        );
      }
      // Для Elven Knight (1-ша професія, 20-40 лвл) показуємо скіли з усіх попередніх професій
      // Elven Fighter (<= 20), Elven Knight (20-40)
      if (pid === "elven_fighter_elven_knight") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 40
        );
      }
      // Для Swordsinger (2-га професія, 40-74 лвл) показуємо скіли з усіх попередніх професій
      // Elven Fighter (<= 20), Elven Knight (20-40), Swordsinger (40-74)
      if (pid === "elven_fighter_swordsinger") {
        filteredLevels = filteredLevels.filter((lvl: any) => 
          lvl.requiredLevel !== undefined && lvl.requiredLevel <= 74
        );
      }
    
    if (!filteredLevels.length) return;
    
    // Спеціальна обробка для skill_1229 - різні скіли для Warcryer (Chant of Life) та ShillienElder (Wild Magic)
    // Для Orc Mystic професій виключаємо ShillienElder версію (Wild Magic)
    // Для Dark Mystic професій виключаємо Warcryer версію (Chant of Life)
    if (id === 1229) {
      const isOrcMysticProfession = pid && (
        pid.startsWith("orc_mystic_") || pid === "orc_mystic_base"
      );
      const isDarkMysticProfession = pid && (
        pid.startsWith("dark_mystic_") || pid === "dark_mystic_base"
      );
      
      // Перевіряємо code скіла в canonical (після об'єднання)
      if (isOrcMysticProfession && base.code === "DME_1229") {
        // Для Orc Mystic - виключаємо ShillienElder версію (Wild Magic)
        console.log(`[getSkillsForProfession] ⚠️ Skill 1229 - виключаємо ShillienElder версію (Wild Magic) для Orc Mystic професії: ${pid}`);
        return;
      }
      if (isDarkMysticProfession && base.code === "WC_1229") {
        // Для Dark Mystic - виключаємо Warcryer версію (Chant of Life)
        console.log(`[getSkillsForProfession] ⚠️ Skill 1229 - виключаємо Warcryer версію (Chant of Life) для Dark Mystic професії: ${pid}`);
        return;
      }
    }
    
    // Спеціальна обробка для skill_1335 - різні скіли для Warcryer (Chant of Fortitude) та HumanMystic/Cardinal (Mass Resurrection)
    // Для Orc Mystic професій виключаємо HumanMystic версію (Mass Resurrection)
    // Для Human Mystic професій виключаємо Warcryer версію (Chant of Fortitude)
    if (id === 1335) {
      const isOrcMysticProfession = pid && (
        pid.startsWith("orc_mystic_") || pid === "orc_mystic_base"
      );
      const isHumanMysticProfession = pid && (
        pid.startsWith("human_mystic_") || pid === "human_mystic_base"
      );
      
      // Перевіряємо code скіла в canonical (після об'єднання)
      if (isOrcMysticProfession && (base.code === "HM_1335" || base.name === "Mass Resurrection")) {
        // Для Orc Mystic - виключаємо HumanMystic версію (Mass Resurrection)
        console.log(`[getSkillsForProfession] ⚠️ Skill 1335 - виключаємо HumanMystic версію (Mass Resurrection) для Orc Mystic професії: ${pid}`);
        return;
      }
      if (isHumanMysticProfession && (base.code === "WC_1335" || base.name === "Chant of Fortitude")) {
        // Для Human Mystic - виключаємо Warcryer версію (Chant of Fortitude)
        console.log(`[getSkillsForProfession] ⚠️ Skill 1335 - виключаємо Warcryer версію (Chant of Fortitude) для Human Mystic професії: ${pid}`);
        return;
      }
    }
    
    // Спеціальна обробка для skill_1311 - різні скіли для Warcryer (Chant of Strength) та HumanMystic/Bishop (Body of Avatar)
    // Для Orc Mystic професій виключаємо HumanMystic версію (Body of Avatar)
    // Для Human Mystic професій виключаємо Warcryer версію (Chant of Strength)
    if (id === 1311) {
      const isOrcMysticProfession = pid && (
        pid.startsWith("orc_mystic_") || pid === "orc_mystic_base"
      );
      const isHumanMysticProfession = pid && (
        pid.startsWith("human_mystic_") || pid === "human_mystic_base"
      );
      
      // Перевіряємо code скіла в canonical (після об'єднання)
      if (isOrcMysticProfession && (base.code === "HM_1311" || base.name === "Body of Avatar")) {
        // Для Orc Mystic - виключаємо HumanMystic версію (Body of Avatar)
        console.log(`[getSkillsForProfession] ⚠️ Skill 1311 - виключаємо HumanMystic версію (Body of Avatar) для Orc Mystic професії: ${pid}`);
        return;
      }
      if (isHumanMysticProfession && (base.code === "WC_1311" || base.name === "Chant of Strength")) {
        // Для Human Mystic - виключаємо Warcryer версію (Chant of Strength)
        console.log(`[getSkillsForProfession] ⚠️ Skill 1311 - виключаємо Warcryer версію (Chant of Strength) для Human Mystic професії: ${pid}`);
        return;
      }
    }
    
    // Спеціальна обробка для skill_1363 - тільки для Doomcryer (Chant of Victory)
    // Warcryer НЕ має цього скіла
    if (id === 1363) {
      const isWarcryerProfession = pid === "orc_mystic_warcryer";
      
      // Для Warcryer - завжди виключаємо Chant of Victory (він тільки для Doomcryer)
      if (isWarcryerProfession) {
        console.log(`[getSkillsForProfession] ⚠️ Skill 1363 - виключаємо Chant of Victory для Warcryer професії (він тільки для Doomcryer): ${pid}`);
        return;
      }
    }
    
    // Спеціальна обробка для Elven Wizard - виключаємо скіли з інших професій
    if (pid === "elven_mystic_elven_wizard") {
      // Skill 1225: Solar Spark (EW_1225) для Elven Wizard, Summon Mew the Cat (HM_1225) для HumanMystic/Wizard
      if (id === 1225 && (base.code !== "EW_1225" || base.name === "Summon Mew the Cat")) {
        console.log(`[getSkillsForProfession] ⚠️ Skill 1225 - виключаємо ${base.code || "unknown"} версію (${base.name}) для Elven Wizard (потрібна EW_1225 - Solar Spark)`);
        return;
      }
      // Skill 1226: Summon Unicorn Boxer (EW_1226) для Elven Wizard, Greater Empower (DME_1226) для DarkMystic/ShillienElder
      if (id === 1226 && (base.code !== "EW_1226" || base.name === "Greater Empower")) {
        console.log(`[getSkillsForProfession] ⚠️ Skill 1226 - виключаємо ${base.code || "unknown"} версію (${base.name}) для Elven Wizard (потрібна EW_1226 - Summon Unicorn Boxer)`);
        return;
      }
      // Skill 1230: Bright Servitor (EW_1230) для Elven Wizard, Prominence (HM_1230) для HumanMystic/Sorcerer
      if (id === 1230 && base.code !== "EW_1230") {
        console.log(`[getSkillsForProfession] ⚠️ Skill 1230 - виключаємо ${base.code || "unknown"} версію для Elven Wizard (потрібна EW_1230)`);
        return;
      }
      // Skill 1189: Resist Aqua (EW_1189) для Elven Wizard, Resist Wind (HM_1189/DME_1189) для інших професій
      if (id === 1189 && base.code !== "EW_1189") {
        console.log(`[getSkillsForProfession] ⚠️ Skill 1189 - виключаємо ${base.code || "unknown"} версію для Elven Wizard (потрібна EW_1189)`);
        return;
      }
      // Виключаємо скіли з інших професій (HumanMystic, DarkMystic), які не мають бути в Elven Wizard
      if (base.code && (base.code.startsWith("HM_") || base.code.startsWith("DME_") || base.code.startsWith("DM_"))) {
        // Перевіряємо, чи є Elven Wizard версія в модулях
        const elvenWizardSkill = modules
          .flatMap((m) => Object.values(m || {}))
          .find((sk: any) => sk?.id === id && sk?.code && sk.code.startsWith("EW_"));
        if (!elvenWizardSkill) {
          // Якщо немає Elven Wizard версії, виключаємо скіл
          console.log(`[getSkillsForProfession] ⚠️ Skill ${id} (${base.name}) - виключаємо ${base.code} версію для Elven Wizard (немає EW_ версії)`);
          return;
        }
      }
    }
    
    // Спеціальна обробка для Spellsinger - виключаємо скіли з інших професій
    if (pid === "elven_mystic_spellsinger") {
      // Skill 217: Clear Mind (ES_0217) для Spellsinger, Sword Blunt Mastery для фізичних професій
      // Виключаємо всі версії Sword Blunt Mastery (EK_, SS_, PK_, SK_, HK_, тощо), залишаємо тільки Clear Mind (ES_0217)
      if (id === 217 && (base.name === "Sword Blunt Mastery" || (base.code && !base.code.startsWith("ES_")))) {
        console.log(`[getSkillsForProfession] ⚠️ Skill 217 - виключаємо ${base.code || 'unknown'} версію для Spellsinger (потрібна Clear Mind ES_0217)`);
        return;
      }
      // Skill 249: Fast HP Recovery (ES_0249) для Spellsinger, Weapon Mastery (DM_0249/HM_0249) для інших професій
      if (id === 249 && base.name === "Weapon Mastery") {
        console.log(`[getSkillsForProfession] ⚠️ Skill 249 - виключаємо Weapon Mastery версію для Spellsinger (потрібна Fast HP Recovery)`);
        return;
      }
      // Skill 1225: тільки для Spellsinger (якщо є), виключаємо HM_1225 (Summon Mew the Cat)
      if (id === 1225 && base.code && base.code.startsWith("HM_")) {
        console.log(`[getSkillsForProfession] ⚠️ Skill 1225 - виключаємо ${base.code} версію для Spellsinger (Summon Mew the Cat)`);
        return;
      }
      // Skill 1226: тільки для Spellsinger (якщо є), виключаємо DME_1226 (Greater Empower)
      if (id === 1226 && base.code && base.code.startsWith("DME_")) {
        console.log(`[getSkillsForProfession] ⚠️ Skill 1226 - виключаємо ${base.code} версію для Spellsinger (Greater Empower)`);
        return;
      }
      // Skill 1230: тільки для Spellsinger (якщо є), виключаємо HM_1230 (Prominence)
      if (id === 1230 && base.code && base.code.startsWith("HM_")) {
        console.log(`[getSkillsForProfession] ⚠️ Skill 1230 - виключаємо ${base.code} версію для Spellsinger (Prominence)`);
        return;
      }
      // Skill 1189: тільки для Spellsinger (ES_1189), виключаємо HM_1189/DME_1189 (Resist Wind)
      if (id === 1189 && base.code && (base.code.startsWith("HM_") || base.code.startsWith("DME_"))) {
        console.log(`[getSkillsForProfession] ⚠️ Skill 1189 - виключаємо ${base.code} версію для Spellsinger (Resist Wind)`);
        return;
      }
      // Виключаємо скіли з інших професій (HumanMystic, DarkMystic), які не мають бути в Spellsinger
      if (base.code && (base.code.startsWith("HM_") || base.code.startsWith("DME_") || base.code.startsWith("DM_"))) {
        // Перевіряємо, чи є Spellsinger версія в модулях
        const spellsingerSkill = modules
          .flatMap((m) => Object.values(m || {}))
          .find((sk: any) => sk?.id === id && sk?.code && sk.code.startsWith("ES_"));
        if (!spellsingerSkill) {
          // Якщо немає Spellsinger версії, виключаємо скіл
          console.log(`[getSkillsForProfession] ⚠️ Skill ${id} (${base.name}) - виключаємо ${base.code} версію для Spellsinger (немає ES_ версії)`);
          return;
        }
      }
    }
    
    // Спеціальна обробка для Light Armor Mastery (skill 227) для Rogue
    const skillData: SkillDefinition = { ...base, levels: filteredLevels };
    if (id === 227) {
      console.log(`[getSkillsForProfession] 🔍 Skill 227 знайдено:`, {
        pid,
        baseIcon: base.icon,
        skillDataIcon: skillData.icon,
        isRogue: pid === "human_fighter_rogue"
      });
      if (pid === "human_fighter_rogue") {
        skillData.icon = "/skills/skill0233.gif";
        console.log(`[getSkillsForProfession] ✅ Skill 227 для Rogue - встановлено іконку: /skills/skill0233.gif`);
      }
    }
    
    // Спеціальна обробка для Guts (skill 139) для OrcRaider
    if (id === 139) {
      console.log(`[getSkillsForProfession] 🔍 Skill 139 знайдено:`, {
        pid,
        baseIcon: base.icon,
        skillDataIcon: skillData.icon,
        baseCode: base.code,
        isOrcRaider: pid === "orc_fighter_raider"
      });
      if (pid === "orc_fighter_raider") {
        // Перевіряємо, чи є OrcRaider версія в модулях
        const orcRaiderSkill139 = modules
          .flatMap((m) => Object.values(m || {}))
          .find((sk: any) => sk?.id === 139 && sk?.code === "OR_0139");
        if (orcRaiderSkill139 && orcRaiderSkill139.icon) {
          skillData.icon = orcRaiderSkill139.icon;
          console.log(`[getSkillsForProfession] ✅ Skill 139 (Guts) для OrcRaider - встановлено іконку: ${orcRaiderSkill139.icon}`);
        }
      }
    }
    
    // Спеціальна обробка для skill_0172 (Create Item/Common Craft) - для Dwarven Fighter виключаємо HumanMystic версію
    if (id === 172) {
      const isDwarvenFighterProfession = pid && (
        pid.startsWith("dwarven_fighter")
      );
      
      // Для Dwarven Fighter - виключаємо HumanMystic версію (Common Craft), якщо вона називається "Common Craft"
      if (isDwarvenFighterProfession && (base.code === "HM_0172" || (base.name === "Common Craft" && base.code !== "DF_0172"))) {
        // Перевіряємо, чи є DF_0172 версія в модулях
        const dfSkill172 = modules
          .flatMap((m) => Object.values(m || {}))
          .find((sk: any) => sk?.id === 172 && sk?.code === "DF_0172");
        if (dfSkill172) {
          // Використовуємо DF_0172 версію замість HM_0172
          skillData.name = dfSkill172.name;
          skillData.description = dfSkill172.description;
          skillData.icon = dfSkill172.icon;
          skillData.code = dfSkill172.code;
          skillData.levels = dfSkill172.levels || [];
          console.log(`[getSkillsForProfession] 🔧 Skill 172 для Dwarven Fighter - використовуємо DF_0172 версію (Create Item) замість HM_0172 (Common Craft)`);
        } else {
          // Якщо немає DF_0172, виключаємо HM_0172
          console.log(`[getSkillsForProfession] ⚠️ Skill 172 - виключаємо HM_0172 версію (Common Craft) для Dwarven Fighter професії: ${pid}`);
          return;
        }
      }
    }
    
    // Спеціальна обробка для skill_1322 (Common Craft) - для Dwarven Fighter використовуємо тільки DF_1322
    if (id === 1322) {
      const isDwarvenFighterProfession = pid && (
        pid.startsWith("dwarven_fighter")
      );
      
      // Для Dwarven Fighter - використовуємо тільки DF_1322 версію
      if (isDwarvenFighterProfession && base.code !== "DF_1322") {
        // Перевіряємо, чи є DF_1322 версія в модулях
        const dfSkill1322 = modules
          .flatMap((m) => Object.values(m || {}))
          .find((sk: any) => sk?.id === 1322 && sk?.code === "DF_1322");
        if (dfSkill1322) {
          // Використовуємо DF_1322 версію
          skillData.name = dfSkill1322.name;
          skillData.description = dfSkill1322.description;
          skillData.icon = dfSkill1322.icon;
          skillData.code = dfSkill1322.code;
          skillData.levels = dfSkill1322.levels || [];
          console.log(`[getSkillsForProfession] 🔧 Skill 1322 для Dwarven Fighter - використовуємо DF_1322 версію (Common Craft)`);
        } else {
          // Якщо немає DF_1322, виключаємо інші версії
          console.log(`[getSkillsForProfession] ⚠️ Skill 1322 - виключаємо ${base.code || "unknown"} версію для Dwarven Fighter професії: ${pid}`);
          return;
        }
      }
    }
    
    result.push(skillData);
  });

  console.log(`[getSkillsForProfession] ✅ Результат:`, {
    professionId,
    totalSkills: result.length,
    skillIds: result.map(s => s.id).slice(0, 20), // Перші 20 ID
    skillNames: result.map(s => s.name).slice(0, 10), // Перші 10 назв
  });

  return result;
}

