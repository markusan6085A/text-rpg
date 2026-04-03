import React, { useState, useEffect } from "react";
import { adminSearchPlayers } from "../../utils/api";
import { isWarmCityUi, useCityUiVariant } from "../../utils/cityUiVariant";

interface AdminSectionPlayersProps {
  navigate: (path: string) => void;
}

/**
 * Список персонажей
 * Поиск игроков по имени (частичное совпадение), пагинация.
 * Показывает: ник, уровень, клан, дату создания, бан/блок.
 */
export function AdminSectionPlayers({ navigate }: AdminSectionPlayersProps) {
  const cityUi = useCityUiVariant();
  const isL2 = isWarmCityUi(cityUi);
  const btnCl = isL2
    ? "text-sm py-1 px-2 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8dcc8] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 hover:brightness-110 transition-[border-color,filter] duration-150 disabled:opacity-50"
    : "text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50";
  const tableWrapCl = isL2
    ? "max-h-48 overflow-auto rounded-md border border-[#5c4a32]/60 bg-black/20 text-xs"
    : "max-h-48 overflow-auto border border-[#c7ad80]/20 rounded text-xs";
  const theadCl = isL2 ? "sticky top-0 bg-[#1a1610] border-b border-[#5c4a32]/45 text-[#e8c56e]" : "sticky top-0 bg-[#1a1a1a] text-[#c7ad80]";
  const rowBorderCl = isL2 ? "border-t border-[#5c4a32]/25" : "border-t border-[#c7ad80]/10";
  const linkCl = isL2
    ? "text-[#e8dcc8] cursor-pointer hover:text-[#c9a44c] hover:underline"
    : "text-gray-300 cursor-pointer hover:text-[#c7ad80] hover:underline";
  const mutedCl = isL2 ? "text-[#8a7a60]" : "text-gray-400";
  const clanLinkCl = isL2
    ? "text-[#8a7a60] cursor-pointer hover:text-[#c9a44c] hover:underline"
    : "text-gray-400 cursor-pointer hover:text-[#c7ad80] hover:underline";
  const pageBtnCl = isL2
    ? "rounded-md py-0.5 px-1.5 bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8dcc8] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 disabled:opacity-50"
    : "text-[#c7ad80] disabled:opacity-50";

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
  const inputCl =
    "text-sm py-1 px-2 rounded-md bg-black/40 border text-white placeholder-gray-500 " +
    (isL2 ? "border-[#5c4a32]/70 focus:border-[#c7ad80]/45 focus:outline-none" : "border-[#c7ad80]/30");

  return (
    <section className={isL2 ? "border-t border-[#5c4a32]/40 pt-3 pb-3" : "border-t border-[#c7ad80]/30 pt-3 pb-3"}>
      <h2
        className={
          isL2
            ? "text-sm font-semibold mb-2 text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
            : "text-sm font-semibold mb-2 text-[#c7ad80]"
        }
      >
        Список персонажей
      </h2>
      <p className={isL2 ? "text-xs text-[#8a7a60] mb-2" : "text-xs text-gray-500 mb-2"}>
        Поиск по имени (частичное совпадение). Показывает ник, уровень, клан, бан/блок.
      </p>
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 mb-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Нік (частковий збіг)" className={`${inputCl} w-44`} />
        <button type="submit" disabled={loading} className={btnCl}>
          Поиск
        </button>
      </form>
      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
      {result && (
        <>
          <div className={tableWrapCl}>
            <table className="w-full">
              <thead className={theadCl}>
                <tr>
                  <th className="px-2 py-1 text-left">Нік</th>
                  <th className="px-2 py-1 text-left">Lvl</th>
                  <th className="px-2 py-1 text-left">Клан</th>
                  <th className="px-2 py-1 text-left">Бан/Блок</th>
                </tr>
              </thead>
              <tbody>
                {result.characters.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className={isL2 ? "px-2 py-3 text-center text-[#8a7a60] text-xs" : "px-2 py-3 text-center text-gray-500 text-xs"}
                    >
                      Нічого не знайдено
                    </td>
                  </tr>
                ) : (
                  result.characters.map((c) => (
                    <tr key={c.id} className={rowBorderCl}>
                      <td className="px-2 py-1">
                        <span className={linkCl} onClick={() => navigate(`/player/${c.id}`)}>
                          {c.name}
                        </span>
                      </td>
                      <td className={`px-2 py-1 ${mutedCl}`}>{c.level}</td>
                      <td className="px-2 py-1">
                        {c.clan ? (
                          <span className={clanLinkCl} onClick={() => navigate(`/clan/${c.clan!.id}`)}>
                            {c.clan.name}
                          </span>
                        ) : (
                          <span className={mutedCl}>—</span>
                        )}
                      </td>
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
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
              className={pageBtnCl}
            >
              ←
            </button>
            <span className={isL2 ? "text-[#8a7a60]" : "text-gray-400"}>
              Стр. {page} / {pages} ({result.total} всего)
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={loading || page >= pages}
              className={pageBtnCl}
            >
              →
            </button>
          </div>
        </>
      )}
    </section>
  );
}
