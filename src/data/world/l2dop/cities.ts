// src/data/world/l2dop/cities.ts
// Міста з l2dop / L2 — підключаються при USE_L2DOP_WORLD = true

import type { City } from "../types";

/**
 * Міста з l2dop (екстракт з lineage.sql spawnlist.location).
 */
export const L2DOP_CITIES: City[] = [
  { id: "l2dop_gludio", name: "Gludio (L2)", tpCost: 29_000 },
  { id: "l2dop_giran", name: "Giran (L2)", tpCost: 41_000 },
  { id: "l2dop_aden", name: "Aden (L2)", tpCost: 48_000 },
  { id: "l2dop_oren", name: "Орен (L2)", tpCost: 51_000 },
  { id: "l2dop_goddard", name: "Годдарт (L2)", tpCost: 55_000 },
];
