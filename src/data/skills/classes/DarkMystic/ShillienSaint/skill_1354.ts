import { SkillDefinition } from "../../../types";

// Arcane Protection - from XML
// cancelVuln 0.7 = -30% cancel vulnerability = +30% cancel resist
// debuffVuln 0.8 = -20% debuff vulnerability = +20% debuff resist
export const skill_1354: SkillDefinition = {
  id: 1354,
  code: "DMS_1354",
  name: "Arcane Protection",
  description: "Temporarily increases resistance to buff cancel and de-buff attack.\n\nВременно увеличивает сопротивление к отмене баффов на 30% и к дебаффам на 20%.",
  icon: "/skills/skill1354.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "debuffResist", mode: "percent", value: 20 }, // debuffVuln 0.8 = -20% vulnerability = +20% resist
    // cancelVuln 0.7 = -30% cancel vulnerability (handled by game logic)
  ],
  stackType: "cancelVuln",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 76,
      spCost: 10000000,
      mpCost: 70,
      power: 0,
    },
  ],
};

