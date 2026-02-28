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
    const m = new Map<number, { name: string; icon: string }>();
    for (const s of allSkills) m.set(s.id, { name: s.name, icon: s.icon || "/skills/attack.jpg" });
    return m;
  }, []);

  const availableIds = React.useMemo(() => skills.map((s) => s.id), [skills]);
  const [configureMode, setConfigureMode] = React.useState(false);
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
          className="w-7 h-7 rounded border border-dashed border-[#6d5a3b] text-[#c7ad80]/80 bg-[#0f0c09]"
          title="Выбрать скил"
        >
          +
        </button>
      );
    }

    const skill = skills.find((s) => s.id === skillId);
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
          if (configureMode) {
            setPickerSlot(idx);
            return;
          }
          onUseSkill(skill.id);
        }}
        disabled={!configureMode && disabled}
        className="relative w-7 h-7 rounded overflow-hidden border border-[#5e4a2e] bg-[#0f0c09] disabled:opacity-40"
        title={meta?.name || `skill#${skill.id}`}
      >
        <img src={meta?.icon || "/skills/attack.jpg"} alt={meta?.name || `skill#${skill.id}`} className="w-full h-full object-cover" />
        {cdLeft > 0 && (
          <span className="absolute inset-0 bg-black/55 text-[8px] text-red-300 flex items-center justify-center">
            {cdLeft}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] text-[#c7ad80]/80">Панель скілів</div>
        <button
          type="button"
          onClick={() => {
            setConfigureMode((v) => !v);
            setPickerSlot(null);
          }}
          className={`text-[10px] px-1.5 py-[1px] rounded border ${configureMode ? "border-[#3bd16f] text-[#3bd16f]" : "border-[#6d5a3b] text-[#c7ad80]"}`}
        >
          {configureMode ? "Готово" : "Выбор"}
        </button>
      </div>

      <div className="flex items-center gap-1">
        {slots.map((id, idx) => renderSlot(id, idx))}
      </div>

      {pickerSlot !== null && (
        <div className="mt-2 border border-[#4aa3ff]/60 rounded p-2 bg-black/30">
          <div className="text-[10px] text-[#c7ad80] mb-1">Слот {pickerSlot + 1}</div>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="text-[10px] px-2 py-1 rounded border border-[#6d5a3b] text-[#c7ad80]"
              onClick={() => pickForSlot(pickerSlot, null)}
            >
              Очистить
            </button>
            {skills.map((s) => {
              const meta = skillMap.get(s.id);
              return (
                <button
                  key={`pick-skill-${s.id}`}
                  type="button"
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-[#6d5a3b] text-[#d9c4a3]"
                  onClick={() => pickForSlot(pickerSlot, s.id)}
                >
                  <img src={meta?.icon || "/skills/attack.jpg"} alt={meta?.name || `skill#${s.id}`} className="w-3 h-3 object-contain" />
                  <span>{meta?.name || `skill#${s.id}`}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
