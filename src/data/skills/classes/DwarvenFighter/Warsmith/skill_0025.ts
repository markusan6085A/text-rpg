import { SkillDefinition } from "../../../types";

// Summon Mechanic Golem - summons mechanical golem (continuation from Artisan)
// XML: mpConsume: 75 88 100 110 118 126 133
export const skill_0025: SkillDefinition = {
  id: 25,
  code: "WS_0025",
  name: "Summon Mechanic Golem",
  description: "Summons a mechanical golem that is capable of long-distance cannon attacks. When summoning it, 3 Crystals: C-Grade are consumed. Afterwards, 3 additional crystals will be consumed at a regular interval for four times. 15% of acquired Exp will be consumed.\n\nПризывает механического голема, способного к дальнобойным атакам из пушки. При призыве потребляется 3 Кристалла: C-класса. После этого 3 дополнительных кристалла будут потребляться через регулярные интервалы четыре раза. Потребляется 15% полученного опыта.",
  icon: "/skills/skill0025.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 15,
  cooldown: 20,
  levels: [
    { level: 3, requiredLevel: 43, spCost: 46000, mpCost: 75, power: 0 },
    { level: 4, requiredLevel: 49, spCost: 110000, mpCost: 88, power: 0 },
    { level: 5, requiredLevel: 55, spCost: 250000, mpCost: 100, power: 0 },
    { level: 6, requiredLevel: 60, spCost: 370000, mpCost: 110, power: 0 },
    { level: 7, requiredLevel: 64, spCost: 600000, mpCost: 118, power: 0 },
    { level: 8, requiredLevel: 68, spCost: 870000, mpCost: 126, power: 0 },
    { level: 9, requiredLevel: 72, spCost: 1700000, mpCost: 133, power: 0 },
  ],
};

