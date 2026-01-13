import { SkillDefinition } from "../../../types";

// Focus Chance - increases critical rate and success rate of Mortal Blow type skills
export const skill_0356: SkillDefinition = {
  id: 356,
  code: "WR_0356",
  name: "Focus Chance",
  description: "Increases the critical rate and success rate of all Mortal Blow type skills. Effectiveness is dependent upon the direction of attack. Dagger Skill.\n\nУвеличивает шанс критического удара и успех всех навыков типа Mortal Blow на 2 мин. Эффективность зависит от направления атаки:\n- Спереди: уменьшает шанс критического удара на 30%.\n- Сбоку: увеличивает шанс критического удара на 30%.\n- Сзади: увеличивает шанс критического удара на 60%.\nТребуется кинжал.",
  icon: "/skills/skill0356.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 2,
  cooldown: 120,
  duration: 120, // 2 minutes
  effects: [
    {
      stat: "critRate",
      mode: "percent",
      // З XML: front -30%, side +30%, back +60%
      // Використовуємо середнє значення +20% або можна зробити складнішу логіку
      value: 20, // Середнє значення
    },
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 21000000, mpCost: 71, power: 0 },
  ],
};

