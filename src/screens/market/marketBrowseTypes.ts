import type { HeroInventoryItem } from "../../types/Hero";
import type { MarketListingDTO } from "../../utils/api";
import { calculateEnchantedStats } from "../character/inventoryUtils";

export type MarketBrowseBuyPreviewEnchanted = ReturnType<typeof calculateEnchantedStats>;

/** Той самий об'єкт, що повертає useMemo `browseBuyPreview` у Market.tsx */
export interface MarketBrowseBuyPreview {
  L: MarketListingDTO;
  it: HeroInventoryItem & { itemId?: string };
  isColLot: boolean;
  lotCnt: number;
  bal: number;
  maxCan: number;
  partial: boolean;
  qty: number;
  pay: bigint;
  enchanted: MarketBrowseBuyPreviewEnchanted | null;
  itemDef?: { description?: string; stats?: Record<string, number | undefined> } | null;
  rowId: string;
}
