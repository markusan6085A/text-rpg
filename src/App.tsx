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
import Chat from "./screens/Chat";

// Inventory & Equipment
import Inventory from "./screens/character/Inventory";
import Equipment from "./screens/character/Equipment";

// ZUSTAND
import { useHeroStore } from "./state/heroStore";

function useRouter() {
  const [tick, setTick] = React.useState(0);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setTick((x) => x + 1);
  };

  React.useEffect(() => {
    const handler = () => setTick((x) => x + 1);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return { navigate };
}

function AppInner() {
  const hero = useHeroStore((s) => s.hero);
  const setHero = useHeroStore((s) => s.setHero);
  const loadHero = useHeroStore((s) => s.loadHero);

  const { navigate } = useRouter();
  const path = window.location.pathname;

  // Фаза завантаження
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadHero();
    setTimeout(() => {
      setIsLoading(false);
    }, 80);
  }, []);

  // Поки йде завантаження — показуємо "загрузка", але НЕ Landing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        Загрузка...
      </div>
    );
  }

  // Якщо героя нема → Landing
  if (!hero && path !== "/register") {
    return (
      <Layout navigate={navigate} showNavGrid={false} showStatusBars={false}>
        <Landing
          navigate={navigate}
          onLogin={(loadedHero) => {

            // --- ВАЖЛИВО: ФІКС  ----
            localStorage.setItem(
              "l2_current_user",
              JSON.stringify(loadedHero.username)
            );
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

  switch (path) {
    case "/register":
      return (
        <Layout navigate={navigate} showNavGrid={false} showStatusBars={false}>
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

    case "/chat":
      return renderWithLayout(<Chat navigate={navigate} />);

    case "/guild":
    case "/mage-guild":
      return renderWithLayout(<MageGuild navigate={navigate} />);

    default:
      return (
        <Layout navigate={navigate} showNavGrid={false} showStatusBars={false}>
          <Landing
            navigate={navigate}
            onLogin={(loadedHero) => {
              localStorage.setItem(
                "l2_current_user",
                JSON.stringify(loadedHero.username)
              );
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
