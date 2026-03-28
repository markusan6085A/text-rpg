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
import { useOnlineCountStore } from "../state/onlineCountStore";
import { showToast } from "../state/toastStore";
import { setString } from "../state/persistence";
import { getPreviousLocation } from "../utils/locationNavigation";
import {
  rememberLocationIfLeaving,
  peekLocationReturnHref,
  consumeLocationReturnHref,
  clearLocationReturnHref,
} from "../utils/locationReturnNav";

type NavButton = {
  label: string;
  path?: string;
  onClick?: () => void;
  /** Телепорт у окрестности: /location?id=... або /gk */
  isLocationEntry?: boolean;
  icon: string;
};

const pillClass =
  "relative flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-full border border-[#4a4540] bg-[#2c2a28] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] text-[#e8c56e] hover:bg-[#353330] hover:border-[#6b5c48] hover:text-[#f4e2b8] active:scale-[0.98] transition-[transform,background-color,border-color,color] duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c7ad80]/55";

const pillLabelClass =
  "block max-w-[calc(100%-22px)] text-center text-[9px] sm:text-[10px] font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]";

/** Верхня сітка (як на референсі) */
const topGridRows: NavButton[][] = [
  [
    { label: "Почта", path: "/mail", icon: "/icons/verx.png" },
    { label: "Чат", path: "/chat", icon: "/icons/fpn.png" },
    { label: "Форум", path: "/forum", icon: "/icons/clanns.png" },
  ],
  [
    { label: "Окрестности", isLocationEntry: true, icon: "/icons/teleport.jpg" },
    { label: "Клан", path: "/clans", icon: "/icons/clann.jpg" },
    { label: "Город", path: "/city", icon: "/icons/teleport.jpg" },
  ],
  [
    { label: "Инвентарь", path: "/inventory", icon: "/icons/bank.jpg" },
    { label: "Персонаж", path: "/character", icon: "/icons/helper.jpg" },
  ],
];

const topGridWide: NavButton[] = [
  { label: "Рейтинги", path: "/leaderboard", icon: "/icons/zst_cf.jpg" },
];

const topGridSecondary: NavButton[] = [
  { label: "Меню", path: "/about", icon: "/icons/fon.png" },
  { label: "Новости", path: "/news", icon: "/icons/battle.jpg" },
];

type NavGridContextValue = {
  navigate?: (path: string) => void;
  routePathname: string;
  unreadCount: number;
  clanUnreadCount: number;
  handleClick: (btn: NavButton) => Promise<void>;
};

const NavGridContext = React.createContext<NavGridContextValue | null>(null);

interface NavGridProviderProps {
  navigate?: (path: string) => void;
  /** Синхронно з App — для оновлення кнопки «назад в окрестности» */
  routePathname?: string;
  children: React.ReactNode;
}

function navIconOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget;
  if (el.dataset.fallback === "1") return;
  el.dataset.fallback = "1";
  el.src = "/icons/clanns.png";
}

export function NavGridProvider({
  navigate,
  routePathname = "",
  children,
}: NavGridProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [clanUnreadCount, setClanUnreadCount] = useState(0);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const heroId = useHeroStore((s) => s.hero?.id);
  const previousUnreadRef = useRef(0);

  const pathNorm = useMemo(
    () => (routePathname || "").split("?")[0]?.replace(/\/+$/, "") || "",
    [routePathname],
  );

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
      } catch (err: unknown) {
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
      } catch (err: unknown) {
        console.error("[NavGrid] Failed to load clan unread count:", err);
        setClanUnreadCount(0);
      }
    };

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

  const beforeNavigate = useCallback((targetPath: string) => {
    if (typeof window === "undefined" || !targetPath) return;
    const pn = window.location.pathname;
    const sc = window.location.search || "";
    rememberLocationIfLeaving(pn, sc, targetPath);
    if (targetPath.split("?")[0]?.replace(/\/+$/, "") === "/city") {
      clearLocationReturnHref();
    }
  }, []);

  const handleClick = useCallback(
    async (btn: NavButton) => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

      if (btn.onClick) {
        btn.onClick();
        return;
      }

      if (btn.isLocationEntry && navigate) {
        const z = getPreviousLocation();
        const target = z ? `/location?id=${encodeURIComponent(z)}&page=1` : "/gk";
        beforeNavigate(target);
        clearLocationReturnHref();
        navigate(target);
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
          const target = clan ? `/clan/${clan.id}` : "/clans";
          beforeNavigate(target);
          navigate(target);
        } catch (err) {
          console.error("[NavGrid] Failed to check clan:", err);
          beforeNavigate("/clans");
          navigate("/clans");
        }
        return;
      }

      if (btn.path && navigate) {
        beforeNavigate(btn.path);
        navigate(btn.path);
        return;
      }
      showToast("Функція недоступна", "info");
    },
    [navigate, beforeNavigate],
  );

  const value = useMemo<NavGridContextValue>(
    () => ({
      navigate,
      routePathname: pathNorm,
      unreadCount,
      clanUnreadCount,
      handleClick,
    }),
    [navigate, pathNorm, unreadCount, clanUnreadCount, handleClick],
  );

  return <NavGridContext.Provider value={value}>{children}</NavGridContext.Provider>;
}

