import React, { useState, useEffect } from "react";
import { adminGetOnlinePlayers } from "../../utils/api";
import { isWarmCityUi, useCityUiVariant } from "../../utils/cityUiVariant";

interface AdminSectionOnlineProps {
  navigate: (path: string) => void;
}

/**
 * Онлайн игроки
 * Список персонажей, активных за последние 10 минут.
 */
export function AdminSectionOnline({ navigate }: AdminSectionOnlineProps) {
  const cityUi = useCityUiVariant();
  const isL2 = isWarmCityUi(cityUi);
  const listBoxCl = isL2
    ? "max-h-32 overflow-auto rounded-md border border-[#5c4a32]/60 bg-black/20 text-xs"
    : "max-h-32 overflow-auto border border-[#c7ad80]/20 rounded text-xs";
  const linkCl = isL2
    ? "text-[#e8dcc8] cursor-pointer hover:text-[#c9a44c] hover:underline"
    : "text-gray-300 cursor-pointer hover:text-[#c7ad80] hover:underline";
  const metaCl = isL2 ? "text-[#8a7a60]" : "text-gray-500";
  const clanLinkCl = isL2
    ? "cursor-pointer hover:text-[#c9a44c] hover:underline"
    : "cursor-pointer hover:text-[#c7ad80] hover:underline";
  const refreshCl = isL2
    ? "mt-1 text-xs rounded-md py-1 px-2 bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8dcc8] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 hover:brightness-110 transition-[border-color,filter] duration-150 disabled:opacity-50"
    : "mt-1 text-xs text-[#c7ad80] hover:underline disabled:opacity-50";

  const [chars, setChars] = useState<Array<{ id: string; name: string; level: number; lastActivityAt: string | null; clan: string | null; clanId?: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminGetOnlinePlayers()
      .then((res) => setChars(res.characters || []))
      .catch((err: any) => {
        setChars([]);
        setError(err?.message || "Помилка. Перевірте логін в адмінку.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className={isL2 ? "border-t border-[#5c4a32]/40 pt-3 pb-3" : "border-t border-[#c7ad80]/30 pt-3 pb-3"}>
      <h2
        className={
          isL2
            ? "text-sm font-semibold mb-2 text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
            : "text-sm font-semibold mb-2 text-[#c7ad80]"
        }
      >
        Онлайн (10 хв)
      </h2>
      <p className={isL2 ? "text-xs text-[#8a7a60] mb-2" : "text-xs text-gray-500 mb-2"}>
        Список персонажей, активных за последние 10 минут. Обновляется каждую минуту.
      </p>
      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
      {loading ? (
        <p className={isL2 ? "text-xs text-[#8a7a60]" : "text-xs text-gray-500"}>Загрузка...</p>
      ) : (
        <div className={listBoxCl}>
          {chars.length === 0 ? (
            <p className={isL2 ? "px-2 py-2 text-[#8a7a60]" : "px-2 py-2 text-gray-500"}>Никого нет</p>
          ) : (
            <ul className="p-2 space-y-0.5">
              {chars.map((c) => (
                <li
                  key={c.id}
                  className={
                    isL2
                      ? "flex justify-between items-center border-b border-[#5c4a32]/25 last:border-0 pb-0.5 last:pb-0"
                      : "flex justify-between items-center"
                  }
                >
                  <span className={linkCl} onClick={() => navigate(`/player/${c.id}`)}>
                    {c.name}
                  </span>
                  <span className={metaCl}>
                    Lvl {c.level}
                    {c.clan ? (
                      c.clanId ? (
                        <>
                          {" · "}
                          <span
                            className={clanLinkCl}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clan/${c.clanId}`);
                            }}
                          >
                            {c.clan}
                          </span>
                        </>
                      ) : (
                        ` · ${c.clan}`
                      )
                    ) : (
                      ""
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <button type="button" onClick={load} disabled={loading} className={refreshCl}>
        Обновить
      </button>
    </section>
  );
}
