import { SkillDefinition } from "../../../types";

// Shield Mastery - increases shield block rate (continuation from Palus Knight)
export const skill_0153: SkillDefinition = {
  id: 153,
  code: "SK_0153",
  name: "Shield Mastery",
  description: "Shield defense increases. Increases shield block chance when shield is equipped.\n\nУвеличивает защиту щита. Увеличивает шанс блока щитом на 85% при экипировке щита.",
  icon: "/skills/skill0153.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "shieldBlockRate", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 31000, mpCost: 0, power: 85 },
    { level: 4, requiredLevel: 52, spCost: 94000, mpCost: 0, power: 100 },
  ],
};

