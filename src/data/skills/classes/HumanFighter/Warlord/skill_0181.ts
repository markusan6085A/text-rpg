import { SkillDefinition } from "../../../types";

export const skill_0181: SkillDefinition = {
  id: 181,
  code: "WL_0181",
  name: "Revival",
  description: "Regenerates one's HP significantly. Can be used only when one's HP is 10% or below.\n\nЗначительно восстанавливает HP (1685). Можно использовать только когда HP 10% или ниже. Каст: 1.5 сек. Перезарядка: 3 часа.",
  category: "heal",
  powerType: "damage",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 10800,
  icon: "/skills/skill0181.gif",
  levels: [
    { level: 1, requiredLevel: 55, spCost: 180000, mpCost: 25, power: 1685 },
  ],
};

