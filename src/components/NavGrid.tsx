import React, { useState, useEffect, useRef } from "react";
import { getUnreadCount, getMyClan, getClanChat } from "../utils/api";
import { useAuthStore } from "../state/authStore";
import { getRateLimitRemainingMs } from "../state/heroStore";

interface NavGridProps {
  navigate?: (path: string) => void;
}

type NavButton = { label: string; icon: string; path?: string; onClick?: () => void };

const buttons: NavButton[] = [
  { label: "Почта", icon: "/icons/почта.jpg", path: "/mail" },
  { label: "Чат", icon: "/icons/чат.jpg", path: "/chat" },
  { label: "Форум", icon: "/icons/форум.jpg", path: "/forum" },
  { label: "Город", icon: "/icons/город.jpg", path: "/city" },
  { label: "Инвентарь", icon: "/icons/инвентарь.jpg", path: "/inventory" },
  { label: "Персонаж", icon: "/icons/персонаж.jpg", path: "/character" },
  { label: "Клан", icon: "/icons/клан.jpg", path: "/clans" },
  { label: "Меню", icon: "/icons/меню.jpg", path: "/about" },
  { label: "Статы", icon: "/icons/стати.jpg", path: "/stats" },
  { label: "Новости", icon: "/icons/новости.jpg", path: "/news" },
];

