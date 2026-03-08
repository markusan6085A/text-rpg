import type { City, Zone, Mob } from "./types";
import { GLUDIN_VILLAGE_MOBS } from "../zones/gludin_village";
import { GLUDIN_VILLAGE_ELITE_MOBS } from "../zones/gludin_village_elite";
import { GLUDIN_VILLAGE_CORE_MOBS } from "../zones/gludin_village_core";
import { GLUDIN_SANCTUARY_MOBS } from "../zones/gludin_sanctuary";
import { GLUDIN_STRONGHOLD_MOBS } from "../zones/gludin_stronghold";
import { GLUDIN_HIGHLANDS_MOBS } from "../zones/gludin_highlands";
import { GLUDIN_PLATEAU_MOBS } from "../zones/gludin_plateau";

export const GLUDIN_CITY: City = {
  id: "gludin",
  name: "Gludin Village",
  tpCost: 36_000,
};

export const GLUDIN_ZONES: Zone[] = [
  {
    id: "gludin_village",
    name: "Gludin Outskirts",
    minLevel: 20,
    maxLevel: 30,
    tpCost: 5000,
    cityId: "gludin",
    mobs: GLUDIN_VILLAGE_MOBS as Mob[],
  },
  {
    id: "gludin_highlands",
    name: "Gludin Highlands",
    minLevel: 32,
    maxLevel: 40,
    tpCost: 8000,
    cityId: "gludin",
    mobs: GLUDIN_HIGHLANDS_MOBS as Mob[],
  },
  {
    id: "gludin_plateau",
    name: "Gludin Plateau",
    minLevel: 35,
    maxLevel: 46,
    tpCost: 10000,
    cityId: "gludin",
    mobs: GLUDIN_PLATEAU_MOBS as Mob[],
  },
  {
    id: "gludin_village_elite",
    name: "Gludin Village",
    minLevel: 40,
    maxLevel: 46,
    tpCost: 12000,
    cityId: "gludin",
    mobs: GLUDIN_VILLAGE_ELITE_MOBS as Mob[],
  },
  {
    id: "gludin_sanctuary",
    name: "Gludin Sanctuary",
    minLevel: 38,
    maxLevel: 47,
    tpCost: 11000,
    cityId: "gludin",
    mobs: GLUDIN_SANCTUARY_MOBS as Mob[],
  },
  {
    id: "gludin_stronghold",
    name: "Gludin Stronghold",
    minLevel: 40,
    maxLevel: 50,
    tpCost: 13000,
    cityId: "gludin",
    mobs: GLUDIN_STRONGHOLD_MOBS as Mob[],
  },
  {
    id: "gludin_village_core",
    name: "Gludin Village Core",
    minLevel: 45,
    maxLevel: 45,
    tpCost: 14000,
    cityId: "gludin",
    mobs: GLUDIN_VILLAGE_CORE_MOBS as Mob[],
  },
];
