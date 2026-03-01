import React from "react";
import { allSkills } from "../../data/skills";

type PkSkill = {
  id: number;
  level: number;
  mpCost: number;
  cooldownMs: number;
  powerBonus: number;
};

interface PkSkillLoadoutBarProps {
  ownerId: string;
  skills: PkSkill[];
  cooldowns: Record<number, number>;
  currentMp: number;
  ended: boolean;
  acting: boolean;
  now: number;
  onUseSkill: (skillId: number) => void;
}

const MAX_VISIBLE_SLOTS = 40;

function keyFor(ownerId: string) {
  return `pk_skill_loadout_${ownerId}`;
}

export default function PkSkillLoadoutBar({
  ownerId,
  skills,
  cooldowns,
  currentMp,
  ended,
  acting,
  now,
  onUseSkill,
}: PkSkillLoadoutBarProps) {
  const activeSkills = React.useMemo(() => {
    const defs = Array.isArray(allSkills) ? allSkills : [];
    return skills
      .map((s) => {
        const def = defs.find((d) => d.id === s.id);
        if (!def || def.category === "passive") return null;
        return {
          id: s.id,
          name: def.name,
          icon: def.icon || "/skills/attack.jpg",
          mpCost: s.mpCost ?? 0,
        };
      })
      .filter(Boolean) as Array<{ id: number; name: string; icon: string; mpCost: number }>;
  }, [skills]);
  const availableIds = React.useMemo(() => activeSkills.map((s) => s.id), [activeSkills]);
  const [pickerSlot, setPickerSlot] = React.useState<number | null>(null);
  const [category, setCategory] = React.useState<"magic" | "remove">("magic");
  const [slots, setSlots] = React.useState<Array<number | null>>(() => {
    const fallback = [...availableIds.slice(0, MAX_VISIBLE_SLOTS)];
    if (fallback.length < MAX_VISIBLE_SLOTS) fallback.push(null);
    return fallback;
  });

  React.useEffect(() => {
    const fallback = [...availableIds.slice(0, MAX_VISIBLE_SLOTS)];
    if (fallback.length < MAX_VISIBLE_SLOTS) fallback.push(null);
    const raw = localStorage.getItem(keyFor(ownerId));
    if (!raw) {
      setSlots(fallback);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Array<number | null>;
      const normalized = Array.from({ length: MAX_VISIBLE_SLOTS }, (_, i) => {
        const id = parsed?.[i];
        if (typeof id !== "number") return null;
        return availableIds.includes(id) ? id : null;
      });
      // Якщо loadout пустий — беремо дефолтні скіли.
      if (normalized.every((x) => x == null)) {
        setSlots(fallback);
      } else {
        setSlots(normalized);
      }
    } catch {
      setSlots(fallback);
    }
  }, [ownerId, availableIds.join(",")]);

  const saveSlots = React.useCallback(
    (next: Array<number | null>) => {
      setSlots(next);
      try {
        localStorage.setItem(keyFor(ownerId), JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [ownerId]
  );

  const computeNextSlots = React.useCallback(
    (src: Array<number | null>, slotIndex: number, skillId: number | null) => {
      let next = [...src];
      if (skillId === null) {
        if (slotIndex < next.length) next[slotIndex] = null;
      } else {
        if (slotIndex >= next.length) {
          while (next.length <= slotIndex && next.length < MAX_VISIBLE_SLOTS) next.push(null);
        }
        next[slotIndex] = skillId;
      }
      const filled = next.filter((v) => v !== null) as number[];
      let compacted: Array<number | null> = filled.slice(0, MAX_VISIBLE_SLOTS);
      if (compacted.length < MAX_VISIBLE_SLOTS) compacted.push(null);
      return compacted;
    },
    []
  );

  const findNextEmpty = React.useCallback((src: Array<number | null>) => {
    const idx = src.findIndex((v) => v === null);
    return idx === -1 ? Math.min(src.length, MAX_VISIBLE_SLOTS - 1) : idx;
  }, []);

  const openRemovePicker = () => {
    setCategory("remove");
    setPickerSlot(0);
  };

  const pickForSlot = (slotIdx: number, skillId: number | null) => {
    const next = computeNextSlots(slots, slotIdx, skillId);
    saveSlots(next);
    if (skillId === null) {
      setPickerSlot(findNextEmpty(next));
      return;
    }
    setPickerSlot(findNextEmpty(next));
  };

  const getSkillInfo = (skillId: number | null) => {
    if (skillId == null) return null;
    return activeSkills.find((s) => s.id === skillId) || null;
  };

  const slotBaseClass = "relative w-9 h-9 rounded-md overflow-hidden flex items-center justify-center transition-all";

  const renderSlot = (skillId: number | null, idx: number) => {
    if (skillId == null) {
      return (
        <button
          key={`pk-slot-${idx}`}
          type="button"
          onClick={() => setPickerSlot(idx)}
          className="w-9 h-9 rounded-md border-2 border-dashed border-amber-900/70 bg-[#0d0a06] text-[#caa777] text-xs flex items-center justify-center hover:brightness-110 hover:border-amber-700/60 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]"
          title="Выбрать скил"
        >
          +
        </button>
      );
    }

    const skill = getSkillInfo(skillId);
    if (!skill) {
      return (
        <button
          key={`pk-slot-${idx}`}
          type="button"
          onClick={() => setPickerSlot(idx)}
          className="w-9 h-9 rounded-md border-2 border-dashed border-amber-900/70 bg-[#0d0a06] text-[#caa777] text-xs flex items-center justify-center hover:brightness-110 hover:border-amber-700/60 transition-all"
          title="Выбрать скил"
        >
          +
        </button>
      );
    }

    const cdLeft = Math.max(0, Math.ceil(((cooldowns[skill.id] ?? 0) - now) / 1000));
    const disabled = ended || acting || currentMp < skill.mpCost || cdLeft > 0;
    const slotL2Style: React.CSSProperties = {
      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.06), 0 1px 0 rgba(0,0,0,0.5)",
      border: "2px solid",
      borderColor: "rgba(60,45,25,0.9)",
    };

    return (
      <button
        key={`pk-slot-${idx}`}
        type="button"
        onClick={() => onUseSkill(skill.id)}
        disabled={disabled}
        className={`${slotBaseClass} ${disabled ? "opacity-50 saturate-50" : ""} bg-[#0d0a06]`}
        style={slotL2Style}
        title={skill.name || `skill#${skill.id}`}
      >
        <img src={skill.icon || "/skills/attack.jpg"} alt={skill.name || `skill#${skill.id}`} className="w-[26px] h-[26px] object-cover rounded-sm relative z-0" />
        {cdLeft > 0 && (
          <div className="absolute inset-0 bg-black/70 text-white text-xs flex items-center justify-center font-semibold">
            {cdLeft}
          </div>
        )}
      </button>
    );
  };

  const slotsToShow = React.useMemo(() => (slots || []).slice(0, MAX_VISIBLE_SLOTS), [slots]);
  const removeList = React.useMemo(
    () => slotsToShow.map((id, idx) => ({ id, idx })).filter((s) => s.id !== null),
    [slotsToShow]
  );

  return (
    <div className="space-y-2 mt-2">
      <div className="h-[1px] w-full bg-[#1a120c]" />
      <div className="flex justify-center">
        <div className="px-4 py-3">
          <div className="grid grid-cols-8 gap-3">
            {slotsToShow.slice(0, 7).map((id, idx) => renderSlot(id, idx))}
            <button
              type="button"
              onClick={openRemovePicker}
              className="w-9 h-9 rounded-md border-2 border-amber-900/60 bg-[#0d0a06] text-[#caa777] text-[11px] flex items-center justify-center hover:brightness-110 hover:border-amber-700/50 transition-all"
              style={{ boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)" }}
              title="Убрать скиллы"
            >
              Убр.
            </button>
            {slotsToShow.slice(7).map((id, idx) => renderSlot(id, idx + 7))}
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
            className="w-full max-w-[360px] rounded-[12px] border border-white/50 bg-[#120d08] p-3 space-y-2 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-sm text-[#f0e0c0]">
              <span>Выберите умение для слота {pickerSlot + 1}</span>
              <button
                type="button"
                onClick={() => setPickerSlot(null)}
                className="text-xs px-2 py-1 rounded border border-white/50 bg-[#1a1814] text-[#f0e0c0] hover:bg-[#2a241a]"
              >
                Закрыть
              </button>
            </div>

            <div className="flex gap-2 text-[12px] text-[#c7a46a]">
              <button
                type="button"
                className={`px-2 py-1 rounded bg-[#1a1814] border border-white/40 ${category === "magic" ? "text-white" : ""}`}
                onClick={() => setCategory("magic")}
              >
                Магия
              </button>
              <button
                type="button"
                className={`px-2 py-1 rounded bg-[#1a1814] border border-white/40 ${category === "remove" ? "text-white" : "text-[#e37c7c]"}`}
                onClick={() => setCategory("remove")}
              >
                Удалить
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {category === "remove"
                ? removeList.map((s) => {
                    const skillInfo = getSkillInfo(s.id as number);
                    return (
                      <button
                        key={`rm-${s.idx}-${s.id}`}
                        type="button"
                        onClick={() => {
                          const next = computeNextSlots(slotsToShow, s.idx, null);
                          saveSlots(next);
                          setPickerSlot(findNextEmpty(next));
                        }}
                        className="w-7 h-7 rounded border border-white/50 bg-[#1f160c] flex items-center justify-center relative"
                        title={skillInfo?.name || "Unknown"}
                      >
                        <img src={skillInfo?.icon || "/skills/attack.jpg"} alt={skillInfo?.name || "Unknown"} className="w-full h-full object-cover rounded" />
                      </button>
                    );
                  })
                : activeSkills.map((s) => {
                    const readyAt = cooldowns[s.id] ?? 0;
                    const cdLeft = Math.max(0, Math.ceil((readyAt - now) / 1000));
                    const disabled = (s.mpCost ?? 0) > currentMp || cdLeft > 0;
                    return (
                      <button
                        key={`pick-${s.id}`}
                        type="button"
                        onClick={() => pickForSlot(pickerSlot, s.id)}
                        disabled={disabled}
                        className="w-7 h-7 rounded border border-white/50 bg-[#1f160c] flex items-center justify-center disabled:opacity-60"
                        title={s.name}
                      >
                        <img src={s.icon} alt={s.name} className="w-full h-full object-cover rounded" />
                      </button>
                    );
                  })}
              {((category === "remove" && removeList.length === 0) || (category === "magic" && activeSkills.length === 0)) && (
                <div className="col-span-5 text-[12px] text-[#caa777]">Нет доступных скиллов</div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPickerSlot(null)}
                className="h-8 px-3 rounded-md border border-white/40 bg-[#1b1b1b] text-[#e8e8e8] text-[12px] hover:bg-[#272727]"
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
