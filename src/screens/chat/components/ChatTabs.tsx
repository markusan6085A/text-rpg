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
    <div className="border-b border-gray-700">
      <div className="flex items-stretch">
        {tabs.map((tab, index, array) => (
          <React.Fragment key={tab.key}>
            <button
              onClick={() => {
                onChannelChange(tab.key);
                if (tab.key !== channel) {
                  setTimeout(() => onRefresh(), 0);
                }
              }}
              className={`flex-1 text-xs py-2 font-semibold transition-colors ${
                channel === tab.key
                  ? "bg-[#c7ad80] text-black"
                  : "bg-gray-800/90 text-gray-300 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
            {index < array.length - 1 && (
              <span className="w-px bg-gray-600 self-stretch" aria-hidden />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
