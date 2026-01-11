import { SkillDefinition } from "../../../types";

export const Skill_0339: SkillDefinition = {
  id: 339,
  code: "OR_0339",
  name: "Parry Stance",
  description: "Uses weapon to block incoming attacks. P. Def and M. Def increase significantly. Speed, Atk. Spd. and accuracy are decreased. MP will be continuously consumed while in effect.\n\nИспользует оружие для блокировки входящих атак. Физ. и маг. защита значительно увеличиваются. Скорость, скорость атаки и точность уменьшаются. MP будет постоянно потребляться во время действия.",
  icon: "/skills/skill0339.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 0.5,
  effects: [
    { stat: "pDef", mode: "multiplier", multiplier: 1.25 },
    { stat: "mDef", mode: "multiplier", multiplier: 1.25 },
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.9 },
    { stat: "attackSpeed", mode: "multiplier", multiplier: 0.8 },
    { stat: "accuracy", mode: "flat", value: -4 },
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 36, power: 0 },
  ],
};

