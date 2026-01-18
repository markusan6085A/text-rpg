import React, { useState, useEffect, useRef } from "react";
import { postChatMessage, deleteChatMessage } from "../utils/api";
import type { ChatMessage } from "../utils/api";
import { useHeroStore } from "../state/heroStore";
import { useChatMessages } from "../hooks/useChatMessages";
import { updateDailyQuestProgress } from "../utils/dailyQuests/updateDailyQuestProgress";

// Types
import type { ChatProps, ChatChannel } from "./chat/types";

// Hooks
import { useOutbox } from "./chat/hooks/useOutbox";
import { useDeletedMessages } from "./chat/hooks/useDeletedMessages";

// Components
import { ChatTabs } from "./chat/components/ChatTabs";
import { ChatMessagesList } from "./chat/components/ChatMessagesList";
import { ChatPagination } from "./chat/components/ChatPagination";
import { ChatInput } from "./chat/components/ChatInput";

export default function Chat({ navigate }: ChatProps) {
  const hero = useHeroStore((s) => s.hero);
  const [channel, setChannel] = useState<ChatChannel>("general");
  const [messageText, setMessageText] = useState("");
  const [page, setPage] = useState(1);

  // Hooks
  const [deletedIds, setDeletedIds] = useDeletedMessages(channel);
  const [outbox, setOutbox] = useOutbox(channel);
  const { messages: cachedMessages, loading, error, refresh } = useChatMessages({
    channel,
    page,
    limit: 10,
    cacheTtlMs: 30_000,
    autoRefresh: false,
    manual: false,
  });

  // Refs
  const deletingRef = useRef<Set<string>>(new Set());
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const optimisticMessagesRef = useRef<ChatMessage[]>([]);
  const currentChannelRef = useRef(channel);
  const lastTradeMessageTimeRef = useRef<number>(0); // Rate limiting for trade channel

  // Clear optimistic messages and reload state when channel changes
  useEffect(() => {
    currentChannelRef.current = channel;
    console.log('[chat] Channel changed to:', channel);
    optimisticMessagesRef.current = [];

    // Reload deletedIds for new channel
    const stored = localStorage.getItem(`chat:deleted:${channel}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDeletedIds(new Set(Array.isArray(parsed) ? parsed : []));
      } catch (e) {
        console.error('[chat] Failed to load deletedIds:', e);
        setDeletedIds(new Set());
      }
    } else {
      setDeletedIds(new Set());
    }

    // Reload outbox for new channel
    try {
      const raw = localStorage.getItem(`chat:outbox:${channel}`);
      const newOutbox = raw ? JSON.parse(raw) : [];
      setOutbox(newOutbox);
    } catch (e) {
      console.error('[chat] Failed to load outbox:', e);
      setOutbox([]);
    }

    setPage(1);
  }, [channel, setDeletedIds, setOutbox]);

  // Combine cached messages with optimistic updates - newest first (top)
  const optimisticIds = new Set([...optimisticMessagesRef.current, ...outbox].map(m => m.id));
  const filteredCached = cachedMessages.filter(m => !deletedIds.has(m.id) && !optimisticIds.has(m.id));
  const optimisticAll = [...outbox, ...optimisticMessagesRef.current];
  const maxCached = Math.max(0, 10 - optimisticAll.length);
  const limitedCached = filteredCached.slice(0, maxCached);
  const messages = [...optimisticAll, ...limitedCached];

  // Auto-scroll to top when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && optimisticMessagesRef.current.length > 0) {
      setTimeout(() => {
        messagesTopRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages.length]);

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() || !hero) return;

    // 🔥 Rate limiting for trade channel: 5 seconds between messages
    if (channel === "trade") {
      const now = Date.now();
      const timeSinceLastMessage = now - lastTradeMessageTimeRef.current;
      if (timeSinceLastMessage < 5000) {
        const remainingSeconds = Math.ceil((5000 - timeSinceLastMessage) / 1000);
        alert(`В торг чаті можна писати не частіше ніж раз на 5 секунд. Зачекайте ще ${remainingSeconds} сек.`);
        return;
      }
      lastTradeMessageTimeRef.current = now;
    }

    const textToSend = messageText.trim();
    const tempId = `temp-${Date.now()}`;

    const optimisticMessage: ChatMessage = {
      id: tempId,
      characterName: hero.name || hero.username || "You",
      channel,
      message: textToSend,
      createdAt: new Date().toISOString(),
      isOwn: true,
    };

    // Add to outbox immediately to prevent loss on F5
    setOutbox((prev) => [optimisticMessage, ...prev]);
    optimisticMessagesRef.current = [optimisticMessage, ...optimisticMessagesRef.current.filter(m => m.id !== tempId)];
    setMessageText("");

    try {
      const realMessage = await postChatMessage(channel, textToSend);

      // 🔥 Remove from outbox after successful send
      setOutbox((prev) => prev.filter(m => m.id !== tempId));
      
      // 🔥 Замінюємо optimistic на реальне, але не викликаємо refresh, щоб уникнути дублікатів
      // Refresh буде викликатись автоматично при наступному запиті або при зміні каналу
      optimisticMessagesRef.current = optimisticMessagesRef.current.map(m =>
        m.id === tempId ? realMessage : m
      );

      // Update daily quest progress
      const curHero = useHeroStore.getState().hero;
      if (curHero) {
        const updatedProgress = updateDailyQuestProgress(curHero, "daily_chat", 1);
        if (updatedProgress !== curHero.dailyQuestsProgress) {
          useHeroStore.getState().updateHero({ dailyQuestsProgress: updatedProgress });
        }
      }

      // 🔥 Не викликаємо refresh відразу - це може спричинити дублікати
      // Повідомлення вже показано через optimistic update
    } catch (err: any) {
      console.error("Error sending message:", err);
      // 🔥 При помилці видаляємо з optimistic, але залишаємо в outbox для повторної спроби
      optimisticMessagesRef.current = optimisticMessagesRef.current.filter(m => m.id !== tempId);
      setMessageText(textToSend);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    console.log('[chat] handleDeleteMessage called:', { messageId, channel });

    if (channel !== "general" && channel !== "trade") {
      console.warn('[chat] Can only delete messages in general or trade channels');
      return;
    }

    if (deletingRef.current.has(messageId)) {
      console.log('[chat] Delete already in progress for', messageId);
      return;
    }
    deletingRef.current.add(messageId);

    const messageToDelete = [...optimisticMessagesRef.current, ...cachedMessages].find(m => m.id === messageId);
    console.log('[chat] Message to delete:', {
      messageId,
      characterName: messageToDelete?.characterName,
      isOwn: messageToDelete?.isOwn,
    });

    setDeletedIds(prev => new Set([...prev, messageId]));
    optimisticMessagesRef.current = optimisticMessagesRef.current.filter(m => m.id !== messageId);

    try {
      await deleteChatMessage(messageId);
      console.log('[chat] Message deleted successfully:', messageId);
    } catch (err: any) {
      console.error("[chat] Error deleting message:", err);

      const isNotFound = err?.message?.includes('404') ||
        err?.message?.includes('message not found') ||
        err?.message?.includes('not found');

      if (!isNotFound) {
        setDeletedIds(prev => {
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
        alert(err?.message || "Помилка видалення повідомлення");
      }
    } finally {
      deletingRef.current.delete(messageId);
    }
  };

  if (!hero) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-400">
        Загрузка персонажа...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full text-white">
      <ChatTabs
        channel={channel}
        onChannelChange={setChannel}
        onRefresh={refresh}
      />

      <ChatMessagesList
        messages={messages}
        hero={hero}
        channel={channel}
        loading={loading}
        messagesTopRef={messagesTopRef}
        onDelete={handleDeleteMessage}
        onReply={setMessageText}
        onNavigate={navigate}
      />

      <ChatPagination
        page={page}
        messagesCount={messages.length}
        loading={loading}
        onPageChange={setPage}
        onRefresh={refresh}
        messagesTopRef={messagesTopRef}
      />

      {error && (
        <div className="text-red-400 text-xs text-center">
          {error}
          <div className="text-[10px] text-gray-500 mt-1">
            Убедитесь, что backend сервер запущен и міграція бази даних виконана
          </div>
        </div>
      )}

      <ChatInput
        messageText={messageText}
        loading={loading}
        onMessageChange={setMessageText}
        onSend={sendMessage}
        onRefresh={refresh}
      />
    </div>
  );
}
