import React, { useState, useEffect, useRef, useMemo, useContext, useCallback } from "react";
import { getUnreadCount, getMyClan, getClanChat } from "../utils/api";
import { useAuthStore } from "../state/authStore";
import { getRateLimitRemainingMs } from "../state/heroStore";
import { showToast } from "../state/toastStore";

type NavButton = { label: string; icon: string; path?: string; onClick?: () => void };

/** У прокручуваному контенті: форум, пошта, чат, меню, новини. */
const topRowButtons: NavButton[] = [
  { label: "Форум", icon: "/icons/форум.jpg", path: "/forum" },
  { label: "Почта", icon: "/icons/почта.jpg", path: "/mail" },
  { label: "Чат", icon: "/icons/чат.jpg", path: "/chat" },
  { label: "Меню", icon: "/icons/меню.jpg", path: "/about" },
  { label: "Новости", icon: "/icons/новости.jpg", path: "/news" },
];

/** Fixed знизу: місто, інвентар, персонаж, стати, клан. */
const bottomRowButtons: NavButton[] = [
  { label: "Город", icon: "/icons/город.jpg", path: "/city" },
  { label: "Инвентарь", icon: "/icons/инвентарь.jpg", path: "/inventory" },
  { label: "Персонаж", icon: "/icons/персонаж.jpg", path: "/character" },
  { label: "Статы", icon: "/icons/стати.jpg", path: "/stats" },
  { label: "Клан", icon: "/icons/клан.jpg", path: "/clans" },
];

const iconWrapClass =
  "rounded-lg overflow-hidden border border-[#5c4a32]/45 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] bg-black/35";

const dockPanelClass =
  "w-full max-w-md mx-auto rounded-xl border border-[#c7ad80] bg-[#0b0806f0] px-3 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.6)] backdrop-blur-[1px]";

const dockRowClass =
  "flex flex-row flex-nowrap items-center justify-center gap-4 sm:gap-5";

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

function NavIconButton({ btn }: { btn: NavButton }) {
  const ctx = useNavGridCtx();
  if (!ctx) return null;
  const { unreadCount, clanUnreadCount, handleClick } = ctx;
  const isMail = btn.label === "Почта";
  const isClan = btn.label === "Клан";
  const showMailBadge = isMail && unreadCount > 0;
  const showClanBadge = isClan && clanUnreadCount > 0;
  const dim = "w-8 h-8";
  const inner = 32;

  return (
    <button
      type="button"
      onClick={() => void handleClick(btn)}
      className="shrink-0 rounded-lg bg-transparent text-[#dba753] p-0 border-0 hover:brightness-110 transition-[filter] flex flex-col items-center justify-center focus:outline-none relative"
      title={btn.label}
    >
      <span className={`${iconWrapClass} ${dim} flex items-center justify-center`}>
        <img
          src={encodeURI(btn.icon)}
          alt={btn.label}
          className={`${dim} object-contain rounded-md`}
          style={{ filter: "grayscale(25%) brightness(0.92) sepia(12%)" }}
          width={inner}
          height={inner}
        />
      </span>
      {showMailBadge && (
        <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none z-[1]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}
      {showClanBadge && (
        <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none z-[1]">
          {clanUnreadCount > 99 ? "99+" : clanUnreadCount}
        </div>
      )}
    </button>
  );
}

/**
 * Верхня сітка в потоці документа — перший блок у прокрутці (над «Вигляд Місто» та іншим контентом).
 */
export function NavScrollTopRow() {
  const ctx = useNavGridCtx();
  if (!ctx) return null;

  return (
    <div
      className="w-full min-w-0 mb-2 pt-0.5 -mt-0.5"
      aria-label="Швидкі посилання: форум, пошта, чат, меню, новини"
    >
      <div className={dockPanelClass}>
        <div className={dockRowClass}>
          {topRowButtons.map((btn) => (
            <NavIconButton key={btn.label} btn={btn} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Нижня fixed-панель (лише всередині NavGridProvider). */
export default function NavGridBottomFixed() {
  const ctx = useNavGridCtx();
  if (!ctx) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full min-w-0 box-border bg-gradient-to-t from-[#0b0806] via-[#0b0806cc] to-transparent pt-2 pb-2 px-2 sm:px-3 pointer-events-none">
      <div className={`${dockPanelClass} pointer-events-auto`}>
        <div className={dockRowClass}>
          {bottomRowButtons.map((btn) => (
            <NavIconButton key={btn.label} btn={btn} />
          ))}
        </div>
      </div>
    </div>
  );
}
