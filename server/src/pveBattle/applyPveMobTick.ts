/** Удар моба по герою: зональний РБ з фазами AI (як у client processMobAttack); ефірні РБ без ×2.25. */

import { getRaidBossAIProfile, type RaidBossPhase } from "./raidBossAIServer";
import { applyServerToggleResourceTicks } from "./applyServerToggleTicks";
import { applyPvePassiveMpCpRegen } from "./applyPvePassiveMpCpRegen";
import { clampPveResource, syncHeroJsonResourcePercentsToAbsolutes } from "./pveHeroResourceSync";

function mitigation(raw: number, mobAtkStat: number, heroDefense: number): number {
  const atk = Math.max(1, mobAtkStat);
  const def = Math.max(0, heroDefense);
  return Math.max(1, Math.round((raw * atk) / (atk + def)));
}

function pickRaidPhase(phases: RaidBossPhase[], hpPercent: number): RaidBossPhase | null {
  const p = Math.max(0, Math.min(100, hpPercent));
  return phases.find((ph) => p <= ph.fromHpPercent && p > ph.toHpPercent) ?? null;
}

export type PveMobTickBattleControl = {
  heroStunnedUntil?: number;
  heroBuffsBlockedUntil?: number;
  heroSkillsBlockedUntil?: number;
};

export type PveMobTickResult =
  | {
      ok: true;
      nextHeroJson: any;
      logLines: string[];
      heroHpAfter: number;
      killedHero: boolean;
      battleControl?: PveMobTickBattleControl;
    }
  | { ok: false; code: string; message?: string };

