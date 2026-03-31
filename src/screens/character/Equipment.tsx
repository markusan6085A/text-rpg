import React from "react";
import { useHeroStore } from "../../state/heroStore";
import CharacterEquipmentFrame from "./CharacterEquipmentFrame";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";

interface EquipmentProps {
  /** Залишено для сумісності з Inventory; окремої сторінки /equipment більше немає */
  compact?: boolean;
}

/** Блок манекена й слотів екіпу — використовується всередині інвентаря */
export default function Equipment({ compact = true }: EquipmentProps) {
  const hero = useHeroStore((s) => s.hero);
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

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

  return (
    <div className={`flex flex-col items-center ${compact ? "mb-4" : "mb-2"}`}>
      <CharacterEquipmentFrame allowUnequip={true} marginTop={compact ? "20px" : "8px"} />
    </div>
  );
}
