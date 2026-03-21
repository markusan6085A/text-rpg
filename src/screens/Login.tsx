import React from "react";
import { getCityUiVariant } from "../utils/cityUiVariant";

/** Заглушка: основний вхід на Landing. Оформлено під той самий L2/classic, що й лендінг. */
export default function Login() {
  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.55)] bg-[radial-gradient(ellipse_100%_40%_at_50%_-10%,rgba(120,90,45,0.22)_0%,transparent_45%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const shell = isL2
    ? "min-h-[100dvh] flex items-center justify-center p-4 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(90,70,40,0.35)_0%,transparent_55%),linear-gradient(180deg,#12100c_0%,#0a0907_100%)] text-[#d4c4a8]"
    : "min-h-[100dvh] flex items-center justify-center p-4 text-white";

  return (
    <div className={shell}>
      <div className={isL2 ? `${l2Frame} p-6 text-center max-w-sm w-full` : "text-center max-w-sm"}>
        <p className={isL2 ? "text-[#d4c4a8] text-sm mb-4" : "text-gray-300 text-sm mb-4"}>
          Вхід здійснюється з головного екрана (нік і пароль).
        </p>
        <a
          href="/"
          className={
            isL2
              ? "inline-block py-2.5 px-5 rounded-md text-sm font-medium bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8c56e] hover:border-[#c7ad80]/50"
              : "inline-block px-4 py-2 rounded-lg bg-[#2c220f] border border-white/40 text-[#dec28e] text-sm"
          }
        >
          На головну
        </a>
      </div>
    </div>
  );
}
