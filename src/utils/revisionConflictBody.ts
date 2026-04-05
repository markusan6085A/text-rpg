/** У відповіді 409 поля currentRevision / serverState.heroRevision інколи розходяться — беремо max. */
export function maxRevisionFromConflictBody(body: unknown): number | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, any>;
  const candidates = [b.currentRevision, b.serverState?.heroRevision, b.heroRevision]
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n >= 0);
  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}
