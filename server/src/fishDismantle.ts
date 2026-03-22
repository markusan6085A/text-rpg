/**
 * Розділка риби на сервері — дроп вимкнено (порожній результат).
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

export function processFishDrop(_fishCount: number): FishDropResult {
  return {
    adena: 0,
    coinOfLuck: 0,
    coinsSilver: 0,
    weapons: [],
    armorPieces: [],
    jewelryPieces: [],
    resources: [],
    enchantScrolls: [],
  };
}

export interface InventoryItemToAdd {
  id: string;
  name: string;
  type?: string;
  slot: string;
  icon?: string;
  count: number;
}

export function buildItemsFromDrop(_result: FishDropResult): InventoryItemToAdd[] {
  return [];
}
