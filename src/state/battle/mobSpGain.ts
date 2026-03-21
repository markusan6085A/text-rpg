import type { Mob } from "../../data/world/types";

/** SP з моба: якщо в даних немає або 0 — оцінка від EXP (як у l2dop champion helper). */
export function mobSpGainFromMob(mob: Pick<Mob, "sp" | "exp" | "level">): number {
  if (typeof mob.sp === "number" && mob.sp > 0) return mob.sp;
  const exp = Number(mob.exp ?? 0);
  return Math.max(1, Math.round(exp / 15));
}
