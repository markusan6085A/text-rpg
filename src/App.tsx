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
import MageGuild from "./screens/City/MageGuild";

// Inventory & Equipment
import Inventory from "./screens/character/Inventory";
import Equipment from "./screens/character/Equipment";
import MagicStatue from "./screens/MagicStatue";
import LearnedSkillsScreen from "./screens/character/LearnedSkillsScreen";
import AdditionalSkillsScreen from "./screens/City/AdditionalSkillsScreen";
import Shop from "./screens/Shop";
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
import News from "./screens/News";
import SevenSeals from "./screens/SevenSeals";
import Clans from "./screens/Clans";
import Clan from "./screens/Clan";
import ClanInfo from "./screens/ClanInfo";

// ZUSTAND
import { useHeroStore } from "./state/heroStore";
import { setJSON } from "./state/persistence";
import { useAuthStore } from "./state/authStore";
import { useCharacterStore } from "./state/characterStore";
import { loadHeroFromAPI } from "./state/heroStore/heroLoadAPI";
import { loadHero as getHeroFromLocalStorage } from "./state/heroStore/heroLoad";
import { hydrateHero } from "./state/heroStore/heroHydration";
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
    const fullPath = pathname + search;
    const currentPath = window.location.pathname + window.location.search;
    // 🔥 Якщо клік по тому самому шляху — повне перезавантаження (як F5)
    if (fullPath === currentPath) {
      window.location.reload();
      return;
    }
    // 🔥 При переході на інший шлях — теж повне перезавантаження, щоб дані завжди свіжі (як F5)
    window.location.href = fullPath.startsWith("/") ? fullPath : "/" + fullPath;
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

  return { navigate, path, refreshKey };
}

