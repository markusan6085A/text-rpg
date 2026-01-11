import { SkillDefinition } from "../../../types";

export const skill_1361: SkillDefinition = {
  id: 1361,
  code: "HM_1361",
  name: "Mass Block Speed",
  description: "Decreases movement speed of enemies in area.\n\nСнижает скорость передвижения врагов в области.",
  icon: "/skills/skill1361.gif",
  category: "debuff",
  powerType: "percent",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 120,
  duration: 120,
  chance: 40,
  effects: [{ stat: "runSpeed", mode: "percent", value: -10 }],
  stackType: "mass_block_speed",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 78,
      spCost: 32000000,
      mpCost: 107,
      power: 0,
    },
  ],
};

