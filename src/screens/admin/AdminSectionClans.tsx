import React, { useState, useEffect } from "react";
import { adminGetClans, adminDisbandClan, adminKickFromClan } from "../../utils/api";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";

const style = { color: "#c7ad80" };

interface AdminSectionClansProps {
  navigate: (path: string) => void;
}

/**
 * Кланы
 * Список всех кланов. Роспуск клана. Исключение участника из клана.
 */
export function AdminSectionClans({ navigate }: AdminSectionClansProps) {
  const isL2 = isWarmCityUi(getCityUiVariant());
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [kickLoading, setKickLoading] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setMessage(null);
    adminGetClans()
      .then((res) => setClans(res.clans || []))
      .catch((err: any) => {
        setClans([]);
        setMessage(err?.message || "Помилка завантаження. Перевірте, що ви залогінені в адмінку.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDisband = async (clanId: string, clanName: string) => {
    if (!confirm(`Розпустити клан "${clanName}"?`)) return;
    setMessage(null);
    try {
      await adminDisbandClan(clanId);
      setMessage(`Клан "${clanName}" розпущено`);
      load();
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    }
  };

  const handleKick = async (clanId: string, characterId: string, charName: string) => {
    setKickLoading(characterId);
    try {
      await adminKickFromClan(clanId, characterId);
      setMessage(`Гравця ${charName} вигнано з клану`);
      load();
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setKickLoading(null);
    }
  };

  const sectionBorder = isL2 ? "border-t border-[#5c4a32]/50 pt-3 pb-3" : "border-t border-[#c7ad80]/30 pt-3 pb-3";
  const hintText = isL2 ? "text-xs text-[#8a7a60] mb-2" : "text-xs text-gray-500 mb-2";
  const refreshBtn = isL2
    ? "text-xs py-1.5 px-2.5 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8c56e] hover:border-[#c7ad80]/45 hover:brightness-110 disabled:opacity-50 mb-2 transition-[border-color,filter] duration-150"
    : "text-xs py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50 mb-2";
  const listBox = isL2
    ? "max-h-64 overflow-auto rounded-lg border border-[#5c4a32]/55 bg-black/22 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
    : "max-h-64 overflow-auto border border-[#c7ad80]/20 rounded";
  const clanRow = isL2
    ? "border-b border-[#5c4a32]/40 p-2 last:border-b-0 bg-gradient-to-b from-[#2e2619]/35 to-transparent"
    : "border-b border-[#c7ad80]/10 p-2";
  const memberBorder = isL2 ? "border-l border-[#5c4a32]/50" : "border-l border-[#c7ad80]/20";
  const nameMuted = isL2 ? "text-[#d4c4a8] font-medium hover:text-[#e8c56e] hover:underline" : "text-gray-300 font-medium hover:text-[#c7ad80] hover:underline";
  const metaMuted = isL2 ? "text-xs text-[#8a7a60]" : "text-xs text-gray-500";

  return (
    <section className={sectionBorder}>
      <h2
        className={isL2 ? "text-sm font-semibold mb-2 text-[#e8c56e]" : "text-sm font-semibold mb-2"}
        style={isL2 ? undefined : style}
      >
        Кланы
      </h2>
      <p className={hintText}>
        Список кланов. Роспуск клана. Исключение участника. Обновить — перезагрузить список.
      </p>
      <button type="button" onClick={load} disabled={loading} className={refreshBtn}>
        Обновить
      </button>
      {message && <p className={hintText}>{message}</p>}
      {loading ? (
        <p className={hintText}>Загрузка...</p>
      ) : (
        <div className={listBox}>
          {clans.length === 0 ? (
            <p className={`p-2 text-xs ${isL2 ? "text-[#8a7a60]" : "text-gray-500"}`}>Нет кланов</p>
          ) : (
            clans.map((clan) => (
              <div key={clan.id} className={clanRow}>
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedId(expandedId === clan.id ? null : clan.id)}
                >
                  <span
                    className={nameMuted}
                    onClick={(e) => { e.stopPropagation(); navigate(`/clan/${clan.id}`); }}
                  >
                    {clan.name}
                  </span>
                  <span className={metaMuted}>
                    Lvl {clan.level} · {clan._count?.members ?? 0} участ. ·{" "}
                    {clan.creator ? (
                      <span
                        className="cursor-pointer hover:text-[#c7ad80] hover:underline"
                        onClick={(e) => { e.stopPropagation(); navigate(`/player/${clan.creator!.id}`); }}
                      >
                        {clan.creator.name}
                      </span>
                    ) : (
                      "—"
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDisband(clan.id, clan.name); }}
                    className="text-xs py-0.5 px-1 rounded bg-red-900/40 text-red-300 hover:bg-red-900/60"
                  >
                    Роспуск
                  </button>
                </div>
                {expandedId === clan.id && clan.members && (
                  <div className={`mt-2 pl-2 ${memberBorder} space-y-1 text-xs ${isL2 ? "text-[#d4c4a8]" : ""}`}>
                    {clan.members.map((m: any) => (
                      <div key={m.id} className="flex justify-between">
                        <span
                          className="cursor-pointer hover:text-[#c7ad80] hover:underline"
                          onClick={() => navigate(`/player/${m.characterId}`)}
                        >
                          {m.character?.name ?? m.characterId}
                        </span>
                        {m.characterId !== clan.creatorId && (
                          <button
                            type="button"
                            onClick={() => handleKick(clan.id, m.characterId, m.character?.name ?? m.characterId)}
                            disabled={kickLoading === m.characterId}
                            className="text-red-400 hover:underline disabled:opacity-50"
                          >
                            Выгнать
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
