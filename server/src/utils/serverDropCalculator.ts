/**
 * server/src/utils/serverDropCalculator.ts
 *
 * Server-authoritative drop logic after mob kill:
 * - L2/tiered/Floran item drops & spoils
 * - Treasure box, Seven Seals medals
 * - Zariche (1% chance) + auto-equip
 * - Quest drops (based on hero's activeQuests)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mobDropRegistry: Record<string, any> = require("../data/drops/mobDropRegistry.generated.json");
import { applyTieredLootFallback, applyTieredLootToMob, type ServerDropEntry } from "../data/drops/serverTieredLoot";
import { getFloranMobDropProfile, type DropProfile } from "../data/drops/floranMobDrops";
import { SERVER_QUEST_DROPS } from "../data/questDropData";
import { serverMobMatchesQuestDropName, serverGetEffectiveQuestDropNeed } from "./questDropHelpers";

// ---------- types ----------

export interface DroppedItem {
  id: string;
  count: number;
  name?: string;
  kind?: string;
  slot?: string;
  icon?: string;
}

export interface QuestProgressUpdate {
  questId: string;
  itemId: string;
  count: number;
}

export interface ZaricheEquipUpdate {
  /** Updated equipment map (weapon slot set to "zariche") */
  equipment: Record<string, string | null>;
  /** Updated enchant levels (weapon slot cleared) */
  equipmentEnchantLevels: Record<string, number>;
  /** If an old weapon was displaced, it goes back to inventory */
  returnedWeapon?: { id: string; kind: string; slot: string; count: number };
  /** Zariche equipped-until timestamp */
  zaricheEquippedUntil: number;
}

export interface DropCalculationResult {
  items: DroppedItem[];
  adena: number;
  messages: string[];
  questProgressUpdates: QuestProgressUpdate[];
  zaricheEquip?: ZaricheEquipUpdate;
}

// ---------- registry lookup ----------

type MobRegistryEntry = {
  id: string;
  name: string;
  level: number;
  exp: number;
  sp: number;
  dropChance: number;
  adenaMin: number;
  adenaMax: number;
  drops: any[];
  spoil: any[];
  isFloran: boolean;
  isRaidBoss: boolean;
  zoneId: string;
  dropProfileId?: string;
};

/** Експорт для PvE battle-start (перевірка mobId/zoneId). */
export function lookupMobRegistry(mobId: string, zoneId?: string): MobRegistryEntry | null {
  const reg = mobDropRegistry as Record<string, MobRegistryEntry>;
  if (zoneId) {
    const exact = reg[`${mobId}::${zoneId}`];
    if (exact) return exact;
  }
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
  const now = new Date();
  const warsawOffset = 2;
  const warsawDay = new Date(now.getTime() + warsawOffset * 3600 * 1000).getUTCDay();
  return warsawDay >= 1 && warsawDay <= 6;
}

function getPremiumMultiplier(premiumUntil: number): number {
  if (premiumUntil && premiumUntil > Date.now()) return 2;
  return 1;
}

/** Збіг з addDropToInventory у battle-finish: екіп не стакується в одному слоті інвентаря. */
function isStackableServerDropKind(kind: string | undefined, slot: string | undefined): boolean {
  const k = String(kind ?? "").toLowerCase();
  const s = String(slot ?? "").toLowerCase();
  const EQUIP_KINDS = new Set([
    "equipment",
    "weapon",
    "armor",
    "helmet",
    "boots",
    "gloves",
    "shield",
    "necklace",
    "ring",
    "earring",
    "jewelry",
    "belt",
    "cloak",
  ]);
  if (EQUIP_KINDS.has(k) || EQUIP_KINDS.has(s)) return false;
  return true;
}

