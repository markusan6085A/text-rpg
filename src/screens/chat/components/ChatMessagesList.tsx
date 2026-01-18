import React from "react";
import type { ChatMessage } from "../../../utils/api";
import type { Hero } from "../../../types/Hero";
import type { ChatChannel } from "../types";
import { ChatMessageItem } from "./ChatMessageItem";

interface ChatMessagesListProps {
  messages: ChatMessage[];
  hero: Hero;
  channel: ChatChannel;
  loading: boolean;
  messagesTopRef: React.RefObject<HTMLDivElement>;
  onDelete: (messageId: string) => void;
  onReply: (text: string) => void;
  onNavigate: (path: string) => void;
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
}: ChatMessagesListProps) {
  return (
    <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
      <div ref={messagesTopRef} />
      {loading && messages.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-4">Загрузка...</div>
      ) : messages.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-4">Нет сообщений</div>
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
          />
        ))
      )}
    </div>
  );
}
