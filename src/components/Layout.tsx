import React, { useState, useEffect, useRef, useMemo } from "react";
import { NavGridProvider, NavScrollFooter } from "./NavGrid";
import StatusBars from "./StatusBars";
import HeroStatusStrip from "./HeroStatusStrip";
import TutorialHint from "./TutorialHint";
import PartyHud from "./PartyHud";
import Toast from "./Toast";
import ConfirmModal from "./ConfirmModal";
// 🔥 ПРИБРАНО: MobDamageNotification - не працює правильно
// import MobDamageNotification from "./MobDamageNotification";
import { useAuthStore } from "../state/authStore";
import { useAdminStore } from "../state/adminStore";
import { getRateLimitRemainingMs, useHeroStore, setResurrectInProgress } from "../state/heroStore";
import { getOnlinePlayers, sendHeartbeat, adminLogout, resurrectCharacter } from "../utils/api";
import { useOnlineCountStore } from "../state/onlineCountStore";
import { isHeroDead } from "../state/heroStore/isHeroDead";
import { useCharacterStore } from "../state/characterStore";
import { useBattleStore } from "../state/battle/store";
import {
  schedulePveMobTickOnline,
  shouldUsePveServerMobTick,
} from "../state/battle/actions/pveMobTickOnline";
import { getGameSettings } from "../state/gameSettings";
import { setString } from "../state/persistence";
import { clearDeathGate, readDeathGate } from "../utils/deathGate";

interface LayoutProps {
  children: React.ReactNode;
  navigate?: (path: string) => void;
  showNavGrid?: boolean;
  /** Підказки TutorialHint + смуга HeroStatusStrip (CP/HP/MP/EXP під шапкою) */
  showStatusBars?: boolean;
  /** Фіксовані CP/HP/MP/XP у куті — за замовчуванням вимкнено; бари в контенті (напр. /character) */
  showResourceHud?: boolean;
  /** Поточний маршрут з App (синхронно зі state), інакше береться window.location */
  routePathname?: string;
  /** Query з App (`?zone=...`), для підказок на /location */
  routeSearch?: string;
  customBackground?: string; // Шлях до кастомного фону
  hideFooterButtons?: boolean; // 🔥 Приховати кнопки "Поддержка | Онлайн | Выйти"
  contentTopCompact?: boolean; // 🔥 Менший top padding — картинка (teleport) під банер
}

