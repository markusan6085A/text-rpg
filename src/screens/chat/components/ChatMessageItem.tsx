import React from "react";
import type { ChatMessage } from "../../../utils/api";
import type { Hero } from "../../../types/Hero";
import type { ChatChannel } from "../types";
import { formatTime } from "../utils";
import { PlayerNameWithEmblem } from "../../../components/PlayerNameWithEmblem";
import { EmojiText } from "../../../components/EmojiText";
import { isWarmCityUi, getCityUiVariant } from "../../../utils/cityUiVariant";
import { adminOwnWriteTextStyle, isAdminCharacter, ADMIN_OWN_WRITE_TEXT_COLOR } from "../../../config/admin";

interface ChatMessageItemProps {
  msg: ChatMessage;
  index: number;
  totalMessages: number;
  hero: Hero;
  channel: ChatChannel;
  onDelete: (messageId: string) => void;
  onReply: (text: string) => void;
  onNavigate: (path: string) => void;
  isAdmin?: boolean;
  onAdminDelete?: (messageId: string) => void;
  onMute?: (characterId: string, durationMinutes: number) => void;
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
  isAdmin,
  onAdminDelete,
  onMute,
}: ChatMessageItemProps) {
  const isL2 = isWarmCityUi(getCityUiVariant());
  const heroName = hero.name || hero.username;
  const isOwnMessage = msg.isOwn === true || (heroName && msg.characterName?.toLowerCase() === heroName.toLowerCase());
  const canDelete = isOwnMessage && (channel === "general" || channel === "trade");
  const ownAdminWriteStyle = isOwnMessage ? adminOwnWriteTextStyle(hero.name || hero.username) : undefined;
  /** Текст повідомлень Existence — голубий для всіх глядачів (не лише для автора). */
  const messageBodyStyle =
    isAdminCharacter(msg.characterName) ? { color: ADMIN_OWN_WRITE_TEXT_COLOR } : ownAdminWriteStyle;

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
              size={16}
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
              className={
                isL2
                  ? "text-[#7d9b7a] cursor-pointer hover:text-[#a8c4a4]"
                  : "text-green-400 cursor-pointer hover:text-green-300"
              }
              onClick={() => onReply(`@${msg.characterName} `)}
            >
              [ответить]
            </span>
            <span
              className={
                isL2
                  ? "text-[#8a7a60] cursor-pointer hover:text-[#c9a44c]"
                  : "text-gray-400 cursor-pointer hover:text-gray-300"
              }
              onClick={() => onReply(`@${msg.characterName}: ${msg.message}: `)}
            >
              (цитировать)
            </span>
            <span className={isL2 ? "text-[#6a6048]" : "text-gray-500"}>{formatTime(msg.createdAt)}</span>
            {canDelete && !isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(msg.id);
                }}
                className={
                  isL2
                    ? "text-[#d4786a] opacity-0 group-hover:opacity-100 hover:text-[#e8a090] transition-opacity text-[10px] cursor-pointer"
                    : "text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 transition-opacity text-[10px] cursor-pointer"
                }
                title="Видалити"
              >
                [×]
              </button>
            )}
            {isAdmin && onAdminDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdminDelete(msg.id);
                }}
                className={
                  isL2
                    ? "text-[#d4786a] opacity-0 group-hover:opacity-100 hover:text-[#e8a090] transition-opacity text-[10px] cursor-pointer"
                    : "text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 transition-opacity text-[10px] cursor-pointer"
                }
                title="Видалити (адмін)"
              >
                [Видалити]
              </button>
            )}
            {isAdmin && onMute && msg.characterId && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMute(msg.characterId!, 10);
                }}
                className={
                  isL2
                    ? "text-[#c9a44c] opacity-0 group-hover:opacity-100 hover:text-[#e8c56e] transition-opacity text-[10px] cursor-pointer"
                    : "text-amber-400 opacity-0 group-hover:opacity-100 hover:text-amber-300 transition-opacity text-[10px] cursor-pointer"
                }
                title="Мут 10 хв"
              >
                [Mute 10 хв]
              </button>
            )}
          </div>
          <div
            className={`mt-0.5 ${
              messageBodyStyle
                ? ""
                : msg.channel === "trade"
                  ? isL2
                    ? "text-[#e8c56e]"
                    : "text-yellow-400"
                  : isL2
                    ? "text-[#e8dcc8]"
                    : "text-white"
            }`}
            style={messageBodyStyle}
          >
            <EmojiText>{msg.message}</EmojiText>
          </div>
        </div>
      </div>
      {index < totalMessages - 1 && (
        <div className={isL2 ? "text-[#5c4a32]/70 text-center w-full" : "text-gray-600 text-center w-full"}>
          _ _ _-_ _ _ _
        </div>
      )}
    </React.Fragment>
  );
}