function addItem(list: DroppedItem[], id: string, count: number, name?: string, kind?: string, slot?: string): void {
  if (!id || count <= 0) return;
  const n = Math.max(1, Math.floor(count));
  if (!isStackableServerDropKind(kind, slot)) {
    for (let i = 0; i < n; i++) {
      list.push({ id, count: 1, ...(name ? { name } : {}), ...(kind ? { kind } : {}), ...(slot ? { slot } : {}) });
    }
    return;
  }
  const existing = list.find((i) => i.id === id);
  if (existing) {
    existing.count += n;
  } else {
    list.push({ id, count: n, ...(name ? { name } : {}), ...(kind ? { kind } : {}), ...(slot ? { slot } : {}) });
  }
}

function rbEq(id: string, chance: number): ServerDropEntry {
  return { id, kind: "equipment", chance, min: 1, max: 1 };
}

function rbScroll(id: string, chance: number): ServerDropEntry {
  return { id, kind: "other", chance, min: 1, max: 2 };
}

/**
 * Raid-boss fallback loot for profiles that ended up with empty drops in registry.
 * Keeps old behavior: RBs should always have chance to drop equipment.
 */
function buildRaidBossFallbackDrops(level: number): ServerDropEntry[] {
  if (level < 20) {
    return [
      rbEq("shop_weapon_d_knights_sword", 0.10),
      rbEq("shop_weapon_d_shilen_knife", 0.09),
      rbEq("reinforced_leather_shirt", 0.08),
      rbEq("mithril_helmet", 0.08),
      rbEq("shop_jewelry_d_black_pearl_ring", 0.08),
      rbScroll("blessed_scroll_enchant_weapon_grade_d", 0.14),
      rbScroll("blessed_scroll_enchant_armor_grade_d", 0.05),
    ];
  }
  if (level < 40) {
    return [
      rbEq("shop_weapon_c_paagrian_sword", 0.10),
      rbEq("shop_weapon_c_samurai_longsword", 0.10),
      rbEq("plated_leather", 0.08),
      rbEq("karmian_tunic", 0.08),
      rbEq("shop_jewelry_c_ring_of_ages", 0.08),
      rbScroll("blessed_scroll_enchant_weapon_grade_c", 0.16),
      rbScroll("blessed_scroll_enchant_armor_grade_c", 0.06),
    ];
  }
  if (level < 70) {
    return [
      rbEq("shop_weapon_b_great_sword", 0.09),
      rbEq("shop_weapon_b_deadman_s_glory", 0.09),
      rbEq("blue_wolf_breastplate", 0.08),
      rbEq("doom_tunic", 0.08),
      rbEq("shop_jewelry_b_sages_ring", 0.08),
      rbScroll("blessed_scroll_enchant_weapon_grade_b", 0.15),
      rbScroll("blessed_scroll_enchant_armor_grade_b", 0.06),
    ];
  }
  return [
    rbEq("shop_weapon_a_dragon_slayer", 0.09),
    rbEq("shop_weapon_a_carnage_bow", 0.09),
    rbEq("majestic_robe", 0.085),
    rbEq("majestic_circlet", 0.085),
    rbEq("shop_jewelry_a_majestic_ring", 0.08),
    rbScroll("blessed_scroll_enchant_weapon_grade_a", 0.14),
    rbScroll("blessed_scroll_enchant_armor_grade_a", 0.055),
  ];
}

// ---------- quest drops ----------

