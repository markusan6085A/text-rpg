import React, { useState, useEffect } from "react";
import { getOnlinePlayers } from "../utils/api";

type Navigate = (p: string) => void;

export default function About({ navigate }: { navigate: Navigate }) {
  const [onlineCount, setOnlineCount] = useState<number>(0);

  useEffect(() => {
    const loadOnlineCount = async () => {
      try {
        const data = await getOnlinePlayers();
        const count = data.count ?? data.players?.length ?? 0;
        setOnlineCount(count);
      } catch (err: any) {
        console.error('[About] Failed to load online count:', err?.message || err);
        setOnlineCount(0);
      }
    };
    loadOnlineCount();
    const interval = setInterval(loadOnlineCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex items-center justify-center text-yellow-200 min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => navigate("/wip")}
          className="text-gray-400 hover:text-gray-300 transition-colors text-[10px]"
        >
          {String.fromCharCode(1055, 1086, 1076, 1076, 1077, 1088, 1078, 1082, 1072)}
        </button>
        <button
          onClick={() => navigate("/online-players")}
          className="text-green-400 hover:text-green-300 transition-colors text-[10px]"
        >
          {String.fromCharCode(1054, 1085, 1083, 1072, 1081, 1085)}
        </button>
      </div>
    </div>
  );
}
