import React from "react";
import { useBattleStore } from "../../state/battle/store";
import { isChargeBarItem } from "../../state/battle/actions/useSkill/shotHelpers";
import { useHeroStore } from "../../state/heroStore";
import { MAX_SLOTS, getSkillDefForBattle, skillDefIsToggle } from "../../state/battle/loadout";
import { itemsDBWithStarter } from "../../data/items/itemsDB";
import { useCityUiVariant } from "../../utils/cityUiVariant";
import { calcAutoAttackInterval } from "../../utils/combatSpeed";
import { applyBuffsToStats } from "../../state/battle/helpers";

type LearnedSkill = {
  id: number;
  name: string;
  icon: string;
  mpCost: number;
  cooldown: number;
};

function itemDefByInventoryId(itemId: string | undefined) {
  if (!itemId) return undefined;
  const stripped = itemId.replace(/^shop_/, "");
  return itemsDBWithStarter[itemId] ?? itemsDBWithStarter[stripped];
}

function useLearnedActive(): LearnedSkill[] {
  const hero = useHeroStore((s) => s.hero);
  if (!hero) return [];
  const learned = Array.isArray(hero.skills) ? hero.skills : [];

  const actives =
    learned
      .map((ls: any) => {
        const def = getSkillDefForBattle(hero.profession ?? null, hero.klass, hero.race, Number(ls.id));
        if (!def) return null;
        if (def.category === "passive") return null;
        const levels = Array.isArray(def.levels) ? def.levels : [];
        const lvl = levels.find((l) => l.level === ls.level) ?? levels[0];
        if (!lvl) return null;
        return {
          id: def.id,
          name: def.name,
          icon: def.icon || "/skills/attack.jpg",
          mpCost: lvl.mpCost ?? 0,
          cooldown: def.cooldown ?? (def.category === "toggle" ? 0 : 5),
        };
      })
      .filter(Boolean) as LearnedSkill[];

  const baseAttack: LearnedSkill = {
    id: 0,
    name: "Attack",
    icon: "/skills/attack.jpg",
    mpCost: 0,
    cooldown: 0,
  };

  const hasBase = actives.some((s) => s.id === 0);
  return hasBase ? actives : [baseAttack, ...actives];
}

function skillReadyAt(
  id: number | string | null,
  slotInfo: { type?: string } | null,
  cooldowns: Record<number, number>,
  heroNextAttackAt?: number
): number {
  if (id === null || typeof id !== "number") return 0;
  if (id === 0 && slotInfo?.type === "skill") return heroNextAttackAt ?? 0;
  return cooldowns[id] ?? 0;
}

function SkillCooldownLayer({
  readyAt,
  now,
  isBaseAttack,
  attackIntervalMs,
  uiModern,
  uiBattleTest,
}: {
  readyAt: number;
  now: number;
  isBaseAttack: boolean;
  attackIntervalMs: number;
  uiModern: boolean;
  uiBattleTest: boolean;
}) {
  const remaining = Math.max(0, Number(readyAt) - now);
  const safeRem = Number.isFinite(remaining) ? remaining : 0;
  if (safeRem <= 0) return null;

  const safeInterval = Number.isFinite(attackIntervalMs) && attackIntervalMs > 0 ? attackIntervalMs : 2500;
  if (isBaseAttack && safeInterval > 0) {
    const sweep = Math.min(1, safeRem / safeInterval);
    const deg = Number.isFinite(sweep) ? 360 * sweep : 0;
    const label =
      safeInterval < 1800 ? (safeRem / 1000).toFixed(1) : String(Math.max(1, Math.ceil(safeRem / 1000)));
    return (
      <div className="absolute inset-0 z-10 rounded-md overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, rgba(8,6,4,0.88) ${deg}deg, transparent ${deg}deg)`,
          }}
        />
        <div
          className={`absolute inset-0 flex items-center justify-center font-bold rounded-md ${
            uiBattleTest
              ? "text-cyan-100 text-[11px] tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
              : uiModern
                ? "text-[#f0e0c0] text-[11px] tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
                : "text-white text-xs"
          }`}
        >
          {label}
        </div>
      </div>
    );
  }

  const cdLeft = Math.max(0, Math.ceil(safeRem / 1000));
  return (
    <div
      className="absolute inset-0 z-10 bg-black/75 text-white text-xs flex items-center justify-center font-bold rounded-md"
      style={{ minHeight: "100%" }}
    >
      {cdLeft}
    </div>
  );
}

