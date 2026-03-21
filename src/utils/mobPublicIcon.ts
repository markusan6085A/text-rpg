/**
 * Іконки мобів з public/mobs/*.png для списку локації (коли mob.icon не задано).
 * Мапінг назв — як у грі після нормалізації префіксів [Чемпіон] / Raid Boss:.
 */

const MOB_ICON_MAP: Record<string, string> = {
  Гремлин: "1.png",
  Гоблин: "3.png",
  Гоблін: "3.png",
  Кролик: "2.png",
  Ельпі: "2.png",
  /** Було спільне з гобліном — окремий файл для лучника */
  "Орк Лучник": "59.png",
  Бес: "4.png",
  "Орк Воїн": "5.png",
  "Зелений Гриб": "6.png",
  "Орк Снайпер": "7.png",
  "Орк Лейтенант": "8.png",
  Волк: "9.png",
  Лисичок: "10.png",
  "Тетрарх Орк Турек": "11.png",
  "Орк-Тетрарх": "11.png",
  "Печерний Титан": "12.png",
  "Гранітовий Голем": "13.png",
  Громила: "14.png",
  /** Чемпіон / РБ «Окраїнський Громила» */
  "Окраїнський Громила": "58.png",
  "Красивий Ведмідь": "15.png",
  Скелет: "16.png",
  "Бородатий Шакал": "17.png",
  "Вампірська Летуча Миш": "18.png",
  "Ящір Фелім": "19.png",
  "Болотний Тінь": "20.png",
  "Старий Бес": "21.png",
  "Ящір Лангк": "22.png",
  "Вождь Ящеров Мель": "23.png",
  "Скелет-лучник": "27.png",
  "Глаз Монстра": "28.png",
  "Печерний Лорд": "29.png",
  Тиран: "32.png",
  "Болотний Дракон": "33.png",
  "Ящір-Імператор": "44.png",
  "Ящір-Тиран": "45.png",
  "Хранитель Окраїни": "46.png",
  "Лорд Лугів": "53.png",
  "Скелет-трекер": "68.png",
  "Материй Кельтир": "78.png",
  "Молодой Шакал": "105.png",
  "Розвідчик Ящерів Селу": "135.png",
  "Floran Behemoth": "197.png",
  "Ancient Guardian": "231.png",
  "Floran Overlord": "262.png",
  "Titan Lord": "291.png",
  "Chaos Magus": "317.png",
  "Floran Warlord": "175.png",
  "Death Sorcerer": "317.png",

  Чемпіон: "31.png",
  "Глоріо Чемпіон": "31.png",
  "Аден Чемпіон": "31.png",
  "Орк-Верховний": "5.png",

  /** Базові імена чемпіонів Gludio */
  "Луговий Вождь": "53.png",
  "Рощовий Лорд": "15.png",
  "Руїнний Страх": "20.png",
  /** Базові імена чемпіонів Aden */
  "Окраїнський Страж": "46.png",
  "Долинний Вождь": "53.png",
  "Магічний Тиран": "32.png",
  "Лорд Лугів-Кат": "53.png",
  "Скелет-Лорд": "29.png",
  "Воїняний Повелитель": "46.png",
  "Темний Архонт": "317.png",
  "Фортечний Імператор": "45.png",

  /** РБ-клони Gludio (extras) */
  "Страж Окраїни": "46.png",
  "Вартовий Окраїни": "46.png",
  "Повелитель Окраїни": "46.png",
  "Тиран Окраїни": "46.png",
  "Лорд Окраїни": "46.png",
  "Дракон Окраїни": "46.png",
  "Король Лугів": "53.png",
  "Страж Лугів": "53.png",
  "Дракон Лугів": "33.png",
  "Тиран Лугів": "32.png",
  "Вождь Лугів": "23.png",
  "Дракон Рощі": "33.png",
  "Король Рощі": "15.png",
  "Тиран Рощі": "32.png",
  "Страж Рощі": "46.png",
  "Лорд Рощі": "53.png",
  "Тиран Болота": "32.png",
  "Король Болота": "20.png",
  "Дракон Болота": "33.png",
  "Страж Болота": "46.png",
  "Повелитель Болота": "46.png",
  "Дракон Руїн": "20.png",
  "Страж Руїн": "46.png",
  "Тиран Руїн": "32.png",
  "Король Руїн": "53.png",
  "Вождь Руїн": "23.png",
  "Тиран Ящерів": "45.png",
  "Король Ящерів": "23.png",
  "Страж Ящерів": "46.png",
  "Дракон Ящерів": "33.png",
  "Повелитель Ящерів": "46.png",
  "Король Орків": "11.png",
  "Тиран Орків": "32.png",
  "Страж Орків": "46.png",
  "Вождь Орків": "5.png",
  "Дракон Орків": "33.png",
  "Король Печер": "29.png",
  "Тиран Печер": "32.png",
  "Страж Печер": "46.png",
  "Дракон Печер": "33.png",
  "Повелитель Печер": "46.png",

  /** РБ-клони Aden (extras) */
  "Король Долини": "53.png",
  "Страж Долини": "46.png",
  "Тиран Долини": "32.png",
  "Повелитель Долини": "46.png",
  "Архонт Долини": "317.png",
  "Дракон Долини": "33.png",
  "Тиран Магії": "32.png",
  "Страж Магії": "46.png",
  "Повелитель Магії": "317.png",
  "Тиран Страті": "32.png",
  "Король Страті": "53.png",
  "Дракон Страті": "33.png",
  "Страж Страті": "46.png",
  "Повелитель Страті": "46.png",
  "Дракон Скелетів": "16.png",
  "Страж Скелетів": "46.png",
  "Тиран Скелетів": "32.png",
  "Король Кістей": "29.png",
  "Повелитель Кістей": "46.png",
  "Тиран Воїни": "32.png",
  "Король Воїни": "5.png",
  "Страж Воїни": "46.png",
  "Повелитель Воїни": "46.png",
  "Король Темряви": "20.png",
  "Тиран Темряви": "32.png",
  "Страж Підземелля": "46.png",
  "Архонт Темряви": "317.png",
  "Повелитель Темряви": "46.png",
  "Король Фортеці": "53.png",
  "Тиран Фортеці": "32.png",
  "Дракон Фортеці": "33.png",
  "Повелитель Фортеці": "46.png",
};

