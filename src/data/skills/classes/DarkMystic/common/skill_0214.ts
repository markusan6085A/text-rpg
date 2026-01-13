import { SkillDefinition } from "../../../types";

// Mana Recovery - 1 level from XML
// Multiplies MP regen by 1.2 (20% increase)
export const skill_0214: SkillDefinition = {
  id: 214,
  code: "DM_0214",
  name: "Mana Recovery",
  description: "Increases MP recovery speed.\n\nУвеличивает скорость восстановления MP на 20%.",
  icon: "/skills/Skill0214_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "mpRegen", mode: "multiplier", multiplier: 1.2 }], // 1.2 from XML
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 0 },
  ],
};



