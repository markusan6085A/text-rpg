import React, { useCallback, useEffect, useRef, useState } from "react";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";
import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import { getTvtState, pickTvtTarget, getArenaActiveSession, type TvtStateResponse } from "../../utils/api";
import { loadHeroFromAPI } from "../../state/heroStore/heroLoadAPI";
import { L2_WARM_OUTER_FRAME } from "../../utils/l2WarmLayoutClassNames";

type Props = { navigate: (path: string) => void };

export default function TvtMatchBoardScreen({ navigate }: Props) {
  const isL2 = isWarmCityUi(getCityUiVariant());
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

  const prevMatchActiveRef = useRef<boolean | null>(null);
  useEffect(() => {
    const active = tvtState?.myMatch?.status === "active";
    if (prevMatchActiveRef.current === true && active === false) {
      void loadHeroFromAPI().catch(() => {});
    }
    prevMatchActiveRef.current = active ?? null;
  }, [tvtState?.myMatch?.status]);

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

  const l2Frame = L2_WARM_OUTER_FRAME;
  const rowStyle =
    "rounded-md border border-[#8a3030]/50 bg-black/25 px-2 py-1.5 text-[13px] text-[#e8a0a0] hover:border-[#c7ad80]/45 disabled:opacity-40";
  const nickRowClass = "flex flex-wrap items-center gap-[0.5cm]";

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

      <div className="mt-4 px-2 space-y-5">
        <div>
          <div className={isL2 ? "text-[11px] uppercase text-[#c9a44c] mb-2" : "text-amber-300 text-sm mb-2"}>Моя команда</div>
          <div className={nickRowClass}>
            {(myTeam ?? []).map((p) => (
              <span
                key={p.id}
                className={
                  isL2
                    ? `whitespace-nowrap text-[13px] font-medium text-[#8fbc8f] ${p.id === cid ? "underline decoration-[#c9a44c]/60" : ""}`
                    : `whitespace-nowrap text-sm font-medium text-emerald-400 ${p.id === cid ? "underline" : ""}`
                }
              >
                {p.name}
                {p.id === cid ? " (вы)" : null}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className={isL2 ? "text-[11px] uppercase text-[#d4786a] mb-2" : "text-red-300 text-sm mb-2"}>Команда противника</div>
          <div className={nickRowClass}>
            {(enemyTeam ?? []).map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={busy || !canClickEnemy}
                onClick={() => void handleAttack(p.id)}
                className={
                  isL2
                    ? `${rowStyle} whitespace-nowrap text-[#e8a0a0] font-medium`
                    : "rounded border border-red-900/50 bg-black/20 px-2 py-1.5 text-sm font-medium text-red-400 hover:border-red-600/50 disabled:opacity-40 whitespace-nowrap"
                }
              >
                {p.name}
                {canClickEnemy ? " — атака" : ""}
              </button>
            ))}
          </div>
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
