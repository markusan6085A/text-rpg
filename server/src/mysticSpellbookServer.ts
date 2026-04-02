/**
 * Мінімальні дані для здачі книги (дубль skillId → bookItemId з клієнта).
 * Порядок узгоджувати з src/data/spellbooks/mysticSpellbookData.ts
 */
export const MYSTIC_SPELLBOOK_TURNIN: Record<number, { bookItemId: string; targetLevel: number }> = {
  1011: { bookItemId: "l2_dop_sb_1152", targetLevel: 1 },
  1012: { bookItemId: "l2_dop_sb_1053", targetLevel: 1 },
  1015: { bookItemId: "l2_dop_sb_1050", targetLevel: 1 },
  1027: { bookItemId: "l2_dop_sb_1054", targetLevel: 1 },
  1040: { bookItemId: "l2_dop_sb_1058", targetLevel: 1 },
  1068: { bookItemId: "l2_dop_sb_1048", targetLevel: 1 },
  1147: { bookItemId: "l2_dop_sb_1051", targetLevel: 1 },
  1164: { bookItemId: "l2_dop_sb_1056", targetLevel: 1 },
  1168: { bookItemId: "l2_dop_sb_1055", targetLevel: 1 },
  1184: { bookItemId: "l2_dop_sb_1049", targetLevel: 1 },
  1069: { bookItemId: "l2_dop_sb_1394", targetLevel: 1 },
  1078: { bookItemId: "l2_dop_sb_1399", targetLevel: 1 },
  1111: { bookItemId: "l2_dop_sb_1403", targetLevel: 1 },
  1126: { bookItemId: "l2_dop_sb_1404", targetLevel: 1 },
  1127: { bookItemId: "l2_dop_sb_1405", targetLevel: 1 },
  1144: { bookItemId: "l2_dop_sb_1406", targetLevel: 1 },
  1151: { bookItemId: "l2_dop_sb_1516", targetLevel: 1 },
  1157: { bookItemId: "l2_dop_sb_1517", targetLevel: 1 },
  1160: { bookItemId: "l2_dop_sb_1409", targetLevel: 1 },
  1167: { bookItemId: "l2_dop_sb_1410", targetLevel: 1 },
  1172: { bookItemId: "l2_dop_sb_1411", targetLevel: 1 },
  1181: { bookItemId: "l2_dop_sb_1052", targetLevel: 1 },
  1220: { bookItemId: "l2_dop_sb_1372", targetLevel: 1 },
  1222: { bookItemId: "l2_dop_sb_1416", targetLevel: 1 },
  1225: { bookItemId: "l2_dop_sb_1668", targetLevel: 1 },
  1274: { bookItemId: "l2_dop_sb_4916", targetLevel: 1 },
};

export function mysticSpellbookGuildKey(skillId: number, targetLevel: number): string {
  return `${skillId}_${targetLevel}`;
}

export function heroLooksMystic(heroJson: any): boolean {
  if (!heroJson || typeof heroJson !== "object") return false;
  const klass = String(heroJson.klass ?? heroJson.classId ?? "");
  if (/mystic|маг/i.test(klass)) return true;
  const p = String(heroJson.profession ?? "").toLowerCase();
  return (
    p.includes("mystic") ||
    p.includes("_cleric") ||
    p.includes("_wizard") ||
    p.includes("_oracle") ||
    p.includes("_shaman") ||
    p.includes("_elder") ||
    p.includes("bishop") ||
    p.includes("prophet")
  );
}

function isStackableItem(item: any): boolean {
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

export function removeOneStackFromInventory(
  inventory: any[],
  itemId: string
): { newInventory: any[] } {
  const inv = Array.isArray(inventory) ? [...inventory] : [];
  const idx = inv.findIndex((e: any) => e && e.id === itemId);
  if (idx < 0) throw new Error("item not found");
  const entry = inv[idx];
  if (!isStackableItem(entry)) {
    inv.splice(idx, 1);
    return { newInventory: inv };
  }
  const c = Math.max(1, Math.floor(Number(entry.count) || 1));
  if (c > 1) {
    inv[idx] = { ...entry, count: c - 1 };
  } else {
    inv.splice(idx, 1);
  }
  return { newInventory: inv };
}
