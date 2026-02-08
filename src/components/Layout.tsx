import React, { useState, useEffect, useRef, useMemo } from "react";
import NavGrid from "./NavGrid";
import StatusBars from "./StatusBars";
import SummonStatus from "./SummonStatus";
// 🔥 ПРИБРАНО: MobDamageNotification - не працює правильно
// import MobDamageNotification from "./MobDamageNotification";
import { useAuthStore } from "../state/authStore";
import { getRateLimitRemainingMs } from "../state/heroStore";
import { getOnlinePlayers, sendHeartbeat } from "../utils/api";
import { useBattleStore } from "../state/battle/store";

interface LayoutProps {
  children: React.ReactNode;
  navigate?: (path: string) => void;
  showNavGrid?: boolean;
  showStatusBars?: boolean;
  customBackground?: string; // Шлях до кастомного фону
  hideFooterButtons?: boolean; // 🔥 Приховати кнопки "Поддержка | Онлайн | Выйти"
  contentTopCompact?: boolean; // 🔥 Менший top padding — картинка (teleport) під банер
}

export default function Layout({
  children,
  navigate,
  showNavGrid = true,
  showStatusBars = true,
  customBackground,
  hideFooterButtons = false,
  contentTopCompact = false,
}: LayoutProps) {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [cooldownSec, setCooldownSec] = useState(0); // 🔥 Показуємо "Зачекайте X сек" при 429
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const contentRef = useRef<HTMLDivElement>(null);
  const pathnameRef = useRef<string>('');
  const { processMobAttack, status: battleStatus, regenTick } = useBattleStore();

  // 🔥 Визначаємо "легкі" сторінки, для яких не потрібні важкі операції
  // 🔥 КРИТИЧНО: Використовуємо useMemo для стабілізації, щоб не тригерити useEffect при кожному рендері
  const isLightPage = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    const pathname = window.location.pathname;
    return pathname.startsWith('/mail') ||
           pathname.startsWith('/about') ||
           pathname.startsWith('/forum');
  }, []); // Пустий масив - обчислюється один раз

  // 🔥 Скрол вгору тільки при зміні сторінки (pathname), а не при скролі користувача
  useEffect(() => {
    const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
    // Скролимо тільки якщо pathname дійсно змінився
    if (currentPathname !== pathnameRef.current) {
      pathnameRef.current = currentPathname;
      // Скролимо window вгору
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      // Скролимо contentRef вгору (якщо він має скрол)
      if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      // Додатково скролимо document.body та document.documentElement
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  }, [children]); // Залишаємо children як тригер, але перевіряємо pathname

  // 🔥 Глобальний таймер для продовження бою - моб атакує навіть якщо гравець в місті чи іншому місці
  // 🔥 КРИТИЧНО: Використовуємо useRef для зберігання interval ID, щоб уникнути дублювання
  const battleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 🔥 Правильний патерн React: cleanup тільки в return, не перед створенням
    if (!isAuthenticated || battleStatus !== "fighting") {
      return; // Cleanup спрацює автоматично через return нижче
    }

    // 🔥 КРИТИЧНО: Використовуємо функції з store всередині interval, а не в dependencies
    const interval = setInterval(() => {
      const battleStore = useBattleStore.getState();
      // Продовжуємо бій - моб атакує незалежно від локації
      battleStore.processMobAttack();
      battleStore.regenTick();
    }, 1000);
    
    battleIntervalRef.current = interval; // Зберігаємо для можливості ручного очищення

    return () => {
      clearInterval(interval);
      battleIntervalRef.current = null;
    };
  }, [isAuthenticated, battleStatus]); // 🔥 Мінімальні dependencies - тільки примітиви

  // 🔥 Завантажуємо кількість онлайн та оновлюємо кожні 30 секунд (тільки якщо залоговані)
  // 🔥 Для легких сторінок відкладаємо завантаження на 800-1200 мс для швидкого рендерингу
  // ❗ ОПТИМІЗАЦІЯ: Online count - fire-and-forget, не блокує UI
  // 🔥 КРИТИЧНО: Використовуємо useRef для зберігання interval ID, щоб уникнути дублювання
  const onlineIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onlineTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 🔥 Правильний патерн React: cleanup тільки в return, не перед створенням
    if (!isAuthenticated) {
      setOnlineCount(0);
      return; // Cleanup спрацює автоматично через return нижче
    }

    const loadOnlineCount = () => {
      if (getRateLimitRemainingMs() > 0) return; // 🔥 Під час cooldown не славимо запити
      // ❗ Fire-and-forget: не await, не блокує UI
      getOnlinePlayers()
        .then((data) => {
          const count = data.count ?? data.players?.length ?? 0;
          if (import.meta.env.DEV) {
            console.log('[Layout] Online count loaded:', count, 'players:', data.players?.length);
          }
          setOnlineCount(count);
        })
        .catch((err: any) => {
          // ❗ Ігноруємо 401 помилки (неавторизований) - це нормально
          if (err?.status === 401 || err?.unauthorized) {
            if (import.meta.env.DEV) {
              console.log('[Layout] Not authenticated, skipping online count');
            }
            setOnlineCount(0);
            return;
          }
          if (import.meta.env.DEV) {
            console.error('[Layout] Failed to load online count:', err?.message || err);
          }
          // Не показуємо помилку, просто залишаємо попереднє значення або 0
        });
    };

    // 🔥 Перші 5–8 с — тільки GET character. Online/heartbeat/unread не славимо, щоб PUT не отримав 429
    const delay = isLightPage ? 3000 : 8000;
    const timeout = setTimeout(loadOnlineCount, delay);
    onlineTimeoutRef.current = timeout; // Зберігаємо для можливості ручного очищення

    // Оновлюємо кожні 60 с (було 30), менше запитів = менше 429
    let interval: NodeJS.Timeout | null = null;
    if (!isLightPage) {
      interval = setInterval(loadOnlineCount, 60000);
      onlineIntervalRef.current = interval; // Зберігаємо для можливості ручного очищення
    }
    
    return () => {
      clearTimeout(timeout);
      onlineTimeoutRef.current = null;
      if (interval) {
        clearInterval(interval);
        onlineIntervalRef.current = null;
      }
    };
  }, [isAuthenticated]); // 🔥 Мінімальні dependencies - тільки isAuthenticated, isLightPage стабільний через useMemo

  // 🔥 Heartbeat - оновлюємо активність кожні 2 хвилини (120 секунд)
  // 🔥 Якщо поле lastActivityAt не існує в БД, heartbeat може повертати 400/500 - ігноруємо помилки
  // 🔥 Пропускаємо heartbeat для легких сторінок (mail, about, forum)
  // ❗ ОПТИМІЗАЦІЯ: Heartbeat - fire-and-forget, не блокує UI
  // 🔥 КРИТИЧНО: Використовуємо useRef для зберігання interval/timeout ID, щоб уникнути дублювання
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 🔥 Правильний патерн React: cleanup тільки в return, не перед створенням
    if (!isAuthenticated || isLightPage) {
      return; // Cleanup спрацює автоматично через return нижче
    }

    const sendHeartbeatInterval = () => {
      // 🔥 Під час rate limit cooldown не славимо heartbeat, щоб не витрачати ліміт на збереження
      if (getRateLimitRemainingMs() > 0) return;
      // ❗ Fire-and-forget: не await, не блокує UI
      sendHeartbeat()
        .then(() => {
          if (import.meta.env.DEV) {
            console.log('[Layout] Heartbeat sent');
          }
        })
        .catch((err: any) => {
          // 🔥 Ігноруємо помилки heartbeat - вони не критичні
          // Можливо поле lastActivityAt не існує в БД (міграція не виконана)
          // Або інші тимчасові проблеми з БД
          if (import.meta.env.DEV) {
            if (err?.status === 400 || err?.status === 404 || err?.status === 500) {
              console.warn('[Layout] Heartbeat failed (non-critical):', err?.message);
            } else {
              console.error('[Layout] Failed to send heartbeat:', err);
            }
          }
        });
    };

    // 🔥 Перший heartbeat через 8 с — гравець одразу показується в онлайні
    const timeout = setTimeout(sendHeartbeatInterval, 8000);
    heartbeatTimeoutRef.current = timeout; // Зберігаємо для можливості ручного очищення

    // Відправляємо heartbeat кожні 4 хвилини (було 2), менше запитів = менше 429
    const interval = setInterval(sendHeartbeatInterval, 4 * 60 * 1000);
    heartbeatIntervalRef.current = interval; // Зберігаємо для можливості ручного очищення
    
    return () => {
      clearTimeout(timeout);
      heartbeatTimeoutRef.current = null;
      clearInterval(interval);
      heartbeatIntervalRef.current = null;
    };
  }, [isAuthenticated]); // 🔥 Мінімальні dependencies - тільки isAuthenticated, isLightPage стабільний через useMemo

  // 🔥 Індикатор rate limit: оновлюємо кожну секунду, щоб показати "Зачекайте X сек"
  useEffect(() => {
    const t = setInterval(() => {
      const ms = getRateLimitRemainingMs();
      setCooldownSec(ms > 0 ? Math.ceil(ms / 1000) : 0);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleSupport = () => {
    // TODO: Відкрити підтримку
    if (navigate) {
      navigate("/wip");
    }
  };

  const handleOnline = () => {
    if (navigate) {
      navigate("/online-players");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Ви впевнені, що хочете вийти?")) {
      logout();
      if (navigate) {
        navigate("/");
      }
    }
  };

  return (
    <div className="min-h-screen h-[100dvh] bg-black flex justify-center p-2 sm:p-4 overflow-hidden">
      <div
        className={`w-full max-w-[380px] flex flex-col relative min-h-[100dvh] ${!customBackground ? "l2-frame page-bg" : ""}`}
        style={
          customBackground
              ? {
                border: "1px solid #c7ad80",
                padding: "10px",
                borderRadius: "10px",
                boxShadow: "inset 0 0 10px #000",
                backgroundColor: "#252422", /* Трохи світліший фон */
                width: "100%",
                overflowX: "hidden",
                position: "relative",
              }
            : {
                backgroundColor: "#252422", /* Трохи світліший фон */
              }
        }
      >
        {showStatusBars && <StatusBars />}
        {cooldownSec > 0 && (
          <div className="fixed top-14 left-0 right-0 z-50 bg-amber-900/95 text-amber-200 text-center text-xs py-1.5 px-2">
            Забагато запитів. Зачекайте {cooldownSec} сек.
          </div>
        )}
        <SummonStatus /> {/* Завжди показуємо сумон, якщо він є */}
        {/* 🔥 ПРИБРАНО: MobDamageNotification - не працює правильно */}
        {/* <MobDamageNotification navigate={navigate} /> */}
        {/* 🔥 Додаємо padding-top, щоб контент не перекривався з fixed барами */}
        {/* 🔥 Додаємо padding-bottom для місця під нижнє меню (NavGrid) на телефоні */}
        <div ref={contentRef} className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10 flex justify-center ${contentTopCompact ? "pt-4" : "pt-14"}`} style={{ paddingBottom: "max(24rem, env(safe-area-inset-bottom, 0px) + 18rem)" }}>
          <div className={`w-full max-w-[360px] px-3 ${contentTopCompact ? "mt-0" : "mt-0"}`}>
            {children}
          </div>
        </div>
        
        {/* 🔥 Футер видалено за запитом користувача */}
        </div>
        {showNavGrid && <NavGrid navigate={navigate} />}
      </div>
  );
}