function calculateQuestDrops(
  mobName: string,
  zoneId: string | undefined,
  activeQuests: Array<{ questId: string; progress?: Record<string, number>; rolledQuestDropNeeds?: Record<string, number> }>,
  inventory: Array<{ id: string; count?: number }>
): { items: DroppedItem[]; updates: QuestProgressUpdate[] } {
  const items: DroppedItem[] = [];
  const updates: QuestProgressUpdate[] = [];

  for (const activeQuest of activeQuests) {
    const questDropRows = SERVER_QUEST_DROPS.filter((row) => row.questId === activeQuest.questId);
    if (questDropRows.length === 0) continue;

    for (const row of questDropRows) {
      if (!serverMobMatchesQuestDropName(mobName, row.mobName)) continue;

      if (row.dropZoneIdPrefix && (!zoneId || !String(zoneId).startsWith(row.dropZoneIdPrefix))) {
        continue;
      }

      const need = serverGetEffectiveQuestDropNeed(row.requiredCount, row.itemId, activeQuest);

      // Current count in inventory
      const invItem = inventory.find((i) => i.id === row.itemId);
      const currentCount = invItem?.count ?? 0;

      // Current quest progress (from activeQuest.progress)
      const progressCount = activeQuest.progress?.[row.itemId] ?? 0;
      const effective = Math.max(currentCount, progressCount);

      if (effective >= need) continue; // Already collected enough

      // 100% chance to drop one quest item
      items.push({ id: row.itemId, count: 1, kind: row.kind ?? "quest", slot: row.slot ?? "quest" });
      updates.push({ questId: activeQuest.questId, itemId: row.itemId, count: 1 });
    }
  }

  return { items, updates };
}

// ---------- zariche auto-equip ----------