function useNavGridCtx(): NavGridContextValue | null {
  return useContext(NavGridContext);
}

function NavPillButton({ btn }: { btn: NavButton }) {
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
      className={pillClass}
      title={btn.label}
    >
      <img
        src={btn.icon}
        alt=""
        className="h-5 w-5 shrink-0 rounded object-cover opacity-95"
        width={20}
        height={20}
        onError={navIconOnError}
      />
      <span className={pillLabelClass}>{btn.label}</span>
      {showMailBadge && (
        <span className="absolute -top-0.5 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-600 text-white text-[7px] font-bold leading-[14px] text-center shadow-sm ring-1 ring-black/40">
          {unreadCount > 99 ? "99" : unreadCount}
        </span>
      )}
      {showClanBadge && (
        <span className="absolute -top-0.5 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-600 text-white text-[7px] font-bold leading-[14px] text-center shadow-sm ring-1 ring-black/40">
          {clanUnreadCount > 99 ? "99" : clanUnreadCount}
        </span>
      )}
    </button>
  );
}

/** Перший блок у прокрутці — «пігулки» у сітці */
export function NavScrollTopRow() {
  const ctx = useNavGridCtx();
  if (!ctx) return null;

  return (
    <div
      className="w-full min-w-0 mb-2 pt-0.5 -mt-0.5 space-y-2"
      aria-label="Навігація гри"
    >
      {topGridRows.map((row, ri) => (
        <div
          key={ri}
          className={
            row.length === 2
              ? "flex w-full justify-center gap-2"
              : "grid w-full grid-cols-3 gap-2"
          }
        >
          {row.map((btn) => (
            <div key={btn.label} className={row.length === 2 ? "min-w-0 max-w-[46%] flex-1" : "min-w-0"}>
              <NavPillButton btn={btn} />
            </div>
          ))}
        </div>
      ))}
      <div className="flex justify-center">
        <div className="w-full max-w-[min(100%,280px)] min-w-0">
          {topGridWide.map((btn) => (
            <NavPillButton key={btn.label} btn={btn} />
          ))}
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-2">
        {topGridSecondary.map((btn) => (
          <NavPillButton key={btn.label} btn={btn} />
        ))}
      </div>
    </div>
  );
}

/** Низ: повернення в окрестности + футер як на референсі */
export default function NavGridBottomFixed() {
  const ctx = useNavGridCtx();
  const onlineCount = useOnlineCountStore((s) => s.onlineCount);
  const [returnHref, setReturnHref] = useState<string | null>(() => peekLocationReturnHref());

  useEffect(() => {
    setReturnHref(peekLocationReturnHref());
  }, [ctx?.routePathname]);

  if (!ctx) return null;
  const { navigate } = ctx;

  const onBackLocation = () => {
    const href = consumeLocationReturnHref();
    setReturnHref(null);
    if (href && navigate) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      navigate(href);
    }
  };

  const backBtn: NavButton = {
    label: "Окрестности",
    icon: "/icons/teleport.jpg",
    onClick: onBackLocation,
  };

  return (
    <div
      className="!fixed bottom-0 left-0 right-0 z-50 w-full min-w-0 box-border pointer-events-none"
      data-nav-bottom-dock
    >
      {returnHref ? (
        <div className="pointer-events-auto px-2 pb-1 sm:px-3">
          <NavPillButton btn={backBtn} />
        </div>
      ) : null}
      <div className="pointer-events-auto border-t border-[#c7ad80]/45 bg-[#0a0908]/98 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-3">
        <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-[10px] sm:text-[11px] text-[#d4af37]">
          <button
            type="button"
            className="hover:text-[#f0d878] hover:underline underline-offset-2"
            onClick={() => {
              setString("l2_last_feature", "Позвать друзей");
              navigate?.("/wip");
            }}
          >
            Позвать друзей
          </button>
          <span className="text-[#6b5c48] select-none" aria-hidden>
            |
          </span>
          <button
            type="button"
            className="hover:text-[#f0d878] hover:underline underline-offset-2"
            onClick={() => {
              setString("l2_last_feature", "Поддержка");
              navigate?.("/wip");
            }}
          >
            Служба поддержки
          </button>
          <span className="text-[#6b5c48] select-none" aria-hidden>
            |
          </span>
          <button
            type="button"
            className="hover:text-[#f0d878] hover:underline underline-offset-2"
            onClick={() => navigate?.("/stats")}
          >
            Статы
          </button>
          <span className="text-[#6b5c48] select-none" aria-hidden>
            |
          </span>
          <button
            type="button"
            className="hover:text-[#f0d878] hover:underline underline-offset-2"
            onClick={() => navigate?.("/online-players")}
          >
            Онлайн: {onlineCount}
          </button>
        </div>
      </div>
    </div>
  );
}
