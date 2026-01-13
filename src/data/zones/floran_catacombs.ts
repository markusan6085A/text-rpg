// src/data/zones/floran_catacombs.ts
import type { Mob } from "../world/types";
import type { DropEntry } from "../combat/types";

// Функція для генерації базових статів моба за рівнем
// Спеціальні стати для катакомб: сильні моби з рандомним уроном 250-400
function createMobStats(level: number, isChampion: boolean = false) {
  const baseHp = 100 + level * 50;
  // Рандомний урон від 250 до 400 для всіх мобів
  const randomDamage = 250 + Math.floor(Math.random() * 151); // 250-400
  const basePAtk = randomDamage;
  const baseMAtk = randomDamage; // Теж рандомний для магії
  // Фіксовані захисти: pDef: 250, mDef: 200
  const basePDef = 250;
  const baseMDef = 200;
  const baseExp = 100 + level * 30; // Більше EXP
  const baseAdena = 50 + level * 15; // Більше Adena
  const baseSp = level * 3; // Більше SP

  // Множник для чемпіонів
  const championMult = isChampion ? 3.5 : 1.0;

  return {
    level,
    hp: Math.round(baseHp * championMult),
    mp: isChampion ? 1000 : 500, // МП для магії
    pAtk: Math.round(basePAtk * championMult),
    mAtk: Math.round(baseMAtk * championMult),
    pDef: Math.round(basePDef * championMult),
    mDef: Math.round(baseMDef * championMult),
    exp: isChampion ? Math.round(baseExp * championMult * 10) : Math.round(baseExp * championMult),
    sp: isChampion ? Math.round(baseSp * championMult * 10) : Math.round(baseSp * championMult),
    adenaMin: isChampion ? Math.round(baseAdena * championMult * 10) : Math.round(baseAdena * championMult),
    adenaMax: isChampion ? Math.round(baseAdena * 1.5 * championMult * 10) : Math.round(baseAdena * 1.5 * championMult),
    dropChance: isChampion ? 0.8 : 0.4, // Вищий шанс дропу
    canDispelBuffs: true, // Спеціальна властивість: може зняти бафи
  };
}

// Функція для генерації дропу каменів печатей
function generateSealStoneDrops(): DropEntry[] {
  return [
    {
      id: "green_seal_stone",
      kind: "resource" as const,
      chance: 0.80, // 80% шанс
      min: 1200,
      max: 1600,
    },
    {
      id: "blue_seal_stone",
      kind: "resource" as const,
      chance: 0.60, // 60% шанс
      min: 600,
      max: 800,
    },
    {
      id: "red_seal_stone",
      kind: "resource" as const,
      chance: 0.40, // 40% шанс
      min: 400,
      max: 600,
    },
  ];
}

// Генеруємо 100 звичайних мобів 20-35 лвл
const normalMobs: Mob[] = [];
// Різні назви мобів для Floran Catacombs (групування по 8-10 мобів)
const mobNameGroups = [
  { name: "Catacomb Wraith", count: 10 },
  { name: "Catacomb Specter", count: 10 },
  { name: "Catacomb Phantom", count: 10 },
  { name: "Catacomb Shadow", count: 10 },
  { name: "Catacomb Ghoul", count: 10 },
  { name: "Catacomb Banshee", count: 10 },
  { name: "Catacomb Revenant", count: 10 },
  { name: "Catacomb Lich", count: 10 },
  { name: "Catacomb Skeleton", count: 10 },
  { name: "Catacomb Undead", count: 10 },
];

let mobIndex = 0;
let groupIndex = 0;
let currentGroupCount = 0;

for (let i = 0; i < 100; i++) {
  // Розподіл рівнів: 0-6 -> 20, 7-13 -> 21, 14-20 -> 22, 21-27 -> 23, 28-34 -> 24, 35-41 -> 25,
  // 42-48 -> 26, 49-55 -> 27, 56-62 -> 28, 63-69 -> 29, 70-76 -> 30, 77-83 -> 31,
  // 84-90 -> 32, 91-97 -> 33, 98-99 -> 34-35
  const level = Math.floor(i / 6.25) + 20;
  const clampedLevel = Math.min(35, Math.max(20, level));
  
  // Перестворюємо стати для кожного моба (щоб урон був різним)
  const stats = createMobStats(clampedLevel, false);
  
  // Визначаємо назву на основі групування
  if (currentGroupCount >= mobNameGroups[groupIndex].count) {
    groupIndex = (groupIndex + 1) % mobNameGroups.length;
    currentGroupCount = 0;
  }
  
  const mobName = mobNameGroups[groupIndex].name;
  currentGroupCount++;
  
  // Додаємо дроп каменів печатей
  const sealStoneDrops = generateSealStoneDrops();
  
  // Визначаємо агресивну групу для певних типів мобів
  let aggressiveGroup: string | undefined = undefined;
  if (mobName === "Catacomb Wraith") {
    aggressiveGroup = "wraith";
  } else if (mobName === "Catacomb Specter") {
    aggressiveGroup = "specter";
  }
  
  normalMobs.push({
    id: `fl_catacombs_mob_${i + 1}`,
    name: mobName,
    ...stats,
    drops: sealStoneDrops,
    spoil: [], // Без спойлів для катакомб
    aggressiveGroup, // Додаємо агресивну групу для певних мобів
  });
  
  mobIndex++;
}

// Додаємо 10 чемпіонів (на позиціях: 9, 19, 29, 39, 49, 59, 69, 79, 89, 99)
const championIndices = [9, 19, 29, 39, 49, 59, 69, 79, 89, 99];
const championNames = [
  "[Champion] Catacomb Archlich",
  "[Champion] Catacomb Deathlord",
  "[Champion] Catacomb Bone King",
  "[Champion] Catacomb Soul Eater",
  "[Champion] Catacomb Dark Wraith",
  "[Champion] Catacomb Ancient Horror",
  "[Champion] Catacomb Cursed Specter",
  "[Champion] Catacomb Undead Master",
  "[Champion] Catacomb Shadow Lord",
  "[Champion] Catacomb Eternal Warden",
];

championIndices.forEach((index, i) => {
  // Рівні для чемпіонів: 25-35
  const championLevel = 25 + (i % 11);
  const stats = createMobStats(championLevel, true);
  
  // Камені печатей для чемпіонів (ті самі параметри)
  const championSealStoneDrops = generateSealStoneDrops();
  
  // Замінюємо звичайного моба на чемпіона
  normalMobs[index] = {
    id: `fl_catacombs_champion_${i + 1}`,
    name: championNames[i],
    ...stats,
    drops: championSealStoneDrops,
    spoil: [],
  };
});

export const FLORAN_CATACOMBS_MOBS: Mob[] = normalMobs;
