import React from "react";
import { getCityUiVariant } from "../../utils/cityUiVariant";

type TabType = "chat" | "history" | "members" | "storage" | "management" | "quests";

interface ClanNavigationProps {
  activeTab: TabType;
  isLeader: boolean;
  onTabChange: (tab: TabType) => void;
  onDeleteClan: () => void;
  onManagementClick: () => void;
}

export default function ClanNavigation({
  activeTab,
  isLeader,
  onTabChange,
  onDeleteClan,
  onManagementClick,
}: ClanNavigationProps) {
  const isL2 = getCityUiVariant() === "l2";
  const sepT = isL2 ? "border-t border-[#5c4a32]/45" : "border-t border-white/50";
  const tabActive = isL2 ? "text-[#e8c56e]" : "text-[#f4e2b8]";
  const tabIdle = isL2 ? "text-[#c9a44c]" : "text-[#c7ad80]";
  const tabHover = isL2 ? "hover:text-[#e8c56e]" : "hover:text-[#f4e2b8]";

  return (
    <>
      <div className={sepT} />

      {/* Меню навігації */}
      <div className="space-y-1 text-[12px]">
        <div
          className={`cursor-pointer ${tabHover} ${
            activeTab === "chat" ? tabActive : tabIdle
          }`}
          onClick={() => onTabChange("chat")}
        >
          • Чат
        </div>
        <div
          className={`cursor-pointer ${tabHover} ${
            activeTab === "members" ? tabActive : tabIdle
          }`}
          onClick={() => onTabChange("members")}
        >
          • Участники
        </div>
        <div
          className={`cursor-pointer ${tabHover} ${
            activeTab === "history" ? tabActive : tabIdle
          }`}
          onClick={() => onTabChange("history")}
        >
          • История
        </div>
        <div
          className={`cursor-pointer ${tabHover} ${
            activeTab === "quests" ? tabActive : tabIdle
          }`}
          onClick={() => onTabChange("quests")}
        >
          • Квесты
        </div>
        <div
          className={`cursor-pointer ${tabHover} ${
            activeTab === "storage" ? tabActive : tabIdle
          }`}
          onClick={() => onTabChange("storage")}
        >
          • Склад
        </div>
        {isLeader && (
          <div className="pl-4 space-y-1">
            <div
              className={`cursor-pointer ${tabHover} ${
                activeTab === "management" ? tabActive : tabIdle
              }`}
              onClick={onManagementClick}
            >
              - Управление кланом
            </div>
            <div
              className="text-red-500 cursor-pointer hover:text-red-400"
              onClick={onDeleteClan}
            >
              - Удалить клан
            </div>
          </div>
        )}
      </div>

      <div className={sepT} />
    </>
  );
}
