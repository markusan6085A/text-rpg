// src/data/shop/shopTypes.ts

export type ItemGrade = "NG" | "D" | "C" | "B" | "A" | "S";

export interface ShopItem {
  id: string;
  itemId: number; // ID з XML
  name: string;
  grade: ItemGrade;
  type: "weapon" | "armor" | "material" | "consumable" | "recipe" | "jewelry" | "tattoo";
  category: string; // "sword", "staff", "helmet", "armor", etc
  price: number;
  icon?: string;
  stats?: {
    pAtk?: number;
    mAtk?: number;
    pDef?: number;
    mDef?: number;
    pAtkSpd?: number;
    rCrit?: number;
    castSpeed?: number; // Швидкість каста для магічної зброї
    [key: string]: number | undefined;
  };
  bodypart?: string; // "rhand", "lrhand", "head", "chest", etc
  weaponType?: string; // "SWORD", "BLUNT", "BOW", etc
  description?: string;
  soulshots?: number;
  spiritshots?: number;
  restoreHp?: number; // Відновлення HP для зілль
  restoreMp?: number; // Відновлення MP для зілль
  restoreCp?: number; // Відновлення CP для зілль
}

export interface ShopCategory {
  id: string;
  name: string;
  items: ShopItem[];
}

