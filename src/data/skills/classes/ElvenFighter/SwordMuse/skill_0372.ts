import { SkillDefinition } from "../../../types";

// Song of Champion - toggle скіл, що зменшує cooldown та MP споживання для фізичних скілів
export const skill_0372: SkillDefinition = {
  id: 372,
  code: "SM_0372",
  name: "Song of Champion",
  description: "Temporarily decreases party members' MP consumption/re-use time when using physical skills. If one sings while sing/dance state is still in effect, additional MP will be consumed.\n\nВременно уменьшает время перезарядки физических навыков на 30% и расход MP на физические навыки на 20% на 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0364.gif",
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
    { stat: "cooldownReduction", mode: "percent", value: 30 }, // -30% cooldown для фізичних скілів
    // MP consumption reduction для фізичних скілів обробляється в логіці використання скілів
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 64000000, mpCost: 60, power: 0 },
  ],
};

