/** Same shape limits as character-crud sanitizeBattleFinishHeroBuffs (server output). */
export function sanitizeHeroBuffsForServer(raw: unknown): any[] {
  if (!Array.isArray(raw)) return [];
  const MAX = 96;
  const out: any[] = [];
  for (let i = 0; i < Math.min(raw.length, MAX); i++) {
    const b = raw[i];
    if (!b || typeof b !== "object") continue;
    const o: any = {};
    if (typeof (b as any).id === "number" && Number.isFinite((b as any).id)) o.id = (b as any).id;
    if (typeof (b as any).name === "string") o.name = String((b as any).name).slice(0, 160);
    if (typeof (b as any).icon === "string") o.icon = String((b as any).icon).slice(0, 240);
    if (typeof (b as any).stackType === "string") o.stackType = String((b as any).stackType).slice(0, 120);
    if (typeof (b as any).buffGroup === "string") o.buffGroup = String((b as any).buffGroup).slice(0, 120);
    if (typeof (b as any).source === "string") o.source = String((b as any).source).slice(0, 80);
    const exp = (b as any).expiresAt;
    if (typeof exp === "number" && Number.isFinite(exp)) o.expiresAt = exp;
    else if (exp === Number.MAX_SAFE_INTEGER) o.expiresAt = Number.MAX_SAFE_INTEGER;
    if (typeof (b as any).startedAt === "number" && Number.isFinite((b as any).startedAt)) o.startedAt = (b as any).startedAt;
    if (typeof (b as any).durationMs === "number" && Number.isFinite((b as any).durationMs)) o.durationMs = (b as any).durationMs;
    if (typeof (b as any).tickInterval === "number" && Number.isFinite((b as any).tickInterval)) o.tickInterval = (b as any).tickInterval;
    if (typeof (b as any).lastTickAt === "number" && Number.isFinite((b as any).lastTickAt)) o.lastTickAt = (b as any).lastTickAt;
    if (typeof (b as any).hpPerTick === "number" && Number.isFinite((b as any).hpPerTick)) o.hpPerTick = (b as any).hpPerTick;
    if (typeof (b as any).mpPerTick === "number" && Number.isFinite((b as any).mpPerTick)) o.mpPerTick = (b as any).mpPerTick;
    if (typeof (b as any).bleedPercentMaxHp === "number" && Number.isFinite((b as any).bleedPercentMaxHp)) {
      o.bleedPercentMaxHp = (b as any).bleedPercentMaxHp;
    }
    if (typeof (b as any).stacks === "number" && Number.isFinite((b as any).stacks)) {
      o.stacks = Math.min(99, Math.floor((b as any).stacks));
    }
    if (Array.isArray((b as any).effects)) {
      o.effects = (b as any).effects.slice(0, 64).map((e: any) => {
        if (!e || typeof e !== "object") return {};
        const m: any = {};
        if (typeof e.stat === "string") m.stat = e.stat.slice(0, 64);
        if (typeof e.mode === "string") m.mode = e.mode.slice(0, 32);
        if (typeof e.value === "number" && Number.isFinite(e.value)) m.value = e.value;
        if (typeof e.multiplier === "number" && Number.isFinite(e.multiplier)) m.multiplier = e.multiplier;
        return m;
      });
    } else {
      o.effects = [];
    }
    out.push(o);
  }
  return out;
}

export function cleanupExpiredBuffs(raw: any[] | undefined, now: number): any[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((b) => {
    const ex = b?.expiresAt;
    if (ex === Number.MAX_SAFE_INTEGER) return true;
    if (typeof ex !== "number" || !Number.isFinite(ex)) return true;
    return ex > now;
  });
}
