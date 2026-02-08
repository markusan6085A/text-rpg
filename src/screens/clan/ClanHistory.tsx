import React from "react";
import { type ClanLog } from "../../utils/api";

interface ClanHistoryProps {
  logs: ClanLog[];
}

export default function ClanHistory({ logs }: ClanHistoryProps) {
  return (
    <div className="space-y-2">
      <div className="text-[12px] text-[#c7ad80] mb-2">История клана:</div>
      <div className="bg-[#1a1a1a] border border-white/40 rounded p-2 max-h-64 overflow-y-auto space-y-1">
        {logs.length === 0 ? (
          <div className="text-[11px] text-[#9f8d73]">История пуста</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="text-[11px] text-[#9f8d73] border-b border-solid border-white/40 pb-1">
              {log.message}
              <span className="text-[10px] text-gray-500 ml-2">
                {new Date(log.createdAt).toLocaleString("ru-RU")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
