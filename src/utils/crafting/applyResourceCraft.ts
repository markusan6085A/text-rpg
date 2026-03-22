import type { HeroInventoryItem } from "../../types/Hero";
import { itemsDB } from "../../data/items/itemsDB";
import { getL2dopResourceIconPath, l2ItemIdToString } from "../../data/world/l2dop/droplistMapping";
import { resourceLootDisplayName } from "../resourceLootDisplayName";
import type { ResourceCraftRecipe } from "../../data/crafting/resourceCraftLevel1";
import type { StringIdCraftRecipe } from "../../data/crafting/resourceCraftTypes";

const STACK_SLOTS = new Set(["consumable", "resource", "quest"]);

export function countResourceInInventory(inventory: HeroInventoryItem[], itemId: string): number {
  let n = 0;
  for (const raw of inventory) {
    if (!raw) continue;
    if ((raw as any).meta?.hasLSPassive) continue;
    if (raw.id !== itemId) continue;
    n += raw.count ?? 1;
  }
  return n;
}

function aggregateStringIngredientNeeds(recipe: StringIdCraftRecipe): Record<string, number> {
  const needs: Record<string, number> = {};
  for (const ing of recipe.ingredients) {
    needs[ing.stringId] = (needs[ing.stringId] ?? 0) + ing.count;
  }
  return needs;
}

function removeNeedsFromInventory(
  inv: HeroInventoryItem[],
  needs: Record<string, number>
): HeroInventoryItem[] | null {
  const rem: Record<string, number> = { ...needs };
  const out: HeroInventoryItem[] = [];
  for (const raw of inv) {
    if (!raw) continue;
    const item = raw as HeroInventoryItem;
    if ((item as any).meta?.hasLSPassive) {
      out.push(item);
      continue;
    }
    const id = item.id;
    const need = rem[id] ?? 0;
    if (need <= 0) {
      out.push(item);
      continue;
    }
    const have = item.count ?? 1;
    if (have <= need) {
      rem[id] = need - have;
    } else {
      out.push({ ...item, count: have - need });
      rem[id] = 0;
    }
  }
  for (const k of Object.keys(rem)) {
    if (rem[k]! > 0) return null;
  }
  return out;
}

function outputDisplayName(itemId: string): string {
  const def = itemsDB[itemId];
  return def?.name ?? resourceLootDisplayName(itemId);
}

function outputIconPath(itemId: string): string {
  const def = itemsDB[itemId];
  if (def?.icon) return def.icon.startsWith("/") ? def.icon : `/items/${def.icon}`;
  return getL2dopResourceIconPath(itemId) ?? "/items/default_item.png";
}

function canAddOutputSlot(inv: HeroInventoryItem[], outputId: string, maxSlots: number): boolean {
  const def = itemsDB[outputId];
  const canStack =
    def?.stackable !== false &&
    (def ? STACK_SLOTS.has(def.slot) : true);
  if (canStack) {
    const idx = inv.findIndex(
      (i) =>
        i &&
        i.id === outputId &&
        !(i as any).meta?.hasLSPassive &&
        STACK_SLOTS.has(i.slot)
    );
    if (idx >= 0) return true;
  }
  return inv.filter(Boolean).length < maxSlots;
}

function addResourceStack(inv: HeroInventoryItem[], itemId: string, add: number): HeroInventoryItem[] {
  const def = itemsDB[itemId];
  const name = outputDisplayName(itemId);
  const icon = outputIconPath(itemId);
  const canStack =
    def?.stackable !== false &&
    (def ? STACK_SLOTS.has(def.slot) : true);

  if (canStack) {
    const idx = inv.findIndex(
      (i) =>
        i &&
        i.id === itemId &&
        !(i as any).meta?.hasLSPassive &&
        STACK_SLOTS.has(i.slot)
    );
    if (idx >= 0) {
      const copy = [...inv];
      const it = copy[idx]!;
      copy[idx] = { ...it, count: (it.count ?? 1) + add };
      return copy;
    }
  }

  const newItem: HeroInventoryItem = def
    ? {
        id: def.id,
        name: def.name,
        type: def.kind,
        slot: def.slot,
        icon: def.icon
          ? def.icon.startsWith("/")
            ? def.icon
            : `/items/${def.icon}`
          : icon,
        description: def.description ?? "",
        stats: def.stats,
        count: add,
      }
    : {
        id: itemId,
        name,
        type: "resource",
        slot: "resource",
        icon,
        description: "",
        count: add,
      };
  return [...inv, newItem];
}

export function tryApplyStringIdCraftRecipe(
  inventory: HeroInventoryItem[] | undefined,
  recipe: StringIdCraftRecipe,
  maxSlots: number,
  quantity: number = 1
): { ok: true; inventory: HeroInventoryItem[] } | { ok: false } {
  const outputId = recipe.outputId;
  if (!outputId) return { ok: false };
  const q = Math.floor(Number(quantity));
  if (q < 1 || !Number.isFinite(q)) return { ok: false };

  const inv = [...(inventory ?? [])].filter(Boolean) as HeroInventoryItem[];
  const baseNeeds = aggregateStringIngredientNeeds(recipe);
  if (Object.keys(baseNeeds).length === 0) return { ok: false };

  const needs: Record<string, number> = {};
  for (const id of Object.keys(baseNeeds)) {
    needs[id] = baseNeeds[id]! * q;
  }

  for (const id of Object.keys(needs)) {
    if (countResourceInInventory(inv, id) < needs[id]!) return { ok: false };
  }

  const afterRemove = removeNeedsFromInventory(inv, needs);
  if (!afterRemove) return { ok: false };

  if (!canAddOutputSlot(afterRemove, outputId, maxSlots)) return { ok: false };

  const afterAdd = addResourceStack(afterRemove, outputId, q);
  return { ok: true, inventory: afterAdd };
}

export function tryApplyResourceCraft(
  inventory: HeroInventoryItem[] | undefined,
  recipe: ResourceCraftRecipe,
  maxSlots: number,
  quantity: number = 1
): { ok: true; inventory: HeroInventoryItem[] } | { ok: false } {
  const outputId = l2ItemIdToString(recipe.outputL2ItemId);
  if (!outputId) return { ok: false };

  const ingredients: StringIdCraftRecipe["ingredients"] = [];
  for (const ing of recipe.ingredients) {
    const sid = l2ItemIdToString(ing.l2ItemId);
    if (!sid) return { ok: false };
    ingredients.push({ stringId: sid, count: ing.count });
  }

  return tryApplyStringIdCraftRecipe(inventory, { outputId, ingredients }, maxSlots, quantity);
}

/** Скільки разів можна виконати рецепт за наявних матеріалів і слотів (ціле ≥ 1). */
export function computeMaxCraftable(
  inventory: HeroInventoryItem[] | undefined,
  recipe: StringIdCraftRecipe,
  maxSlots: number
): number {
  const inv = [...(inventory ?? [])].filter(Boolean) as HeroInventoryItem[];
  const needs = aggregateStringIngredientNeeds(recipe);
  if (Object.keys(needs).length === 0) return 0;
  let max = Infinity;
  for (const id of Object.keys(needs)) {
    const need = needs[id]!;
    if (need <= 0) return 0;
    const have = countResourceInInventory(inv, id);
    max = Math.min(max, Math.floor(have / need));
  }
  if (!Number.isFinite(max) || max <= 0) return 0;
  const probe = tryApplyStringIdCraftRecipe(inv, recipe, maxSlots, 1);
  if (!probe.ok) return 0;
  return max;
}
