import { SkillDefinition } from "../../../types";

export const skill_1299: SkillDefinition = {
  id: 1299,
  code: "DMP_1299",
  name: "Servitor Ultimate Defense",
  description: "Significantly increases a servitor's P. Def. and M. Def. for a brief time period. Servitor is immobilized while in effect.\n\nЗначительно увеличивает P. Def. и M. Def. слуги на короткое время. Слуга обездвижен во время действия.",
  icon: "/skills/skill1299.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 1,
  cooldown: 1800,
  duration: 30,
  levels: [
    { level: 1, requiredLevel: 70, power: 0, mpCost: 38, spCost: 670000 },
    { level: 2, requiredLevel: 70, power: 0, mpCost: 52, spCost: 670000 },
  ],
};

