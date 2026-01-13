import { SkillDefinition } from "../../../types";

export const skill_0336: SkillDefinition = {
  id: 336,
  code: "HM_0336",
  name: "Arcane Wisdom",
  description: "Significantly increases efficiency of magic and decreases MP consumption of skills. Casting Spd. is decreased and HP will be continuously consumed while in effect.\n\nЗначительно увеличивает эффективность магии и снижает потребление MP скілами. Скорость каста снижается, и HP будет постоянно потребляться во время действия.",
  category: "buff",
  powerType: "none",
  icon: "/skills/skill0336.gif",
  target: "self",
  duration: 120,
  effects: [
    { stat: "castSpeed", mode: "percent", value: -10 },
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 36, power: 0.9 },
  ],
};

