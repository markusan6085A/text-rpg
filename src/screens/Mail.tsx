import React, { useState, useEffect, useMemo } from "react";
import {
  getLetters,
  getOnlinePlayers,
  sendLetter,
  getConversationLetters,
  getUnreadCount,
  type Letter,
} from "../utils/api";
import { useHeroStore } from "../state/heroStore";
import WriteLetterModal from "../components/WriteLetterModal";
import { getNickColorStyle } from "../utils/nickColor";
import { PlayerNameWithEmblem } from "../components/PlayerNameWithEmblem";

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

  const heroId = hero?.id;

  const loadLetters = async () => {
    const isInitialLoad = letters.length === 0;
    if (isInitialLoad) {
      setLoading(true);
      // ❗ ОПТИМІЗАЦІЯ: Показуємо skeleton одразу, не чекаємо API
      // Це покращує відчуття швидкості навіть при cold start
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
    // ❗ ОПТИМІЗАЦІЯ: Завантажуємо листи (критично) - чекаємо
    // Online players - fire-and-forget (не блокує UI)
    const loadData = async () => {
      // Критичний запит - чекаємо
      await loadLetters();
      
      // НЕ критичні запити - fire-and-forget (не блокуємо UI)
      // Online players завантажається в фоні
      getOnlinePlayers()
        .then((data) => {
          const onlineIds = new Set(data.players?.map((p: any) => p.id) || []);
          setOnlinePlayerIds(onlineIds);
        })
        .catch((err: any) => {
          // ❗ Ігноруємо 401 помилки (неавторизований) - це нормально
          if (err?.status === 401 || err?.unauthorized) {
            if (import.meta.env.DEV) {
              console.log("[Mail] Not authenticated, skipping online players");
            }
            return;
          }
          console.error("[Mail] Failed to load online players:", err?.message || err);
          // Не критично - просто не показуємо онлайн статус
        });
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 🔥 КРИТИЧНО: Використовуємо useRef для зберігання interval ID, щоб уникнути дублювання
  const onlinePlayersIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 🔥 Правильний патерн React: cleanup тільки в return, не перед створенням
    const interval = setInterval(async () => {
      try {
        const data = await getOnlinePlayers();
        const onlineIds = new Set(data.players?.map((p: any) => p.id) || []);
        setOnlinePlayerIds(onlineIds);
      } catch (err: any) {
        // ❗ Ігноруємо 401 помилки (неавторизований) - це нормально
        if (err?.status === 401 || err?.unauthorized) {
          return;
        }
        console.error("[Mail] Failed to refresh online players:", err?.message || err);
      }
    }, 30000);
    
    onlinePlayersIntervalRef.current = interval; // Зберігаємо для можливості ручного очищення

    return () => {
      clearInterval(interval);
      onlinePlayersIntervalRef.current = null;
    };
  }, []); // 🔥 Порожній масив - interval створюється один раз при mount

  /**
   * ВАЖЛИВО:
   * - визначаємо "співрозмовника" як ІНШОГО учасника переписки
   * - не прив'язуємось тупо до fromCharacter
   */
  const getPeerFromLetter = (letter: any): { id: string; name: string; nickColor?: string } | null => {
    if (!heroId) return null;

    const from = letter?.fromCharacter;
    const to = letter?.toCharacter;

    // якщо структура повна: from + to
    if (from?.id && to?.id) {
      const peer = from.id === heroId ? to : from;
      return peer?.id ? { id: peer.id, name: peer.name, nickColor: peer.nickColor } : null;
    }

    // fallback: якщо є isOwn
    // isOwn=true => from=hero, peer=fromCharacter? (але тоді fromCharacter може бути hero)
    // без toCharacter точність нижча, але краще ніж нічого
    if (from?.id) {
      // якщо лист прийшов від іншого - peer=from
      if (from.id !== heroId) return { id: from.id, name: from.name, nickColor: from.nickColor };
    }

    return null;
  };

  // Групуємо листи по переписках
  const conversations = useMemo<Conversation[]>(() => {
    const convMap = new Map<string, Conversation>();

    for (const letter of letters as any[]) {
      const peer = getPeerFromLetter(letter);
      if (!peer) continue;

      if (!convMap.has(peer.id)) {
        convMap.set(peer.id, {
          playerId: peer.id,
          playerName: peer.name,
          nickColor: peer.nickColor,
          unreadCount: 0,
          lastMessage: letter,
          lastMessageTime: letter.createdAt,
        });
      }

      const conv = convMap.get(peer.id)!;

      // unreadCount рахуємо тільки по ВХІДНИХ листах (від peer до героя)
      const fromId = letter?.fromCharacter?.id;
      const isInbound = heroId && fromId && fromId !== heroId;

      if (isInbound && !letter.isRead) {
        conv.unreadCount++;
      }

      if (new Date(letter.createdAt) > new Date(conv.lastMessageTime)) {
        conv.lastMessage = letter;
        conv.lastMessageTime = letter.createdAt;
      }
    }

    return Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letters, heroId]);

  const loadConversationLetters = async (playerId: string, pageNum: number = conversationPage) => {
    try {
      const data = await getConversationLetters(playerId, pageNum, 10);
      setConversationLetters(data.letters || []);
      setConversationTotal(data.total || 0);
      setConversationPage(pageNum);

      // Сервер вже міг позначити як прочитане — підтягнемо загальний лічильник
      // ❗ ОПТИМІЗАЦІЯ: Не критично, можна fire-and-forget
      getUnreadCount()
        .then((data) => {
          setUnreadCount(data.unreadCount || 0);
        })
        .catch((err) => {
          // Не критично - просто не оновлюємо лічильник
          console.warn('[Mail] Failed to update unread count:', err);
        });
    } catch (err: any) {
      console.error("Error loading conversation:", err);
      setError(err?.message || "Помилка завантаження переписки");
    }
  };

  const handleConversationClick = async (conv: Conversation) => {
    // локально прибираємо бейдж відразу
    setSelectedConversation({ ...conv, unreadCount: 0 });
    setConversationPage(1);

    // 1) тягнемо переписку (сервер може одразу відмітити прочитані)
    await loadConversationLetters(conv.playerId, 1);

    // 2) локально ставимо isRead=true для ВХІДНИХ листів від цього peer
    setLetters((prev) =>
      prev.map((letter: any) => {
        const fromId = letter?.fromCharacter?.id;
        const isInbound = heroId && fromId && fromId === conv.playerId; // inbound саме від peer
        if (isInbound && !letter.isRead) return { ...letter, isRead: true };
        return letter;
      })
    );

    // 3) і ще раз підтягнемо загальний unread, щоб шапка/лічильники були точні
    // ❗ ОПТИМІЗАЦІЯ: Не критично, можна fire-and-forget
    getUnreadCount()
      .then((data) => {
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {
        // не критично
      });
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

      // оновлюємо і список, і переписку
      await loadLetters();
      await loadConversationLetters(selectedConversation.playerId, conversationPage);

      // ❗ ОПТИМІЗАЦІЯ: Unread count - fire-and-forget, не блокує UI
      getUnreadCount()
        .then((data) => {
          setUnreadCount(data.unreadCount || 0);
        })
        .catch((err) => {
          // Не критично
          console.warn('[Mail] Failed to update unread count:', err);
        });
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

  // Вигляд переписки
  if (selectedConversation) {
    return (
      <div className="w-full flex flex-col items-center text-white px-3 py-4">
        <div className="w-full max-w-[360px] border border-[#5b4726] rounded-lg p-4 bg-[#1a0b0b]/30">
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
              Почта |{" "}
              <span
                style={getNickColorStyle(
                  selectedConversation.playerName,
                  hero,
                  selectedConversation.nickColor
                )}
              >
                {selectedConversation.playerName}
              </span>
            </div>
          </div>

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
              <button onClick={loadLetters} className="text-yellow-400 hover:text-yellow-300 transition-colors text-[7px]">
                Оновити
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {conversationLetters.map((letter: any) => {
              const isOwn = !!letter.isOwn;
              const displayName = isOwn ? (hero?.name || hero?.username || "Ви") : letter?.fromCharacter?.name;
              const displayNickColor = isOwn ? hero?.nickColor : letter?.fromCharacter?.nickColor;

              return (
                <div key={letter.id} className="border-b border-dotted border-[#654321] pb-1 mb-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <PlayerNameWithEmblem
                        playerName={displayName}
                        hero={hero}
                        clan={!isOwn && letter?.fromCharacter?.emblem ? { emblem: letter.fromCharacter.emblem } as any : null}
                        nickColor={displayNickColor || undefined}
                        size={12}
                        className="font-semibold text-yellow-400 cursor-pointer hover:opacity-80 transition-colors text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOwn && letter?.fromCharacter?.id) {
                            navigate(`/player/${letter.fromCharacter.id}`);
                          } else if (!isOwn && letter?.fromCharacter?.name) {
                            navigate(`/player/${letter.fromCharacter.name}`);
                          }
                        }}
                      />

                      {isOwn && !letter.isRead && <span className="text-red-400 text-[8px]">непрочитано</span>}
                    </div>

                    <span className="text-gray-500 text-[9px]">{formatTime(letter.createdAt)}</span>
                  </div>

                  <div className="text-white text-[10px]">{letter.message}</div>
                </div>
              );
            })}
          </div>

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
                onClick={() =>
                  loadConversationLetters(selectedConversation.playerId, Math.ceil(conversationTotal / 10))
                }
                disabled={conversationPage * 10 >= conversationTotal}
                className="hover:text-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &gt;&gt;
              </button>
            </div>
          )}
        </div>

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
        <div className="flex items-center justify-between mb-3">
          <div className="text-[9px] font-bold text-[#87ceeb]">Почта</div>
          <button
            onClick={() => setShowWriteModal(true)}
            className="text-green-400 hover:text-green-300 transition-colors text-sm font-bold"
          >
            Написать
          </button>
        </div>

        <div className="w-full h-px bg-gray-600 mb-3"></div>

        {loading && letters.length === 0 ? (
          // ❗ ОПТИМІЗАЦІЯ: Skeleton для швидшого відображення
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-2 border-b border-dotted border-[#654321] animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-800 rounded w-16"></div>
                </div>
                <div className="h-3 bg-gray-700 rounded w-12"></div>
              </div>
            ))}
          </div>
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
                className="flex items-center justify-between p-2 border-b border-dotted border-[#654321] cursor-pointer hover:bg-gray-800/30 transition-colors"
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
                  {conv.unreadCount > 0 && (
                    <span className="text-white text-[9px]">{conv.unreadCount}</span>
                  )}
                  <span className="text-gray-500 text-[8px]">{formatTime(conv.lastMessageTime)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

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

      {showWriteModal && !replyingTo && (
        <WriteLetterModal
          conversations={conversations}
          onClose={() => setShowWriteModal(false)}
          onSent={() => {
            setShowWriteModal(false);
            loadLetters();
          }}
        />
      )}
    </div>
  );
}
