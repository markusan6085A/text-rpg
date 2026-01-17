import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";

/**
 * Перевірка, чи є зброя дворучною
 * Дворучне оружие: списа, посохи, луки, глефи, сокири, дворучні мечі, дворучні дубинки, Зарич, удочки
 */
export function isTwoHandedWeapon(itemId: string | undefined): boolean {
  if (!itemId) return false;
  const def = itemsDBWithStarter[itemId] || itemsDB[itemId];
  if (!def || def.kind !== "weapon") return false;
  
  const name = def.name?.toLowerCase() || "";
  const id = itemId.toLowerCase();
  
  return (
    id === "zariche" ||
    // Списа та алебарди
    name.includes("spear") ||
    name.includes("спис") ||
    name.includes("lance") ||
    name.includes("halberd") ||
    name.includes("алебарда") ||
    name.includes("glaive") ||
    name.includes("глефа") ||
    name.includes("poleaxe") ||
    name.includes("pole") ||
    id.includes("spear") ||
    id.includes("lance") ||
    id.includes("halberd") ||
    id.includes("glaive") ||
    id.includes("poleaxe") ||
    id.includes("pole") ||
    // Посохи
    name.includes("staff") ||
    name.includes("посох") ||
    id.includes("staff") ||
    // Луки
    name.includes("bow") ||
    name.includes("лук") ||
    id.includes("bow") ||
    // Удочки
    name.includes("rod") ||
    name.includes("удочк") ||
    id.includes("rod") ||
    id.includes("_rod") ||
    // Дворучні мечі
    name.includes("two-handed") ||
    name.includes("дворучний") ||
    name.includes("two_handed") ||
    (name.includes("great") && (name.includes("sword") || name.includes("меч"))) ||
    (name.includes("big") && (name.includes("sword") || name.includes("меч"))) ||
    (name.includes("heaven") && name.includes("divider")) ||
    (name.includes("angel") && name.includes("slayer")) ||
    (name.includes("sword") && name.includes("ipos")) ||
    (name.includes("spiritual") && name.includes("eye")) ||
    (name.includes("spell") && name.includes("breaker")) ||
    (name.includes("berserker") && name.includes("blade")) ||
    (name.includes("paagrian") && name.includes("sword")) ||
    (name.includes("baguette") && name.includes("sword")) ||
    id.includes("two_handed") ||
    id.includes("twohanded") || // 🔥 Додано для twohanded_sword (без підкреслення)
    id.includes("great_sword") ||
    id.includes("greatsword") ||
    id.includes("big_sword") ||
    id.includes("bigsword") ||
    // Дворучні дубинки
    (name.includes("great") && (name.includes("club") || name.includes("hammer") || name.includes("mace") || name.includes("axe"))) ||
    (name.includes("big") && (name.includes("club") || name.includes("hammer") || name.includes("mace"))) ||
    (name.includes("heavy") && (name.includes("doom") || name.includes("hammer") || name.includes("axe"))) ||
    (name.includes("war") && (name.includes("hammer") || name.includes("axe"))) ||
    (name.includes("dwarven") && (name.includes("hammer") || name.includes("mace"))) ||
    (name.includes("star") && name.includes("buster")) ||
    (name.includes("basalt") && (name.includes("battlehammer") || name.includes("hammer"))) ||
    (name.includes("ice") && name.includes("storm") && name.includes("hammer")) ||
    (name.includes("art") && name.includes("of") && name.includes("battle") && name.includes("axe")) ||
    (name.includes("dragon") && name.includes("hunter") && name.includes("axe")) ||
    (name.includes("titan") && name.includes("hammer")) ||
    (name.includes("demon") && name.includes("splinter")) ||
    id.includes("great_club") ||
    id.includes("greatclub") ||
    id.includes("big_club") ||
    id.includes("bigclub") ||
    id.includes("heavy_doom") ||
    id.includes("heavydoom") ||
    id.includes("war_hammer") ||
    id.includes("warhammer") ||
    id.includes("dwarven_hammer") ||
    id.includes("dwarvenhammer") ||
    id.includes("star_buster") ||
    id.includes("starbuster") ||
    id.includes("titan_hammer") ||
    id.includes("titanhammer") ||
    id.includes("big_hammer") ||
    id.includes("bighammer") ||
    id.includes("ice_storm") ||
    id.includes("icestorm")
  );
}

/**
 * Обмеження рівня для одягання екіпіровки за грейдами
 */
export function getRequiredLevelForGrade(grade: string | undefined): number {
  if (!grade) return 0; // NG-grade - без обмежень
  
  switch (grade) {
    case "NG": return 0;   // NG-grade - з 1 лвл
    case "D": return 20;   // D-grade - з 20 лвл
    case "C": return 40;   // C-grade - з 40 лвл
    case "B": return 52;   // B-grade - з 52 лвл
    case "A": return 62;   // A-grade - з 62 лвл
    case "S": return 76;   // S-grade - з 76 лвл
    default: return 0;
  }
}
