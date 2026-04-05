/**
 * Серверна здача квестів (валідація + інвентар + валюта + прогрес).
 * Дані квестів — `server/src/data/gameQuests.ts` (копія клієнтського quests.ts).
 */
import { EXP_TABLE, MAX_LEVEL } from "../expTable";
import shopCatalogRaw from "../data/shopCatalog.generated.json";
import { validateHeroJson, addVersioning } from "../heroJsonValidator";
import { enforceCharacterMutationInvariants } from "../utils/characterMutationInvariants";
import {
  QUESTS,
  QUEST_ITEM_TURN_IN_ALIASES,
  getQuestCityId,
  type Quest,
  ELVEN_MYSTIC_FIRST_PROF_QUEST_ID,
  ELVEN_FIGHTER_FIRST_PROF_QUEST_ID,
  HUMAN_FIGHTER_FIRST_PROF_QUEST_ID,
  HUMAN_MYSTIC_FIRST_PROF_QUEST_ID,
  DARK_FIGHTER_FIRST_PROF_QUEST_ID,
  DARK_MYSTIC_FIRST_PROF_QUEST_ID,
  ORC_FIGHTER_FIRST_PROF_QUEST_ID,
  ORC_MYSTIC_FIRST_PROF_QUEST_ID,
  DWARVEN_FIGHTER_FIRST_PROF_QUEST_ID,
  isHeroElvenMysticBaseForFirstProfQuest,
  isHeroElvenFighterBaseForFirstProfQuest,
  isHeroHumanFighterBaseForFirstProfQuest,
  isHeroHumanMysticBaseForFirstProfQuest,
  isHeroDarkFighterBaseForFirstProfQuest,
  isHeroDarkMysticBaseForFirstProfQuest,
  isHeroOrcFighterBaseForFirstProfQuest,
  isHeroOrcMysticBaseForFirstProfQuest,
  isHeroDwarvenFighterBaseForFirstProfQuest,
} from "../data/gameQuests";

const DEFAULT_PLAYER_CITY_ID = "l2dop_gludio";

type ActiveQuestEntry = {
  questId: string;
  progress?: Record<string, number>;
  rolledQuestDropNeeds?: Record<string, number>;
  rolledRewardBonus?: { adena: number; exp: number; coins_silver: number };
};

function getExpToNext(level: number): number {
  const lvl = Math.max(1, Math.min(MAX_LEVEL, Math.floor(Number(level) || 1)));
  if (lvl >= MAX_LEVEL) return 0;
  return Math.max(0, Number(EXP_TABLE[lvl] ?? 0) - Number(EXP_TABLE[lvl - 1] ?? 0));
}

