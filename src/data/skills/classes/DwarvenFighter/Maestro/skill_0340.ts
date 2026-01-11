import { SkillDefinition } from "../../../types";

// Riposte Stance - toggle skill that reflects damage
// File: mpCost: 35, mpPerTick: 0.5 (≈5 MP/s)
// XML: mpConsume: 35, ManaDamOverTime: 35 per 3s (≈11.67 MP/s), but using file values
export const skill_0340: SkillDefinition = {
  id: 340,
  code: "MA_0340",
  name: "Riposte Stance",
  description: "Uses weapon to reflect incoming attacks. It reflects the damage received and has a chance to reflect buff/de-buff skill attacks. The damage received through the skill use and remote attack are excluded. Moving speed, Atk. Spd. and accuracy are decreased. MP will be continuously consumed while in effect.\n\nИспользует оружие для отражения входящих атак. Отражает 30% полученного урона и имеет 30% шанс отразить атаки баффов/дебаффов. Урон, полученный через использование навыка и удаленную атаку, исключается. Скорость передвижения уменьшена на 20%, скорость атаки уменьшена на 10%, точность уменьшена на 4. MP будет непрерывно потребляться во время действия (5 MP/сек).",
  icon: "/skills/skill0340.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -5, // From file: 0.5 per tick, ≈5 MP/s
  tickInterval: 1,
  effects: [
    { stat: "reflect", mode: "flat", value: 30 }, // 30% damage reflection
    { stat: "reflectSkillPhysic", mode: "flat", value: 30 }, // 30% physical skill reflection
    { stat: "reflectSkillMagic", mode: "flat", value: 30 }, // 30% magic skill reflection
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.8 }, // -20% run speed
    { stat: "attackSpeed", mode: "multiplier", multiplier: 0.9 }, // -10% attack speed
    { stat: "accuracy", mode: "flat", value: -4 }, // -4 accuracy
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 13000000, mpCost: 35, power: 0 },
  ],
};

