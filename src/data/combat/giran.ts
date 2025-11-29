import type { Zone } from "./types";

// Рейтовий сервер x2000, але шанс дропа ресурсів/шмоток тримаємо в межах:
// ресурси: 0.01–0.5 (1–50%)
// шмот:   0.002–0.008 (0.2–0.8%)

export const GIRAN_ZONES: Zone[] = [
  {
    id: "giran_harbor",
    cityId: "giran",
    name: "Гавань Гирана",
    minLevel: 30,
    maxLevel: 40,
    mobs: [
      {
        id: "giran_harbor_pirate",
        name: "Harbor Pirate",
        level: 32,
        hp: 950,
        mp: 400,
        pAtk: 115,
        mAtk: 60,
        pDef: 85,
        mDef: 70,
        exp: 9500,
        sp: 120,

        drops: [
          // адена майже завжди
          {
            id: "adena",
            kind: "adena",
            chance: 0.95,
            min: 8000,
            max: 15000,
          },
          // ресурси (1–50%)
          {
            id: "coal",
            kind: "resource",
            chance: 0.30,
            min: 1,
            max: 3,
          },
          {
            id: "iron_ore",
            kind: "resource",
            chance: 0.25,
            min: 1,
            max: 3,
          },
          // шмотка (0.2–0.8%)
          {
            id: "c_sword_pirate_cutlass",
            kind: "equipment",
            chance: 0.004, // 0.4%
            min: 1,
            max: 1,
          },
        ],
      },
      {
        id: "giran_harbor_smuggler",
        name: "Harbor Smuggler",
        level: 34,
        hp: 1050,
        mp: 430,
        pAtk: 125,
        mAtk: 70,
        pDef: 90,
        mDef: 75,
        exp: 10500,
        sp: 140,
        drops: [
          {
            id: "adena",
            kind: "adena",
            chance: 0.95,
            min: 9000,
            max: 17000,
          },
          {
            id: "silver_ore",
            kind: "resource",
            chance: 0.22,
            min: 1,
            max: 2,
          },
          {
            id: "c_earring_silver",
            kind: "equipment",
            chance: 0.003, // 0.3%
            min: 1,
            max: 1,
          },
        ],
      },
    ],
  },

  {
    id: "dragon_valley_entrance",
    cityId: "giran",
    name: "Долина Драконів (вхід)",
    minLevel: 45,
    maxLevel: 55,
    mobs: [
      {
        id: "dv_lesser_drake",
        name: "Lesser Drake",
        level: 47,
        hp: 2100,
        mp: 600,
        pAtk: 210,
        mAtk: 110,
        pDef: 135,
        mDef: 110,
        exp: 21000,
        sp: 350,
        drops: [
          {
            id: "adena",
            kind: "adena",
            chance: 0.96,
            min: 20000,
            max: 40000,
          },
          {
            id: "drake_scale",
            kind: "resource",
            chance: 0.35,
            min: 1,
            max: 3,
          },
          {
            id: "bone_powder",
            kind: "resource",
            chance: 0.20,
            min: 1,
            max: 2,
          },
          {
            id: "b_armor_drake_leather",
            kind: "equipment",
            chance: 0.005, // 0.5%
            min: 1,
            max: 1,
          },
        ],
      },
      {
        id: "dv_cave_servitor",
        name: "Cave Servitor",
        level: 50,
        hp: 2400,
        mp: 650,
        pAtk: 230,
        mAtk: 120,
        pDef: 145,
        mDef: 115,
        exp: 24000,
        sp: 400,
        drops: [
          {
            id: "adena",
            kind: "adena",
            chance: 0.96,
            min: 23000,
            max: 45000,
          },
          {
            id: "mithril_ore",
            kind: "resource",
            chance: 0.28,
            min: 1,
            max: 2,
          },
          {
            id: "stone_of_purity",
            kind: "resource",
            chance: 0.18,
            min: 1,
            max: 1,
          },
          {
            id: "b_sword_cave_blade",
            kind: "equipment",
            chance: 0.0035, // 0.35%
            min: 1,
            max: 1,
          },
        ],
      },
    ],
  },
];
