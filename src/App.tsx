// src/App.tsx
import React from "react";

import Landing from "./screens/Landing";
import Register from "./screens/Register";
import City from "./screens/City";
import Character from "./screens/character/Character";
import GK from "./screens/GK";
import Location from "./screens/Location";
import Stats from "./screens/character/Stats";
import About from "./screens/About";
import Battle from "./screens/Battle";
import Layout from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import MageGuild from "./screens/City/MageGuild";

// Inventory & Equipment
import Inventory from "./screens/character/Inventory";
import Equipment from "./screens/character/Equipment";
import MagicStatue from "./screens/MagicStatue";
import LearnedSkillsScreen from "./screens/character/LearnedSkillsScreen";
import AdditionalSkillsScreen from "./screens/City/AdditionalSkillsScreen";
import Shop from "./screens/Shop";
import SellItems from "./screens/SellItems";
import QuestsScreen from "./screens/Quests";
import QuestShop from "./screens/QuestShop";
import Warehouse from "./screens/Warehouse";
import DailyQuests from "./screens/character/DailyQuests";
import PremiumAccount from "./screens/character/PremiumAccount";
import GMShop from "./screens/GMShop";
import TattooArtist from "./screens/TattooArtist";
import Fishing from "./screens/Fishing";
import Wip from "./screens/Wip";
import Chat from "./screens/Chat";
import OnlinePlayers from "./screens/OnlinePlayers";
import PlayerProfile from "./screens/PlayerProfile";
import PlayerAdminActions from "./screens/PlayerAdminActions";
import Mail from "./screens/Mail";
import ColorizeNick from "./screens/ColorizeNick";
import Forum from "./screens/Forum";
import Achievements from "./screens/Achievements";
import Leaderboard from "./screens/Leaderboard";
import News from "./screens/News";
import SevenSeals from "./screens/SevenSeals";
import Clans from "./screens/Clans";
import Clan from "./screens/Clan";
import ClanInfo from "./screens/ClanInfo";
import AdminLogin from "./screens/AdminLogin";
import AdminDashboard from "./screens/AdminDashboard";
import { AdminItemPickerPage } from "./screens/admin/AdminItemPickerPage";

// ZUSTAND
import { useHeroStore } from "./state/heroStore";
import { setJSON } from "./state/persistence";
import { useAuthStore } from "./state/authStore";
import { useCharacterStore } from "./state/characterStore";
import { useAdminStore } from "./state/adminStore";
import { loadHeroFromAPI } from "./state/heroStore/heroLoadAPI";
import { loadHero as getHeroFromLocalStorage } from "./state/heroStore/heroLoad";
import { hydrateHero } from "./state/heroStore/heroHydration";
import { hydrateBattleStoreFromStorage } from "./state/battle/hydrateFromStorage";
import { startWarmup, stopWarmup } from "./utils/warmup";

