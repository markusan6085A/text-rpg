import { battleStoreRef } from "../battleStoreRef";

let mobHpReconcileRafId: number | null = null;

export function cancelMobHpReconcile() {
  if (mobHpReconcileRafId != null) {
    cancelAnimationFrame(mobHpReconcileRafId);
    mobHpReconcileRafId = null;
  }
}

/**
 * Плавне підтягування HP моба до серверного значення після optimistic UI.
 */
export function smoothMobHpTo(target: number, durationMs = 220) {
  cancelMobHpReconcile();
  const tRounded = Math.max(0, Math.floor(Number(target) || 0));
  const st = battleStoreRef.getState();
  const start = typeof st?.mobHP === "number" ? st.mobHP : tRounded;
  const t0 = performance.now();
  if (!Number.isFinite(tRounded) || Math.abs(start - tRounded) < 0.5) {
    if (battleStoreRef.setState) battleStoreRef.setState({ mobHP: tRounded });
    return;
  }
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / durationMs);
    const ease = t * t * (3 - 2 * t);
    const v = Math.round(start + (tRounded - start) * ease);
    if (battleStoreRef.setState) battleStoreRef.setState({ mobHP: v });
    if (t < 1) mobHpReconcileRafId = requestAnimationFrame(step);
    else {
      if (battleStoreRef.setState) battleStoreRef.setState({ mobHP: tRounded });
      mobHpReconcileRafId = null;
    }
  };
  mobHpReconcileRafId = requestAnimationFrame(step);
}
