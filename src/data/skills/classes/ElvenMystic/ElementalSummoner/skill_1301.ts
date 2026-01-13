import { SkillDefinition } from "../../../types";

// Servitor Blessing - Cancels the reduced state of hold and paralysis. Also cancels the reduced state of Atk. Spd. and Speed of effect 3 or below.
export const skill_1301: SkillDefinition = {
  id: 1301,
  code: "ES_1301",
  name: "Servitor Blessing",
  description: "Cancels the reduced state of hold and paralysis. Also cancels the reduced state of Atk. Spd. and Speed of effect 3 or below.\n\nПризыв Servitor Blessing, применяется на сервитора, действует в пределах дальности 600:\n- Лечит от удержания до эффекта 1 в секунду.\n- Лечит от паралича до эффекта 1 в секунду.\n- Лечит от снижения, связанного с уменьшением скорости атаки до эффекта 3 в секунду.\n- Лечит от снижения скорости движения до эффекта 3 в секунду.",
  icon: "/skills/skill1301.gif",
  category: "heal",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 15,
  levels: [
    { level: 1, requiredLevel: 62, spCost: 310000, mpCost: 58, power: 0 },
  ],
};

