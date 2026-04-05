import { lookupMobRegistry } from "../utils/serverDropCalculator";
import { mobDefenseFromLevel, resolveMobMaxHp } from "./pveDamage";

export type PveBattleStartBody = {
  zoneId: string;
  mobIndex: number;
  mobId: string;
  clientMobMaxHp: number;
  mobIsRaidBoss?: boolean;
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

  const session = {
    v: 1,
    zoneId,
    mobIndex,
    mobId,
    mobHP: mobMaxHp,
    mobMaxHp,
    mobLevel: reg.level,
    mobPDef: pDef,
    mobMDef: mDef,
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
