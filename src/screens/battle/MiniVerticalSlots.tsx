import React from "react";
import { useBattleStore } from "../../state/battle/store";
import { useHeroStore } from "../../state/heroStore";
import { getJSON, setJSON } from "../../state/persistence";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";

export type MiniSkill = {
  id: number;
  name: string;
  icon: string;
  mpCost: number;
  cooldown: number;
};

interface MiniVerticalSlotsProps {
  learned: MiniSkill[];
}

export function MiniVerticalSlots({ learned }: MiniVerticalSlotsProps) {
  const uiL2 = isWarmCityUi(getCityUiVariant());
  const { useSkill, status, cooldowns } = useBattleStore();
  const hero = useHeroStore((s) => s.hero);
  const heroMP = hero?.mp ?? 0;
  const heroName = hero?.name;

  const loadSaved = React.useCallback(
    (name?: string | null) => {
      const key = name ? `l2_minislots_${name}` : null;
      if (!key) return [null, null, null, null, null] as (number | null)[];
      try {
        const parsed = getJSON<(number | null)[]>(key, [null, null, null, null, null]);
        if (!Array.isArray(parsed)) return [null, null, null, null, null];
        const normalized = parsed
          .map((v: any) => (typeof v === "number" || v === null ? v : null))
          .slice(0, 5);
        while (normalized.length < 5) normalized.push(null);
        return normalized as (number | null)[];
      } catch {
        return [null, null, null, null, null];
      }
    },
    []
  );

  const [slots, setSlots] = React.useState<(number | null)[]>(() =>
    loadSaved(useHeroStore.getState().hero?.name)
  );
  const [pickerSlot, setPickerSlot] = React.useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerTab, setPickerTab] = React.useState<"skills" | "items" | "consumables">("skills");
  const [removeMode, setRemoveMode] = React.useState(false);

  // load saved mini slots for this hero
  React.useEffect(() => {
    if (!heroName) return;
    setSlots(loadSaved(heroName));
  }, [heroName, loadSaved]);

  // persist mini slots when they change
  React.useEffect(() => {
    if (!heroName) return;
    try {
      setJSON(`l2_minislots_${heroName}`, slots);
    } catch {
      /* ignore */
    }
  }, [slots, heroName]);

  const handlePick = (id: number) => {
    if (pickerSlot === null) return;
    const next = [...slots];
    next[pickerSlot] = id;
    setSlots(next);
    setPickerOpen(false);
    setPickerSlot(null);
    setRemoveMode(false);
  };

  return (
    <div
      className="flex flex-col items-center gap-2 pt-1 relative"
      style={{ marginTop: "-100px" }}
    >
      <button
        onClick={() => {
          setRemoveMode((prev) => !prev);
          setPickerOpen(false);
          setPickerSlot(null);
        }}
        className={
          uiL2
            ? `px-2 py-1 text-[11px] rounded-md border shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] transition-[border-color,background-color] ${
                removeMode
                  ? "border-[#c7ad80]/45 text-[#f4e2b8] bg-gradient-to-b from-[#3a3020] to-[#1a1510]"
                  : "border-[#5c4a32]/75 text-[#d4c4a8] bg-gradient-to-b from-[#2e2619] to-[#14110c] hover:border-[#c7ad80]/40"
              }`
            : `px-2 py-1 text-[11px] rounded border ${
                removeMode
                  ? "border-white/50 text-white bg-[#1a0f0f]"
                  : "border-white/50 text-[#f4e2b8] bg-[#120d08]"
              }`
        }
      >
        Убр.
      </button>

      {slots.map((id, idx) => {
        const def =
          id === 0
            ? { id: 0, name: "Attack", icon: "/skills/attack.jpg", mpCost: 0, cooldown: 0 }
            : learned.find((s) => s.id === id) || null;
        const readyAt = id !== null ? cooldowns[id] ?? 0 : 0;
        const cdLeft = Math.max(0, Math.ceil((readyAt - Date.now()) / 1000));
        const disabled =
          id !== null && (status !== "fighting" || (def?.mpCost ?? 0) > heroMP || cdLeft > 0);

        if (id === null) {
          return (
            <button
              key={`mini-slot-${idx}`}
              onClick={() => {
                setRemoveMode(false);
                setPickerSlot(idx);
                setPickerOpen(true);
                setPickerTab("skills");
              }}
              className={
                uiL2
                  ? "w-8 h-8 rounded-md border border-dashed border-[#5c4a32]/70 bg-[#0d0a06] text-[#c9a44c] text-[12px] flex items-center justify-center shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)] hover:border-[#c7ad80]/40 hover:brightness-110"
                  : "w-8 h-8 rounded border border-dashed border-white/50 bg-[#120d08] text-[#c7a46a] text-[12px] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
              }
            >
              +
            </button>
          );
        }

        return (
          <button
            key={`mini-slot-${idx}`}
            onClick={() => {
              if (removeMode && id !== null) {
                const next = [...slots];
                next[idx] = null;
                setSlots(next);
                return;
              }
              if (id !== null) useSkill(id);
            }}
            disabled={disabled}
            className={
              uiL2
                ? "relative w-8 h-8 rounded-md border border-[#5c4a32]/75 bg-[#0d0a06] overflow-hidden flex items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.7)] disabled:opacity-50 disabled:saturate-50"
                : "relative w-8 h-8 rounded border border-white/50 bg-[#0f0c09] overflow-hidden flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.45)] disabled:opacity-50 disabled:saturate-50"
            }
            title={def?.name}
          >
            {def ? (
              <img src={def.icon} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-[#c7a46a]">?</span>
            )}
            {cdLeft > 0 && (
              <div className="absolute inset-0 bg-black/70 text-white text-xs flex items-center justify-center font-semibold">
                {cdLeft}
              </div>
            )}
          </button>
        );
      })}

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setPickerOpen(false);
              setPickerSlot(null);
            }}
          />
          <div
            className={
              uiL2
                ? "relative w-full max-w-[360px] rounded-xl border border-[#c7ad80]/35 p-3 space-y-3 z-50 shadow-[0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(120,90,45,0.22)_0%,transparent_55%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]"
                : "relative w-full max-w-[360px] rounded-[12px] border border-white/50 bg-gradient-to-b from-[#1a120c] to-[#0f0a07] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.85)] space-y-3 z-50"
            }
          >
            <div
              className={
                uiL2
                  ? "flex justify-between items-center text-[13px] text-[#e8c56e] font-semibold"
                  : "flex justify-between items-center text-[13px] text-[#f4e2b8] font-semibold"
              }
            >
              <span>Выбор слота {pickerSlot !== null ? pickerSlot + 1 : ""}</span>
              <button
                onClick={() => {
                  setPickerOpen(false);
                  setPickerSlot(null);
                }}
                className={
                  uiL2
                    ? "px-2 py-1 text-[11px] rounded-md border border-[#5c4a32]/70 bg-[#2a2620] text-[#d4c4a8] hover:border-[#c7ad80]/40"
                    : "px-2 py-1 text-[11px] rounded border border-white/40 bg-[#1b1b1b] text-[#e8e8e8]"
                }
              >
                Закрыть
              </button>
            </div>

            <div className={uiL2 ? "flex gap-2 text-[12px] text-[#9d8265]" : "flex gap-2 text-[12px] text-[#caa777]"}>
              {(["skills", "items", "consumables"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPickerTab(tab)}
                  className={
                    uiL2
                      ? `px-2 py-1 rounded-md border border-[#5c4a32]/55 ${
                          pickerTab === tab ? "bg-[#2e2619] text-[#e8dcc8]" : "bg-[#14110c] text-[#8a7a60]"
                        }`
                      : `px-2 py-1 rounded border border-white/40 ${
                          pickerTab === tab ? "bg-[#1a1814] text-white" : "bg-[#120d08]"
                        }`
                  }
                >
                  {tab === "skills" ? "Скиллы" : tab === "items" ? "Предметы" : "Расходники"}
                </button>
              ))}
            </div>

            {pickerTab === "skills" && (
              <div className="grid grid-cols-4 gap-2 max-h-[280px] overflow-y-auto pr-1">
                {learned.map((s) => {
                  const readyAt = cooldowns[s.id] ?? 0;
                  const cdLeft = Math.max(0, Math.ceil((readyAt - Date.now()) / 1000));
                  const disabled = (s.mpCost ?? 0) > heroMP || cdLeft > 0;
                  return (
                    <button
                      key={`mini-pick-${s.id}`}
                      onClick={() => handlePick(s.id)}
                      disabled={disabled}
                      className={
                        uiL2
                          ? "w-6 h-6 rounded border border-[#5c4a32]/55 bg-[#1f160c] flex items-center justify-center disabled:opacity-60"
                          : "w-6 h-6 rounded border border-white/50 bg-[#1f160c] flex items-center justify-center disabled:opacity-60"
                      }
                      title={s.name}
                    >
                      <img src={s.icon} alt={s.name} className="w-full h-full object-cover rounded" />
                    </button>
                  );
                })}
                {learned.length === 0 && (
                  <div className={uiL2 ? "col-span-4 text-[12px] text-[#8a7a60]" : "col-span-4 text-[12px] text-[#caa777]"}>
                    Нет скиллов
                  </div>
                )}
              </div>
            )}

            {pickerTab !== "skills" && (
              <div className={uiL2 ? "text-[12px] text-[#8a7a60]" : "text-[12px] text-[#caa777]"}>
                Пока что подбор {pickerTab === "items" ? "предметов" : "расходников"} не реализован.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
