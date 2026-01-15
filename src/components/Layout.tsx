import React, { useState, useEffect } from "react";
import NavGrid from "./NavGrid";
import StatusBars from "./StatusBars";
import SummonStatus from "./SummonStatus";
import { useAuthStore } from "../state/authStore";
import { getOnlinePlayers, sendHeartbeat } from "../utils/api";

interface LayoutProps {
  children: React.ReactNode;
  navigate?: (path: string) => void;
  showNavGrid?: boolean;
  showStatusBars?: boolean;
  customBackground?: string; // Шлях до кастомного фону
}

export default function Layout({
  children,
  navigate,
  showNavGrid = true,
  showStatusBars = true,
  customBackground,
}: LayoutProps) {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // 🔥 Завантажуємо кількість онлайн та оновлюємо кожні 30 секунд (тільки якщо залоговані)
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadOnlineCount = async () => {
      try {
        const data = await getOnlinePlayers();
        setOnlineCount(data.count || 0);
      } catch (err) {
        console.error('[Layout] Failed to load online count:', err);
        // Не показуємо помилку, просто залишаємо попереднє значення
      }
    };

    loadOnlineCount();
    const interval = setInterval(loadOnlineCount, 30000); // Оновлюємо кожні 30 секунд
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // 🔥 Heartbeat - оновлюємо активність кожні 2 хвилини (120 секунд)
  useEffect(() => {
    if (!isAuthenticated) return;

    const sendHeartbeatInterval = async () => {
      try {
        await sendHeartbeat();
        console.log('[Layout] Heartbeat sent');
      } catch (err) {
        console.error('[Layout] Failed to send heartbeat:', err);
      }
    };

    // Відправляємо heartbeat одразу при монтуванні
    sendHeartbeatInterval();

    // Відправляємо heartbeat кожні 2 хвилини
    const heartbeatInterval = setInterval(sendHeartbeatInterval, 2 * 60 * 1000);
    return () => clearInterval(heartbeatInterval);
  }, [isAuthenticated]);

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
        <div className="flex-1 pb-32 pt-20 overflow-y-auto relative z-10">{children}</div>
        
        {/* Кнопки: Поддержка | Онлайн | Выйти */}
        <div className="fixed bottom-16 left-0 right-0 z-40 flex justify-center pointer-events-none px-2 sm:px-4">
          <div className="w-full max-w-[380px] flex items-center justify-center gap-1 text-[10px] pointer-events-auto" style={{ transform: 'translateX(-5px)' }}>
            <button
              onClick={handleSupport}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              Поддержка
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={handleOnline}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              Онлайн: {onlineCount}
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              [Выйти]
            </button>
          </div>
        </div>
      </div>
      {showNavGrid && <NavGrid navigate={navigate} />}
    </div>
  );
}

