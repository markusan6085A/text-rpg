// src/data/world/l2dop/cities.ts
// Міста з l2dop / L2 — підключаються при USE_L2DOP_WORLD = true

import type { City } from "../types";

/**
 * Міста з l2dop (екстракт з lineage.sql spawnlist.location).
 * Порядок і англ. назви — як у wiki Interlude (Города).
 */
export const L2DOP_CITIES: City[] = [
  { id: "floran_village", name: "Floran Village", tpCost: 12_000 },
  { id: "gludin_village", name: "Gludin Village", tpCost: 11_000 },
  { id: "l2dop_heine", name: "Heine", tpCost: 43_000 },
  { id: "hunters_village", name: "Hunters Village", tpCost: 45_000 },
  { id: "l2dop_rune", name: "Rune Township", tpCost: 59_000 },
  { id: "l2dop_aden", name: "Town of Aden", tpCost: 48_000 },
  { id: "l2dop_dion", name: "Town of Dion", tpCost: 36_000 },
  { id: "l2dop_giran", name: "Town of Giran", tpCost: 41_000 },
  { id: "l2dop_gludio", name: "Town of Gludio", tpCost: 29_000 },
  { id: "l2dop_goddard", name: "Town of Goddard", tpCost: 55_000 },
  { id: "l2dop_oren", name: "Town of Oren", tpCost: 51_000 },
  { id: "l2dop_schuttgart", name: "Town of Schuttgart", tpCost: 58_000 },
];
