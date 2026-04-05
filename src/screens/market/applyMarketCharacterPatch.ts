import type { Character } from "../../utils/api";
import { useHeroStore } from "../../state/heroStore";

/** Одразу застосовуємо повний server snapshot після мутацій ринку. */
export function applyMarketCharacterPatch(c: Character) {
  const store = useHeroStore.getState();
  const hero = store.hero;
  if (!hero) return;
  const hj = (c.heroJson as Record<string, unknown>) || {};
  const inv = Array.isArray((hj as any).inventory) ? (hj as any).inventory : hero.inventory ?? [];
  const overflow = Array.isArray((hj as any).overflowChest) ? (hj as any).overflowChest : hero.overflowChest ?? [];
  const activeDyes = Array.isArray((hj as any).activeDyes) ? (hj as any).activeDyes : hero.activeDyes ?? [];
  const adena = Number((c as any).adena ?? hero.adena ?? 0);
  const coinLuck = Number((c as any).coinLuck ?? hero.coinOfLuck ?? 0);
  const level = Number((c as any).level ?? hero.level ?? 1);
  const exp = Number((c as any).exp ?? hero.exp ?? 0);
  const sp = Number((c as any).sp ?? hero.sp ?? 0);
  const revRaw = (hj as any).heroRevision;
  const heroRevision = revRaw != null && Number.isFinite(Number(revRaw)) ? Number(revRaw) : 0;

  store.applyServerSync(
    {
      level,
      exp,
      sp,
      adena,
      coinOfLuck: coinLuck,
      inventory: inv as any,
      overflowChest: overflow as any,
      activeDyes: activeDyes as any,
      heroJson: hj as any,
    } as any,
    {
      level,
      exp,
      sp,
      adena,
      coinLuck,
      heroRevision,
      updatedAt: Date.now(),
    }
  );
}
