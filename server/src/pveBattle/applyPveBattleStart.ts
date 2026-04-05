import { lookupMobRegistry } from "../utils/serverDropCalculator";
import { mobDefenseFromLevel, resolveMobMaxHp } from "./pveDamage";
import { isValidRaidAiProfileId } from "./raidBossAIServer";
import { resyncPveToggleClocksForSessionStart } from "./applyServerToggleTicks";

function isChampionMobName(name: string): boolean {
  if (!name) return false;
  return (
    name.startsWith("[Champion]") || name.startsWith("[Чемпион]") || name.startsWith("[Чемпіон]")
  );
}

/** Кламп клієнтської атаки: не нижче 25% і не вище 200% дефолту (lv×20 / lv×15), інакше чит або роз’їзд з локальним боєм. */
function resolveSessionMobAtk(clientRaw: unknown, defaultAtk: number): number {
  const d = Math.max(1, Math.floor(Number(defaultAtk) || 1));
  const c = Math.floor(Number(clientRaw));
  if (!Number.isFinite(c) || c <= 0) return d;
  const lo = Math.max(1, Math.floor(d * 0.25));
  const hi = Math.max(lo + 1, Math.ceil(d * 2));
  return Math.max(lo, Math.min(hi, c));
}

export type PveBattleStartBody = {
  zoneId: string;
  mobIndex: number;
  mobId: string;
  clientMobMaxHp: number;
  /** Від клієнта як у processMobAttack; кламп до [0.25×..2×] від lv×20 / lv×15. */
  clientMobPAtk?: number;
  clientMobMAtk?: number;
  /** Ім’я моба в зоні (префікс [Чемпіон] тощо) — реєстр може не містити префікса для id. */
  clientMobName?: string;
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
  const defaultMobPAtk = lv * 20;
  const defaultMobMAtk = lv * 15;
  const mobPAtk = resolveSessionMobAtk(args.body.clientMobPAtk, defaultMobPAtk);
  const mobMAtk = resolveSessionMobAtk(args.body.clientMobMAtk, defaultMobMAtk);
  const nameForChamp = String(args.body.clientMobName ?? reg.name ?? "").trim();
  const mobIsChampion = !isRaidBoss && isChampionMobName(nameForChamp);
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
    mobPAtk,
    mobMAtk,
    mobIsChampion,
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
    startedAt: 0,
  };

  const sessionNow = Date.now();
  session.startedAt = sessionNow;
  resyncPveToggleClocksForSessionStart(hj, sessionNow);
  hj.battleSession = session;
  return { ok: true, nextHeroJson: hj, sessionMobHp: mobMaxHp, sessionMobMaxHp: mobMaxHp };
}
