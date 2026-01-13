import { SkillDefinition } from "../../../types";

// Shield Mastery - increases shield block rate when shield is equipped
export const skill_0153: SkillDefinition = {
  id: 153,
  code: "PK_0153",
  name: "Shield Mastery",
  description: "Shield defense increases. Increases shield block chance when shield is equipped.\n\nУвеличивает защиту щита. Увеличивает шанс блока щитом на 60% (уровень 1) и 70% (уровень 2) при экипировке щита.",
  icon: "/skills/skill0153.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "shieldBlockRate", mode: "flat" }, // Value from level.power (60% and 70%)
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 4700, mpCost: 0, power: 60 },
    { level: 2, requiredLevel: 28, spCost: 13000, mpCost: 0, power: 70 },
  ],
};

