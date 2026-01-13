import React, { useState, useEffect, useRef } from "react";
import { getChatMessages, postChatMessage, type ChatMessage } from "../utils/api";
import { useHeroStore } from "../state/heroStore";

interface ChatProps {
  navigate: (path: string) => void;
}

type ChatChannel = "general" | "trade" | "clan" | "private";

export default function Chat({ navigate }: ChatProps) {
  const hero = useHeroStore((s) => s.hero);
  const [channel, setChannel] = useState<ChatChannel>("general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load messages
  const loadMessages = async (currentPage: number = 1, silent: boolean = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);
      const response = await getChatMessages(channel, currentPage, 50);
      setMessages(response.messages);
      setPage(currentPage);
      if (currentPage === 1) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (err: any) {
      console.error("Error loading messages:", err);
      // Only show error if not silent refresh
      if (!silent) {
        setError(err?.message || "Ошибка загрузки сообщений. Проверьте подключение к серверу.");
      }
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() || !hero) return;
    
    const textToSend = messageText.trim();
    // Clear input immediately for better UX
    setMessageText("");

    try {
      setError(null);
      setIsLoading(true);
      const response = await postChatMessage(channel, textToSend);
      // Reload messages to show new one
      await loadMessages(1, true);
    } catch (err: any) {
      console.error("Error sending message:", err);
      // Restore message text if sending failed
      setMessageText(textToSend);
      setError(err?.message || "Ошибка отправки сообщения. Убедитесь, что backend сервер запущен и таблица ChatMessage создана в базе данных.");
    } finally {
      setIsLoading(false);
    }
  };


  // Auto-refresh messages every 5 seconds (silent - doesn't block input)
  useEffect(() => {
    loadMessages(1, false); // Initial load with loading indicator

    autoRefreshRef.current = setInterval(() => {
      loadMessages(1, true); // Silent refresh - doesn't show loading or block input
    }, 5000); // Increased to 5 seconds

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [channel]);

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
    <div className="flex flex-col h-full w-full max-w-[380px] mx-auto bg-[#151515] text-white">
      {/* Tabs */}
      <div className="flex border-b border-[#3b2614] bg-[#1a1a1a]">
        {[
          { key: "general" as ChatChannel, label: "Общ" },
          { key: "trade" as ChatChannel, label: "Торг" },
          { key: "clan" as ChatChannel, label: "Клан" },
          { key: "private" as ChatChannel, label: "Мой" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setChannel(tab.key)}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-all ${
              channel === tab.key
                ? "bg-[#6a4b2b] text-white border-b-2 border-[#f4e2b8] shadow-sm"
                : "bg-transparent text-gray-400 hover:text-white hover:bg-[#2a231a]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {isLoading && messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">Загрузка...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">Нет сообщений</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-xs leading-relaxed">
              <span className="text-white font-semibold">{msg.characterName}</span>
              <span className="text-gray-500 ml-1">({msg.characterLevel})</span>
              <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-300" onClick={() => setMessageText(`@${msg.characterName} `)}>[ответить]</span>
              <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-300" onClick={() => setMessageText(`@${msg.characterName}: ${msg.message} `)}>(цитировать)</span>
              <span className="text-gray-500 ml-2">{formatTime(msg.createdAt)}</span>
              <div className="text-gray-200 mt-0.5">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="px-2 py-1 text-red-400 text-xs text-center bg-red-900/20 border-t border-red-800/30">
          {error}
          <div className="text-[10px] text-gray-500 mt-1">
            Убедитесь, что backend сервер запущен и міграція бази даних виконана
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-[#3b2614] p-2 space-y-2 bg-[#1a1a1a]">
        <input
          type="text"
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Введите сообщение..."
          className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#3b2614] rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#6f5a35]"
          maxLength={500}
          autoFocus={false}
          disabled={false}
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={sendMessage}
            disabled={!messageText.trim() || isLoading}
            className="px-4 py-1.5 bg-[#6a4b2b] text-white rounded text-sm font-medium hover:bg-[#7a5b3b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Написать
          </button>
          <button
            onClick={() => loadMessages(1, false)}
            disabled={isLoading}
            className="px-4 py-1.5 bg-[#3b2614] text-gray-300 rounded text-sm font-medium hover:bg-[#4b3624] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Обновить
          </button>
        </div>
      </div>

      {/* Pagination */}
      {messages.length > 0 && (
        <div className="border-t border-[#3b2614] p-2 text-center text-xs text-gray-400">
          <button
            onClick={() => {
              const newPage = Math.max(1, page - 1);
              loadMessages(newPage);
            }}
            disabled={page <= 1}
            className="px-2 py-1 disabled:opacity-50"
          >
            &lt;&lt;&lt;
          </button>
          <span className="mx-4">Страница {page}</span>
          <button
            onClick={() => {
              const newPage = page + 1;
              loadMessages(newPage);
            }}
            disabled={messages.length < 50}
            className="px-2 py-1 disabled:opacity-50"
          >
            &gt;&gt;&gt;
          </button>
        </div>
      )}
    </div>
  );
}