export default function NavGrid({ navigate }: NavGridProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [clanUnreadCount, setClanUnreadCount] = useState(0);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Завантажуємо кількість непрочитаних листів
  // 🔥 КРИТИЧНО: Використовуємо useRef для зберігання interval ID, щоб уникнути дублювання
  const unreadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 🔥 Правильний патерн React: cleanup тільки в return, не перед створенням
    if (!isAuthenticated) {
      setUnreadCount(0);
      return; // Cleanup спрацює автоматично через return нижче
    }

    const loadUnreadCount = async () => {
      if (getRateLimitRemainingMs() > 0) return;
      try {
        const data = await getUnreadCount();
        setUnreadCount(data.unreadCount || 0);
      } catch (err: any) {
        console.error('[NavGrid] Failed to load unread count:', err);
        setUnreadCount(0);
      }
    };

    // 🔥 Перші 15 с — тільки GET character. Unread не славимо, щоб PUT (скіл/баф) не отримав 429
    const startTimeout = setTimeout(loadUnreadCount, 15000);
    const interval = setInterval(loadUnreadCount, 60000); // Кожні 60 с (було 30)
    unreadIntervalRef.current = interval; // Зберігаємо для можливості ручного очищення
    
    return () => {
      clearTimeout(startTimeout);
      clearInterval(interval);
      unreadIntervalRef.current = null;
    };
  }, [isAuthenticated]); // 🔥 Мінімальні dependencies - тільки isAuthenticated (примітив)

  // Завантажуємо кількість непрочитаних повідомлень клану
  // 🔥 КРИТИЧНО: Використовуємо useRef для зберігання interval ID, щоб уникнути дублювання
  const clanUnreadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 🔥 Правильний патерн React: cleanup тільки в return, не перед створенням
    if (!isAuthenticated) {
      setClanUnreadCount(0);
      return; // Cleanup спрацює автоматично через return нижче
    }

    const loadClanUnreadCount = async () => {
      if (getRateLimitRemainingMs() > 0) return;
      try {
        const myClanResponse = await getMyClan();
        if (myClanResponse.ok && myClanResponse.clan) {
          const lastVisitKey = `clan_last_visit_${myClanResponse.clan.id}`;
          const lastVisit = localStorage.getItem(lastVisitKey);
          const lastVisitTime = lastVisit ? parseInt(lastVisit, 10) : 0;

          // Завантажуємо останні повідомлення
          const chatResponse = await getClanChat(myClanResponse.clan.id, 1, 100);
          if (chatResponse.ok) {
            // Рахуємо повідомлення, які прийшли після останнього візиту
            const unread = chatResponse.messages.filter((msg) => {
              const msgTime = new Date(msg.createdAt).getTime();
              return msgTime > lastVisitTime;
            }).length;
            setClanUnreadCount(unread);
          }
        } else {
          setClanUnreadCount(0);
        }
      } catch (err: any) {
        console.error('[NavGrid] Failed to load clan unread count:', err);
        setClanUnreadCount(0);
      }
    };

    // 🔥 Перший clan unread через 20 с, щоб не спалити ліміт до PUT
    const clanStartTimeout = setTimeout(loadClanUnreadCount, 20000);
    // 🔥 ОПТИМІЗАЦІЯ: Зменшуємо частоту поллінгу з 30 секунд до 60 секунд
    const interval = setInterval(loadClanUnreadCount, 60000); // Оновлюємо кожні 60 секунд
    clanUnreadIntervalRef.current = interval; // Зберігаємо для можливості ручного очищення
    
    return () => {
      clearTimeout(clanStartTimeout);
      clearInterval(interval);
      clanUnreadIntervalRef.current = null;
    };
  }, [isAuthenticated]); // 🔥 Мінімальні dependencies - тільки isAuthenticated (примітив)

  const handleClick = async (btn: NavButton) => {
    // 🔥 Скрол вгору при навігації - завжди показуємо верх сторінки з барами
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    if (btn.onClick) {
      btn.onClick();
      return;
    }
    
    // Спеціальна обробка для кнопки "Клан"
    if (btn.label === "Клан" && navigate) {
      try {
        const response = await getMyClan();
        if (response.ok && response.clan) {
          // Якщо є клан - переходимо на детальну сторінку
          navigate(`/clan/${response.clan.id}`);
        } else {
          // Якщо немає клану - переходимо на список кланів
          navigate("/clans");
        }
      } catch (err) {
        console.error("[NavGrid] Failed to check clan:", err);
        // У разі помилки - переходимо на список кланів
        navigate("/clans");
      }
      return;
    }
    
    if (btn.path && navigate) {
      // 🔥 ВАЖЛИВО: Завжди викликаємо navigate, навіть якщо шлях той самий
      // Це гарантує оновлення сторінки через refreshKey
      navigate(btn.path);
      return;
    }
    window.alert("Функція недоступна");
  };

  return (
    <div className="fixed bottom-0 z-50 w-full flex justify-center bg-gradient-to-t from-[#0b0806] via-[#0b0806cc] to-transparent pt-2 pb-2 px-2 sm:px-4 pointer-events-none left-0 right-0">
      <div className="w-full max-w-[380px] rounded-lg border border-[#5b4726] bg-[#0b0806f0] px-1 py-[2px] shadow-[0_14px_40px_rgba(0,0,0,0.6)] backdrop-blur-[1px] pointer-events-auto" style={{ transform: 'translateX(-5px)' }}>
        <div className="px-0 py-0 overflow-x-hidden">
          <div className="w-full flex flex-row flex-nowrap items-center justify-between gap-[0.15rem] text-[11px] text-[#d8c598]">
            {buttons.map((btn) => {
              const isMail = btn.label === "Почта";
              const isClan = btn.label === "Клан";
              const showMailBadge = isMail && unreadCount > 0;
              const showClanBadge = isClan && clanUnreadCount > 0;
              return (
                <button
                  key={btn.label}
                  onClick={() => handleClick(btn)}
                  className="flex-1 min-w-[30px] rounded-md bg-transparent text-[#dba753] px-[2px] py-0 border-0 hover:bg-transparent transition-colors flex flex-col items-center gap-[0.12rem] focus:outline-none relative"
                  title={btn.label}
                >
                  <img
                    src={encodeURI(btn.icon)}
                    alt={btn.label}
                    className="w-8 h-8 object-contain"
                    style={{ filter: "grayscale(25%) brightness(0.92) sepia(12%)" }}
                    width={32}
                    height={32}
                  />
                  {/* Індикатор непрочитаних на пошті */}
                  {showMailBadge && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </div>
                  )}
                  {/* Індикатор непрочитаних повідомлень клану */}
                  {showClanBadge && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none">
                      {clanUnreadCount > 99 ? "99+" : clanUnreadCount}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
