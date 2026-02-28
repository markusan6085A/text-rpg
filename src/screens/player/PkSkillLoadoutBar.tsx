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

const SLOT_COUNT = 8;

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
  const skillMap = React.useMemo(() => {
    const m = new Map<number, { name: string; icon: string; category?: string }>();
    for (const s of allSkills) m.set(s.id, { name: s.name, icon: s.icon || "/skills/attack.jpg", category: s.category });
    return m;
  }, []);

  // PK bar: тільки активні скіли (без passive), як на звичайній панелі бою.
  const activeSkills = React.useMemo(() => {
    return skills.filter((s) => {
      const meta = skillMap.get(s.id);
      if (!meta) return false;
      return meta.category !== "passive";
    });
  }, [skills, skillMap]);
  const availableIds = React.useMemo(() => activeSkills.map((s) => s.id), [activeSkills]);
  const [pickerSlot, setPickerSlot] = React.useState<number | null>(null);
  const [slots, setSlots] = React.useState<Array<number | null>>(() => {
    const fallback = [...availableIds.slice(0, SLOT_COUNT)];
    while (fallback.length < SLOT_COUNT) fallback.push(null);
    return fallback;
  });

  React.useEffect(() => {
    const fallback = [...availableIds.slice(0, SLOT_COUNT)];
    while (fallback.length < SLOT_COUNT) fallback.push(null);
    const raw = localStorage.getItem(keyFor(ownerId));
    if (!raw) {
      setSlots(fallback);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Array<number | null>;
      const normalized = Array.from({ length: SLOT_COUNT }, (_, i) => {
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

  const pickForSlot = (slotIdx: number, skillId: number | null) => {
    const next = [...slots];
    next[slotIdx] = skillId;
    saveSlots(next);
    setPickerSlot(null);
  };

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

    const skill = activeSkills.find((s) => s.id === skillId);
    if (!skill) {
      return (
        <button
          key={`pk-slot-${idx}`}
          type="button"
          onClick={() => setPickerSlot(idx)}
          className="w-7 h-7 rounded border border-dashed border-[#6d5a3b] text-[#c7ad80]/80 bg-[#0f0c09]"
          title="Выбрать скил"
        >
          +
        </button>
      );
    }

    const cdLeft = Math.max(0, Math.ceil(((cooldowns[skill.id] ?? 0) - now) / 1000));
    const disabled = ended || acting || currentMp < skill.mpCost || cdLeft > 0;
    const meta = skillMap.get(skill.id);

    return (
      <button
        key={`pk-slot-${idx}`}
        type="button"
        onClick={() => {
            onUseSkill(skill.id);
        }}
          onContextMenu={(e) => {
            e.preventDefault();
            setPickerSlot(idx);
          }}
          disabled={disabled}
          className={`relative w-9 h-9 rounded-md overflow-hidden flex items-center justify-center transition-all ${disabled ? "opacity-50 saturate-50" : ""} bg-[#0d0a06]`}
          style={{
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.06), 0 1px 0 rgba(0,0,0,0.5)",
            border: "2px solid rgba(60,45,25,0.9)",
          }}
        title={meta?.name || `skill#${skill.id}`}
      >
        <img src={meta?.icon || "/skills/attack.jpg"} alt={meta?.name || `skill#${skill.id}`} className="w-full h-full object-cover" />
        {cdLeft > 0 && (
          <span className="absolute inset-0 bg-black/55 text-[10px] text-red-300 flex items-center justify-center">
            {cdLeft}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        {slots.map((id, idx) => renderSlot(id, idx))}
      </div>

      {pickerSlot !== null && (
        <div className="mt-2 border border-[#4aa3ff]/60 rounded p-2 bg-black/30">
          <div className="text-[10px] text-[#c7ad80] mb-1">Выбор скіла для слота {pickerSlot + 1}</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className="text-[10px] px-2 py-1 rounded border border-[#6d5a3b] text-[#c7ad80] hover:bg-[#2a2015]"
              onClick={() => pickForSlot(pickerSlot, null)}
            >
              Очистить
            </button>
            {activeSkills.map((s) => {
              const meta = skillMap.get(s.id);
              return (
                <button
                  key={`pick-skill-${s.id}`}
                  type="button"
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-[#6d5a3b] text-[#d9c4a3] hover:bg-[#2a2015]"
                  onClick={() => pickForSlot(pickerSlot, s.id)}
                >
                  <img src={meta?.icon || "/skills/attack.jpg"} alt={meta?.name || `skill#${s.id}`} className="w-3 h-3 object-contain" />
                  <span>{meta?.name || `skill#${s.id}`}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="text-[10px] px-2 py-1 rounded border border-[#6d5a3b] text-[#c7ad80] hover:bg-[#2a2015]"
              onClick={() => setPickerSlot(null)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
