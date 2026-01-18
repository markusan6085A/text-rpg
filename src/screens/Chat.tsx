import React, { useState, useEffect, useRef } from "react";
import { postChatMessage, deleteChatMessage } from "../utils/api";
import type { ChatMessage } from "../utils/api";
import { useHeroStore } from "../state/heroStore";
import { useChatMessages } from "../hooks/useChatMessages";
import { updateDailyQuestProgress } from "../utils/dailyQuests/updateDailyQuestProgress";
import { getNickColorStyle } from "../utils/nickColor";

interface ChatProps {
  navigate: (path: string) => void;
}

type ChatChannel = "general" | "trade" | "clan" | "private";

export default function Chat({ navigate }: ChatProps) {
  const hero = useHeroStore((s) => s.hero);
  const [channel, setChannel] = useState<ChatChannel>("general");
  const [messageText, setMessageText] = useState("");
  const [page, setPage] = useState(1);
  // 🔥 Зберігаємо видалені ID в localStorage, щоб вони не відновлювались при оновленні сторінки
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`chat:deleted:${channel}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error('[chat] Failed to load deletedIds from localStorage:', e);
    }
    return new Set();
  });
  
  // Оновлюємо localStorage при зміні deletedIds
  useEffect(() => {
    try {
      const idsArray = Array.from(deletedIds);
      localStorage.setItem(`chat:deleted:${channel}`, JSON.stringify(idsArray));
    } catch (e) {
      console.error('[chat] Failed to save deletedIds to localStorage:', e);
    }
  }, [deletedIds, channel]);

  const deletingRef = useRef<Set<string>>(new Set()); // Захист від повторних DELETE
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const optimisticMessagesRef = useRef<ChatMessage[]>([]);
  
  // 🔥 Outbox - зберігаємо невідправлені повідомлення в localStorage
  const [outbox, setOutbox] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(`chat:outbox:${channel}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  
  // Зберігаємо outbox в localStorage при зміні
  useEffect(() => {
    try {
      localStorage.setItem(`chat:outbox:${channel}`, JSON.stringify(outbox));
    } catch (e) {
      console.error('[chat] Failed to save outbox to localStorage:', e);
    }
  }, [outbox, channel]);

  // Use optimized chat hook with caching - limit 10 per page, max 50 total
  // 🔥 manual: false - дозволяємо автоматичне завантаження при відсутності кешу
  const { messages: cachedMessages, loading, error, refresh } = useChatMessages({
    channel,
    page,
    limit: 10, // 10 messages per page
    cacheTtlMs: 30_000, // 30 seconds cache
    autoRefresh: false, // Вимкнено автооновлення
    manual: false, // 🔥 ДОЗВОЛЕНО автоматичне завантаження при відсутності кешу
  });

  // Clear optimistic messages when channel changes
  const currentChannelRef = useRef(channel);
  useEffect(() => {
    currentChannelRef.current = channel;
    console.log('[chat] Channel changed to:', channel);
    optimisticMessagesRef.current = [];
    // 🔥 Очищаємо deletedIds при зміні каналу (різні канали мають різні видалені ID)
    setDeletedIds(() => {
      try {
        const stored = localStorage.getItem(`chat:deleted:${channel}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          return new Set(Array.isArray(parsed) ? parsed : []);
        }
      } catch (e) {
        console.error('[chat] Failed to load deletedIds from localStorage:', e);
      }
      return new Set();
    });
    setPage(1); // Reset to first page when changing channels
    
    // 🔥 Завантажуємо outbox для нового каналу
    try {
      const raw = localStorage.getItem(`chat:outbox:${channel}`);
      const newOutbox = raw ? JSON.parse(raw) : [];
      setOutbox(newOutbox);
    } catch (e) {
      console.error('[chat] Failed to load outbox for channel:', e);
      setOutbox([]);
    }
  }, [channel]);

  // 🔥 ВИМКНЕНО автоматичний refresh при зміні сторінки - користувач сам клікає кнопки пагінації
  // useEffect для page видалено - refresh тільки по кнопці

  // Combine cached messages with optimistic updates - newest first (top)
  // 🔥 Outbox + Optimistic messages go to the top
  // Filter out deleted messages
  const optimisticIds = new Set([...optimisticMessagesRef.current, ...outbox].map(m => m.id));
  const filteredCached = cachedMessages.filter(m => !deletedIds.has(m.id) && !optimisticIds.has(m.id));
  
  // 🔥 Об'єднуємо outbox + optimistic (outbox перші, потім optimistic), потім cached
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = async () => {
    if (!messageText.trim() || !hero) return;
    
    const textToSend = messageText.trim();
    const tempId = `temp-${Date.now()}`;
    
    // 🔥 Optimistic update - show message immediately at the top
    const optimisticMessage: ChatMessage = {
      id: tempId,
      characterName: hero.name || hero.username || "You",
      channel,
      message: textToSend,
      createdAt: new Date().toISOString(),
      isOwn: true,
    };
    
    // 🔥 Додаємо в outbox одразу - це гарантує, що повідомлення не пропаде при F5
    setOutbox((prev) => [optimisticMessage, ...prev]);
    
    // Додаємо до існуючих optimistic messages, а не замінюємо
    optimisticMessagesRef.current = [optimisticMessage, ...optimisticMessagesRef.current.filter(m => m.id !== tempId)];
    
    // Clear input immediately for better UX
    setMessageText("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Send message in background (don't block UI)
      const realMessage = await postChatMessage(channel, textToSend);
      
      // 🔥 Прибираємо з outbox після успішної відправки
      setOutbox((prev) => prev.filter(m => m.id !== tempId));
      
      // 🔥 Замінюємо optimistic повідомлення на реальне
      optimisticMessagesRef.current = optimisticMessagesRef.current.map(m => 
        m.id === tempId ? realMessage : m
      );
      
      // Оновлюємо прогрес щоденних завдань: чат
      const curHero = useHeroStore.getState().hero;
      if (curHero) {
        const updatedProgress = updateDailyQuestProgress(curHero, "daily_chat", 1);
        if (updatedProgress !== curHero.dailyQuestsProgress) {
          useHeroStore.getState().updateHero({ dailyQuestsProgress: updatedProgress });
        }
      }
      
      // 🔥 Оновлюємо кеш з новим повідомленням, щоб воно не пропало при refresh
      // Використовуємо setTimeout, щоб дати час серверу зберегти повідомлення
      setTimeout(() => {
        refresh(); // Оновлюємо кеш з сервера, щоб отримати всі повідомлення включно з новим
      }, 500);
    } catch (err: any) {
      console.error("Error sending message:", err);
      // 🔥 При помилці залишаємо в outbox - можна буде спробувати ще раз
      // Remove optimistic message on error
      optimisticMessagesRef.current = optimisticMessagesRef.current.filter(m => m.id !== tempId);
      // Restore message text if sending failed
      setMessageText(textToSend);
    }
  };

  // Delete message - optimistic update, no confirmation
  // 🔥 Видалення працює тільки для своїх повідомлень в general/trade каналах
  const handleDeleteMessage = async (messageId: string) => {
    console.log('[chat] handleDeleteMessage called:', { messageId, channel });
    
    // Перевірка каналу на фронті (додаткова перевірка, основна на бекенді)
    if (channel !== "general" && channel !== "trade") {
      console.warn('[chat] Can only delete messages in general or trade channels');
      return;
    }

    // 🔥 Захист від повторних DELETE
    if (deletingRef.current.has(messageId)) {
      console.log('[chat] Delete already in progress for', messageId);
      return;
    }
    deletingRef.current.add(messageId);

    // Знаходимо повідомлення для діагностики
    const messageToDelete = [...optimisticMessagesRef.current, ...cachedMessages].find(m => m.id === messageId);
    console.log('[chat] Message to delete:', { 
      messageId, 
      characterName: messageToDelete?.characterName,
      isOwn: messageToDelete?.isOwn,
      characterId: messageToDelete?.characterId,
      heroName: hero?.name || hero?.username,
      heroId: hero?.id
    });

    // Optimistic update - remove immediately from UI
    setDeletedIds(prev => new Set([...prev, messageId]));
    
    // Remove from optimistic messages if it's there
    optimisticMessagesRef.current = optimisticMessagesRef.current.filter(m => m.id !== messageId);
    
    try {
      console.log('[chat] Sending DELETE request for:', messageId);
      const result = await deleteChatMessage(messageId);
      console.log('[chat] Message deleted successfully:', messageId, result);
      // Don't refresh immediately - optimistic update is enough
      // Message is already removed from UI via deletedIds
    } catch (err: any) {
      console.error("[chat] Error deleting message:", err);
      console.error("[chat] Error details:", {
        message: err?.message,
        status: err?.status,
        response: err?.response
      });
      
      // 🔥 Якщо помилка 404 (message not found) - не відновлюємо повідомлення
      // Це означає, що повідомлення вже видалено на сервері (можливо кимось іншим або раніше)
      const isNotFound = err?.message?.includes('404') || 
                         err?.message?.includes('message not found') || 
                         err?.message?.includes('not found');
      
      if (isNotFound) {
        console.log('[chat] Message not found (404) - assuming already deleted, keeping it removed from UI');
        // НЕ відновлюємо повідомлення - воно вже видалено
        // Не показуємо помилку користувачу - це нормальна ситуація
      } else {
        // Для інших помилок (403, 500) - відновлюємо повідомлення
        setDeletedIds(prev => {
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
        // Show error to user only for non-404 errors
        alert(err?.message || "Помилка видалення повідомлення");
      }
    } finally {
      // 🔥 Очищаємо захист після завершення
      deletingRef.current.delete(messageId);
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `[${hours}:${minutes}:${seconds}]`;
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
      {/* Tabs */}
      <div className="border-t border-gray-600 border-b border-gray-600">
        <div className="flex">
          {[
            { key: "general" as ChatChannel, label: "Общ" },
            { key: "trade" as ChatChannel, label: "Торг" },
            { key: "clan" as ChatChannel, label: "Клан" },
            { key: "private" as ChatChannel, label: "Мой" },
          ].map((tab, index, array) => (
            <React.Fragment key={tab.key}>
              <button
                onClick={() => {
                  setChannel(tab.key);
                  if (tab.key !== channel) {
                    // 🔥 Ручне оновлення при зміні каналу
                    setTimeout(() => refresh(), 0);
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

      {/* Messages area - scroll from top, newest messages at top */}
      <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
        <div ref={messagesTopRef} />
        {loading && messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">Загрузка...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">Нет сообщений</div>
        ) : (
          messages.map((msg, index) => (
            <React.Fragment key={msg.id}>
              <div className="text-xs leading-tight flex items-start gap-2 group">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      className="font-semibold cursor-pointer hover:opacity-80 transition-colors"
                      style={getNickColorStyle(msg.characterName, hero, msg.nickColor)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (msg.characterId) {
                          navigate(`/player/${msg.characterId}`);
                        } else if (msg.characterName) {
                          navigate(`/player/${msg.characterName}`);
                        }
                      }}
                    >
                      {msg.characterName}
                    </span>
                    <span className="text-green-400 cursor-pointer hover:text-green-300" onClick={() => setMessageText(`@${msg.characterName} `)}>[ответить]</span>
                  <span className="text-gray-400 cursor-pointer hover:text-gray-300" onClick={() => setMessageText(`@${msg.characterName}: ${msg.message}: `)}>(цитировать)</span>
                  <span className="text-gray-500">{formatTime(msg.createdAt)}</span>
                  {/* Delete button - only for own messages in general/trade channels */}
                  {(() => {
                    const heroName = hero.name || hero.username;
                    // Перевірка: isOwn === true АБО characterName збігається з ім'ям героя
                    const isOwnMessage = msg.isOwn === true || (heroName && msg.characterName?.toLowerCase() === heroName.toLowerCase());
                    const canDelete = isOwnMessage && (channel === "general" || channel === "trade");
                    
                    return canDelete ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(msg.id);
                        }}
                        className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 transition-opacity text-[10px] cursor-pointer"
                        title="Видалити"
                      >
                        [×]
                      </button>
                    ) : null;
                  })()}
                </div>
                  <div className={`mt-0.5 ${msg.channel === "trade" ? "text-yellow-400" : "text-white"}`}>{msg.message}</div>
                </div>
              </div>
              {index < messages.length - 1 && <div className="text-gray-600 text-center w-full">_ _ _-_ _ _ _</div>}
            </React.Fragment>
          ))
        )}
      </div>

      {/* Pagination - тільки цифри, < > якщо більше 3 сторінок */}
      <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
        {/* Показуємо < тільки якщо більше 1 сторінки і поточна сторінка > 1 */}
        {page > 1 && (
          <button
            onClick={() => {
              setPage(page - 1);
              messagesTopRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            disabled={loading}
            className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            &lt;
          </button>
        )}
        
        {/* Показуємо номери сторінок */}
        {(() => {
          const hasMore = messages.length >= 10; // Якщо 10 повідомлень, є ще сторінки
          const totalPages = hasMore ? page + 1 : page; // Орієнтовна кількість сторінок
          
          // Якщо 1-2 сторінки - показуємо всі
          if (totalPages <= 2) {
            return Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPage(p);
                  refresh(); // 🔥 Ручне оновлення при зміні сторінки
                  messagesTopRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                disabled={loading}
                className={`hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
                  page === p ? "text-white font-bold" : ""
                }`}
              >
                {p}
              </button>
            ));
          }
          
          // Якщо більше 2 сторінок - показуємо поточну та сусідні
          const pages: number[] = [];
          if (page === 1) {
            pages.push(1, 2, 3);
          } else if (page === totalPages) {
            pages.push(totalPages - 2, totalPages - 1, totalPages);
          } else {
            pages.push(page - 1, page, page + 1);
          }
          
          return pages.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPage(p);
                messagesTopRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              disabled={loading}
              className={`hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
                page === p ? "text-white font-bold" : ""
              }`}
            >
              {p}
            </button>
          ));
        })()}
        
        {/* Показуємо > тільки якщо є ще сторінки */}
        {messages.length >= 10 && (
          <button
            onClick={() => {
              setPage(page + 1);
              refresh(); // 🔥 Ручне оновлення при зміні сторінки
              messagesTopRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            disabled={loading}
            className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            &gt;
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="text-red-400 text-xs text-center">
          {error}
          <div className="text-[10px] text-gray-500 mt-1">
            Убедитесь, что backend сервер запущен и міграція бази даних виконана
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex flex-col">
        <div className="flex gap-2 justify-end mb-1">
          <button
            onClick={sendMessage}
            disabled={!messageText.trim() || loading}
            className="text-white text-xs font-medium hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Написать
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="text-gray-400 text-xs font-medium hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? "Завантаження..." : "Обновить"}
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value);
            // Auto-resize
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Введите сообщение..."
          className="w-full text-sm text-black placeholder-gray-500 resize-none overflow-hidden"
          style={{ minHeight: '20px', maxHeight: '200px' }}
          rows={1}
          maxLength={500}
        />
      </div>
    </div>
  );
}
