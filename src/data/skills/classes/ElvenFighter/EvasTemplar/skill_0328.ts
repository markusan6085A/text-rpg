import { SkillDefinition } from "../../../types";

// Wisdom - пасивний скіл, що збільшує стійкість до утримання, сну та ментальних атак
export const skill_0328: SkillDefinition = {
  id: 328,
  code: "ET_0328",
  name: "Wisdom",
  description: "Increases resistance to Hold, Sleep, and Mental attacks.\n\nУвеличивает сопротивление к удержанию на 20%.\nУвеличивает сопротивление ко сну на 20%.\nУвеличивает сопротивление к ментальным атакам (дебаффы, проклятия) на 20%.",
  icon: "/skills/skill0328.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "holdResist", mode: "percent", value: 20 },
    { stat: "sleepResist", mode: "percent", value: 20 },
    { stat: "mentalResist", mode: "percent", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 0, power: 0 },
  ],
};

