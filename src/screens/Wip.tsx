import React from "react";
import { getString } from "../state/persistence";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";

type GameUser = {
  username: string;
  [key: string]: any;
};

interface WipProps {
  navigate: (path: string) => void;
  user: GameUser | null;
  /** Якщо задано — показуємо цей заголовок замість `l2_last_feature` (наприклад прямий захід на /recipe-book). */
  featureTitle?: string;
}

const Wip: React.FC<WipProps> = ({ navigate, user, featureTitle }) => {
  const title = featureTitle ?? getString("l2_last_feature", "Раздел");
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Outer =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

  const goCity = () => {
    if (user) {
      navigate("/city");
    } else {
      navigate("/");
    }
  };

  const goMain = () => {
    navigate("/");
  };

  return (
    <div className="flex items-start justify-center px-3 py-6">
      <div className="w-full max-w-md">
        <div
          className={
            isL2
              ? `${l2Outer} overflow-hidden`
              : "rounded-[18px] border border-white/50 bg-gradient-to-b from-[#2b2015] via-[#19130d] to-[#0e0a07] shadow-[0_26px_80px_rgba(0,0,0,0.95)] overflow-hidden"
          }
        >
          <div
            className={
              isL2
                ? "bg-black/30 border-b border-[#5c4a32]/45 px-4 py-2 text-center text-[11px] text-[#e8c56e] tracking-[0.12em] uppercase"
                : "bg-[#20160f] border-b border-black/70 px-4 py-2 text-center text-[11px] text-[#f4e2b8] tracking-[0.12em] uppercase"
            }
          >
            Раздел в разработке
          </div>

          <div
            className={
              isL2
                ? "px-5 py-5 text-[#d4c4a8] text-[13px]"
                : "px-5 py-5 text-[#f4e2b8] text-[13px]"
            }
          >
            <div className={isL2 ? "mb-2 font-semibold text-[#e8c56e]" : "mb-2 font-semibold"}>{title}</div>
            <div className={isL2 ? "text-[12px] text-[#a89878] leading-snug" : "text-[12px] text-[#dcc79a] leading-snug"}>
              Этот раздел ещё находится в разработке. Позже здесь появится
              полноценный функционал, как в браузерной Lineage 2.
            </div>

            <div className={isL2 ? "mt-4 text-[12px] text-[#c9a44c]" : "mt-4 text-[12px] text-[#f4e2b8]"}>
              Текущий персонаж:{" "}
              {user ? (
                <span className="font-semibold text-[#e8dcc8]">{user.username}</span>
              ) : (
                <span className={isL2 ? "italic text-[#8a7a60]" : "italic text-[#c7ad80]"}>
                  не выполнен вход
                </span>
              )}
            </div>
          </div>

          <div
            className={
              isL2
                ? "px-4 py-3 bg-black/35 border-t border-[#5c4a32]/45 flex gap-2 text-[11px] text-[#d4c4a8]"
                : "px-4 py-3 bg-[#120d08] border-t border-black/80 flex gap-2 text-[11px] text-[#f4e2b8]"
            }
          >
            <button
              onClick={goCity}
              className={
                isL2
                  ? "flex-1 rounded-full bg-black/40 py-1.5 border border-[#5c4a32]/55 hover:bg-black/50 text-[#e8c56e]"
                  : "flex-1 rounded-full bg-[#20160f] py-1.5 border border-black/60 hover:bg-[#291c12]"
              }
            >
              В город
            </button>
            <button
              onClick={goMain}
              className={
                isL2
                  ? "flex-1 rounded-full bg-black/40 py-1.5 border border-[#5c4a32]/55 hover:bg-black/50 text-[#e8c56e]"
                  : "flex-1 rounded-full bg-[#20160f] py-1.5 border border-black/60 hover:bg-[#291c12]"
              }
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wip;
