import { SkillDefinition } from "../../../types";

// Concentration - 6 levels from XML
// cancel reduction: 18, 25, 36, 42, 48, 53 (reduces chance of casting interruption)
// mpConsume: 16, 21, 31, 38, 44, 51
const concCancel = [18, 25, 36, 42, 48, 53];
const concMp = [16, 21, 31, 38, 44, 51];

export const skill_1078: SkillDefinition = {
  id: 1078,
  code: "DMO_1078",
  name: "Concentration",
  description: "Reduces the chance that casting will be interrupted.\n\nСнижает вероятность прерывания каста.",
  icon: "/skills/Skill1078_0.jpg",
  category: "buff",
  powerType: "flat",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "cancel", mode: "flat" }], // Value from level.power (cancel reduction)
  levels: concCancel.map((cancel, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 20 : index < 4 ? 30 : index < 6 ? 35 : 40,
    spCost: index < 2 ? 3300 : index < 4 ? 12000 : index < 6 ? 30000 : 60000,
    mpCost: concMp[index],
    power: cancel,
  })),
};

