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
  // 🔥 Optimistic/outbox показуємо ТІЛЬКИ на сторінці 1 - на інших сторінках тільки старі повідомлення
  const cachedIds = new Set(cachedMessages.map(m => m.id));
  
  // Функція для перевірки чи два повідомлення однакові (по тексту, імені та часу)
  const isDuplicateMessage = (msg1: ChatMessage, msg2: ChatMessage): boolean => {
    if (msg1.id === msg2.id) return true;
    const timeDiff = Math.abs(new Date(msg1.createdAt).getTime() - new Date(msg2.createdAt).getTime());
    return msg1.message === msg2.message &&
           msg1.characterName === msg2.characterName &&
           msg1.channel === msg2.channel &&
           timeDiff < 5000; // 5 секунд толерантність
  };
  
  // Фільтруємо кешовані повідомлення (виключаємо видалені)
  const filteredCached = cachedMessages.filter(m => !deletedIds.has(m.id));
  
  // 🔥 На сторінці 1 додаємо optimistic/outbox, на інших сторінках - тільки кешовані
  if (page === 1) {
    // Фільтруємо optimistic/outbox (виключаємо ті, що вже є в кеші як реальні - за ID або за вмістом)
    const allOptimistic = [...outbox, ...optimisticMessagesRef.current];
    const filteredOptimistic = allOptimistic.filter(optMsg => {
      // Якщо ID вже є в кеші - це дублікат
      if (cachedIds.has(optMsg.id)) return false;
      
      // Перевіряємо чи є в кеші повідомлення з таким же вмістом (текст + ім'я + час)
      const isInCache = filteredCached.some(cachedMsg => isDuplicateMessage(optMsg, cachedMsg));
      return !isInCache;
    });
    
    const maxCached = Math.max(0, 10 - filteredOptimistic.length);
    const limitedCached = filteredCached.slice(0, maxCached);
    var messages = [...filteredOptimistic, ...limitedCached];
  } else {
    // На сторінках 2+ показуємо тільки кешовані повідомлення (старі)
    var messages = filteredCached;
  }

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

      // 🔥 Remove from outbox after successful send (both by tempId and by matching content)
      setOutbox((prev) => prev.filter(m => {
        // Видаляємо якщо ID співпадає АБО це те саме повідомлення (текст + час + characterName)
        if (m.id === tempId) return false;
        const timeDiff = Math.abs(new Date(m.createdAt).getTime() - new Date(realMessage.createdAt).getTime());
        if (m.message === realMessage.message && 
            m.characterName === realMessage.characterName && 
            timeDiff < 5000) {
          return false; // Це те саме повідомлення, видаляємо
        }
        return true;
      }));
      
      // 🔥 Замінюємо optimistic на реальне
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

      // 🔥 ОБОВ'ЯЗКОВО викликаємо refresh після успішної відправки, щоб оновити кеш
      // Це гарантує, що повідомлення буде в кеші при перезавантаженні сторінки
      setTimeout(() => {
        refresh();
      }, 1000);
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
