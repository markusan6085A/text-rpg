import type { SkillDefinition, SkillLevelDefinition } from "../../../data/skills/types";
import type { Hero } from "../../../types/Hero";
import type { BattleState } from "../types";
import { pveBattleAttackAPI } from "../../../utils/api/characters";
import { useHeroStore } from "../../heroStore";
import { useCharacterStore } from "../../characterStore";
import { battleStoreRef } from "../../battleStoreRef";
import { cleanupBuffs } from "../helpers";
import { loadBattle, persistBattle } from "../persist";
import { commitMobVictoryToHeroStore } from "../commitMobVictory";
import { buildVictoryResourceLogLines } from "../helpers/victoryLootLogLines";
import { addDailyProgress } from "../../dailyQuestsProgress";
import { createCooldownEntry } from "./useSkill/helpers";
import { calcAutoAttackInterval } from "../../../utils/combatSpeed";
import { applyBuffsToStats } from "../helpers";

let inFlightSkillId: number | null = null;

function pickCombatStatsForServer(heroStats: Record<string, any>): Record<string, number> {
  const keys = [
    "pAtk",
    "mAtk",
    "physSkillPower",
    "magicSkillPower",
    "crit",
    "mCrit",
    "critPower",
    "lsEmpower",
    "lsBackbiting",
    "lsGuidance",
    "mpSkillCostReduction",
    "lsRskFocus",
    "accuracy",
    "fireAttack",
    "waterAttack",
    "windAttack",
    "earthAttack",
    "holyAttack",
    "darkAttack",
  ];
  const out: Record<string, number> = {};
  for (const k of keys) {
    const n = Number(heroStats[k]);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

export function schedulePveAttackSkillOnline(args: {
  skillId: number;
  def: SkillDefinition;
  levelDef: SkillLevelDefinition;
  hero: Hero;
  heroStats: Record<string, any>;
  state: BattleState;
  cooldownDurationMs: number;
  now: number;
  onFallback: () => void;
}): void {
  const { skillId, def, hero, heroStats, state, cooldownDurationMs, now, onFallback } = args;
  if (inFlightSkillId === skillId) return;
  const cid =
    String(useCharacterStore.getState().characterId ?? "").trim() ||
    String((hero as any)?.id ?? "").trim();
  if (!cid || !hero?.name) {
    onFallback();
    return;
  }

  const expectedRevisionRaw =
    useHeroStore.getState().serverState?.heroRevision ?? (hero as any)?.heroJson?.heroRevision ?? 0;
  const expectedRevision = Number(expectedRevisionRaw);
  if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
    onFallback();
    return;
  }

  inFlightSkillId = skillId;
  void pveBattleAttackAPI(cid, {
    skillId,
    expectedRevision,
    heroCombatStats: pickCombatStatsForServer(heroStats),
    skillName: def.name,
    loadoutSlots: state.loadoutSlots,
    activeChargeSlots: state.activeChargeSlots ?? [],
    mobBuffs: state.mobBuffs ?? [],
  })
    .then((res) => {
      if (!res?.ok || !(res as any).character) return;
      const ch = (res as any).character;
      const hj = (ch.heroJson && typeof ch.heroJson === "object" ? ch.heroJson : {}) as Record<string, any>;
      const store = useHeroStore.getState();
      const prevHj = ((store.hero as any)?.heroJson || {}) as Record<string, any>;
      store.applyServerSync(
        {
          hp: hj.hp,
          mp: hj.mp,
          cp: hj.cp,
          heroJson: { ...prevHj, ...hj },
        } as any,
        {
          heroRevision: hj.heroRevision,
          updatedAt: ch.updatedAt ? new Date(ch.updatedAt).getTime() : Date.now(),
        }
      );

      const damage = Math.max(0, Math.floor(Number((res as any).damage ?? 0)));
      if (damage > 0) addDailyProgress("daily_damage", damage);

      const heroName = store.hero?.name;
      if (!heroName) return;

      const killed = (res as any).killed === true;
      const mobHpAfter = Math.max(0, Math.floor(Number((res as any).mobHpAfter ?? 0)));
      const logLines: string[] = Array.isArray((res as any).logLines)
        ? (res as any).logLines.filter((x: any) => typeof x === "string")
        : [];

      const heroAfter = store.hero;
      const bs = battleStoreRef.getState();
      const prevCd = { ...(bs?.cooldowns || {}) };
      let nextCooldowns = prevCd;
      let heroNextAttackAtOut: number | undefined;
      if (skillId === 0) {
        const buffed = applyBuffsToStats(heroAfter?.battleStats || {}, bs?.heroBuffs || []);
        const atkSpd = buffed?.attackSpeed ?? buffed?.atkSpeed ?? 0;
        heroNextAttackAtOut = now + calcAutoAttackInterval(atkSpd);
      } else {
        nextCooldowns = { ...prevCd, ...createCooldownEntry(skillId, cooldownDurationMs, now) };
      }

      if (killed && state.mob && heroAfter) {
        const buffsForVictory = cleanupBuffs(
          Array.isArray(hj.heroBuffs) ? (hj.heroBuffs as any[]) : state.heroBuffs || [],
          Date.now()
        );
        const v = commitMobVictoryToHeroStore({
          mob: state.mob,
          heroBuffs: buffsForVictory,
          postVictoryHp: heroAfter.hp ?? 0,
          postVictoryMp: heroAfter.mp ?? 0,
          postVictoryCp: heroAfter.cp ?? 0,
          useBuffedBattleStats: true,
          zoneId: state.zoneId,
          mobIndex: state.mobIndex,
        });
        const victoryLog = [
          ...(v.levelUpMessage ? [v.levelUpMessage] : []),
          `ПЕРЕМОГА!`,
          v.mobSpoiled ? `Auto Spoil: моб автоматично спойлено.` : null,
          ...buildVictoryResourceLogLines(heroAfter.name ?? "Герой", v.displayExp, v.displaySp, v.displayAdena),
          ...(v.dropMessages.length > 0 ? v.dropMessages : []),
          ...(v.partyMemberLootLines.length > 0 ? v.partyMemberLootLines : []),
          ...logLines,
          ...(bs?.log || []),
        ].filter((msg): msg is string => msg != null);

        const victoryLogTrim = victoryLog.slice(0, 30);
        if (battleStoreRef.setState) {
          battleStoreRef.setState({
            mobHP: 0,
            status: "victory",
            mobStunnedUntil: undefined,
            mobBuffs: [],
            log: victoryLogTrim,
            cooldowns: nextCooldowns,
            ...(heroNextAttackAtOut != null ? { heroNextAttackAt: heroNextAttackAtOut } : {}),
            heroBuffs: buffsForVictory,
            lastReward: {
              exp: v.displayExp,
              sp: v.displaySp,
              adena: v.displayAdena,
              mob: state.mob?.name ?? "",
              spoiled: v.mobSpoiled,
              mobAggressivePatrol: state.mob?.aggressivePatrol === true,
            },
          });
        }
        const saved = loadBattle(heroName) || {};
        persistBattle(
          {
            ...saved,
            mobHP: 0,
            status: "victory",
            log: victoryLogTrim,
            cooldowns: nextCooldowns,
            ...(heroNextAttackAtOut != null ? { heroNextAttackAt: heroNextAttackAtOut } : {}),
            heroBuffs: buffsForVictory,
            lastReward: {
              exp: v.displayExp,
              sp: v.displaySp,
              adena: v.displayAdena,
              mob: state.mob?.name ?? "",
              spoiled: v.mobSpoiled,
              mobAggressivePatrol: state.mob?.aggressivePatrol === true,
            },
          } as any,
          heroName
        );
        return;
      }

      const mergedLog = [...logLines, ...(bs?.log || [])].slice(0, 30);
      const nextHeroBuffs = cleanupBuffs(
        Array.isArray(hj.heroBuffs) ? (hj.heroBuffs as any[]) : bs?.heroBuffs || [],
        Date.now()
      );
      if (battleStoreRef.setState) {
        battleStoreRef.setState({
          mobHP: mobHpAfter,
          status: "fighting",
          log: mergedLog,
          cooldowns: nextCooldowns,
          heroBuffs: nextHeroBuffs,
          ...(heroNextAttackAtOut != null ? { heroNextAttackAt: heroNextAttackAtOut } : {}),
        });
      }
      const saved = loadBattle(heroName) || {};
      persistBattle(
        {
          ...saved,
          mobHP: mobHpAfter,
          status: "fighting",
          log: mergedLog,
          cooldowns: nextCooldowns,
          heroBuffs: nextHeroBuffs,
          ...(heroNextAttackAtOut != null ? { heroNextAttackAt: heroNextAttackAtOut } : {}),
        } as any,
        heroName
      );
    })
    .catch((e: any) => {
      const st = Number(e?.status);
      const code = String(e?.body?.error ?? "");
      if (code === "no_battle_session" || code === "mob_dead") {
        const store = useHeroStore.getState();
        const h = store.hero;
        if (h && (h as any).heroJson) {
          const hj = { ...(h as any).heroJson } as Record<string, any>;
          delete hj.battleSession;
          store.updateHero({ heroJson: hj } as any, { skipServer: true });
        }
        if (battleStoreRef.setState) {
          battleStoreRef.setState({
            status: "idle",
            mobNextAttackAt: null,
          });
        }
        const heroName = store.hero?.name;
        if (heroName) {
          const saved = loadBattle(heroName) || {};
          persistBattle(
            {
              ...saved,
              status: "idle",
              mobNextAttackAt: null,
            } as any,
            heroName
          );
        }
        void import("../../heroStore/heroLoadAPI").then(({ loadHeroFromAPI }) => loadHeroFromAPI()).catch(() => {});
        return;
      }
      if (st === 404 && typeof onFallback === "function") {
        if (import.meta.env.DEV) {
          console.warn("[pve-battle-attack] 404 — fallback до локального удару (задеплойте API)");
        }
        try {
          onFallback();
        } catch (err) {
          if (import.meta.env.DEV) console.warn("[pve-battle-attack] fallback failed", err);
        }
        return;
      }
      void import("../../toastStore").then(({ showToast }) => {
        showToast("Не вдалося застосувати удар. Спробуйте знову або оновіть гру.", "error");
      });
      void import("../../heroStore/heroLoadAPI").then(({ loadHeroFromAPI }) => loadHeroFromAPI()).catch(() => {});
    })
    .finally(() => {
      if (inFlightSkillId === skillId) inFlightSkillId = null;
    });
}
