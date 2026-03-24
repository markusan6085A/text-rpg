import React, { useEffect, useState } from "react";
import { getPvpStats, type PvpStatsResponse } from "../../utils/api";
import {
  arenaOuterFrame,
  arenaPanel,
  arenaTitle,
  arenaSub,
  arenaGhostBtn,
} from "./arenaTheme";
import { getCityUiVariant } from "../../utils/cityUiVariant";

interface PvpArenaStatsScreenProps {
  navigate: (path: string) => void;
}

export default function PvpArenaStatsScreen({ navigate }: PvpArenaStatsScreenProps) {
  const isL2 = getCityUiVariant() === "l2";
  const [data, setData] = useState<PvpStatsResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getPvpStats()
      .then((r) => setData(r))
      .catch((e: any) => setErr(e?.message || "Ошибка загрузки"));
  }, []);

  const rowClass = isL2
    ? "flex items-center justify-between text-[12px] rounded-md px-2 py-1.5 bg-black/25 border border-[#5c4a32]/35"
    : "flex items-center justify-between text-sm rounded px-2 py-1.5 bg-black/20";

  const sectionTitle = isL2 ? "text-[12px] font-semibold text-[#c9a44c] mb-2" : "text-sm font-semibold text-amber-200 mb-2";

  return (
    <div className={`w-full min-w-0 my-1 p-2 sm:p-3 ${arenaOuterFrame()}`}>
      <div className="px-2 pt-2 pb-1">
        <h1 className={arenaTitle()}>Статистика PvP арены</h1>
        <p className={arenaSub()}>Топ арены, топ PK по данным персонажей и сводка матчей</p>
      </div>

      {err && (
        <div className={`mx-2 mb-2 text-center text-[12px] ${isL2 ? "text-[#d4786a]" : "text-red-400"}`}>{err}</div>
      )}

      {data && (
        <div className={`mx-2 mb-3 p-3 ${arenaPanel()}`}>
          <div className={sectionTitle}>Сводка арены</div>
          <div className={isL2 ? "text-[12px] text-[#d4c4a8] space-y-1" : "text-sm text-gray-300 space-y-1"}>
            <div>Всего боёв (арена): {data.arenaTotals.fights}</div>
            <div>Игроков в таблице арены: {data.arenaTotals.accounts}</div>
          </div>
        </div>
      )}

      <div className={`mx-2 mb-3 p-3 ${arenaPanel()}`}>
        <div className={sectionTitle}>Топ-10 арены (победы)</div>
        {!data ? (
          <div className={arenaSub()}>Загрузка…</div>
        ) : data.arenaTop.length === 0 ? (
          <div className={arenaSub()}>Пока пусто</div>
        ) : (
          <ol className="space-y-1.5">
            {data.arenaTop.map((row, i) => (
              <li key={row.characterId} className={rowClass}>
                <span className={isL2 ? "text-[#e8dcc8]" : "text-gray-200"}>
                  <span className="text-[#c9a44c] font-mono w-5 inline-block">{i + 1}.</span> {row.name || "—"}{" "}
                  <span className="opacity-60">· {row.level ?? "?"} ур.</span>
                </span>
                <span className={isL2 ? "text-[#7d9b7a] font-mono" : "text-green-400 font-mono"}>
                  {row.wins}W / {row.losses}L
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className={`mx-2 mb-3 p-3 ${arenaPanel()}`}>
        <div className={sectionTitle}>Топ-10 PK (pvpWins в профиле)</div>
        {!data ? (
          <div className={arenaSub()}>Загрузка…</div>
        ) : data.pkTop.length === 0 ? (
          <div className={arenaSub()}>Нет записей с PvP-статистикой</div>
        ) : (
          <ol className="space-y-1.5">
            {data.pkTop.map((row, i) => (
              <li key={row.characterId} className={rowClass}>
                <span className={isL2 ? "text-[#e8dcc8]" : "text-gray-200"}>
                  <span className="text-[#c9a44c] font-mono w-5 inline-block">{i + 1}.</span> {row.name || "—"}{" "}
                  <span className="opacity-60">· {row.level ?? "?"} ур.</span>
                </span>
                <span className={isL2 ? "text-[#b8a0d4] font-mono" : "text-violet-300 font-mono"}>
                  {row.wins}W / {row.losses}L
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mx-2 mb-3 space-y-2">
        <button type="button" className={arenaGhostBtn()} onClick={() => navigate("/arena")}>
          На арену
        </button>
        <button type="button" className={arenaGhostBtn()} onClick={() => navigate("/city")}>
          В город
        </button>
      </div>
    </div>
  );
}
