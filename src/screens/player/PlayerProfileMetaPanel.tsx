import React from "react";
import type { Character } from "../../utils/api";

export function PlayerProfileMetaPanel(props: {
  isL2: boolean;
  professionLabel: string;
  character: Character;
  premiumActive: boolean;
  premiumTime: string | null;
  karma: number;
  pk: number;
  mobsKilled: number;
  pvpWins: number;
  pvpLosses: number;
  giftsCount: number;
  profileLocationLabel: string;
  formatLastSeen: (dateString?: string) => string;
}) {
  const {
    isL2,
    professionLabel,
    character,
    premiumActive,
    premiumTime,
    karma,
    pk,
    mobsKilled,
    pvpWins,
    pvpLosses,
    giftsCount,
    profileLocationLabel,
    formatLastSeen,
  } = props;

  return (
    <div
      className={`space-y-2 text-[11px] border-t border-solid pt-3 ${
        isL2 ? "text-[#a89878] border-[#5c4a32]/45" : "text-gray-300 border-white/50"
      }`}
    >
      <div
        className={
          isL2
            ? "rounded-lg border border-[#5c4a32]/50 bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(90,70,40,0.2)_0%,transparent_55%),linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.15)_100%)] p-2.5 space-y-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
            : "rounded-lg border border-white/20 bg-white/5 p-2.5 space-y-2"
        }
      >
        <div className="flex justify-between items-baseline gap-2">
          <span className={isL2 ? "text-[#c9a44c]" : "text-amber-200"}>Профессия</span>
          <span className={`font-semibold ${isL2 ? "text-[#f0d78c]" : "text-yellow-300"}`}>
            {professionLabel}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span className={isL2 ? "text-[#8ebf88]" : "text-lime-300"}>Адена</span>
          <span
            className={`tabular-nums font-semibold ${isL2 ? "text-[#e8dcc8]" : "text-white"}`}
            title={`${Number(character.adena ?? 0)}`}
          >
            {Number(character.adena ?? 0).toLocaleString("ru-RU")}
          </span>
        </div>
      </div>

      {premiumActive && premiumTime && (
        <div className="flex justify-between">
          <span>Будет активен ещ премиум:</span>
          <span className="text-green-300">{premiumTime}</span>
        </div>
      )}

      <div
        className={`border-t border-solid pt-2 mt-2 ${isL2 ? "border-[#5c4a32]/40" : "border-white/50"}`}
      >
        <div className="font-semibold mb-1">Социальный статус</div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex justify-between">
            <span>Карма</span>
            <span className={karma >= 0 ? "text-green-400" : "text-red-400"}>{karma}</span>
          </div>
          <div className="flex justify-between">
            <span>Рек.</span>
            <span>0</span>
          </div>
          <div className="flex justify-between">
            <span>PK</span>
            <span
              className={
                pk === 0
                  ? isL2
                    ? "text-[#7d9b7a]"
                    : "text-green-400"
                  : isL2
                    ? "text-[#d4786a]"
                    : "text-red-400"
              }
            >
              {pk}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Убил мобов</span>
            <span>{mobsKilled}</span>
          </div>
        </div>
      </div>

      <div className={`border-t border-solid pt-2 ${isL2 ? "border-[#5c4a32]/40" : "border-white/50"}`}>
        <div className="flex justify-between text-[10px]">
          <span>PvP побед/поражений</span>
          <span className={pvpWins > pvpLosses ? "text-green-400" : "text-gray-400"}>
            {pvpWins}/{pvpLosses}
          </span>
        </div>
      </div>

      <div className={`border-t border-solid pt-2 ${isL2 ? "border-[#5c4a32]/40" : "border-white/50"}`}>
        <div className="flex justify-between text-[10px]">
          <span>Подарки</span>
          <span>({giftsCount})</span>
        </div>
        {giftsCount === 0 && <div className="text-gray-500 text-[10px] mt-1">Подарков нет...</div>}
      </div>

      <div className={`border-t border-solid pt-2 ${isL2 ? "border-[#5c4a32]/40" : "border-white/50"}`}>
        <div
          className={
            isL2 ? "text-[11px] leading-snug text-[#d4c4a8] px-1" : "text-[11px] leading-snug text-gray-200 px-1"
          }
        >
          <span className={isL2 ? "text-[#8a7a60]" : "text-gray-400"}>Локация: </span>
          <span className="font-medium">
            {profileLocationLabel.trim()
              ? `В ${profileLocationLabel}`
              : isL2
                ? "не зафіксована (гравець у місті або дані ще не збережені)"
                : "неизвестна"}
          </span>
        </div>
      </div>

      {character.createdAt && (
        <div className={`border-t border-solid pt-2 ${isL2 ? "border-[#5c4a32]/40" : "border-white/50"}`}>
          <div className={isL2 ? "text-[10px] text-[#8a7a60]" : "text-[10px] text-gray-400"}>
            Рег-я: {formatLastSeen(character.createdAt)}
          </div>
        </div>
      )}
    </div>
  );
}
