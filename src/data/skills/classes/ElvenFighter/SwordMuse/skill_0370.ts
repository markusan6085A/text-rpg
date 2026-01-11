import { SkillDefinition } from "../../../types";

// Song of Meditation - toggle скіл, що збільшує регенерацію MP та зменшує споживання MP на магічних скілах
export const skill_0370: SkillDefinition = {
  id: 370,
  code: "SM_0370",
  name: "Song of Meditation",
  description: "Temporarily increases party members' MP regeneration rate and decreases MP consumption rate when using a magic skill. If one sings while sing/dance state is still in effect, additional MP will be consumed.\n\nВременно увеличивает скорость регенерации MP членов партии на 20% и уменьшает расход MP на магические навыки на 10% на 10 мин. При непрерывном пении потребляется дополнительный MP (30 MP/сек).",
  icon: "/skills/skill0363.gif",
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
    { stat: "mpRegen", mode: "percent", value: 20 }, // +20% регенерації MP
    // MP consumption reduction для магічних скілів обробляється в логіці використання скілів
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 60, power: 0 },
  ],
};

