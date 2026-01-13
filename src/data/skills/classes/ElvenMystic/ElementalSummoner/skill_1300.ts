import { SkillDefinition } from "../../../types";

// Servitor Cure - Cures a servitor's bleeding and poisoning
export const skill_1300: SkillDefinition = {
  id: 1300,
  code: "ES_1300",
  name: "Servitor Cure",
  description: "Cures a servitor's bleeding and poisoning up to Effect 3.\n\nПризыв Servitor Cure, применяется на сервитора, действует в пределах дальности 600:\n- Лечит от кровотечения до эффекта 3 в секунду.\n- Лечит от отравления до эффекта 3 в секунду.",
  icon: "/skills/skill1300.gif",
  category: "heal",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 15,
  levels: [
    { level: 1, requiredLevel: 40, spCost: 32000, mpCost: 35, power: 0 },
    { level: 2, requiredLevel: 48, spCost: 67000, mpCost: 44, power: 0 },
    { level: 3, requiredLevel: 60, spCost: 210000, mpCost: 55, power: 0 },
  ],
};

