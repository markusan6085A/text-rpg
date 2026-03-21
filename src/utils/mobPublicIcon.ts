/**
 * Іконки мобів з public/mobs/*.png для списку локації (коли mob.icon не задано).
 * Мапінг назв — як у грі після нормалізації префіксів [Чемпіон] / Raid Boss:.
 */

const MOB_ICON_MAP: Record<string, string> = {
  Гремлин: "1.png",
  Кролик: "2.png",
  Ельпі: "2.png",
  "Орк Лучник": "3.png",
  Бес: "4.png",
  "Орк Воїн": "5.png",
  "Зелений Гриб": "6.png",
  "Орк Снайпер": "7.png",
  "Орк Лейтенант": "8.png",
  Волк: "9.png",
  Лисичок: "10.png",
  "Тетрарх Орк Турек": "11.png",
  "Печерний Титан": "12.png",
  "Гранітовий Голем": "13.png",
  Громила: "14.png",
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

/** Повертає URL іконки /mobs/N.png або undefined */
export function getMobPublicIconSrc(displayName: string): string | undefined {
  const core = stripPrefixes(displayName);
  const candidates = stripChampionSuffixes(core);
  for (const key of candidates) {
    const file = MOB_ICON_MAP[key];
    if (file) return `/mobs/${file}`;
  }
  return undefined;
}

/** Для рядка моба: пріоритет явного mob.icon, інакше public/mobs */
export function getMobListIconSrc(mob: { name: string; icon?: string }): string | undefined {
  if (mob.icon?.trim()) return mob.icon.trim();
  return getMobPublicIconSrc(mob.name);
}
