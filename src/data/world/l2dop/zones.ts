// src/data/world/l2dop/zones.ts
// Локації (зони) з мобами з l2dop — підключаються при USE_L2DOP_WORLD = true

import type { Zone } from "../types";

/**
 * Локації з l2dop (місто → зони з мобами, дроп, спойл).
 * Поки порожні — буде заповнено на етапі 3–4.
 * ID зон мають починатися з "l2dop_" для коректної роботи DISABLE_OUR_RESOURCES.
 */
export const L2DOP_ZONES: Zone[] = [];
