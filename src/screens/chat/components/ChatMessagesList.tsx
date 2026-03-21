import React from "react";
import type { ChatMessage } from "../../../utils/api";
import type { Hero } from "../../../types/Hero";
import type { ChatChannel } from "../types";
import { ChatMessageItem } from "./ChatMessageItem";
import { getCityUiVariant } from "../../../utils/cityUiVariant";

interface ChatMessagesListProps {
  messages: ChatMessage[];
  hero: Hero;
  channel: ChatChannel;
  loading: boolean;
  messagesTopRef: React.RefObject<HTMLDivElement>;
  onDelete: (messageId: string) => void;
  onReply: (text: string) => void;
  onNavigate: (path: string) => void;
  isAdmin?: boolean;
  onAdminDelete?: (messageId: string) => void;
  onMute?: (characterId: string, durationMinutes: number) => void;
}

export function ChatMessagesList({
  messages,
  hero,
  channel,
  loading,
  messagesTopRef,
  onDelete,
  onReply,
  onNavigate,
  isAdmin,
  onAdminDelete,
  onMute,
}: ChatMessagesListProps) {
  const isL2 = getCityUiVariant() === "l2";
  const emptyCls = isL2 ? "text-center text-[#8a7a60] text-sm py-4" : "text-center text-gray-400 text-sm py-4";
  return (
    <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
      <div ref={messagesTopRef} />
      {loading && messages.length === 0 ? (
        <div className={emptyCls}>Загрузка...</div>
      ) : messages.length === 0 ? (
        <div className={emptyCls}>Нет сообщений</div>
      ) : (
        messages.map((msg, index) => (
          <ChatMessageItem
            key={msg.id}
            msg={msg}
            index={index}
            totalMessages={messages.length}
            hero={hero}
            channel={channel}
            onDelete={onDelete}
            onReply={onReply}
            onNavigate={onNavigate}
            isAdmin={isAdmin}
            onAdminDelete={onAdminDelete}
            onMute={onMute}
          />
        ))
      )}
    </div>
  );
}
