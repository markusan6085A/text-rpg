import React, { useState, useEffect, useRef, useMemo, useContext, useCallback } from "react";
import { getUnreadCount, getMyClan, getClanChat } from "../utils/api";
import { useAuthStore } from "../state/authStore";
import { getRateLimitRemainingMs } from "../state/heroStore";
import { showToast } from "../state/toastStore";

type NavButton = { label: string; path?: string; onClick?: () => void };

/** У прокручуваному контенті. */
const topRowButtons: NavButton[] = [
  { label: "Форум", path: "/forum" },
  { label: "Почта", path: "/mail" },
  { label: "Чат", path: "/chat" },
  { label: "Меню", path: "/about" },
  { label: "Новости", path: "/news" },
];

/** Fixed знизу. */
const bottomRowButtons: NavButton[] = [
  { label: "Город", path: "/city" },
  { label: "Инвентарь", path: "/inventory" },
  { label: "Персонаж", path: "/character" },
  { label: "Статы", path: "/stats" },
  { label: "Клан", path: "/clans" },
];

const topPanelClass =
  "w-full max-w-full min-w-0 rounded-xl border border-[#c7ad80] bg-[#0b0806f0] px-1 py-1.5 sm:px-2 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-[1px]";

const bottomPanelClass =
  "w-full max-w-full min-w-0 rounded-t-2xl rounded-b-lg border border-[#c7ad80] bg-[#0b0806f0] px-1 py-1.5 sm:px-2 shadow-[0_14px_40px_rgba(0,0,0,0.6)] backdrop-blur-[1px] overflow-hidden";

const textRowClass =
  "w-full flex flex-row flex-nowrap items-center justify-between gap-0.5 sm:gap-1";

const textBtnClass =
  "flex-1 min-w-0 basis-0 relative flex items-center justify-center rounded-md px-0.5 py-1 sm:py-1.5 text-[#c9a44c] hover:text-[#f4e2b8] hover:bg-black/35 border border-transparent hover:border-[#5c4a32]/45 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c7ad80]/40";

const textLabelClass =
  "block w-full text-center text-[9px] sm:text-[10px] font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis";

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
  const previousUnreadRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) {
      previousUnreadRef.current = 0;
      setUnreadCount(0);
      return;
    }

    const loadUnreadCount = async () => {
      if (getRateLimitRemainingMs() > 0) return;
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

    const startTimeout = setTimeout(loadUnreadCount, 1000);
    const interval = setInterval(loadUnreadCount, 60000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") loadUnreadCount();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setClanUnreadCount(0);
      return;
    }

    const loadClanUnreadCount = async () => {
      if (getRateLimitRemainingMs() > 0) return;
      try {
        const myClanResponse = await getMyClan();
        if (myClanResponse.ok && myClanResponse.clan) {
          const lastVisitKey = `clan_last_visit_${myClanResponse.clan.id}`;
          const lastVisit = localStorage.getItem(lastVisitKey);
          const lastVisitTime = lastVisit ? parseInt(lastVisit, 10) : 0;

          const chatResponse = await getClanChat(myClanResponse.clan.id, 1, 100);
          if (chatResponse.ok) {
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
        console.error("[NavGrid] Failed to load clan unread count:", err);
        setClanUnreadCount(0);
      }
    };

    const clanStartTimeout = setTimeout(loadClanUnreadCount, 20000);
    const interval = setInterval(loadClanUnreadCount, 60000);

    return () => {
      clearTimeout(clanStartTimeout);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

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
      className={textBtnClass}
      title={btn.label}
    >
      <span className={textLabelClass}>{btn.label}</span>
      {showMailBadge && (
        <span className="absolute -top-0.5 right-0 min-w-[13px] h-[13px] px-0.5 rounded-full bg-red-600 text-white text-[7px] font-bold leading-[13px] text-center">
          {unreadCount > 99 ? "99" : unreadCount}
        </span>
      )}
      {showClanBadge && (
        <span className="absolute -top-0.5 right-0 min-w-[13px] h-[13px] px-0.5 rounded-full bg-red-600 text-white text-[7px] font-bold leading-[13px] text-center">
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
      aria-label="Навігація: форум, пошта, чат, меню, новини"
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
      className="!fixed bottom-0 left-0 right-0 z-50 w-full min-w-0 box-border bg-gradient-to-t from-[#0b0806] via-[#0b0806cc] to-transparent pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-1.5 sm:px-2 md:px-3 pointer-events-none"
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
