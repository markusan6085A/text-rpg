import { SkillDefinition } from "../../../types";

export const Skill_0292: SkillDefinition = {
  id: 292,
  code: "TY_0292",
  name: "Totem Spirit Bison",
  description: "The spirit of a bison temporarily possesses the user when HP is low. Increases P. Atk. and critical attack rate.\n\nДух бизона временно овладевает пользователем, когда HP низкое. Увеличивает физ. атаку и шанс критического урона.",
  icon: "/skills/skill0292.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 120,
  duration: 300,
  stackType: "totem_spirit",
  effects: [
    { stat: "pAtk", mode: "multiplier", multiplier: 1.2, duration: 300 },
    { stat: "critRate", mode: "multiplier", multiplier: 1.2, duration: 300 },
  ],
  levels: [
    { level: 1, requiredLevel: 68, spCost: 780000, mpCost: 7, power: 0 },
  ],
};

