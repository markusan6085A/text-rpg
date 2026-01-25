import React from "react";

type TabType = "chat" | "history" | "members" | "storage";

interface ClanNavigationProps {
  activeTab: TabType;
  isLeader: boolean;
  onTabChange: (tab: TabType) => void;
  onDeleteClan: () => void;
}

export default function ClanNavigation({
  activeTab,
  isLeader,
  onTabChange,
  onDeleteClan,
}: ClanNavigationProps) {
  return (
    <>
      <div className="border-t border-gray-600"></div>

      {/* Меню навігації */}
      <div className="space-y-1 text-[12px]">
        <div
          className={`cursor-pointer hover:text-[#f4e2b8] ${
            activeTab === "chat" ? "text-[#f4e2b8]" : "text-[#c7ad80]"
          }`}
          onClick={() => onTabChange("chat")}
        >
          • Чат
        </div>
        <div
          className={`cursor-pointer hover:text-[#f4e2b8] ${
            activeTab === "members" ? "text-[#f4e2b8]" : "text-[#c7ad80]"
          }`}
          onClick={() => onTabChange("members")}
        >
          • Участники
        </div>
        <div
          className={`cursor-pointer hover:text-[#f4e2b8] ${
            activeTab === "history" ? "text-[#f4e2b8]" : "text-[#c7ad80]"
          }`}
          onClick={() => onTabChange("history")}
        >
          • История
        </div>
        <div
          className={`cursor-pointer hover:text-[#f4e2b8] ${
            activeTab === "storage" ? "text-[#f4e2b8]" : "text-[#c7ad80]"
          }`}
          onClick={() => onTabChange("storage")}
        >
          • Склад
        </div>
        {isLeader && (
          <div className="pl-4 space-y-1">
            <div className="text-[#c7ad80]">- Управление кланом</div>
            <div
              className="text-red-500 cursor-pointer hover:text-red-400"
              onClick={onDeleteClan}
            >
              - Удалить клан
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-600"></div>
    </>
  );
}
