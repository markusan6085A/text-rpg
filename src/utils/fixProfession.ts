// Утиліта для автоматичного виправлення професій героїв
// Використовується при завантаженні героя
import { getJSON, setJSON } from "../state/persistence";
import { getDefaultProfessionForKlass, getProfessionDefinition, normalizeProfessionId } from "../data/skills";

export function fixHeroProfession(hero: any): any {
  if (!hero) return hero;

  const race = (hero.race || "").toLowerCase();
  const klass = (hero.klass || "").toLowerCase();
  const currentProfession = (hero.profession || "").toLowerCase();
  const level = hero.level || 1;
  const rawProf = String(hero.profession ?? "").trim();
  const rawKlass = String(hero.klass ?? "").trim();
  const normalizedExisting = normalizeProfessionId(rawProf);
  const normalizedFromKlass = normalizeProfessionId(rawKlass);
  const BASE_PROFESSIONS = new Set([
    "human_fighter",
    "human_mystic_base",
    "dark_fighter",
    "dark_mystic_base",
    "elven_fighter",
    "elven_mystic",
    "orc_fighter",
    "orc_mystic_base",
    "dwarven_fighter",
  ]);

  // Recovery: якщо професію раніше скинуло до base, але klass вже містить валідну advanced професію,
  // повертаємо її з klass, щоб вивчені скіли не "зникали" через фільтр професії.
  if (
    normalizedFromKlass &&
    getProfessionDefinition(normalizedFromKlass) &&
    normalizedFromKlass !== normalizedExisting &&
    (
      !normalizedExisting ||
      !getProfessionDefinition(normalizedExisting) ||
      BASE_PROFESSIONS.has(normalizedExisting)
    )
  ) {
    return { ...hero, profession: normalizedFromKlass };
  }

  // Якщо професія вже валідна (або це валідний label/alias, що мапиться в id) —
  // НЕ робимо "авто-даунгрейд" до базової.
  if (rawProf && normalizedExisting && getProfessionDefinition(normalizedExisting)) {
    if (rawProf !== normalizedExisting) {
      return { ...hero, profession: normalizedExisting };
    }
    return hero;
  }

  // Перевіряємо, чи це Dark Elf
  const isDarkElf = 
    race.includes("dark") || 
    race.includes("тёмный") || 
    race.includes("темный") ||
    race.includes("темний");

  // Перевіряємо, чи це Dwarf
  const isDwarf = 
    race.includes("dwarf") || 
    race.includes("гном") ||
    race.includes("dwarven");

  // Перевіряємо, чи це Mystic
  const isMystic = 
    klass.includes("mystic") || 
    klass.includes("маг") ||
    currentProfession.includes("mystic");

  // Перевіряємо, чи це Fighter
  const isFighter = 
    klass.includes("fighter") || 
    klass.includes("воин") ||
    (!isMystic && !currentProfession.includes("mystic"));

  // ДОДАТКОВА ПЕРЕВІРКА: якщо професія містить human_mystic, але раса - Dark Elf, це помилка
  const hasWrongHumanProfession = 
    isDarkElf && 
    currentProfession.includes("human_mystic");

  // Діагностичне логування
  if (isDarkElf || hasWrongHumanProfession) {
    console.log(`[fixProfession] Діагностика для ${hero.name || "героя"}:`, {
      race: hero.race,
      klass: hero.klass,
      currentProfession: hero.profession,
      level,
      isDarkElf,
      isMystic,
      hasWrongHumanProfession,
    });
  }

  // Якщо це Dark Elf Mystic АБО має неправильну human_mystic професію
  if ((isDarkElf && isMystic) || hasWrongHumanProfession) {
    // Виправляємо ТІЛЬКИ неправильні професії (наприклад, human_mystic_*)
    // НЕ встановлюємо автоматично професію за рівнем - це має робити гравець вручну!
    const needsFix = 
      currentProfession.includes("human_mystic");

    if (needsFix) {
      // Встановлюємо базову професію, якщо була неправильна
      const correctProfession = "dark_mystic_base";
      console.log(`[fixProfession] 🔧 Виправляю неправильну професію для ${hero.name || "героя"}:`, {
        race: hero.race,
        klass: hero.klass,
        level,
        old: hero.profession,
        new: correctProfession,
        isDarkElf,
        isMystic,
      });
      return {
        ...hero,
        profession: correctProfession,
      };
    }
  }

  // Професія збігається з ігровим класом (Fighter/Mystic) — це не L2 job id; інакше GuildScreen не знаходить ланцюжок і скілів
  const GENERIC_CLASS_MARKERS = new Set([
    "fighter",
    "mystic",
    "human_fighter",
    "human_mystic",
    "dark_fighter",
    "dark_mystic",
    "elven_fighter",
    "elven_mystic",
    "orc_fighter",
    "orc_mystic",
    "dwarven_fighter",
    "воин",
    "маг",
  ]);
  if (rawProf && rawKlass && rawProf.toLowerCase() === rawKlass.toLowerCase()) {
    const lower = rawProf.toLowerCase();
    if (GENERIC_CLASS_MARKERS.has(lower)) {
      const defaultProf = getDefaultProfessionForKlass(hero.klass || "", hero.race);
      if (defaultProf) {
        console.log(`[fixProfession] profession === klass (${rawProf}) → базова job id:`, defaultProf, hero.name || "");
        return { ...hero, profession: defaultProf };
      }
    }
  }

  const normPid = normalizeProfessionId(hero.profession);
  if (!rawProf || !getProfessionDefinition(normPid)) {
    const defaultProf = getDefaultProfessionForKlass(hero.klass || "", hero.race);
    if (defaultProf) {
      console.log(`[fixProfession] Порожня або невідома profession → базова з klass/race:`, defaultProf, {
        name: hero.name,
        was: hero.profession,
        klass: hero.klass,
        race: hero.race,
      });
      return { ...hero, profession: defaultProf };
    }
  }

  return hero;
}

// Функція для виправлення всіх героїв в localStorage
export function fixAllHeroProfessions(): void {
  try {
    const accounts = getJSON<any[]>("l2_accounts_v2", []);
    if (!Array.isArray(accounts) || accounts.length === 0) return;

    let fixed = 0;

    accounts.forEach((acc, accIndex) => {
      if (!acc.hero) return;
      
      const fixedHero = fixHeroProfession(acc.hero);
      if (fixedHero !== acc.hero) {
        accounts[accIndex].hero = fixedHero;
        fixed++;
      }
    });

    if (fixed > 0) {
      setJSON("l2_accounts_v2", accounts);
      console.log(`[fixProfession] Виправлено ${fixed} героїв`);
    }
  } catch (error) {
    console.error("[fixProfession] Помилка:", error);
  }
}

