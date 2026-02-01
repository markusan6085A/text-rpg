import { SkillDefinition } from "../../../types";

// Chant of Life — Shillien Saint (buffer branch): party HP regen buff
// Реген HP: 20%, MP: 65, каст 4с, КД 6с, тривалість 20 хв
export const skill_1229: SkillDefinition = {
  id: 1229,
  code: "DMS_1229",
  name: "Chant of Life",
  description:
    "Enhances party members' HP regeneration significantly.\n\nЗначительно увеличивает регенерацию HP членов группы (27-58 HP каждую секунду).",
  icon: "/skills/skill1229.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 min
  buffGroup: "WC_DEF",
  stackType: "chant_life",
  effects: [{ stat: "hpRegen", mode: "percent", value: 20 }],
  levels: [
    { level: 5, requiredLevel: 76, spCost: 10000000, mpCost: 65, power: 20 },
  ],
};
