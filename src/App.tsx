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
    );
  }

  // Router
  switch (path) {
    case "/register":
      return <Register navigate={navigate} />;

    case "/city":
      return <City navigate={navigate} />;

    case "/character":
      return <Character />;

    case "/gk":
      return <GK navigate={navigate} />;

    case "/location":
      return <Location navigate={navigate} />;

    case "/stats":
      return <Stats />;

    case "/about":
      return <About navigate={navigate} />;

    case "/battle":
      return <Battle navigate={navigate} />;

    case "/inventory":
      return <Inventory />;

    case "/equipment":
      return <Equipment />;

    default:
      return (
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
      );
  }
}

export default function App() {
  return <AppInner />;
}
