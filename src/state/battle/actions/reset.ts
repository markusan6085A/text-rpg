import { clearBattlePersist, persistBattle, loadBattle } from "../persist";
import type { BattleState } from "../types";
import { BASE_ATTACK } from "../loadout";
import { useHeroStore } from "../../heroStore";

type Setter = (
  partial: Partial<BattleState> | ((state: BattleState) => Partial<BattleState>),
  replace?: boolean
) => void;

export const createReset =
  (set: Setter, get: () => BattleState): BattleState["reset"] =>
  () => {
    const prev = get();
    const hero = useHeroStore.getState().hero;
    const heroName = hero?.name;
    
    // ❗ ВАЖЛИВО: Зберігаємо cooldowns та heroBuffs ПЕРЕД очищенням localStorage
    const cooldownsToSave = prev.cooldowns ?? {};
    const heroBuffsToSave = prev.heroBuffs ?? [];
    const loadoutSlotsToSave = prev.loadoutSlots ?? [BASE_ATTACK.id, null];
    
    // ❗ Зберігаємо живий сумон, якщо він існує і живий
    const aliveSummon = prev.summon && prev.summon.hp > 0 ? prev.summon : null;
    const summonBuffsToSave = aliveSummon ? (prev.summonBuffs ?? []) : [];
    const baseSummonStatsToSave = aliveSummon ? prev.baseSummonStats : undefined;
    
    // Ресурси тепер тільки в heroStore, тому нічого не оновлюємо тут
    
    set({
      heroName: heroName, // Зберігаємо для перевірки при завантаженні (не джерело істини)
      zoneId: undefined,
      mob: undefined,
      mobIndex: undefined,
      mobHP: 0,
      mobStunnedUntil: undefined, // Скидаємо stun при reset
      heroStunnedUntil: undefined, // Скидаємо stun гравця при reset
      heroBuffsBlockedUntil: undefined, // Скидаємо блокування бафів при reset
      heroSkillsBlockedUntil: undefined, // Скидаємо блокування скілів при reset
      heroNextAttackAt: undefined,
      status: "idle",
      log: prev.log?.slice(0, 30) ?? [],
      cooldowns: cooldownsToSave, // Зберігаємо cooldowns
      loadoutSlots: loadoutSlotsToSave,
      lastReward: prev.lastReward,
      heroBuffs: heroBuffsToSave, // Зберігаємо heroBuffs (включаючи бафи статуї)
      mobBuffs: [], // Скидаємо debuff мобів при reset
      summonBuffs: summonBuffsToSave, // Зберігаємо бафи сумону, якщо він живий
      baseSummonStats: baseSummonStatsToSave, // Зберігаємо базові стати сумону, якщо він живий
      summon: aliveSummon, // Зберігаємо живий сумон
      resurrection: null,
      summonLastAttackAt: aliveSummon ? prev.summonLastAttackAt : undefined,
    });
    
    // Очищаємо localStorage від battle-specific даних (mob, zone, тощо)
    clearBattlePersist(heroName);
    
    // ❗ ВАЖЛИВО: Відразу зберігаємо cooldowns, heroBuffs та живий сумон в localStorage після reset
    // Це гарантує, що вони зберігаються навіть після оновлення сторінки
    persistBattle({
      heroName: heroName,
      status: "idle",
      cooldowns: cooldownsToSave,
      heroBuffs: heroBuffsToSave,
      loadoutSlots: loadoutSlotsToSave,
      log: prev.log?.slice(0, 30) ?? [],
      summon: aliveSummon,
      summonBuffs: summonBuffsToSave,
      baseSummonStats: baseSummonStatsToSave,
      summonLastAttackAt: aliveSummon ? prev.summonLastAttackAt : undefined,
    }, heroName);
  };
