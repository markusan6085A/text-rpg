import { SkillDefinition } from "../../../types";

export const Skill_0357: SkillDefinition = {
  id: 357,
  code: "HF_0357",
  name: "Focus Power",
  description: "Increases the damage of critical attack and all Mortal Blow type skills. Effectiveness is dependent upon the direction of attack. Dagger Skill.\n\nУвеличивает урон критического удара и всех навыков типа Mortal Blow. Эффективность зависит от направления атаки. Навык кинжала.",
  icon: "/skills/skill0357.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 2,
  cooldown: 120,
  duration: 120,
  effects: [
    {
      stat: "critDamage",
      mode: "percent",
      // З XML: front -30%, side +30%, back +60%
      // Використовуємо середнє значення +20% або можна зробити складнішу логіку
      value: 20, // Середнє значення
    },
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 21000000, mpCost: 71, power: 20 },
  ],
};

