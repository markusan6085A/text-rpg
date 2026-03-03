import React, { useState, useEffect } from "react";
import { adminGetOnlinePlayers } from "../../utils/api";

const style = { color: "#c7ad80" };

/**
 * Онлайн игроки
 * Список персонажей, активных за последние 10 минут.
 */
export function AdminSectionOnline() {
  const [chars, setChars] = useState<Array<{ id: string; name: string; level: number; lastActivityAt: string | null; clan: string | null }>>([]);
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
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3">
      <h2 className="text-sm font-semibold mb-2" style={style}>Онлайн (10 хв)</h2>
      <p className="text-xs text-gray-500 mb-2">
        Список персонажей, активных за последние 10 минут. Обновляется каждую минуту.
      </p>
      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
      {loading ? (
        <p className="text-xs text-gray-500">Загрузка...</p>
      ) : (
        <div className="max-h-32 overflow-auto border border-[#c7ad80]/20 rounded text-xs">
          {chars.length === 0 ? (
            <p className="px-2 py-2 text-gray-500">Никого нет</p>
          ) : (
            <ul className="p-2 space-y-0.5">
              {chars.map((c) => (
                <li key={c.id} className="flex justify-between">
                  <span className="text-gray-300">{c.name}</span>
                  <span className="text-gray-500">Lvl {c.level}{c.clan ? ` · ${c.clan}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <button type="button" onClick={load} disabled={loading} className="mt-1 text-xs text-[#c7ad80] hover:underline disabled:opacity-50">
        Обновить
      </button>
    </section>
  );
}
