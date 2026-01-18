import React, { useState, useEffect, useRef } from "react";
import { postChatMessage, deleteChatMessage } from "../utils/api";
import type { ChatMessage } from "../utils/api";
import { useHeroStore } from "../state/heroStore";
import { useChatMessages } from "../hooks/useChatMessages";
import { updateDailyQuestProgress } from "../utils/dailyQuests/updateDailyQuestProgress";

// Types
import type { ChatProps, ChatChannel } from "./chat/types";

// Hooks
import { useOutbox, type OutboxMessage } from "./chat/hooks/useOutbox";
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
  const lastTradeMessageTimeRef = useRef<number>(0); // Rate limiting for trade channel

  // Reset page when channel changes
  useEffect(() => {
    setPage(1);
  }, [channel]);

  // Combine cached messages with outbox - newest first (top)
  // 🔥 Outbox показуємо ТІЛЬКИ на сторінці 1 - на інших сторінках тільки старі повідомлення
  const messages = React.useMemo(() => {
    const cachedIds = new Set(cachedMessages.map(m => m.id));
    const filteredCached = cachedMessages.filter(m => !deletedIds.has(m.id));
    
    if (page === 1) {
      // На сторінці 1 додаємо outbox (виключаємо ті, що вже є в кеші)
      const filteredOutbox = outbox.filter(optMsg => !cachedIds.has(optMsg.id));
      const maxCached = Math.max(0, 10 - filteredOutbox.length);
      const limitedCached = filteredCached.slice(0, maxCached);
      return [...filteredOutbox, ...limitedCached];
    } else {
      // На сторінках 2+ показуємо тільки кешовані повідомлення (старі)
      return filteredCached;
    }
  }, [cachedMessages, outbox, deletedIds, page]);

  // 🔥 Видаляємо з outbox повідомлення, які вже з'явились в кеші
  useEffect(() => {
    const cachedIds = new Set(cachedMessages.map(m => m.id));
    setOutbox((prev) => {
      const toRemove = prev.filter(outboxMsg => {
        // Якщо це реальне повідомлення (не temp) і воно в кеші - видаляємо
        if (!outboxMsg.id.startsWith('temp-') && cachedIds.has(outboxMsg.id)) {
          return false;
        }
        // Якщо це temp повідомлення зі статусом 'sent' - перевіряємо чи є в кеші за вмістом
        if (outboxMsg.id.startsWith('temp-') && outboxMsg.status === 'sent') {
          const foundInCache = cachedMessages.some(cached => 
            cached.message === outboxMsg.message && 
            cached.characterName === outboxMsg.characterName &&
            Math.abs(new Date(cached.createdAt).getTime() - new Date(outboxMsg.createdAt).getTime()) < 5000
          );
          return !foundInCache; // Залишаємо тільки якщо не знайдено в кеші
        }
        return true; // Залишаємо всі інші
      });
      if (toRemove.length !== prev.length) {
        return toRemove;
      }
      return prev;
    });
  }, [cachedMessages, setOutbox]);

  // Auto-scroll to top when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && outbox.length > 0) {
      setTimeout(() => {
        messagesTopRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages.length, outbox.length]);

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

    const optimisticMessage: OutboxMessage = {
      id: tempId,
      characterName: hero.name || hero.username || "You",
      channel,
      message: textToSend,
      createdAt: new Date().toISOString(),
      isOwn: true,
      status: 'pending', // Статус: очікує відправки
    };

    // Add to outbox immediately to prevent loss on F5
    setOutbox((prev) => [optimisticMessage, ...prev]);
    setMessageText("");

    try {
      await postChatMessage(channel, textToSend);

      // 🔥 Позначаємо як 'sent', але НЕ видаляємо з outbox ще
      // Видалимо тільки коли refresh() підтвердить, що повідомлення в кеші
      setOutbox((prev) => prev.map(m => m.id === tempId ? { ...m, status: 'sent' as const } : m));

      // Update daily quest progress
      const curHero = useHeroStore.getState().hero;
      if (curHero) {
        const updatedProgress = updateDailyQuestProgress(curHero, "daily_chat", 1);
        if (updatedProgress !== curHero.dailyQuestsProgress) {
          useHeroStore.getState().updateHero({ dailyQuestsProgress: updatedProgress });
        }
      }

      // 🔥 Оновлюємо кеш з API - це єдине джерело правди
      // Видалимо з outbox тільки коли повідомлення з'явиться в кеші (через useEffect)
      setTimeout(() => {
        refresh();
      }, 800);
    } catch (err: any) {
      console.error("Error sending message:", err);
      // При помилці залишаємо в outbox зі статусом 'pending' для повторної спроби
      setOutbox((prev) => prev.map(m => m.id === tempId ? { ...m, status: 'pending' as const } : m));
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

    const messageToDelete = [...outbox, ...cachedMessages].find(m => m.id === messageId);
    console.log('[chat] Message to delete:', {
      messageId,
      characterName: messageToDelete?.characterName,
      isOwn: messageToDelete?.isOwn,
    });

    // Optimistic update - remove immediately from UI
    setDeletedIds(prev => new Set([...prev, messageId]));
    // Also remove from outbox if it's there
    setOutbox(prev => prev.filter(m => m.id !== messageId));

    try {
      await deleteChatMessage(messageId);
      console.log('[chat] Message deleted successfully:', messageId);
      // Refresh cache after successful deletion
      setTimeout(() => refresh(), 500);
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
