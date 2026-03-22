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

  /** Орен (L2): польові моби */
  "Вартовий Околиць Орену": "46.png",
  "Тінь Лісу Мореллін": "20.png",
  "Споровий Шаман": "317.png",
  "Крумський Розбійник": "14.png",
  "Злодій Хреста": "16.png",
  "Пагорбовий Ящір": "45.png",
  "Скелет Руїн Орену": "16.png",
  "Маг Слонової Вежі": "317.png",
  /** Орен: базові імена чемпіонів */
  "Вартовий Околиць": "46.png",
  "Тінь Темного Лісу": "20.png",
  "Король Спор": "6.png",
  "Скелет Круми": "16.png",
  "Лорд Хреста": "53.png",
  "Володар Пагорбів": "46.png",
  "Хранитель Руїн Орену": "46.png",
  "Тінь Слонової Вежі": "29.png",
  "Чемпіон Орену": "31.png",
  /** Орен: рейд-боси та клони */
  "Капітан Оренських Вартових": "46.png",
  "Володар Темного Бору": "20.png",
  "Король Моря Спор": "6.png",
  "Титан Крумських Залів": "12.png",
  "Патріарх Хреста": "53.png",
  "Громила Заборонених Пагорбів": "14.png",
  "Некромант Старого Орену": "317.png",
  "Хранитель Слонової Вежі": "29.png",
  "Страж Брами Орену": "46.png",
  "Тиран Околиць": "32.png",
  "Дракон Оренських Полів": "33.png",
  "Вартовий Мурів": "46.png",
  "Повелитель Стежок": "46.png",
  "Тінь Бору": "20.png",
  "Древній Лісник": "15.png",
  "Король Ворон": "18.png",
  "Страж Моху": "6.png",
  "Тиран Гілок": "32.png",
  "Володар Спор": "6.png",
  "Гриб-Титан": "6.png",
  "Павутинний Лорд": "22.png",
  "Тінь Гнилизни": "20.png",
  "Король Плісняви": "6.png",
  "Крумський Вартовий": "46.png",
  "Титан Залів": "12.png",
  "Дракон Каменю": "33.png",
  "Повелитель Круми": "46.png",
  "Суддя Хреста": "46.png",
  "Тиран Розбійників": "32.png",
  "Король Шибениці": "53.png",
  "Страж Кайданів": "46.png",
  "Вождь Зрадників": "23.png",
  "Титан Пагорбів": "12.png",
  "Кам'яний Гігант": "13.png",
  "Буревій Степу": "33.png",
  "Страж Ущелин": "46.png",
  "Повелитель Вітрів": "46.png",
  "Лорд Некрополю": "53.png",
  "Кістяний Король": "16.png",
  "Тінь Могил": "20.png",
  "Архонт Мертвих": "317.png",
  "Маг Вежі": "317.png",
  "Титан Слонової Кістки": "12.png",
  "Страж Арканів": "46.png",
  "Повелитель Таємниць": "317.png",
  "Дракон Забуття": "33.png",
};

