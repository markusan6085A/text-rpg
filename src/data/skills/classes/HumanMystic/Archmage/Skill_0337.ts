import { SkillDefinition } from "../../../types";

export const skill_0337: SkillDefinition = {
  id: 337,
  code: "HM_0337",
  name: "Arcane Power",
  description: "Significantly increases M. Atk. power, but at an increased MP cost per skill. HP will be continuously consumed while in effect. РђСѓСЂ",
  icon: "/skills/skill0337.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  duration: 3600, //  ,   
  tickInterval: 5,
  hpPerTick: 250,
  effects: [
    { stat: "mAtk", mode: "percent", value: 30 },
    //   MP       ;  .
  ],
  levels: [
    {
      level: 1,
      requiredLevel: 78,
      spCost: 32000000,
      mpCost: 36,
      power: 0,
    },
  ],
};

