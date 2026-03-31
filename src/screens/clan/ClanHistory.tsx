import React from "react";
import { type ClanLog } from "../../utils/api";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";

interface ClanHistoryProps {
  logs: ClanLog[];
}

export default function ClanHistory({ logs }: ClanHistoryProps) {
  const isL2 = isWarmCityUi(getCityUiVariant());
  const panel = isL2
    ? "bg-black/25 border border-[#5c4a32]/55 rounded p-2 max-h-64 overflow-y-auto space-y-1"
    : "bg-[#1a1a1a] border border-white/40 rounded p-2 max-h-64 overflow-y-auto space-y-1";

  return (
    <div className="space-y-2">
      <div className={isL2 ? "text-[12px] text-[#e8c56e] mb-2" : "text-[12px] text-[#c7ad80] mb-2"}>История клана:</div>
      <div className={panel}>
        {logs.length === 0 ? (
          <div className={isL2 ? "text-[11px] text-[#8a7a60]" : "text-[11px] text-[#9f8d73]"}>История пуста</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={
                isL2
                  ? "text-[11px] text-[#a89878] border-b border-solid border-[#5c4a32]/35 pb-1"
                  : "text-[11px] text-[#9f8d73] border-b border-solid border-white/40 pb-1"
              }
            >
              {log.message}
              <span className={isL2 ? "text-[10px] text-[#6a6048] ml-2" : "text-[10px] text-gray-500 ml-2"}>
                {new Date(log.createdAt).toLocaleString("ru-RU")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
