import type { Character } from "../../utils/api";
import type { HeroInventoryItem } from "../../types/Hero";
import { useHeroStore } from "../../state/heroStore";

/** Одразу підтягуємо інвентар/валюту з відповіді ринку в store + localStorage, щоб union-merge у loadHeroFromAPI не «повернув» виставлений предмет. */
export function applyMarketCharacterPatch(c: Character) {
  const store = useHeroStore.getState();
  const hero = store.hero;
  if (!hero) return;
  const hj = (c.heroJson as Record<string, unknown>) || {};
  const inv = Array.isArray(hj.inventory) ? hj.inventory : hero.inventory;
  const overflow = Array.isArray((hj as any).overflowChest) ? (hj as any).overflowChest : hero.overflowChest;
  const adena = Number(c.adena ?? 0);
  const col = Number(c.coinLuck ?? 0);
  const revRaw = (hj as any).heroRevision;
  const heroRevision =
    revRaw != null && Number.isFinite(Number(revRaw)) ? Number(revRaw) : undefined;

  // КРИТИЧНО: updateHero(..., persist) синхронно викликає immediateSave → PUT з expectedRevision з serverState.
  // Якщо спочатку оновити героя без serverState.heroRevision — 409 revision_conflict.
  store.updateServerState({
    coinLuck: col,
    updatedAt: Date.now(),
    ...(heroRevision != null ? { heroRevision } : {}),
  });

  store.updateHero(
    {
      adena,
      coinOfLuck: col,
      inventory: inv as HeroInventoryItem[],
      overflowChest: overflow as HeroInventoryItem[] | undefined,
      ...(heroRevision != null ? { heroRevision } : {}),
      heroJson: {
        ...(hero as any).heroJson,
        ...hj,
        inventory: inv,
        overflowChest: overflow,
        adena,
        coinOfLuck: col,
        ...(heroRevision != null ? { heroRevision } : {}),
      },
    } as any,
    { persist: true }
  );
}
