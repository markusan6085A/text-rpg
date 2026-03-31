import React from "react";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";
import { TVT_COIN_ICON } from "./tvtRewards";

type Props = {
  navigate: (path: string) => void;
};

/**
 * TvT Магазин — окрема сторінка; асортимент і ціна підключаться з API пізніше.
 */
export default function TvtShopScreen({ navigate }: Props) {
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const rowBtn =
    "w-full rounded-md border border-[#5c4a32]/75 bg-gradient-to-b from-[#2e2619] to-[#14110c] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] px-3 py-2.5 text-left text-[13px] text-[#d4c4a8] hover:border-[#c7ad80]/50 hover:brightness-110 transition-all";

  return (
    <div className={isL2 ? `${l2Frame} w-full min-w-0 my-1 p-2 sm:p-3` : "w-full px-3 py-4"}>
      <div
        className={
          isL2
            ? "border-b border-[#5c4a32]/45 px-2 py-2 text-center text-[11px] text-[#e8c56e] tracking-[0.12em] uppercase"
            : "border-b border-black/50 pb-2 mb-3 text-center text-[#f4e2b8]"
        }
      >
        TvT магазин
      </div>

      <div className={isL2 ? "px-2 py-3 text-[#a89878] text-[12px] leading-snug" : "text-gray-400 text-sm"}>
        Здесь будут товары за TvT-монеты. Цены и ассортимент появятся после подключения сервера.
      </div>

      <div className="mt-4 flex items-center gap-3 px-2 py-3 rounded-md border border-[#5c4a32]/40 bg-black/20">
        <img src={TVT_COIN_ICON} alt="" className="w-10 h-10 object-contain shrink-0 opacity-95" />
        <div className={isL2 ? "text-[12px] text-[#d4c4a8]" : "text-sm text-gray-300"}>
          Валюта магазина — <span className="text-[#e8c56e] font-semibold">TvT монеты</span> (иконка временная).
        </div>
      </div>

      <div className="mt-5 space-y-2 px-1">
        <button type="button" className={rowBtn} disabled>
          <span className="text-[#8a7a60]">Скоро: расходники и внешний вид</span>
        </button>
        <button type="button" className={rowBtn} disabled>
          <span className="text-[#8a7a60]">Скоро: скины и титулы</span>
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        <button
          type="button"
          onClick={() => navigate("/tvt")}
          className={
            isL2
              ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-[#1a1610]/80 text-[12px] text-[#c9a44c] hover:border-[#c7ad80]/35"
              : "px-4 py-2 rounded bg-gray-700 text-white text-sm"
          }
        >
          К TvT менеджеру
        </button>
        <button
          type="button"
          onClick={() => navigate("/city")}
          className={
            isL2
              ? "px-4 py-2 rounded-md border border-[#5c4a32]/45 text-[11px] text-[#8a7a60] hover:text-[#c9a44c]"
              : "px-4 py-2 rounded border border-gray-600 text-gray-400 text-sm"
          }
        >
          В город
        </button>
      </div>
    </div>
  );
}
