import React, { useState, useEffect, useMemo } from "react";
import {
  getLetters,
  getOnlinePlayers,
  sendLetter,
  getConversationLetters,
  getUnreadCount,
  collectItemFromLetter,
  MAIL_UNREAD_SYNC_EVENT,
  type Letter,
} from "../utils/api";
import { useHeroStore, getRateLimitRemainingMs } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";
import WriteLetterModal from "../components/WriteLetterModal";
import { getNickColorStyle } from "../utils/nickColor";
import { PlayerNameWithEmblem } from "../components/PlayerNameWithEmblem";
import { showToast } from "../state/toastStore";
import { isUnauthorizedError } from "../utils/isUnauthorizedError";
import { getCityUiVariant } from "../utils/cityUiVariant";
import { adminOwnWriteTextStyle, isAdminCharacter } from "../config/admin";

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
  const characterId = useCharacterStore((s) => s.characterId);

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

  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const mailOuter = isL2
    ? `${l2Frame} w-full flex flex-col items-center px-3 py-4 text-[#d4c4a8]`
    : "w-full flex flex-col items-center text-white px-3 py-4";
  const mailPanel = isL2
    ? "w-full max-w-[420px] rounded-xl border border-[#5c4a32]/75 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-4"
    : "w-full max-w-[360px] border border-white/50 rounded-lg p-4 bg-[#1a0b0b]/30";
  const mailChrome = isL2 ? "text-[#e8c56e]" : "text-[#87ceeb]";
  const mailRowBorder = isL2 ? "border-b border-solid border-[#5c4a32]/35" : "border-b border-solid border-white/50";
  const mailDivider = isL2 ? "w-full h-px bg-[#5c4a32]/45 mb-3" : "w-full h-px bg-gray-600 mb-3";

  const heroId = hero?.id;

  const syncNavMailUnread = React.useCallback((n: number) => {
    window.dispatchEvent(
      new CustomEvent(MAIL_UNREAD_SYNC_EVENT, { detail: { unreadCount: Math.max(0, Math.floor(n)) } }),
    );
  }, []);

    const loadLetters = React.useCallback(async () => {
      if (getRateLimitRemainingMs() > 0) return;
      const isInitialLoad = letters.length === 0;
      if (isInitialLoad) {
        setLoading(true);
        // ❗ ОПТИМІЗАЦІЯ: Показуємо skeleton одразу, не чекаємо API
        // Це покращує відчуття швидкості навіть при cold start
      }

      setError(null);
      try {
        const data = await getLetters(page, 50, characterId ?? undefined);
        setLetters(data.letters || []);
        setTotal(data.total || 0);
        const u = data.unreadCount || 0;
        setUnreadCount(u);
        syncNavMailUnread(u);
      } catch (err: any) {
        if (isUnauthorizedError(err)) {
          setError("Сессия истекла. Войдите снова.");
          navigate("/");
          return;
        }
        setError(err?.message || "Помилка завантаження листів");
      } finally {
        setLoading(false);
      }
    }, [page, letters.length, characterId, syncNavMailUnread]);

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
  }, [page, loadLetters]);

  // 🔥 КРИТИЧНО: Використовуємо useRef для зберігання interval ID, щоб уникнути дублювання
  const onlinePlayersIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 🔥 Правильний патерн React: cleanup тільки в return, не перед створенням
    const interval = setInterval(async () => {
      if (getRateLimitRemainingMs() > 0) return;
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
    }, 60000); // Було 30 с — менше запитів = менше 429
    
    onlinePlayersIntervalRef.current = interval; // Зберігаємо для можливості ручного очищення

    return () => {
      clearInterval(interval);
      onlinePlayersIntervalRef.current = null;
    };
  }, []); // 🔥 Порожній масив - interval створюється один раз при mount

  // ❗ Оновлення листів кожні 15 сек — щоб одразу бачити нові повідомлення
  const selectedConvRef = React.useRef(selectedConversation);
  selectedConvRef.current = selectedConversation;
  const conversationPageRef = React.useRef(conversationPage);
  conversationPageRef.current = conversationPage;
  useEffect(() => {
    const interval = setInterval(() => {
      if (getRateLimitRemainingMs() > 0) return;
      loadLetters();
      const conv = selectedConvRef.current;
      if (conv) {
        loadConversationLetters(conv.playerId, conversationPageRef.current);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [loadLetters]);

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
          const u = data.unreadCount || 0;
          setUnreadCount(u);
          syncNavMailUnread(u);
        })
        .catch((err) => {
          // Не критично - просто не оновлюємо лічильник
          console.warn('[Mail] Failed to update unread count:', err);
        });
    } catch (err: any) {
      if (isUnauthorizedError(err)) {
        showToast("Сессия истекла. Войдите снова.", "error");
        navigate("/");
        return;
      }
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
        const u = data.unreadCount || 0;
        setUnreadCount(u);
        syncNavMailUnread(u);
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
          const u = data.unreadCount || 0;
          setUnreadCount(u);
          syncNavMailUnread(u);
        })
        .catch((err) => {
          // Не критично
          console.warn('[Mail] Failed to update unread count:', err);
        });
    } catch (err: any) {
      if (isUnauthorizedError(err)) {
        showToast("Сессия истекла. Войдите снова.", "error");
        navigate("/");
        return;
      }
      console.error("Error sending reply:", err);
      showToast(err?.message || "Помилка відправки повідомлення", "error");
    } finally {
      setSendingReply(false);
    }
  };

  const [claimingLetterId, setClaimingLetterId] = useState<string | null>(null);

  const handleClaimItem = async (letter: any, itemPayload: any) => {
    if (!hero) return;
    setClaimingLetterId(letter.id);
    try {
      const claimRes = await collectItemFromLetter(letter.id);
      const serverHeroJson = claimRes.character?.heroJson || {};
      useHeroStore.getState().updateHero({
        inventory: Array.isArray(serverHeroJson.inventory) ? serverHeroJson.inventory : [],
      });
      
      // Оновлюємо переписку (видаляємо цей лист з UI)
      setConversationLetters(prev => prev.filter(l => l.id !== letter.id));
      showToast(`Ви успішно отримали: ${claimRes.item?.name || itemPayload?.name || "предмет"}`, "success");
    } catch (err: any) {
      if (isUnauthorizedError(err)) {
        showToast("Сессия истекла. Войдите снова.", "error");
        navigate("/");
        return;
      }
      console.error("Claim error:", err);
      showToast(err?.message || "Помилка при отриманні предмета", "error");
    } finally {
      setClaimingLetterId(null);
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
      <div className={mailOuter}>
        <div className={mailPanel}>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                setSelectedConversation(null);
                setConversationLetters([]);
                void loadLetters();
              }}
              className={
                isL2
                  ? "text-[#9d8265] hover:text-[#c9a44c] transition-colors text-[7px]"
                  : "text-gray-400 hover:text-white transition-colors text-[7px]"
              }
            >
              ← Назад
            </button>

            <div className={`text-[9px] font-bold ${mailChrome}`}>
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
              style={adminOwnWriteTextStyle(hero?.name)}
              className={
                isL2
                  ? "w-full bg-[#0c0a08] border border-[#5c4a32]/70 rounded px-2 py-1 text-[7px] text-[#e8dcc8] resize-none mb-2 placeholder:text-[#6b5c42]"
                  : "w-full bg-[#0b0806] border border-white/50 rounded px-2 py-1 text-[7px] text-white resize-none mb-2"
              }
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
                <div key={letter.id} className={`${mailRowBorder} pb-1 mb-1`}>
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

                  {letter.subject === "[ITEM_TRANSFER]" ? (
                    <div className="mt-2 p-2 bg-[#2a1b0b]/50 border border-[#b8860b]/50 rounded-md flex flex-col items-center gap-2">
                      {(() => {
                        try {
                          const payload = JSON.parse(letter.message);
                          const item = payload.item;
                          return (
                            <>
                              <div className="text-[#b8860b] text-[10px] font-bold">
                                {isOwn ? "Ви передали предмет:" : "Вам передали предмет:"}
                              </div>
                              <div className="flex items-center gap-2 bg-black/40 p-1 rounded w-full">
                                <img src={item.icon?.startsWith("/") ? item.icon : `/items/${item.icon}`} className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.src = "/items/drops/Weapon_squires_sword_i00_0.jpg")} />
                                <div className="flex-1">
                                  <div className="text-white text-[10px] leading-tight">{item.name}</div>
                                  {item.enchantLevel > 0 && <div className="text-yellow-400 text-[9px]">+{item.enchantLevel}</div>}
                                  {item.count > 1 && <div className="text-gray-400 text-[9px]">{item.count} шт.</div>}
                                </div>
                              </div>
                              {!isOwn && (
                                <button 
                                  onClick={() => handleClaimItem(letter, item)}
                                  disabled={claimingLetterId === letter.id}
                                  className="w-full mt-1 bg-green-700 hover:bg-green-600 text-white font-bold py-1 rounded text-[10px] transition-colors"
                                >
                                  {claimingLetterId === letter.id ? "Отримання..." : "Забрати"}
                                </button>
                              )}
                            </>
                          );
                        } catch (e) {
                          return <div className="text-gray-400">Помилка завантаження предмета</div>;
                        }
                      })()}
                    </div>
                  ) : (
                    <div
                      className={isOwn && isAdminCharacter(hero?.name) ? "text-[10px]" : "text-white text-[10px]"}
                      style={isOwn && isAdminCharacter(hero?.name) ? adminOwnWriteTextStyle(hero?.name) : undefined}
                    >
                      {letter.message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {conversationTotal > 10 && (
            <div className="flex items-center justify-center gap-2 mt-4 text-[6px] text-white">
          <button
            onClick={() => {
              if (selectedConversation) {
                loadConversationLetters(selectedConversation.playerId, 1);
              }
            }}
            disabled={conversationPage === 1}
            className="hover:text-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &lt;&lt;
          </button>
          <button
            onClick={() => {
              if (selectedConversation) {
                loadConversationLetters(selectedConversation.playerId, conversationPage - 1);
              }
            }}
            disabled={conversationPage === 1}
            className="hover:text-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &lt;
          </button>
          <span className="font-bold">{conversationPage}</span>
          <button
            onClick={() => {
              if (selectedConversation) {
                loadConversationLetters(selectedConversation.playerId, conversationPage + 1);
              }
            }}
            disabled={conversationPage * 10 >= conversationTotal}
            className="hover:text-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &gt;
          </button>
          <button
            onClick={() => {
              if (selectedConversation) {
                loadConversationLetters(selectedConversation.playerId, Math.ceil(conversationTotal / 10));
              }
            }}
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
    <div className={mailOuter}>
      <div className={mailPanel}>
        <div className="flex items-center justify-between mb-3">
          <div className={`text-[9px] font-bold ${mailChrome}`}>Почта</div>
          <button
            onClick={() => setShowWriteModal(true)}
            className="text-green-400 hover:text-green-300 transition-colors text-sm font-bold"
          >
            Написать
          </button>
        </div>

        <div className={mailDivider}></div>

        {loading && letters.length === 0 ? (
          // ❗ ОПТИМІЗАЦІЯ: Skeleton для швидшого відображення
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex items-center justify-between p-2 ${mailRowBorder} animate-pulse`}>
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
            {conversations.map((conv) => {
              const lastMsg = conv.lastMessage as any;
              let preview = "";
              if (lastMsg?.subject === "[ITEM_TRANSFER]") {
                try {
                  const payload = JSON.parse(lastMsg?.message || "{}");
                  const item = payload?.item;
                  preview = item ? `📦 ${item.name || "предмет"}` : "📦 предмет";
                } catch {
                  preview = "📦 предмет";
                }
              } else {
                const raw = (lastMsg?.message || lastMsg?.subject || "").trim();
                preview = raw.length > 60 ? raw.slice(0, 57) + "..." : raw;
              }
              return (
                <div
                  key={conv.playerId}
                  onClick={() => handleConversationClick(conv)}
                  className={`flex flex-col p-2 ${mailRowBorder} cursor-pointer ${isL2 ? "hover:bg-[#2a2318]/50" : "hover:bg-gray-800/30"} transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-semibold text-yellow-400 text-[9px] truncate"
                          style={getNickColorStyle(conv.playerName, hero, conv.nickColor)}
                        >
                          {conv.playerName}
                        </span>
                        {onlinePlayerIds.has(conv.playerId) ? (
                          <span className="text-green-400 text-[8px] shrink-0">[On]</span>
                        ) : (
                          <span className="text-gray-500 text-[8px] shrink-0">[Off]</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {conv.unreadCount > 0 && (
                        <span className="text-white text-[9px]">{conv.unreadCount}</span>
                      )}
                      <span className="text-gray-500 text-[8px]">{formatTime(conv.lastMessageTime)}</span>
                    </div>
                  </div>
                  {preview && (
                    <div className="text-gray-400 text-[8px] mt-0.5 truncate" title={preview}>
                      {preview}
                    </div>
                  )}
                </div>
              );
            })}
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
