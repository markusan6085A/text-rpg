import React from "react";
import { useBattleStore } from "../../state/battle/store";
import { isShotConsumable } from "../../state/battle/actions/useSkill/shotHelpers";
import { useHeroStore } from "../../state/heroStore";
import { allSkills } from "../../data/skills";
import { MAX_SLOTS } from "../../state/battle/loadout";
import { itemsDBWithStarter } from "../../data/items/itemsDB";

type LearnedSkill = {
  id: number;
  name: string;
  icon: string;
  mpCost: number;
  cooldown: number;
};

function useLearnedActive(): LearnedSkill[] {
  const hero = useHeroStore((s) => s.hero);
  if (!hero) return [];
  const learned = Array.isArray(hero.skills) ? hero.skills : [];

  const actives =
    learned
      .map((ls: any) => {
        const def = allSkills.find((s) => s.id === ls.id);
        if (!def) return null;
        if (def.category === "passive") return null;
        const lvl = def.levels.find((l) => l.level === ls.level) ?? def.levels[0];
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

export function SkillBar() {
  const { useSkill, status, cooldowns, loadoutSlots, setLoadoutSkill, activeChargeSlots, toggleChargeSlot } = useBattleStore();
  const hero = useHeroStore((s) => s.hero);
  const equipItem = useHeroStore((s) => s.equipItem);
  const heroMP = hero?.mp ?? 0;
  const MAX_VISIBLE_SLOTS = 40;
  const [now, setNow] = React.useState(Date.now());
  const [pickerSlot, setPickerSlot] = React.useState<number | null>(null);
  const [category, setCategory] = React.useState<"magic" | "consumable" | "item" | "remove">("magic");

  const learnedActive = useLearnedActive();
  const slotsToShow = (loadoutSlots || []).slice(0, MAX_VISIBLE_SLOTS);

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
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
      .filter((item: any) => item && item.slot === "consumable" && (item.count ?? 0) > 0)
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
      ? loadoutSlots.map((id, idx) => ({ id, idx })).filter((s) => s.id !== null)
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
      const itemDef = itemsDBWithStarter[itemId];
      if (itemDef) {
        const invItem = hero?.inventory?.find((i: any) => i.id === itemId);
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
    
    // Це скіл
    const skill = learnedActive.find((s) => s.id === id);
    if (skill) {
      return { ...skill, type: "skill" as const };
    }
    return null;
  };

  return (
    <div className="space-y-2">
      <div className="h-[1px] w-full bg-[#1a120c]" />
      <div className="flex justify-center">
        <div className="px-4 py-3">
          <div className="grid grid-cols-8 gap-3">
            {slotsToShow.slice(0, 7).map((id, idx) => {
              const slotInfo = getSlotInfo(id);
              const isConsumable = slotInfo?.type === "consumable";
              const isItem = slotInfo?.type === "item";
              const itemId = (isConsumable || isItem) && "itemId" in slotInfo ? slotInfo.itemId : "";
              const isCharge = isConsumable && (isShotConsumable(itemId, "soulshot") || isShotConsumable(itemId, "spiritshot"));
              const isChargeActive = isCharge && (activeChargeSlots ?? []).includes(idx);
              const isItemEquipped = isItem && itemId && (hero?.equipment?.weapon === itemId || hero?.equipment?.shield === itemId);
              const readyAt = id !== null && typeof id === "number" ? cooldowns[id] ?? 0 : 0;
              const cdLeft = Math.max(0, Math.ceil((readyAt - now) / 1000));
              
              const disabled = id !== null && slotInfo?.type === "skill" && (status !== "fighting" || (slotInfo.mpCost ?? 0) > heroMP || cdLeft > 0);
              const consumableDisabled = isConsumable && !isCharge && (slotInfo.count ?? 0) <= 0;

              if (id === null) {
                return (
                  <button
                    key={`slot-${idx}`}
                    onClick={() => setPickerSlot(idx)}
                    className="w-8 h-8 rounded border border-dashed border-[#6b5330] bg-[#120d08] text-[#caa777] text-xs flex items-center justify-center hover:brightness-110 transition"
                  >
                    +
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
                  useSkill(id as any);
                } else {
                  setPickerSlot(idx);
                }
              };

              return (
                <button
                  key={`slot-${idx}`}
                  onClick={handleSlotClick}
                  disabled={disabled || consumableDisabled}
                  className={`relative w-8 h-8 rounded border overflow-hidden flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.45)] disabled:opacity-50 disabled:saturate-50 transition-colors ${
                    isChargeActive
                      ? "border-amber-400 bg-amber-900/40 ring-1 ring-amber-400/80"
                      : isItemEquipped
                      ? "border-amber-400 bg-amber-900/40 ring-1 ring-amber-400/80"
                      : "border-[#7c6847] bg-[#0f0c09]"
                  }`}
                  title={slotInfo?.name}
                >
                  {slotInfo ? (
                    <img src={slotInfo.icon || "/skills/attack.jpg"} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#caa777] text-xs">?</span>
                  )}
                  {slotInfo?.type === "skill" && cdLeft > 0 && (
                    <div className="absolute inset-0 bg-black/70 text-white text-xs flex items-center justify-center font-semibold">
                      {cdLeft}
                    </div>
                  )}
                  {isConsumable && slotInfo.count !== undefined && slotInfo.count > 1 && (
                    <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] px-0.5 rounded">
                      {slotInfo.count}
                    </div>
                  )}
                </button>
              );
            })}
            <button
              onClick={openRemovePicker}
              className="w-8 h-8 rounded border border-[#6b5330] bg-[#1a1814] text-[#caa777] text-[11px] flex items-center justify-center hover:brightness-110 transition"
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
              const isCharge = isConsumable && (isShotConsumable(itemId, "soulshot") || isShotConsumable(itemId, "spiritshot"));
              const isChargeActive = isCharge && (activeChargeSlots ?? []).includes(slotIndex);
              const isItemEquipped = isItem && itemId && (hero?.equipment?.weapon === itemId || hero?.equipment?.shield === itemId);
              const readyAt = id !== null && typeof id === "number" ? cooldowns[id] ?? 0 : 0;
              const cdLeft = Math.max(0, Math.ceil((readyAt - now) / 1000));
              
              const disabled = id !== null && slotInfo?.type === "skill" && (status !== "fighting" || (slotInfo.mpCost ?? 0) > heroMP || cdLeft > 0);
              const consumableDisabled = isConsumable && !isCharge && (slotInfo.count ?? 0) <= 0;

              if (id === null) {
                return (
                  <button
                    key={`slot-${slotIndex}`}
                    onClick={() => setPickerSlot(slotIndex)}
                    className="w-8 h-8 rounded border border-dashed border-[#6b5330] bg-[#120d08] text-[#caa777] text-xs flex items-center justify-center hover:brightness-110 transition"
                  >
                    +
                  </button>
                );
              }

              const handleSlotClick = () => {
                if (isCharge) {
                  toggleChargeSlot(slotIndex);
                } else if (isItem && itemId) {
                  const invItem = hero?.inventory?.find((i: any) => i.id === itemId);
                  if (invItem) equipItem(invItem);
                } else if (id !== null) {
                  useSkill(id as any);
                } else {
                  setPickerSlot(slotIndex);
                }
              };

              return (
                <button
                  key={`slot-${slotIndex}`}
                  onClick={handleSlotClick}
                  disabled={disabled || consumableDisabled}
                  className={`relative w-8 h-8 rounded border overflow-hidden flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.45)] disabled:opacity-50 disabled:saturate-50 transition-colors ${
                    isChargeActive
                      ? "border-amber-400 bg-amber-900/40 ring-1 ring-amber-400/80"
                      : isItemEquipped
                      ? "border-amber-400 bg-amber-900/40 ring-1 ring-amber-400/80"
                      : "border-[#7c6847] bg-[#0f0c09]"
                  }`}
                  title={slotInfo?.name}
                >
                  {slotInfo ? (
                    <img src={slotInfo.icon || "/skills/attack.jpg"} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#caa777] text-xs">?</span>
                  )}
                  {slotInfo?.type === "skill" && cdLeft > 0 && (
                    <div className="absolute inset-0 bg-black/70 text-white text-xs flex items-center justify-center font-semibold">
                      {cdLeft}
                    </div>
                  )}
                  {isConsumable && slotInfo.count !== undefined && slotInfo.count > 1 && (
                    <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] px-0.5 rounded">
                      {slotInfo.count}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-[1px] w-full bg-[#1a120c]" />

      {pickerSlot !== null && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setPickerSlot(null)}
        >
          <div
            className="w-full max-w-[360px] rounded-[12px] border border-[#4e3b24] bg-[#120d08] p-3 space-y-2 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-sm text-[#f0e0c0]">
              <span>Выберите умение для слота {pickerSlot + 1}</span>
              <button
                onClick={() => setPickerSlot(null)}
                className="text-xs px-2 py-1 rounded border border-[#4e3b24] bg-[#1a1814] text-[#f0e0c0] hover:bg-[#2a241a]"
              >
                Закрыть
              </button>
            </div>

            <div className="flex gap-2 text-[12px] text-[#c7a46a]">
              <button
                className={`px-2 py-1 rounded bg-[#1a1814] border border-[#34312b] ${category === "magic" ? "text-white" : ""}`}
                onClick={() => setCategory("magic")}
              >
                Магия
              </button>
              <button
                className={`px-2 py-1 rounded bg-[#1a1814] border border-[#34312b] ${category === "consumable" ? "text-white" : ""}`}
                onClick={() => setCategory("consumable")}
              >
                Расходки
              </button>
              <button
                className={`px-2 py-1 rounded bg-[#1a1814] border border-[#34312b] ${category === "item" ? "text-white" : ""}`}
                onClick={() => setCategory("item")}
              >
                Предметы
              </button>
              <button
                className={`px-2 py-1 rounded bg-[#1a1814] border border-[#34312b] ${category === "remove" ? "text-white" : "text-[#e37c7c]"}`}
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
                        className="w-7 h-7 rounded border border-[#6b5330] bg-[#1f160c] flex items-center justify-center relative"
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
                        className="w-7 h-7 rounded border border-[#6b5330] bg-[#1f160c] flex items-center justify-center relative"
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
                      className="w-7 h-7 rounded border border-[#6b5330] bg-[#1f160c] flex items-center justify-center"
                      title={c.name}
                    >
                      <img src={c.icon} alt={c.name} className="w-full h-full object-cover rounded" />
                    </button>
                  ))
                : (currentList as LearnedSkill[]).map((s) => {
                    const readyAt = cooldowns[s.id] ?? 0;
                    const cdLeft = Math.max(0, Math.ceil((readyAt - now) / 1000));
                    const disabled = (s.mpCost ?? 0) > heroMP || cdLeft > 0;
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
                        className="w-7 h-7 rounded border border-[#6b5330] bg-[#1f160c] flex items-center justify-center disabled:opacity-60"
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
                onClick={() => setPickerSlot(null)}
                className="h-8 px-3 rounded-md border border-[#494949] bg-[#1b1b1b] text-[#e8e8e8] text-[12px] hover:bg-[#272727]"
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
