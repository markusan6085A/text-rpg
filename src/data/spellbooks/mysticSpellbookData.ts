/**
 * Книги заклинань для перших рівнів магічних скілів (наближено до L2 Interlude).
 * Дроп тільки з убитих мобів, поки скіл ще не вивчений (0 → перший рівень).
 */
export type MysticSpellbookTierConfig = {
  skillId: number;
  /** Рівень скілу після вивчення (перший тір у дереві). */
  targetLevel: number;
  /** L2 item id — іконка: /public/items/drops/spellbooks/l2dop-by-itemid/{l2ItemId}.jpg */
  l2ItemId: number;
  /** Назва предмета в інвентарі. */
  bookName: string;
  /** Ключ у itemsDB */
  bookItemId: string;
  /** Частина id або назви моба (lowercase substring). */
  mobPatterns: string[];
  /** Шанс дропу при підходящому мобі (один сліт на вбивство, макс. 1 книга). */
  dropChance: number;
  /** Підказка для гравця (де фармити). */
  huntHintRu: string;
};

export const MYSTIC_SPELLBOOK_TIERS: MysticSpellbookTierConfig[] = [
  {
    skillId: 1011,
    targetLevel: 1,
    l2ItemId: 1152,
    bookName: "Spellbook: Heal",
    bookItemId: "l2_dop_sb_1152",
    mobPatterns: ["goblin", "fox", "keltir"],
    dropChance: 0.28,
    huntHintRu: "Глудин / вокруг деревень: гоблины, лисы, кабаны.",
  },
  {
    skillId: 1012,
    targetLevel: 1,
    l2ItemId: 1053,
    bookName: "Spellbook: Cure Poison",
    bookItemId: "l2_dop_sb_1053",
    mobPatterns: ["spider", "rat", "ferret"],
    dropChance: 0.26,
    huntHintRu: "Низкоуровневые зоны: крысы, пауки, хищные животные.",
  },
  {
    skillId: 1015,
    targetLevel: 1,
    l2ItemId: 1050,
    bookName: "Spellbook: Battle Heal",
    bookItemId: "l2_dop_sb_1050",
    mobPatterns: ["orc", "werewolf"],
    dropChance: 0.24,
    huntHintRu: "Орки и оборотни в окрестностях стартовых городов.",
  },
  {
    skillId: 1027,
    targetLevel: 1,
    l2ItemId: 1054,
    bookName: "Spellbook: Group Heal",
    bookItemId: "l2_dop_sb_1054",
    mobPatterns: ["orc", "imp"],
    dropChance: 0.22,
    huntHintRu: "Магические орки и мелкие демоны у дорог.",
  },
  {
    skillId: 1040,
    targetLevel: 1,
    l2ItemId: 1058,
    bookName: "Spellbook: Shield",
    bookItemId: "l2_dop_sb_1058",
    mobPatterns: ["skeleton", "zombie", "undead"],
    dropChance: 0.25,
    huntHintRu: "Некрополис / катакомбы: скелеты и зомби.",
  },
  {
    skillId: 1068,
    targetLevel: 1,
    l2ItemId: 1048,
    bookName: "Spellbook: Mighty",
    bookItemId: "l2_dop_sb_1048",
    mobPatterns: ["orc", "goblin"],
    dropChance: 0.27,
    huntHintRu: "Лагеря гоблинов и орочьи патрули.",
  },
  {
    skillId: 1147,
    targetLevel: 1,
    l2ItemId: 1051,
    bookName: "Spellbook: Vampiric Touch",
    bookItemId: "l2_dop_sb_1051",
    mobPatterns: ["feral", "wolf", "lynx"],
    dropChance: 0.24,
    huntHintRu: "Хищники и звери во внешних полях.",
  },
  {
    skillId: 1164,
    targetLevel: 1,
    l2ItemId: 1056,
    bookName: "Spellbook: Curse: Weakness",
    bookItemId: "l2_dop_sb_1056",
    mobPatterns: ["skeleton", "shade", "lich"],
    dropChance: 0.21,
    huntHintRu: "Нежить и теневые существа.",
  },
  {
    skillId: 1168,
    targetLevel: 1,
    l2ItemId: 1055,
    bookName: "Spellbook: Curse: Poison",
    bookItemId: "l2_dop_sb_1055",
    mobPatterns: ["spider", "arachnid", "stakato"],
    dropChance: 0.23,
    huntHintRu: "Пауки и ядовитые твари.",
  },
  {
    skillId: 1184,
    targetLevel: 1,
    l2ItemId: 1049,
    bookName: "Spellbook: Ice Bolt",
    bookItemId: "l2_dop_sb_1049",
    mobPatterns: ["skeleton", "puma", "dryad"],
    dropChance: 0.26,
    huntHintRu: "Лесной отряд и нежить средних уровней.",
  },
  {
    skillId: 1069,
    targetLevel: 1,
    l2ItemId: 1394,
    bookName: "Spellbook: Sleep",
    bookItemId: "l2_dop_sb_1394",
    mobPatterns: ["sorcerer", "mage", "shaman"],
    dropChance: 0.2,
    huntHintRu: "Кастеры среди орков и партизан: «sorcerer», культисты.",
  },
  {
    skillId: 1078,
    targetLevel: 1,
    l2ItemId: 1399,
    bookName: "Spellbook: Concentration",
    bookItemId: "l2_dop_sb_1399",
    mobPatterns: ["scout", "tracker", "hunter"],
    dropChance: 0.22,
    huntHintRu: "Разведчики и охотничьи отряды у дорог.",
  },
  {
    skillId: 1111,
    targetLevel: 1,
    l2ItemId: 1403,
    bookName: "Spellbook: Summon Kat the Cat",
    bookItemId: "l2_dop_sb_1403",
    mobPatterns: ["sorcerer", "mystic", "witch"],
    dropChance: 0.2,
    huntHintRu: "Враждебные маги в орочьих и культистских лагерях.",
  },
  {
    skillId: 1126,
    targetLevel: 1,
    l2ItemId: 1404,
    bookName: "Spellbook: Servitor Heal",
    bookItemId: "l2_dop_sb_1404",
    mobPatterns: ["warrior", "berserker", "raider"],
    dropChance: 0.21,
    huntHintRu: "Берсерки и рейдеры — редкий дроп служебных книг.",
  },
  {
    skillId: 1127,
    targetLevel: 1,
    l2ItemId: 1405,
    bookName: "Spellbook: Servitor Recharge",
    bookItemId: "l2_dop_sb_1405",
    mobPatterns: ["imp", "succubus", "succub"],
    dropChance: 0.22,
    huntHintRu: "Мелкие демоны и суккубы.",
  },
  {
    skillId: 1144,
    targetLevel: 1,
    l2ItemId: 1406,
    bookName: "Spellbook: Servitor Wind Walk",
    bookItemId: "l2_dop_sb_1406",
    mobPatterns: ["scout", "ranger", "elder"],
    dropChance: 0.19,
    huntHintRu: "Разведчики и старшие враги элитных лагерей.",
  },
  {
    skillId: 1151,
    targetLevel: 1,
    l2ItemId: 1516,
    bookName: "Spellbook: Corpse Life Drain",
    bookItemId: "l2_dop_sb_1516",
    mobPatterns: ["zombie", "ghoul", "corpse"],
    dropChance: 0.23,
    huntHintRu: "Трупная нежить и болотные зомби.",
  },
  {
    skillId: 1157,
    targetLevel: 1,
    l2ItemId: 1517,
    bookName: "Spellbook: Curse of Life Flow",
    bookItemId: "l2_dop_sb_1517",
    mobPatterns: ["lesser", "hound", "grim"],
    dropChance: 0.2,
    huntHintRu: "Тёмные звери и слуги демонов.",
  },
  {
    skillId: 1160,
    targetLevel: 1,
    l2ItemId: 1409,
    bookName: "Spellbook: Slow",
    bookItemId: "l2_dop_sb_1409",
    mobPatterns: ["turtle", "toad", "frog"],
    dropChance: 0.22,
    huntHintRu: "Болотные обитатели и медлительные мобы.",
  },
  {
    skillId: 1167,
    targetLevel: 1,
    l2ItemId: 1410,
    bookName: "Spellbook: Poison Cloud",
    bookItemId: "l2_dop_sb_1410",
    mobPatterns: ["spider", "toad", "serpent"],
    dropChance: 0.24,
    huntHintRu: "Ядовитые пауки и змеи.",
  },
  {
    skillId: 1172,
    targetLevel: 1,
    l2ItemId: 1411,
    bookName: "Spellbook: Burning Aura",
    bookItemId: "l2_dop_sb_1411",
    mobPatterns: ["wyrm", "salamander", "ifrit"],
    dropChance: 0.2,
    huntHintRu: "Огненные твари и элементали огня.",
  },
  {
    skillId: 1181,
    targetLevel: 1,
    l2ItemId: 1052,
    bookName: "Spellbook: Flame Strike",
    bookItemId: "l2_dop_sb_1052",
    mobPatterns: ["gargoyle", "drake", "wyrm"],
    dropChance: 0.21,
    huntHintRu: "Огненные дракониды и гаргульи.",
  },
  {
    skillId: 1220,
    targetLevel: 1,
    l2ItemId: 1372,
    bookName: "Spellbook: Aura Burn",
    bookItemId: "l2_dop_sb_1372",
    mobPatterns: ["sorcerer", "magus", "seer"],
    dropChance: 0.19,
    huntHintRu: "Старшие кастеры — редкий дроп.",
  },
  {
    skillId: 1222,
    targetLevel: 1,
    l2ItemId: 1416,
    bookName: "Spellbook: Curse of Chaos",
    bookItemId: "l2_dop_sb_1416",
    mobPatterns: ["overlord", "tyrant", "prophet"],
    dropChance: 0.18,
    huntHintRu: "Элитные вожди и пророки (высокий лвл).",
  },
  {
    skillId: 1225,
    targetLevel: 1,
    l2ItemId: 1668,
    bookName: "Spellbook: Summon Mew the Cat",
    bookItemId: "l2_dop_sb_1668",
    mobPatterns: ["feline", "cat", "kasha"],
    dropChance: 0.22,
    huntHintRu: "Кошачьи мобы и фелиновые призванные.",
  },
  {
    skillId: 1274,
    targetLevel: 1,
    l2ItemId: 4916,
    bookName: "Spellbook: Energy Bolt",
    bookItemId: "l2_dop_sb_4916",
    mobPatterns: ["elemental", "binder", "oracle"],
    dropChance: 0.18,
    huntHintRu: "Элементали и жрецы природных заклинаний.",
  },
];

const bySkill = new Map<number, MysticSpellbookTierConfig>();
for (const row of MYSTIC_SPELLBOOK_TIERS) {
  bySkill.set(row.skillId, row);
}

export function mysticSpellbookGuildKey(skillId: number, targetLevel: number): string {
  return `${skillId}_${targetLevel}`;
}

export function getMysticSpellbookTier(skillId: number): MysticSpellbookTierConfig | null {
  return bySkill.get(skillId) ?? null;
}

/** Книга потрібна лише для першого вивчення скілу (поточний рівень 0). */
export function getActiveMysticSpellbookRequirement(
  skillId: number,
  currentSkillLevel: number,
  nextLevel: number
): MysticSpellbookTierConfig | null {
  if (currentSkillLevel !== 0) return null;
  const row = bySkill.get(skillId);
  if (!row || row.targetLevel !== nextLevel) return null;
  return row;
}

export function mobMatchesMysticSpellbook(mobId: string, mobName: string, row: MysticSpellbookTierConfig): boolean {
  const hay = `${mobId} ${mobName}`.toLowerCase();
  return row.mobPatterns.some((p) => hay.includes(p.toLowerCase()));
}
