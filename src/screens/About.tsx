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
    <div className="w-full text-yellow-200 min-h-[400px] px-3 py-4">
      <div className="mb-4">
        <div className="text-lg font-bold mb-2 text-blue-400">Меню сервера</div>
        <div className="text-sm text-orange-400">
          Здесь собраны основные разделы и сервисные функции.
        </div>
      </div>
      <div className="flex flex-col gap-0">
        <button
          onClick={() => navigate("/wip")}
          className="text-left text-gray-400 hover:text-gray-300 transition-colors text-[10px] py-2 border-b border-gray-600 w-full"
        >
          {String.fromCharCode(1055, 1086, 1076, 1076, 1077, 1088, 1078, 1082, 1072)}
        </button>
        <button
          onClick={() => navigate("/online-players")}
          className="text-left text-green-400 hover:text-green-300 transition-colors text-[10px] py-2 border-b border-gray-600 w-full"
        >
          {String.fromCharCode(1054, 1085, 1083, 1072, 1081, 1085)} [{onlineCount}]
        </button>
        <button
          onClick={() => navigate("/wip")}
          className="text-left text-gray-400 hover:text-gray-300 transition-colors text-[10px] py-2 border-b border-gray-600 w-full"
        >
          {String.fromCharCode(1047, 1084, 1110, 1085, 1080, 1090, 1100, 32, 1085, 1110, 1082)}
        </button>
        <button
          onClick={() => navigate("/wip")}
          className="text-left text-gray-400 hover:text-gray-300 transition-colors text-[10px] py-2 border-b border-gray-600 w-full"
        >
          {String.fromCharCode(1055, 1086, 1082, 1088, 1072, 1089, 1080, 1090, 1100, 32, 1085, 1110, 1082)}
        </button>
      </div>
    </div>
  );
}
