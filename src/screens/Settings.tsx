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
import { getCityUiVariant } from "../utils/cityUiVariant";

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

  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const cardClass = isL2
    ? "border border-[#5c4a32]/70 rounded-lg p-3 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
    : "border border-white/30 rounded-lg p-3 bg-black/20";
  const rowBorder = isL2 ? "border-b border-[#5c4a32]/25" : "border-b border-white/10";
  const titleAccent = isL2 ? "text-[#e8c56e]" : "text-[#ffe9c0]";
  const sectionTitle = isL2 ? "text-[#c9a44c]" : "text-[#c7ad80]";

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
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 pb-20 text-[#d4c4a8]`
          : "w-full text-white px-3 py-4 pb-20"
      }
    >
      <div className={isL2 ? "max-w-[420px] mx-auto" : "max-w-[360px] mx-auto"}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className={`text-lg font-bold ${titleAccent}`}>{t("settings_title", lang)}</div>
            <div className={isL2 ? "text-xs text-[#a89878]" : "text-xs text-orange-400/90"}>{t("settings_subtitle", lang)}</div>
          </div>
          <button
            onClick={() => navigate("/about")}
            className={
              isL2
                ? "text-[#9d8265] hover:text-[#c9a44c] text-[10px]"
                : "text-gray-400 hover:text-white text-[10px]"
            }
          >
            {t("back_menu", lang)}
          </button>
        </div>
        <div className={isL2 ? "w-full h-px bg-[#5c4a32]/45 mb-4" : "w-full h-px bg-gray-600 mb-4"} />

        <div className="space-y-4">
          <div className={cardClass}>
            <div className={`text-sm font-semibold mb-3 ${sectionTitle}`}>{t("tutorial_section", lang)}</div>
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

          <div className={cardClass}>
            <div className={`text-sm font-semibold mb-3 ${sectionTitle}`}>{t("lang_section", lang)}</div>
            <div className="flex gap-2">
              {(["ru", "uk"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => update({ language: l })}
                  className={`flex-1 py-1.5 rounded text-xs font-medium ${
                    settings.language === l
                      ? isL2
                        ? "bg-gradient-to-b from-[#5c4a32] to-[#3d3224] text-[#f4e8c8] border border-[#c9a44c]/40"
                        : "bg-amber-600 text-black"
                      : isL2
                        ? "bg-black/30 text-[#a89878] border border-[#5c4a32]/40"
                        : "bg-white/20 text-gray-300"
                  }`}
                >
                  {t(l === "ru" ? "lang_ru" : "lang_uk", lang)}
                </button>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <div className={`text-sm font-semibold mb-3 ${sectionTitle}`}>{t("appearance_section", lang)}</div>

            <div className={`flex items-center justify-between py-2 ${rowBorder}`}>
              <span className="text-gray-200 text-xs">{t("compact_mode", lang)}</span>
              <button
                onClick={() => update({ compactMode: !settings.compactMode })}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  settings.compactMode
                    ? isL2
                      ? "bg-gradient-to-b from-[#5c4a32] to-[#3d3224] text-[#f4e8c8] border border-[#c9a44c]/40"
                      : "bg-amber-600 text-black"
                    : isL2
                      ? "bg-black/30 text-[#a89878] border border-[#5c4a32]/40"
                      : "bg-white/20 text-gray-300"
                }`}
              >
                {settings.compactMode ? t("on", lang) : t("off", lang)}
              </button>
            </div>
            <p className={isL2 ? "text-[10px] text-[#8a7a60] mt-1" : "text-[10px] text-gray-500 mt-1"}>{t("compact_hint", lang)}</p>

            <div className={`flex items-center justify-between py-2 ${rowBorder} mt-2`}>
              <span className="text-gray-200 text-xs">{t("large_font", lang)}</span>
              <button
                onClick={() => update({ largeFont: !settings.largeFont })}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  settings.largeFont
                    ? isL2
                      ? "bg-gradient-to-b from-[#5c4a32] to-[#3d3224] text-[#f4e8c8] border border-[#c9a44c]/40"
                      : "bg-amber-600 text-black"
                    : isL2
                      ? "bg-black/30 text-[#a89878] border border-[#5c4a32]/40"
                      : "bg-white/20 text-gray-300"
                }`}
              >
                {settings.largeFont ? t("on", lang) : t("off", lang)}
              </button>
            </div>
            <p className={isL2 ? "text-[10px] text-[#8a7a60] mt-1" : "text-[10px] text-gray-500 mt-1"}>{t("large_font_hint", lang)}</p>
          </div>

          <div className={cardClass}>
            <div className={`text-sm font-semibold mb-3 ${sectionTitle}`}>{t("mobs_section", lang)}</div>
            <p className={isL2 ? "text-[10px] text-[#8a7a60] mb-2" : "text-[10px] text-gray-500 mb-2"}>{t("mobs_hint", lang)}</p>
            <div className="flex flex-wrap gap-1">
              {MOBS_PER_PAGE_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => update({ mobsPerPage: n })}
                  className={`px-3 py-1.5 rounded text-xs font-medium ${
                    settings.mobsPerPage === n
                      ? isL2
                        ? "bg-gradient-to-b from-[#5c4a32] to-[#3d3224] text-[#f4e8c8] border border-[#c9a44c]/40"
                        : "bg-amber-600 text-black"
                      : isL2
                        ? "bg-black/30 text-[#a89878] border border-[#5c4a32]/40"
                        : "bg-white/20 text-gray-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <div className={`text-sm font-semibold mb-3 ${sectionTitle}`}>{t("exp_section", lang)}</div>
            <div className={`flex items-center justify-between py-2 ${rowBorder}`}>
              <span className="text-gray-200 text-xs">{t("exp_enabled", lang)}</span>
              <button
                onClick={() => update({ expEnabled: !settings.expEnabled })}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  settings.expEnabled !== false
                    ? isL2
                      ? "bg-gradient-to-b from-[#5c4a32] to-[#3d3224] text-[#f4e8c8] border border-[#c9a44c]/40"
                      : "bg-amber-600 text-black"
                    : isL2
                      ? "bg-black/30 text-[#a89878] border border-[#5c4a32]/40"
                      : "bg-white/20 text-gray-300"
                }`}
              >
                {settings.expEnabled !== false ? t("on", lang) : t("off", lang)}
              </button>
            </div>
            <p className={isL2 ? "text-[10px] text-[#8a7a60] mt-1" : "text-[10px] text-gray-500 mt-1"}>{t("exp_hint", lang)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
