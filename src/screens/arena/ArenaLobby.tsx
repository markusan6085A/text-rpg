import React, { useEffect, useRef, useState } from "react";
import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import {
  joinArenaQueue,
  leaveArenaQueue,
  getArenaQueueStatus,
  getArenaLeaderboard,
  type ArenaLbRow,
} from "../../utils/api";
import {
  arenaOuterFrame,
  arenaPanel,
  arenaTitle,
  arenaSub,
  arenaPrimaryBtn,
  arenaGhostBtn,
} from "./arenaTheme";
import { getCityUiVariant } from "../../utils/cityUiVariant";

interface ArenaLobbyProps {
  navigate: (path: string) => void;
}

export default function ArenaLobby({ navigate }: ArenaLobbyProps) {
  const hero = useHeroStore((s) => s.hero);
  const characterId = useCharacterStore((s) => s.characterId);
  const cid = (characterId || hero?.id || "").trim();
  const isL2 = getCityUiVariant() === "l2";

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [inQueue, setInQueue] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [top, setTop] = useState<ArenaLbRow[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getArenaLeaderboard()
      .then((r) => setTop(Array.isArray(r.top) ? r.top : []))
      .catch(() => setTop([]));
  }, []);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPoll();
  }, []);

  const goMatch = (sessionId: string) => {
    stopPoll();
    setInQueue(false);
    navigate(`/arena/match?session=${encodeURIComponent(sessionId)}`);
  };

  const handleJoin = async () => {
    if (!cid) {
      setErr("Нет персонажа");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const res = await joinArenaQueue(cid);
      if (res.matched && res.sessionId) {
        goMatch(res.sessionId);
        return;
      }
      if (res.inQueue) {
        setInQueue(true);
        setQueueSize(res.queueSize ?? 0);
        stopPoll();
        pollRef.current = setInterval(async () => {
          try {
            const st = await getArenaQueueStatus();
            if (st.matched && st.sessionId) {
              goMatch(st.sessionId);
              return;
            }
            setInQueue(!!st.inQueue);
            setQueueSize(st.queueSize ?? 0);
          } catch {
            /* ignore */
          }
        }, 2000);
      }
    } catch (e: any) {
      setErr(e?.message || "Ошибка очереди");
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    stopPoll();
    try {
      await leaveArenaQueue(cid || undefined);
      setInQueue(false);
      setQueueSize(0);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  if (!hero) {
    return (
      <div className={isL2 ? "text-[#8a7a60] text-sm text-center py-8" : "text-gray-400 text-center py-8"}>
        Войдите в игру
      </div>
    );
  }

  return (
    <div className={`w-full min-w-0 my-1 p-2 sm:p-3 ${arenaOuterFrame()}`}>
      <div className="px-2 pt-2 pb-1">
        <h1 className={arenaTitle()}>Арена PvP</h1>
        <p className={arenaSub()}>
          Матчмейкинг 1×1 · те ж правило бою та бафи, що й у PK · різниця рівнів до 20
        </p>
      </div>

      <div className={`mx-2 mb-3 p-3 ${arenaPanel()}`}>
        {err && (
          <div className={`mb-2 text-center text-[12px] ${isL2 ? "text-[#d4786a]" : "text-red-400"}`}>{err}</div>
        )}
        {!inQueue ? (
          <button type="button" disabled={busy || !cid} className={arenaPrimaryBtn()} onClick={handleJoin}>
            {busy ? "…" : "Искать противника"}
          </button>
        ) : (
          <div className="space-y-2">
            <div className={`text-center text-[13px] ${isL2 ? "text-[#d4c4a8]" : "text-gray-200"}`}>
              В очереди… (~{queueSize} в списке)
            </div>
            <button type="button" disabled={busy} className={arenaGhostBtn()} onClick={handleLeave}>
              Покинуть очередь
            </button>
          </div>
        )}
        <button
          type="button"
          className={`mt-2 ${arenaGhostBtn()}`}
          onClick={() => navigate("/pvp-stats")}
        >
          Статистика PvP арены
        </button>
        <button type="button" className={`mt-2 ${arenaGhostBtn()}`} onClick={() => navigate("/city")}>
          В город
        </button>
      </div>

      <div className={`mx-2 mb-3 p-3 ${arenaPanel()}`}>
        <div className={isL2 ? "text-[12px] font-semibold text-[#c9a44c] mb-2" : "text-sm font-semibold text-amber-200 mb-2"}>
          Топ-10 арены (по победам)
        </div>
        {top.length === 0 ? (
          <div className={arenaSub()}>Пока нет записей — станьте первым!</div>
        ) : (
          <ol className="space-y-1.5">
            {top.map((row, i) => (
              <li
                key={row.characterId}
                className={`flex items-center justify-between text-[12px] rounded-md px-2 py-1.5 ${
                  isL2 ? "bg-black/25 border border-[#5c4a32]/35" : "bg-black/20"
                }`}
              >
                <span className={isL2 ? "text-[#e8dcc8]" : "text-gray-200"}>
                  <span className="text-[#c9a44c] font-mono w-5 inline-block">{i + 1}.</span>{" "}
                  {row.name || "—"}{" "}
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
    </div>
  );
}
