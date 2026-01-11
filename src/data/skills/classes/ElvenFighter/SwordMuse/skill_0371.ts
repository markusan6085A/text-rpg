import { SkillDefinition } from "../../../types";

// Song of Renewal - toggle скіл, що зменшує cooldown та MP споживання для фізичних та магічних скілів
export const skill_0371: SkillDefinition = {
  id: 371,
  code: "SM_0371",
  name: "Song of Renewal",
  description: "Temporarily decreases party members' MP consumption and re-use time while using physical/magic skills. If one sings while sing/dance state is in effect, additional MP will be consumed.\n\nВременно уменьшает время перезарядки физических навыков на 30%, время перезарядки магических навыков на 30%, расход MP на физические навыки на 5% и расход MP на магические навыки на 5% на 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0349.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "party",
  toggle: true,
  castTime: 2.5,
  cooldown: 10,
  duration: 600, // 10 хвилин
  mpPerTick: -30, // Споживає 30 MP/сек
  tickInterval: 1,
  effects: [
    { stat: "cooldownReduction", mode: "percent", value: 30 }, // -30% cooldown для всіх скілів
    // MP consumption reduction для фізичних та магічних скілів обробляється в логіці використання скілів
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 60, power: 0 },
  ],
};