const PREFIX_CHAMP = /^\[(?:Champion|Чемпион|Чемпіон)\]\s+/i;
const PREFIX_RAID = /^Raid Boss:\s*/i;
/** Суфікси імен чемпіонів (як у getGludioL2DopChampions / getAdenL2DopChampions) */
const CHAMP_TAIL = /\s+(I{1,3}V?|IV|V|Громила|Тиран|Стража)$/i;

function stripPrefixes(name: string): string {
  let s = name.trim();
  s = s.replace(PREFIX_CHAMP, "").trim();
  s = s.replace(PREFIX_RAID, "").trim();
  return s;
}

function stripChampionSuffixes(name: string): string[] {
  const out: string[] = [];
  let s = name.trim();
  const add = () => {
    if (s && !out.includes(s)) out.push(s);
  };
  add();
  for (let i = 0; i < 6; i++) {
    const next = s.replace(CHAMP_TAIL, "").trim();
    if (next === s || !next) break;
    s = next;
    add();
  }
  return out;
}

/**
 * Евристика для імен без явного ключа (англ. рейди, варіанти назв).
 */
function heuristicMobIcon(normalized: string): string | undefined {
  const s = normalized.trim();
  if (!s) return undefined;
  if (s.includes("Окраїнський Громила")) return "58.png";
  if (
    /(Хранитель|Страж|Вартовий|Повелитель|Тиран|Лорд|Дракон) Окраїни$/u.test(s)
  ) {
    return "46.png";
  }
  if (s === "Floran Warlord" || s.endsWith(" Warlord")) return "175.png";
  if (s === "Death Sorcerer" || s.includes("Sorcerer")) return "317.png";
  if (s.includes("Чемпіон") || s === "Чемпіон") return "31.png";
  if (s.includes("Дракон")) return "33.png";
  if (s.includes("Скелет") || s.includes("Кістей")) return "16.png";
  if (s.includes("Лугів")) return "53.png";
  if (s.includes("Печер")) return "29.png";
  if (s.includes("Болот") || s.includes("Болота")) return "20.png";
  if (s.includes("Рощ")) return "15.png";
  if (s.includes("Руїн")) return "20.png";
  if (s.includes("Ящер") || s.includes("Ящір")) return "45.png";
  if (s.includes("Гоблин") || s.includes("Гоблін")) return "3.png";
  if (s.includes("Орк")) return "5.png";
  if (s.includes("Тиран")) return "32.png";
  if (s.includes("Вождь")) return "23.png";
  if (s.includes("Страж") || s.includes("Повелитель") || s.includes("Архонт")) {
    return "46.png";
  }
  if (s.includes("Король")) return "53.png";
  return undefined;
}

/** Повертає URL іконки /mobs/N.png або undefined */
export function getMobPublicIconSrc(displayName: string): string | undefined {
  const core = stripPrefixes(displayName);
  const candidates = stripChampionSuffixes(core);
  for (const key of candidates) {
    const file = MOB_ICON_MAP[key];
    if (file) return `/mobs/${file}`;
  }
  for (const key of candidates) {
    const h = heuristicMobIcon(key);
    if (h) return `/mobs/${h}`;
  }
  /** Будь-яка непорожня назва — щоб не лишати «—» на екрані локації */
  if (core.trim().length >= 2) return "/mobs/98.png";
  return undefined;
}

/** Для рядка моба: пріоритет явного mob.icon, інакше public/mobs */
export function getMobListIconSrc(mob: { name: string; icon?: string }): string | undefined {
  if (mob.icon?.trim()) return mob.icon.trim();
  return getMobPublicIconSrc(mob.name);
}
