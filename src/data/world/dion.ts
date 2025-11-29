import type { City, Zone, Mob } from "./types";

export const DION_CITY: City = {
  id: "dion",
  name: "Town of Dion",
  tpCost: 24_000,
};

// Тимчасово мінімальний набір мобів, як приклад
const EXECUTION_GROUNDS_MOBS: Mob[] = [
  {
    id: "eg_dire_wolf",
    name: "Dire Wolf",
    level: 26,
    hp: 1150,
    exp: 2400,
    adenaMin: 520,
    adenaMax: 880,
    dropChance: 0.34,
  },
];

export const DION_ZONES: Zone[] = [
  {
    id: "execution_grounds",
    name: "Execution Grounds",
    cityId: "dion",
    minLevel: 25,
    maxLevel: 35,
    tpCost: 2_400,
    mobs: EXECUTION_GROUNDS_MOBS,
  },
];
