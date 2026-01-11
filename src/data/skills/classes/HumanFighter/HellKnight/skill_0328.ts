import { SkillDefinition } from "../../../types";

// Wisdom для HellKnight (рівень 1)
export const skill_0328: SkillDefinition = {
  id: 328,
  code: "HKN_0328",
  name: "Wisdom",
  description: "Increases resistance to Hold, Sleep, and Mental attacks.\n\nУвеличивает сопротивление к удержанию, сну и ментальным атакам на 20%. Пассивный навык.",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  icon: "/skills/skill0328.gif",
  effects: [
    { stat: "rootResist", mode: "percent", value: 20 }, // Зменшує вразливість до Hold на 20%
    { stat: "sleepResist", mode: "percent", value: 20 }, // Зменшує вразливість до Sleep на 20%
    { stat: "derangementResist", mode: "percent", value: 20 }, // Зменшує вразливість до Mental на 20%
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 0, power: 0 },
  ],
};

