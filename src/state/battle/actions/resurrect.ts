import { useHeroStore } from "../../heroStore";
import { useCharacterStore } from "../../characterStore";
import { cleanupBuffs, computeBuffedMaxResources, persistSnapshot } from "../helpers";
import { getMaxResources } from "../helpers/getMaxResources";
import { getResurrectHeroJsonPatch } from "../../heroStore/heroResources";
import { persistBattle } from "../persist";
import type { BattleState } from "../types";
import { recalculateAllStats } from "../../../utils/stats/recalculateAllStats";
import { resurrectCharacter } from "../../../utils/api";

type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

export const createResurrect =
  (set: Setter, get: () => BattleState): BattleState["resurrect"] =>
  () => {
    const state = get();
    const hero = useHeroStore.getState().hero;
    if (!hero) return;
    const now = Date.now();
    const cleanedBuffs = cleanupBuffs(state.heroBuffs || [], now);
    const resurrection = state.resurrection;
    if (!resurrection) return;

    const baseMax = getMaxResources(hero);
    const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, cleanedBuffs);

    const ratio = Math.max(0, Math.min(1, resurrection.ratio || 0.7));
    const resurrectPatch = getResurrectHeroJsonPatch(ratio, maxHp, maxMp, maxCp, hero.cp);

    const updatedBuffs =
      resurrection.sourceBuffId !== undefined
        ? cleanedBuffs.filter((b) => b.id !== resurrection.sourceBuffId)
        : cleanedBuffs;

    const updateHero = useHeroStore.getState().updateHero;
    const existingJson = (hero as any).heroJson || {};
    const heroWithResurrectedHp = { ...hero, hp: resurrectPatch.hp, maxHp: maxHp };
    const recalculated = recalculateAllStats(heroWithResurrectedHp, updatedBuffs);

    updateHero(
      {
        hp: resurrectPatch.hp,
        mp: resurrectPatch.mp,
        cp: resurrectPatch.cp,
        battleStats: recalculated.baseFinalStats,
        heroJson: { ...existingJson, ...resurrectPatch } as any,
      },
      { persist: true }
    );

    const updates: Partial<BattleState> = {
      status: "fighting",
      resurrection: null,
      heroBuffs: updatedBuffs,
      mobNextAttackAt: now + 1000 + Math.random() * 4000,
      log: ["Resurrection triggers (Salvation).", ...(state.log || [])].slice(0, 30),
      cooldowns: state.cooldowns || {},
    };

    set((prev) => ({ ...(prev as any), ...(updates as any) }));
    persistSnapshot(get, persistBattle, updates);
    persistBattle({ ...get(), heroBuffs: [] }, hero.name);

    const characterId = useCharacterStore.getState().characterId;
    if (characterId) {
      resurrectCharacter(characterId)
        .then((char) => {
          if (!char?.heroJson) return;
          const hj = char.heroJson as any;
          const heroStore = useHeroStore.getState();
          const currentHero = heroStore.hero;
          if (currentHero) {
            heroStore.updateHero(
              {
                hp: Number(hj.hp) || currentHero.maxHp,
                mp: Number(hj.mp) || currentHero.maxMp,
                cp: Number(hj.cp) || currentHero.maxCp,
                heroJson: { ...(currentHero as any).heroJson, ...hj, isDead: false, deadAt: 0, heroBuffs: hj.heroBuffs ?? [] },
              },
              { persist: false }
            );
          }
        })
        .catch((e) => console.warn("[resurrect] API failed", e));
    }
  };
