import { SkillDefinition } from "../../../types";

// Parry Stance - toggle skill that blocks attacks
// File: mpCost: 36, mpPerTick: 0.5 (≈5 MP/s)
// XML: mpConsume: 36, ManaDamOverTime: 36 per 3s (12 MP/s), but using file values
export const skill_0339: SkillDefinition = {
  id: 339,
  code: "MA_0339",
  name: "Parry Stance",
  description: "Uses weapon to block incoming attacks. P. Def and M.Def increase significantly. Speed, Atk. Spd. and accuracy are decreased. MP will be continuously consumed while in effect.\n\nИспользует оружие для блокирования входящих атак. Физ. защита и маг. защита значительно увеличиваются на 25%. Скорость передвижения уменьшена на 20%, скорость атаки уменьшена на 10%, точность уменьшена на 4. MP будет непрерывно потребляться во время действия (5 MP/сек).",
  icon: "/skills/skill0339.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -5, // From file: 0.5 per tick, ≈5 MP/s
  tickInterval: 1,
  effects: [
    { stat: "pDef", mode: "multiplier", multiplier: 1.25 }, // +25% P. Def
    { stat: "mDef", mode: "multiplier", multiplier: 1.25 }, // +25% M. Def
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.8 }, // -20% run speed
    { stat: "attackSpeed", mode: "multiplier", multiplier: 0.9 }, // -10% attack speed
    { stat: "accuracy", mode: "flat", value: -4 }, // -4 accuracy
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 36, power: 0 },
  ],
};

