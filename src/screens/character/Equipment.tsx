import React from "react";
import { useHeroStore } from "../../state/heroStore";
import CharacterEquipmentFrame from "./CharacterEquipmentFrame";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../../utils/l2WarmLayoutClassNames";

interface EquipmentProps {
  /** Залишено для сумісності з Inventory; окремої сторінки /equipment більше немає */
  compact?: boolean;
}

/** Блок манекена й слотів екіпу — використовується всередині інвентаря */
export default function Equipment({ compact = true }: EquipmentProps) {
  const hero = useHeroStore((s) => s.hero);
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;

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
