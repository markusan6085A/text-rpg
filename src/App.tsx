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
import Mail from "./screens/Mail";

// ZUSTAND
import { useHeroStore } from "./state/heroStore";
import { getJSON, setJSON } from "./state/persistence";
import { useAuthStore } from "./state/authStore";
import { useCharacterStore } from "./state/characterStore";
import { loadHeroFromAPI } from "./state/heroStore/heroLoadAPI";

function useRouter() {
  const [path, setPath] = React.useState(() => {
    const pathname = window.location.pathname;
    const search = window.location.search;
    return pathname + search;
  });

  const navigate = React.useCallback((newPath: string) => {
    window.history.pushState({}, "", newPath);
    const pathname = new URL(newPath, window.location.origin).pathname;
    const search = new URL(newPath, window.location.origin).search;
    setPath(pathname + search);
  }, []);

  React.useEffect(() => {
    const handler = () => {
      const pathname = window.location.pathname;
      const search = window.location.search;
      setPath(pathname + search);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return { navigate, path };
}

function AppInner() {
  const hero = useHeroStore((s) => s.hero);
  const setHero = useHeroStore((s) => s.setHero);
  const loadHero = useHeroStore((s) => s.loadHero);

  const { navigate, path } = useRouter();
  
  // Логуємо API_URL при ініціалізації App
  React.useEffect(() => {
    const apiUrl = (window as any).__API_URL__ || import.meta.env.VITE_API_URL || 'http://localhost:3000';
    console.log('[App] API_URL:', apiUrl);
    console.log('[App] VITE_API_URL from env:', import.meta.env.VITE_API_URL || 'NOT SET');
  }, []);

  // Фаза завантаження
  const [isLoading, setIsLoading] = React.useState(true);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const initializeCharacter = useCharacterStore((s) => s.initialize);

  React.useEffect(() => {
    // Ініціалізуємо stores
    initializeAuth();
    initializeCharacter();

    // Спробуємо завантажити героя
    const load = async () => {
      try {
        // Отримуємо поточний стан після ініціалізації
        const authStore = useAuthStore.getState();
        const characterStore = useCharacterStore.getState();

        console.log('[App] Starting hero load, auth:', authStore.isAuthenticated, 'characterId:', characterStore.characterId);

        // Якщо авторизований - пробуємо завантажити з API
        if (authStore.isAuthenticated && characterStore.characterId) {
          try {
            const loadedHero = await loadHeroFromAPI();
            if (loadedHero) {
              setHero(loadedHero);
              console.log('[App] Hero set in store successfully from API');
              
              // ❗ ВАЖЛИВО: Також зберігаємо завантажений hero в localStorage як backup
              // Це гарантує, що дані не втрачаться при проблемах з API
              const current = getJSON<string | null>("l2_current_user", null);
              if (current && loadedHero) {
                const accounts = getJSON<any[]>("l2_accounts_v2", []);
                const accIndex = accounts.findIndex((a: any) => a.username === current);
                if (accIndex !== -1) {
                  accounts[accIndex].hero = loadedHero;
                  setJSON("l2_accounts_v2", accounts);
                  console.log('[App] Hero also saved to localStorage as backup');
                }
              }
            } else {
              console.log('[App] Hero is null from API, fallback to localStorage');
              // Fallback на localStorage тільки якщо hero не завантажений
              loadHero();
            }
          } catch (err) {
            console.error('[App] Failed to load hero from API:', err);
            // Fallback на localStorage тільки при помилці
            loadHero();
          }
        } else {
          console.log('[App] Not authenticated, loading from localStorage');
          // Якщо не авторизований - завантажуємо з localStorage (backward compatibility)
          loadHero();
        }
      } finally {
        // Встановлюємо isLoading = false після завантаження (незалежно від успіху/помилки)
        const finalHero = useHeroStore.getState().hero;
        console.log('[App] Setting isLoading = false, final hero:', finalHero ? 'exists' : 'null');
        setIsLoading(false);
      }
    };

    load();
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
      <Layout navigate={navigate} showNavGrid={false} showStatusBars={false} hideFooterButtons={true}>
        <Landing
          navigate={navigate}
          onLogin={(loadedHero) => {
            // --- ВАЖЛИВО: ФІКС  ----
            setJSON("l2_current_user", loadedHero.username);
            // ------------------------
            setHero(loadedHero);
            navigate("/city");
          }}
        />
      </Layout>
    );
  }

  // Router
  const renderWithLayout = (children: React.ReactNode) => (
    <Layout navigate={navigate}>{children}</Layout>
  );

  switch (pathname) {
    case "/register":
      return (
        <Layout navigate={navigate} showNavGrid={false} showStatusBars={false} hideFooterButtons={true}>
          <Register navigate={navigate} />
        </Layout>
      );

    case "/city":
      return renderWithLayout(<City navigate={navigate} />);

    case "/character":
      return renderWithLayout(<Character />);

    case "/gk":
      return renderWithLayout(<GK navigate={navigate} />);

    case "/location":
      return renderWithLayout(<Location navigate={navigate} />);

    case "/stats":
      return renderWithLayout(<Stats />);

    case "/about":
      return renderWithLayout(<About navigate={navigate} />);

    case "/battle":
      return renderWithLayout(<Battle navigate={navigate} />);

    case "/inventory":
      return renderWithLayout(<Inventory />);

    case "/equipment":
      return renderWithLayout(<Equipment />);

    case "/guild":
    case "/mage-guild":
      return renderWithLayout(<MageGuild navigate={navigate} />);

    case "/magic-statue":
      return renderWithLayout(<MagicStatue navigate={navigate} />);

    case "/learned-skills":
      return renderWithLayout(<LearnedSkillsScreen navigate={navigate} />);

    case "/additional-skills":
      return renderWithLayout(<AdditionalSkillsScreen navigate={navigate} />);

    case "/recipe-book":
      return renderWithLayout(
        <div className="w-full flex flex-col items-center text-white px-4 py-2">
          <div className="text-xl font-bold mb-4">Книга рецептов</div>
          <div className="text-gray-400">В разработке...</div>
        </div>
      );

    case "/shop":
      return renderWithLayout(<Shop navigate={navigate} />);

    case "/gm-shop":
      return renderWithLayout(<GMShop navigate={navigate} />);

    case "/tattoo-artist":
      return renderWithLayout(<TattooArtist navigate={navigate} />);

    case "/quests":
      return renderWithLayout(<QuestsScreen navigate={navigate} />);

    case "/quest-shop":
      return renderWithLayout(<QuestShop navigate={navigate} />);

    case "/warehouse":
      return renderWithLayout(<Warehouse navigate={navigate} />);

    case "/daily-quests":
      return renderWithLayout(<DailyQuests navigate={navigate} />);

    case "/premium-account":
      return renderWithLayout(<PremiumAccount navigate={navigate} />);

    case "/fishing":
      return (
        <Layout navigate={navigate} customBackground="/icons/fishing.jpg">
          <Fishing navigate={navigate} />
        </Layout>
      );

    case "/chat":
      return renderWithLayout(<Chat navigate={navigate} />);

    case "/online-players":
      return renderWithLayout(<OnlinePlayers navigate={navigate} />);

    case "/mail":
      return renderWithLayout(<Mail navigate={navigate} />);

    default:
      // Check if pathname matches /player/:id pattern
      if (pathname.startsWith("/player/")) {
        const playerId = pathname.replace("/player/", "").split("?")[0];
        if (playerId) {
          return renderWithLayout(<PlayerProfile navigate={navigate} playerId={playerId} />);
        }
      }
      // Fall through to default route below
      break;
  }

  // Default route (if no case matched)
  if (pathname === "/wip") {
    return renderWithLayout(<Wip navigate={navigate} user={hero ? { username: hero.name || hero.username || '' } : null} />);
  }

  // Other default routes
  switch (pathname) {
    case "/wip":
      return renderWithLayout(<Wip navigate={navigate} user={hero ? { username: hero.name || hero.username || '' } : null} />);

    default:
      return (
        <Layout navigate={navigate} showNavGrid={false} showStatusBars={false} hideFooterButtons={true}>
          <Landing
            navigate={navigate}
            onLogin={(loadedHero) => {
              setJSON("l2_current_user", loadedHero.username);
              setHero(loadedHero);
              navigate("/city");
            }}
          />
        </Layout>
      );
  }
}

export default function App() {
  return <AppInner />;
}
