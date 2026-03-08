import { itemsDBCrystals } from "../../data/items/itemsDB_crystals";

const LS_STAT_KEYS = ["luckyStrike", "mCrit", "maxHpPercent", "focus", "lifeSteal", "guidance", "empower", "acumen", "anger", "magicParry", "rskFocus", "rskEvasion", "rskHaste", "backbiting"] as const;

/** Відновлює стати LS з itemsDBCrystals, якщо equipmentInserts має lsId/crystalId, але втратив числові значення (після F5/сервера). */
export function repairEquipmentInserts(inserts: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!inserts || typeof inserts !== "object") return inserts;
  let changed = false;
  const result = { ...inserts };
  for (const slot of ["weapon", "lrhand"] as const) {
    const ins = result[slot] as Record<string, unknown> | undefined;
    if (!ins || typeof ins !== "object") continue;
    const crystalId = (ins.lsId ?? ins.crystalId) as string | undefined;
    if (!crystalId) continue;
    const def = itemsDBCrystals[crystalId as keyof typeof itemsDBCrystals];
    const stats = def?.stats as Record<string, number> | undefined;
    if (!stats || typeof stats !== "object") continue;
    let needsRepair = false;
    for (const k of LS_STAT_KEYS) {
      if (stats[k] != null && (ins[k] == null || ins[k] === 0)) needsRepair = true;
    }
    if (!needsRepair) continue;
    const repaired = { ...ins };
    for (const k of LS_STAT_KEYS) {
      const v = stats[k];
      if (v != null && (repaired[k] == null || repaired[k] === 0)) {
        repaired[k] = v;
        changed = true;
      }
    }
    result[slot] = repaired;
  }
  return changed ? result : inserts;
}
