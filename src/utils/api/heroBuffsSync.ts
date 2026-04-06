import { useHeroStore, applyCharacterSnapshotFromApi } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import { syncHeroBuffsAPI } from "./characters";

/**
 * Запис heroBuffs у БД (CAS + санітизація на сервері). Канонічний список бафів після успіху — з відповіді API.
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
      // Після успішного POST/PUT sync — snapshot з сервера завжди застосовуємо (ревізія timestamp; порівняння next<=prior відсіювало валідні відповіді).
      applyCharacterSnapshotFromApi(res.character);
      const hj = (res.character as any)?.heroJson ?? {};
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
    });
}
