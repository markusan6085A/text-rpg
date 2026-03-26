import React, { useCallback, useEffect, useState } from "react";
import { getCityUiVariant } from "../../utils/cityUiVariant";
import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import { getTvtState, pickTvtTarget, getArenaActiveSession, type TvtStateResponse } from "../../utils/api";

type Props = { navigate: (path: string) => void };

export default function TvtMatchBoardScreen({ navigate }: Props) {
  const isL2 = getCityUiVariant() === "l2";
  const hero = useHeroStore((s) => s.hero);
  const characterId = useCharacterStore((s) => s.characterId);
  const cid = (characterId || hero?.id || "").trim();

  const [tvtState, setTvtState] = useState<TvtStateResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadState = useCallback(async () => {
    try {
      const r = await getTvtState(cid?.trim() ? cid.trim() : undefined);
      setTvtState(r);
      setErr(null);
    } catch (e: unknown) {
      setErr(e && typeof e === "object" && "message" in e ? String((e as { message?: string }).message) : "Ошибка");
    }
  }, [cid]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    const iv = setInterval(() => void loadState(), 5_000);
    return () => clearInterval(iv);
  }, [loadState]);

  useEffect(() => {
    if (!cid || !hero) return;
    const tick = async () => {
      try {
        const r = await getArenaActiveSession(cid);
        const sid = r.sessionId?.trim();
        if (sid) {
          navigate(`/arena/match?session=${encodeURIComponent(sid)}`);
        }
      } catch {
        /* ignore */
      }
    };
    void tick();
    const iv = setInterval(tick, 15_000);
    return () => clearInterval(iv);
  }, [cid, hero, navigate]);

  const d = tvtState?.myMatchDetail;
  const mySide = d?.mySide;
  const myTeam = mySide === "A" ? d?.teamA : mySide === "B" ? d?.teamB : [];
  const enemyTeam = mySide === "A" ? d?.teamB : mySide === "B" ? d?.teamA : [];

  const handleAttack = async (defenderId: string) => {
    if (!cid) return;
    setBusy(true);
    try {
      await pickTvtTarget(cid, defenderId);
      await loadState();
      const r = await getArenaActiveSession(cid);
      const sid = r.sessionId?.trim();
      if (sid) navigate(`/arena/match?session=${encodeURIComponent(sid)}`);
    } catch (e: unknown) {
      setErr(e && typeof e === "object" && "message" in e ? String((e as { message?: string }).message) : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const rowStyle =
    "w-full rounded-md border border-[#5c4a32]/60 bg-black/25 px-3 py-2 text-left text-[13px] text-[#d4c4a8] hover:border-[#c7ad80]/45 disabled:opacity-40";

  if (!cid || !hero) {
    return (
      <div className={isL2 ? `${l2Frame} w-full min-w-0 my-1 p-4` : "p-4"}>
        <p className="text-[#d4786a] text-[13px]">Войдите в игру.</p>
        <button type="button" className="mt-3 text-[#c9a44c] underline" onClick={() => navigate("/tvt")}>
          К TvT
        </button>
      </div>
    );
  }

  if (!tvtState) {
    return (
      <div className={isL2 ? `${l2Frame} w-full min-w-0 my-1 p-4` : "p-4"}>
        <p className="text-[#a89878] text-[13px]">Загрузка…</p>
      </div>
    );
  }

  if (!tvtState.myMatch || tvtState.myMatch.status !== "active") {
    return (
      <div className={isL2 ? `${l2Frame} w-full min-w-0 my-1 p-4` : "p-4"}>
        <p className="text-[#a89878] text-[13px] mb-3">Нет активного матча.</p>
        <button type="button" className="text-[#c9a44c] underline text-[13px]" onClick={() => navigate("/tvt")}>
          К расписанию TvT
        </button>
      </div>
    );
  }

  if (!d) {
    return (
      <div className={isL2 ? `${l2Frame} w-full min-w-0 my-1 p-4` : "p-4"}>
        <p className="text-[#a89878] text-[13px]">Загрузка состава…</p>
      </div>
    );
  }

  const canClickEnemy = Boolean(d.canStartFight);

  return (
    <div className={isL2 ? `${l2Frame} w-full min-w-0 my-1 p-2 sm:p-3` : "w-full px-3 py-4"}>
      <div
        className={
          isL2
            ? "border-b border-[#5c4a32]/45 px-2 py-2 text-center text-[11px] text-[#e8c56e] tracking-[0.12em] uppercase"
            : "border-b border-black/50 pb-2 mb-3 text-center text-[#f4e2b8]"
        }
      >
        TvT
      </div>

      <p className={isL2 ? "mx-2 mt-2 text-[11px] text-[#8a7a60]" : "text-xs text-gray-500"}>
        {d.phase === "fighting" || !d.canStartFight ? "Идёт бой — дождитесь окончания или откроется окно PvP." : "Нажмите ник противника, чтобы начать бой. Любой игрок команды может атаковать любого врага."}
      </p>

      <div className="mt-4 px-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className={isL2 ? "text-[11px] uppercase text-[#c9a44c] mb-2" : "text-amber-300 text-sm mb-2"}>Моя команда</div>
          <ul className="space-y-1.5">
            {(myTeam ?? []).map((p) => (
              <li
                key={p.id}
                className={
                  isL2
                    ? "rounded border border-[#5c4a32]/40 bg-black/20 px-2 py-1.5 text-[12px] text-[#e8dcc8]"
                    : "rounded border border-gray-700 px-2 py-1.5 text-sm text-gray-200"
                }
              >
                <span className={p.id === cid ? "text-[#e8c56e] font-semibold" : ""}>{p.name}</span>
                <span className="text-[#8a7a60]"> · {p.level} ур.</span>
                {p.id === cid ? <span className="text-[#7d9b7a] text-[11px]"> (вы)</span> : null}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className={isL2 ? "text-[11px] uppercase text-[#d4786a] mb-2" : "text-red-300 text-sm mb-2"}>Команда противника</div>
          <ul className="space-y-1.5">
            {(enemyTeam ?? []).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={busy || !canClickEnemy}
                  onClick={() => void handleAttack(p.id)}
                  className={isL2 ? rowStyle : "w-full rounded border border-gray-600 px-3 py-2 text-left text-sm text-gray-200 disabled:opacity-40"}
                >
                  <span className="text-[#e8c56e] font-semibold">{p.name}</span>
                  <span className="text-[#8a7a60]"> · {p.level} ур. — атака</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {err && <p className="mt-3 px-2 text-[11px] text-[#d4786a]">{err}</p>}

      <div className="mt-6 flex flex-wrap gap-2 justify-center px-2 pb-2">
        <button
          type="button"
          onClick={() => void loadState()}
          disabled={busy}
          className={
            isL2
              ? "px-3 py-2 rounded-md border border-[#5c4a32]/60 text-[12px] text-[#c9a44c] disabled:opacity-40"
              : "px-3 py-2 rounded border border-gray-600 text-sm text-amber-300"
          }
        >
          Обновить
        </button>
        <button
          type="button"
          onClick={() => navigate("/tvt")}
          className={
            isL2
              ? "px-4 py-2 rounded-md border border-[#5c4a32]/45 text-[11px] text-[#8a7a60] hover:text-[#c9a44c]"
              : "px-4 py-2 rounded border border-gray-600 text-gray-400 text-sm"
          }
        >
          Расписание TvT
        </button>
        <button
          type="button"
          onClick={() => navigate("/city")}
          className={
            isL2
              ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-[#1a1610]/80 text-[12px] text-[#c9a44c]"
              : "px-4 py-2 rounded bg-gray-700 text-white text-sm"
          }
        >
          В город
        </button>
      </div>
    </div>
  );
}
