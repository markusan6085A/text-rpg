import { SkillDefinition } from "../../../types";

// Sight of Paagrio (The Vision of Pa'agrio) - buff skill that temporarily increases alliance members' Accuracy
export const skill_1249: SkillDefinition = {
  id: 1249,
  code: "OL_1249",
  name: "Sight of Paagrio",
  description: "Temporarily increases alliance members' Accuracy. Effect 1-2.\n\nВременно увеличивает Точность членов альянса на 2-3.",
  icon: "/skills/skill1249.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "sight_paagrio", // Unique stackType - different Paagrio buffs stack, but same buff levels replace
  effects: [
    { stat: "accuracy", mode: "flat", value: 2 },
  ],
  levels: [
    { level: 1, requiredLevel: 44, spCost: 28000, mpCost: 154, power: 2 },
    { level: 2, requiredLevel: 52, spCost: 65000, mpCost: 188, power: 3 },
  ],
};

