// src/data/world/l2dop/zones.ts
// Локації (зони) з мобами з l2dop — підключаються при USE_L2DOP_WORLD = true

import type { Zone } from "../types";
import {
  L2DOP_GLUDIO32_1725_MOBS,
  L2DOP_GLUDIO15_1721_MOBS,
  L2DOP_GIRAN03_2321_MOBS,
} from "./mobs";

/**
 * Локації з l2dop (місто → зони з мобами, дроп, спойл).
 * ID зон починаються з "l2dop_" для коректної роботи DISABLE_OUR_RESOURCES.
 */
export const L2DOP_ZONES: Zone[] = [
  {
    id: "l2dop_gludio32_1725_01",
    name: "Gludio — Окраїна (L2)",
    cityId: "l2dop_gludio",
    minLevel: 1,
    maxLevel: 5,
    tpCost: 5000,
    mobs: L2DOP_GLUDIO32_1725_MOBS,
  },
  {
    id: "l2dop_gludio15_1721_22s",
    name: "Gludio — Орки (L2)",
    cityId: "l2dop_gludio",
    minLevel: 30,
    maxLevel: 40,
    tpCost: 12000,
    mobs: L2DOP_GLUDIO15_1721_MOBS,
  },
  {
    id: "l2dop_giran03_2321_15",
    name: "Giran — Печера (L2)",
    cityId: "l2dop_giran",
    minLevel: 55,
    maxLevel: 65,
    tpCost: 25000,
    mobs: L2DOP_GIRAN03_2321_MOBS,
  },
];
