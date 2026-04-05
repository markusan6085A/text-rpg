/**
 * Авторитетне використання HP/MP/CP банок під час PvE (heroJson у базі як у pve-battle-tick).
 * Клієнт надсилає вже порахований heal/restore у «buffed» одиницях та buffedMax* для перетворення в base.
 */

import { applyServerToggleResourceTicks } from "./applyServerToggleTicks";
import { clampPveResource, syncHeroJsonResourcePercentsToAbsolutes } from "./pveHeroResourceSync";
import { weaponGradeFromId } from "./pveShotArrowsServer";

const POTION_RESTORE: Record<string, { hp?: number; mp?: number; cp?: number }> = {
  lesser_healing_potion: { hp: 200 },
  healing_potion: { hp: 500 },
  lesser_mana_potion: { mp: 200 },
  mana_potion: { mp: 500 },
  cp_potion: { cp: 500 },
};

function normId(id: string): string {
  return String(id || "")
    .toLowerCase()
    .replace(/^shop_/, "");
}

function buildShotSlotOrder(loadoutSlots: any[], activeChargeSlots: any[]): number[] {
  const len = Array.isArray(loadoutSlots) ? loadoutSlots.length : 0;
  const seen = new Set<number>();
  const out: number[] = [];
  for (const x of activeChargeSlots || []) {
    const n = typeof x === "string" ? parseInt(x, 10) : Number(x);
    if (!Number.isFinite(n) || n < 0 || n >= len) continue;
    const i = Math.floor(n);
    if (seen.has(i)) continue;
    seen.add(i);
    out.push(i);
  }
  return out;
}

function isShotConsumable(itemId: string, shotType: "soulshot" | "spiritshot"): boolean {
  const id = normId(itemId);
  if (id.startsWith(shotType)) return true;
  const parts = id.split("_").filter(Boolean);
  return parts.includes(shotType);
}

function shotGradeFromItemId(itemId: string): string | null {
  const id = normId(itemId);
  if (id.endsWith("_ng_silver")) return "NG";
  if (id.endsWith("_ng")) return "NG";
  const parts = id.split("_").filter(Boolean);
  const gradeMap: Record<string, string> = { ng: "NG", d: "D", c: "C", b: "B", a: "A", s: "S" };
  const last = parts[parts.length - 1] ?? "";
  if (gradeMap[last]) return gradeMap[last];
  if (last === "spiritshot" || last === "soulshot") {
    const prev = parts[parts.length - 2];
    if (prev && gradeMap[prev]) return gradeMap[prev];
  }
  if (parts.length >= 2 && (parts[1] === "spiritshot" || parts[1] === "soulshot")) {
    const first = parts[0];
    if (first && gradeMap[first]) return gradeMap[first];
  }
  return null;
}

function canonicalShotId(panelItemId: string, expectedShotType: "soulshot" | "spiritshot"): string | null {
  const id = normId(panelItemId);
  if (!isShotConsumable(id, expectedShotType)) return null;
  const g = shotGradeFromItemId(panelItemId);
  if (!g) return null;
  const gk = g === "NG" ? "ng" : g.toLowerCase();
  return expectedShotType === "spiritshot" ? `spiritshot_${gk}` : `soulshot_${gk}`;
}

function inventoryHasShotStack(
  inventory: any[],
  panelItemId: string,
  expectedShotType: "soulshot" | "spiritshot",
  minCount: number
): { id: string } | null {
  const canonical = canonicalShotId(panelItemId, expectedShotType);
  const want = normId(panelItemId);
  for (const i of inventory || []) {
    if (Number(i?.count) < minCount) continue;
    const iid = normId(i?.id);
    if (canonical && (iid === normId(canonical) || iid === canonical)) return { id: i.id };
    if (iid === want) return { id: i.id };
  }
  return null;
}

function inventoryHasExactStack(inventory: any[], panelItemId: string, minCount: number): { id: string } | null {
  const want = normId(panelItemId);
  for (const i of inventory || []) {
    if (Number(i?.count) < minCount) continue;
    if (normId(i?.id) === want) return { id: i.id };
  }
  return null;
}

function isUniversalBlessedCharge(itemId: string): boolean {
  return normId(itemId).startsWith("gm_blessed_charge_");
}

/** Spiritshot увімкнений на панелі (як client hasSpiritshotActive) — для ×2 хілу. */
export function serverSpiritshotActiveForHeal(
  inventory: any[],
  equipment: any,
  loadoutSlots: any[] | undefined,
  activeChargeSlots: any[] | undefined
): boolean {
  const inv = Array.isArray(inventory) ? inventory : [];
  const slots = Array.isArray(loadoutSlots) ? loadoutSlots : [];
  const weaponGrade = weaponGradeFromId(equipment?.weapon ?? equipment?.lrhand);
  for (const slotIndex of buildShotSlotOrder(slots, activeChargeSlots || [])) {
    const slotId = slots[slotIndex];
    if (typeof slotId !== "string" || !slotId.startsWith("consumable:")) continue;
    const itemId = (slotId.replace("consumable:", "") || "").replace(/^shop_/, "");
    if (isUniversalBlessedCharge(itemId)) {
      if (inventoryHasExactStack(inv, itemId, 1)) return true;
      continue;
    }
    if (!isShotConsumable(itemId, "spiritshot")) continue;
    const shotGrade = shotGradeFromItemId(itemId);
    if (weaponGrade != null && shotGrade != null && shotGrade !== weaponGrade) continue;
    if (inventoryHasShotStack(inv, itemId, "spiritshot", 1)) return true;
  }
  return false;
}

