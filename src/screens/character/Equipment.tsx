import React from "react";
import { useHeroStore } from "../../state/heroStore";
import CharacterEquipmentFrame from "./CharacterEquipmentFrame";

interface EquipmentProps {
  compact?: boolean; // Якщо true - компактний вигляд для Inventory
}

export default function Equipment({ compact = false }: EquipmentProps) {
  const hero = useHeroStore((s) => s.hero);
  // Hero вже завантажений в App.tsx, не потрібно завантажувати тут

  if (!hero) return <div className="text-white mt-6">Загрузка...</div>;

  const btn =
    "w-20 py-1 text-[10px] bg-[#0f0a06] text-white border border-white/50 rounded-md";

  // Компактний вигляд для Inventory - використовуємо спільний компонент
  if (compact) {
    return (
      <div className="flex flex-col items-center mb-4">
        <CharacterEquipmentFrame allowUnequip={true} marginTop="20px" />
      </div>
    );
  }

  // Повний вигляд для окремої сторінки Equipment
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
          className="absolute top-2 right-2 bg-red-600 text-white text-[12px] px-3 py-[2px] rounded-md"
          onClick={() => (window.location.href = "/character")}
        >
          Назад
        </button>

        <div className="text-center text-yellow-400 font-bold text-xl mb-1">
          Снаряжение
        </div>

        <CharacterEquipmentFrame allowUnequip={true} marginTop="0" />

        {/* buttons */}
        <div className="flex justify-center mt-3">
          <button className={`${btn} bg-yellow-600 text-black w-32`} onClick={() => (window.location.href = "/inventory")}>
            Инвентарь
          </button>
        </div>

        <div className="flex justify-center mt-2">
          <button className={`${btn} bg-yellow-600 text-black w-32`} onClick={() => (window.location.href = "/character")}>
            Персонаж
          </button>
        </div>

      </div>
    </div>
  );
}
