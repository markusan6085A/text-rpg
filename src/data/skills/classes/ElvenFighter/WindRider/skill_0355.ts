import { SkillDefinition } from "../../../types";

// Focus Death - decreases critical rate and increases success rate of Mortal Blow type skills
export const skill_0355: SkillDefinition = {
  id: 355,
  code: "WR_0355",
  name: "Focus Death",
  description: "Decreases the critical rate and increases the success rate of all Mortal Blow type skills. Effectiveness is dependent upon the direction of attack. Dagger Skill.\n\nУменьшает шанс критического удара и увеличивает успех всех навыков типа Mortal/Deadly/Blinding/Lethal Blow и Backstab на 2 мин. Эффективность зависит от направления атаки:\n- Уменьшает шанс критического удара на 30%.\n- Увеличивает успех Mortal Blow скілів на 60%.\n- Спереди: уменьшает силу критического удара на 30%.\n- Сзади: увеличивает силу критического удара на 90%.\nТребуется кинжал.",
  icon: "/skills/skill0355.gif",
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
      value: -30, // Decreases critical rate by 30%
    },
    {
      stat: "critDamage",
      mode: "percent",
      // З XML: front -30%, back +90%
      // Використовуємо середнє значення +30%
      value: 30, // Середнє значення
    },
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 21000000, mpCost: 71, power: 0 },
  ],
};

