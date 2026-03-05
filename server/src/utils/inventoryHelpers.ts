/**
 * Утиліти для роботи з інвентарем (heroJson.inventory).
 * Використовується в letters, clans/warehouse та інших місцях.
 */
export function isStackableItem(item: any): boolean {
  const kind = String(item?.kind || "").toLowerCase();
  const slot = String(item?.slot || "").toLowerCase();
  return (
    kind === "resource" ||
    kind === "consumable" ||
    kind === "quest" ||
    kind === "scroll" ||
    slot === "resource" ||
    slot === "consumable" ||
    slot === "quest"
  );
}

export function pickSafeItemFields(item: any, count: number): any {
  return {
    id: item?.id,
    name: item?.name ?? item?.id ?? "Item",
    icon: item?.icon,
    slot: item?.slot,
    kind: item?.kind,
    description: item?.description,
    enchantLevel: Number(item?.enchantLevel ?? 0) || 0,
    stats: item?.stats ?? undefined,
    count: Math.max(1, Math.floor(Number(count) || 1)),
  };
}

export function removeItemFromInventory(
  inventory: any[],
  reqItem: { id: string; count: number; enchantLevel?: number }
): { newInventory: any[]; transferItem: any } {
  const enchantLevel = Number(reqItem.enchantLevel ?? 0) || 0;
  const inv = Array.isArray(inventory) ? [...inventory] : [];
  const matches = (entry: any) => {
    if (!entry || entry.id !== reqItem.id) return false;
    const entryEnchant = Number(entry.enchantLevel ?? 0) || 0;
    return entryEnchant === enchantLevel;
  };

  const sample = inv.find(matches);
  if (!sample) throw new Error("item not found in inventory");
  const stackable = isStackableItem(sample);

  if (!stackable) {
    if (reqItem.count !== 1) throw new Error("non-stackable items can only be transferred as x1");
    const idx = inv.findIndex(matches);
    if (idx < 0) throw new Error("item not found in inventory");
    const removed = inv[idx];
    inv.splice(idx, 1);
    return { newInventory: inv, transferItem: pickSafeItemFields(removed, 1) };
  }

  let left = reqItem.count;
  const result: any[] = [];
  let removedSample: any = null;
  for (const entry of inv) {
    if (!matches(entry)) {
      result.push(entry);
      continue;
    }
    removedSample = removedSample || entry;
    const currentCount = Math.max(1, Math.floor(Number(entry.count) || 1));
    if (left <= 0) {
      result.push(entry);
      continue;
    }
    if (currentCount > left) {
      result.push({ ...entry, count: currentCount - left });
      left = 0;
      continue;
    }
    left -= currentCount;
  }
  if (left > 0) throw new Error("not enough item count in inventory");
  return { newInventory: result, transferItem: pickSafeItemFields(removedSample, reqItem.count) };
}

export function addItemToInventory(inventory: any[], item: any): any[] {
  const inv = Array.isArray(inventory) ? [...inventory] : [];
  const stackable = isStackableItem(item);
  if (!stackable) {
    inv.push({ ...item, count: 1 });
    return inv;
  }

  const targetEnchant = Number(item.enchantLevel ?? 0) || 0;
  const idx = inv.findIndex(
    (i: any) => i?.id === item.id && (Number(i?.enchantLevel ?? 0) || 0) === targetEnchant
  );
  const addCount = Math.max(1, Math.floor(Number(item.count) || 1));
  if (idx >= 0) {
    const prevCount = Math.max(1, Math.floor(Number(inv[idx]?.count) || 1));
    inv[idx] = { ...inv[idx], count: prevCount + addCount };
  } else {
    inv.push({ ...item, count: addCount });
  }
  return inv;
}
