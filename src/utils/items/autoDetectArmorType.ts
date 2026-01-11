// Автоматичне визначення типу броні та грейду за ID предмета
// Використовується для додавання armorType та grade до предметів, які їх не мають

import { itemsDB } from "../../data/items/itemsDB";

/**
 * Автоматично визначає тип броні за ID предмета
 */
export function autoDetectArmorType(itemId: string): "light" | "heavy" | "robe" | null {
  if (!itemId) return null;
  
  const lowerId = itemId.toLowerCase();
  
  // Robe: robe, cloth, linen, magic, karmian, demons (для магів)
  if (lowerId.includes("robe") || lowerId.includes("cloth") || lowerId.includes("linen") || 
      lowerId.includes("magic") || lowerId.includes("karmian") || lowerId.includes("demons") ||
      lowerId.includes("cap_of_mana")) {
    return "robe";
  }
  
  // Light armor: leather, light, chain (включаючи dwarven chain - це light armor)
  if (lowerId.includes("leather") || lowerId.includes("light") || lowerId.includes("chain")) {
    return "light";
  }
  
  // Heavy armor: heavy, iron, plate, steel, wolf (Blue Wolf Set - це важка броня), zubei, blue_wolf
  if (lowerId.includes("heavy") || lowerId.includes("iron") || lowerId.includes("plate") || 
      lowerId.includes("steel") || lowerId.includes("wolf") || lowerId.includes("zubei") ||
      lowerId.includes("blue_wolf")) {
    return "heavy";
  }
  
  return null;
}

/**
 * Автоматично визначає грейд за ID предмета
 * УВАГА: Використовується тільки як fallback, якщо grade не визначено в itemsDB
 */
export function autoDetectGrade(itemId: string): "NG" | "D" | "C" | "B" | "A" | "S" | null {
  if (!itemId) return null;
  
  // Спочатку перевіряємо, чи є предмет в itemsDB з визначеним grade
  const itemDef = itemsDB[itemId];
  if (itemDef?.grade) {
    return itemDef.grade;
  }
  
  const lowerId = itemId.toLowerCase();
  
  // Перевіряємо заточки (scroll) - точні збіги для scroll
  if (lowerId.includes("scroll") || lowerId.includes("ench")) {
    if (lowerId.includes("grade_ng") || lowerId.match(/_ng(?:_|$)/)) return "NG";
    if (lowerId.includes("grade_d") || lowerId.match(/enchant.*_d(?:_|$)/)) return "D";
    if (lowerId.includes("grade_c") || lowerId.match(/enchant.*_c(?:_|$)/)) return "C";
    if (lowerId.includes("grade_b") || lowerId.match(/enchant.*_b(?:_|$)/)) return "B";
    if (lowerId.includes("grade_a") || lowerId.match(/enchant.*_a(?:_|$)/)) return "A";
    if (lowerId.includes("grade_s") || lowerId.match(/enchant.*_s(?:_|$)/)) return "S";
  }
  
  // Перевіряємо префікси (точні префікси на початку) - найнадійніший спосіб
  if (lowerId.startsWith("ng_")) return "NG";
  if (lowerId.startsWith("d_")) return "D";
  if (lowerId.startsWith("c_")) return "C";
  if (lowerId.startsWith("b_")) return "B";
  if (lowerId.startsWith("a_")) return "A";
  if (lowerId.startsWith("s_")) return "S";
  
  // Остання перевірка - точні збіги на кінці (тільки якщо це не частина слова)
  // Виключаємо слова, які закінчуються на ці літери, але не є грейдами
  if (lowerId.match(/[^a-z]_ng$/) && !lowerId.includes("stockings") && !lowerId.includes("shirt") && !lowerId.includes("boots") && !lowerId.includes("gaiters")) return "NG";
  if (lowerId.match(/[^a-z]_d$/) && !lowerId.includes("_shirt") && !lowerId.includes("_gaiters") && !lowerId.includes("_boots") && !lowerId.includes("breastplate") && !lowerId.includes("stockings")) return "D";
  if (lowerId.match(/[^a-z]_c$/) && !lowerId.includes("stockings") && !lowerId.includes("shirt") && !lowerId.includes("boots")) return "C";
  if (lowerId.match(/[^a-z]_b$/) && !lowerId.includes("stockings") && !lowerId.includes("shirt") && !lowerId.includes("boots")) return "B";
  if (lowerId.match(/[^a-z]_a$/) && !lowerId.includes("stockings") && !lowerId.includes("shirt") && !lowerId.includes("boots")) return "A";
  if (lowerId.match(/[^a-z]_s$/) && !lowerId.includes("stockings") && !lowerId.includes("_shirt") && !lowerId.includes("_boots") && !lowerId.includes("breastplate") && !lowerId.includes("gaiters")) return "S";
  
  return null;
}

/**
 * Оновлює функцію getArmorTypeFromEquipment, щоб вона використовувала автоматичне визначення
 * якщо armorType не вказано в itemsDB
 */
export function getArmorTypeWithAutoDetect(itemId: string): "light" | "heavy" | "robe" | null {
  const itemDef = itemsDB[itemId];
  
  // Якщо armorType вказано в itemsDB, використовуємо його
  if (itemDef?.armorType) {
    return itemDef.armorType;
  }
  
  // Інакше використовуємо автоматичне визначення
  return autoDetectArmorType(itemId);
}

