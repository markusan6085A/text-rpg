import { useHeroStore, setResurrectInProgress } from "../../heroStore";
import { useCharacterStore } from "../../characterStore";
import { applyBuffsToStats, cleanupBuffs, computeBuffedMaxResources, persistSnapshot } from "../helpers";
import { getMaxResources } from "../helpers/getMaxResources";
import { persistBattle } from "../persist";
import type { BattleState } from "../types";
import { recalculateAllStats } from "../../../utils/stats/recalculateAllStats";
import { resurrectCharacter } from "../../../utils/api";
import { saveHeroToLocalStorage, saveHeroToLocalStorageOnly } from "../../heroStore/heroPersistence";

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

    // 🔥 Блокуємо autosave до завершення resurrectCharacter() — save лише після успішної відповіді API
    setResurrectInProgress(true);

    const baseMax = getMaxResources(hero);
    const { maxHp, maxMp, maxCp } = computeBuffedMaxResources(baseMax, cleanedBuffs);

    const ratio = Math.max(0, Math.min(1, resurrection.ratio || 0.7));
    const nextHP = Math.max(1, Math.round(maxHp * ratio));
    const nextMP = Math.max(1, Math.round(maxMp * ratio));
    const nextCP = Math.min(maxCp, hero.cp ?? maxCp);

    const updatedBuffs =
      resurrection.sourceBuffId !== undefined
        ? cleanedBuffs.filter((b) => b.id !== resurrection.sourceBuffId)
        : cleanedBuffs;

    const updateHero = useHeroStore.getState().updateHero;
    const existingJson = (hero as any).heroJson || {};

    const heroWithResurrectedHp = { ...hero, hp: nextHP, maxHp: maxHp };
    const recalculated = recalculateAllStats(heroWithResurrectedHp, updatedBuffs);

    updateHero(
      {
        hp: nextHP,
        mp: nextMP,
        cp: nextCP,
        battleStats: recalculated.baseFinalStats,
        heroJson: { ...existingJson, isDead: false, deadAt: 0, heroBuffs: [] } as any,
      },
      { persist: true }
    );
    // 🔥 Одразу пишемо "живий" стан у localStorage, щоб F5 до завершення PUT не підняв мертвого (isDead більше не липне)
    const heroAfterUpdate = useHeroStore.getState().hero;
    if (heroAfterUpdate) saveHeroToLocalStorageOnly(heroAfterUpdate);

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
        .then((raw) => {
          // API повертає { ok, character }; resurrectCharacter() віддає response.character — підстраховуємо обидві форми
          const char = (raw as any)?.character ?? raw;
          const hj = char?.heroJson;
          setResurrectInProgress(false);
          if (!hj) return;
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
            // Save лише після успішної відповіді API — уникаємо race, коли старий стан перетирає новий
            const heroAfterSync = useHeroStore.getState().hero;
            if (heroAfterSync) saveHeroToLocalStorage(heroAfterSync).catch(() => {});
          }
        })
        .catch((e) => {
          setResurrectInProgress(false);
          console.warn("[resurrect] API failed", e);
        });
    } else {
      setResurrectInProgress(false);
    }
  };
