import React, { useState, useEffect, useMemo } from "react";
import { getLetters, getLetter, deleteLetter, getOnlinePlayers, type Letter } from "../utils/api";
import { useHeroStore } from "../state/heroStore";
import WriteLetterModal from "../components/WriteLetterModal";
import { getNickColorStyle } from "../utils/nickColor";

interface MailProps {
  navigate: (path: string) => void;
}

interface Conversation {
  playerId: string;
  playerName: string;
  nickColor?: string;
  unreadCount: number;
  lastMessage: Letter;
  lastMessageTime: string;
}

export default function Mail({ navigate }: MailProps) {
  const hero = useHeroStore((s) => s.hero);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationLetters, setConversationLetters] = useState<Letter[]>([]);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id?: string; name?: string } | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlinePlayerIds, setOnlinePlayerIds] = useState<Set<string>>(new Set());

  const loadLetters = async () => {
    // Не блокуємо UI, якщо є дані - показуємо їх, а потім оновлюємо в фоні
    const isInitialLoad = letters.length === 0;
    if (isInitialLoad) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getLetters(page, 50);
      setLetters(data.letters || []);
      setTotal(data.total || 0);
      setUnreadCount(data.unreadCount || 0);
    } catch (err: any) {
      setError(err?.message || "Помилка завантаження листів");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Завантажуємо letters і online players паралельно
    const loadData = async () => {
      await Promise.all([
        loadLetters(),
        (async () => {
          try {
            const data = await getOnlinePlayers();
            const onlineIds = new Set(data.players?.map(p => p.id) || []);
            setOnlinePlayerIds(onlineIds);
          } catch (err: any) {
            console.error('[Mail] Failed to load online players:', err?.message || err);
          }
        })(),
      ]);
    };
    
    loadData();
  }, [page]);

  // Оновлюємо онлайн статус кожні 30 секунд (не блокує UI)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getOnlinePlayers();
        const onlineIds = new Set(data.players?.map(p => p.id) || []);
        setOnlinePlayerIds(onlineIds);
      } catch (err: any) {
        console.error('[Mail] Failed to refresh online players:', err?.message || err);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Групуємо листи по гравцях (переписки)
  const conversations = useMemo<Conversation[]>(() => {
    const convMap = new Map<string, Conversation>();
    
    letters.forEach((letter) => {
      const playerId = letter.fromCharacter.id;
      const playerName = letter.fromCharacter.name;
      
      if (!convMap.has(playerId)) {
        convMap.set(playerId, {
          playerId,
          playerName,
          nickColor: letter.fromCharacter.nickColor,
          unreadCount: 0,
          lastMessage: letter,
          lastMessageTime: letter.createdAt,
        });
      }
      
      const conv = convMap.get(playerId)!;
      if (!letter.isRead) {
        conv.unreadCount++;
      }
      if (new Date(letter.createdAt) > new Date(conv.lastMessageTime)) {
        conv.lastMessage = letter;
        conv.lastMessageTime = letter.createdAt;
      }
    });
    
    return Array.from(convMap.values()).sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }, [letters]);

  const loadConversationLetters = async (playerId: string) => {
    try {
      // Завантажуємо всі листи від цього гравця
      const allLetters = letters.filter(l => l.fromCharacter.id === playerId);
      setConversationLetters(allLetters.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
    } catch (err: any) {
      setError(err?.message || "Помилка завантаження переписки");
    }
  };

  const handleConversationClick = async (conv: Conversation) => {
    setSelectedConversation(conv);
    await loadConversationLetters(conv.playerId);
  };

  const handleReply = () => {
    if (selectedConversation) {
      setReplyingTo({ id: selectedConversation.playerId, name: selectedConversation.playerName });
      setShowWriteModal(true);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Вигляд переписки (історія листів)
  if (selectedConversation) {
    return (
      <div className="w-full flex flex-col items-center text-white px-3 py-4">
        <div className="w-full max-w-[360px]">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                setSelectedConversation(null);
                setConversationLetters([]);
              }}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Назад
            </button>
            <div className="text-lg font-bold text-[#87ceeb]">
              Почта | <span style={getNickColorStyle(selectedConversation.playerName, hero, selectedConversation.nickColor)}>{selectedConversation.playerName}</span>
            </div>
          </div>

          {/* Поле вводу та кнопка */}
          <div className="mb-3">
            <textarea
              className="w-full bg-[#0b0806] border border-[#5b4726] rounded px-2 py-1 text-sm text-white resize-none mb-2"
              placeholder="Введите сообщение..."
              rows={3}
            />
            <button
              onClick={handleReply}
              className="w-full bg-white text-black px-4 py-2 rounded text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Написать
            </button>
            <button
              onClick={loadLetters}
              className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm mt-2"
            >
              Обновить
            </button>
          </div>

          {/* Історія переписок */}
          <div className="space-y-1">
            {conversationLetters.map((letter) => (
              <div key={letter.id} className="border-b border-dotted border-gray-600 pb-1 mb-1">
                <div className="flex items-center justify-between mb-1">
                  <span 
                    className="font-semibold text-yellow-400 cursor-pointer hover:opacity-80 transition-colors"
                    style={getNickColorStyle(letter.fromCharacter.name, hero, letter.fromCharacter.nickColor)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (letter.fromCharacter.id) {
                        navigate(`/player/${letter.fromCharacter.id}`);
                      } else if (letter.fromCharacter.name) {
                        navigate(`/player/${letter.fromCharacter.name}`);
                      }
                    }}
                  >
                    {letter.fromCharacter.name}
                  </span>
                  <span className="text-gray-500 text-xs">{formatTime(letter.createdAt)}</span>
                </div>
                <div className="text-white text-sm">{letter.message}</div>
              </div>
            ))}
          </div>

          {/* Пагінація */}
          {conversations.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-white">
              <button className="hover:text-yellow-400 transition-colors">&lt;&lt;</button>
              <button className="hover:text-yellow-400 transition-colors">&lt;</button>
              <span className="font-bold">1</span>
              <button className="hover:text-yellow-400 transition-colors">&gt;</button>
              <button className="hover:text-yellow-400 transition-colors">&gt;&gt;</button>
            </div>
          )}

          {/* Внизу Общ | Торг */}
          <div className="text-center mt-4 text-yellow-400 text-sm">
            Общ | Торг
          </div>
        </div>

        {/* Модалка написання відповіді */}
        {showWriteModal && replyingTo && (
          <WriteLetterModal
            toCharacterId={replyingTo.id}
            toCharacterName={replyingTo.name}
            onClose={() => {
              setShowWriteModal(false);
              setReplyingTo(null);
            }}
            onSent={() => {
              setShowWriteModal(false);
              setReplyingTo(null);
              loadLetters();
              loadConversationLetters(selectedConversation!.playerId);
            }}
          />
        )}
      </div>
    );
  }

  // Головний список переписок
  return (
    <div className="w-full flex flex-col items-center text-white px-3 py-4">
      <div className="w-full max-w-[360px]">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold text-[#87ceeb]">Почта</div>
          <button
            onClick={() => setShowWriteModal(true)}
            className="text-green-400 hover:text-green-300 transition-colors text-sm font-bold"
          >
            Написать
          </button>
        </div>

        {/* Риска */}
        <div className="w-full h-px bg-gray-600 mb-3"></div>

        {/* Список переписок */}
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-4">Загрузка...</div>
        ) : error ? (
          <div className="text-center text-red-400 text-sm py-4">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">Нет переписок</div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.playerId}
                onClick={() => handleConversationClick(conv)}
                className="flex items-center justify-between p-2 border-b border-dotted border-gray-600 cursor-pointer hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-semibold text-yellow-400"
                      style={getNickColorStyle(conv.playerName, hero, conv.nickColor)}
                    >
                      {conv.playerName}
                    </span>
                    {onlinePlayerIds.has(conv.playerId) ? (
                      <span className="text-green-400 text-xs">[On]</span>
                    ) : (
                      <span className="text-gray-500 text-xs">[Off]</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-white text-sm">{conv.unreadCount || conversationLetters.length || 1}</span>
                  <span className="text-gray-500 text-xs">{formatTime(conv.lastMessageTime)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Пагінація */}
        {total > 50 && (
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-white">
            <button className="hover:text-yellow-400 transition-colors">&lt;&lt;</button>
            <button className="hover:text-yellow-400 transition-colors">&lt;</button>
            <span className="font-bold">{page}</span>
            <button className="hover:text-yellow-400 transition-colors">&gt;</button>
            <button className="hover:text-yellow-400 transition-colors">&gt;&gt;</button>
          </div>
        )}

        {/* Внизу Общ | Торг */}
        <div className="text-center mt-4 text-yellow-400 text-sm">
          Общ | Торг
        </div>
      </div>

      {/* Модалка написання нового листа */}
      {showWriteModal && !replyingTo && (
        <WriteLetterModal
          onClose={() => {
            setShowWriteModal(false);
          }}
          onSent={() => {
            setShowWriteModal(false);
            loadLetters();
          }}
        />
      )}
    </div>
  );
}