const PREFIX_CHAMP = /^\[(?:Champion|Чемпион|Чемпіон)\]\s+/i;
const PREFIX_RAID = /^Raid Boss:\s*/i;
/** Суфікси імен чемпіонів (як у getGludioL2DopChampions / getAdenL2DopChampions) */
const CHAMP_TAIL =
  /\s+(XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I|I{1,3}V?|Громила|Тиран|Стража)$/i;

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
  /** Годдарт (L2): чемпіони та англ. імена з XML */
  if (s.includes("Гарячих Джерел") || s.includes("Гейзер") || s.includes("Джерел")) return "12.png";
  if (s.includes("Кетра") || s.includes("Пастух Кетра") || s.includes("Валькірія Кетра")) return "5.png";
  if (s.includes("Варки") || s.includes("Варка") || s.includes("Пограничник")) return "11.png";
  if (s.includes("Монастир") || s.includes("Соліни") || s.includes("Архієрей")) return "16.png";
  if (s.includes("Пророк Племен") || s.includes("Племен")) return "32.png";
  if (s.includes("Hot Springs")) return "12.png";
  if (s.startsWith("Grazing")) return "10.png";
  if (s.includes("Ketra") || s.includes("Ketra's")) return "5.png";
  if (s.includes("Varka")) return "11.png";
  if (/Monastic|Monastery|Solina|Silent |Warrior Monk|Pilgrim of Light|Judge of Light/i.test(s))
    return "16.png";
  /** Schuttgart: рейдові імена (англ.) */
  if (/Warden of the Ice|Ice March/i.test(s) && /Warden|March/i.test(s)) return "12.png";
  if (/Lord of the Stakato|Stakato Vanguard$/i.test(s)) return "32.png";
  if (/Broodmother of the Cannibals|Cannibals$/i.test(s)) return "14.png";
  if (/Fallen Pilgrim King|Pilgrim King/i.test(s)) return "16.png";
  if (/Archon of Solina|Solina's Gate/i.test(s)) return "46.png";
  if (/High Confessor|Confessor of Einhasad/i.test(s)) return "317.png";
  if (/Triol's Voice/i.test(s)) return "317.png";
  if (/Keeper of the False Grail|False Grail/i.test(s)) return "29.png";
  if (/Alpha of the Ancient|Ancient Herd/i.test(s)) return "15.png";
  if (/Tyrant of Schuttgart Ridge|Schuttgart Ridge$/i.test(s)) return "32.png";
  /** Schuttgart: титули чемпіонів (до загального Stakato → 22) */
  if (/Frozen\s+March/i.test(s) && /Warden/i.test(s)) return "12.png";
  if (/Stakato\s+Vanguard/i.test(s)) return "32.png";
  if (/Spike Hollow/i.test(s) && /\bLord\b/i.test(s)) return "32.png";
  if (/Cannibal\s+Broodmaster/i.test(s)) return "14.png";
  if (/Monastery\s+Exile/i.test(s)) return "16.png";
  if (/Solina\s+Aspirant/i.test(s)) return "16.png";
  if (/Temple\s+Confessor/i.test(s)) return "317.png";
  if (/Triol\s+Intercessor/i.test(s)) return "317.png";
  if (/Grail\s+Crypt\s+Keeper/i.test(s)) return "29.png";
  if (/Primordial\s+Hunt\s+Leader/i.test(s)) return "15.png";
  if (/Tyrant\s+Ridge\s+Overlord/i.test(s)) return "32.png";
  if (/Schuttgart\s+Elite/i.test(s)) return "46.png";
  /** Stakato / Cannibalistic — різні ролі → різні іконки */
  if (/Stakato|Cannibalistic/i.test(s)) {
    if (/\b(sorcerer|shaman)\b/i.test(s)) return "317.png";
    if (/\bnurse\b/i.test(s)) return "31.png";
    if (/\b(drone|baby)\b/i.test(s)) return "4.png";
    if (/\b(leader|captain|lord)\b/i.test(s)) return "32.png";
    if (/\b(guard|soldier)\b/i.test(s)) return "5.png";
    if (/\bfollower\b/i.test(s)) return "14.png";
    if (/\b(Female|Male)\b/i.test(s) && /Stakato/i.test(s)) return "45.png";
    return "22.png";
  }
  if (/\bCannibal\b/i.test(s)) return "14.png";
  if (/Triol|Ritual|Grail|Confessor|Temple Guard/i.test(s)) return "317.png";
  if (/Tyrannosaur|Pterosaur|Velociraptor|Deinonychus|Ornithomimus|Pachycephalosaurus|Elroki|Strider/i.test(s))
    return "33.png";
  if (s.includes("Окраїнський Громила")) return "58.png";
  if (s.includes("Крумськ")) return "14.png";
  if (s.includes("Споров")) return "6.png";
  if (s.includes("Моря Спор") || (s.includes("Спор") && s.includes("Король"))) return "6.png";
  if (
    /(Хранитель|Страж|Вартовий|Повелитель|Тиран|Лорд|Дракон) Окраїни$/u.test(s)
  ) {
    return "46.png";
  }
  if (s === "Floran Warlord" || s.endsWith(" Warlord")) return "175.png";
  if (s === "Death Sorcerer" || (s.includes("Sorcerer") && !/Stakato/i.test(s))) return "317.png";
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

/**
 * L2 XML часто дає англійські name= — підбираємо /mobs/*.png за ключовими словами.
 * Порядок: від специфічніших шаблонів до загальніших.
 */
export function hintL2EnglishMobIcon(displayName: string): string | undefined {
  const s = displayName.trim();
  if (!s) return undefined;
  const tests: [RegExp, string][] = [
    [/\b(skeleton|zombie|lich|ghoul|corpse|undead|reaper|skeleton\s|grave|wight)\b/i, "16.png"],
    [/\b(dragon|drake|wyrm|serpent\b|lindvior|valakas|antharas)\b/i, "33.png"],
    [/\b(lizardman|lizard\b|stakato|araneid|tarantula|scorpion\b|ant\s|ant\b|spider)\b/i, "22.png"],
    [/\b(snake|medusa|cobra)\b/i, "45.png"],
    [/\b(ketra|varka|silenos|orc\b|ol mahum)\b/i, "5.png"],
    [/\bgoblin\b/i, "3.png"],
    [/\bgremlin\b/i, "1.png"],
    [/\b(imp|fiend)\b/i, "4.png"],
    [/\b(ogre|cyclops|troll|giant\b|grendel)\b/i, "12.png"],
    [/\b(golem|granite|crawler|guardian of|pillar)\b/i, "13.png"],
    [/\b(wolf|fox\b|dog\b|hyena|keltir|jackal)\b/i, "9.png"],
    [/\b(bear|buffalo|bison|yeti|tyrant|bandersnatch|bander|beast\b|dire wolf)\b/i, "15.png"],
    [/\b(rabbit|elpy|hare|rodent)\b/i, "2.png"],
    [/\b(bat\b|vampire)\b/i, "18.png"],
    [/\b(harpy|gargoyle|griffin|wyvern)\b/i, "31.png"],
    [/\b(eye\b|beholder|gazer|observer)\b/i, "28.png"],
    [/\b(shroom|fungus|spore|rot\s+tree)\b/i, "6.png"],
    [/\b(worm|larva|maggot|ooze|slime)\b/i, "20.png"],
    [/\b(doll|puppet|mannequin)\b/i, "28.png"],
    [/\b(dwarf|troglodyte|delu\b|pashika)\b/i, "5.png"],
    [/\b(wisp|magus|witch|shaman|warlock|necromancer|sorcerer)\b/i, "317.png"],
    [/\b(angel|seraph)\b/i, "31.png"],
    [/\b(demon|devil|succubus)\b/i, "317.png"],
    [/\b(plant|treant|root\b|ivy\b|moss)\b/i, "6.png"],
    [/\b(fairy|pixie|sprite)\b/i, "2.png"],
    [/\b(monk|warrior monk|acolyte)\b/i, "16.png"],
    [/\b(grazing|snipe|antelope|deer)\b/i, "10.png"],
    [/\b(hot\s+springs|geyser|spring\b)\b/i, "12.png"],
    [/\b(destroyer|destruction|apocalypse|chimera|oblivion|annihilation)\b/i, "317.png"],
    [/\b(berserker|chieftain|scout|footman|warrior|soldier|elite|captain)\b/i, "5.png"],
    [/\bwarden\b/i, "46.png"],
    [/\bvanguard\b/i, "32.png"],
    [/\b(confessor|intercessor|high priest|layperson|believer)\b/i, "317.png"],
    [/\bkeeper\b/i, "29.png"],
    [/\boverlord\b/i, "32.png"],
    [/\bexile\b/i, "16.png"],
    [/\baspirant\b/i, "16.png"],
    [/\bbroodmaster|broodqueen|brood mother\b/i, "14.png"],
  ];
  for (const [re, file] of tests) {
    if (re.test(s)) return `/mobs/${file}`;
  }
  return undefined;
}

/** NPC template id з `l2dop_12345` або `l2dop_12345_champion_x` */
export function l2dopNpcIdFromMobId(mobId: string | undefined): number | undefined {
  if (!mobId) return undefined;
  const m = /^l2dop_(\d+)/i.exec(mobId);
  return m ? parseInt(m[1], 10) : undefined;
}

const MOB_ICON_SLOT_MAX = 325;

/** Стабільна іконка за L2 NPC id (різні спрайти; уникаємо 98.png-placeholder). */
export function getMobIconFromL2dopNpcId(npcId: number): string {
  let h = Math.imul(npcId, 2654435761) >>> 0;
  let slot = (h % (MOB_ICON_SLOT_MAX - 1)) + 1;
  if (slot >= 98) slot += 1;
  if (slot > MOB_ICON_SLOT_MAX) slot = MOB_ICON_SLOT_MAX;
  return `/mobs/${slot}.png`;
}

/** Fallback, якщо немає мапінгу/heuristic — не завжди одна й та сама «акула» (98.png). */
function fallbackMobIconFromName(displayName: string): string {
  let h = 0;
  const s = displayName.trim();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  let slot = (h % (MOB_ICON_SLOT_MAX - 1)) + 1;
  if (slot >= 98) slot += 1;
  if (slot > MOB_ICON_SLOT_MAX) slot = MOB_ICON_SLOT_MAX;
  return `/mobs/${slot}.png`;
}

function lookupMobIconFromCandidates(candidates: string[]): string | undefined {
  for (const key of candidates) {
    const file = MOB_ICON_MAP[key];
    if (file) return `/mobs/${file}`;
  }
  for (const key of candidates) {
    const h = heuristicMobIcon(key);
    if (h) return `/mobs/${h}`;
  }
  for (const key of candidates) {
    const en = hintL2EnglishMobIcon(key);
    if (en) return en;
  }
  return undefined;
}

/**
 * Іконка за іменем без запасного 98.png (для чемпіонів: спочатку титул, потім база).
 */
export function resolveMobIconFromName(displayName: string): string | undefined {
  const core = stripPrefixes(displayName);
  const candidates = stripChampionSuffixes(core);
  return lookupMobIconFromCandidates(candidates);
}

/** Повертає URL іконки /mobs/N.png або undefined */
export function getMobPublicIconSrc(displayName: string): string | undefined {
  const resolved = resolveMobIconFromName(displayName);
  if (resolved) return resolved;
  const core = stripPrefixes(displayName);
  /** Будь-яка непорожня назва — щоб не лишати «—» на екрані локації */
  if (core.trim().length >= 2) return fallbackMobIconFromName(core);
  return undefined;
}

/** Для рядка моба: пріоритет явного mob.icon, інакше l2dop NPC id, інакше public/mobs */
export function getMobListIconSrc(mob: { id?: string; name: string; icon?: string }): string | undefined {
  if (mob.icon?.trim()) return mob.icon.trim();
  const nid = l2dopNpcIdFromMobId(mob.id);
  if (nid != null) return getMobIconFromL2dopNpcId(nid);
  return getMobPublicIconSrc(mob.name);
}
