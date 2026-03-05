import React, { useState, useEffect } from "react";
import {
  getGameSettings,
  setGameSettings,
  resetTutorialHint,
  MOBS_PER_PAGE_OPTIONS,
  type GameSettings,
  type Language,
} from "../state/gameSettings";
import { t } from "../utils/i18n";

interface SettingsProps {
  navigate: (path: string) => void;
}

export default function Settings({ navigate }: SettingsProps) {
  const [settings, setSettings] = useState<GameSettings>(() => getGameSettings());
  const [tutorialOk, setTutorialOk] = useState(false);
  const lang = settings.language ?? "ru";

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
    <div className="w-full text-white px-3 py-4 pb-20">
      <div className="max-w-[360px] mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-bold text-[#ffe9c0]">{t("settings_title", lang)}</div>
            <div className="text-xs text-orange-400/90">{t("settings_subtitle", lang)}</div>
          </div>
          <button onClick={() => navigate("/about")} className="text-gray-400 hover:text-white text-[10px]">
            {t("back_menu", lang)}
          </button>
        </div>
        <div className="w-full h-px bg-gray-600 mb-4" />

        <div className="space-y-4">
          <div className="border border-white/30 rounded-lg p-3 bg-black/20">
            <div className="text-sm font-semibold text-[#c7ad80] mb-3">{t("tutorial_section", lang)}</div>
            <button
              onClick={handleResetTutorial}
              className="w-full text-left py-2 px-3 rounded bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 text-xs"
            >
              {t("tutorial_reset_btn", lang)}
            </button>
            {tutorialOk && (
              <p className="mt-2 text-green-400 text-xs">{t("tutorial_ok", lang)}</p>
            )}
          </div>

          <div className="border border-white/30 rounded-lg p-3 bg-black/20">
            <div className="text-sm font-semibold text-[#c7ad80] mb-3">{t("lang_section", lang)}</div>
            <div className="flex gap-2">
              {(["ru", "uk"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => update({ language: l })}
                  className={`flex-1 py-1.5 rounded text-xs font-medium ${
                    settings.language === l ? "bg-amber-600 text-black" : "bg-white/20 text-gray-300"
                  }`}
                >
                  {t(l === "ru" ? "lang_ru" : "lang_uk", lang)}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-white/30 rounded-lg p-3 bg-black/20">
            <div className="text-sm font-semibold text-[#c7ad80] mb-3">{t("appearance_section", lang)}</div>

            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-gray-200 text-xs">{t("compact_mode", lang)}</span>
              <button
                onClick={() => update({ compactMode: !settings.compactMode })}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  settings.compactMode ? "bg-amber-600 text-black" : "bg-white/20 text-gray-300"
                }`}
              >
                {settings.compactMode ? t("on", lang) : t("off", lang)}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{t("compact_hint", lang)}</p>

            <div className="flex items-center justify-between py-2 border-b border-white/10 mt-2">
              <span className="text-gray-200 text-xs">{t("large_font", lang)}</span>
              <button
                onClick={() => update({ largeFont: !settings.largeFont })}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  settings.largeFont ? "bg-amber-600 text-black" : "bg-white/20 text-gray-300"
                }`}
              >
                {settings.largeFont ? t("on", lang) : t("off", lang)}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{t("large_font_hint", lang)}</p>
          </div>

          <div className="border border-white/30 rounded-lg p-3 bg-black/20">
            <div className="text-sm font-semibold text-[#c7ad80] mb-3">{t("mobs_section", lang)}</div>
            <p className="text-[10px] text-gray-500 mb-2">{t("mobs_hint", lang)}</p>
            <div className="flex flex-wrap gap-1">
              {MOBS_PER_PAGE_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => update({ mobsPerPage: n })}
                  className={`px-3 py-1.5 rounded text-xs font-medium ${
                    settings.mobsPerPage === n ? "bg-amber-600 text-black" : "bg-white/20 text-gray-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-white/30 rounded-lg p-3 bg-black/20">
            <div className="text-sm font-semibold text-[#c7ad80] mb-3">{t("exp_section", lang)}</div>
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-gray-200 text-xs">{t("exp_enabled", lang)}</span>
              <button
                onClick={() => update({ expEnabled: !settings.expEnabled })}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  settings.expEnabled !== false ? "bg-amber-600 text-black" : "bg-white/20 text-gray-300"
                }`}
              >
                {settings.expEnabled !== false ? t("on", lang) : t("off", lang)}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{t("exp_hint", lang)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
