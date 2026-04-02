import { itemsDB, itemsDBWithStarter } from "../data/items/itemsDB";
import {
  getL2dopResourceIconPath,
  getL2DropEntryByItemIdPath,
  STRING_ID_TO_L2_ITEM_ID,
} from "../data/world/l2dop/droplistMapping";
import { resourceLootDisplayName } from "./resourceLootDisplayName";

export function normalizeLootIconPath(icon: string): string {
  return icon.startsWith("/") ? icon : `/items/${icon}`;
}

function getItemDef(itemId: string) {
  return itemsDB[itemId] || itemsDBWithStarter[itemId];
}

/**
 * Іконка з id предмета: itemsDB → l2dop resource map → l2item_{l2ItemId} (як у dropLineIconPath для телепорту).
 */
export function resolveLootIconPathFromItemId(itemId: string): string {
  if (!itemId) return "/items/default_item.png";
  const def = getItemDef(itemId);
  if (def?.icon) return normalizeLootIconPath(def.icon);
  const l2 = getL2dopResourceIconPath(itemId);
  if (l2) return l2;
  if (itemId.startsWith("l2item_")) {
    const n = parseInt(itemId.replace(/^l2item_/, ""), 10);
    if (Number.isFinite(n)) {
      const p = getL2DropEntryByItemIdPath({ kind: "resource", l2ItemId: n });
      if (p) return p;
    }
  }
  return "/items/default_item.png";
}

function stripGradesForLootMatch(name: string): string {
  if (!name) return name;
  return name
    .replace(/\s*\[NG\]\s*/gi, "")
    .replace(/\s*\[D\]\s*/gi, "")
    .replace(/\s*\[C\]\s*/gi, "")
    .replace(/\s*\[B\]\s*/gi, "")
    .replace(/\s*\[A\]\s*/gi, "")
    .replace(/\s*\[S\]\s*/gi, "")
    .trim();
}

function normalizeDisplayKey(name: string): string {
  return stripGradesForLootMatch(name).trim().toLowerCase();
}

let displayNameToIcon: Map<string, string> | null = null;

function buildDisplayNameToIconMap(): Map<string, string> {
  const m = new Map<string, string>();
  for (const def of Object.values(itemsDB)) {
    const k = normalizeDisplayKey(def.name);
    if (!k || !def.icon) continue;
    if (!m.has(k)) m.set(k, normalizeLootIconPath(def.icon));
  }
  for (const def of Object.values(itemsDBWithStarter)) {
    const k = normalizeDisplayKey(def.name);
    if (!k || !def.icon || m.has(k)) continue;
    m.set(k, normalizeLootIconPath(def.icon));
  }
  for (const strId of Object.keys(STRING_ID_TO_L2_ITEM_ID)) {
    const l2path = getL2dopResourceIconPath(strId);
    if (!l2path) continue;
    const dn = resourceLootDisplayName(strId);
    const k = normalizeDisplayKey(dn);
    if (k && !m.has(k)) m.set(k, l2path);
  }
  return m;
}

/**
 * Іконка для рядка бою «Дроб: Назва xN» — збігається з processMobDrops displayName + ресурси з droplistMapping.
 */
export function getLootIconPathForDisplayName(displayName: string): string | null {
  const raw = displayName.trim();
  if (!raw) return null;
  if (normalizeDisplayKey(raw) === normalizeDisplayKey("Адена")) return "/assets/adena.png";
  if (!displayNameToIcon) displayNameToIcon = buildDisplayNameToIconMap();
  return displayNameToIcon.get(normalizeDisplayKey(raw)) ?? null;
}
