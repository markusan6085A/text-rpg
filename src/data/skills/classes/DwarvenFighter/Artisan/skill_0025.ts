import { SkillDefinition } from "../../../types";

// Summon Mechanic Golem - summons mechanical golem
// XML: mpConsume: 49 62, hitTime: 15000, reuseDelay: 20000
export const skill_0025: SkillDefinition = {
  id: 25,
  code: "AR_0025",
  name: "Summon Mechanic Golem",
  description: "Summons a mechanical golem that is capable of long-distance cannon attacks. When summoning it, 1 Crystal: C-Grade is consumed. Afterwards, one additional crystal will be consumed at a regular interval for four times. 15% of acquired Exp will be consumed.\n\nПризывает механического голема, способного к дальнобойным атакам из пушки. При призыве потребляется 1 Кристалл: C-класса. После этого один дополнительный кристалл будет потребляться через регулярные интервалы четыре раза. Потребляется 15% полученного опыта.",
  icon: "/skills/skill0025.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 15,
  cooldown: 20,
  levels: [
    { level: 1, requiredLevel: 28, spCost: 13000, mpCost: 49, power: 0 },
    { level: 2, requiredLevel: 36, spCost: 34000, mpCost: 62, power: 0 },
  ],
};

