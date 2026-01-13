import { SkillDefinition } from "../../../types";

// Concentration - 6 levels from XML
// cancel reduction: 18, 25, 36, 42, 48, 53 (reduces chance of casting interruption)
// mpConsume: 16, 21, 31, 38, 44, 51
// mpConsume_Init: 4, 6, 8, 10, 11, 13
const concCancel = [18, 25, 36, 42, 48, 53];
const concMp = [16, 21, 31, 38, 44, 51];
const concMpInit = [4, 6, 8, 10, 11, 13];

export const skill_1078: SkillDefinition = {
  id: 1078,
  code: "DW_1078",
  name: "Concentration",
  description: "Temporarily lowers the probability of magic being canceled due to damage. Effect 1-2.\n\nЭффект Concentration на 20 мин., кастуется на себя и других, действует в пределах дальности 400: - Уменьшает шанс сбива каста на 18-53%.",
  icon: "/skills/Skill1078_0.jpg",
  category: "buff",
  powerType: "flat",
  target: "ally",
  scope: "single",
  duration: 1200, // 20 minutes
  castTime: 4,
  cooldown: 6,
  effects: [], // Cancel reduction is handled in battle logic, not as a stat modifier
  levels: concCancel.map((cancel, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 20 : index < 4 ? 30 : index < 6 ? 35 : 40,
    spCost: index < 2 ? 3300 : index < 4 ? 12000 : index < 6 ? 30000 : 60000,
    mpCost: concMpInit[index] + concMp[index],
    power: cancel,
  })),
};

