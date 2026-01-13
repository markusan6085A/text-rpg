import { SkillDefinition } from "../../../types";

export const Skill_0004: SkillDefinition = {
  id: 4,
  code: "HF_0004",
  name: "Dash",
  description: "Temporary burst of speed. Effect 2.\n\nВременный всплеск скорости. Эффект 2.",
  icon: "/skills/skill0004.gif",
  category: "buff",
  powerType: "flat",
  target: "self",
  scope: "single",
  castTime: 1,
  cooldown: 600,
  duration: 10,
  effects: [
    {
      stat: "runSpeed",
      mode: "flat",
      value: 66,
    },
  ],
  levels: [
    { level: 2, requiredLevel: 46, spCost: 47000, mpCost: 41, power: 66 },
  ],
};

