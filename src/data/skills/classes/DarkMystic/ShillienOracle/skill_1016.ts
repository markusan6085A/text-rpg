import { SkillDefinition } from "../../../types";

// Resurrection - 9 levels from XML
// power: 0.0, 20.0, 30.0, 40.0, 50.0, 55.0, 60.0, 65.0, 70.0 (HP restoration %)
// mpConsume: 47, 70, 97, 121, 144, 156, 165, 182, 191
const resPower = [0.0, 20.0, 30.0, 40.0, 50.0, 55.0, 60.0, 65.0, 70.0];
const resMp = [47, 70, 97, 121, 144, 156, 165, 182, 191];

export const skill_1016: SkillDefinition = {
  id: 1016,
  code: "DMO_1016",
  name: "Resurrection",
  description: "Brings a fallen ally back to life.\n\nВоскрешает павшего союзника.",
  icon: "/skills/Skill1016_0.jpg",
  category: "special",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 6,
  cooldown: 120,
  levels: resPower.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 20 : index < 4 ? 30 : index < 6 ? 35 : index < 8 ? 40 : 45,
    spCost: index < 2 ? 3300 : index < 4 ? 12000 : index < 6 ? 30000 : index < 8 ? 60000 : 100000,
    mpCost: resMp[index],
    power,
  })),
};


