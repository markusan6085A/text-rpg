import type { PropsWithChildren } from "react";
import { getCityUiVariant } from "../utils/cityUiVariant";

export default function Card({ children }: PropsWithChildren) {
  const isL2 = getCityUiVariant() === "l2";
  return (
    <div
      className={
        isL2
          ? "rounded-xl border border-[#5c4a32]/70 bg-gradient-to-b from-[#231e15]/95 to-[#100e0a]/95 p-4 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)]"
          : "rounded-2xl border border-yellow-900/40 bg-[#121212] p-4 shadow-inner"
      }
    >
      {children}
    </div>
  );
}
