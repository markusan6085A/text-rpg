import React from "react";
import type { ChatChannel } from "../types";

interface ChatTabsProps {
  channel: ChatChannel;
  onChannelChange: (channel: ChatChannel) => void;
  onRefresh: () => void;
}

export function ChatTabs({ channel, onChannelChange, onRefresh }: ChatTabsProps) {
  const tabs: Array<{ key: ChatChannel; label: string }> = [
    { key: "general", label: "Общ" },
    { key: "trade", label: "Торг" },
    { key: "private", label: "Мой" },
    { key: "clan", label: "Клан" },
  ];

  return (
    <div className="border-b border-white/50">
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
                channel === tab.key ? "text-white" : "text-[#c7ad80] hover:text-[#d4c49a]"
              }`}
            >
              {tab.label}
            </button>
            {index < tabs.length - 1 && (
              <span className="text-[#c7ad80] px-0.5 select-none">|</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
