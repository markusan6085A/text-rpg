import { SkillDefinition } from "../../../types";

export const Skill_0226: SkillDefinition = {
  id: 226,
  code: "OF_0226",
  name: "Relax",
  description: "Recovers HP quickly when sitting.\n\nВосстанавливает HP. Расходует 1 MP в 3 сек.\nВосстанавливает HP на 5 HP/сек.",
  icon: "/skills/skill0226.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 1,
  effects: [
    { stat: "hpRegen", mode: "flat", value: 5 },
  ],
  levels: [
    { level: 1, requiredLevel: 5, spCost: 190, mpCost: 2, power: 0 },
  ],
};

