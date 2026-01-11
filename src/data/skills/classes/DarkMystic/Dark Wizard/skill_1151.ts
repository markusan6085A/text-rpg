import { SkillDefinition } from "../../../types";

// Corpse Life Drain - 16 levels from XML
// drain: 260, 299, 347, 384, 426, 467, 509, 541, 570, 592, 625, 647, 673, 701, 729, 758 (HP absorbed from corpse)
// mpConsume: 11, 12, 14, 16, 18, 19, 21, 22, 22, 23, 24, 25, 26, 26, 27, 28
// mpConsume_Init: 3, 3, 4, 4, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7
const corpseDrain = [260, 299, 347, 384, 426, 467, 509, 541, 570, 592, 625, 647, 673, 701, 729, 758];
const corpseDrainMp = [11, 12, 14, 16, 18, 19, 21, 22, 22, 23, 24, 25, 26, 26, 27, 28];
const corpseDrainMpInit = [3, 3, 4, 4, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7];
const corpseDrainMagicLvl = [30, 35, 40, 44, 48, 52, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74];

export const skill_1151: SkillDefinition = {
  id: 1151,
  code: "DW_1151",
  name: "Corpse Life Drain",
  description: "Absorbs HP from a corpse to regenerate one's HP.\n\nЭффект Corpse Life Drain, кастуется на труп монстра, действует в пределах дальности 400: - Труп исчезает. - Лечение себя силой 260-758 со штрафом при разнице уровней больше 3. - Выбранный труп монстра исчезает.",
  icon: "/skills/Skill1151_0.jpg",
  category: "heal",
  powerType: "damage",
  element: "dark",
  target: "enemy", // Special: targets corpse (handled in useSkill.ts)
  scope: "single",
  castTime: 1.5,
  cooldown: 20,
  levels: corpseDrain.map((drain, index) => ({
    level: index + 1,
    requiredLevel: corpseDrainMagicLvl[index],
    spCost: index < 2 ? 11000 : index < 4 ? 18000 : index < 6 ? 30000 : index < 8 ? 50000 : index < 10 ? 80000 : index < 12 ? 120000 : index < 14 ? 160000 : 200000,
    mpCost: corpseDrainMpInit[index] + corpseDrainMp[index],
    power: drain, // HP to restore
  })),
};

