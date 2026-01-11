import { SkillDefinition } from "../../../types";

// Vampiric Touch - 6 levels from XML
// power: 18.0, 21.0, 23.0, 26.0, 29.0, 32.0
// mpConsume: 20, 22, 25, 28, 30, 32
// Absorbs 40% of damage as HP
const vampiricPower = [18.0, 21.0, 23.0, 26.0, 29.0, 32.0];
const vampiricMp = [20, 22, 25, 28, 30, 32];

export const skill_1147: SkillDefinition = {
  id: 1147,
  code: "DM_1147",
  name: "Vampiric Touch",
  description: "Absorbs HP. Dark element attack. 40% of damage is converted to HP.\n\nПоглощает HP. Темная атака. 40% урона преобразуется в HP.",
  icon: "/skills/Skill1147_0.jpg",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  element: "dark",
  castTime: 4,
  cooldown: 12,
  effects: [{ stat: "vampirism", mode: "percent", value: 40 }],
  levels: vampiricPower.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 14 : index < 4 ? 20 : index < 6 ? 30 : 40,
    spCost: index < 2 ? 1100 : index < 4 ? 3000 : index < 6 ? 8000 : 20000,
    mpCost: vampiricMp[index],
    power,
  })),
};



