// src/data/items/itemsDB.types.ts
// Типи для itemsDB

export interface ItemDefinition {
  id: string;
  name: string;
  kind: string;
  icon: string;
  description: string;
  stats?: any;
  slot: string;
  restoreHp?: number;
  restoreMp?: number;
  restoreCp?: number;
  armorType?: "light" | "heavy" | "robe" | "magic" | "none" | "pet";
  grade?: "NG" | "D" | "C" | "B" | "A" | "S";
}

