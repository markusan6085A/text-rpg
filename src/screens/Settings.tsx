import React, { useState, useEffect } from "react";
import { getGameSettings, setGameSettings, resetTutorialHint } from "../state/gameSettings";
import type { GameSettings } from "../state/gameSettings";

interface SettingsProps {
  navigate: (path: string) => void;
}

export default function Settings({ navigate }: SettingsProps) {
  const [settings, setSettings] = useState<GameSettings>(() => getGameSettings());
  const [tutorialOk, setTutorialOk] = useState(false);

  useEffect(() => {
    setSettings(getGameSettings());
  }, []);

  const update = (patch: Partial<GameSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setGameSettings(next);
  };

  const handleResetTutorial = () => {
    resetTutorialHint();
    setTutorialOk(true);
    setTimeout(() => setTutorialOk(false), 2000);
  };

  return (
    <div className="w-full text-white px-3 py-4">
      <div className="max-w-[360px] mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-bold text-[#ffe9c0]">Настройки</div>
            <div className="text-xs text-orange-400/90">Параметры игры</div>
          </div>
          <button onClick={() => navigate("/about")} className="text-gray-400 hover:text-white text-[10px]">
            ← Меню
          </button>
        </div>
        <div className="w-full h-px bg-gray-600 mb-4" />

        <div className="space-y-4">
          <div className="border border-white/30 rounded-lg p-3 bg-black/20">
            <div className="text-sm font-semibold text-[#c7ad80] mb-3">Обучалка</div>
            <button
              onClick={handleResetTutorial}
              className="w-full text-left py-2 px-3 rounded bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 text-xs"
            >
              Показать обучалку снова под барами
            </button>
            {tutorialOk && (
              <p className="mt-2 text-green-400 text-xs">Готово! Обучалка появится при следующем заходе на город.</p>
            )}
          </div>

          <div className="border border-white/30 rounded-lg p-3 bg-black/20">
            <div className="text-sm font-semibold text-[#c7ad80] mb-3">Внешний вид</div>

            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-gray-200 text-xs">Компактный режим</span>
              <button
                onClick={() => update({ compactMode: !settings.compactMode })}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  settings.compactMode ? "bg-amber-600 text-black" : "bg-white/20 text-gray-300"
                }`}
              >
                {settings.compactMode ? "Вкл" : "Выкл"}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Меньше отступов, больше контента на экране</p>

            <div className="flex items-center justify-between py-2 border-b border-white/10 mt-2">
              <span className="text-gray-200 text-xs">Крупный шрифт</span>
              <button
                onClick={() => update({ largeFont: !settings.largeFont })}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  settings.largeFont ? "bg-amber-600 text-black" : "bg-white/20 text-gray-300"
                }`}
              >
                {settings.largeFont ? "Вкл" : "Выкл"}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Увеличенный текст для удобства чтения</p>
          </div>
        </div>
      </div>
    </div>
  );
}
