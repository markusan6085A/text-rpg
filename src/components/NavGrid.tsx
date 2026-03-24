import React, { useState, useEffect, useRef, useMemo, useContext, useCallback } from "react";
import {
  CLAN_CHAT_MARK_READ_EVENT,
  MAIL_UNREAD_SYNC_EVENT,
  getUnreadCount,
  getMyClan,
  getClanChat,
} from "../utils/api";
import { useAuthStore } from "../state/authStore";
import { useHeroStore } from "../state/heroStore";
import { showToast } from "../state/toastStore";

type NavButton = { label: string; path?: string; onClick?: () => void };

/** У прокручуваному контенті. */
const topRowButtons: NavButton[] = [
  { label: "Почта", path: "/mail" },
  { label: "Форум", path: "/forum" },
  { label: "Чат", path: "/chat" },
  { label: "Меню", path: "/about" },
  { label: "Новости", path: "/news" },
];

/** Fixed знизу. */
const bottomRowButtons: NavButton[] = [
  { label: "Инвентарь", path: "/inventory" },
  { label: "Персонаж", path: "/character" },
  { label: "Город", path: "/city" },
  { label: "Клан", path: "/clans" },
  { label: "Статы", path: "/stats" },
];

const topPanelClass =
  "w-full max-w-full min-w-0 rounded-xl border border-[#c7ad80]/80 bg-black/28 px-1.5 py-1.5 sm:px-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.08),0_6px_20px_rgba(0,0,0,0.4)] backdrop-blur-[1px]";

const bottomPanelClass =
  "w-full max-w-full min-w-0 rounded-t-xl rounded-b-md border border-[#c7ad80]/80 bg-black/32 px-1.5 py-1 sm:px-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.08),0_8px_24px_rgba(0,0,0,0.55)] backdrop-blur-[1px] overflow-hidden";

const textRowClass =
  "w-full flex flex-row flex-nowrap items-stretch justify-between gap-1 sm:gap-1.5";

/** Рамка кнопки в теплому L2-стилі. */
const navItemFrameClass =
  "flex-1 min-w-0 basis-0 relative flex items-center justify-center rounded-md px-0.5 py-1 sm:py-1.5 border border-[#5c4a32]/65 bg-gradient-to-b from-[#2e2619] to-[#14110c] shadow-[inset_0_1px_0_rgba(199,173,128,0.14),0_2px_5px_rgba(0,0,0,0.5)] text-[#e8c56e] hover:from-[#3a3020] hover:to-[#1c1810] hover:border-[#c7ad80]/50 hover:text-[#f4e2b8] active:scale-[0.98] transition-[transform,colors,border-color,box-shadow] duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c7ad80]/55";

const textLabelClass =
  "block w-full text-center text-[9px] sm:text-[10px] font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]";

type NavGridContextValue = {
  navigate?: (path: string) => void;
  unreadCount: number;
  clanUnreadCount: number;
  handleClick: (btn: NavButton) => Promise<void>;
};

const NavGridContext = React.createContext<NavGridContextValue | null>(null);

interface NavGridProviderProps {
  navigate?: (path: string) => void;
  children: React.ReactNode;
}

