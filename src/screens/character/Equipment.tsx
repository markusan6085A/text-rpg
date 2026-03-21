import React from "react";
import { useHeroStore } from "../../state/heroStore";
import CharacterEquipmentFrame from "./CharacterEquipmentFrame";
import { getCityUiVariant } from "../../utils/cityUiVariant";

interface EquipmentProps {
  compact?: boolean; // Якщо true - компактний вигляд для Inventory
}

export default function Equipment({ compact = false }: EquipmentProps) {
  const hero = useHeroStore((s) => s.hero);
  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const btnL2 =
    "w-32 py-2 text-[11px] rounded-md border border-[#5c4a32]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-[#d4c4a8] shadow-[inset_0_1px_0_rgba(199,173,128,0.1)] hover:border-[#c7ad80]/45 hover:text-[#f4e2b8] active:scale-[0.99] transition-[border-color,color,transform] duration-150";
  const btnClassic =
    "w-20 py-1 text-[10px] bg-[#0f0a06] text-white border border-white/50 rounded-md";

  if (!hero) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex justify-center py-12 text-[#8a7a60] text-sm`
            : "text-white mt-6 text-center"
        }
      >
        {isL2 ? (
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin" />
            Загрузка...
          </span>
        ) : (
          "Загрузка..."
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-col items-center mb-4">
        <CharacterEquipmentFrame allowUnequip={true} marginTop="20px" />
      </div>
    );
  }

  if (isL2) {
    return (
      <div className={`${l2Frame} w-full min-w-0 my-1 flex flex-col items-center px-3 py-4 text-[#e8dcc8]`}>
        <div className="w-full max-w-[400px] mx-auto flex flex-col items-center relative pt-1">
          <button
            type="button"
            className="absolute top-0 right-0 z-10 text-[11px] px-2.5 py-1 rounded-md border border-red-900/50 bg-gradient-to-b from-[#3a1818] to-[#1c0c0c] text-red-200/90 hover:border-red-600/60 hover:brightness-110"
            onClick={() => (window.location.href = "/character")}
          >
            Назад
          </button>
          <div className="text-center text-[#e8c56e] font-bold text-lg mb-2 mt-6 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
            Снаряжение
          </div>
          <CharacterEquipmentFrame allowUnequip={true} marginTop="0" />
          <div className="flex justify-center mt-4 w-full gap-2 flex-wrap">
            <button type="button" className={btnL2} onClick={() => (window.location.href = "/inventory")}>
              Инвентарь
            </button>
            <button type="button" className={btnL2} onClick={() => (window.location.href = "/character")}>
              Персонаж
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center text-white">
      <div
        className="mt-4 rounded-xl border-2 flex flex-col items-center relative"
        style={{
          width: "360px",
          backgroundColor: "rgba(20, 12, 6, 0.9)",
          borderColor: "rgba(255,255,255,0.4)",
          paddingTop: "12px",
          paddingBottom: "12px",
        }}
      >
        <button
          type="button"
          className="absolute top-2 right-2 bg-red-600 text-white text-[12px] px-3 py-[2px] rounded-md"
          onClick={() => (window.location.href = "/character")}
        >
          Назад
        </button>

        <div className="text-center text-yellow-400 font-bold text-xl mb-1">
          Снаряжение
        </div>

        <CharacterEquipmentFrame allowUnequip={true} marginTop="0" />

        <div className="flex justify-center mt-3">
          <button
            type="button"
            className={`${btnClassic} bg-yellow-600 text-black w-32`}
            onClick={() => (window.location.href = "/inventory")}
          >
            Инвентарь
          </button>
        </div>

        <div className="flex justify-center mt-2">
          <button
            type="button"
            className={`${btnClassic} bg-yellow-600 text-black w-32`}
            onClick={() => (window.location.href = "/character")}
          >
            Персонаж
          </button>
        </div>
      </div>
    </div>
  );
}