export default function Layout({
  children,
  navigate,
  showNavGrid = true,
  showStatusBars = true,
  showResourceHud = false,
  routePathname,
  routeSearch = "",
  customBackground,
  hideFooterButtons = false,
  contentTopCompact = false,
}: LayoutProps) {
  const { onlineCount, setOnlineCount } = useOnlineCountStore();
  const [cooldownSec, setCooldownSec] = useState(0); // 🔥 Показуємо "Зачекайте X сек" при 429
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const contentRef = useRef<HTMLDivElement>(null);
  const pathnameRef = useRef<string>('');
  const { processMobAttack, status: battleStatus, regenTick } = useBattleStore();
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const characterId = useCharacterStore((s) => s.characterId);
  const deathGate = readDeathGate(characterId, hero?.name);
  const dead = hero ? isHeroDead(hero) : false;
  /** Блокуємо UI, поки є прапорець смерті в LS або герой мертвий за isHeroDead */
  const blockDeathUi = Boolean(deathGate) || dead;
  const [resurrecting, setResurrecting] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  // Після F5 merge міг «оживити» HP — якщо death gate ще є, знову фіксуємо смерть.
  useEffect(() => {
    if (!deathGate) return;
    const h = useHeroStore.getState().hero;
    if (!h?.name) return;
    if ((h.hp ?? 0) <= 0 && isHeroDead(h)) return;
    const hj = (h as any).heroJson || {};
    updateHero(
      {
        hp: 0,
        mp: 0,
        cp: 0,
        heroJson: {
          ...hj,
          heroBuffs: [],
          isDead: true,
          deadAt: deathGate.at,
          killedByMobName: deathGate.killerName,
          killedByMobDamage: deathGate.damage,
        } as any,
      },
      { persist: true }
    );
  }, [deathGate, updateHero]);

  const handleResurrectToCity = async () => {
    if (!characterId || !navigate || !hero?.name || resurrecting) return;
    setResurrecting(true);
    setResurrectInProgress(true);
    try {
      const expectedRevision = Number((hero as any)?.heroJson?.heroRevision ?? 0);
      const char = await resurrectCharacter(characterId, 0.7, expectedRevision);
      const hj = (char as any)?.heroJson;
      clearDeathGate(characterId, hero.name);
      if (hj) {
        const store = useHeroStore.getState();
        const liveHero = store.hero;
        if (liveHero) {
          const nextLevel = Number((char as any)?.level ?? liveHero.level ?? 1);
          const nextExp = Number((char as any)?.exp ?? liveHero.exp ?? 0);
          const nextSp = Number((char as any)?.sp ?? liveHero.sp ?? 0);
          const nextAdena = Number((char as any)?.adena ?? liveHero.adena ?? 0);
          const nextCoinLuck = Number((char as any)?.coinLuck ?? liveHero.coinOfLuck ?? 0);
          const nextInventory = Array.isArray(hj.inventory) ? hj.inventory : liveHero.inventory ?? [];
          const nextOverflow = Array.isArray(hj.overflowChest) ? hj.overflowChest : liveHero.overflowChest ?? [];
          const nextActiveDyes = Array.isArray(hj.activeDyes) ? hj.activeDyes : liveHero.activeDyes ?? [];
          const revision = Number(hj.heroRevision ?? (liveHero as any)?.heroJson?.heroRevision ?? 0);
          store.applyServerSync(
            {
              level: nextLevel,
              exp: nextExp,
              sp: nextSp,
              adena: nextAdena,
              coinOfLuck: nextCoinLuck,
              hp: Number(hj.hp) || 1,
              mp: Number(hj.mp) ?? 0,
              cp: Number(hj.cp) ?? 0,
              inventory: nextInventory,
              overflowChest: nextOverflow,
              activeDyes: nextActiveDyes,
              heroJson: {
                ...hj,
                isDead: false,
                deadAt: 0,
                killedByMobName: undefined,
                killedByMobDamage: undefined,
                heroBuffs: [],
              } as any,
            } as any,
            {
              level: nextLevel,
              exp: nextExp,
              sp: nextSp,
              adena: nextAdena,
              coinLuck: nextCoinLuck,
              heroRevision: Number.isFinite(revision) ? revision : 0,
              updatedAt: Date.now(),
            }
          );
        }
      }
      navigate("/city");
    } catch (e) {
      console.warn("[Layout] resurrect to city failed", e);
    } finally {
      setResurrectInProgress(false);
      setResurrecting(false);
    }
  };

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

  // 🔥 Глобальний таймер для продовження бою — тільки коли гравець на сторінці бою
  // Моби НЕ атакують в місті чи іншому місці — лише на /battle
  const battleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 🔥 Правильний патерн React: cleanup тільки в return, не перед створенням
    if (!isAuthenticated || battleStatus !== "fighting") {
      return; // Cleanup спрацює автоматично через return нижче
    }

    // 🔥 КРИТИЧНО: Використовуємо функції з store всередині interval, а не в dependencies
    const interval = setInterval(() => {
      const pathname = typeof window !== "undefined" ? window.location.pathname.replace(/\?.*$/, "") : "";
      if (pathname !== "/battle") return; // Не атакувати поза сторінкою бою
      const battleStore = useBattleStore.getState();
      const now = Date.now();
      if (shouldUsePveServerMobTick()) {
        const st = battleStore;
        if (st.mobStunnedUntil && st.mobStunnedUntil > now) {
          battleStore.processMobAttack();
        } else if (!st.mobNextAttackAt || now >= st.mobNextAttackAt) {
          schedulePveMobTickOnline();
        }
      } else {
        battleStore.processMobAttack();
      }
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
      return;
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
    if (navigate) {
      setString("l2_last_feature", "Поддержка");
      navigate("/wip");
    }
  };

  const handleOnline = () => {
    if (navigate) {
      navigate("/online-players");
    }
  };

  const gameSettings = getGameSettings();

  const handleLogout = () => {
    setLogoutConfirm(true);
  };

  const doLogout = () => {
    setLogoutConfirm(false);
    logout();
    adminLogout().catch(() => {});
    useAdminStore.getState().resetAdmin();
    useHeroStore.getState().setHero(null as any);
    // window.location.replace замість navigate("/"):
    // - hard reload → очищує React state в пам'яті
    // - replace → замінює поточний запис в history, тому Back не повертає на цю сторінку
    window.location.replace("/");
  };

  return (
    <div className="min-h-dvh bg-black w-full min-w-0 box-border flex flex-col items-stretch px-0 py-2 sm:px-2 sm:py-2 md:px-3">
      <div
        className={`w-full min-w-0 max-w-none flex flex-col relative min-h-dvh flex-1 ${!customBackground ? "l2-frame page-bg" : ""}`}
        style={
          customBackground
              ? {
                border: "1px solid #c7ad80",
                padding: "10px",
                borderRadius: "10px",
                boxShadow: "inset 0 0 10px #000",
                backgroundColor: "#252422",
                width: "100%",
                overflowX: "hidden",
                position: "relative",
              }
            : {
                backgroundColor: "#252422",
              }
        }
      >
        <StatusBars showResourceHud={showResourceHud} />
        {!blockDeathUi ? (
        <TutorialHint
          navigate={navigate}
          showStatusBars={showStatusBars}
          pathname={
            routePathname ??
            (typeof window !== "undefined" ? window.location.pathname.replace(/\?.*$/, "") : "")
          }
          routeSearch={routeSearch}
          hero={hero}
        />
        ) : null}
        {blockDeathUi && navigate && (
          <div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-4 bg-black/92 pointer-events-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="death-screen-title"
          >
            <div
              className="max-w-md w-full translate-y-[1cm] rounded-xl border border-[#8b2942]/80 bg-[#1a0c0c] px-5 py-6 text-center shadow-[0_0_40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,200,200,0.06)]"
            >
              <h2 id="death-screen-title" className="text-lg font-semibold text-[#f0c0c0] mb-3">
                {getGameSettings().language === "uk" ? "Ви загинули" : "Вы погибли"}
              </h2>
              <p className="text-sm text-[#d4a8a8] leading-relaxed mb-6">
                {(() => {
                  const name =
                    (deathGate?.killerName ??
                      String((hero as any)?.heroJson?.killedByMobName ?? "").trim()) || "?";
                  const dmg =
                    (deathGate?.damage ??
                      Number((hero as any)?.heroJson?.killedByMobDamage)) || 0;
                  return getGameSettings().language === "uk"
                    ? `Вас убило: ${name}. Завдано урону: ${dmg}.`
                    : `Вас убил(а): ${name}. Нанесено урона: ${dmg}.`;
                })()}
              </p>
              <button
                type="button"
                onClick={handleResurrectToCity}
                disabled={resurrecting}
                className="w-full py-3.5 rounded-lg text-[13px] font-semibold tracking-wide text-[#f4e8d4] disabled:opacity-55 disabled:pointer-events-none bg-gradient-to-b from-[#4a3824] via-[#342818] to-[#1e1510] border border-[#c7ad80]/85 shadow-[inset_0_1px_0_rgba(232,197,110,0.22),0_6px_20px_rgba(0,0,0,0.55)] hover:from-[#5c4830] hover:via-[#3d2e1c] hover:to-[#261a12] hover:border-[#e8c56e]/75 hover:text-[#fff8e8] hover:shadow-[inset_0_1px_0_rgba(255,220,160,0.18),0_8px_28px_rgba(0,0,0,0.6)] active:scale-[0.99] transition-[transform,box-shadow,filter,border-color] duration-150"
              >
                {resurrecting
                  ? "…"
                  : getGameSettings().language === "uk"
                    ? "Телепортуватися в місто"
                    : "Телепортироваться в город"}
              </button>
            </div>
          </div>
        )}
        {cooldownSec > 0 && (
          <div className="fixed top-14 left-0 right-0 z-50 bg-amber-900/95 text-amber-200 text-center text-xs py-1.5 px-2">
            Забагато запитів. Зачекайте {cooldownSec} сек.
          </div>
        )}
        {/* 🔥 ПРИБРАНО: MobDamageNotification - не працює правильно */}
        {/* <MobDamageNotification navigate={navigate} /> */}
        {showResourceHud ? (
          <div className="flex-shrink-0 w-full" style={{ height: "14px" }} aria-hidden />
        ) : null}
        {showNavGrid && !blockDeathUi && navigate ? (
          <NavGridProvider navigate={navigate} routePathname={routePathname ?? ""}>
            <div
              ref={contentRef}
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10 w-full min-w-0 pb-3"
            >
              <div
                className={`w-full max-w-full min-w-0 mt-0 ${
                  gameSettings.compactMode
                    ? "px-1.5 py-1 max-[480px]:px-1"
                    : "px-2 py-1 max-[480px]:px-1 sm:px-3"
                } ${gameSettings.largeFont ? "text-[17px]" : ""}`}
              >
                <HeroStatusStrip hidden={blockDeathUi || !showStatusBars} />
                {!blockDeathUi && showStatusBars ? <PartyHud /> : null}
                {!blockDeathUi && children}
                {!blockDeathUi ? <NavScrollFooter /> : null}
              </div>
            </div>
          </NavGridProvider>
        ) : (
          <div
            ref={contentRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10 w-full min-w-0 pb-3"
          >
            <div
              className={`w-full max-w-full min-w-0 mt-0 ${
                gameSettings.compactMode
                  ? "px-1.5 py-1 max-[480px]:px-1"
                  : "px-2 py-1 max-[480px]:px-1 sm:px-3"
              } ${gameSettings.largeFont ? "text-[17px]" : ""}`}
            >
              <HeroStatusStrip hidden={blockDeathUi || !showStatusBars} />
              {!blockDeathUi && showStatusBars ? <PartyHud /> : null}
              {!blockDeathUi && children}
            </div>
          </div>
        )}
        
        {/* 🔥 Футер видалено за запитом користувача */}
        </div>
        <Toast />
      </div>
  );
}

