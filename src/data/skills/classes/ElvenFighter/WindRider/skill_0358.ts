import { SkillDefinition } from "../../../types";

// Bluff - tricks enemy to show its back, removes target status, stuns
export const skill_0358: SkillDefinition = {
  id: 358,
  code: "WR_0358",
  name: "Bluff",
  description: "Tricks the enemy to show its back. Removes the enemy's desire to attack and cancels one's own target status. Instantly throws the enemy into a state of shock. Usable when one is equipped with a dagger.\n\nОбманывает врага, заставляя показать спину. Убирает желание врага атаковать и отменяет статус цели. Мгновенно вводит врага в состояние шока на 9 сек. Шанс прохождения 40% (зависит от CON цели). Требуется кинжал.",
  icon: "/skills/skill0358.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1,
  cooldown: 30,
  duration: 9, // Stun duration
  chance: 40, // Success rate depends on CON stat
  effects: [
    { stat: "stunResist", mode: "flat", value: -100, duration: 9, chance: 40, resistStat: "con" }, // Stuns the enemy for 9 sec, resistance depends on CON
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 35, power: 0 },
  ],
};

