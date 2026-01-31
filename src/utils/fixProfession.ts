// Утиліта для автоматичного виправлення професій героїв
// Використовується при завантаженні героя
import { getJSON, setJSON } from "../state/persistence";
import { getDefaultProfessionForKlass } from "../data/skills";

export function fixHeroProfession(hero: any): any {
  if (!hero) return hero;

  const race = (hero.race || "").toLowerCase();
  const klass = (hero.klass || "").toLowerCase();
  const currentProfession = (hero.profession || "").toLowerCase();
  const level = hero.level || 1;

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
    (currentProfession.includes("human_mystic") || currentProfession.includes("necromancer"));

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
      currentProfession.includes("human_mystic") ||
      currentProfession.includes("necromancer");

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

  // Якщо професія відсутня — виводимо з klass/race
  if (!hero.profession || String(hero.profession).trim() === "") {
    const defaultProf = getDefaultProfessionForKlass(hero.klass || "", hero.race);
    if (defaultProf) {
      console.log(`[fixProfession] Встановлюю базову професію для ${hero.name || "героя"}:`, defaultProf, "(klass:", hero.klass, "race:", hero.race, ")");
      return {
        ...hero,
        profession: defaultProf,
      };
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

