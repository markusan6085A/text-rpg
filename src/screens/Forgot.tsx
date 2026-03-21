import React from "react";
import { getCityUiVariant } from "../utils/cityUiVariant";

type Navigate = (p: string) => void;

export default function Forgot({ navigate }: { navigate: Navigate }) {
  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

  return (
    <div
      className={
        isL2
          ? "min-h-screen w-full flex items-start justify-center px-3 py-10 text-[#d4c4a8]"
          : "min-h-screen w-full flex items-start justify-center bg-transparent text-yellow-200"
      }
    >
      <div
        className={
          isL2
            ? `w-full max-w-[380px] mt-2 px-4 pt-6 pb-10 ${l2Frame}`
            : "w-full max-w-[380px] px-4 pt-6 pb-10 mt-8 rounded-[14px] border border-white/40 bg-[#1a1713]/95 shadow-[0_0_0_1px_#000_inset,0_2px_10px_rgba(0,0,0,0.6)]"
        }
      >
        <div
          className={
            isL2
              ? "text-center text-[22px] font-bold mb-4 text-[#e8c56e]"
              : "text-center text-[22px] font-bold mb-4"
          }
        >
          Відновлення пароля
        </div>
        <p
          className={
            isL2
              ? "text-center text-[15px] text-[#a89878] leading-relaxed px-2 mb-6"
              : "text-center text-[15px] text-yellow-100/90 leading-relaxed px-2 mb-6"
          }
        >
          Розділ у розробці. Тут пізніше з’явиться форма для відновлення доступу.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/")}
            className={
              isL2
                ? "px-5 py-[8px] text-[15px] font-semibold rounded-md border border-[#5c4a32]/55 bg-black/35 text-[#e8c56e] hover:bg-black/45 active:brightness-90 transition-all"
                : "px-5 py-[8px] text-[15px] font-semibold text-yellow-200 rounded-md shadow-md active:brightness-90 transition-all"
            }
            style={
              isL2
                ? undefined
                : {
                    backgroundImage: "url(/btn-small.jpg)",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    filter: "brightness(1.05)",
                  }
            }
          >
            Назад на головну
          </button>
        </div>
      </div>
    </div>
  );
}
