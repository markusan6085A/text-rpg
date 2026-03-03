import React, { useState, useEffect } from "react";
import { adminSearchPlayers } from "../../utils/api";

const style = { color: "#c7ad80" };

/**
 * Список персонажей
 * Поиск игроков по имени (частичное совпадение), пагинация.
 * Показывает: ник, уровень, клан, дату создания, бан/блок.
 */
export function AdminSectionPlayers() {
  const [name, setName] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    characters: Array<{ id: string; name: string; level: number; createdAt: string; bannedUntil: string | null; blockedUntil: string | null; clan: { id: string; name: string } | null }>;
    total: number;
    limit: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminSearchPlayers({ name: name.trim() || undefined, page, limit: 15 });
      setResult({ characters: res.characters, total: res.total, limit: res.limit });
    } catch (err: any) {
      setResult(null);
      setError(err?.message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const pages = result ? Math.max(1, Math.ceil(result.total / result.limit)) : 0;
  const inputCl = "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500";

  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3">
      <h2 className="text-sm font-semibold mb-2" style={style}>Список персонажей</h2>
      <p className="text-xs text-gray-500 mb-2">
        Поиск по имени (частичное совпадение). Показывает ник, уровень, клан, бан/блок.
      </p>
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 mb-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Нік (частковий збіг)" className={`${inputCl} w-44`} />
        <button type="submit" disabled={loading} className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50">
          Поиск
        </button>
      </form>
      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
      {result && (
        <>
          <div className="max-h-48 overflow-auto border border-[#c7ad80]/20 rounded text-xs">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#1a1a1a] text-[#c7ad80]">
                <tr>
                  <th className="px-2 py-1 text-left">Нік</th>
                  <th className="px-2 py-1 text-left">Lvl</th>
                  <th className="px-2 py-1 text-left">Клан</th>
                  <th className="px-2 py-1 text-left">Бан/Блок</th>
                </tr>
              </thead>
              <tbody>
                {result.characters.length === 0 ? (
                  <tr><td colSpan={4} className="px-2 py-3 text-center text-gray-500 text-xs">Нічого не знайдено</td></tr>
                ) : (
                  result.characters.map((c) => (
                    <tr key={c.id} className="border-t border-[#c7ad80]/10">
                      <td className="px-2 py-1 text-gray-300">{c.name}</td>
                      <td className="px-2 py-1 text-gray-400">{c.level}</td>
                      <td className="px-2 py-1 text-gray-400">{c.clan?.name ?? "—"}</td>
                      <td className="px-2 py-1">
                        {c.bannedUntil ? <span className="text-red-400">Бан</span> : c.blockedUntil ? <span className="text-orange-400">Блок</span> : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={loading || page <= 1} className="text-[#c7ad80] disabled:opacity-50">←</button>
            <span className="text-gray-400">Стр. {page} / {pages} ({result.total} всего)</span>
            <button type="button" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={loading || page >= pages} className="text-[#c7ad80] disabled:opacity-50">→</button>
          </div>
        </>
      )}
    </section>
  );
}