/** Один екземпляр полінгу листів/клану на все дерево навігації. */
export function NavGridProvider({ navigate, children }: NavGridProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [clanUnreadCount, setClanUnreadCount] = useState(0);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const heroId = useHeroStore((s) => s.hero?.id);
  const previousUnreadRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) {
      previousUnreadRef.current = 0;
      setUnreadCount(0);
      return;
    }

    const loadUnreadCount = async () => {
      try {
        const data = await getUnreadCount();
        const nextUnread = data.unreadCount || 0;
        const prevUnread = previousUnreadRef.current;
        if (nextUnread > prevUnread && prevUnread > 0) {
          showToast("Вам прийшло нове повідомлення на пошту", "info");
        }
        previousUnreadRef.current = nextUnread;
        setUnreadCount(nextUnread);
      } catch (err: any) {
        console.error("[NavGrid] Failed to load unread count:", err);
        setUnreadCount(0);
      }
    };

    void loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 25000);

    const onMailSync = (ev: Event) => {
      const ce = ev as CustomEvent<{ unreadCount?: number }>;
      const n = ce.detail?.unreadCount;
      if (typeof n !== "number" || n < 0) return;
      setUnreadCount(n);
      previousUnreadRef.current = n;
    };
    window.addEventListener(MAIL_UNREAD_SYNC_EVENT, onMailSync);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void loadUnreadCount();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener(MAIL_UNREAD_SYNC_EVENT, onMailSync);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setClanUnreadCount(0);
      return;
    }

    const loadClanUnreadCount = async () => {
      try {
        const myClanResponse = await getMyClan();
        if (myClanResponse.ok && myClanResponse.clan) {
          const lastVisitKey = `clan_last_visit_${myClanResponse.clan.id}`;
          const lastVisit = localStorage.getItem(lastVisitKey);
          const lastVisitTime = lastVisit ? parseInt(lastVisit, 10) : 0;

          const chatResponse = await getClanChat(myClanResponse.clan.id, 1, 100);
          if (chatResponse.ok) {
            const selfId = String(heroId || "").trim();
            const unread = chatResponse.messages.filter((msg) => {
              if (selfId && msg.characterId === selfId) return false;
              const msgTime = new Date(msg.createdAt).getTime();
              return msgTime > lastVisitTime;
            }).length;
            setClanUnreadCount(unread);
          }
        } else {
          setClanUnreadCount(0);
        }
      } catch (err: any) {
        console.error("[NavGrid] Failed to load clan unread count:", err);
        setClanUnreadCount(0);
      }
    };

    // Одразу після входу / F5 — як пошта; раніше був delay 4 с, через це бейдж з’являвся «з затримкою»
    void loadClanUnreadCount();
    const interval = setInterval(loadClanUnreadCount, 25000);

    const onClanChatRead = () => {
      setClanUnreadCount(0);
    };
    window.addEventListener(CLAN_CHAT_MARK_READ_EVENT, onClanChatRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener(CLAN_CHAT_MARK_READ_EVENT, onClanChatRead);
    };
  }, [isAuthenticated, heroId]);

  const handleClick = useCallback(
    async (btn: NavButton) => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

      if (btn.onClick) {
        btn.onClick();
        return;
      }

      if (btn.label === "Клан" && navigate) {
        const fetchClan = async (retries = 0): Promise<{ id: string } | null> => {
          try {
            const response = await getMyClan();
            if (response.ok && response.clan?.id) return response.clan;
            return null;
          } catch (err) {
            if (retries < 1) {
              await new Promise((r) => setTimeout(r, 800));
              return fetchClan(retries + 1);
            }
            throw err;
          }
        };
        try {
          const clan = await fetchClan();
          if (clan) {
            navigate(`/clan/${clan.id}`);
          } else {
            navigate("/clans");
          }
        } catch (err) {
          console.error("[NavGrid] Failed to check clan:", err);
          navigate("/clans");
        }
        return;
      }

      if (btn.path && navigate) {
        navigate(btn.path);
        return;
      }
      showToast("Функція недоступна", "info");
    },
    [navigate]
  );

  const value = useMemo<NavGridContextValue>(
    () => ({
      navigate,
      unreadCount,
      clanUnreadCount,
      handleClick,
    }),
    [navigate, unreadCount, clanUnreadCount, handleClick]
  );

  return <NavGridContext.Provider value={value}>{children}</NavGridContext.Provider>;
}

function useNavGridCtx(): NavGridContextValue | null {
  return useContext(NavGridContext);
}

function NavTextButton({ btn }: { btn: NavButton }) {
  const ctx = useNavGridCtx();
  if (!ctx) return null;
  const { unreadCount, clanUnreadCount, handleClick } = ctx;
  const isMail = btn.label === "Почта";
  const isClan = btn.label === "Клан";
  const showMailBadge = isMail && unreadCount > 0;
  const showClanBadge = isClan && clanUnreadCount > 0;

  return (
    <button
      type="button"
      onClick={() => void handleClick(btn)}
      className={navItemFrameClass}
      title={btn.label}
    >
      <span className={textLabelClass}>{btn.label}</span>
      {showMailBadge && (
        <span className="absolute -top-1 right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-600 text-white text-[7px] font-bold leading-[14px] text-center shadow-sm ring-1 ring-black/40">
          {unreadCount > 99 ? "99" : unreadCount}
        </span>
      )}
      {showClanBadge && (
        <span className="absolute -top-1 right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-600 text-white text-[7px] font-bold leading-[14px] text-center shadow-sm ring-1 ring-black/40">
          {clanUnreadCount > 99 ? "99" : clanUnreadCount}
        </span>
      )}
    </button>
  );
}

/** Перший блок у прокрутці — текстові посилання в один ряд. */
export function NavScrollTopRow() {
  const ctx = useNavGridCtx();
  if (!ctx) return null;

  return (
    <div
      className="w-full min-w-0 mb-2 pt-0.5 -mt-0.5"
      aria-label="Навігація: пошта, форум, чат, меню, новини"
    >
      <div className={topPanelClass}>
        <div className={textRowClass}>
          {topRowButtons.map((btn) => (
            <NavTextButton key={btn.label} btn={btn} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Нижня панель — fixed, той самий текстовий ряд. */
export default function NavGridBottomFixed() {
  const ctx = useNavGridCtx();
  if (!ctx) return null;

  return (
    <div
      className="!fixed bottom-0 left-0 right-0 z-50 w-full min-w-0 box-border bg-gradient-to-t from-[#0b0806] via-[#0b0806]/90 to-transparent pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] px-1.5 sm:px-2 md:px-3 pointer-events-none"
      data-nav-bottom-dock
    >
      <div className={`${bottomPanelClass} pointer-events-auto`}>
        <div className={textRowClass}>
          {bottomRowButtons.map((btn) => (
            <NavTextButton key={btn.label} btn={btn} />
          ))}
        </div>
      </div>
    </div>
  );
}
