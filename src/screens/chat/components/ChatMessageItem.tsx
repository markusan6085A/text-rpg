import React from "react";
import type { ChatMessage } from "../../../utils/api";
import type { Hero } from "../../../types/Hero";
import type { ChatChannel } from "../types";
import { formatTime } from "../utils";
import { PlayerNameWithEmblem } from "../../../components/PlayerNameWithEmblem";

interface ChatMessageItemProps {
  msg: ChatMessage;
  index: number;
  totalMessages: number;
  hero: Hero;
  channel: ChatChannel;
  onDelete: (messageId: string) => void;
  onReply: (text: string) => void;
  onNavigate: (path: string) => void;
}

export function ChatMessageItem({
  msg,
  index,
  totalMessages,
  hero,
  channel,
  onDelete,
  onReply,
  onNavigate,
}: ChatMessageItemProps) {
  const heroName = hero.name || hero.username;
  const isOwnMessage = msg.isOwn === true || (heroName && msg.characterName?.toLowerCase() === heroName.toLowerCase());
  const canDelete = isOwnMessage && (channel === "general" || channel === "trade");

  return (
    <React.Fragment>
      <div className="text-xs leading-tight flex items-start gap-2 group">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <PlayerNameWithEmblem
              playerName={msg.characterName}
              hero={hero}
              clan={msg.emblem && msg.emblem.trim() ? { emblem: msg.emblem } as any : null}
              nickColor={msg.nickColor || undefined}
              size={12}
              className="font-semibold cursor-pointer hover:opacity-80 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (msg.characterId) {
                  onNavigate(`/player/${msg.characterId}`);
                } else if (msg.characterName) {
                  onNavigate(`/player/${msg.characterName}`);
                }
              }}
            />
            <span
              className="text-green-400 cursor-pointer hover:text-green-300"
              onClick={() => onReply(`@${msg.characterName} `)}
            >
              [ответить]
            </span>
            <span
              className="text-gray-400 cursor-pointer hover:text-gray-300"
              onClick={() => onReply(`@${msg.characterName}: ${msg.message}: `)}
            >
              (цитировать)
            </span>
            <span className="text-gray-500">{formatTime(msg.createdAt)}</span>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(msg.id);
                }}
                className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 transition-opacity text-[10px] cursor-pointer"
                title="Видалити"
              >
                [×]
              </button>
            )}
          </div>
          <div className={`mt-0.5 ${msg.channel === "trade" ? "text-yellow-400" : "text-white"}`}>
            {msg.message}
          </div>
        </div>
      </div>
      {index < totalMessages - 1 && (
        <div className="text-gray-600 text-center w-full">_ _ _-_ _ _ _</div>
      )}
    </React.Fragment>
  );
}
