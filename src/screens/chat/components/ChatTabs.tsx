import React from "react";
import type { ChatChannel } from "../types";
import { isWarmCityUi, getCityUiVariant } from "../../../utils/cityUiVariant";

interface ChatTabsProps {
  channel: ChatChannel;
  onChannelChange: (channel: ChatChannel) => void;
  onRefresh: () => void;
}

export function ChatTabs({ channel, onChannelChange, onRefresh }: ChatTabsProps) {
  const isL2 = isWarmCityUi(getCityUiVariant());
  const tabs: Array<{ key: ChatChannel; label: string }> = [
    { key: "general", label: "Общ" },
    { key: "trade", label: "Торг" },
    { key: "private", label: "Мой" },
    { key: "clan", label: "Клан" },
  ];

  return (
    <div className={isL2 ? "border-b border-[#5c4a32]/45" : "border-b border-white/50"}>
      <div className="flex items-center gap-0 text-xs py-2 px-1">
        {tabs.map((tab, index) => (
          <React.Fragment key={tab.key}>
            <button
              type="button"
              onClick={() => {
                onChannelChange(tab.key);
                if (tab.key !== channel) setTimeout(() => onRefresh(), 0);
              }}
              className={`bg-transparent border-none p-0 cursor-pointer transition-colors ${
                channel === tab.key
                  ? isL2
                    ? "text-[#e8c56e] font-semibold border-b-2 border-[#c9a44c] pb-0.5 -mb-px rounded-none"
                    : "text-white font-semibold"
                  : isL2
                    ? "text-[#a89470] hover:text-[#e8c56e] pb-0.5"
                    : "text-[#c7ad80] hover:text-[#d4c49a]"
              }`}
            >
              {tab.label}
            </button>
            {index < tabs.length - 1 && (
              <span className={isL2 ? "text-[#6a6048] px-0.5 select-none" : "text-[#c7ad80] px-0.5 select-none"}>
                |
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
