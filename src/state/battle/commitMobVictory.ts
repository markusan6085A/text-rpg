import { getExpToNext, MAX_LEVEL } from "../../data/expTable";
import { DAILY_QUESTS } from "../../data/dailyQuests";
import { EXP_GAIN_RATE, SP_GAIN_RATE } from "../../data/balance";
import type { Mob } from "../../data/world/types";
import type { Hero } from "../../types/Hero";
import { getGameSettings } from "../gameSettings";
import { useHeroStore } from "../heroStore";
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

  useHeroStore.getState().updateHero((prev) => {
    const curHero = prev ?? useHeroStore.getState().hero;
    if (!curHero) return {};
    curHeroForLog = curHero;

    const dropResult = processMobDrops(mob, curHero, mobSpoiled);
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
    const killNext = applyQuestKillProgressOnVictory(mob, baseAfterDrops, QUESTS, zoneId ?? null);
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
    displayExp = finalExpGain;
    displaySp = finalSpGain;
    displayAdena = finalAdenaGain;

    const completed = curHero.dailyQuestsCompleted ?? [];
    const cur = curHero.dailyQuestsProgress ?? {};
    const nextProgress: Record<string, number> = { ...cur };
    if (!completed.includes("daily_kills")) nextProgress.daily_kills = (cur.daily_kills ?? 0) + 1;
    if (!completed.includes("daily_adena_farm")) {
      nextProgress.daily_adena_farm = (cur.daily_adena_farm ?? 0) + finalAdenaGain;
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
    let exp = Math.floor(Number(curHero.exp ?? 0)) + finalExpGain + rewardExp;
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
      sp: (curHero.sp ?? 0) + finalSpGain + rewardSp,
      adena: (curHero.adena ?? 0) + finalAdenaGain + rewardAdena,
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

    return victoryUpdates;
  });

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
  }

  return { displayExp, displaySp, displayAdena, dropMessages, mobSpoiled, levelUpMessage };
}