function readExpAsNumber(raw: unknown): number {
  if (typeof raw === "bigint") return Number(raw);
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function pickBestLevelExpPair(
  dbLevelRaw: unknown,
  dbExpRaw: unknown,
  hjLevelRaw: unknown,
  hjExpRaw: unknown
): { level: number; exp: number } {
  const L1 = Math.max(1, Math.min(MAX_LEVEL, Math.floor(Number(dbLevelRaw) || 1)));
  const E1 = readExpAsNumber(dbExpRaw);
  const L2 = Math.max(1, Math.min(MAX_LEVEL, Math.floor(Number(hjLevelRaw) || 1)));
  const E2 = readExpAsNumber(hjExpRaw);
  if (L2 > L1) return { level: L2, exp: E2 };
  if (L1 > L2) return { level: L1, exp: E1 };
  return { level: L1, exp: Math.max(E1, E2) };
}

function applyLevelUpsInPlace(level: number, exp: number): { level: number; exp: number } {
  let nextLevel = Math.max(1, Math.min(MAX_LEVEL, level));
  let nextExp = Math.max(0, Math.floor(exp));
  while (nextLevel < MAX_LEVEL) {
    const need = getExpToNext(nextLevel);
    if (need <= 0 || nextExp < need) break;
    nextExp -= need;
    nextLevel += 1;
  }
  if (nextLevel >= MAX_LEVEL) nextExp = 0;
  return { level: nextLevel, exp: Math.max(0, Math.floor(nextExp)) };
}

function getEffectiveQuestDropNeed(
  questDrop: NonNullable<Quest["questDrops"]>[number],
  activeEntry: ActiveQuestEntry | undefined
): number {
  const rolled = activeEntry?.rolledQuestDropNeeds?.[questDrop.itemId];
  if (typeof rolled === "number" && rolled > 0) return rolled;
  return questDrop.requiredCount;
}

function countQuestTurnInInInventory(inv: any[], questItemId: string): number {
  const aliases = QUEST_ITEM_TURN_IN_ALIASES[questItemId as keyof typeof QUEST_ITEM_TURN_IN_ALIASES];
  const ids = aliases ? [questItemId, ...aliases] : [questItemId];
  const set = new Set<string>(ids);
  let sum = 0;
  for (const it of inv ?? []) {
    if (it && set.has(String(it.id))) sum += Math.max(1, Math.floor(Number(it.count ?? 1)));
  }
  return sum;
}

function removeQuestTurnInFromInventory(inv: any[], questItemId: string, toRemove: number): any[] {
  const aliases = QUEST_ITEM_TURN_IN_ALIASES[questItemId as keyof typeof QUEST_ITEM_TURN_IN_ALIASES];
  const order = aliases ? [questItemId, ...aliases] : [questItemId];
  let remaining = Math.max(0, Math.floor(toRemove));
  const out = [...inv];
  for (const itemId of order) {
    for (let i = out.length - 1; i >= 0 && remaining > 0; i--) {
      if (!out[i] || String(out[i].id) !== itemId) continue;
      const c = Math.max(1, Math.floor(Number(out[i].count ?? 1)));
      if (c <= remaining) {
        remaining -= c;
        out.splice(i, 1);
      } else {
        out[i] = { ...out[i], count: c - remaining };
        remaining = 0;
      }
    }
  }
  return out;
}

function normShopId(s: string): string {
  return String(s ?? "")
    .replace(/^shop_/i, "")
    .replace(/^quest_/i, "")
    .toLowerCase();
}

/** Метадані предмета нагороди з каталогу магазину (якщо є). */
export function lookupQuestRewardItemMeta(itemId: string): Record<string, any> | null {
  const want = normShopId(itemId);
  const buckets = ["regular", "quest", "gm"] as const;
  for (const b of buckets) {
    const bucket = (shopCatalogRaw as any)[b];
    if (!bucket || typeof bucket !== "object") continue;
    for (const key of Object.keys(bucket)) {
      if (normShopId(key) !== want) continue;
      const meta = bucket[key]?.itemMeta;
      if (meta && typeof meta === "object") {
        return { ...meta, id: meta.id ?? key };
      }
    }
  }
  return null;
}

function buildRewardItemRow(itemId: string, count: number): any {
  const meta = lookupQuestRewardItemMeta(itemId);
  const c = Math.max(1, Math.floor(count));
  if (meta) {
    return {
      id: String(meta.id ?? itemId),
      name: meta.name ?? itemId,
      type: meta.kind ?? "quest",
      slot: meta.slot ?? "quest",
      icon: meta.icon,
      description: meta.description,
      stats: meta.stats,
      grade: meta.grade,
      count: c,
    };
  }
  return {
    id: itemId,
    name: itemId,
    type: "quest",
    slot: "quest",
    count: c,
  };
}

function isPremiumActive(heroJson: any): boolean {
  const until = Number(heroJson?.premiumUntil ?? 0);
  return until > Date.now();
}

function questMatchesHeroBase(heroJson: any, questId: string): boolean {
  const h = {
    profession: heroJson.profession ?? heroJson.klass,
    race: heroJson.race,
  };
  const map: Record<string, (x: typeof h) => boolean> = {
    [ELVEN_MYSTIC_FIRST_PROF_QUEST_ID]: isHeroElvenMysticBaseForFirstProfQuest,
    [ELVEN_FIGHTER_FIRST_PROF_QUEST_ID]: isHeroElvenFighterBaseForFirstProfQuest,
    [HUMAN_FIGHTER_FIRST_PROF_QUEST_ID]: isHeroHumanFighterBaseForFirstProfQuest,
    [HUMAN_MYSTIC_FIRST_PROF_QUEST_ID]: isHeroHumanMysticBaseForFirstProfQuest,
    [DARK_FIGHTER_FIRST_PROF_QUEST_ID]: isHeroDarkFighterBaseForFirstProfQuest,
    [DARK_MYSTIC_FIRST_PROF_QUEST_ID]: isHeroDarkMysticBaseForFirstProfQuest,
    [ORC_FIGHTER_FIRST_PROF_QUEST_ID]: isHeroOrcFighterBaseForFirstProfQuest,
    [ORC_MYSTIC_FIRST_PROF_QUEST_ID]: isHeroOrcMysticBaseForFirstProfQuest,
    [DWARVEN_FIGHTER_FIRST_PROF_QUEST_ID]: isHeroDwarvenFighterBaseForFirstProfQuest,
  };
  const fn = map[questId];
  if (fn) return fn(h as any);
  return true;
}

function addItemToInventoryBestEffort(inventory: any[], item: any, maxSlots = 200): { inventory: any[]; overflow: boolean } {
  const inv = [...inventory];
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
  const kind = String(item?.kind ?? "").toLowerCase();
  const slot = String(item?.slot ?? "").toLowerCase();
  const isStackable =
    !EQUIP_KINDS.has(kind) &&
    !EQUIP_KINDS.has(slot) &&
    !item?.meta?.hasLSPassive;
  const addCount = Math.max(1, Math.floor(Number(item.count ?? 1)));
  const id = String(item.id ?? "").trim();
  if (!id) return { inventory: inv, overflow: true };

  if (isStackable) {
    const idx = inv.findIndex((i: any) => i && String(i.id) === id && !i?.meta?.hasLSPassive);
    if (idx >= 0) {
      const prev = Math.max(1, Math.floor(Number(inv[idx].count ?? 1)));
      inv[idx] = { ...inv[idx], count: prev + addCount };
      return { inventory: inv, overflow: false };
    }
  }
  if (inv.length < maxSlots) {
    inv.push({ ...item, id, count: addCount });
    return { inventory: inv, overflow: false };
  }
  return { inventory: inv, overflow: true };
}

export type QuestCompleteTxInput = {
  questId: string;
  expectedRevision: number;
};

export type QuestCompleteTxResult =
  | {
      ok: true;
      updated: any;
      needsRewardPick: boolean;
      pickAllowedItemIds?: string[];
    }
  | {
      ok: false;
      reason:
        | "not_found"
        | "revision_conflict"
        | "unknown_quest"
        | "wrong_city"
        | "wrong_hero"
        | "not_active"
        | "already_completed"
        | "requirements_not_met"
        | "inventory_overflow"
        | "invalid_hero_json";
      currentRevision?: number;
      updatedAt?: Date;
      errors?: string[];
    };

export function runQuestCompleteMutation(
  row: {
    id: string;
    name: string;
    level: number;
    exp: bigint;
    sp: number;
    adena: bigint;
    coinLuck: bigint;
    coinsSilver: bigint;
    heroJson: any;
    updatedAt: Date;
  },
  input: QuestCompleteTxInput
): QuestCompleteTxResult {
  const heroJson: any = (row.heroJson && typeof row.heroJson === "object" ? row.heroJson : {}) || {};
  const currentRevision = Number(heroJson.heroRevision ?? 0);
  if (currentRevision !== input.expectedRevision) {
    return { ok: false, reason: "revision_conflict", currentRevision, updatedAt: row.updatedAt };
  }

  const questDef = QUESTS.find((q) => q.id === input.questId);
  if (!questDef) return { ok: false, reason: "unknown_quest" };

  const currentCityId = String(heroJson.currentCityId || "").trim() || DEFAULT_PLAYER_CITY_ID;
  const qCity = getQuestCityId(questDef);
  if (qCity !== undefined && qCity !== currentCityId) {
    return { ok: false, reason: "wrong_city" };
  }

  if (!questMatchesHeroBase(heroJson, input.questId)) {
    return { ok: false, reason: "wrong_hero" };
  }

  const heroLevel = Math.max(1, Math.floor(Number(row.level ?? heroJson.level ?? 1)));
  if (questDef.requirements?.level != null && heroLevel < questDef.requirements.level) {
    return { ok: false, reason: "requirements_not_met" };
  }

  const completedQuestsCheck: string[] = Array.isArray(heroJson.completedQuests) ? [...heroJson.completedQuests] : [];
  const activeQuests: ActiveQuestEntry[] = Array.isArray(heroJson.activeQuests) ? [...heroJson.activeQuests] : [];
  const aqEntry = activeQuests.find((a) => a.questId === input.questId);
  if (!aqEntry) {
    if (completedQuestsCheck.includes(input.questId)) {
      return { ok: false, reason: "already_completed" };
    }
    return { ok: false, reason: "not_active" };
  }

  const hasDrops = questDef.questDrops && questDef.questDrops.length > 0;
  const hasKills = questDef.questKillTargets && questDef.questKillTargets.length > 0;
  if (!hasDrops && !hasKills) return { ok: false, reason: "requirements_not_met" };

  let inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];

  if (hasKills) {
    for (const kt of questDef.questKillTargets!) {
      if ((aqEntry.progress?.[kt.progressKey] ?? 0) < kt.requiredCount) {
        return { ok: false, reason: "requirements_not_met" };
      }
    }
  }

  const itemsToRemove: Record<string, number> = {};
  if (hasDrops) {
    for (const qd of questDef.questDrops!) {
      const need = getEffectiveQuestDropNeed(qd, aqEntry);
      if (!itemsToRemove[qd.itemId] || itemsToRemove[qd.itemId] < need) {
        itemsToRemove[qd.itemId] = need;
      }
    }
    for (const [itemId, need] of Object.entries(itemsToRemove)) {
      if (countQuestTurnInInInventory(inventory, itemId) < need) {
        return { ok: false, reason: "requirements_not_met" };
      }
    }
    for (const [itemId, need] of Object.entries(itemsToRemove)) {
      inventory = removeQuestTurnInFromInventory(inventory, itemId, need);
    }
  }

  const rewards = questDef.rewards || {};
  const bonus = aqEntry.rolledRewardBonus;
  let addAdena = Math.max(0, Math.floor(Number(rewards.adena ?? 0))) + Math.max(0, Math.floor(Number(bonus?.adena ?? 0)));
  let addExp = Math.max(0, Math.floor(Number(rewards.exp ?? 0))) + Math.max(0, Math.floor(Number(bonus?.exp ?? 0)));
  if (addExp > 0 && isPremiumActive(heroJson)) {
    addExp = Math.round(addExp * 2);
  }
  let addSp = Math.max(0, Math.floor(Number(rewards.sp ?? 0)));
  const addSilver = Math.max(0, Math.floor(Number(rewards.coins_silver ?? 0))) +
    Math.max(0, Math.floor(Number(bonus?.coins_silver ?? 0)));

  const baseline = pickBestLevelExpPair(row.level, row.exp, heroJson.level, heroJson.exp);
  let nextLevel = baseline.level;
  let nextExp = baseline.exp + addExp;
  const leveled = applyLevelUpsInPlace(nextLevel, nextExp);
  nextLevel = leveled.level;
  nextExp = leveled.exp;

  let nextAdena = Math.max(0, Number(row.adena ?? 0n)) + addAdena;
  let nextSp = Math.max(0, Number(row.sp ?? 0)) + addSp;
  let nextCoinsSilver = Math.max(0, Number(row.coinsSilver ?? 0n)) + addSilver;

  const completedQuests: string[] = completedQuestsCheck;
  if (!completedQuests.includes(input.questId)) completedQuests.push(input.questId);

  const newActiveQuests = activeQuests.filter((a) => a.questId !== input.questId);

  const needsPick =
    Array.isArray(questDef.rewardPickOneItemId) && questDef.rewardPickOneItemId.length > 0;

  for (const ri of rewards.items ?? []) {
    if (!ri?.id) continue;
    const rowItem = buildRewardItemRow(String(ri.id), Math.max(1, Math.floor(Number(ri.count ?? 1))));
    const r = addItemToInventoryBestEffort(inventory, rowItem);
    inventory = r.inventory;
    if (r.overflow) {
      return { ok: false, reason: "inventory_overflow" };
    }
  }

  let questRewardPickPending: { questId: string; allowedItemIds: string[] } | undefined;
  if (needsPick) {
    questRewardPickPending = {
      questId: input.questId,
      allowedItemIds: [...questDef.rewardPickOneItemId!],
    };
  }

  const nextHeroJson: any = {
    ...heroJson,
    level: nextLevel,
    exp: nextExp,
    sp: nextSp,
    adena: nextAdena,
    coinOfLuck: Number(row.coinLuck ?? 0),
    inventory,
    activeQuests: newActiveQuests,
    completedQuests,
    coins_silver: nextCoinsSilver,
    questRewardPickPending: questRewardPickPending ?? heroJson.questRewardPickPending,
  };

  if (!needsPick && nextHeroJson.questRewardPickPending?.questId === input.questId) {
    delete nextHeroJson.questRewardPickPending;
  }

  const invCheck = enforceCharacterMutationInvariants({
    heroJson: nextHeroJson,
    adena: nextAdena,
    aa: Number(heroJson.aa ?? 0),
    coinLuck: row.coinLuck,
    coinsSilver: nextCoinsSilver,
  });
  if (!invCheck.ok) {
    return { ok: false, reason: "invalid_hero_json", errors: invCheck.errors };
  }

  const vCheck = validateHeroJson(invCheck.heroJson);
  if (!vCheck.valid) {
    return { ok: false, reason: "invalid_hero_json", errors: vCheck.errors };
  }

  const versioned = addVersioning(invCheck.heroJson, currentRevision);

  return {
    ok: true,
    updated: {
      id: row.id,
      name: row.name,
      level: nextLevel,
      exp: BigInt(Math.max(0, Math.floor(nextExp))),
      sp: nextSp,
      adena: BigInt(Math.max(0, Math.floor(nextAdena))),
      coinLuck: row.coinLuck,
      coinsSilver: BigInt(Math.max(0, Math.floor(nextCoinsSilver))),
      heroJson: versioned,
    },
    needsRewardPick: !!needsPick,
    pickAllowedItemIds: needsPick ? [...questDef.rewardPickOneItemId!] : undefined,
  };
}

