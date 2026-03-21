import React from "react";
import { type Clan } from "../../utils/api";
import { getCityUiVariant } from "../../utils/cityUiVariant";

interface ClanManagementProps {
  clan: Clan;
  onAnnouncement: () => void;
  onEmblem: () => void;
  onAcademy: () => void;
  onLevelUp: () => void;
  onSkillTree: () => void;
  onDragonLair: () => void;
}

export default function ClanManagement({
  clan,
  onAnnouncement,
  onEmblem,
  onAcademy,
  onLevelUp,
  onSkillTree,
  onDragonLair,
}: ClanManagementProps) {
  const isL2 = getCityUiVariant() === "l2";
  const btnCls = isL2
    ? "w-full text-left px-2 py-1 text-[#c9a44c] hover:text-[#e8c56e] transition-colors"
    : "w-full text-left px-2 py-1 text-[#c7ad80] hover:text-[#f4e2b8] transition-colors";

  return (
    <div className="space-y-3">
      {/* Команди управління */}
      <div className="space-y-1 text-[12px]">
        <button onClick={onAnnouncement} className={btnCls}>
          • Вывесить объявление
        </button>
        <button onClick={onEmblem} className={btnCls}>
          • Эмблема клана
        </button>
        <button onClick={onAcademy} className={btnCls}>
          • Создать академию
        </button>
        <button onClick={onLevelUp} className={btnCls}>
          • Повысить уровень клана
        </button>
        <button onClick={onSkillTree} className={btnCls}>
          • Древо умений
        </button>
        <button onClick={onDragonLair} className={btnCls}>
          • Логово дракона
        </button>
      </div>
    </div>
  );
}