function useRouter() {
  const [path, setPath] = React.useState(() => {
    const pathname = window.location.pathname;
    const search = window.location.search;
    return pathname + search;
  });
  
  // 🔥 refreshKey для форсування оновлення сторінки навіть при кліку на той самий шлях
  const [refreshKey, setRefreshKey] = React.useState(0);

  const navigate = React.useCallback((newPath: string) => {
    const pathname = new URL(newPath, window.location.origin).pathname;
    const search = new URL(newPath, window.location.origin).search;
    const fullPath = (pathname.startsWith("/") ? pathname : "/" + pathname) + search;
    const currentPath = window.location.pathname + window.location.search;
    if (fullPath === currentPath) {
      window.location.reload(); // Той самий шлях — повне перезавантаження (F5)
      return;
    }
    // SPA: перехід без перезавантаження — hero/state лишаються в пам'яті, швидша навігація
    window.history.pushState(null, "", fullPath);
    setPath(fullPath);
    setRefreshKey((k) => k + 1);
    window.scrollTo(0, 0);
  }, []);

  /** Перехід без перезавантаження сторінки (токен у пам'яті зберігається). Потрібно після адмін-логіну. */
  const navigateNoReload = React.useCallback((newPath: string) => {
    const pathname = new URL(newPath, window.location.origin).pathname;
    const search = new URL(newPath, window.location.origin).search;
    const fullPath = (pathname.startsWith("/") ? pathname : "/" + pathname) + search;
    window.history.pushState(null, "", fullPath);
    setPath(fullPath);
    setRefreshKey((k) => k + 1);
  }, []);

  React.useEffect(() => {
    const handler = () => {
      const pathname = window.location.pathname;
      const search = window.location.search;
      setPath(pathname + search);
      // 🔥 Оновлюємо refreshKey при навігації назад/вперед
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return { navigate, navigateNoReload, path, refreshKey };
}

function AppInner() {
  const hero = useHeroStore((s) => s.hero);
  const setHero = useHeroStore((s) => s.setHero);
  const loadHero = useHeroStore((s) => s.loadHero);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setCharacterId = useCharacterStore((s) => s.setCharacterId);

  const { navigate, navigateNoReload, path, refreshKey } = useRouter();
  const [loadingHeroAfterAuth, setLoadingHeroAfterAuth] = React.useState(false);
  
  // Відновлення battle store з localStorage після готовності hero (уникаємо TDZ у battle chunk)
  React.useEffect(() => {
    if (hero?.name) hydrateBattleStoreFromStorage();
  }, [hero?.name]);

  // Логуємо API_URL при ініціалізації App (тільки в DEV)
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      const apiUrl = (window as any).__API_URL__ || import.meta.env.VITE_API_URL || 'http://localhost:3000';
      console.log('[App] API_URL:', apiUrl);
      console.log('[App] VITE_API_URL from env:', import.meta.env.VITE_API_URL || 'NOT SET');
    }
  }, []);

  // Після входу (наприклад /admin/login) є accessToken, але hero null — на "/" підтягуємо персонажа й редірект у город
  // Використовуємо navigateNoReload, щоб не губити токен при переході (особливо після адмін-логіну)
  React.useEffect(() => {
    const pathname = window.location.pathname.replace(/\?.*$/, "");
    if (pathname !== "/" || hero || !isAuthenticated) return;
    let alive = true;
    setLoadingHeroAfterAuth(true);
    (async () => {
      try {
        const { listCharacters } = await import("./utils/api");
        const { loadHeroFromAPI } = await import("./state/heroStore/heroLoadAPI");
        const chars = await listCharacters();
        if (!alive) return;
        if (chars.length > 0) {
          setCharacterId(chars[0].id);
          const h = await loadHeroFromAPI();
          if (alive && h) setHero(h);
          if (alive) navigateNoReload("/city");
        } else {
          navigateNoReload("/register");
        }
      } catch {
        // Не викликати navigate("/") — ми вже на "/", це дає reload → цикл оновлень (особливо на телефоні)
        if (alive) setLoadingHeroAfterAuth(false);
      } finally {
        if (alive) setLoadingHeroAfterAuth(false);
      }
    })();
    return () => { alive = false; };
  }, [isAuthenticated, hero, navigate, navigateNoReload, setCharacterId, setHero]);

  // Фаза завантаження
  const [isLoading, setIsLoading] = React.useState(true);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const initializeCharacter = useCharacterStore((s) => s.initialize);

  React.useEffect(() => {
    let alive = true;
    const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

    // Захист: якщо щось зависне — через 8 сек примусово показуємо UI
    const fallbackTimer = setTimeout(() => {
      if (alive) setIsLoading(false);
    }, 8000);

    let adminCheckTimer: NodeJS.Timeout | undefined;

    (async () => {
      try {
        // 1) Bootstrap: отримуємо accessToken через refresh cookie (без localStorage)
        try {
          const r = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
          if (r.ok) {
            const d = await r.json();
            if (d?.accessToken && alive) setAccessToken(d.accessToken);
          }
          // при 401 просто продовжуємо без токена — герой з localStorage
        } catch (_) {}

        // 2) Ініціалізуємо character store
        initializeCharacter();

        // 2.1) Адмін: хто я (відкладаємо, щоб не тригерити 401 під час завантаження бою)
        adminCheckTimer = setTimeout(() => useAdminStore.getState().checkAdmin().catch(() => {}), 1500);

        // 2.2) Optional warm-up (fire-and-forget, не блокує)
        try {
          startWarmup();
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn('[App] Failed to start warm-up (non-critical):', err);
          }
        }

        // 3) Визначаємо "легкі" сторінки
        const pathname = window.location.pathname;
        const isLightPage = pathname.startsWith('/mail') || 
                           pathname.startsWith('/about') || 
                           pathname.startsWith('/forum');

        // Для легких сторінок - одразу показуємо UI
        if (isLightPage) {
          if (alive) setIsLoading(false);
          // Завантажуємо hero в фоновому режимі (не блокуємо рендер)
          setTimeout(() => {
            if (!alive) return;
            (async () => {
              try {
                const authStore = useAuthStore.getState();
                const characterStore = useCharacterStore.getState();
                if (authStore.isAuthenticated && characterStore.characterId) {
                  try {
                    const loadedHero = await loadHeroFromAPI();
                    if (loadedHero && alive) {
                      // 🔥 loadHeroFromAPI вже мерджить local+server і рахує maxHp по екіпу/скілах — завжди беремо його, щоб HP/MP не падали після F5
                      setHero(loadedHero);
                    } else if (alive) {
                      loadHero();
                    }
                  } catch (err) {
                    if (alive) loadHero();
                  }
                } else if (alive) {
                  loadHero();
                }
              } catch (err) {
                // Ігноруємо помилки для легких сторінок
              }
            })();
          }, 500);
          return;
        }

        // Для важких сторінок — миттєво показуємо UI з локальним героєм, API в фоні
        const authStore = useAuthStore.getState();
        const characterStore = useCharacterStore.getState();

        if (import.meta.env.DEV) {
          console.log('[App] Instant load: setting local hero first, then API in background');
        }

        // 1) Одразу показуємо локального героя (миттєво, без очікування API)
        const localHero = getHeroFromLocalStorage();
        const heroToShow = hydrateHero(localHero) ?? localHero;
        if (heroToShow && alive) setHero(heroToShow);
        else if (alive) loadHero(); // store action: зчитує з localStorage і setHero

        // 2) Показуємо UI одразу (не чекаємо API)
        if (alive) setIsLoading(false);

        // 3) API в фоні — коли прийде відповідь, оновимо store якщо потрібно
        if (authStore.isAuthenticated && characterStore.characterId) {
          loadHeroFromAPI().then((loadedHero) => {
            if (!alive) return;
            if (loadedHero) {
              // loadHeroFromAPI вже мерджить local+server і рахує maxHp по екіпу/скілах — завжди беремо його
              setHero(loadedHero);
            }
          }).catch((err) => {
            if (import.meta.env.DEV) console.error('[App] Background API load failed:', err);
          });
        }
      } catch (e) {
        console.error('[App] Boot failed:', e);
        // Не встановлюємо помилку - просто продовжуємо
      } finally {
        // ❗ КРИТИЧНО: Завжди встановлюємо ready, навіть якщо щось пішло не так
        if (alive) {
          const finalHero = useHeroStore.getState().hero;
          if (import.meta.env.DEV) {
            console.log('[App] Setting isLoading = false, final hero:', finalHero ? 'exists' : 'null');
          }
          setIsLoading(false);
        }
      }
    })();

    // Cleanup при unmount
    return () => {
      alive = false;
      clearTimeout(fallbackTimer);
      clearTimeout(adminCheckTimer);
      try {
        stopWarmup();
      } catch (err) {
        // Ігноруємо помилки cleanup
      }
    };
  }, []);

  // Поки йде завантаження — показуємо "загрузка", але НЕ Landing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        Загрузка...
      </div>
    );
  }

  // Extract pathname from path (remove query params for routing)
  const pathname = path.split('?')[0];

  // Після входу через /admin/login є accessToken, але hero ще null — показуємо загрузку (завантаження в useEffect вище)
  if (!hero && (pathname === "/" || pathname === "") && isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        Загрузка персонажа...
      </div>
    );
  }

  // Перевірка hero тільки для root та register (для цих шляхів показуємо Landing якщо не залогінений)
  if (!hero && (pathname === "/" || pathname === "")) {
    return (
      <Layout navigate={navigate} showNavGrid={false} showStatusBars={false} hideFooterButtons={true} key="landing-layout">
        <Landing
          navigate={navigate}
          onLogin={(loadedHero) => {
            setJSON("l2_current_user", loadedHero.username);
            setHero(loadedHero);
            navigate("/city");
          }}
          key={`landing-${refreshKey}`}
        />
      </Layout>
    );
  }

  // Блок: якщо персонаж заблокований — тільки екран "Ваш персонаж заблокирован" та кнопка Вихід
  const isBlocked = hero?.blockedUntil && new Date(hero.blockedUntil).getTime() > Date.now();
  if (hero && isBlocked && pathname !== "/admin" && pathname !== "/admin/login" && pathname !== "/admin/items") {
    const logout = useAuthStore.getState().logout;
    const handleBlockedLogout = () => {
      logout();
      useHeroStore.getState().setHero(null as any);
      navigate("/");
    };
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-[#c7ad80] p-4">
        <p className="text-xl font-semibold mb-6">Ваш персонаж заблокирован</p>
        <button
          type="button"
          onClick={handleBlockedLogout}
          className="px-6 py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/30"
        >
          Вихід
        </button>
      </div>
    );
  }

  // Router: Layout без refreshKey у key — стабільний, не ремонтується при кожному кліку (прибирає шторм GET/таймерів)
  const renderWithLayout = (children: React.ReactNode) => (
    <Layout navigate={navigate} key={`layout-${pathname}`}>{children}</Layout>
  );

  switch (pathname) {
    case "/register":
      return (
        <Layout navigate={navigate} showNavGrid={false} showStatusBars={false} hideFooterButtons={true} key="register-layout">
          <Register navigate={navigate} key={`register-${refreshKey}`} />
        </Layout>
      );

    case "/city":
      return renderWithLayout(<City navigate={navigate} key={`city-${refreshKey}`} />);

    case "/character":
      return renderWithLayout(<Character navigate={navigate} key={`character-${refreshKey}`} />);

    case "/gk":
      return (
        <Layout navigate={navigate} contentTopCompact key={`layout-gk`}>
          <GK navigate={navigate} key={`gk-${refreshKey}`} />
        </Layout>
      );

    case "/location":
      return renderWithLayout(<Location navigate={navigate} key={`location-${refreshKey}`} />);

    case "/stats":
      return renderWithLayout(<Stats key={`stats-${refreshKey}`} />);

    case "/about":
      return renderWithLayout(<About navigate={navigate} key={`about-${refreshKey}`} />);

    case "/battle":
      return renderWithLayout(
        <ErrorBoundary
          fallback={
            <div className="flex flex-col items-center justify-center gap-3 p-4 text-center text-gray-300">
              <p className="text-sm">Помилка завантаження бою.</p>
              <button
                onClick={() => { window.location.href = "/location"; }}
                className="px-4 py-2 rounded bg-yellow-600 text-black text-sm hover:bg-yellow-500"
              >
                Повернутися в локацію
              </button>
            </div>
          }
        >
          <Battle navigate={navigate} key={`battle-${refreshKey}`} />
        </ErrorBoundary>
      );

    case "/inventory":
      return renderWithLayout(<Inventory key={`inventory-${refreshKey}`} />);

    case "/equipment":
      return renderWithLayout(<Equipment key={`equipment-${refreshKey}`} />);

    case "/guild":
    case "/mage-guild":
      return renderWithLayout(<MageGuild navigate={navigate} key={`mage-guild-${refreshKey}`} />);

    case "/magic-statue":
      return renderWithLayout(<MagicStatue navigate={navigate} key={`magic-statue-${refreshKey}`} />);

    case "/learned-skills":
      return renderWithLayout(<LearnedSkillsScreen navigate={navigate} key={`learned-skills-${refreshKey}`} />);

    case "/additional-skills":
      return renderWithLayout(<AdditionalSkillsScreen navigate={navigate} key={`additional-skills-${refreshKey}`} />);

    case "/recipe-book":
      return renderWithLayout(
        <div key={`recipe-book-${refreshKey}`} className="w-full flex flex-col items-center text-white px-4 py-2">
          <div className="text-xl font-bold mb-4">Книга рецептов</div>
          <div className="text-gray-400">В разработке...</div>
        </div>
      );

    case "/shop":
      return renderWithLayout(<Shop navigate={navigate} key={`shop-${refreshKey}`} />);

    case "/shop/sell":
      return renderWithLayout(<SellItems navigate={navigate} key={`sell-items-${refreshKey}`} />);

    case "/gm-shop":
      return renderWithLayout(<GMShop navigate={navigate} key={`gm-shop-${refreshKey}`} />);

    case "/tattoo-artist":
      return renderWithLayout(<TattooArtist navigate={navigate} key={`tattoo-artist-${refreshKey}`} />);

    case "/quests":
      return renderWithLayout(<QuestsScreen navigate={navigate} key={`quests-${refreshKey}`} />);

    case "/quest-shop":
      return renderWithLayout(<QuestShop navigate={navigate} key={`quest-shop-${refreshKey}`} />);

    case "/warehouse":
      return renderWithLayout(
        <ErrorBoundary
          fallback={
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center text-gray-400">
              <p className="text-sm">Склад тимчасово недоступний.</p>
              <p className="text-xs">Оновіть сторінку або зайдіть з головної.</p>
            </div>
          }
        >
          <Warehouse navigate={navigate} key={`warehouse-${refreshKey}`} />
        </ErrorBoundary>
      );

    case "/daily-quests":
      return renderWithLayout(<DailyQuests navigate={navigate} key={`daily-quests-${refreshKey}`} />);

    case "/premium-account":
      return renderWithLayout(<PremiumAccount navigate={navigate} key={`premium-account-${refreshKey}`} />);

    case "/fishing":
      return renderWithLayout(<Fishing navigate={navigate} key={`fishing-${refreshKey}`} />);

    case "/chat":
      return renderWithLayout(<Chat navigate={navigate} key={`chat-${refreshKey}`} />);

    case "/online-players":
      return renderWithLayout(<OnlinePlayers navigate={navigate} key={`online-players-${refreshKey}`} />);

    case "/mail":
      return renderWithLayout(<Mail navigate={navigate} key={`mail-${refreshKey}`} />);

    case "/forum":
      return renderWithLayout(<Forum navigate={navigate} key={`forum-${refreshKey}`} />);

    case "/news":
      return renderWithLayout(<News navigate={navigate} user={hero ? { username: hero.name || hero.username || '' } : null} onLogout={() => {}} key={`news-${refreshKey}`} />);

    case "/colorize-nick":
      return renderWithLayout(<ColorizeNick navigate={navigate} key={`colorize-nick-${refreshKey}`} />);

    case "/seven-seals":
      return renderWithLayout(<SevenSeals navigate={navigate} key={`seven-seals-${refreshKey}`} />);

    case "/clans":
      return renderWithLayout(<Clans navigate={navigate} key={`clans-${refreshKey}`} />);

    case "/achievements":
      return renderWithLayout(<Achievements navigate={navigate} key={`achievements-${refreshKey}`} />);

    case "/leaderboard":
      return renderWithLayout(<Leaderboard navigate={navigate} key={`leaderboard-${refreshKey}`} />);

    case "/admin/login":
      return (
        <Layout navigate={navigate} showNavGrid={false} showStatusBars={false} hideFooterButtons={true} key="admin-login-layout">
          <AdminLogin navigate={navigate} navigateNoReload={navigateNoReload} key={`admin-login-${refreshKey}`} />
        </Layout>
      );

    case "/admin":
      return (
        <Layout navigate={navigate} showNavGrid={false} showStatusBars={false} hideFooterButtons={true} key="admin-dashboard-layout">
          <AdminDashboard navigate={navigate} key={`admin-dashboard-${refreshKey}`} />
        </Layout>
      );

    case "/admin/items":
      return (
        <Layout navigate={navigate} showNavGrid={false} showStatusBars={false} hideFooterButtons={true} key="admin-items-picker-layout">
          <AdminItemPickerPage navigate={navigate} key={`admin-items-picker-${refreshKey}`} />
        </Layout>
      );

    default:
      // Check if pathname matches /clan-info/:id pattern (інформаційна сторінка)
      if (pathname.startsWith("/clan-info/")) {
        const clanId = pathname.replace("/clan-info/", "").split("?")[0];
        if (clanId) {
          return renderWithLayout(<ClanInfo navigate={navigate} clanId={clanId} key={`clan-info-${clanId}-${refreshKey}`} />);
        }
      }
      // Check if pathname matches /clan/:id pattern (повна сторінка управління)
      if (pathname.startsWith("/clan/")) {
        const clanId = pathname.replace("/clan/", "").split("?")[0];
        if (clanId) {
          return renderWithLayout(<Clan navigate={navigate} clanId={clanId} key={`clan-${clanId}-${refreshKey}`} />);
        }
      }
      // Check if pathname matches /player/:id/admin pattern (including optional trailing slash)
      const playerAdminMatch = pathname.match(/^\/player\/([^/]+)\/admin\/?$/);
      if (playerAdminMatch) {
        const playerId = playerAdminMatch[1];
        return (
          <Layout navigate={navigate} showNavGrid={false} showStatusBars={false} hideFooterButtons={true} key="player-admin-layout">
            <ErrorBoundary
              fallback={
                <div className="flex flex-col items-center justify-center gap-3 p-4 text-center text-gray-300 min-h-[200px]">
                  <p className="text-sm">Помилка завантаження адмін-сторінки гравця.</p>
                  <button
                    onClick={() => navigate("/admin")}
                    className="px-4 py-2 rounded bg-yellow-600 text-black text-sm hover:bg-yellow-500"
                  >
                    В адмінку
                  </button>
                </div>
              }
            >
              <PlayerAdminActions navigate={navigate} playerId={playerId} key={`player-admin-${playerId}-${refreshKey}`} />
            </ErrorBoundary>
          </Layout>
        );
      }
      // Check if pathname matches /player/:id pattern
      if (pathname.startsWith("/player/")) {
        const playerId = pathname.replace("/player/", "").split("?")[0];
        if (playerId) {
          return renderWithLayout(<PlayerProfile navigate={navigate} playerId={playerId} key={`player-${playerId}-${refreshKey}`} />);
        }
      }
      // Fall through to default route below
      break;
  }

  // Default route (if no case matched)
  if (pathname === "/wip") {
    return renderWithLayout(<Wip navigate={navigate} user={hero ? { username: hero.name || hero.username || '' } : null} key={`wip-${refreshKey}`} />);
  }

  // Other default routes
  switch (pathname) {
    case "/wip":
      return renderWithLayout(<Wip navigate={navigate} user={hero ? { username: hero.name || hero.username || '' } : null} key={`wip-${refreshKey}`} />);

    default:
      return (
        <Layout navigate={navigate} showNavGrid={false} showStatusBars={false} hideFooterButtons={true} key="default-landing-layout">
          <Landing
            navigate={navigate}
            onLogin={(loadedHero) => {
              setJSON("l2_current_user", loadedHero.username);
              setHero(loadedHero);
              navigate("/city");
            }}
            key={`default-landing-${refreshKey}`}
          />
        </Layout>
      );
  }
}

export default function App() {
  return <AppInner />;
}
