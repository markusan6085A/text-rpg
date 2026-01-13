import { SkillDefinition } from "../../../types";

// Shield Bash - shield attack that interrupts enemy's attack action and disarms them
export const skill_0352: SkillDefinition = {
  id: 352,
  code: "ET_0352",
  name: "Shield Bash",
  description: "A shield attack that interrupts an enemy's attack action and disarms them. Available when one is equipped with a shield.\n\nАтака щитом на 2 сек. Шанс успеха 80% (зависит от CON стата), действует на врагов, действует в радиусе ближнего боя:\n- Прерывает действие атаки.\n- Обезоруживает противника.\n- Требуется щит для экипировки щита.",
  icon: "/skills/skill0352.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1,
  cooldown: 10,
  duration: 2,
  chance: 80, // Success rate depends on CON stat
  effects: [
    { stat: "stunResist", mode: "multiplier", multiplier: 0, duration: 2, chance: 80 }, // Effectively stuns and disarms target
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 35, power: 0 },
  ],
};