export function applyPveMobTickSnapshot(args: {
  heroJson: any;
  heroDefenseStats: {
    pDef?: number;
    mDef?: number;
    evasion?: number;
    invulnerable?: number;
    damageTakenReduction?: number;
  };
}): PveMobTickResult {
  const hjIn = args.heroJson && typeof args.heroJson === "object" ? args.heroJson : {};
  const hj = { ...hjIn };
  const sess: any = hj.battleSession;
  if (!sess || Number(sess.v) !== 1 || typeof sess.mobHP !== "number") {
    return { ok: false, code: "no_battle_session", message: "No active PvE battle on server" };
  }
  if (String(sess.zoneId || "") === "fishing") {
    return { ok: false, code: "fishing_local", message: "Fishing uses local combat" };
  }
  const mobHp = Math.max(0, Math.floor(Number(sess.mobHP)));
  if (mobHp <= 0) {
    return { ok: false, code: "mob_dead", message: "Mob already defeated" };
  }

  const tickNow = Date.now();
  const sessStarted = Number(sess.startedAt) || 0;
  const youngBattle = sessStarted > 0 && tickNow - sessStarted < 15_000;
  const toggleLogLines = applyServerToggleResourceTicks(
    hj,
    tickNow,
    youngBattle ? { maxTickCatchup: 2 } : undefined
  );
  applyPvePassiveMpCpRegen(hj, tickNow);

  const maxHp = Math.max(1, Math.floor(Number(hj.maxHp ?? hj.hp ?? 1)));
  const curHp = clampPveResource(Math.floor(Number(hj.hp ?? maxHp)), 0, maxHp);

  const pDef = clampPveResource(Math.floor(Number(args.heroDefenseStats.pDef ?? 0)), 0, 50000);
  const mDef = clampPveResource(Math.floor(Number(args.heroDefenseStats.mDef ?? 0)), 0, 50000);
  const evasion = clampPveResource(Math.floor(Number(args.heroDefenseStats.evasion ?? 0)), 0, 80);
  const invulnerable = Number(args.heroDefenseStats.invulnerable ?? 0) > 0;
  const dmgRed = clampPveResource(Number(args.heroDefenseStats.damageTakenReduction ?? 0), 0, 95);

  if (invulnerable || curHp <= 0) {
    syncHeroJsonResourcePercentsToAbsolutes(hj);
    return {
      ok: true,
      nextHeroJson: hj,
      logLines: [...toggleLogLines, "Монстр б’є, але ви невразливі."],
      heroHpAfter: curHp,
      killedHero: false,
    };
  }

  const isMiss = Math.random() * 100 < evasion;
  if (isMiss) {
    syncHeroJsonResourcePercentsToAbsolutes(hj);
    return {
      ok: true,
      nextHeroJson: hj,
      logLines: [...toggleLogLines, "Ви ухилилися від атаки монстра."],
      heroHpAfter: curHp,
      killedHero: false,
    };
  }

  const lv = Math.max(1, Math.floor(Number(sess.mobLevel) || 1));
  const isRb = sess.mobIsRaidBoss === true;
  const isEpic = sess.mobIsEpicRaidBoss === true;
  const isPhysical = Math.random() < 0.5;
  let mobPAtk = Math.floor(Number(sess.mobPAtk));
  if (!Number.isFinite(mobPAtk) || mobPAtk < 1) mobPAtk = lv * 20;
  let mobMAtk = Math.floor(Number(sess.mobMAtk));
  if (!Number.isFinite(mobMAtk) || mobMAtk < 1) mobMAtk = lv * 15;
  let base = isPhysical ? Math.max(5, mobPAtk) : Math.max(5, mobMAtk);

  let phaseMult = 1;
  let currentPhase: RaidBossPhase | null = null;
  if (isRb && !isEpic && sess.raidAiProfileId) {
    const prof = getRaidBossAIProfile(String(sess.raidAiProfileId));
    if (prof?.phases?.length) {
      const hpPct = (mobHp / Math.max(1, Math.floor(Number(sess.mobMaxHp) || 1))) * 100;
      currentPhase = pickRaidPhase(prof.phases, hpPct);
      if (currentPhase) phaseMult = Math.max(0.25, Number(currentPhase.damageMultiplier) || 1);
      else phaseMult = Math.max(0.25, Number(prof.phases[0]?.damageMultiplier) || 1);
    }
    base *= phaseMult;
    base *= 2.25;
  } else if (isRb && !isEpic) {
    base *= 2.25;
  } else if (sess.mobIsChampion === true) {
    base *= 4;
  }

  const variance = 0.25;
  const raw = base * (1 - variance + Math.random() * variance * 2);
  const defense = isPhysical ? pDef : mDef;
  const atkFor = isPhysical ? mobPAtk : mobMAtk;
  let dmg = mitigation(raw, atkFor, defense);
  if (Math.random() < (isRb ? 0.2 : 0.4)) dmg = Math.max(1, Math.round(dmg * 2));
  if (dmgRed > 0) dmg = Math.max(1, Math.round(dmg * (1 - dmgRed / 100)));

  const nextHp = Math.max(0, curHp - dmg);
  hj.hp = nextHp;

  const logLines: string[] = [`Ви отримуєте ${dmg} урону.`];
  const battleControl: PveMobTickBattleControl = {};
  const now = Date.now();

  if (currentPhase && isRb && !isEpic) {
    if (currentPhase.stunChance && currentPhase.stunDuration && Math.random() < currentPhase.stunChance) {
      const ms = Math.max(1000, Math.floor(Number(currentPhase.stunDuration) * 1000));
      battleControl.heroStunnedUntil = now + ms;
      logLines.push(`Рейд-бос оглушив вас на ${currentPhase.stunDuration} сек!`);
    }
    if (
      currentPhase.blockBuffsAndSkillsChance &&
      currentPhase.blockDuration &&
      Math.random() < currentPhase.blockBuffsAndSkillsChance
    ) {
      const ms = Math.max(1000, Math.floor(Number(currentPhase.blockDuration) * 1000));
      battleControl.heroBuffsBlockedUntil = now + ms;
      battleControl.heroSkillsBlockedUntil = now + ms;
      logLines.push(`Рейд-бос заблокував бафи та скіли на ${currentPhase.blockDuration} сек!`);
    }
  }

  let killedHero = false;

  if (nextHp <= 0) {
    killedHero = true;
    hj.hp = 0;
    hj.mp = 0;
    hj.cp = 0;
    hj.heroBuffs = [];
    hj.isDead = true;
    hj.deadAt = Date.now();
    hj.killedByMobName = String(sess.mobId ?? "?");
    hj.killedByMobDamage = dmg;
    logLines.push("Ви мертві.");
  }

  syncHeroJsonResourcePercentsToAbsolutes(hj);
  const heroHpAfter = Math.max(0, Math.floor(Number(hj.hp ?? 0)));

  return {
    ok: true,
    nextHeroJson: hj,
    logLines: [...toggleLogLines, ...logLines],
    heroHpAfter,
    killedHero,
    battleControl: Object.keys(battleControl).length > 0 ? battleControl : undefined,
  };
}
