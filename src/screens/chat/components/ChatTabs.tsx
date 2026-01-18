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
    { key: "clan", label: "Клан" },
    { key: "private", label: "Мой" },
  ];

  return (
    <div className="border-t border-gray-600 border-b border-gray-600">
      <div className="flex">
        {tabs.map((tab, index, array) => (
          <React.Fragment key={tab.key}>
            <button
              onClick={() => {
                onChannelChange(tab.key);
                if (tab.key !== channel) {
                  setTimeout(() => onRefresh(), 0);
                }
              }}
              className={`flex-1 text-xs py-1 font-semibold transition-colors ${
                channel === tab.key
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
            {index < array.length - 1 && <span className="text-gray-600">|</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
