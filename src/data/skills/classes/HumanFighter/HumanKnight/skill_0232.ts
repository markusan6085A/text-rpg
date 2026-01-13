import { SkillDefinition } from "../../../types";

// Heavy Armor Mastery для HumanKnight (рівні 1-15)
export const skill_0232: SkillDefinition = {
  id: 232,
  code: "HK_0232",
  name: "Heavy Armor Mastery",
  description: "Increases P. Def. when wearing heavy armor.\n\nУвеличивает физ. защиту на 17.7-172.6 (зависит от уровня) при ношении тяжелой брони. Также снижает уязвимость к критическим атакам. Пассивный навык.",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "pDef", mode: "flat" }],
  stackType: "heavy_armor_mastery",
  stackOrder: 1,
  icon: "/skills/skill0232.gif",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1500, mpCost: 0, power: 17.7 },
    { level: 2, requiredLevel: 20, spCost: 1500, mpCost: 0, power: 19.1 },
    { level: 3, requiredLevel: 20, spCost: 1500, mpCost: 0, power: 20.5 },
    { level: 4, requiredLevel: 24, spCost: 3300, mpCost: 0, power: 23.5 },
    { level: 5, requiredLevel: 24, spCost: 3300, mpCost: 0, power: 25.0 },
    { level: 6, requiredLevel: 24, spCost: 3300, mpCost: 0, power: 26.7 },
    { level: 7, requiredLevel: 28, spCost: 4000, mpCost: 0, power: 30.0 },
    { level: 8, requiredLevel: 28, spCost: 4000, mpCost: 0, power: 31.8 },
    { level: 9, requiredLevel: 28, spCost: 4000, mpCost: 0, power: 33.6 },
    { level: 10, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 37.4 },
    { level: 11, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 39.3 },
    { level: 12, requiredLevel: 32, spCost: 8300, mpCost: 0, power: 41.3 },
    { level: 13, requiredLevel: 36, spCost: 13000, mpCost: 0, power: 45.6 },
    { level: 14, requiredLevel: 36, spCost: 13000, mpCost: 0, power: 47.7 },
    { level: 15, requiredLevel: 36, spCost: 13000, mpCost: 0, power: 50.0 },
  ],
};

