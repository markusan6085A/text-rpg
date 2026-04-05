import { lookupMobRegistry } from "../utils/serverDropCalculator";
import { mobDefenseFromLevel, resolveMobMaxHp } from "./pveDamage";
import { isValidRaidAiProfileId } from "./raidBossAIServer";

export type PveBattleStartBody = {
  zoneId: string;
  mobIndex: number;
  mobId: string;
  clientMobMaxHp: number;
  mobIsRaidBoss?: boolean;
  /** ID з raidBossAI (тільки для рейд-босів; валідується по whitelist). */
  raidAiProfileId?: string;
  /** Епічні РБ (Queen Ant тощо) — без ×2.25 та з окремим балансом як у клієнта. */
  mobIsEpicRaidBoss?: boolean;
};

export type PveBattleStartResult =
  | { ok: true; nextHeroJson: any; sessionMobHp: number; sessionMobMaxHp: number }
  | { ok: false; code: string; message?: string };

export function applyPveBattleStartSnapshot(args: { heroJson: any; body: PveBattleStartBody }): PveBattleStartResult {
  const hjIn = args.heroJson && typeof args.heroJson === "object" ? args.heroJson : {};
  const hj = { ...hjIn };
  const zoneId = String(args.body.zoneId ?? "").trim();
  const mobId = String(args.body.mobId ?? "").trim();
  const mobIndex = Math.floor(Number(args.body.mobIndex));
  if (!zoneId || !mobId || !Number.isFinite(mobIndex) || mobIndex < 0) {
    return { ok: false, code: "invalid_input", message: "zoneId, mobId, mobIndex required" };
  }

  const reg = lookupMobRegistry(mobId, zoneId);
  if (!reg) {
    return { ok: false, code: "unknown_mob", message: "Mob not found for zone" };
  }

  const isRaidBoss = reg.isRaidBoss === true || args.body.mobIsRaidBoss === true;
  const mobMaxHp = resolveMobMaxHp({
    registryLevel: reg.level,
    isRaidBoss: isRaidBoss,
    clientMobMaxHp: Math.floor(Number(args.body.clientMobMaxHp) || 0),
  });
  const { pDef, mDef } = mobDefenseFromLevel(reg.level);

  const rawRaidAi = typeof args.body.raidAiProfileId === "string" ? args.body.raidAiProfileId.trim() : "";
  let raidAiProfileId: string | undefined;
  if (rawRaidAi) {
    if (!isRaidBoss) {
      return { ok: false, code: "invalid_input", message: "raidAiProfileId only for raid bosses" };
    }
    if (!isValidRaidAiProfileId(rawRaidAi)) {
      return { ok: false, code: "invalid_input", message: "Unknown raid AI profile" };
    }
    raidAiProfileId = rawRaidAi === "rb_floran_ai" ? "rb_floran_overlord_ai" : rawRaidAi;
  }

  const mobIsEpicRaidBoss = args.body.mobIsEpicRaidBoss === true;
  const lv = Math.max(1, Math.floor(reg.level));
  const mobEvasionBase = Math.min(
    90,
    Math.max(3, Math.round(lv * 1.35 + (isRaidBoss ? 12 : 0) + (mobIsEpicRaidBoss ? 6 : 0)))
  );

  const session = {
    v: 1,
    zoneId,
    mobIndex,
    mobId,
    mobHP: mobMaxHp,
    mobMaxHp,
    mobLevel: reg.level,
    mobIsRaidBoss: isRaidBoss,
    mobIsEpicRaidBoss,
    raidAiProfileId,
    mobPDef: pDef,
    mobMDef: mDef,
    mobPDefBase: pDef,
    mobMDefBase: mDef,
    mobEvasionBase,
    mobEvasion: mobEvasionBase,
    mobBuffs: [] as any[],
    fireResist: 0,
    waterResist: 0,
    windResist: 0,
    earthResist: 0,
    holyResist: 0,
    darkResist: 0,
    startedAt: Date.now(),
  };

  hj.battleSession = session;
  return { ok: true, nextHeroJson: hj, sessionMobHp: mobMaxHp, sessionMobMaxHp: mobMaxHp };
}
