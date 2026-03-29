import type { FastifyRequest } from "fastify";
import { prisma } from "./db";

export function getClientIp(req?: FastifyRequest): string | undefined {
  if (!req) return undefined;
  const x = req.headers["x-forwarded-for"];
  if (typeof x === "string") return x.split(",")[0]?.trim().slice(0, 64);
  const ip = (req as { ip?: string }).ip;
  return typeof ip === "string" ? ip.slice(0, 64) : undefined;
}

function numField(o: Record<string, unknown> | null | undefined, k: string): number {
  const v = o?.[k];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function hasNumericHeroJsonField(hj: Record<string, unknown> | null | undefined, k: string): boolean {
  if (!hj || hj[k] == null || hj[k] === "") return false;
  return Number.isFinite(Number(hj[k]));
}

function invLen(hj: Record<string, unknown> | null | undefined): number {
  const inv = hj?.inventory;
  return Array.isArray(inv) ? inv.length : 0;
}

type RowSnap = {
  level: number;
  exp: bigint;
  adena: bigint;
  sp: number;
  coinLuck?: bigint;
  coinsSilver?: bigint;
};

/**
 * Метадані для character.sync — лише якщо є «цікаві» дельти (прогрес/лут/інвентар).
 */
export function buildCharacterSyncMetadata(
  oldHj: Record<string, unknown>,
  newHj: Record<string, unknown>,
  oldRow: RowSnap,
  newRow: RowSnap
): Record<string, unknown> | null {
  const mkOld = numField(oldHj, "mobsKilled");
  const mkNew = numField(newHj, "mobsKilled");
  // EXP/SP у PUT часто в heroJson; колонки Character.exp/sp можуть відставати
  const useHjExp =
    hasNumericHeroJsonField(oldHj, "exp") || hasNumericHeroJsonField(newHj, "exp");
  const expDelta = useHjExp
    ? numField(newHj, "exp") - numField(oldHj, "exp")
    : Number(newRow.exp) - Number(oldRow.exp);
  const useHjSp =
    hasNumericHeroJsonField(oldHj, "sp") || hasNumericHeroJsonField(newHj, "sp");
  const spDelta = useHjSp ? numField(newHj, "sp") - numField(oldHj, "sp") : newRow.sp - oldRow.sp;
  const expSnapshot = useHjExp ? numField(newHj, "exp") : Number(newRow.exp);
  const spSnapshot = useHjSp ? numField(newHj, "sp") : newRow.sp;
  const meta: Record<string, unknown> = {
    mobsKilledDelta: mkNew - mkOld,
    mobsKilledTotal: mkNew,
    adenaDelta: Number(newRow.adena) - Number(oldRow.adena),
    expDelta,
    expSnapshot,
    levelDelta: newRow.level - oldRow.level,
    spDelta,
    spSnapshot,
    levelSnapshot: newRow.level,
    invDelta: invLen(newHj) - invLen(oldHj),
    coinLuckDelta: Number(newRow.coinLuck ?? 0n) - Number(oldRow.coinLuck ?? 0n),
    coinsSilverDelta: Number(newRow.coinsSilver ?? 0n) - Number(oldRow.coinsSilver ?? 0n),
  };
  const zoneId = newHj.battleZoneId ?? newHj.zoneId ?? newHj.currentZoneId;
  if (zoneId != null && zoneId !== "") meta.zoneId = String(zoneId);

  const interesting =
    (meta.mobsKilledDelta as number) !== 0 ||
    (meta.adenaDelta as number) !== 0 ||
    (meta.expDelta as number) !== 0 ||
    (meta.levelDelta as number) !== 0 ||
    (meta.spDelta as number) !== 0 ||
    (meta.invDelta as number) !== 0 ||
    (meta.coinLuckDelta as number) !== 0 ||
    (meta.coinsSilverDelta as number) !== 0;

  return interesting ? meta : null;
}

export function enqueuePlayerActivityLog(entry: {
  accountId: string;
  characterId: string;
  characterName: string;
  action: string;
  metadata?: Record<string, unknown>;
  clientIp?: string;
}): void {
  const accountId = String(entry.accountId || "").trim();
  const characterId = String(entry.characterId || "").trim();
  if (!accountId || !characterId) return;

  void prisma.playerActivityLog
    .create({
      data: {
        accountId,
        characterId,
        characterName: String(entry.characterName || "").trim().slice(0, 120) || "?",
        action: String(entry.action || "unknown").trim().slice(0, 120),
        metadata: (entry.metadata || {}) as object,
        clientIp: entry.clientIp?.trim().slice(0, 64) || null,
      },
    })
    .catch((e) => console.error("[PlayerActivityLog] write failed", e));
}
