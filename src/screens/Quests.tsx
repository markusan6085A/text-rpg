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
        {/* Шапка + ілюстрація 6.png + сюжетний підзаголовок */}
        <div
          className={
            isL2
              ? "mb-3 rounded-lg border border-[#5c4a32]/50 bg-[linear-gradient(180deg,rgba(48,38,22,0.75)_0%,rgba(12,10,8,0.96)_100%)] px-3 py-3 shadow-[inset_0_1px_0_rgba(199,173,128,0.14),0_8px_28px_rgba(0,0,0,0.45)]"
              : "mb-2 border-b border-[#c7ad80]/40 pb-2"
          }
        >
          <div className="flex gap-3 items-start">
            <div
              className={
                isL2
                  ? "relative shrink-0 rounded-lg border border-[#c7ad80]/35 bg-black/40 p-1 shadow-[inset_0_0_12px_rgba(0,0,0,0.65)]"
                  : "shrink-0 p-1 rounded border border-[#c7ad80]/40"
              }
            >
              <img
                src="/nps/6.png"
                alt="Квести"
                width={72}
                height={72}
                className="w-[72px] h-[72px] object-contain rounded-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/quest.png";
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div
                    className={
                      isL2
                        ? "text-[10px] uppercase tracking-[0.18em] text-[#b89a6a]"
                        : "text-[10px] text-gray-500 uppercase tracking-widest"
                    }
                  >
                    Сюжетний журнал
                  </div>
                  <h1
                    className={
                      isL2
                        ? "mt-1 text-[16px] font-semibold leading-tight text-[#f0d78c] [text-shadow:0_1px_4px_rgba(0,0,0,0.92),0_0_18px_rgba(184,134,11,0.25)]"
                        : "text-base font-semibold text-[#ffd700]"
                    }
                  >
                    Квести
                  </h1>
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
              <p
                className={
                  isL2
                    ? "mt-2 text-[11px] italic text-[#c4b49a] leading-relaxed [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
                    : "mt-2 text-[11px] italic text-[#d4c4a8]"
                }
              >
                Твій шлях складається з обітниць і битв. Кожен запис тут — ланка сюжету: регіональні доручення, нагороди
                та нагадування, куди йти далі.
              </p>
              <p className={isL2 ? "mt-1.5 text-[10px] text-[#8a7a60]" : "mt-1 text-[10px] text-gray-500"}>
                {hero.name ?? "—"} · рів. {hero.level ?? 1}
              </p>
            </div>
          </div>
        </div>

        {/* Контент квестів */}
        <div
          className={
            isL2
              ? "rounded-lg border border-[#5c4a32]/40 bg-black/22 px-2 py-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
              : ""
          }
        >
          <CharacterQuests embedInQuestPage />
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
