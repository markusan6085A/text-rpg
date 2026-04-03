/**
 * Офлайн-фолбек для розділки (без characterId): лише адена/срібло як на сервері, без екстра-екіпу
 * (повний лут — тільки через POST /fish/dismantle).
 */

export interface FishDropResult {
  adena: number;
  coinOfLuck: number;
  coinsSilver: number;
  weapons: Array<{ id: string; count: number }>;
  armorPieces: Array<{ id: string; count: number }>;
  jewelryPieces: Array<{ id: string; count: number }>;
  resources: Array<{ id: string; count: number }>;
  enchantScrolls: Array<{ id: string; count: number }>;
}

export interface InventoryItemToAdd {
  id: string;
  name: string;
  type?: string;
  slot: string;
  icon?: string;
  description?: string;
  stats?: Record<string, unknown>;
  count: number;
}

export function processFishDrop(fishCount: number): FishDropResult {
  const n = Math.max(0, Math.floor(fishCount));
  const adenaPerFish = 100 + Math.floor(Math.random() * 400);
  let coinsSilver = 0;
  let coinOfLuck = 0;
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.015) coinsSilver += 1;
  }
  const batches10 = Math.floor(n / 10);
  for (let i = 0; i < batches10; i++) {
    if (Math.random() < 0.005) coinOfLuck += 1;
  }
  return {
    adena: n <= 0 ? 0 : adenaPerFish * n,
    coinOfLuck,
    coinsSilver,
    weapons: [],
    armorPieces: [],
    jewelryPieces: [],
    resources: [],
    enchantScrolls: [],
  };
}

export function buildItemsFromDrop(_result: FishDropResult): InventoryItemToAdd[] {
  return [];
}
