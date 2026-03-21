import React from "react";
import { getCityUiVariant } from "../../utils/cityUiVariant";

interface ClanQuestsProps {
  // Місце для майбутніх пропсів
}

export default function ClanQuests({}: ClanQuestsProps) {
  const isL2 = getCityUiVariant() === "l2";
  const panel = isL2
    ? "bg-black/25 border border-[#5c4a32]/55 rounded p-2 max-h-64 overflow-y-auto space-y-1"
    : "bg-[#1a1a1a] border border-white/40 rounded p-2 max-h-64 overflow-y-auto space-y-1";

  return (
    <div className="space-y-2">
      <div className={isL2 ? "text-[12px] text-[#e8c56e] mb-2" : "text-[12px] text-[#c7ad80] mb-2"}>Квесты клана:</div>
      <div className={panel}>
        <div className={isL2 ? "text-[11px] text-[#8a7a60]" : "text-[11px] text-[#9f8d73]"}>
          Квесты клана в разработке...
        </div>
      </div>
    </div>
  );
}
