import { SkillDefinition } from "../../../types";

// Body To Mind - 5 levels from XML
const hpConsumeValues = [131, 209, 280, 318, 366];
const powerValues = [22.0, 35.0, 47.0, 53.0, 61.0];

export const skill_1157: SkillDefinition = {
  id: 1157,
  code: "SP_1157",
  name: "Body To Mind",
  description: "Regenerates the MP of others by sacrificing one's own HP.\n\nВосстанавливает MP, жертвуя своим HP. Прибавляет 22-61 MP цели.",
  icon: "/skills/skill1157.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 20,
  levels: powerValues.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 1 ? 25 : index < 2 ? 35 : index < 3 ? 45 : index < 4 ? 55 : 65,
    spCost: index < 1 ? 5500 : index < 2 ? 15000 : index < 3 ? 30000 : index < 4 ? 60000 : 120000,
    mpCost: 0,
    power: power, // MP to restore
    // hpConsume is stored in a separate array, will be handled in useSkill.ts
  })),
};