function sumHealReceivedBonusFromBuffs(buffs: any[], now: number): number {
  let sum = 0;
  const list = Array.isArray(buffs) ? buffs : [];
  for (const b of list) {
    if (!b || typeof b !== "object") continue;
    const exp = Number(b.expiresAt);
    const isToggle = exp === Number.MAX_SAFE_INTEGER;
    if (!isToggle && exp > 0 && exp <= now) continue;
    const effects = Array.isArray(b.effects) ? b.effects : [];
    for (const eff of effects) {
      if (!eff || eff.stat !== "healReceivedBonus") continue;
      let mode = eff.mode;
      if (!mode && eff.multiplier !== undefined && eff.multiplier !== null) mode = "multiplier";
      if (!mode) mode = "flat";
      const val =
        mode === "multiplier" ? Number(eff.multiplier ?? eff.value ?? 1) : Number(eff.value ?? 0);
      if (!Number.isFinite(val)) continue;
      if (mode === "percent") sum += val;
      else if (mode === "flat") sum += val;
    }
  }
  return sum;
}

function decInventoryOne(inventory: any[], itemId: string): { ok: boolean; next: any[] } {
  const inv = Array.isArray(inventory) ? [...inventory] : [];
  const want = normId(itemId);
  const idx = inv.findIndex((i: any) => normId(i?.id) === want && Number(i?.count) > 0);
  if (idx < 0) return { ok: false, next: inv };
  const it = inv[idx];
  const c = Math.max(0, Number(it.count) || 0);
  if (c <= 1) inv.splice(idx, 1);
  else inv[idx] = { ...it, count: c - 1 };
  return { ok: true, next: inv };
}

export type PveConsumableBody = {
  itemId: string;
  /** Відновлення в «buffed» одиницях (як у логу клієнта). */
  restoreAmountBuffed: number;
  buffedMaxHp?: number;
  buffedMaxMp?: number;
  buffedMaxCp?: number;
  loadoutSlots?: any[];
  activeChargeSlots?: any[];
};

export type PveConsumableResult =
  | {
      ok: true;
      nextHeroJson: any;
      logLine: string;
      heroHpAfter?: number;
      heroMpAfter?: number;
      heroCpAfter?: number;
    }
  | { ok: false; code: string; message?: string };

