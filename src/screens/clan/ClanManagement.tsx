import React from "react";
import { type Clan } from "../../utils/api";

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
  return (
    <div className="space-y-3">
      {/* Емблема клану */}
      <div className="flex justify-center">
        <img
          src="/icons/clanns.png"
          alt="Клан"
          className="w-48 h-48 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/icons/clann.jpg";
          }}
        />
      </div>

      {/* Команди управління */}
      <div className="space-y-1 text-[12px]">
        <button
          onClick={onAnnouncement}
          className="w-full text-left px-2 py-1 text-[#c7ad80] hover:text-[#f4e2b8] transition-colors"
        >
          • Вывесить объявление
        </button>
        <button
          onClick={onEmblem}
          className="w-full text-left px-2 py-1 text-[#c7ad80] hover:text-[#f4e2b8] transition-colors"
        >
          • Эмблема клана
        </button>
        <button
          onClick={onAcademy}
          className="w-full text-left px-2 py-1 text-[#c7ad80] hover:text-[#f4e2b8] transition-colors"
        >
          • Создать академию
        </button>
        <button
          onClick={onLevelUp}
          className="w-full text-left px-2 py-1 text-[#c7ad80] hover:text-[#f4e2b8] transition-colors"
        >
          • Повысить уровень клана
        </button>
        <button
          onClick={onSkillTree}
          className="w-full text-left px-2 py-1 text-[#c7ad80] hover:text-[#f4e2b8] transition-colors"
        >
          • Древо умений
        </button>
        <button
          onClick={onDragonLair}
          className="w-full text-left px-2 py-1 text-[#c7ad80] hover:text-[#f4e2b8] transition-colors"
        >
          • Логово дракона
        </button>
      </div>
    </div>
  );
}
