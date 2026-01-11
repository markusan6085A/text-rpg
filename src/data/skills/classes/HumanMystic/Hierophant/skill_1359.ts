import { SkillDefinition } from "../../../types";

export const skill_1359: SkillDefinition = {
  id: 1359,
  code: "HM_1359",
  name: "Block Wind Walk",
  description: "Removes buffs that increase Speed from a targeted enemy. Temporarily decreases Speed and prevents enemy from receiving removed buffs that will increase Speed again.\n\nУдаляет бафы, увеличивающие скорость, с выбранного врага. Временно снижает скорость и предотвращает получение врагом удаленных бафов, увеличивающих скорость.",
  category: "debuff",
  powerType: "percent",
  icon: "/skills/skill1359.gif",
  target: "enemy",
  duration: 120,
  castTime: 4,
  cooldown: 30,
  effects: [
    { stat: "runSpeed", mode: "percent", value: -10, chance: 80 },
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 13000000, mpCost: 70, power: 80 },
  ],
};

