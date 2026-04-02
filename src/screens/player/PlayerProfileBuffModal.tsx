import React from "react";
import { L2_WARM_OUTER_FRAME } from "../../utils/l2WarmLayoutClassNames";

export type PlayerProfileBuffSkillOption = {
  id: number;
  name: string;
  icon: string;
};

/** Модалка «Забафать» — режим профілю (картка) або PK (повноекранний список + «Закрити»). */
export function PlayerProfileBuffModal(props: {
  isL2: boolean;
  variant: "profile" | "pk";
  targetName?: string;
  skills: PlayerProfileBuffSkillOption[];
  busy: boolean;
  onClose: () => void;
  onSelectBuff: (skillId: number) => void;
}) {
  const { isL2, variant, targetName, skills, busy, onClose, onSelectBuff } = props;

  if (variant === "pk") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div
          className={
            isL2
              ? `${L2_WARM_OUTER_FRAME} max-w-[340px] w-full max-h-[80vh] overflow-y-auto`
              : "bg-[#1a1a1a] border border-[#c7ad80]/50 rounded-lg max-w-[340px] w-full max-h-[80vh] overflow-y-auto"
          }
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={
              isL2
                ? "p-3 border-b border-[#5c4a32]/45 font-semibold text-[#e8c56e]"
                : "p-3 border-b border-[#c7ad80]/30 font-semibold text-[#c7ad80]"
            }
          >
            Забафать игрока
          </div>
          <div className="p-2">
            {skills.length === 0 ? (
              <p className={isL2 ? "text-[#8a7a60] text-sm" : "text-gray-400 text-sm"}>
                Нет баф-скиллов с целью Ally/Party
              </p>
            ) : (
              skills.map((buff) => (
                <button
                  key={buff.id}
                  type="button"
                  onClick={() => onSelectBuff(buff.id)}
                  disabled={busy}
                  className={
                    isL2
                      ? "w-full flex items-center gap-2 p-2 rounded-md border border-transparent hover:border-[#5c4a32]/55 hover:bg-black/25 text-left text-sm text-[#d4c4a8] disabled:opacity-50"
                      : "w-full flex items-center gap-2 p-2 rounded hover:bg-[#c7ad80]/10 text-left text-sm disabled:opacity-50"
                  }
                >
                  <img src={buff.icon} alt="" className="w-8 h-8 object-contain" />
                  <span>{buff.name}</span>
                </button>
              ))
            )}
          </div>
          <div className={isL2 ? "p-2 border-t border-[#5c4a32]/45" : "p-2 border-t border-[#c7ad80]/30"}>
            <button
              type="button"
              onClick={onClose}
              className={
                isL2
                  ? "w-full py-2 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#c9a44c] text-sm hover:border-[#c7ad80]/45"
                  : "w-full py-1 text-[#c7ad80] text-sm"
              }
            >
              Закрити
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={
          isL2
            ? "bg-[#14110c] border border-[#c7ad80]/35 rounded-lg max-w-[340px] w-full max-h-[80vh] overflow-y-auto shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
            : "bg-[#1a1a1a] border border-[#c7ad80]/50 rounded-lg max-w-[340px] w-full max-h-[80vh] overflow-y-auto"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            isL2
              ? "px-3 py-2 border-b border-[#5c4a32]/45 flex justify-between items-center"
              : "px-3 py-2 border-b border-[#c7ad80]/30 flex justify-between items-center"
          }
        >
          <span className={isL2 ? "text-[#e8c56e] font-semibold text-sm" : "text-[#c7ad80] font-semibold text-sm"}>
            Забафать {targetName ?? ""}
          </span>
          <button
            onClick={onClose}
            className={isL2 ? "text-[#8a7a60] hover:text-[#e8dcc8] text-lg" : "text-gray-400 hover:text-white text-lg"}
          >
            ×
          </button>
        </div>
        <div className="p-3">
          {skills.length === 0 ? (
            <p className={isL2 ? "text-[#8a7a60] text-xs" : "text-gray-400 text-xs"}>
              У вас немає бафів, що можна накласти на інших (ally/party).
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((buff) => (
                <button
                  key={buff.id}
                  onClick={() => onSelectBuff(buff.id)}
                  disabled={busy}
                  className={
                    isL2
                      ? "flex items-center gap-1.5 px-2 py-1.5 rounded bg-[#0f0a06] border border-[#5c4a32]/50 hover:bg-black/30 disabled:opacity-50 text-left"
                      : "flex items-center gap-1.5 px-2 py-1.5 rounded bg-[#2a2a2a] border border-[#c7ad80]/30 hover:bg-[#c7ad80]/20 disabled:opacity-50 text-left"
                  }
                >
                  <img src={buff.icon} alt="" className="w-6 h-6 object-contain" />
                  <span className={isL2 ? "text-xs text-[#e8dcc8]" : "text-xs text-white"}>{buff.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
