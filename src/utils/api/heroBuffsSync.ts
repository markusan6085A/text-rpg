import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import { syncHeroBuffsAPI } from "./characters";

/** Після зміни бафів у бою (тогл тощо) — оновити БД, інакше kill/battle-finish тягне застарілі heroBuffs. */
export function scheduleHeroBuffsSync(heroBuffs: any[]): void {
  const hero = useHeroStore.getState().hero;
  const cid =
    String(useCharacterStore.getState().characterId ?? "").trim() ||
    String((hero as any)?.id ?? "").trim();
  if (!cid) return;
  const expectedRevision = Number(
    useHeroStore.getState().serverState?.heroRevision ??
      (hero as any)?.heroJson?.heroRevision ??
      0
  );
  void syncHeroBuffsAPI(cid, {
    heroBuffs,
    expectedRevision: Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0,
  })
    .then((res) => {
      if (!res?.ok || !res.heroJson) return;
      const prior = Number(res.priorRevisionUsed ?? 0);
      const nextRev = Number(res.heroJson.heroRevision ?? 0);
      // Бекенд без sync: revision не зростає — не підміняти локальні бафи відповіддю зі старим heroBuffs.
      if (!Number.isFinite(nextRev) || nextRev <= prior) return;
      useHeroStore.getState().applyServerSync(
        {
          heroJson: {
            ...(useHeroStore.getState().hero as any)?.heroJson,
            heroBuffs: res.heroJson.heroBuffs,
          },
        },
        { heroRevision: res.heroJson.heroRevision, updatedAt: Date.now() }
      );
    })
    .catch((err) => {
      if (import.meta.env.DEV) console.warn("[scheduleHeroBuffsSync]", err);
      import("../../state/toastStore")
        .then(({ showToast }) => {
          showToast("Бафи не збереглися на сервері (оновіть сторінку або спробуйте знову).", "error");
        })
        .catch(() => {});
    });
}
