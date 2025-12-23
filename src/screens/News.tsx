import React, { useEffect, useState } from "react";

type Route =
  | "/"
  | "/register"
  | "/login"
  | "/city"
  | "/character"
  | "/gk"
  | "/location"
  | "/about"
  | "/forgot"
  | "/stats"
  | "/wip"
  | "/news";

interface NewsProps {
  navigate: (path: Route) => void;
  user: any;
  onLogout: () => void;
}

type NewsType = "register" | "login" | "bossKill";

interface NewsItem {
  type: NewsType;
  user: string;
  time: string; // игровое время, напр. "12:34"
  boss?: string;
  level?: number;
}

const News: React.FC<NewsProps> = ({ navigate, user, onLogout: _onLogout }) => {
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("news");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setItems(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const formatted = [...items].reverse(); // новые сверху

  const renderLine = (item: NewsItem, idx: number) => {
    let text: React.ReactNode = null;

    if (item.type === "register") {
      text = (
        <>
          <span className="text-blue-200">{item.user}</span>{" "}
          зарегистрировался на сервере
        </>
      );
    } else if (item.type === "login") {
      text = (
        <>
          <span className="text-blue-200">{item.user}</span> зашел в игру
        </>
      );
    } else if (item.type === "bossKill") {
      text = (
        <>
          <span className="text-blue-200">{item.user}</span> добил Рейд Босса{" "}
          <span className="text-yellow-300">{item.boss}</span>{" "}
          {item.level ? `${item.level} ур.` : null}
        </>
      );
    }

    return (
      <div
        key={idx}
        className="border-b border-yellow-900/40 py-1.5 text-[13px] leading-snug"
      >
        <span className="text-gray-300 mr-1">[{item.time}]</span>
        {text}
      </div>
    );
  };

  return (
    <div className="flex justify-center text-gray-100">
      <div className="w-full max-w-[380px] bg-[#05040a] min-h-screen border-x border-yellow-900/40 flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between px-2 py-2 bg-[#111022] border-b border-yellow-900/60 text-[13px]">
          <button
            className="px-2 py-1 border border-yellow-700/70 rounded bg-black/40"
            onClick={() => navigate("/city")}
          >
            Город
          </button>
          <div className="font-semibold text-yellow-200 flex-1 text-center">
            НОВОСТИ
          </div>
        </div>

        {/* Тело */}
        <div className="flex-1 px-2 py-2">
          {formatted.length === 0 ? (
            <div className="text-center text-sm text-gray-400 mt-4">
              Новостей пока нет.
            </div>
          ) : (
            <div>{formatted.map(renderLine)}</div>
          )}
        </div>

        {/* Инфа о персонаже снизу */}
        <div className="px-2 py-1 border-t border-yellow-900/40 text-[11px] text-gray-400">
          Ты вошел как <span className="text-blue-200">{user.username}</span>
        </div>
      </div>
    </div>
  );
};

export default News;
