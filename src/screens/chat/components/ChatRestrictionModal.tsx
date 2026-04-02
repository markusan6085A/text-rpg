import React from "react";
import { isWarmCityUi, getCityUiVariant } from "../../../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../../../utils/l2WarmLayoutClassNames";

interface ChatRestrictionModalProps {
  type: "mute" | "ban";
  message: string;
  timeLeftText: string;
  onClose: () => void;
}

/** Модалка "Ви отримали мут/бан" — classic або теплий L2 */
export function ChatRestrictionModal({ type, message, timeLeftText, onClose }: ChatRestrictionModalProps) {
  const isL2 = isWarmCityUi(getCityUiVariant());
  const title = type === "mute" ? "У вас мут" : "У вас бан чату";

  const panel = isL2
    ? `${L2_WARM_OUTER_FRAME} w-full max-w-sm p-4`
    : "w-full max-w-sm rounded-lg border border-[#c7ad80]/50 bg-[#1a1a1a] p-4 shadow-xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className={panel} onClick={(e) => e.stopPropagation()}>
        <div
          className={
            isL2
              ? "flex items-center justify-between mb-3 border-b border-[#5c4a32]/45 pb-2"
              : "flex items-center justify-between mb-3 border-b border-[#c7ad80]/30 pb-2"
          }
        >
          <h2 className={isL2 ? "text-base font-bold text-[#e8c56e]" : "text-base font-bold text-[#c7ad80]"}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className={
              isL2
                ? "text-[#8a7a60] hover:text-[#e8dcc8] text-lg leading-none"
                : "text-gray-400 hover:text-white text-lg leading-none"
            }
            aria-label="Закрити"
          >
            ×
          </button>
        </div>
        <p className={isL2 ? "text-sm text-[#d4c4a8] mb-2" : "text-sm text-gray-300 mb-2"}>{message}</p>
        <p className={isL2 ? "text-sm text-[#c9a44c] mb-4" : "text-sm text-amber-200/90 mb-4"}>
          Залишилось чекати: {timeLeftText}
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={
              isL2
                ? "px-3 py-1.5 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8c56e] hover:border-[#c7ad80]/45 text-sm"
                : "px-3 py-1.5 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 text-sm"
            }
          >
            Зрозуміло
          </button>
        </div>
      </div>
    </div>
  );
}