export function applyPveConsumableUseSnapshot(args: {
  heroJson: any;
  body: PveConsumableBody;
}): PveConsumableResult {
  const hjIn = args.heroJson && typeof args.heroJson === "object" ? args.heroJson : {};
  const hj = { ...hjIn };
  const sess: any = hj.battleSession;
  if (!sess || Number(sess.v) !== 1) {
    return { ok: false, code: "no_battle_session", message: "No active PvE battle on server" };
  }
  if (String(sess.zoneId || "") === "fishing") {
    return { ok: false, code: "fishing_local", message: "Fishing uses local combat" };
  }

  const rawItemId = String(args.body.itemId || "").trim();
  const itemIdNorm = normId(rawItemId);
  const def = POTION_RESTORE[itemIdNorm];
  if (!def) {
    return { ok: false, code: "unsupported_item", message: "Potion not supported in PvE sync" };
  }

  const now = Date.now();
  const sessStarted = Number(sess.startedAt) || 0;
  const youngBattle = sessStarted > 0 && now - sessStarted < 15_000;
  const toggleLines = applyServerToggleResourceTicks(hj, now, youngBattle ? { maxTickCatchup: 2 } : undefined);
  void toggleLines;

  const baseMaxHp = Math.max(1, Math.floor(Number(hj.maxHp ?? 1)));
  const baseMaxMp = Math.max(1, Math.floor(Number(hj.maxMp ?? 1)));
  const baseMaxCp = Math.max(1, Math.floor(Number(hj.maxCp ?? 1)));

  const invIn = Array.isArray(hj.inventory) ? hj.inventory : [];
  const dec = decInventoryOne(invIn, itemIdNorm);
  if (!dec.ok) {
    return { ok: false, code: "no_item", message: "Item not in inventory" };
  }
  hj.inventory = dec.next;

  const battleStats = hj.battleStats && typeof hj.battleStats === "object" ? hj.battleStats : {};
  const healRecvBase = Number((battleStats as any).healReceivedBonus ?? 0);
  const healRecvBuffs = sumHealReceivedBonusFromBuffs(Array.isArray(hj.heroBuffs) ? hj.heroBuffs : [], now);
  const healRecv = Math.max(0, healRecvBase + healRecvBuffs);

  const spirit = serverSpiritshotActiveForHeal(
    dec.next,
    hj.equipment || {},
    args.body.loadoutSlots,
    args.body.activeChargeSlots
  );

  const amountIn = Math.floor(Number(args.body.restoreAmountBuffed));
  if (!Number.isFinite(amountIn) || amountIn < 0) {
    return { ok: false, code: "invalid_input", message: "restoreAmountBuffed invalid" };
  }

  if (def.hp != null) {
    const baseRestore = def.hp;
    // Клієнт: restoreHp × (1+healReceivedBonus) × spiritshot; battleStats у heroJson на API часто відсутні —
    // тоді healRecv з бафів занижений і spirit на сервері може розійтися з панеллю. Не відхиляти легітний хіл.
    const fromBuffsAndStats = Math.round(
      baseRestore * (1 + Math.min(250, healRecv) / 100) * (spirit ? 2 : 1)
    );
    // Стеля «як у каталозі»: до 4× базового відновлення у buffed-одиницях ×2 при spirit (≈ до ×8 від restoreHp).
    const generousCeil = Math.max(fromBuffsAndStats, Math.round(baseRestore * 4 * (spirit ? 2 : 1)));
    const ABSURD_HEAL_MULT = 15;
    if (amountIn > Math.round(baseRestore * ABSURD_HEAL_MULT)) {
      return { ok: false, code: "invalid_heal", message: "Heal amount exceeds server cap" };
    }
    const appliedBuffed = Math.min(amountIn, generousCeil);
    const buffedCap = Math.floor(Number(args.body.buffedMaxHp));
    if (!Number.isFinite(buffedCap) || buffedCap < baseMaxHp || buffedCap > baseMaxHp * 5) {
      return { ok: false, code: "invalid_input", message: "buffedMaxHp out of range" };
    }
    const deltaBase = Math.max(0, Math.round((appliedBuffed * baseMaxHp) / Math.max(1, buffedCap)));
    const curHp = clampPveResource(Math.floor(Number(hj.hp ?? baseMaxHp)), 0, baseMaxHp);
    const nextHp = clampPveResource(curHp + deltaBase, 0, baseMaxHp);
    hj.hp = nextHp;
    syncHeroJsonResourcePercentsToAbsolutes(hj);
    const heroHpAfter = Math.max(0, Math.floor(Number(hj.hp ?? 0)));
    return {
      ok: true,
      nextHeroJson: hj,
      logLine: `Ви використали предмет (+${appliedBuffed} HP)`,
      heroHpAfter,
    };
  }

  if (def.mp != null) {
    const maxMpBuffed = Math.floor(Number(args.body.buffedMaxMp));
    if (!Number.isFinite(maxMpBuffed) || maxMpBuffed < baseMaxMp || maxMpBuffed > baseMaxMp * 5) {
      return { ok: false, code: "invalid_input", message: "buffedMaxMp out of range" };
    }
    const capRestore = def.mp;
    const mpCeil = Math.round(capRestore * 4);
    if (amountIn > Math.round(capRestore * 15)) {
      return { ok: false, code: "invalid_restore", message: "MP restore exceeds server cap" };
    }
    const appliedMp = Math.min(amountIn, mpCeil);
    const deltaBase = Math.max(0, Math.round((appliedMp * baseMaxMp) / Math.max(1, maxMpBuffed)));
    const curMp = clampPveResource(Math.floor(Number(hj.mp ?? baseMaxMp)), 0, baseMaxMp);
    hj.mp = clampPveResource(curMp + deltaBase, 0, baseMaxMp);
    syncHeroJsonResourcePercentsToAbsolutes(hj);
    return {
      ok: true,
      nextHeroJson: hj,
      logLine: `Ви використали предмет (+${appliedMp} MP)`,
      heroMpAfter: Math.max(0, Math.floor(Number(hj.mp ?? 0))),
    };
  }

  if (def.cp != null) {
    const maxCpBuffed = Math.floor(Number(args.body.buffedMaxCp));
    if (!Number.isFinite(maxCpBuffed) || maxCpBuffed < baseMaxCp || maxCpBuffed > baseMaxCp * 5) {
      return { ok: false, code: "invalid_input", message: "buffedMaxCp out of range" };
    }
    const capRestore = def.cp;
    const cpCeil = Math.round(capRestore * 4);
    if (amountIn > Math.round(capRestore * 15)) {
      return { ok: false, code: "invalid_restore", message: "CP restore exceeds server cap" };
    }
    const appliedCp = Math.min(amountIn, cpCeil);
    const deltaBase = Math.max(0, Math.round((appliedCp * baseMaxCp) / Math.max(1, maxCpBuffed)));
    const curCp = clampPveResource(Math.floor(Number(hj.cp ?? baseMaxCp)), 0, baseMaxCp);
    hj.cp = clampPveResource(curCp + deltaBase, 0, baseMaxCp);
    syncHeroJsonResourcePercentsToAbsolutes(hj);
    return {
      ok: true,
      nextHeroJson: hj,
      logLine: `Ви використали предмет (+${appliedCp} CP)`,
      heroCpAfter: Math.max(0, Math.floor(Number(hj.cp ?? 0))),
    };
  }

  return { ok: false, code: "invalid_input", message: "Unknown resource" };
}
