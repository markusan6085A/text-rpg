import { useState, useEffect, useCallback } from "react";
import {
  getPkSession,
  actPkSession,
  syncPkStats,
  type PkSessionState,
} from "../../utils/api";
import { getSkillDef, getSkillDefForBattle, skillDefIsBuff, skillDefIsToggle } from "../../state/battle/loadout";
import { processSkillEffects } from "../../state/battle/actions/useSkill/buffHelpers";
import { useBattleStore } from "../../state/battle/store";
import { useHeroStore } from "../../state/heroStore";
import { useAutoShot } from "../../state/battle/actions/useSkill/shotHelpers";
import { calcAutoAttackInterval, calcPhysicalSkillCooldown } from "../../utils/combatSpeed";
import {
  rollbackPkPredictiveCooldownIfActionFailed,
  rollbackPkPredictiveCooldownOnNetworkError,
} from "../../state/battle/pkPredictiveCooldownRollback";

type Options = {
  sessionId: string | null;
  /** Якщо false — не поллимо й не бʼємо */
  enabled: boolean;
  /** Викликається після actPkSession, коли сесія завершена (передається актуальний стан). */
  onSessionEnded?: (session: PkSessionState) => void;
};

export function usePkSessionCombat({ sessionId, enabled, onSessionEnded }: Options) {
  const hero = useHeroStore((s) => s.hero);
  const [pkSession, setPkSession] = useState<PkSessionState | null>(null);
  const [pkLoading, setPkLoading] = useState(false);
  const [pkActing, setPkActing] = useState(false);
  const [pkError, setPkError] = useState<string | null>(null);
  const [serverTimeDrift, setServerTimeDrift] = useState(0);

  useEffect(() => {
    if (!enabled || !sessionId) return;
    let cancelled = false;
    setPkLoading(true);
    setPkError(null);
    (async () => {
      try {
        const res = await getPkSession(sessionId);
        if (cancelled) return;
        if (res.serverNow) setServerTimeDrift(Date.now() - res.serverNow);
        setPkSession(res.session);
      } catch (e: any) {
        if (!cancelled) setPkError(e?.message || "Не удалось загрузить сессию");
      } finally {
        if (!cancelled) setPkLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, sessionId]);

  useEffect(() => {
    if (!enabled || !pkSession?.id) return;
    const timer = setInterval(async () => {
      try {
        const res = await getPkSession(pkSession.id);
        if (res.serverNow) setServerTimeDrift(Date.now() - res.serverNow);
        setPkSession(res.session);
      } catch {
        /* keep */
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [enabled, pkSession?.id]);

  useEffect(() => {
    if (!enabled || !pkSession || !hero) return;
    const isAttacker = hero.id === pkSession.attackerId;
    const myFighter = isAttacker ? pkSession.attacker : pkSession.defender;
    const serverHp = myFighter?.hp;
    const serverMp = myFighter?.mp;
    const localHp = hero.hp ?? Infinity;
    const localMp = hero.mp ?? Infinity;
    if (
      myFighter &&
      ((serverHp != null && serverHp < localHp) || (serverMp != null && serverMp < localMp))
    ) {
      useHeroStore.getState().updateHero({
        ...(serverHp != null && { hp: serverHp }),
        ...(serverMp != null && { mp: serverMp }),
      });
    }
  }, [enabled, pkSession, hero?.id]);

  useEffect(() => {
    if (!enabled || !pkSession?.id || !hero) return;
    const isAttacker = hero.id === pkSession.attackerId;
    const myFighter = isAttacker ? pkSession.attacker : pkSession.defender;
    const needsSync = hero.maxHp !== myFighter?.maxHp || hero.maxMp !== myFighter?.maxMp;
    if (!needsSync) return;
    let cancelled = false;
    syncPkStats(pkSession.id, {
      hp: hero.hp,
      maxHp: hero.maxHp,
      mp: hero.mp,
      maxMp: hero.maxMp,
    })
      .then((res) => {
        if (cancelled) return;
        if (res.serverNow) setServerTimeDrift(Date.now() - res.serverNow);
        if (res.ok && res.session) setPkSession(res.session);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, pkSession?.id, hero?.id, hero?.maxHp, hero?.maxMp]);

  const handlePkUseSkill = useCallback(
    async (skillId: number) => {
      if (!pkSession || pkSession.ended || pkActing || !hero) return;
      setPkActing(true);
      setPkError(null);
      const skillDef = getSkillDefForBattle(hero.profession || null, hero.klass, hero.race, skillId) ?? getSkillDef(skillId);
      if (skillDef?.cooldown) {
        let cooldownMs = skillDef.cooldown * 1000;
        if (!(skillDef as any).isMagic && !skillDefIsBuff(skillDef) && !skillDefIsToggle(skillDef)) {
          const attackSpeed = (hero as any)?.attackSpeed ?? (hero as any)?.atkSpeed ?? 200;
          cooldownMs = calcPhysicalSkillCooldown(skillDef.cooldown, attackSpeed);
        }
        useBattleStore.setState((s) => ({
          cooldowns: { ...s.cooldowns, [skillId]: Date.now() + cooldownMs },
        }));
      }
      try {
        const isBuff = skillDefIsBuff(skillDef);
        const isToggle = skillDefIsToggle(skillDef);
        let shotMultiplier = 1.0;
        let shotName: string | undefined;
        if (!isBuff && !isToggle) {
          const battleState = useBattleStore.getState();
          const isPhysical = !(skillDef as any)?.isMagic;
          const isMagic = !!(skillDef as any)?.isMagic;
          const consumeCount = skillId === 1 ? 1 : 2;
          const shotResult = useAutoShot(
            hero as any,
            isPhysical,
            isMagic,
            battleState.loadoutSlots,
            battleState.activeChargeSlots,
            consumeCount
          );
          if (shotResult.used) {
            shotMultiplier = shotResult.multiplier;
            shotName = shotResult.shotType === "soulshot" ? "Soulshot" : "Spiritshot";
          }
        }
        let buffEffects: any[] | undefined;
        let buffDurationSec: number | undefined;
        if (isBuff || isToggle) {
          if (skillDef) {
            const learned = hero?.skills?.find((s: any) => (s?.id ?? s) === skillId);
            const skillLevel = (learned as any)?.level ?? 1;
            const levelDef = skillDef.levels?.find((l: any) => l.level === skillLevel) ?? skillDef.levels?.[0];
            buffEffects = levelDef ? processSkillEffects(skillDef, levelDef) : undefined;
            buffDurationSec = skillDef?.duration ?? 120;
          }
        }
        const actOpts: NonNullable<Parameters<typeof actPkSession>[2]> = {
          isBuff,
          isToggle,
          name: skillDef?.name,
          target: skillDef?.target,
          shotMultiplier,
          shotName,
          buffEffects,
          buffCooldownMs:
            (isBuff || isToggle) && skillDef?.cooldown
              ? skillDef.category === "toggle"
                ? 0
                : skillDef.cooldown * 1000
              : undefined,
          buffDurationSec,
        };
        if (!isBuff && !isToggle && skillDef && typeof skillDef.cooldown === "number" && skillDef.cooldown > 0) {
          actOpts.skillBaseCooldownSec = skillDef.cooldown;
          actOpts.isMagicAttack =
            skillDef.category === "magic_attack" || !!(skillDef as any).isMagic;
        }
        const res = await actPkSession(pkSession.id, skillId, actOpts);
        if (res.serverNow) setServerTimeDrift(Date.now() - res.serverNow);
        setPkSession(res.session);
        if (res.actorBuffs?.length) {
          useBattleStore.setState({
            pkActorBuffs: res.actorBuffs.map((b) => ({ ...b, effects: b.effects ?? [] })),
          });
        }
        rollbackPkPredictiveCooldownIfActionFailed(res.session?.log?.[0], {
          heroName: String(hero?.name ?? "").trim(),
          skillIdUsed: skillId,
        });
        if (res.session.ended) onSessionEnded?.(res.session);
      } catch (e: any) {
        rollbackPkPredictiveCooldownOnNetworkError(skillId);
        setPkError(e?.message || "Ошибка действия");
      } finally {
        setPkActing(false);
      }
    },
    [pkSession, pkActing, hero, onSessionEnded]
  );

  const handlePkAttack = useCallback(async () => {
    if (!pkSession || pkSession.ended || pkActing || !hero) return;
    setPkActing(true);
    setPkError(null);
    const attackSpeed = (hero as any)?.attackSpeed ?? (hero as any)?.atkSpeed ?? 200;
    const intervalMs = Math.max(300, calcAutoAttackInterval(attackSpeed));
    const readyAt = Date.now() + intervalMs;
    // Як у PvE baseAttack: SkillBar для слота 0 читає heroNextAttackAt, а не лише cooldowns[0]
    useBattleStore.setState((s) => ({
      cooldowns: { ...s.cooldowns, [0]: readyAt },
      heroNextAttackAt: readyAt,
    }));
    try {
      let shotMultiplier = 1.0;
      let shotName: string | undefined;
      const battleState = useBattleStore.getState();
      const shotResult = useAutoShot(hero as any, true, false, battleState.loadoutSlots, battleState.activeChargeSlots, 1);
      if (shotResult.used) {
        shotMultiplier = shotResult.multiplier;
        shotName = shotResult.shotType === "soulshot" ? "Soulshot" : "Spiritshot";
      }
      const res = await actPkSession(pkSession.id, undefined, { shotMultiplier, shotName });
      if (res.serverNow) setServerTimeDrift(Date.now() - res.serverNow);
      setPkSession(res.session);
      if (res.session.ended) onSessionEnded?.(res.session);
      rollbackPkPredictiveCooldownIfActionFailed(res.session?.log?.[0], {
        heroName: String(hero?.name ?? "").trim(),
        skillIdUsed: undefined,
      });
    } catch (e: any) {
      rollbackPkPredictiveCooldownOnNetworkError(undefined);
      setPkError(e?.message || "Ошибка действия");
    } finally {
      setPkActing(false);
    }
  }, [pkSession, pkActing, hero, onSessionEnded]);

  return {
    pkSession,
    setPkSession,
    pkLoading,
    pkActing,
    pkError,
    serverTimeDrift,
    handlePkUseSkill,
    handlePkAttack,
  };
}
