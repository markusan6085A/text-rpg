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
    <div className="w-full flex items-start justify-center text-yellow-200">
      <div className="w-full max-w-[380px] px-4 pt-6 pb-10 mt-8 rounded-[14px]
                      border border-[#3a2e22] bg-[#1a1713]/95
                      shadow-[0_0_0_1px_#000_inset,0_2px_10px_rgba(0,0,0,0.6)]">
        <div className="text-center text-[22px] font-bold mb-4">Р РѕР·РґС–Р» "РџСЂРѕ РіСЂСѓ"</div>
        <p className="text-center text-[15px] text-yellow-100/90 leading-relaxed px-2 mb-6">
          Р¦РµР№ СЂРѕР·РґС–Р» Сѓ СЂРѕР·СЂРѕР±С†С–. РќРµР·Р°Р±Р°СЂРѕРј С‚СѓС‚ Р·'СЏРІРёС‚СЊСЃСЏ С–РЅС„РѕСЂРјР°С†С–СЏ РїСЂРѕ СЃРІС–С‚, РєР»Р°СЃРё,
          СЂР°СЃРё, СЂРµР№С‚Рё, РµРєРѕРЅРѕРјС–РєСѓ С‚Р° С–РЅС€Рµ.
        </p>
        
        <div className="mb-6 flex items-center justify-center gap-2 text-[10px] border-t border-gray-600 pt-4">
          <button
            onClick={() => navigate("/wip")}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            РџРѕРґРґРµСЂР¶РєР°
          </button>
          <span className="text-gray-600">|</span>
          <button
            onClick={() => navigate("/online-players")}
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            РћРЅР»Р°Р№РЅ: {onlineCount}
          </button>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-5 py-[8px] text-[15px] font-semibold text-yellow-200 rounded-md shadow-md active:brightness-90 transition-all"
            style={{
              backgroundImage: "url(/btn-small.jpg)",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              filter: "brightness(1.05)",
            }}>
            РќР°Р·Р°Рґ РЅР° РіРѕР»РѕРІРЅСѓ
          </button>
        </div>
      </div>
    </div>
  );
}