function AppInner() {
  const hero = useHeroStore((s) => s.hero);
  const setHero = useHeroStore((s) => s.setHero);
  const loadHero = useHeroStore((s) => s.loadHero);

  const { navigate, path, refreshKey } = useRouter();
  
  // Логуємо API_URL при ініціалізації App (тільки в DEV)
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      const apiUrl = (window as any).__API_URL__ || import.meta.env.VITE_API_URL || 'http://localhost:3000';
      console.log('[App] API_URL:', apiUrl);
      console.log('[App] VITE_API_URL from env:', import.meta.env.VITE_API_URL || 'NOT SET');
    }
  }, []);

  // Фаза завантаження
  const [isLoading, setIsLoading] = React.useState(true);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const initializeCharacter = useCharacterStore((s) => s.initialize);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // 1) Ініціалізуємо stores
        initializeAuth();
        initializeCharacter();
        
        // 2) Optional warm-up (fire-and-forget, не блокує)
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
                      // 🔥 Залізобетон: ніколи не перезаписувати store серверним героєм, якщо в localStorage є той самий або більший прогрес (відкати після F5)
                      // При рівному прогресі беремо локального — щоб не перезаписати бафи/адена серверною (застарілою) версією
                      const localHero = getHeroFromLocalStorage();
                      const le = Number((localHero as any)?.exp ?? (localHero as any)?.heroJson?.exp ?? 0);
                      const ll = Number((localHero as any)?.level ?? (localHero as any)?.heroJson?.level ?? 0);
                      const ls = Number((localHero as any)?.sp ?? (localHero as any)?.heroJson?.sp ?? 0);
                      const la = Number((localHero as any)?.adena ?? (localHero as any)?.heroJson?.adena ?? 0);
                      const lm = Number((localHero as any)?.mobsKilled ?? (localHero as any)?.heroJson?.mobsKilled ?? 0);
                      const re = Number(loadedHero.exp ?? 0);
                      const rl = Number(loadedHero.level ?? 0);
                      const rs = Number((loadedHero as any).sp ?? 0);
                      const ra = Number(loadedHero.adena ?? 0);
                      const rm = Number((loadedHero as any).mobsKilled ?? 0);
                      const localBetterOrEqual = localHero && (le > re || ll > rl || ls > rs || la > ra || lm > rm || (le >= re && ll >= rl && ls >= rs && la >= ra && lm >= rm));
                      setHero(localBetterOrEqual ? (hydrateHero(localHero) ?? loadedHero) : loadedHero);
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
        else if (alive) loadHero(); // loadHero також викликає setHero через heroStore

        // 2) Показуємо UI одразу (не чекаємо API)
        if (alive) setIsLoading(false);

        // 3) API в фоні — коли прийде відповідь, оновимо store якщо потрібно
        if (authStore.isAuthenticated && characterStore.characterId) {
          loadHeroFromAPI().then((loadedHero) => {
            if (!alive) return;
            if (loadedHero) {
              const local = getHeroFromLocalStorage();
              const le = Number((local as any)?.exp ?? (local as any)?.heroJson?.exp ?? 0);
              const ll = Number((local as any)?.level ?? (local as any)?.heroJson?.level ?? 0);
              const ls = Number((local as any)?.sp ?? (local as any)?.heroJson?.sp ?? 0);
              const la = Number((local as any)?.adena ?? (local as any)?.heroJson?.adena ?? 0);
              const lm = Number((local as any)?.mobsKilled ?? (local as any)?.heroJson?.mobsKilled ?? 0);
              const re = Number(loadedHero.exp ?? 0);
              const rl = Number(loadedHero.level ?? 0);
              const rs = Number((loadedHero as any).sp ?? 0);
              const ra = Number(loadedHero.adena ?? 0);
              const rm = Number((loadedHero as any).mobsKilled ?? 0);
              const localBetterOrEqual = local && (le > re || ll > rl || ls > rs || la > ra || lm > rm || (le >= re && ll >= rl && ls >= rs && la >= ra && lm >= rm));
              setHero(localBetterOrEqual ? (hydrateHero(local) ?? loadedHero) : loadedHero);
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

  // Перевірка hero тільки для root та register (для цих шляхів показуємо Landing якщо не залогінений)
  // Для інших маршрутів - компоненти самі обробляють відсутність hero (показують "Загрузка...")
  if (!hero && (pathname === "/" || pathname === "")) {
    return (
      <Layout navigate={navigate} showNavGrid={false} showStatusBars={false} hideFooterButtons={true} key="landing-layout">
        <Landing
          navigate={navigate}
          onLogin={(loadedHero) => {
            // --- ВАЖЛИВО: ФІКС  ----
            setJSON("l2_current_user", loadedHero.username);
            // ------------------------
            setHero(loadedHero);
            navigate("/city");
          }}
          key={`landing-${refreshKey}`}
        />
      </Layout>
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
      return renderWithLayout(<Character key={`character-${refreshKey}`} />);

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
      return renderWithLayout(<Battle navigate={navigate} key={`battle-${refreshKey}`} />);

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

    case "/gm-shop":
      return renderWithLayout(<GMShop navigate={navigate} key={`gm-shop-${refreshKey}`} />);

    case "/tattoo-artist":
      return renderWithLayout(<TattooArtist navigate={navigate} key={`tattoo-artist-${refreshKey}`} />);

    case "/quests":
      return renderWithLayout(<QuestsScreen navigate={navigate} key={`quests-${refreshKey}`} />);

    case "/quest-shop":
      return renderWithLayout(<QuestShop navigate={navigate} key={`quest-shop-${refreshKey}`} />);

    case "/warehouse":
      return renderWithLayout(<Warehouse navigate={navigate} key={`warehouse-${refreshKey}`} />);

    case "/daily-quests":
      return renderWithLayout(<DailyQuests navigate={navigate} key={`daily-quests-${refreshKey}`} />);

    case "/premium-account":
      return renderWithLayout(<PremiumAccount navigate={navigate} key={`premium-account-${refreshKey}`} />);

    case "/fishing":
      return (
        <Layout navigate={navigate} customBackground="/icons/fishing.jpg" key="fishing-layout">
          <Fishing navigate={navigate} key={`fishing-${refreshKey}`} />
        </Layout>
      );

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
      // Check if pathname matches /player/:id/admin pattern
      if (pathname.startsWith("/player/") && pathname.endsWith("/admin")) {
        const playerId = pathname.replace("/player/", "").replace("/admin", "").split("?")[0];
        if (playerId) {
          return renderWithLayout(<PlayerAdminActions navigate={navigate} playerId={playerId} key={`player-admin-${playerId}-${refreshKey}`} />);
        }
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
