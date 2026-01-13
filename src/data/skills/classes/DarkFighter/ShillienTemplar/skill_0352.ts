import { SkillDefinition } from "../../../types";

// Shield Bash - shield attack that interrupts enemy's attack action and disarms them
export const skill_0352: SkillDefinition = {
  id: 352,
  code: "ST_0352",
  name: "Shield Bash",
  description: "A shield attack that interrupts an enemy's attack action and disarms them. Available when one is equipped with a shield.\n\nАтака щитом, которая прерывает действие атаки врага и разоружает его. Доступно при экипировке щита.",
  icon: "/skills/skill0352.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1,
  cooldown: 10,
  duration: 2, // Stun duration
  chance: 80, // Success rate depends on CON stat
  effects: [
    { stat: "stunResist", mode: "multiplier", multiplier: 0 }, // Effectively stuns target
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 35, power: 80 },
  ],
};

