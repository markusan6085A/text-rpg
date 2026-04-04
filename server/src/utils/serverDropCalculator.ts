/**
 * server/src/utils/serverDropCalculator.ts
 *
 * Серверна авторитетна логіка дропу після вбивства моба.
 * Відповідає за: roll drops/spoil, adena, Floran-профіль,
 * Seven Seals медалі (5% пн-сб), Zariche (1%).
 * Квестові дропи поки лишаються на клієнті (фаза 2).
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mobDropRegistry: Record<string, any> = require("../data/drops/mobDropRegistry.generated.json");
import { applyTieredLootToMob, type ServerDropEntry } from "../data/drops/serverTieredLoot";
import { getFloranMobDropProfile, type DropProfile } from "../data/drops/floranMobDrops";

// ---------- types ----------

export interface DroppedItem {
  id: string;
  count: number;
  name?: string;
  kind?: string;
  slot?: string;
  icon?: string;
}

export interface DropCalculationResult {
  items: DroppedItem[];
  adena: number;
  messages: string[];
}

// ---------- registry lookup ----------

type MobRegistryEntry = {
  id: string;
  name: string;
  level: number;
  dropChance: number;
  adenaMin: number;
  adenaMax: number;
  drops: any[];
  spoil: any[];
  isFloran: boolean;
  isRaidBoss: boolean;
  zoneId: string;
};

function lookupMob(mobId: string, zoneId?: string): MobRegistryEntry | null {
  const reg = mobDropRegistry as Record<string, MobRegistryEntry>;
  // Try exact key mobId::zoneId
  if (zoneId) {
    const exact = reg[`${mobId}::${zoneId}`];
    if (exact) return exact;
  }
  // Fallback: first entry for this mobId
  const fallback = Object.values(reg).find((e) => e.id === mobId);
  return fallback ?? null;
}

// ---------- helpers ----------

function rollEntry(entry: ServerDropEntry): boolean {
  const cpm = entry.chancePerMillion;
  if (cpm != null && cpm > 0) {
    const cap = Math.min(1_000_000, Math.max(0, Math.floor(cpm)));
    return Math.floor(Math.random() * 1_000_000) < cap;
  }
  return Math.random() < (entry.chance ?? 0);
}

function rollQty(min: number, max: number): number {
  const a = Math.min(min, max);
  const b = Math.max(min, max);
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function isSevenSealsFarmActive(): boolean {
  // Mon(1)–Sat(6) Warsaw time, rough UTC+2 estimate
  const now = new Date();
  const warsawOffset = 2; // rough estimate (ignores DST for simplicity)
  const warsawHour = (now.getUTCHours() + warsawOffset) % 24;
  const warsawDay = new Date(now.getTime() + warsawOffset * 3600 * 1000).getUTCDay();
  void warsawHour;
  return warsawDay >= 1 && warsawDay <= 6; // Mon–Sat
}

function getPremiumMultiplier(premiumUntil: number): number {
  if (premiumUntil && premiumUntil > Date.now()) return 2;
  return 1;
}

// ---------- main calculator ----------

export function calculateServerDrops(
  mobId: string,
  zoneId: string | undefined,
  spoiled: boolean,
  heroContext: {
    level: number;
    premiumUntil?: number;
    profession?: string;
    inventorySize?: number;
  }
): DropCalculationResult {
  const items: DroppedItem[] = [];
  const messages: string[] = [];
  let adena = 0;

  const mob = lookupMob(mobId, zoneId);
  if (!mob) {
    return { items, adena, messages };
  }

  const premiumMult = getPremiumMultiplier(mob.level <= heroContext.level + 10
    ? (heroContext.premiumUntil ?? 0)
    : 0);

  // Note: adena is handled client-side (with server cap in battle-finish).
  // Server only calculates ITEM drops (resources, consumables, specials).

  // ── Floran drop ───────────────────────────────────────────────
  if (mob.isFloran) {
    const profile: DropProfile | undefined = getFloranMobDropProfile(mob.level, mob.name);
    if (profile) {
      for (const item of profile.items) {
        if (item.itemId === "adena") continue; // client handles adena
        if (Math.random() >= item.chance) continue;
        const count = rollQty(item.min, item.max);
        const scaled = ["soulshot", "spiritshot", "healing_potion", "elixir"].some((k) =>
          item.itemId.includes(k)
        )
          ? Math.round(count * premiumMult)
          : count;
        addItem(items, item.itemId, scaled);
        messages.push(`Floran drop: ${item.itemId} x${scaled}`);
      }
    }
    // Floran mobs also roll zone resource drops below
  }

  // ── L2 tiered & zone drops ─────────────────────────────────────
  let effectiveDrops: ServerDropEntry[] = mob.drops ?? [];
  let effectiveSpoil: ServerDropEntry[] = mob.spoil ?? [];

  // If drops are empty (l2dop_* mob), recalculate tiered loot
  if (effectiveDrops.length === 0 && /^l2dop_\d/.test(mob.id) && zoneId) {
    const tiered = applyTieredLootToMob(mob.id, mob.level, zoneId);
    effectiveDrops = tiered.drops;
    effectiveSpoil = tiered.spoil;
  }

  // Separate l2-xml drops (chancePerMillion) from classic drops
  const l2Lines = effectiveDrops.filter((d) => (d.chancePerMillion ?? 0) > 0);
  const classicLines = effectiveDrops.filter((d) => !(d.chancePerMillion ?? 0));

  const applyLine = (drop: ServerDropEntry) => {
    if (!rollEntry(drop)) return;
    let count = rollQty(drop.min ?? 1, drop.max ?? 1);

    if (drop.id === "adena" || drop.kind === "adena") {
      // adena handled client-side — skip
      return;
    }

    // Apply premium for resources/consumables
    const isResource = drop.kind === "resource" || String(drop.id).startsWith("l2item_");
    if (isResource) count = Math.round(count * premiumMult);

    addItem(items, drop.id, count, drop.displayName);
    messages.push(`Drop: ${drop.id} x${count}`);
  };

  l2Lines.forEach(applyLine);
  if (classicLines.length > 0 && Math.random() < (mob.dropChance ?? 0.5)) {
    classicLines.forEach(applyLine);
  }

  // ── Spoil ──────────────────────────────────────────────────────
  if (spoiled && effectiveSpoil.length > 0) {
    for (const sp of effectiveSpoil) {
      if (!rollEntry(sp)) continue;
      let count = rollQty(sp.min ?? 1, sp.max ?? 1);
      if (sp.id === "adena" || sp.kind === "adena") {
        adena += Math.round(count * premiumMult);
        continue;
      }
      const isResource = sp.kind === "resource" || String(sp.id).startsWith("l2item_");
      if (isResource) count = Math.round(count * premiumMult);
      addItem(items, sp.id, count, sp.displayName);
      messages.push(`Spoil: ${sp.id} x${count}`);
    }
  }

  // ── Treasure box (±3 levels) ──────────────────────────────────
  const levelDiff = Math.abs(mob.level - heroContext.level);
  if (levelDiff <= 3 && Math.random() < 0.10) {
    addItem(items, "treasure_box", 1);
    messages.push("Drop: treasure_box x1");
  }

  // ── Seven Seals medal (5%, Mon–Sat) ───────────────────────────
  if (isSevenSealsFarmActive() && Math.random() < 0.05) {
    addItem(items, "seven_seals_medal", 1);
    messages.push("Drop: seven_seals_medal x1");
  }

  // ── Zariche (1% from any mob) ─────────────────────────────────
  if (Math.random() < 0.01) {
    addItem(items, "zariche", 1);
    messages.push("ZARICHE DROPPED!");
  }

  return { items, adena, messages };
}

function addItem(
  list: DroppedItem[],
  id: string,
  count: number,
  name?: string
): void {
  if (!id || count <= 0) return;
  const existing = list.find((i) => i.id === id);
  if (existing) {
    existing.count += count;
  } else {
    list.push({ id, count, ...(name ? { name } : {}) });
  }
}
