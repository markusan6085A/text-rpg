import { getExpToNext, MAX_LEVEL } from "../../data/expTable";
import { DAILY_QUESTS } from "../../data/dailyQuests";
import { EXP_GAIN_RATE, SP_GAIN_RATE } from "../../data/balance";
import type { Mob } from "../../data/world/types";
import type { Hero } from "../../types/Hero";
import { getGameSettings } from "../gameSettings";
import { useHeroStore, applyCharacterSnapshotFromApi } from "../heroStore";
import { getPremiumMultiplier } from "../../utils/premium/isPremiumActive";
import { recalculateAllStats } from "../../utils/stats/recalculateAllStats";
import { reportRaidBossKill } from "../../utils/api";
import { QUESTS } from "../../data/quests";
import { applyQuestKillProgressOnVictory } from "../../utils/quests/questKillOnVictory";
import { processMobDrops } from "./helpers/processDrops";
import { hasAutoSpoilActive } from "./actions/useSkill/helpers";
import { setMobRespawn } from "./mobRespawns";
import { mobSpGainFromMob } from "./mobSpGain";
import { isChampionMob } from "../../utils/mobs/isChampionMob";
import { getZoneActivityLabel } from "../../data/world";
import { usePartyStore } from "../partyStore";
import { postPartyKillShare, postWorldMobKill } from "../../utils/api";
import { applyWorldMobKillLocal } from "../worldMobHpStore";
import {
  buildPartyMemberVictoryLogLines,
  mergeServerDropLinesIntoVictoryBattleLog,
} from "./helpers/victoryLootLogLines";
import { battleFinishAPI } from "../../utils/api/battleFinishAPI";
import { maxRevisionFromConflictBody } from "../../utils/revisionConflictBody";
import { battleStoreRef } from "../battleStoreRef";
import { itemsDB } from "../../data/items/itemsDB";
import { cleanupBuffs, mergeServerHeroBuffsRespectLocalToggleOff } from "./helpers";
import { persistBattle, loadBattle } from "./persist";
import { runSerializedPveMutation } from "./actions/pveMutationQueue";
import { heroResourcesForBattleFinishPayload } from "../../utils/heroResourceSnapshotForBattleFinish";

export type MobVictoryCommitParams = {
  mob: Mob;
  heroBuffs: any[];
  postVictoryHp: number;
  postVictoryMp: number;
  postVictoryCp: number;
  /** Якщо задано (напр. Whirlwind) — ці значення вже з множником, не перераховуємо з mob. */
  rewardOverrides?: { adenaGain: number; expGain: number; spGain: number };
  /** true = recalculateAllStats.finalStats (після attack skill), false = baseFinalStats (після автоатаки) */
  useBuffedBattleStats?: boolean;
  zoneId?: string;
  mobIndex?: number;
};

const MAX_LEVEL_UPS_PER_TICK = 10;
const XP_RATE = 1;
const VICTORY_DEDUPE_WINDOW_MS = 2500;
let lastVictorySignature = "";
let lastVictoryAt = 0;
let lastVictoryResult: {
  displayExp: number;
  displaySp: number;
  displayAdena: number;
  dropMessages: string[];
  mobSpoiled: boolean;
  levelUpMessage?: string;
  partyMemberLootLines: string[];
} | null = null;

/**
 * Нарахування EXP/SP/адени, дропу, щоденок після смерті моба (спільна логіка для baseAttack / skill / reflect).
 */