function calculateZaricheEquip(
  heroEquipment: Record<string, string | null> | undefined,
  heroEnchantLevels: Record<string, number> | undefined
): ZaricheEquipUpdate {
  const equipment: Record<string, string | null> = { ...(heroEquipment ?? {}) };
  const enchantLevels: Record<string, number> = { ...(heroEnchantLevels ?? {}) };

  const oldWeaponId = equipment.weapon ?? null;

  // Equip zariche in weapon slot
  equipment.weapon = "zariche";
  // Two-handed weapon clears shield
  equipment.shield = null;

  // Clear enchant for weapon slot (zariche starts at +0)
  delete enchantLevels.weapon;

  let returnedWeapon: ZaricheEquipUpdate["returnedWeapon"];
  if (oldWeaponId && oldWeaponId !== "zariche") {
    returnedWeapon = { id: oldWeaponId, kind: "weapon", slot: "weapon", count: 1 };
  }

  return {
    equipment,
    equipmentEnchantLevels: enchantLevels,
    returnedWeapon,
    zaricheEquippedUntil: Date.now() + 60 * 60 * 1000,
  };
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
    activeQuests?: Array<{ questId: string; progress?: Record<string, number>; rolledQuestDropNeeds?: Record<string, number> }>;
    inventory?: Array<{ id: string; count?: number }>;
    equipment?: Record<string, string | null>;
    equipmentEnchantLevels?: Record<string, number>;
  }
): DropCalculationResult {
  const items: DroppedItem[] = [];
  const messages: string[] = [];
  const questProgressUpdates: QuestProgressUpdate[] = [];
  let adena = 0;
  let zaricheEquip: ZaricheEquipUpdate | undefined;

  const mob = lookupMobRegistry(mobId, zoneId);
  if (!mob) {
    return { items, adena, messages, questProgressUpdates };
  }

  const premiumMult = getPremiumMultiplier(
    mob.level <= heroContext.level + 10 ? (heroContext.premiumUntil ?? 0) : 0
  );

  // ── Floran drop ───────────────────────────────────────────────
  if (mob.isFloran) {
    const profile: DropProfile | undefined = getFloranMobDropProfile(mob.level, mob.name);
    if (profile) {
      for (const item of profile.items) {
        if (item.itemId === "adena") continue;
        if (Math.random() >= item.chance) continue;
        const count = rollQty(item.min, item.max);
        const scaled = ["soulshot", "spiritshot", "healing_potion", "elixir"].some((k) =>
          item.itemId.includes(k)
        )
          ? Math.round(count * premiumMult)
          : count;
        addItem(items, item.itemId, scaled, undefined, "resource");
        messages.push(`Floran drop: ${item.itemId} x${scaled}`);
      }
    }
  }

  // ── L2 tiered & zone drops ─────────────────────────────────────
  let effectiveDrops: ServerDropEntry[] = mob.drops ?? [];
  let effectiveSpoil: ServerDropEntry[] = mob.spoil ?? [];

  const fallbackZoneId = zoneId || mob.zoneId;

  if (mob.isRaidBoss && effectiveDrops.length === 0) {
    effectiveDrops = buildRaidBossFallbackDrops(mob.level);
  } else if (effectiveDrops.length === 0 && fallbackZoneId) {
    const tiered = /^l2dop_\d/.test(mob.id)
      ? applyTieredLootToMob(mob.id, mob.level, fallbackZoneId)
      : applyTieredLootFallback(mob.id, mob.level, fallbackZoneId);
    effectiveDrops = tiered.drops;
    effectiveSpoil = tiered.spoil;
  }

  // Safety net: every non-RB mob should have resource lines.
  if (!mob.isRaidBoss) {
    const hasResourceRows = effectiveDrops.some(
      (d) => d.kind === "resource" || String(d.id).startsWith("l2item_")
    );
    if (!hasResourceRows && fallbackZoneId) {
      const fallback = applyTieredLootFallback(mob.id, mob.level, fallbackZoneId).drops;
      const resourceRows = fallback.filter(
        (d) => d.kind === "resource" || String(d.id).startsWith("l2item_")
      );
      if (resourceRows.length > 0) {
        effectiveDrops = [...effectiveDrops, ...resourceRows.slice(0, 3)];
      }
    }
  }

  const l2Lines = effectiveDrops.filter((d) => (d.chancePerMillion ?? 0) > 0);
  const classicLines = effectiveDrops.filter((d) => !(d.chancePerMillion ?? 0));

  const applyLine = (drop: ServerDropEntry) => {
    if (!rollEntry(drop)) return;
    let count = rollQty(drop.min ?? 1, drop.max ?? 1);
    if (drop.id === "adena" || drop.kind === "adena") return; // client handles adena
    const isResource = drop.kind === "resource" || String(drop.id).startsWith("l2item_");
    if (isResource) count = Math.round(count * premiumMult);
    addItem(items, drop.id, count, drop.displayName, drop.kind);
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
      addItem(items, sp.id, count, sp.displayName, sp.kind);
      messages.push(`Spoil: ${sp.id} x${count}`);
    }
  }

  // ── Treasure box (±3 levels) ──────────────────────────────────
  const levelDiff = Math.abs(mob.level - heroContext.level);
  if (levelDiff <= 3 && Math.random() < 0.10) {
    addItem(items, "treasure_box", 1, undefined, "quest");
    messages.push("Drop: treasure_box x1");
  }

  // ── Seven Seals medal (5%, Mon–Sat) ───────────────────────────
  if (isSevenSealsFarmActive() && Math.random() < 0.05) {
    addItem(items, "seven_seals_medal", 1, undefined, "quest");
    messages.push("Drop: seven_seals_medal x1");
  }

  // ── Zariche (1% from any mob, not already equipped) ───────────
  const zaricheAlreadyEquipped = heroContext.equipment?.weapon === "zariche";
  if (!zaricheAlreadyEquipped && Math.random() < 0.01) {
    zaricheEquip = calculateZaricheEquip(heroContext.equipment, heroContext.equipmentEnchantLevels);
    messages.push("ZARICHE DROPPED! Auto-equipped.");
  }

  // ── Quest drops ───────────────────────────────────────────────
  const activeQuests = heroContext.activeQuests ?? [];
  if (activeQuests.length > 0 && mob.name) {
    const questResult = calculateQuestDrops(
      mob.name,
      zoneId,
      activeQuests,
      heroContext.inventory ?? []
    );
    for (const qi of questResult.items) {
      addItem(items, qi.id, qi.count, undefined, qi.kind, qi.slot);
      messages.push(`Quest drop: ${qi.id} x${qi.count}`);
    }
    questProgressUpdates.push(...questResult.updates);
  }

  return { items, adena, messages, questProgressUpdates, zaricheEquip };
}
