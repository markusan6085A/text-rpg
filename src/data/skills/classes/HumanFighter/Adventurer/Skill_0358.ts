import { SkillDefinition } from "../../../types";

export const Skill_0358: SkillDefinition = {
  id: 358,
  code: "HF_0358",
  name: "Bluff",
  description: "Tricks the enemy to show its back. Removes the enemy's desire to attack and cancels one's own target status. Instantly throws the enemy into a state of shock. Usable when one is equipped with a dagger.\n\nОбманывает врага, заставляя показать спину. Убирает желание врага атаковать и отменяет статус цели. Мгновенно вводит врага в состояние шока на 1.5 сек. Требуется кинжал.",
  icon: "/skills/skill0358.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1,
  cooldown: 8,
  effects: [
    {
      stat: "stunResist",
      mode: "flat",
      duration: 1.5,
      chance: 80,
    },
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 35, power: 100 },
  ],
};