interface SkillBarProps {
  /** У режимі PK: викликати цей callback замість useSkill (той самий вигляд, інша логіка — API) */
  onUseSkillOverride?: (skillId: number) => void;
  onAttackOverride?: () => void;
}

export function SkillBar({ onUseSkillOverride, onAttackOverride }: SkillBarProps = {}) {
  const cityUi = useCityUiVariant();
  const uiModern = cityUi !== "classic";
  const uiBattleTest = cityUi === "l2test";
  const { useSkill, status, cooldowns, loadoutSlots, setLoadoutSkill, activeChargeSlots, toggleChargeSlot } = useBattleStore();
  const heroNextAttackAt = useBattleStore((s) => s.heroNextAttackAt);
  const zoneId = useBattleStore((s) => s.zoneId);
  const heroBuffs = useBattleStore((s) => s.heroBuffs ?? []);
  const hero = useHeroStore((s) => s.hero);
  const equipItem = useHeroStore((s) => s.equipItem);
  const heroMP = hero?.mp ?? 0;
  const MAX_VISIBLE_SLOTS = 40;
  const [now, setNow] = React.useState(Date.now());
  const [pickerSlot, setPickerSlot] = React.useState<number | null>(null);
  const [category, setCategory] = React.useState<"magic" | "consumable" | "item" | "remove">("magic");

  const learnedActive = useLearnedActive();
  const slotsToShow = (loadoutSlots || []).slice(0, MAX_VISIBLE_SLOTS);

  const attackIntervalMs = React.useMemo(() => {
    if (zoneId === "fishing") return 400;
    const buffed = applyBuffsToStats(hero?.battleStats || {}, heroBuffs);
    const raw = Number(buffed?.attackSpeed ?? buffed?.atkSpeed ?? 0);
    const atk = Number.isFinite(raw) ? raw : 0;
    const ms = calcAutoAttackInterval(atk);
    return Number.isFinite(ms) && ms > 0 ? ms : 2500;
  }, [zoneId, hero?.battleStats, heroBuffs]);

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const computeNextSlots = React.useCallback(
    (slots: (number | string | null)[], slotIndex: number, skillId: number | string | null) => {
      let next = [...slots];
      if (skillId === null) {
        if (slotIndex < next.length) next[slotIndex] = null;
      } else {
        if (slotIndex >= next.length) {
          while (next.length <= slotIndex && next.length < MAX_VISIBLE_SLOTS) next.push(null);
        }
        next[slotIndex] = skillId;
      }

      const filled = next.filter((v) => v !== null) as (number | string)[];
      let compacted = filled.slice(0, MAX_VISIBLE_SLOTS);
      if (compacted.length < MAX_VISIBLE_SLOTS) compacted.push(null);
      return compacted;
    },
    [MAX_VISIBLE_SLOTS]
  );

  const findNextEmpty = (slots: (number | string | null)[]) => {
    const idx = slots.findIndex((v) => v === null);
    return idx === -1 ? Math.min(slots.length, MAX_VISIBLE_SLOTS - 1) : idx;
  };

  // Отримуємо расходники з інвентаря
  const consumables = React.useMemo(() => {
    if (!hero?.inventory) return [];
    return hero.inventory
      .filter((item: any) => {
        if (!item?.id || (item.count ?? 0) <= 0) return false;
        const def = itemDefByInventoryId(item.id);
        const slot = def?.slot || item.slot;
        return slot === "consumable";
      })
      .map((item: any) => ({
        id: `consumable:${item.id}`,
        name: item.name,
        icon: item.icon || "/items/default_item.png",
        itemId: item.id,
        count: item.count ?? 1,
      }));
  }, [hero?.inventory]);

  // Зброя та щити з інвентаря (itemsDBWithStarter щоб стартовий набір теж показував іконку/назву)
  const equippableItems = React.useMemo(() => {
    if (!hero?.inventory) return [];
    return hero.inventory
      .filter((item: any) => {
        if (!item?.id) return false;
        const def = itemsDBWithStarter[item.id];
        const slot = def?.slot || item.slot;
        return slot === "weapon" || slot === "shield";
      })
      .map((item: any) => {
        const def = itemsDBWithStarter[item.id];
        return {
          id: `item:${item.id}`,
          name: def?.name ?? item.name,
          icon: def?.icon ?? item.icon ?? "/items/default_item.png",
          itemId: item.id,
          item,
        };
      });
  }, [hero?.inventory]);

  const currentList =
    category === "magic"
      ? learnedActive
      : category === "consumable"
      ? consumables
      : category === "item"
      ? equippableItems
      : category === "remove"
      ? (loadoutSlots || []).map((id, idx) => ({ id, idx })).filter((s) => s.id !== null)
      : [];

  const openRemovePicker = () => {
    setCategory("remove");
    setPickerSlot(0);
  };

  // Helper для отримання інформації про слот (скіл або расходник)
  const getSlotInfo = (id: number | string | null) => {
    if (id === null) return null;
    if (id === 0) return { id: 0, name: "Attack", icon: "/skills/attack.jpg", mpCost: 0, cooldown: 0, type: "skill" as const };
    
    // Перевіряємо чи це расходник
    if (typeof id === "string" && id.startsWith("consumable:")) {
      const itemId = id.replace("consumable:", "");
      const itemDef = itemDefByInventoryId(itemId);
      const canonical = itemId.replace(/^shop_/, "");
      if (itemDef) {
        const invItem = hero?.inventory?.find((i: any) => {
          if (!i?.id) return false;
          const iid = String(i.id).replace(/^shop_/, "");
          return iid === canonical || i.id === itemId || i.id === canonical;
        });
        return {
          id,
          name: itemDef.name,
          icon: itemDef.icon,
          type: "consumable" as const,
          itemId,
          count: invItem?.count ?? 0,
        };
      }
      return null;
    }

    // Предмет для екіпірування (зброя/щит на панелі; itemsDBWithStarter = стартовий набір теж)
    if (typeof id === "string" && id.startsWith("item:")) {
      const itemId = id.replace("item:", "");
      const itemDef = itemsDBWithStarter[itemId];
      if (itemDef) {
        return {
          id,
          name: itemDef.name,
          icon: itemDef.icon,
          type: "item" as const,
          itemId,
        };
      }
      return null;
    }
    
    // Це скіл (іконка/вартість з професійного визначення — не з першого збігу в allSkills)
    const skill = learnedActive.find((s) => s.id === id);
    if (skill) {
      return { ...skill, type: "skill" as const };
    }
    if (hero && typeof id === "number" && id !== 0) {
      const hasLearned = hero.skills?.some((s: any) => Number(s?.id) === id);
        if (hasLearned) {
          const def = getSkillDefForBattle(hero.profession ?? null, hero.klass, hero.race, id);
          if (def && def.category !== "passive") {
            const ls = hero.skills!.find((s: any) => Number(s?.id) === id);
            const levels = Array.isArray(def.levels) ? def.levels : [];
            const lvl = levels.find((l) => l.level === (ls as any)?.level) ?? levels[0];
            if (lvl) {
            return {
              id,
              name: def.name,
              icon: def.icon || "/skills/attack.jpg",
              mpCost: lvl.mpCost ?? 0,
              cooldown: def.cooldown ?? (def.category === "toggle" ? 0 : 5),
              type: "skill" as const,
            };
          }
        }
      }
    }
    return null;
  };

  const slotBaseClass = "relative w-9 h-9 rounded-md overflow-hidden flex items-center justify-center transition-all";

  const emptySlotClass = uiBattleTest
    ? "w-9 h-9 rounded-md overflow-hidden flex items-center justify-center border border-cyan-900/55 bg-[linear-gradient(165deg,#1e293b_0%,#0f172a_48%,#020617_100%)] text-cyan-100/90 text-lg font-light leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-4px_10px_rgba(0,0,0,0.55),0_2px_6px_rgba(0,0,0,0.7)] ring-1 ring-cyan-500/20 hover:ring-cyan-400/35 hover:border-cyan-500/50 hover:text-white active:scale-[0.97] transition-[transform,box-shadow,border-color,color,filter] duration-150"
    : uiModern
      ? "w-9 h-9 rounded-md overflow-hidden flex items-center justify-center border border-[#7a6344]/65 bg-[radial-gradient(ellipse_90%_70%_at_50%_20%,rgba(199,173,128,0.14)_0%,transparent_65%),linear-gradient(165deg,#2a2318_0%,#100d09_55%,#080705_100%)] text-[#e8d4b0] text-lg font-light leading-none shadow-[inset_0_1px_0_rgba(255,235,200,0.08),0_0_14px_rgba(199,173,128,0.07),0_2px_6px_rgba(0,0,0,0.65)] ring-1 ring-[#c7ad80]/18 hover:ring-[#c7ad80]/35 hover:border-[#c7ad80]/45 hover:text-[#fff2d0] active:scale-[0.97] transition-[transform,box-shadow,border-color,color,filter] duration-150"
      : "w-9 h-9 rounded-md border-2 border-dashed border-amber-900/70 bg-[#0d0a06] text-[#caa777] text-xs flex items-center justify-center hover:brightness-110 hover:border-amber-700/60 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]";

  const removeSlotClass = uiBattleTest
    ? "w-9 h-9 rounded-md overflow-hidden flex items-center justify-center border border-cyan-950/60 bg-[linear-gradient(180deg,#1e293b_0%,#020617_100%)] text-cyan-200/90 text-[10px] font-semibold tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_5px_rgba(0,0,0,0.55)] ring-1 ring-cyan-500/15 hover:border-cyan-400/45 hover:text-white active:scale-[0.98] transition-all"
    : uiModern
      ? "w-9 h-9 rounded-md overflow-hidden flex items-center justify-center border border-[#6b5940]/70 bg-gradient-to-b from-[#241e15] to-[#0f0c09] text-[#c9a46a] text-[10px] font-semibold tracking-tight shadow-[inset_0_1px_0_rgba(199,173,128,0.07),0_2px_5px_rgba(0,0,0,0.55)] ring-1 ring-[#c7ad80]/15 hover:border-[#c7ad80]/40 hover:text-[#fff0c8] active:scale-[0.98] transition-all"
      : "w-9 h-9 rounded-md border-2 border-amber-900/60 bg-[#0d0a06] text-[#caa777] text-[11px] flex items-center justify-center hover:brightness-110 hover:border-amber-700/50 transition-all";

  const modalPickBorder = uiBattleTest ? "border-cyan-800/50" : uiModern ? "border-[#5c4a32]/55" : "border-white/40";
  const modalPickBorderStrong = uiBattleTest ? "border-cyan-800/55" : uiModern ? "border-[#5c4a32]/55" : "border-white/50";

  return (
    <div className={uiModern ? "space-y-2 pb-0.5" : "space-y-2"}>
      <div
        className={
          uiBattleTest ? "h-[1px] w-full bg-cyan-500/22" : uiModern ? "h-[1px] w-full bg-[#5c4a32]/35" : "h-[1px] w-full bg-[#1a120c]"
        }
      />
      <div className="flex justify-center">
        <div className="px-4 py-3">
          <div className="grid grid-cols-8 gap-3">
            {slotsToShow.slice(0, 7).map((id, idx) => {
              const slotInfo = getSlotInfo(id);
              const isConsumable = slotInfo?.type === "consumable";
              const isItem = slotInfo?.type === "item";
              const itemId = (isConsumable || isItem) && "itemId" in slotInfo ? slotInfo.itemId : "";
              const isCharge = isConsumable && isChargeBarItem(itemId);
              const isChargeActive = isCharge && (activeChargeSlots ?? []).includes(idx);
              const isItemEquipped = isItem && itemId && (hero?.equipment?.weapon === itemId || hero?.equipment?.shield === itemId);
              const readyAt = skillReadyAt(id, slotInfo, cooldowns, heroNextAttackAt);
              const isBaseAttackSkill = id === 0 && slotInfo?.type === "skill";
              const onCooldown = readyAt > now;
              const toggleSkillDef =
                typeof id === "number" && id !== 0 && hero
                  ? getSkillDefForBattle(hero.profession ?? null, hero.klass, hero.race, id)
                  : null;
              const toggleBuffActive =
                !!toggleSkillDef &&
                skillDefIsToggle(toggleSkillDef) &&
                heroBuffs.some((b: any) => b && Number(b.expiresAt) === Number.MAX_SAFE_INTEGER && b.id === id);

              const disabled =
                id !== null &&
                slotInfo?.type === "skill" &&
                (status !== "fighting" ||
                  (!toggleBuffActive && (slotInfo.mpCost ?? 0) > heroMP) ||
                  (onCooldown && !toggleBuffActive));
              const consumableDisabled = isConsumable && !isCharge && (slotInfo.count ?? 0) <= 0;

              if (id === null) {
                return (
                  <button
                    key={`slot-${idx}`}
                    type="button"
                    onClick={() => setPickerSlot(idx)}
                    className={emptySlotClass}
                    title="Додати навичку"
                  >
                    <span className={uiModern ? "opacity-90 translate-y-px" : ""}>+</span>
                  </button>
                );
              }

              const handleSlotClick = () => {
                if (isCharge) {
                  toggleChargeSlot(idx);
                } else if (isItem && itemId) {
                  const invItem = hero?.inventory?.find((i: any) => i.id === itemId);
                  if (invItem) equipItem(invItem);
                } else if (id !== null) {
                  if (typeof id === "number") {
                    if (id === 0 && onAttackOverride) {
                      onAttackOverride();
                    } else if (id !== 0 && onUseSkillOverride) {
                      onUseSkillOverride(id);
                    } else {
                      useSkill(id as any);
                    }
                  } else {
                    useSkill(id as any);
                  }
                } else {
                  setPickerSlot(idx);
                }
              };

              const slotL2Style: React.CSSProperties = {
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.06), 0 1px 0 rgba(0,0,0,0.5)",
                border: "2px solid",
                borderColor: uiBattleTest ? "rgba(15,118,110,0.88)" : "rgba(60,45,25,0.9)",
              };
              const slotActiveStyle = (isChargeActive || isItemEquipped)
                ? {
                    borderColor: uiBattleTest ? "rgba(34,211,238,0.85)" : "rgba(212,175,55,0.85)",
                    borderWidth: "1px",
                  }
                : {};

              return (
                <button
                  key={`slot-${idx}`}
                  onClick={handleSlotClick}
                  disabled={disabled || consumableDisabled}
                  className={`${slotBaseClass} ${disabled || consumableDisabled ? "opacity-50 saturate-50" : ""} ${
                    isChargeActive || isItemEquipped
                      ? uiBattleTest
                        ? "bg-cyan-950/35"
                        : "bg-amber-950/30"
                      : "bg-[#0d0a06]"
                  }`}
                  style={{ ...slotL2Style, ...slotActiveStyle }}
                  title={slotInfo?.name}
                >
                  {slotInfo ? (
                    <img src={slotInfo.icon || "/skills/attack.jpg"} className="w-[26px] h-[26px] object-cover rounded-sm relative z-0" alt="" />
                  ) : (
                    <span className="text-[#caa777] text-xs relative z-0">?</span>
                  )}
                  {slotInfo?.type === "skill" && (
                    <SkillCooldownLayer
                      readyAt={readyAt}
                      now={now}
                      isBaseAttack={isBaseAttackSkill}
                      attackIntervalMs={attackIntervalMs}
                      uiModern={uiModern}
                      uiBattleTest={uiBattleTest}
                    />
                  )}
                  {isConsumable && slotInfo.count !== undefined && slotInfo.count > 1 && (
                    <div
                      className={`absolute bottom-0 right-0 bg-black/80 text-[9px] px-1 rounded-tl font-semibold ${
                        uiBattleTest ? "text-cyan-200" : "text-amber-200"
                      }`}
                    >
                      {slotInfo.count}
                    </div>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={openRemovePicker}
              className={removeSlotClass}
              style={!uiModern ? { boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)" } : undefined}
              title="Убрать скиллы"
            >
              Убр.
            </button>
            {slotsToShow.slice(7).map((id, idx) => {
              const slotIndex = idx + 7;
              const slotInfo = getSlotInfo(id);
              const isConsumable = slotInfo?.type === "consumable";
              const isItem = slotInfo?.type === "item";
              const itemId = (isConsumable || isItem) && "itemId" in slotInfo ? slotInfo.itemId : "";
              const isCharge = isConsumable && isChargeBarItem(itemId);
              const isChargeActive = isCharge && (activeChargeSlots ?? []).includes(slotIndex);
              const isItemEquipped = isItem && itemId && (hero?.equipment?.weapon === itemId || hero?.equipment?.shield === itemId);
              const readyAt = skillReadyAt(id, slotInfo, cooldowns, heroNextAttackAt);
              const isBaseAttackSkill = id === 0 && slotInfo?.type === "skill";
              const onCooldown = readyAt > now;
              const toggleSkillDef2 =
                typeof id === "number" && id !== 0 && hero
                  ? getSkillDefForBattle(hero.profession ?? null, hero.klass, hero.race, id)
                  : null;
              const toggleBuffActive2 =
                !!toggleSkillDef2 &&
                skillDefIsToggle(toggleSkillDef2) &&
                heroBuffs.some((b: any) => b && Number(b.expiresAt) === Number.MAX_SAFE_INTEGER && b.id === id);

              const disabled =
                id !== null &&
                slotInfo?.type === "skill" &&
                (status !== "fighting" ||
                  (!toggleBuffActive2 && (slotInfo.mpCost ?? 0) > heroMP) ||
                  (onCooldown && !toggleBuffActive2));
              const consumableDisabled = isConsumable && !isCharge && (slotInfo.count ?? 0) <= 0;

              if (id === null) {
                return (
                  <button
                    key={`slot-${slotIndex}`}
                    type="button"
                    onClick={() => setPickerSlot(slotIndex)}
                    className={emptySlotClass}
                    title="Додати навичку"
                  >
                    <span className={uiModern ? "opacity-90 translate-y-px" : ""}>+</span>
                  </button>
                );
              }

              const handleSlotClick2 = () => {
                if (isCharge) {
                  toggleChargeSlot(slotIndex);
                } else if (isItem && itemId) {
                  const invItem = hero?.inventory?.find((i: any) => i.id === itemId);
                  if (invItem) equipItem(invItem);
                } else if (id !== null) {
                  if (typeof id === "number") {
                    if (id === 0 && onAttackOverride) {
                      onAttackOverride();
                    } else if (id !== 0 && onUseSkillOverride) {
                      onUseSkillOverride(id);
                    } else {
                      useSkill(id as any);
                    }
                  } else {
                    useSkill(id as any);
                  }
                } else {
                  setPickerSlot(slotIndex);
                }
              };

              const slotL2Style2: React.CSSProperties = {
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.06), 0 1px 0 rgba(0,0,0,0.5)",
                border: "2px solid",
                borderColor: uiBattleTest ? "rgba(15,118,110,0.88)" : "rgba(60,45,25,0.9)",
              };
              const slotActiveStyle2 = (isChargeActive || isItemEquipped)
                ? {
                    borderColor: uiBattleTest ? "rgba(34,211,238,0.85)" : "rgba(212,175,55,0.85)",
                    borderWidth: "1px",
                  }
                : {};

              return (
                <button
                  key={`slot-${slotIndex}`}
                  onClick={handleSlotClick2}
                  disabled={disabled || consumableDisabled}
                  className={`${slotBaseClass} ${disabled || consumableDisabled ? "opacity-50 saturate-50" : ""} ${
                    isChargeActive || isItemEquipped
                      ? uiBattleTest
                        ? "bg-cyan-950/35"
                        : "bg-amber-950/30"
                      : "bg-[#0d0a06]"
                  }`}
                  style={{ ...slotL2Style2, ...slotActiveStyle2 }}
                  title={slotInfo?.name}
                >
                  {slotInfo ? (
                    <img src={slotInfo.icon || "/skills/attack.jpg"} className="w-[26px] h-[26px] object-cover rounded-sm relative z-0" alt="" />
                  ) : (
                    <span className="text-[#caa777] text-xs relative z-0">?</span>
                  )}
                  {slotInfo?.type === "skill" && (
                    <SkillCooldownLayer
                      readyAt={readyAt}
                      now={now}
                      isBaseAttack={isBaseAttackSkill}
                      attackIntervalMs={attackIntervalMs}
                      uiModern={uiModern}
                      uiBattleTest={uiBattleTest}
                    />
                  )}
                  {isConsumable && slotInfo.count !== undefined && slotInfo.count > 1 && (
                    <div
                      className={`absolute bottom-0 right-0 bg-black/80 text-[9px] px-1 rounded-tl font-semibold ${
                        uiBattleTest ? "text-cyan-200" : "text-amber-200"
                      }`}
                    >
                      {slotInfo.count}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className={
          uiBattleTest ? "h-[1px] w-full bg-cyan-500/22" : uiModern ? "h-[1px] w-full bg-[#5c4a32]/35" : "h-[1px] w-full bg-[#1a120c]"
        }
      />

      {pickerSlot !== null && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setPickerSlot(null)}
        >
          <div
            className={
              uiBattleTest
                ? "w-full max-w-[360px] rounded-2xl border border-cyan-900/40 p-3 space-y-2 shadow-[0_16px_48px_rgba(0,0,0,0.72)] bg-[linear-gradient(180deg,#020617_0%,#0a1628_45%,#000510_100%)]"
                : uiModern
                  ? "w-full max-w-[360px] rounded-xl border border-[#c7ad80]/35 p-3 space-y-2 shadow-[0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(120,90,45,0.22)_0%,transparent_55%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]"
                  : "w-full max-w-[360px] rounded-[12px] border border-white/50 bg-[#120d08] p-3 space-y-2 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between text-sm ${
                uiBattleTest ? "text-cyan-100/90" : "text-[#f0e0c0]"
              }`}
            >
              <span>Выберите умение для слота {pickerSlot + 1}</span>
              <button
                type="button"
                onClick={() => setPickerSlot(null)}
                className={
                  uiBattleTest
                    ? "text-xs px-2 py-1 rounded-lg border border-cyan-800/55 bg-[#0f172a] text-cyan-100 hover:border-cyan-500/45"
                    : uiModern
                      ? "text-xs px-2 py-1 rounded-md border border-[#5c4a32]/70 bg-[#2a2620] text-[#d4c4a8] hover:border-[#c7ad80]/40"
                      : "text-xs px-2 py-1 rounded border border-white/50 bg-[#1a1814] text-[#f0e0c0] hover:bg-[#2a241a]"
                }
              >
                Закрыть
              </button>
            </div>

            <div
              className={`flex flex-wrap gap-2 text-[12px] ${uiBattleTest ? "text-cyan-200/75" : "text-[#c7a46a]"}`}
            >
              <button
                type="button"
                className={`px-2 py-1 rounded-md bg-[#1a1814] border ${modalPickBorder} ${
                  category === "magic" ? "text-white" : ""
                }`}
                onClick={() => setCategory("magic")}
              >
                Магия
              </button>
              <button
                type="button"
                className={`px-2 py-1 rounded-md bg-[#1a1814] border ${modalPickBorder} ${
                  category === "consumable" ? "text-white" : ""
                }`}
                onClick={() => setCategory("consumable")}
              >
                Расходки
              </button>
              <button
                type="button"
                className={`px-2 py-1 rounded-md bg-[#1a1814] border ${modalPickBorder} ${
                  category === "item" ? "text-white" : ""
                }`}
                onClick={() => setCategory("item")}
              >
                Предметы
              </button>
              <button
                type="button"
                className={`px-2 py-1 rounded-md bg-[#1a1814] border ${modalPickBorder} ${
                  category === "remove" ? "text-white" : "text-[#e37c7c]"
                }`}
                onClick={() => setCategory("remove")}
              >
                Удалить
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {category === "remove"
                ? (currentList as { id: number | string; idx: number }[]).map((s) => {
                    const slotInfo = getSlotInfo(s.id);
                    const def = slotInfo || { name: "Unknown", icon: "/skills/attack.jpg" };
                    return (
                      <button
                        key={`rm-${s.idx}-${s.id}`}
                        onClick={() => {
                          const updated = computeNextSlots(slotsToShow, s.idx, null);
                          setLoadoutSkill(s.idx, null);
                          const nextIdx = findNextEmpty(updated);
                          setPickerSlot(nextIdx);
                        }}
                        className={`w-7 h-7 rounded border ${modalPickBorderStrong} bg-[#1f160c] flex items-center justify-center relative`}
                        title={def.name}
                      >
                        <img src={def.icon || "/skills/attack.jpg"} alt={def.name} className="w-full h-full object-cover rounded" />
                        {slotInfo?.type === "consumable" && slotInfo.count !== undefined && slotInfo.count > 1 && (
                          <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] px-0.5 rounded">
                            {slotInfo.count}
                          </div>
                        )}
                      </button>
                    );
                  })
                : category === "consumable"
                ? (currentList as any[]).map((c) => {
                    return (
                      <button
                        key={`pick-${c.id}`}
                        onClick={() => {
                          const updated = computeNextSlots(slotsToShow, pickerSlot, c.id as any);
                          setLoadoutSkill(pickerSlot, c.id as any);
                          const nextIdx = findNextEmpty(updated);
                          setPickerSlot(nextIdx);
                        }}
                        className={`w-7 h-7 rounded border ${modalPickBorderStrong} bg-[#1f160c] flex items-center justify-center relative`}
                        title={`${c.name} (x${c.count})`}
                      >
                        <img src={c.icon} alt={c.name} className="w-full h-full object-cover rounded" />
                        {c.count > 1 && (
                          <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] px-0.5 rounded">
                            {c.count}
                          </div>
                        )}
                      </button>
                    );
                  })
                : category === "item"
                ? (currentList as { id: string; name: string; icon: string; itemId: string }[]).map((c) => (
                    <button
                      key={`pick-${c.id}`}
                      onClick={() => {
                        const updated = computeNextSlots(slotsToShow, pickerSlot, c.id as any);
                        setLoadoutSkill(pickerSlot, c.id as any);
                        setPickerSlot(null);
                      }}
                      className={`w-7 h-7 rounded border ${modalPickBorderStrong} bg-[#1f160c] flex items-center justify-center`}
                      title={c.name}
                    >
                      <img src={c.icon} alt={c.name} className="w-full h-full object-cover rounded" />
                    </button>
                  ))
                : (currentList as LearnedSkill[]).map((s) => {
                    const readyAtPick = skillReadyAt(s.id, { type: "skill" }, cooldowns, heroNextAttackAt);
                    const onCdPick = readyAtPick > now;
                    const disabled = (s.mpCost ?? 0) > heroMP || onCdPick;
                    return (
                      <button
                        key={`pick-${s.id}`}
                        onClick={() => {
                          const updated = computeNextSlots(slotsToShow, pickerSlot, s.id);
                          setLoadoutSkill(pickerSlot, s.id);
                          const nextIdx = findNextEmpty(updated);
                          setPickerSlot(nextIdx);
                        }}
                        disabled={disabled}
                        className={`w-7 h-7 rounded border ${modalPickBorderStrong} bg-[#1f160c] flex items-center justify-center disabled:opacity-60`}
                      >
                        <img src={s.icon} alt={s.name} className="w-full h-full object-cover rounded" />
                      </button>
                    );
                  })}
              {currentList.length === 0 && (
                <div className="col-span-5 text-[12px] text-[#caa777]">
                  {category === "item" ? "Нет оружия/щитов в инвентаре" : "Нет доступных скиллов"}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPickerSlot(null)}
                className={
                  uiBattleTest
                    ? "h-8 px-3 rounded-lg border border-cyan-800/55 bg-[#0f172a] text-cyan-100 text-[12px] hover:border-cyan-500/45"
                    : uiModern
                      ? "h-8 px-3 rounded-md border border-[#5c4a32]/70 bg-[#2a2620] text-[#d4c4a8] text-[12px] hover:border-[#c7ad80]/40"
                      : "h-8 px-3 rounded-md border border-white/40 bg-[#1b1b1b] text-[#e8e8e8] text-[12px] hover:bg-[#272727]"
                }
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
