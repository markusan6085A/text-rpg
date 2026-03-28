// src/screens/Quests.tsx — окрема сторінка квестів персонажа (сюжет / регіон)
import React from "react";
import { useHeroStore } from "../state/heroStore";
import CharacterQuests from "./character/CharacterQuests";
import { getCityUiVariant } from "../utils/cityUiVariant";

type Navigate = (path: string) => void;

export default function QuestsScreen({ navigate }: { navigate: Navigate }) {
  const hero = useHeroStore((s) => s.hero);
  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const borderB = isL2 ? "border-b border-[#5c4a32]/45" : "border-b border-black/70";

  if (!hero) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center py-12 text-[#8a7a60] text-xs gap-2`
            : "w-full flex items-center justify-center text-xs text-gray-400"
        }
      >
        {isL2 && (
          <span className="w-4 h-4 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin shrink-0" />
        )}
        Загрузка персонажа...
      </div>
    );
  }

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#e8dcc8]`
          : "w-full text-[#f4e2b8] px-1 py-2"
      }
    >
      <div className={isL2 ? "max-w-[520px] mx-auto w-full" : ""}>
        {/* Як у TattooArtist: один великий NPC зліва від тексту там було image|text; тут text|image (іконка справа) */}
        <div className={`flex flex-row gap-3 sm:gap-4 md:gap-5 px-3 sm:px-4 py-4 ${borderB} items-start`}>
          <div className="flex-1 min-w-0 flex flex-col gap-3 text-left">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div
                  className={`text-left text-[11px] tracking-[0.14em] uppercase font-semibold ${
                    isL2 ? "text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]" : "text-[#ff8c00]"
                  }`}
                >
                  Квести
                </div>
                <p
                  className={
                    isL2
                      ? "mt-1 text-[10px] uppercase tracking-[0.12em] text-[#a89878]"
                      : "mt-1 text-[10px] text-gray-500 uppercase tracking-widest"
                  }
                >
                  Сюжетний журнал
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/inventory")}
                className={
                  isL2
                    ? "shrink-0 text-[10px] text-[#c9a44c] hover:text-[#f4e2b8] underline-offset-2 hover:underline"
                    : "shrink-0 text-[10px] text-gray-400 hover:text-gray-200"
                }
              >
                ← Инвент.
              </button>
            </div>
            <div className={`space-y-2.5 ${isL2 ? "text-[13px] leading-relaxed text-[#d4c4a8]" : "text-sm text-gray-200"}`}>
              <p className={isL2 ? "text-[#c9b99a]" : ""}>
                Твій шлях складається з обітниць і битв. Кожен запис тут — ланка сюжету: регіональні доручення, нагороди та
                нагадування, куди йти далі.
              </p>
              <p className={isL2 ? "text-[#a89878]" : "text-gray-400"}>
                {hero.name ?? "—"} · рів. {hero.level ?? 1}
              </p>
            </div>
          </div>

          <div
            className={
              isL2
                ? "shrink-0 w-[88px] sm:w-[120px] md:w-[180px]"
                : "shrink-0 w-[80px] sm:w-[100px]"
            }
          >
            <div
              className={
                isL2
                  ? "relative rounded-lg border border-[#5c4a32]/50 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(199,173,128,0.12)_0%,transparent_55%),linear-gradient(180deg,#1a1510_0%,#0c0a08_100%)] p-1.5 sm:p-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.08),0_8px_28px_rgba(0,0,0,0.55)]"
                  : "p-1 rounded border border-white/20 bg-black/30"
              }
            >
              <img
                src="/nps/6.png"
                alt="Квести"
                className="w-full h-auto max-h-[160px] sm:max-h-[220px] md:max-h-[280px] object-contain object-bottom drop-shadow-[0_6px_16px_rgba(0,0,0,0.65)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/quest.png";
                }}
              />
            </div>
          </div>
        </div>

        {/* Контент квестів */}
        <div
          className={
            isL2
              ? "mt-2 rounded-lg border border-[#5c4a32]/40 bg-black/22 px-2 py-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
              : "mt-2"
          }
        >
          <CharacterQuests embedInQuestPage navigate={navigate} />
        </div>

        <div className={isL2 ? "mt-3 flex justify-center" : "mt-2 flex justify-center"}>
          <button
            type="button"
            onClick={() => navigate("/character")}
            className={
              isL2
                ? "text-[11px] text-[#8a7a60] hover:text-[#d4c4a8] underline-offset-2 hover:underline"
                : "text-xs text-gray-500 hover:text-gray-300"
            }
          >
            Профиль персонажа
          </button>
        </div>
      </div>
    </div>
  );
}
