import React, { useState, useEffect, useRef } from "react";
import { getUnreadCount, getMyClan, getClanChat } from "../utils/api";
import { useAuthStore } from "../state/authStore";
import { getRateLimitRemainingMs } from "../state/heroStore";
import { showToast } from "../state/toastStore";

interface NavGridProps {
  navigate?: (path: string) => void;
}

type NavButton = { label: string; icon: string; path?: string; onClick?: () => void };

/** Під HP/MP/EXP: форум, пошта, чат, меню, клан (як на L2Dop). */
const topRowButtons: NavButton[] = [
  { label: "Форум", icon: "/icons/форум.jpg", path: "/forum" },
  { label: "Почта", icon: "/icons/почта.jpg", path: "/mail" },
  { label: "Чат", icon: "/icons/чат.jpg", path: "/chat" },
  { label: "Меню", icon: "/icons/меню.jpg", path: "/about" },
  { label: "Клан", icon: "/icons/клан.jpg", path: "/clans" },
];

/** Нижня панель: місто, інвентар, персонаж, стати, новини. */
const bottomRowButtons: NavButton[] = [
  { label: "Город", icon: "/icons/город.jpg", path: "/city" },
  { label: "Инвентарь", icon: "/icons/инвентарь.jpg", path: "/inventory" },
  { label: "Персонаж", icon: "/icons/персонаж.jpg", path: "/character" },
  { label: "Статы", icon: "/icons/стати.jpg", path: "/stats" },
  { label: "Новости", icon: "/icons/новости.jpg", path: "/news" },
];

const iconWrapClass =
  "rounded-lg overflow-hidden border border-[#5c4a32]/45 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] bg-black/35";

export default function NavGrid({ navigate }: NavGridProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [clanUnreadCount, setClanUnreadCount] = useState(0);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const previousUnreadRef = useRef(0);

  const unreadIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    unreadIntervalRef.current = interval;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") loadUnreadCount();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      unreadIntervalRef.current = null;
    };
  }, [isAuthenticated]);

  const clanUnreadIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    clanUnreadIntervalRef.current = interval;

    return () => {
      clearTimeout(clanStartTimeout);
      clearInterval(interval);
      clanUnreadIntervalRef.current = null;
    };
  }, [isAuthenticated]);

  const handleClick = async (btn: NavButton) => {
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
  };

  const renderIconButton = (btn: NavButton, size: "sm" | "md") => {
    const isMail = btn.label === "Почта";
    const isClan = btn.label === "Клан";
    const showMailBadge = isMail && unreadCount > 0;
    const showClanBadge = isClan && clanUnreadCount > 0;
    const dim = size === "sm" ? "w-7 h-7" : "w-8 h-8";
    const inner = size === "sm" ? 28 : 32;

    return (
      <button
        key={`${size}-${btn.label}`}
        type="button"
        onClick={() => handleClick(btn)}
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
  };

  return (
    <>
      {/* Верхній ряд — під барами HP/MP (fixed блок StatusBars ~left-2 top-2) */}
      <div
        className="fixed left-2 z-[48] flex flex-row flex-nowrap items-center gap-1.5 pointer-events-none"
        style={{ top: "5.75rem" }}
        aria-label="Швидкі посилання: форум, пошта, чат"
      >
        <div className="flex flex-row flex-nowrap items-center gap-1.5 pointer-events-auto max-w-[calc(100vw-0.75rem)]">
          {topRowButtons.map((btn) => renderIconButton(btn, "sm"))}
        </div>
      </div>

      {/* Нижня панель — 5 іконок по центру */}
      <div className="fixed bottom-0 left-0 right-0 z-50 w-full min-w-0 box-border bg-gradient-to-t from-[#0b0806] via-[#0b0806cc] to-transparent pt-2 pb-2 px-2 sm:px-3 pointer-events-none">
        <div className="w-full max-w-md mx-auto rounded-xl border border-[#c7ad80] bg-[#0b0806f0] px-3 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.6)] backdrop-blur-[1px] pointer-events-auto">
          <div className="flex flex-row flex-nowrap items-center justify-center gap-4 sm:gap-5">
            {bottomRowButtons.map((btn) => renderIconButton(btn, "md"))}
          </div>
        </div>
      </div>
    </>
  );
}
