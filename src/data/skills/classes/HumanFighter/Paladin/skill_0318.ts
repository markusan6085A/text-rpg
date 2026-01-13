import { SkillDefinition } from "../../../types";

// Aegis Stance для Paladin (toggle skill)
export const skill_0318: SkillDefinition = {
  id: 318,
  code: "PAL_0318",
  name: "Aegis Stance",
  description: "Provides defense from all directions when a shield is equipped. Decreases one's shield defense strength.\n\nОбеспечивает защиту со всех сторон при экипированном щите. Снижает силу защиты щитом на 40%. Требуется щит. Переключаемый навык.",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  icon: "/skills/skill0318.gif",
  effects: [
    { stat: "pDef", mode: "flat", value: 0 }, // Defense from all directions
    { stat: "shieldBlockPower", mode: "percent", value: -40 }, // Decreases shield defense by 40%
  ],
  levels: [
    { level: 1, requiredLevel: 46, spCost: 55000, mpCost: 9, power: 0 },
  ],
};

