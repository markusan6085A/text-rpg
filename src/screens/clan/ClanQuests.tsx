import React from "react";

interface ClanQuestsProps {
  // Місце для майбутніх пропсів
}

export default function ClanQuests({}: ClanQuestsProps) {
  return (
    <div className="space-y-2">
      <div className="text-[12px] text-[#c7ad80] mb-2">Квесты клана:</div>
      <div className="bg-[#1a1a1a] border border-white/40 rounded p-2 max-h-64 overflow-y-auto space-y-1">
        <div className="text-[11px] text-[#9f8d73]">Квесты клана в разработке...</div>
      </div>
    </div>
  );
}
