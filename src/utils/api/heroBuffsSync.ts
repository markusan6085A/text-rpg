import { useHeroStore, applyCharacterSnapshotFromApi } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import { syncHeroBuffsAPI } from "./characters";

/**
 * Запис heroBuffs у БД (CAS + санітизація на сервері). Канонічний список бафів після успіху — з відповіді API.
 * При помилці: resync героя з сервера, щоб клієнт не розходився з онлайн-станом.
 */
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
      if (!res?.ok || !res.character) return;
      const hj = (res.character as any)?.heroJson ?? {};
      const prior = Number(res.priorRevisionUsed ?? 0);
      const nextRev = Number(hj.heroRevision ?? 0);
      // Бекенд без sync: revision не зростає — не підміняти локальні бафи відповіддю зі старим heroBuffs.
      if (!Number.isFinite(nextRev) || nextRev <= prior) return;
      applyCharacterSnapshotFromApi(res.character);
      const store = useHeroStore.getState();
      const heroName = store.hero?.name;
      if (heroName) {
        void (async () => {
          try {
            const { cleanupBuffs } = await import("../../state/battle/helpers");
            const { persistBattle, loadBattle } = await import("../../state/battle/persist");
            const { battleStoreRef } = await import("../../state/battleStoreRef");
            const raw = Array.isArray(hj.heroBuffs) ? hj.heroBuffs : [];
            const cleaned = cleanupBuffs(raw as any, Date.now());
            const saved = loadBattle(heroName) || {};
            persistBattle({ ...saved, heroBuffs: cleaned }, heroName);
            battleStoreRef.setState?.({ heroBuffs: cleaned });
          } catch (e) {
            if (import.meta.env.DEV) console.warn("[scheduleHeroBuffsSync] battle align", e);
          }
        })();
      }
    })
    .catch((err) => {
      if (import.meta.env.DEV) console.warn("[scheduleHeroBuffsSync]", err);
      import("../../state/toastStore")
        .then(({ showToast }) => {
          showToast("Бафи не збереглися на сервері (оновіть сторінку або спробуйте знову).", "error");
        })
        .catch(() => {});
      void import("../../state/heroStore/heroLoadAPI")
        .then(({ loadHeroFromAPI }) => loadHeroFromAPI())
        .catch(() => {});
    });
}
