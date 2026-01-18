import React, { useState, useEffect, useMemo } from "react";
import { getLetters, getLetter, deleteLetter, getOnlinePlayers, sendLetter, getConversationLetters, getUnreadCount, type Letter } from "../utils/api";
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
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationTotal, setConversationTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlinePlayerIds, setOnlinePlayerIds] = useState<Set<string>>(new Set());
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

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

  const loadConversationLetters = async (playerId: string, pageNum: number = conversationPage) => {
    try {
      // 🔥 Завантажуємо листи з переписки (вхідні + вихідні) через API з пагінацією
      const data = await getConversationLetters(playerId, pageNum, 10);
      setConversationLetters(data.letters || []);
      setConversationTotal(data.total || 0);
      setConversationPage(pageNum);
      
      // Оновлюємо unreadCount після завантаження (листи вже позначені як прочитані на сервері)
      const updatedCount = await getUnreadCount();
      setUnreadCount(updatedCount.unreadCount || 0);
    } catch (err: any) {
      console.error("Error loading conversation:", err);
      setError(err?.message || "Помилка завантаження переписки");
    }
  };

  const handleConversationClick = async (conv: Conversation) => {
    setSelectedConversation(conv);
    setConversationPage(1); // Скидаємо на першу сторінку при відкритті
    await loadConversationLetters(conv.playerId, 1);
    
    // Позначаємо локально для швидкого відображення
    setLetters(prev => prev.map(letter => 
      letter.fromCharacter.id === conv.playerId && !letter.isRead
        ? { ...letter, isRead: true }
        : letter
    ));
  };

  const handleSendReply = async () => {
    if (!selectedConversation || !replyMessage.trim()) return;
    
    setSendingReply(true);
    try {
      await sendLetter({
        toCharacterId: selectedConversation.playerId,
        toCharacterName: selectedConversation.playerName,
        subject: "",
        message: replyMessage.trim(),
      });
      setReplyMessage("");
      await loadLetters();
      await loadConversationLetters(selectedConversation.playerId, conversationPage);
      
      // Оновлюємо unreadCount
      const updatedCount = await getUnreadCount();
      setUnreadCount(updatedCount.unreadCount || 0);
    } catch (err: any) {
      console.error("Error sending reply:", err);
      alert(err?.message || "Помилка відправки повідомлення");
    } finally {
      setSendingReply(false);
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
        <div className="w-full max-w-[360px] border border-[#5b4726] rounded-lg p-4 bg-[#1a0b0b]/30">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                setSelectedConversation(null);
                setConversationLetters([]);
              }}
              className="text-gray-400 hover:text-white transition-colors text-[7px]"
            >
              ← Назад
            </button>
            <div className="text-[9px] font-bold text-[#87ceeb]">
              Почта | <span style={getNickColorStyle(selectedConversation.playerName, hero, selectedConversation.nickColor)}>{selectedConversation.playerName}</span>
            </div>
          </div>

          {/* Поле вводу та кнопки */}
          <div className="mb-3">
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="w-full bg-[#0b0806] border border-[#5b4726] rounded px-2 py-1 text-[7px] text-white resize-none mb-2"
              placeholder="Введіть повідомлення..."
              rows={3}
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <button
                onClick={handleSendReply}
                disabled={!replyMessage.trim() || sendingReply}
                className="text-green-400 hover:text-green-300 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingReply ? "Відправка..." : "Відправити"}
              </button>
              <button
                onClick={loadLetters}
                className="text-yellow-400 hover:text-yellow-300 transition-colors text-[7px]"
              >
                Оновити
              </button>
            </div>
          </div>

          {/* Історія переписок */}
          <div className="space-y-1">
            {conversationLetters.map((letter) => {
              const isOwn = letter.isOwn || false;
              const displayName = isOwn ? (hero?.name || hero?.username || "Ви") : letter.fromCharacter.name;
              const displayNickColor = isOwn ? hero?.nickColor : letter.fromCharacter.nickColor;
              
              return (
                <div key={letter.id} className="border-b border-dotted border-gray-600 pb-1 mb-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-semibold text-yellow-400 cursor-pointer hover:opacity-80 transition-colors text-[10px]"
                        style={getNickColorStyle(displayName, hero, displayNickColor)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOwn && letter.fromCharacter.id) {
                            navigate(`/player/${letter.fromCharacter.id}`);
                          } else if (!isOwn && letter.fromCharacter.name) {
                            navigate(`/player/${letter.fromCharacter.name}`);
                          }
                        }}
                      >
                        {displayName}
                      </span>
                      {/* Показуємо "непрочитано" тільки для відправлених листів, які не прочитані */}
                      {isOwn && !letter.isRead && (
                        <span className="text-red-400 text-[8px]">непрочитано</span>
                      )}
                    </div>
                    <span className="text-gray-500 text-[9px]">{formatTime(letter.createdAt)}</span>
                  </div>
                  <div className="text-white text-[10px]">{letter.message}</div>
                </div>
              );
            })}
          </div>

          {/* Пагінація для переписки */}
          {conversationTotal > 10 && (
            <div className="flex items-center justify-center gap-2 mt-4 text-[6px] text-white">
              <button 
                onClick={() => loadConversationLetters(selectedConversation.playerId, 1)}
                disabled={conversationPage === 1}
                className="hover:text-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;&lt;
              </button>
              <button 
                onClick={() => loadConversationLetters(selectedConversation.playerId, conversationPage - 1)}
                disabled={conversationPage === 1}
                className="hover:text-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;
              </button>
              <span className="font-bold">{conversationPage}</span>
              <button 
                onClick={() => loadConversationLetters(selectedConversation.playerId, conversationPage + 1)}
                disabled={conversationPage * 10 >= conversationTotal}
                className="hover:text-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &gt;
              </button>
              <button 
                onClick={() => loadConversationLetters(selectedConversation.playerId, Math.ceil(conversationTotal / 10))}
                disabled={conversationPage * 10 >= conversationTotal}
                className="hover:text-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &gt;&gt;
              </button>
            </div>
          )}

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
      <div className="w-full max-w-[360px] border border-[#5b4726] rounded-lg p-4 bg-[#1a0b0b]/30">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-[9px] font-bold text-[#87ceeb]">Почта</div>
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
          <div className="text-center text-gray-400 text-[7px] py-4">Загрузка...</div>
        ) : error ? (
          <div className="text-center text-red-400 text-[7px] py-4">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-400 text-[7px] py-4">Нет переписок</div>
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
                      className="font-semibold text-yellow-400 text-[9px]"
                      style={getNickColorStyle(conv.playerName, hero, conv.nickColor)}
                    >
                      {conv.playerName}
                    </span>
                    {onlinePlayerIds.has(conv.playerId) ? (
                      <span className="text-green-400 text-[8px]">[On]</span>
                    ) : (
                      <span className="text-gray-500 text-[8px]">[Off]</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-white text-[9px]">{conv.unreadCount || conversationLetters.length || 1}</span>
                  <span className="text-gray-500 text-[8px]">{formatTime(conv.lastMessageTime)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Пагінація */}
        {total > 50 && (
          <div className="flex items-center justify-center gap-2 mt-4 text-[6px] text-white">
            <button className="hover:text-yellow-400 transition-colors">&lt;&lt;</button>
            <button className="hover:text-yellow-400 transition-colors">&lt;</button>
            <span className="font-bold">{page}</span>
            <button className="hover:text-yellow-400 transition-colors">&gt;</button>
            <button className="hover:text-yellow-400 transition-colors">&gt;&gt;</button>
          </div>
        )}

      </div>

      {/* Модалка написання нового листа */}
      {showWriteModal && !replyingTo && (
        <WriteLetterModal
          conversations={conversations}
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