export type QuestPickRewardTxInput = {
  questId: string;
  itemId: string;
  expectedRevision: number;
};

export type QuestPickRewardTxResult =
  | { ok: true; updated: any }
  | {
      ok: false;
      reason:
        | "not_found"
        | "revision_conflict"
        | "invalid_pick"
        | "inventory_overflow"
        | "invalid_hero_json";
      currentRevision?: number;
      updatedAt?: Date;
      errors?: string[];
    };

export function runQuestPickRewardMutation(
  row: {
    id: string;
    name: string;
    level: number;
    exp: bigint;
    sp: number;
    adena: bigint;
    coinLuck: bigint;
    coinsSilver: bigint;
    heroJson: any;
    updatedAt: Date;
  },
  input: QuestPickRewardTxInput
): QuestPickRewardTxResult {
  const heroJson: any = (row.heroJson && typeof row.heroJson === "object" ? row.heroJson : {}) || {};
  const currentRevision = Number(heroJson.heroRevision ?? 0);
  if (currentRevision !== input.expectedRevision) {
    return { ok: false, reason: "revision_conflict", currentRevision, updatedAt: row.updatedAt };
  }

  const pending = heroJson.questRewardPickPending;
  if (
    !pending ||
    typeof pending !== "object" ||
    String(pending.questId) !== input.questId ||
    !Array.isArray(pending.allowedItemIds)
  ) {
    return { ok: false, reason: "invalid_pick" };
  }

  const allowed = new Set((pending.allowedItemIds as string[]).map((s) => String(s)));
  const pickId = String(input.itemId || "").trim();
  if (!pickId || !allowed.has(pickId)) {
    return { ok: false, reason: "invalid_pick" };
  }

  const completed = Array.isArray(heroJson.completedQuests) ? heroJson.completedQuests : [];
  if (!completed.map(String).includes(input.questId)) {
    return { ok: false, reason: "invalid_pick" };
  }

  let inventory: any[] = Array.isArray(heroJson.inventory) ? [...heroJson.inventory] : [];
  const rowItem = buildRewardItemRow(pickId, 1);
  const r = addItemToInventoryBestEffort(inventory, rowItem);
  inventory = r.inventory;
  if (r.overflow) return { ok: false, reason: "inventory_overflow" };

  const nextHeroJson: any = {
    ...heroJson,
    inventory,
    questRewardPickPending: undefined,
  };

  const invCheck = enforceCharacterMutationInvariants({
    heroJson: nextHeroJson,
    adena: Number(row.adena ?? 0n),
    aa: Number(heroJson.aa ?? 0),
    coinLuck: row.coinLuck,
    coinsSilver: Number(row.coinsSilver ?? 0n),
  });
  if (!invCheck.ok) {
    return { ok: false, reason: "invalid_hero_json", errors: invCheck.errors };
  }

  const vCheck = validateHeroJson(invCheck.heroJson);
  if (!vCheck.valid) {
    return { ok: false, reason: "invalid_hero_json", errors: vCheck.errors };
  }

  const versioned = addVersioning(invCheck.heroJson, currentRevision);

  return {
    ok: true,
    updated: {
      id: row.id,
      name: row.name,
      level: row.level,
      exp: row.exp,
      sp: row.sp,
      adena: row.adena,
      coinLuck: row.coinLuck,
      coinsSilver: row.coinsSilver,
      heroJson: versioned,
    },
  };
}
