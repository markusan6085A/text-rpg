import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import { syncHeroBuffsAPI } from "./characters";

/** Після зміни бафів у бою (тогл тощо) — оновити БД, інакше kill/battle-finish тягне застарілі heroBuffs. */
export function scheduleHeroBuffsSync(heroBuffs: any[]): void {
  const st = useHeroStore.getState();
  const hero = st.hero;
  const cid =
    String(useCharacterStore.getState().characterId ?? "").trim() ||
    String((hero as any)?.id ?? "").trim();
  if (!cid) return;
  const expectedRevision = Number(
    st.serverState?.heroRevision ?? (hero as any)?.heroJson?.heroRevision ?? 0
  );
  void syncHeroBuffsAPI(cid, {
    heroBuffs,
    expectedRevision: Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0,
  })
    .then((res) => {
      if (!res?.ok || !res.heroJson) return;
      st.applyServerSync(
        {
          heroJson: {
            ...((st.hero as any)?.heroJson || {}),
            heroBuffs: res.heroJson.heroBuffs,
          },
        },
        { heroRevision: res.heroJson.heroRevision, updatedAt: Date.now() }
      );
    })
    .catch(() => {});
}
