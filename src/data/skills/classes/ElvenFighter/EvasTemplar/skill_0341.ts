import { SkillDefinition } from "../../../types";

// Touch of Life - bestows a sacred blessing while sacrificing one's own HP
export const skill_0341: SkillDefinition = {
  id: 341,
  code: "ET_0341",
  name: "Touch of Life",
  description: "Bestows a sacred blessing while sacrificing one's own HP. Regenerates HP significantly. Temporarily increases HP regeneration, resistance to buff canceling attack, resistance to debuff attack and the effect of one's own HP regeneration magic.\n\nДарует святое благословение на 2 мин., действует на себя и союзников, действует в радиусе ближнего боя:\n- Потребляет 50% от максимального HP.\n- Восстанавливает на 250 HP каждые 5 сек.\n- Увеличивает сопротивление Cancel на 60%.\n- Увеличивает сопротивление дебафам на 30%.\n- Увеличивает сопротивление эффекту регенерации HP на 30%.",
  icon: "/skills/skill0341.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 1.8,
  cooldown: 1200,
  duration: 120, // 2 minutes
  hpCost: 1621, // Consumes HP instead of MP (50% of max HP)
  hpPerTick: 250, // Regenerates 250 HP every 5 seconds
  tickInterval: 5, // Every 5 seconds
  effects: [
    { stat: "cancelResist", mode: "percent", value: 60, duration: 120 }, // 60% resistance to buff canceling
    { stat: "debuffResist", mode: "percent", value: 30, duration: 120 }, // 30% resistance to debuff attacks
    { stat: "healPower", mode: "percent", value: 30, duration: 120 }, // 30% increase to HP regeneration magic effect
  ],
  stackType: "touch_of_life",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 0, power: 0 },
  ],
};

