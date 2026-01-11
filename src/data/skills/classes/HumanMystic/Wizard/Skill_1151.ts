import { SkillDefinition } from "../../../types";

export const skill_1151: SkillDefinition = {
  id: 1151,
  code: "HM_1151",
  name: "Corpse Life Drain",
  description: "Absorbs HP from a corpse to regenerate one's HP.\n\nПоглощает HP из трупа для восстановления своего HP. Эффект Corpse Life Drain, кастуется на труп монстра, действует в пределах дальности 400: труп исчезает, лечение себя силой 260 со штрафом при разнице уровней больше 3. Каст: 1.5 сек. Перезарядка: 20 сек.",
  icon: "/skills/skill1151.gif",
  category: "heal",
  powerType: "flat",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 20,
  levels: [
  {
    "level": 1,
    "requiredLevel": 30,
    "spCost": 11000,
    "mpCost": 14,
    "power": 0
  },
  {
    "level": 2,
    "requiredLevel": 35,
    "spCost": 18000,
    "mpCost": 15,
    "power": 0
  }
]
};
