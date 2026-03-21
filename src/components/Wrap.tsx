import React from "react";
import { getCityUiVariant } from "../utils/cityUiVariant";

export default function Wrap({ children }: { children: React.ReactNode }) {
  const isL2 = getCityUiVariant() === "l2";
  return (
    <div
      className={
        isL2
          ? "min-h-screen bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(90,70,40,0.35)_0%,transparent_55%),linear-gradient(180deg,#12100c_0%,#0a0907_100%)] text-[#d4c4a8]"
          : "min-h-screen bg-[#0f0f0f] text-[#e5d9a8]"
      }
    >
      <div className="max-w-md mx-auto p-3">{children}</div>
    </div>
  );
}
