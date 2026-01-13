import type { SkillDefinition } from "./types";
import type { ProfessionId } from "./professionTypes";

/**
 * Побудова канонічної мапи скілів (один запис на ID) з об'єднаними рівнями
 */
export function buildCanonicalSkills(
  skillModules: Record<ProfessionId, Record<string, SkillDefinition>>
): Record<number, SkillDefinition> {
  const merged: Record<number, SkillDefinition> = {};

  const modules = Object.values(skillModules);
  modules.forEach((m) => {
    Object.values(m || {}).forEach((sk) => {
      if (!sk || typeof sk.id !== "number") return;
      const id = sk.id;
      // Спеціальна обробка для skill_0141 (Weapon Mastery) - для Dwarven Fighter має пріоритет
      if (id === 141 && sk.code === "DF_0141") {
        // Якщо вже є інша версія, замінюємо її на DF_0141
        merged[id] = { ...sk, levels: [...(sk.levels || [])].sort((a, b) => (a.level || 0) - (b.level || 0)) };
        return;
      }
      // Спеціальна обробка для skill_1225 - Elven Wizard версія (Solar Spark) має пріоритет
      if (id === 1225 && sk.code === "EW_1225") {
        // Elven Wizard версія (Solar Spark) - завжди перезаписуємо, навіть якщо вже є HM_1225
        merged[id] = { ...sk, levels: [...(sk.levels || [])].sort((a, b) => (a.level || 0) - (b.level || 0)) };
        console.log(`[buildCanonicalSkills] 🔧 Skill 1225 - використовуємо Elven Wizard версію (Solar Spark), всього ${merged[id].levels.length} рівнів`);
        return;
      }
      // Спеціальна обробка для skill_1226 - Elven Wizard версія (Summon Unicorn Boxer) має пріоритет
      if (id === 1226 && sk.code === "EW_1226") {
        // Elven Wizard версія (Summon Unicorn Boxer) - завжди перезаписуємо, навіть якщо вже є DME_1226
        merged[id] = { ...sk, levels: [...(sk.levels || [])].sort((a, b) => (a.level || 0) - (b.level || 0)) };
        console.log(`[buildCanonicalSkills] 🔧 Skill 1226 - використовуємо Elven Wizard версію (Summon Unicorn Boxer), всього ${merged[id].levels.length} рівнів`);
        return;
      }
      // Спеціальна обробка для skill_0337 - EvasSaint версія (Arcane Power) має пріоритет
      if (id === 337 && sk.code === "ES_0337") {
        // EvasSaint версія (Arcane Power) - завжди перезаписуємо, навіть якщо вже є інші версії
        merged[id] = { ...sk, levels: [...(sk.levels || [])].sort((a, b) => (a.level || 0) - (b.level || 0)) };
        console.log(`[buildCanonicalSkills] 🔧 Skill 337 - використовуємо EvasSaint версію (Arcane Power), всього ${merged[id].levels.length} рівнів`);
        return;
      }
      if (!merged[id]) {
        merged[id] = { ...sk, levels: [...(sk.levels || [])].sort((a, b) => (a.level || 0) - (b.level || 0)) };
        return;
      }

      const base = merged[id];
      // Prefer incoming metadata if base lacks effects/icon/description/powerType
      const hasEffects = Array.isArray(base.effects) && base.effects.length > 0;
      const incomingHasEffects = Array.isArray(sk.effects) && sk.effects.length > 0;
      
      // Спеціальна обробка для Vicious Stance (skill 312) - для Rogue використовуємо тільки critDamage
      if (id === 312 && sk.code === "HF_0312" && incomingHasEffects) {
        // Перевіряємо, чи це версія для Rogue (тільки critDamage, без critRate)
        const hasOnlyCritDamage = sk.effects.length === 1 && 
          sk.effects.some((eff: any) => eff.stat === "critDamage");
        if (hasOnlyCritDamage) {
          base.effects = sk.effects; // Перезаписуємо ефекти версією для Rogue
          console.log(`[buildCanonicalSkills] 🔧 Skill 312 (Vicious Stance) - використовуємо ефекти для Rogue (тільки critDamage)`);
        }
      }
      // Спеціальна обробка для skill_1229 - різні скіли для Warcryer (Chant of Life) та ShillienElder (Wild Magic)
      // Warcryer версія має пріоритет (hpRegen), ShillienElder версія (skillCritRate) не повинна перезаписувати
      else if (id === 1229 && sk.code === "WC_1229" && incomingHasEffects) {
        // Warcryer версія (Chant of Life) - завжди використовуємо її назву та ефекти
        base.name = sk.name; // "Chant of Life"
        base.effects = sk.effects; // hpRegen
        base.description = sk.description;
        console.log(`[buildCanonicalSkills] 🔧 Skill 1229 - використовуємо Warcryer версію (Chant of Life)`);
      } else if (id === 1229 && sk.code === "DME_1229") {
        // ShillienElder версія (Wild Magic) - НЕ перезаписуємо, якщо вже є Warcryer версія
        if (base.code !== "WC_1229") {
          // Тільки якщо Warcryer версія ще не була оброблена
          base.name = sk.name; // "Wild Magic"
          base.effects = sk.effects; // skillCritRate
          base.description = sk.description;
          console.log(`[buildCanonicalSkills] 🔧 Skill 1229 - використовуємо ShillienElder версію (Wild Magic)`);
        } else {
          console.log(`[buildCanonicalSkills] ⚠️ Skill 1229 - ігноруємо ShillienElder версію, вже є Warcryer версія`);
        }
      }
      // Спеціальна обробка для skill_1311 - різні скіли для Warcryer (Chant of Strength) та HumanMystic/Bishop (Body of Avatar)
      // Warcryer версія має пріоритет для Orc Mystic, HumanMystic версія - для Human Mystic
      else if (id === 1311 && sk.code === "WC_1311" && incomingHasEffects) {
        // Warcryer версія (Chant of Strength) - завжди використовуємо її назву та ефекти для Orc Mystic
        base.name = sk.name; // "Chant of Strength"
        base.effects = sk.effects; // str
        base.description = sk.description;
        base.icon = sk.icon; // Зберігаємо іконку
        console.log(`[buildCanonicalSkills] 🔧 Skill 1311 - використовуємо Warcryer версію (Chant of Strength)`);
      } else if (id === 1311 && sk.code === "HM_1311") {
        // HumanMystic версія (Body of Avatar) - НЕ перезаписуємо, якщо вже є Warcryer версія
        if (base.code !== "WC_1311") {
          // Тільки якщо Warcryer версія ще не була оброблена
          base.name = sk.name; // "Body of Avatar"
          base.effects = sk.effects; // maxHp
          base.description = sk.description;
          base.icon = sk.icon; // Зберігаємо іконку
          console.log(`[buildCanonicalSkills] 🔧 Skill 1311 - використовуємо HumanMystic версію (Body of Avatar)`);
        } else {
          console.log(`[buildCanonicalSkills] ⚠️ Skill 1311 - ігноруємо HumanMystic версію, вже є Warcryer версія`);
        }
      }
      // Спеціальна обробка для skill_1335 - різні скіли для Warcryer (Chant of Fortitude) та HumanMystic/Cardinal (Mass Resurrection)
      // Warcryer версія має пріоритет для Orc Mystic, HumanMystic версія - для Human Mystic
      else if (id === 1335 && sk.code === "WC_1335" && incomingHasEffects) {
        // Warcryer версія (Chant of Fortitude) - завжди використовуємо її назву та ефекти для Orc Mystic
        base.name = sk.name; // "Chant of Fortitude"
        base.effects = sk.effects; // pDef, mDef
        base.description = sk.description;
        base.icon = sk.icon; // Зберігаємо іконку
        console.log(`[buildCanonicalSkills] 🔧 Skill 1335 - використовуємо Warcryer версію (Chant of Fortitude)`);
      } else if (id === 1335 && sk.code === "HM_1335") {
        // HumanMystic версія (Mass Resurrection) - НЕ перезаписуємо, якщо вже є Warcryer версія
        if (base.code !== "WC_1335") {
          // Тільки якщо Warcryer версія ще не була оброблена
          base.name = sk.name; // "Mass Resurrection"
          base.effects = sk.effects; // порожній масив
          base.description = sk.description;
          base.icon = sk.icon; // Зберігаємо іконку
          console.log(`[buildCanonicalSkills] 🔧 Skill 1335 - використовуємо HumanMystic версію (Mass Resurrection)`);
        } else {
          console.log(`[buildCanonicalSkills] ⚠️ Skill 1335 - ігноруємо HumanMystic версію, вже є Warcryer версія`);
        }
      }
      // Спеціальна обробка для skill_0141 (Weapon Mastery) - для Dwarven Fighter використовуємо тільки їх версію
      else if (id === 141 && sk.code === "DF_0141") {
        // Dwarven Fighter версія - завжди використовуємо її метадані та рівні, ігноруємо інші версії
        base.name = sk.name;
        base.effects = sk.effects;
        base.description = sk.description;
        base.icon = sk.icon;
        base.code = sk.code; // Зберігаємо код для ідентифікації
        base.levels = [...(sk.levels || [])].sort((a, b) => (a.level || 0) - (b.level || 0));
        console.log(`[buildCanonicalSkills] 🔧 Skill 141 (Weapon Mastery) - використовуємо DF_0141 версію для гномів, всього ${base.levels.length} рівнів`);
      }
      // Ігноруємо інші версії skill_0141 (OrcMystic, Overlord, Warcryer) якщо вже є DF_0141
      else if (id === 141 && base.code === "DF_0141") {
        console.log(`[buildCanonicalSkills] ⚠️ Skill 141 - ігноруємо ${sk.code || "unknown"} версію, вже є DF_0141 версія для гномів`);
        return;
      }
      // Спеціальна обробка для skill_0141 (Weapon Mastery) - для Overlord та Warcryer використовуємо їх версії з рівнями 10-42
      else if (id === 141 && (sk.code === "OL_0141" || sk.code === "WC_0141")) {
        // Overlord/Warcryer версія - завжди використовуємо її метадані та рівні
        base.name = sk.name;
        base.effects = sk.effects;
        base.description = sk.description;
        base.icon = sk.icon;
        base.code = sk.code; // Зберігаємо код для ідентифікації
        // Об'єднуємо рівні: додаємо рівні з Overlord/Warcryer до існуючих
        const existingLevels = base.levels || [];
        const newLevels = sk.levels || [];
        // Об'єднуємо та сортуємо за level
        const allLevels = [...existingLevels, ...newLevels].sort((a, b) => (a.level || 0) - (b.level || 0));
        // Видаляємо дублікати за level (пріоритет новішим рівням - беремо останній)
        const levelMap = new Map<number, typeof allLevels[0]>();
        allLevels.forEach((level) => {
          levelMap.set(level.level || 0, level);
        });
        base.levels = Array.from(levelMap.values()).sort((a, b) => (a.level || 0) - (b.level || 0));
        console.log(`[buildCanonicalSkills] 🔧 Skill 141 (Weapon Mastery) - використовуємо ${sk.code} версію, всього ${base.levels.length} рівнів`);
      }
      // Ігноруємо інші версії skill_0141 (OrcMystic, HumanFighter) якщо вони не DF_0141, OL_0141, WC_0141
      else if (id === 141 && sk.code && !["DF_0141", "OL_0141", "WC_0141"].includes(sk.code)) {
        // Якщо вже є DF_0141, ігноруємо всі інші версії
        if (base.code === "DF_0141") {
          console.log(`[buildCanonicalSkills] ⚠️ Skill 141 - ігноруємо ${sk.code} версію, вже є DF_0141 версія для гномів`);
          return;
        }
        console.log(`[buildCanonicalSkills] ⚠️ Skill 141 - ігноруємо ${sk.code} версію (OrcMystic/HumanFighter)`);
        return;
      }
      // Спеціальна обробка для skill_0142 (Armor Mastery) - для Dwarven Fighter використовуємо тільки їх версію
      else if (id === 142 && sk.code === "DF_0142") {
        // Dwarven Fighter версія - завжди використовуємо її метадані та рівні
        base.name = sk.name;
        base.effects = sk.effects;
        base.description = sk.description;
        base.icon = sk.icon;
        base.code = sk.code; // Зберігаємо код для ідентифікації
        base.levels = [...(sk.levels || [])].sort((a, b) => (a.level || 0) - (b.level || 0));
        console.log(`[buildCanonicalSkills] 🔧 Skill 142 (Armor Mastery) - використовуємо DF_0142 версію для гномів, всього ${base.levels.length} рівнів`);
      }
      // Ігноруємо інші версії skill_0142 (HumanFighter Weapon Mastery) якщо вже є DF_0142
      else if (id === 142 && base.code === "DF_0142") {
        console.log(`[buildCanonicalSkills] ⚠️ Skill 142 - ігноруємо ${sk.code || "unknown"} версію, вже є DF_0142 версія для гномів`);
        return;
      }
      // Спеціальна обробка для skill_0172 (Create Item/Common Craft) - для Dwarven Fighter використовуємо тільки їх версію
      else if (id === 172 && sk.code === "DF_0172") {
        // Dwarven Fighter версія (Create Item) - завжди використовуємо її метадані та рівні
        base.name = sk.name;
        base.effects = sk.effects;
        base.description = sk.description;
        base.icon = sk.icon;
        base.code = sk.code; // Зберігаємо код для ідентифікації
        base.levels = [...(sk.levels || [])].sort((a, b) => (a.level || 0) - (b.level || 0));
        console.log(`[buildCanonicalSkills] 🔧 Skill 172 (Create Item) - використовуємо DF_0172 версію для гномів, всього ${base.levels.length} рівнів`);
      }
      // Ігноруємо інші версії skill_0172 (HumanMystic Common Craft) якщо вже є DF_0172
      else if (id === 172 && base.code === "DF_0172") {
        console.log(`[buildCanonicalSkills] ⚠️ Skill 172 - ігноруємо ${sk.code || "unknown"} версію, вже є DF_0172 версія для гномів`);
        return;
      }
      // Спеціальна обробка для skill_1322 (Common Craft) - для Dwarven Fighter використовуємо тільки їх версію
      else if (id === 1322 && sk.code === "DF_1322") {
        // Dwarven Fighter версія - завжди використовуємо її метадані та рівні
        base.name = sk.name;
        base.effects = sk.effects;
        base.description = sk.description;
        base.icon = sk.icon;
        base.code = sk.code; // Зберігаємо код для ідентифікації
        base.levels = [...(sk.levels || [])].sort((a, b) => (a.level || 0) - (b.level || 0));
        console.log(`[buildCanonicalSkills] 🔧 Skill 1322 (Common Craft) - використовуємо DF_1322 версію для гномів, всього ${base.levels.length} рівнів`);
      }
      // Ігноруємо інші версії skill_1322 якщо вже є DF_1322
      else if (id === 1322 && base.code === "DF_1322") {
        console.log(`[buildCanonicalSkills] ⚠️ Skill 1322 - ігноруємо ${sk.code || "unknown"} версію, вже є DF_1322 версія для гномів`);
        return;
      }
      // Ігноруємо HumanMystic версію skill_1225 (Summon Mew the Cat) якщо вже є EW_1225
      if (id === 1225 && base.code === "EW_1225" && sk.code === "HM_1225") {
        console.log(`[buildCanonicalSkills] ⚠️ Skill 1225 - ігноруємо HumanMystic версію (Summon Mew the Cat), вже є Elven Wizard версія (Solar Spark)`);
        return;
      }
      // Ігноруємо DarkMystic версію skill_1226 (Greater Empower) якщо вже є EW_1226
      if (id === 1226 && base.code === "EW_1226" && sk.code === "DME_1226") {
        console.log(`[buildCanonicalSkills] ⚠️ Skill 1226 - ігноруємо DarkMystic версію (Greater Empower), вже є Elven Wizard версія (Summon Unicorn Boxer)`);
        return;
      }
      // Ігноруємо інші версії skill_0337 (Storm Screamer) якщо вже є ES_0337 (Arcane Power)
      if (id === 337 && base.code === "ES_0337") {
        console.log(`[buildCanonicalSkills] ⚠️ Skill 337 - ігноруємо ${sk.code || "unknown"} версію, вже є EvasSaint версія (Arcane Power)`);
        return;
      }
      // Спеціальна обробка для skill_0146 (Anti Magic) - для Overlord та Warcryer використовуємо їх версії з рівнями 13-45
      else if (id === 146 && (sk.code === "OL_0146" || sk.code === "WC_0146")) {
        // Overlord/Warcryer версія - завжди використовуємо її метадані та рівні
        base.name = sk.name;
        base.effects = sk.effects;
        base.description = sk.description;
        base.icon = sk.icon;
        base.code = sk.code; // Зберігаємо код для ідентифікації
        // Об'єднуємо рівні: додаємо рівні з Overlord/Warcryer до існуючих
        const existingLevels = base.levels || [];
        const newLevels = sk.levels || [];
        // Об'єднуємо та сортуємо за level
        const allLevels = [...existingLevels, ...newLevels].sort((a, b) => (a.level || 0) - (b.level || 0));
        // Видаляємо дублікати за level (пріоритет новішим рівням - беремо останній)
        const levelMap = new Map<number, typeof allLevels[0]>();
        allLevels.forEach((level) => {
          levelMap.set(level.level || 0, level);
        });
        base.levels = Array.from(levelMap.values()).sort((a, b) => (a.level || 0) - (b.level || 0));
        console.log(`[buildCanonicalSkills] 🔧 Skill 146 (Anti Magic) - використовуємо ${sk.code} версію, всього ${base.levels.length} рівнів`);
      }
      // Спеціальна обробка для skill_1363 - тільки для Doomcryer (Chant of Victory)
      // Warcryer НЕ має цього скіла
      else if (id === 1363 && sk.code === "DC_1363" && incomingHasEffects) {
        // Doomcryer версія (Chant of Victory) - завжди використовуємо її назву, ефекти та іконку
        base.name = sk.name; // "Chant of Victory"
        base.effects = sk.effects;
        base.description = sk.description;
        base.icon = sk.icon; // Зберігаємо іконку Doomcryer (/skills/skill1363.gif)
        console.log(`[buildCanonicalSkills] 🔧 Skill 1363 - використовуємо Doomcryer версію (Chant of Victory)`);
      } else if (!hasEffects && incomingHasEffects) {
        base.effects = sk.effects;
      }
      // Перезаписуємо іконку
      // Спеціальна обробка для Light Armor Mastery (skill 227) - завжди використовуємо skill0233.gif для Rogue
      if (id === 227 && sk.code === "HF_0227") {
        base.icon = "/skills/skill0233.gif";
        console.log(`[buildCanonicalSkills] 🔧 Skill 227 (${sk.name}) - встановлено іконку для Rogue: /skills/skill0233.gif`);
      }
      // Спеціальна обробка для Guts (skill 139) - завжди використовуємо іконку з OrcRaider (OR_0139)
      // ВАЖЛИВО: ця перевірка має бути ПЕРЕД загальною логікою для HM_ скілів
      else if (id === 139) {
        // Якщо це OrcRaider версія (OR_0139) - завжди використовуємо її іконку
        if (sk.code === "OR_0139") {
          base.icon = sk.icon;
          console.log(`[buildCanonicalSkills] 🔧 Skill 139 (Guts) - встановлено іконку з OrcRaider: ${sk.icon}`);
        }
        // Якщо це НЕ OrcRaider версія - НЕ перезаписуємо іконку (залишаємо OrcRaider іконку)
        // Це захищає від перезапису іконки іншими професіями (наприклад, якщо ще залишився старий скіл)
      }
      // Спеціальна обробка для skill_0337 - захищаємо іконку ES_0337 від перезапису
      else if (id === 337 && base.code === "ES_0337") {
        // Якщо вже є ES_0337 версія - НЕ перезаписуємо іконку іншими версіями
        // Це захищає від перезапису іконки іншими професіями (SS_0337)
      }
      else if (sk.icon) {
        // Якщо це Wizard скіл (HM_) - завжди використовуємо його іконку
        // АЛЕ не для skill 139 (Guts) та skill 336 (ES_0336) - вони мають свою спеціальну обробку вище
        if (sk.code && sk.code.startsWith("HM_") && id !== 139 && !(id === 337 && base.code === "ES_0337")) {
          base.icon = sk.icon;
        }
        // Інакше перезаписуємо тільки якщо базова іконка порожня або стандартна
        // АЛЕ не для skill 337 з ES_0337 - захищаємо її іконку
        else if (!(id === 337 && base.code === "ES_0337") && (!base.icon || base.icon.includes("skill0000") || base.icon.includes("attack.jpg"))) {
          base.icon = sk.icon;
        }
      }
      if ((!base.description || base.description.length < 4) && sk.description) base.description = sk.description;
      if (!base.powerType && sk.powerType) base.powerType = sk.powerType;
      if (!base.category && sk.category) base.category = sk.category;
      // Перезаписуємо name, якщо він порожній або містить лише пробіли (виправляємо помилки типу "  HP")
      if (sk.name && (!base.name || base.name.trim().length < 2)) {
        base.name = sk.name;
      }

      const existing = Array.isArray(base.levels) ? base.levels : [];
      const incoming = Array.isArray(sk.levels) ? sk.levels : [];
      const dedup = new Map<number, any>();
      
      // 🔍 ДІАГНОСТИКА для Anti Magic (skill 146), Weapon Mastery (skill 142, 249), Fast Spell Casting (228), MP (213), Fast HP Recovery (212)
      if (id === 142 || id === 146 || id === 249 || id === 228 || id === 213 || id === 212) {
        console.log(`[buildCanonicalSkills] Skill ${id} (${base.name}) merging:`, {
          existingLevels: existing.map(l => ({ level: l.level, power: l.power })).slice(0, 20), // Перші 20 рівнів
          incomingLevels: incoming.map(l => ({ level: l.level, power: l.power })),
          baseCode: base.code,
          incomingCode: sk.code,
          baseName: base.name,
          incomingName: sk.name,
          baseIcon: base.icon,
          incomingIcon: sk.icon,
        });
      }
      
      // Спочатку додаємо existing, потім incoming (incoming перезаписує existing для того ж рівня)
      [...existing, ...incoming].forEach((lvl) => {
        if (!lvl || typeof lvl.level !== "number") return;
        if (!dedup.has(lvl.level)) {
          dedup.set(lvl.level, lvl);
        } else {
          // 🔍 ДІАГНОСТИКА: якщо рівень вже є, перезаписуємо (incoming має пріоритет)
          if (id === 142 || id === 146 || id === 228 || id === 213 || id === 212) {
            console.log(`[buildCanonicalSkills] Skill ${id} level ${lvl.level} already exists, overwriting:`, {
              existing: dedup.get(lvl.level),
              incoming: lvl,
            });
          }
          dedup.set(lvl.level, lvl);
        }
      });
      base.levels = Array.from(dedup.values()).sort((a, b) => (a.level || 0) - (b.level || 0));
      
      // 🔍 ДІАГНОСТИКА для Anti Magic, Weapon Mastery, Fast Spell Casting, MP, Fast HP Recovery після об'єднання
      if (id === 142 || id === 146 || id === 249 || id === 228 || id === 213 || id === 212) {
        console.log(`[buildCanonicalSkills] Skill ${id} (${base.name}) final levels:`, {
          totalLevels: base.levels.length,
          levels: base.levels.map(l => ({ level: l.level, power: l.power })),
          level1: base.levels.find(l => l.level === 1),
          level2: base.levels.find(l => l.level === 2),
          level3: base.levels.find(l => l.level === 3),
          effects: base.effects,
          finalIcon: base.icon,
        });
      }
    });
  });

  // Фінальний прохід: гарантуємо, що Wizard іконки завжди використовуються
  // АЛЕ не перезаписуємо іконки для скілів, які мають спеціальну обробку (skill 139, skill 227)
  Object.values(skillModules).forEach((m) => {
    Object.values(m || {}).forEach((sk) => {
      if (!sk || typeof sk.id !== "number" || !sk.icon || !sk.code) return;
      if (!sk.code.startsWith("HM_")) return; // Тільки Wizard скіли
      
      const id = sk.id;
      // Не перезаписуємо іконки для скілів зі спеціальною обробкою
      if (id === 139 || id === 227) return;
      
      const skill = merged[id];
      if (skill && skill.icon !== sk.icon) {
        skill.icon = sk.icon;
      }
    });
  });

  // Фінальна перевірка: гарантуємо правильну іконку для Light Armor Mastery (skill 227) для Rogue
  const skill227 = merged[227];
  if (skill227) {
    // Перевіряємо, чи є Rogue версія цього скіла
    const rogueModule = skillModules["human_fighter_rogue"];
    if (rogueModule) {
      const rogueSkill227 = Object.values(rogueModule).find((sk: any) => sk?.id === 227 && sk?.code === "HF_0227");
      if (rogueSkill227) {
        skill227.icon = "/skills/skill0233.gif";
        console.log(`[buildCanonicalSkills] ✅ Фінальна перевірка: Skill 227 іконка встановлена на /skills/skill0233.gif`);
      }
    }
  }

  // Фінальна перевірка: гарантуємо правильну іконку для Guts (skill 139) для OrcRaider
  const skill139 = merged[139];
  if (skill139) {
    // Перевіряємо, чи є OrcRaider версія цього скіла
    const orcRaiderModule = skillModules["orc_fighter_raider"];
    if (orcRaiderModule) {
      const orcRaiderSkill139 = Object.values(orcRaiderModule).find((sk: any) => sk?.id === 139 && sk?.code === "OR_0139");
      if (orcRaiderSkill139 && orcRaiderSkill139.icon) {
        skill139.icon = orcRaiderSkill139.icon;
        console.log(`[buildCanonicalSkills] ✅ Фінальна перевірка: Skill 139 (Guts) іконка встановлена на ${orcRaiderSkill139.icon}`);
      }
    }
  }

  return merged;
}

/**
 * Додає додаткові скіли (Additional Skills) до канонічної мапи скілів
 */
export function addAdditionalSkillsToCanonical(
  canonical: Record<number, SkillDefinition>,
  additionalSkills: Record<string, SkillDefinition>
): Record<number, SkillDefinition> {
  const addedIds: number[] = [];
  Object.values(additionalSkills || {}).forEach((sk) => {
    if (!sk || typeof sk.id !== "number") return;
    const id = sk.id;
    
    // Додаткові скіли мають пріоритет - завжди перезаписуємо, якщо вже є
    canonical[id] = { ...sk, levels: [...(sk.levels || [])].sort((a, b) => (a.level || 0) - (b.level || 0)) };
    addedIds.push(id);
    console.log(`[addAdditionalSkillsToCanonical] ✅ Додано додатковий скіл: ${sk.name} (ID: ${id}, code: ${sk.code})`);
  });
  
  console.log(`[addAdditionalSkillsToCanonical] 📊 Всього додано додаткових скілів: ${addedIds.length}`, addedIds);
  return canonical;
}