export function commitMobVictoryToHeroStore(params: MobVictoryCommitParams): {
  displayExp: number;
  displaySp: number;
  displayAdena: number;
  dropMessages: string[];
  mobSpoiled: boolean;
  levelUpMessage?: string;
  /** Рядки в лог бою про частку союзників пати (якщо пати > 1). */
  partyMemberLootLines: string[];
} {
  const {
    mob,
    heroBuffs,
    postVictoryHp,
    postVictoryMp,
    postVictoryCp,
    rewardOverrides,
    useBuffedBattleStats = false,
    zoneId,
    mobIndex,
  } = params;
  const heroForSig = useHeroStore.getState().hero as any;
  const victorySignature = `${String(heroForSig?.id ?? heroForSig?.name ?? "unknown")}::${String(zoneId ?? "")}::${String(mobIndex ?? "")}::${String(mob?.id ?? "")}`;
  const nowSig = Date.now();
  if (
    lastVictoryResult &&
    lastVictorySignature === victorySignature &&
    nowSig - lastVictoryAt <= VICTORY_DEDUPE_WINDOW_MS
  ) {
    return lastVictoryResult;
  }

  let adenaGain: number;
  let expGain: number;
  let spGain: number;
  if (rewardOverrides) {
    adenaGain = rewardOverrides.adenaGain;
    expGain = rewardOverrides.expGain;
    spGain = rewardOverrides.spGain;
  } else {
    adenaGain = Math.round(((mob.adenaMin ?? 0) + (mob.adenaMax ?? 0)) / 2);
    expGain = mob.exp ?? 0;
    spGain = mobSpGainFromMob(mob);
  }

  const mobSpoiled = hasAutoSpoilActive(heroBuffs);
  let dropMessages: string[] = [];
  let displayExp = expGain;
  let displaySp = spGain;
  let displayAdena = adenaGain;
  let actualDroppedItems: Array<{ id: string; name: string; count: number }> = [];
  let curHeroForLog: Hero | null = null;
  let levelUpMessage: string | undefined;

  let partySharePayload: { baseExp: number; baseSp: number; baseAdena: number } | null = null;
  let partyLogMeta: { heroId: string; eEach: number; sEach: number; aEach: number } | null = null;
  const partyN = (() => {
    try {
      const p = usePartyStore.getState().party;
      return p && p.members.length > 1 ? p.members.length : 0;
    } catch {
      return 0;
    }
  })();

  useHeroStore.getState().updateHero((prev) => {
    const curHero = prev ?? useHeroStore.getState().hero;
    if (!curHero) return {};
    curHeroForLog = curHero;

    const dropResult = processMobDrops(mob, curHero, mobSpoiled, zoneId);
    dropMessages = dropResult.dropMessages;
    actualDroppedItems = dropResult.actualDroppedItems ?? [];

    const victoryUpdates: Partial<Hero> = {
      inventory: dropResult.newInventory,
      overflowChest: dropResult.overflowChest ?? [],
    };
    if (dropResult.questProgressUpdates && dropResult.questProgressUpdates.length > 0) {
      const baseActiveQuests = curHero.activeQuests || [];
      victoryUpdates.activeQuests = baseActiveQuests.map((aq) => {
        const questUpdates =
          dropResult.questProgressUpdates?.filter((u) => u.questId === aq.questId) || [];
        if (questUpdates.length > 0) {
          const newProgress = { ...(aq.progress || {}) };
          questUpdates.forEach((update) => {
            newProgress[update.itemId] = (newProgress[update.itemId] || 0) + update.count;
          });
          return { ...aq, progress: newProgress };
        }
        return aq;
      });
    }
    const baseAfterDrops = victoryUpdates.activeQuests ?? curHero.activeQuests ?? [];
    const killNext = applyQuestKillProgressOnVictory(
      mob,
      baseAfterDrops,
      QUESTS,
      zoneId ?? null,
      Math.max(1, Math.floor(Number(curHero.level) || 1))
    );
    if (killNext) {
      victoryUpdates.activeQuests = killNext;
    }
    if (dropResult.zaricheEquipped && dropResult.zaricheEquippedUntil) {
      if (dropResult.newEquipment) victoryUpdates.equipment = dropResult.newEquipment;
      if (dropResult.newEquipmentEnchantLevels) {
        victoryUpdates.equipmentEnchantLevels = dropResult.newEquipmentEnchantLevels;
      }
      victoryUpdates.zaricheEquippedUntil = dropResult.zaricheEquippedUntil;
    }

    const premiumMultiplier = getPremiumMultiplier(curHero);
    const expEnabled = getGameSettings().expEnabled !== false;
    const finalExpGain = expEnabled ? Math.round(expGain * premiumMultiplier) : 0;
    const finalSpGain = Math.round(spGain * premiumMultiplier);
    const finalAdenaGain =
      dropResult.adenaFromDrops != null && dropResult.adenaFromDrops > 0
        ? dropResult.adenaFromDrops
        : Math.round(adenaGain * premiumMultiplier);

    let applyExpGain = finalExpGain;
    let applySpGain = finalSpGain;
    let applyAdenaGain = finalAdenaGain;
    if (partyN > 1) {
      const eEach = Math.floor(finalExpGain / partyN);
      const sEach = Math.floor(finalSpGain / partyN);
      const aEach = Math.floor(finalAdenaGain / partyN);
      applyExpGain = finalExpGain - eEach * (partyN - 1);
      applySpGain = finalSpGain - sEach * (partyN - 1);
      applyAdenaGain = finalAdenaGain - aEach * (partyN - 1);
      partySharePayload = {
        baseExp: finalExpGain,
        baseSp: finalSpGain,
        baseAdena: finalAdenaGain,
      };
      if (curHero.id) {
        partyLogMeta = {
          heroId: String(curHero.id),
          eEach,
          sEach,
          aEach,
        };
      }
    }

    displayExp = applyExpGain;
    displaySp = applySpGain;
    displayAdena = applyAdenaGain;

    const completed = curHero.dailyQuestsCompleted ?? [];
    const cur = curHero.dailyQuestsProgress ?? {};
    const nextProgress: Record<string, number> = { ...cur };
    if (!completed.includes("daily_kills")) nextProgress.daily_kills = (cur.daily_kills ?? 0) + 1;
    if (!completed.includes("daily_adena_farm")) {
      nextProgress.daily_adena_farm = (cur.daily_adena_farm ?? 0) + applyAdenaGain;
    }

    const newCompleted = [...completed];
    let rewardAdena = 0;
    let rewardExp = 0;
    let rewardSp = 0;
    let rewardCoinOfLuck = 0;
    for (const q of DAILY_QUESTS) {
      if (nextProgress[q.id] >= q.target && !completed.includes(q.id)) {
        newCompleted.push(q.id);
        rewardAdena += q.rewards.adena ?? 0;
        rewardExp += expEnabled ? Math.round((q.rewards.exp ?? 0) * EXP_GAIN_RATE) : 0;
        rewardSp += Math.round((q.rewards.sp ?? 0) * SP_GAIN_RATE);
        rewardCoinOfLuck += q.rewards.coinOfLuck ?? 0;
      }
    }

    let level = Number(curHero.level ?? 1) || 1;
    let exp = Math.floor(Number(curHero.exp ?? 0)) + applyExpGain + rewardExp;
    const EPS = 0.001;
    let leveled = false;
    let levelUps = 0;
    while (exp >= getExpToNext(level, XP_RATE) - EPS && levelUps < MAX_LEVEL_UPS_PER_TICK) {
      const need = getExpToNext(level, XP_RATE);
      if (need <= 0 || level >= MAX_LEVEL) {
        if (level >= MAX_LEVEL) exp = 0;
        break;
      }
      exp = Math.max(0, Math.floor(exp - need));
      level += 1;
      leveled = true;
      levelUps++;
    }

    const updMaxHp = curHero.maxHp ?? curHero.hp ?? 0;
    const updMaxCp = curHero.maxCp ?? curHero.cp ?? 0;
    const updMaxMp = curHero.maxMp ?? curHero.mp ?? 0;
    if (leveled) levelUpMessage = `Повышение уровня! ${level}`;

    const currentMobsKilled =
      (curHero as any).mobsKilled ??
      (curHero as any).mobs_killed ??
      (curHero as any).killedMobs ??
      (curHero as any).totalKills ??
      0;
    const newMobsKilled = currentMobsKilled + 1;

    Object.assign(victoryUpdates, {
      level,
      exp,
      sp: (curHero.sp ?? 0) + applySpGain + rewardSp,
      adena: (curHero.adena ?? 0) + applyAdenaGain + rewardAdena,
      mobsKilled: newMobsKilled,
      hp: leveled ? updMaxHp : postVictoryHp,
      mp: leveled ? updMaxMp : postVictoryMp,
      cp: leveled ? updMaxCp : postVictoryCp,
      dailyQuestsProgress: nextProgress,
      dailyQuestsCompleted: newCompleted,
      ...(rewardCoinOfLuck > 0
        ? { coinOfLuck: ((curHero as any).coinOfLuck ?? 0) + rewardCoinOfLuck }
        : {}),
    } as Partial<Hero>);

    const heroWithNewHp = { ...curHero, ...victoryUpdates };
    const recalculatedAfter = recalculateAllStats(heroWithNewHp, heroBuffs);
    (victoryUpdates as any).battleStats = useBuffedBattleStats
      ? recalculatedAfter.finalStats
      : recalculatedAfter.baseFinalStats;

    const hj = { ...((curHero as any).heroJson || {}) };
    delete hj.battleSession;
    const buffSnapshot = Array.isArray(heroBuffs)
      ? heroBuffs.map((b: any) => ({ ...b }))
      : Array.isArray(hj.heroBuffs)
        ? hj.heroBuffs.map((b: any) => ({ ...b }))
        : [];
    (victoryUpdates as any).heroJson = {
      ...hj,
      heroBuffs: buffSnapshot,
      lastKillMobId: mob.id,
      lastKillMobName: String(mob.name ?? "").slice(0, 200),
      lastKillZoneId: zoneId ?? hj.lastKillZoneId,
      lastKillZoneName: zoneId ? getZoneActivityLabel(zoneId) : hj.lastKillZoneName,
      ...(zoneId ? { battleZoneId: zoneId, zoneId: zoneId } : {}),
    };

    return victoryUpdates;
  }, { skipServer: true });

  if (partySharePayload) {
    void postPartyKillShare(partySharePayload).catch(() => {});
  }

  const heroSnapshotForFinish = useHeroStore.getState().hero;
  const heroJsonSnapshotForFinish = ((heroSnapshotForFinish as any)?.heroJson || {}) as any;

  // Server-authoritative battle finish:
  // 1. battle-finish: server calculates real drops, saves exp/sp/adena/inventory atomically
  // 2. quest drops (client-calculated) are sent to server to be added to inventory
  // 3. On response: apply server's heroJson.inventory to replace optimistic state
  void runSerializedPveMutation(async () => {
    try {
      const updatedHero = heroSnapshotForFinish ?? useHeroStore.getState().hero;
      if (!updatedHero) return;
      const heroJson = heroJsonSnapshotForFinish;
      const liveHero = useHeroStore.getState().hero ?? updatedHero;
      const finishResources = heroResourcesForBattleFinishPayload(liveHero);
      const finishBuffsRaw: any[] = Array.isArray((liveHero as any).heroJson?.heroBuffs)
        ? ((liveHero as any).heroJson.heroBuffs as any[])
        : Array.isArray(heroBuffs)
          ? heroBuffs
          : [];

      // No separate pickupItemAPI — server handles item drops in battle-finish.
      // Quest items that need to be in inventory: the server's heroJson.inventory
      // will include them after next loadHeroFromAPI (server merges with client state).
      const questDropItems: Array<{ id: string; count: number; name?: string; kind?: string; slot?: string; icon?: string }> = [];
      // Idempotency key: retry of the same kill must not duplicate server rewards/progress.
      const finishNonce = `${Date.now()}_${Math.floor(Math.random() * 1_000_000_000)}`;
      const expectedRevision = Number(
        useHeroStore.getState().serverState?.heroRevision ??
        (updatedHero as any)?.heroJson?.heroRevision ??
        0
      );

      let finishPayload = {
        mobId: String(mob.id ?? ""),
        finishNonce,
        expectedRevision: Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0,
        spoiled: mobSpoiled,
        zoneId: zoneId,
        earnedExp: displayExp,
        earnedSp: displaySp,
        earnedAdena: displayAdena,
        newLevel: updatedHero.level,
        newExp: updatedHero.exp,
        newSp: updatedHero.sp,
        // Don't send newAdena — server adds drop adena on top of current DB adena
        newHp: finishResources.hp,
        newMp: finishResources.mp,
        newCp: finishResources.cp,
        questDrops: questDropItems.length > 0 ? questDropItems : undefined,
        heroJsonPatch: {
          mobsKilled: (updatedHero as any).mobsKilled,
          lastKillMobId: heroJson.lastKillMobId,
          lastKillMobName: heroJson.lastKillMobName,
          lastKillZoneId: heroJson.lastKillZoneId,
          lastKillZoneName: heroJson.lastKillZoneName,
          battleZoneId: heroJson.battleZoneId,
          zoneId: heroJson.zoneId,
          heroBuffs: JSON.parse(JSON.stringify(finishBuffsRaw)),
        },
      };
      let finishResult: Awaited<ReturnType<typeof battleFinishAPI>> | null = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          finishResult = await battleFinishAPI(finishPayload);
          break;
        } catch (err: any) {
          const isRevisionConflict =
            err?.status === 409 ||
            err?.body?.error === "revision_conflict" ||
            String(err?.message ?? "").includes("revision_conflict") ||
            String(err?.message ?? "").includes("Character was modified");
          if (isRevisionConflict) {
            const currentRevision = maxRevisionFromConflictBody(err?.body) ?? 0;
            if (Number.isFinite(currentRevision) && currentRevision >= 0) {
              useHeroStore.getState().updateServerState({
                heroRevision: currentRevision,
                updatedAt: Date.now(),
              } as any);
            }
            try {
              const { loadHeroFromAPI } = await import("../heroStore/heroLoadAPI");
              const synced = await loadHeroFromAPI();
              if (synced) useHeroStore.getState().setHero(synced);
            } catch {
              /* ignore secondary sync failure */
            }
            if (attempt === 0) {
              const retryRevision = Number(
                useHeroStore.getState().serverState?.heroRevision ?? currentRevision
              );
              if (Number.isFinite(retryRevision) && retryRevision >= 0) {
                finishPayload = { ...finishPayload, expectedRevision: retryRevision };
              }
              await new Promise((resolve) => setTimeout(resolve, 150));
              continue;
            }
            finishResult = null;
            break;
          }
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 400));
            continue;
          }
          throw err;
        }
      }

      if (finishResult?.ok && finishResult.character) {
        applyCharacterSnapshotFromApi(finishResult.character);

        let cleanedFinishBuffs: ReturnType<typeof cleanupBuffs> | null = null;
        const hAfter = useHeroStore.getState().hero;
        const n = hAfter?.name;
        if (hAfter && n) {
          const saved = loadBattle(n) || {};
          const localBattle = Array.isArray(saved.heroBuffs)
            ? saved.heroBuffs
            : battleStoreRef.getState()?.heroBuffs || [];
          const srvBuffs = Array.isArray((hAfter as any).heroJson?.heroBuffs)
            ? (hAfter as any).heroJson.heroBuffs
            : [];
          const mergedFinishBuffs = mergeServerHeroBuffsRespectLocalToggleOff(
            hAfter,
            srvBuffs,
            localBattle,
            Date.now(),
          );
          cleanedFinishBuffs = cleanupBuffs(mergedFinishBuffs, Date.now());
          useHeroStore.getState().updateHero(
            {
              heroJson: {
                ...((hAfter as any).heroJson || {}),
                heroBuffs: cleanedFinishBuffs,
              },
            },
            { skipServer: true },
          );
          persistBattle({ ...saved, heroBuffs: cleanedFinishBuffs }, n);
          battleStoreRef.setState?.({ heroBuffs: cleanedFinishBuffs });
        }

        const serverDrops = finishResult.serverDrops;
        if (Array.isArray(serverDrops?.items)) {
          const serverDropLines: string[] = serverDrops.items.map((item: { id: string; count: number; name?: string; kind?: string }) => {
            const displayName = item.name || itemsDB[item.id]?.name || item.id;
            const count = item.count ?? 1;
            const kind = String(item.kind ?? "").toLowerCase();
            const prefix = kind === "quest" ? "Квест" : kind === "spoil" ? "Спойл" : "Дроп";
            return `${prefix}: ${displayName} x${count}`;
          });
          const currentLog = battleStoreRef.getState()?.log ?? [];
          const filteredLog = currentLog.filter(
            (line) =>
              !line.startsWith("Дроп:") &&
              !line.startsWith("Спойл:") &&
              !line.startsWith("Квест:")
          );
          const newLog = mergeServerDropLinesIntoVictoryBattleLog(filteredLog, serverDropLines);
          battleStoreRef.setState?.({ log: newLog });
        }
      } else if (finishResult?.ok && finishResult.heroJson) {
        if (finishResult.heroJson.heroRevision) {
          useHeroStore.getState().updateServerState(
            { heroRevision: finishResult.heroJson.heroRevision, updatedAt: Date.now() },
            {}
          );
        }

        const serverHj = finishResult.heroJson;
        const serverDrops = finishResult.serverDrops;
        const patch: Partial<import("../../types/Hero").Hero> = {};

        if (Array.isArray(serverHj.inventory)) {
          const EQUIP_K = new Set(["weapon","armor","helmet","boots","gloves","shield","necklace","ring","earring","jewelry","belt","cloak"]);
          const localInvNow = useHeroStore.getState().hero?.inventory ?? [];
          const localById = new Map<string, number>();
          for (const item of localInvNow) {
            if (!item?.id) continue;
            const nid = item.id.replace(/^shop_/i, "").toLowerCase();
            localById.set(nid, (localById.get(nid) ?? 0) + ((item.count ?? 1)));
          }
          const mapped = serverHj.inventory.map((srv: any) => {
            if (!srv?.id) return srv;
            const nid = srv.id.replace(/^shop_/i, "").toLowerCase();
            const localCount = localById.get(nid);
            const srvKind = String(srv.kind ?? "").toLowerCase();
            const srvSlot = String(srv.slot ?? "").toLowerCase();
            const isConsumedDuringBattle =
              srvKind === "shot" || srvKind === "ammo" || srvKind === "arrow" ||
              srvSlot === "shot" || srvSlot === "ammo" || srvSlot === "arrow" ||
              nid.includes("soulshot") || nid.includes("spiritshot") ||
              nid.includes("blessed_soulshot") || nid.includes("blessed_spiritshot") ||
              nid.includes("_charge") || nid.includes("full_charge");
            if (isConsumedDuringBattle && localCount != null && localCount < (srv.count ?? 1)) {
              return { ...srv, count: localCount };
            }
            return srv;
          });
          const dedupMap = new Map<string, number>();
          const deduped: any[] = [];
          for (const item of mapped) {
            if (!item?.id) { deduped.push(item); continue; }
            const id = String(item.id).trim().toLowerCase();
            const kind = String(item.kind ?? "").toLowerCase();
            const slot = String(item.slot ?? "").toLowerCase();
            const stackable = !(item?.meta?.hasLSPassive) && !EQUIP_K.has(kind) && !EQUIP_K.has(slot);
            if (!stackable) { deduped.push(item); continue; }
            const existing = dedupMap.get(id);
            if (existing !== undefined) {
              deduped[existing] = { ...deduped[existing], count: (deduped[existing].count ?? 1) + (item.count ?? 1) };
            } else {
              dedupMap.set(id, deduped.length);
              deduped.push({ ...item });
            }
          }

          const currentEquipment = useHeroStore.getState().hero?.equipment ?? {};
          const currentEquippedNids = new Set(
            Object.values(currentEquipment)
              .filter(Boolean)
              .map((v) => String(v).replace(/^shop_/i, "").toLowerCase())
          );
          const serverNidToIdx = new Map<string, number>();
          deduped.forEach((item: any, idx: number) => {
            if (!item?.id) return;
            const nid = String(item.id).replace(/^shop_/i, "").toLowerCase();
            serverNidToIdx.set(nid, idx);
          });
          for (const localItem of localInvNow) {
            if (!localItem?.id) continue;
            const nid = String(localItem.id).replace(/^shop_/i, "").toLowerCase();
            if (currentEquippedNids.has(nid)) continue;
            const lkind = String((localItem as any).kind ?? "").toLowerCase();
            const lslot = String((localItem as any).slot ?? "").toLowerCase();
            const isStackable = !EQUIP_K.has(lkind) && !EQUIP_K.has(lslot) && lkind !== "equipment";
            const serverIdx = serverNidToIdx.get(nid);
            if (serverIdx !== undefined) {
              if (isStackable) {
                const srvCount = deduped[serverIdx]?.count ?? 1;
                const locCount = (localItem as any).count ?? 1;
                if (locCount > srvCount) {
                  deduped[serverIdx] = { ...deduped[serverIdx], count: locCount };
                }
              }
            } else {
              if (isStackable) {
                deduped.push({ ...localItem, count: (localItem as any).count ?? 1 });
              } else {
                deduped.push(localItem);
              }
              serverNidToIdx.set(nid, deduped.length - 1);
            }
          }

          patch.inventory = deduped;
        }
        if (Array.isArray(serverHj.overflowChest)) {
          patch.overflowChest = serverHj.overflowChest;
        }
        if (Array.isArray(serverHj.activeQuests)) {
          patch.activeQuests = serverHj.activeQuests;
        }
        if (serverDrops?.zaricheEquipped && serverHj.equipment) {
          patch.equipment = serverHj.equipment;
          patch.equipmentEnchantLevels = serverHj.equipmentEnchantLevels;
          if (serverDrops.zaricheEquippedUntil) {
            (patch as any).zaricheEquippedUntil = serverDrops.zaricheEquippedUntil;
          }
        }

        let cleanedFinishBuffs: ReturnType<typeof cleanupBuffs> | null = null;
        if (Array.isArray(serverHj.heroBuffs)) {
          cleanedFinishBuffs = cleanupBuffs(serverHj.heroBuffs, Date.now());
          const hLive = useHeroStore.getState().hero;
          (patch as any).heroJson = {
            ...((hLive as any)?.heroJson || {}),
            heroBuffs: cleanedFinishBuffs,
          };
        }

        if (Object.keys(patch).length > 0) {
          useHeroStore.getState().updateHero(patch, { skipServer: true });
        }

        if (cleanedFinishBuffs && useHeroStore.getState().hero?.name) {
          const n = useHeroStore.getState().hero!.name;
          const saved = loadBattle(n) || {};
          persistBattle({ ...saved, heroBuffs: cleanedFinishBuffs }, n);
          battleStoreRef.setState?.({ heroBuffs: cleanedFinishBuffs });
        }

        if (Array.isArray(serverDrops?.items)) {
          const serverDropLines: string[] = serverDrops.items.map((item: { id: string; count: number; name?: string; kind?: string }) => {
            const displayName = item.name || itemsDB[item.id]?.name || item.id;
            const count = item.count ?? 1;
            const kind = String(item.kind ?? "").toLowerCase();
            const prefix = kind === "quest" ? "Квест" : kind === "spoil" ? "Спойл" : "Дроп";
            return `${prefix}: ${displayName} x${count}`;
          });
          const currentLog = battleStoreRef.getState()?.log ?? [];
          const filteredLog = currentLog.filter(
            (line) =>
              !line.startsWith("Дроп:") &&
              !line.startsWith("Спойл:") &&
              !line.startsWith("Квест:")
          );
          const newLog = mergeServerDropLinesIntoVictoryBattleLog(filteredLog, serverDropLines);
          battleStoreRef.setState?.({ log: newLog });
        }
      }
    } catch (error) {
      console.error("[commitMobVictory] battle-finish failed, forcing resync", error);
      void import("../heroStore/heroLoadAPI")
        .then(({ loadHeroFromAPI }) => loadHeroFromAPI())
        .then((h) => {
          if (h) useHeroStore.getState().setHero(h);
        })
        .catch(() => {});
    }
  });

  let partyMemberLootLines: string[] = [];
  if (partyLogMeta?.heroId) {
    try {
      const party = usePartyStore.getState().party;
      if (party?.members?.length) {
        partyMemberLootLines = buildPartyMemberVictoryLogLines(
          party.members,
          partyLogMeta.heroId,
          partyLogMeta.eEach,
          partyLogMeta.sEach,
          partyLogMeta.aEach
        );
      }
    } catch {
      /* ignore */
    }
  }

  const isRaidBoss = (mob as any)?.isRaidBoss === true;
  if (isRaidBoss && curHeroForLog) {
    reportRaidBossKill({
      characterId: curHeroForLog.id,
      characterName: curHeroForLog.name,
      bossName: mob?.name || "",
      bossLevel: mob?.level,
      actualDroppedItems: actualDroppedItems,
      killRewards: {
        adena: displayAdena,
        exp: displayExp,
        sp: displaySp,
      },
    }).catch((err) => {
      console.error("Error reporting raid boss kill:", err);
    });
  }

  if (zoneId !== undefined && mobIndex !== undefined) {
    const heroName = useHeroStore.getState().hero?.name;
    const isFishingZone = zoneId === "fishing";
    let respawnTime: number;
    if (isRaidBoss) {
      respawnTime = (mob as any)?.respawnTime
        ? (mob as any).respawnTime * 1000
        : 6 * 60 * 60 * 1000;
    } else if (isFishingZone) {
      respawnTime = 5000;
    } else {
      respawnTime = isChampionMob(mob) ? 600000 : 30000;
    }
    setMobRespawn(zoneId, mobIndex, respawnTime, heroName);
    void postWorldMobKill(zoneId, mobIndex, respawnTime)
      .then((res) => {
        if (res?.ok) applyWorldMobKillLocal(zoneId, mobIndex, respawnTime, res.respawnAt);
      })
      .catch(() => {});
  }

  const result = {
    displayExp,
    displaySp,
    displayAdena,
    dropMessages,
    mobSpoiled,
    levelUpMessage,
    partyMemberLootLines,
  };
  lastVictorySignature = victorySignature;
  lastVictoryAt = nowSig;
  lastVictoryResult = result;
  return result;
}
