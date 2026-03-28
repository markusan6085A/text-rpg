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
      <div className={isL2 ? "max-w-[420px] mx-auto w-full" : ""}>
        {/* Шапка */}
        <div
          className={
            isL2
              ? "mb-3 rounded-lg border border-[#5c4a32]/50 bg-[linear-gradient(180deg,rgba(40,32,20,0.55)_0%,rgba(10,8,6,0.92)_100%)] px-3 py-3 shadow-[inset_0_1px_0_rgba(199,173,128,0.12),0_8px_28px_rgba(0,0,0,0.45)]"
              : "mb-2 border-b border-[#c7ad80]/40 pb-2"
          }
        >
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => navigate("/inventory")}
              className={
                isL2
                  ? "shrink-0 text-[11px] text-[#c9a44c] hover:text-[#f4e2b8] underline-offset-2 hover:underline"
                  : "shrink-0 text-xs text-gray-400 hover:text-gray-200"
              }
            >
              ← Инвентарь
            </button>
            <div className="min-w-0 flex-1 text-right">
              <div
                className={
                  isL2
                    ? "text-[10px] uppercase tracking-[0.14em] text-[#8a7a60]"
                    : "text-[10px] text-gray-500 uppercase"
                }
              >
                Journal
              </div>
              <h1
                className={
                  isL2
                    ? "mt-0.5 text-[15px] font-semibold leading-tight text-[#e8c56e] [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]"
                    : "text-sm font-semibold text-[#ffd700]"
                }
              >
                Квесты персонажа
              </h1>
              <p className={isL2 ? "mt-1 text-[11px] text-[#a89878] leading-snug" : "mt-0.5 text-[11px] text-gray-400"}>
                {hero.name ?? "—"} · Lv. {hero.level ?? 1}
              </p>
            </div>
          </div>
          <p
            className={
              isL2
                ? "mt-2 text-[11px] text-[#c9baa5] border-t border-[#5c4a32]/35 pt-2 leading-relaxed"
                : "mt-2 text-[11px] text-gray-400"
            }
          >
            Сюжетные и региональные задания. Примите квест и следуйте целям на локации.
          </p>
        </div>

        {/* Контент квестів */}
        <div
          className={
            isL2
              ? "rounded-lg border border-[#5c4a32]/40 bg-black/22 px-2 py-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
              : ""
          }
        >
          <CharacterQuests />
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
