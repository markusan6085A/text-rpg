import type { City, Zone, Mob } from "./types";
import { GLUDIO_TERRITORY_MOBS } from "../zones/gludio_territory";

export const GLUDIO_CITY: City = {
  id: "gludio",
  name: "Town of Gludio",
  tpCost: 41_000,
};

export const GLUDIO_ZONES: Zone[] = [
  {
    id: "gludio_territory",
    name: "Gludio Territory",
    minLevel: 40,
    maxLevel: 52,
    tpCost: 12000,
    cityId: "gludio",
    mobs: GLUDIO_TERRITORY_MOBS as Mob[],
  },
];
