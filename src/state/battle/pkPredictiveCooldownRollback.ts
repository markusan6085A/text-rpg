import { useBattleStore } from "./store";

/**
 * Після actPkSession клієнт ставить предиктивний CD; якщо сервер відхилив дію (промах, MP, КД) —
 * знімаємо CD, як у PvE (де кулдаун ставиться лише після успішного застосування).
 */
export function rollbackPkPredictiveCooldownIfActionFailed(
  logTop: string | undefined,
  params: { heroName: string; skillIdUsed: number | undefined }
): void {
  const line = String(logTop || "");
  const name = String(params.heroName || "").trim();
  if (!line || !name || !line.includes(name)) return;

  const miss =
    line.includes("промахивается") || line.includes("промахнувся") || line.includes("промах");
  const mpFail = line.includes("не хватает MP");
  const genericFail = line.includes("не удалось использовать");
  const onCd = line.includes("на перезарядке");

  const sid = params.skillIdUsed;
  if (miss) {
    useBattleStore.setState((s) => {
      const next = { ...(s.cooldowns || {}) };
      if (sid === undefined) delete next[0];
      else {
        delete next[sid];
        delete next[`${sid}_usedAt`];
        delete next[`${sid}_originalCd`];
      }
      return { cooldowns: next };
    });
    return;
  }
  if (sid !== undefined && (mpFail || genericFail || onCd)) {
    useBattleStore.setState((s) => {
      const next = { ...(s.cooldowns || {}) };
      delete next[sid];
      delete next[`${sid}_usedAt`];
      delete next[`${sid}_originalCd`];
      return { cooldowns: next };
    });
  }
}

export function rollbackPkPredictiveCooldownOnNetworkError(skillIdUsed: number | undefined): void {
  useBattleStore.setState((s) => {
    const next = { ...(s.cooldowns || {}) };
    if (skillIdUsed === undefined) {
      delete next[0];
    } else {
      delete next[skillIdUsed];
      delete next[`${skillIdUsed}_usedAt`];
      delete next[`${skillIdUsed}_originalCd`];
    }
    return { cooldowns: next };
  });
}
