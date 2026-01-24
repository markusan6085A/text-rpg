import React, { useState, useEffect, useRef } from "react";
import NavGrid from "./NavGrid";
import StatusBars from "./StatusBars";
import SummonStatus from "./SummonStatus";
import MobDamageNotification from "./MobDamageNotification";
import { useAuthStore } from "../state/authStore";
import { getOnlinePlayers, sendHeartbeat } from "../utils/api";
import { useBattleStore } from "../state/battle/store";

interface LayoutProps {
  children: React.ReactNode;
  navigate?: (path: string) => void;
  showNavGrid?: boolean;
  showStatusBars?: boolean;
  customBackground?: string; // Шлях до кастомного фону
  hideFooterButtons?: boolean; // 🔥 Приховати кнопки "Поддержка | Онлайн | Выйти"
}

export default function Layout({
  children,
  navigate,
  showNavGrid = true,
  showStatusBars = true,
  customBackground,
  hideFooterButtons = false,
}: LayoutProps) {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const contentRef = useRef<HTMLDivElement>(null);
  const pathnameRef = useRef<string>('');
  const { processMobAttack, status: battleStatus, regenTick } = useBattleStore();

  // 🔥 Визначаємо "легкі" сторінки, для яких не потрібні важкі операції
  const isLightPage = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/mail') ||
    window.location.pathname.startsWith('/about') ||
    window.location.pathname.startsWith('/forum')
  );

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
  useEffect(() => {
    if (!isAuthenticated || battleStatus !== "fighting") return;

    const interval = setInterval(() => {
      // Продовжуємо бій - моб атакує незалежно від локації
      processMobAttack();
      regenTick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, battleStatus, processMobAttack, regenTick]);

  // 🔥 Завантажуємо кількість онлайн та оновлюємо кожні 30 секунд (тільки якщо залоговані)
  // 🔥 Для легких сторінок відкладаємо завантаження на 800-1200 мс для швидкого рендерингу
  // ❗ ОПТИМІЗАЦІЯ: Online count - fire-and-forget, не блокує UI
  useEffect(() => {
    if (!isAuthenticated) {
      setOnlineCount(0);
      return;
    }

    const loadOnlineCount = () => {
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
          if (onlineCount === null || onlineCount === undefined) {
            setOnlineCount(0);
          }
        });
    };

    // Відкладаємо завантаження для легких сторінок (більше часу для не критичних запитів)
    const delay = isLightPage ? 2000 : 1000;
    const timeoutId = setTimeout(loadOnlineCount, delay);

    // Оновлюємо кожні 30 секунд тільки якщо не легка сторінка
    const interval = isLightPage ? null : setInterval(loadOnlineCount, 30000);
    
    return () => {
      clearTimeout(timeoutId);
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, isLightPage]);

  // 🔥 Heartbeat - оновлюємо активність кожні 2 хвилини (120 секунд)
  // 🔥 Якщо поле lastActivityAt не існує в БД, heartbeat може повертати 400/500 - ігноруємо помилки
  // 🔥 Пропускаємо heartbeat для легких сторінок (mail, about, forum)
  // ❗ ОПТИМІЗАЦІЯ: Heartbeat - fire-and-forget, не блокує UI
  useEffect(() => {
    if (!isAuthenticated || isLightPage) return;

    const sendHeartbeatInterval = () => {
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

    // Відкладаємо перший heartbeat на 5 секунд, щоб не блокувати початкове завантаження
    const initialDelay = setTimeout(sendHeartbeatInterval, 5000);

    // Відправляємо heartbeat кожні 2 хвилини
    const heartbeatInterval = setInterval(sendHeartbeatInterval, 2 * 60 * 1000);
    return () => {
      clearTimeout(initialDelay);
      clearInterval(heartbeatInterval);
    };
  }, [isAuthenticated, isLightPage]);

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
    <div className="min-h-screen bg-black flex justify-center p-2 sm:p-4 overflow-x-hidden">
      <div
        className={`w-full max-w-[380px] flex flex-col relative min-h-screen ${!customBackground ? "l2-frame page-bg" : ""}`}
        style={
          customBackground
            ? {
                border: "1px solid #3b2614",
                padding: "10px",
                borderRadius: "10px",
                boxShadow: "inset 0 0 10px #000",
                background: "transparent",
                minHeight: "100vh",
                width: "100%",
                overflowX: "hidden",
                position: "relative",
              }
            : undefined
        }
      >
        {/* Кастомний фон як окремий шар - позаду всього контенту */}
        {customBackground && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${customBackground})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              zIndex: 0,
            }}
          />
        )}
        {showStatusBars && <StatusBars />}
        <SummonStatus /> {/* Завжди показуємо сумон, якщо він є */}
        <MobDamageNotification navigate={navigate} /> {/* Повідомлення про урон від мобів */}
        {/* 🔥 Додаємо padding-top, щоб контент не перекривався з fixed барами */}
        <div ref={contentRef} className="flex-1 pb-2 pt-16 overflow-y-auto relative z-10 flex justify-center">
          <div className="w-full max-w-[360px] mt-2 px-3">
            {children}
          </div>
        </div>
        
        {/* 🔥 Футер видалено за запитом користувача */}
      </div>
      {showNavGrid && <NavGrid navigate={navigate} />}
    </div>
  );
}

