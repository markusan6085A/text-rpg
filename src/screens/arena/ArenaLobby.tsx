import React, { useEffect, useRef, useState, useCallback } from "react";
import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import {
  joinArenaField,
  leaveArenaField,
  getArenaField,
  arenaChallenge,
  getArenaLeaderboard,
  getArenaPendingBattle,
  clearArenaPendingBattle,
  type ArenaLbRow,
  type ArenaFieldPlayer,
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

const POLL_MS = 2500;

export default function ArenaLobby({ navigate }: ArenaLobbyProps) {
  const hero = useHeroStore((s) => s.hero);
  const characterId = useCharacterStore((s) => s.characterId);
  const cid = (characterId || hero?.id || "").trim();
  const isL2 = getCityUiVariant() === "l2";

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [onField, setOnField] = useState(false);
  const [players, setPlayers] = useState<ArenaFieldPlayer[]>([]);
  const [top, setTop] = useState<ArenaLbRow[]>([]);
  const [incoming, setIncoming] = useState<{ sessionId: string; attackerName: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const stopPendingPoll = () => {
    if (pendingPollRef.current) {
      clearInterval(pendingPollRef.current);
      pendingPollRef.current = null;
    }
  };

  const refreshField = useCallback(async () => {
    if (!cid) return;
    try {
      const r = await getArenaField(cid);
      setPlayers(Array.isArray(r.players) ? r.players : []);
    } catch {
      /* ignore */
    }
  }, [cid]);

  useEffect(() => {
    return () => {
      stopPoll();
      stopPendingPoll();
    };
  }, []);

  useEffect(() => {
    if (!onField || !cid) {
      stopPoll();
      return;
    }
    refreshField();
    stopPoll();
    pollRef.current = setInterval(refreshField, POLL_MS);
    return () => stopPoll();
  }, [onField, cid, refreshField]);

  useEffect(() => {
    if (!hero) {
      stopPendingPoll();
      setIncoming(null);
      return;
    }
    const tick = async () => {
      try {
        const r = await getArenaPendingBattle();
        setIncoming(r.pending && r.pending.sessionId ? r.pending : null);
      } catch {
        /* ignore */
      }
    };
    tick();
    stopPendingPoll();
    pendingPollRef.current = setInterval(tick, 3000);
    return () => stopPendingPoll();
  }, [hero?.id]);

  const goMatch = (sessionId: string) => {
    stopPoll();
    stopPendingPoll();
    setOnField(false);
    setIncoming(null);
    navigate(`/arena/match?session=${encodeURIComponent(sessionId)}`);
  };

  const handleAcceptIncoming = async () => {
    if (!incoming?.sessionId) return;
    try {
      await clearArenaPendingBattle();
    } catch {
      /* ignore */
    }
    goMatch(incoming.sessionId);
  };

  const handleDismissIncoming = async () => {
    try {
      await clearArenaPendingBattle();
    } catch {
      /* ignore */
    }
    setIncoming(null);
  };

  const handleEnterField = async () => {
    if (!cid) {
      setErr("Нет персонажа");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const r = await joinArenaField(cid);
      setOnField(true);
      setPlayers(Array.isArray(r.players) ? r.players : []);
    } catch (e: any) {
      setErr(e?.message || "Не удалось выйти на поле");
    } finally {
      setBusy(false);
    }
  };

  const handleLeaveField = async () => {
    setBusy(true);
    stopPoll();
    try {
      await leaveArenaField(cid || undefined);
      setOnField(false);
      setPlayers([]);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const handleChallenge = async (target: ArenaFieldPlayer) => {
    if (!cid || !hero) return;
    if (target.id === cid) return;
    const myLevel = hero.level ?? 1;
    if (Math.abs(myLevel - target.level) > 20) {
      setErr("Разница уровней больше 20 — нельзя атаковать.");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const res = await arenaChallenge(cid, target.id, {
        hp: hero.hp,
        maxHp: hero.maxHp,
        mp: hero.mp,
        maxMp: hero.maxMp,
      });
      if (res.sessionId) goMatch(res.sessionId);
    } catch (e: any) {
      setErr(e?.message || "Не удалось начать бой");
    } finally {
      setBusy(false);
    }
  };

  const others = players.filter((p) => p.id !== cid).sort((a, b) => a.name.localeCompare(b.name, "ru"));

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
          Поле боя: на нём могут быть десятки игроков. Выйдите на поле — увидите остальных. Нажмите на ник —
          начнётся бой (как PK, бафы те же). Разница уровней до 20.
        </p>
      </div>

      {incoming && (
        <div
          className={
            isL2
              ? "mx-2 mb-3 p-3 rounded-lg border border-[#c9a44c]/50 bg-[#2a2318]/90 shadow-[0_0_24px_rgba(201,164,76,0.15)]"
              : "mx-2 mb-3 p-3 rounded-lg border border-amber-500/40 bg-amber-950/40"
          }
        >
          <div className={isL2 ? "text-[13px] text-[#e8dcc8] text-center mb-2" : "text-sm text-amber-100 text-center mb-2"}>
            <span className="font-semibold text-[#e8c56e]">{incoming.attackerName}</span> вызывает вас на арену
          </div>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              className={arenaPrimaryBtn() + " !py-2 !text-[12px] max-w-[200px]"}
              onClick={handleAcceptIncoming}
            >
              Принять вызов
            </button>
            <button type="button" className={arenaGhostBtn() + " !py-2"} onClick={handleDismissIncoming}>
              Отклонить
            </button>
          </div>
        </div>
      )}

      <div className={`mx-2 mb-3 p-3 ${arenaPanel()}`}>
        {err && (
          <div className={`mb-2 text-center text-[12px] ${isL2 ? "text-[#d4786a]" : "text-red-400"}`}>{err}</div>
        )}
        {!onField ? (
          <button type="button" disabled={busy || !cid} className={arenaPrimaryBtn()} onClick={handleEnterField}>
            {busy ? "…" : "Выйти на поле арены"}
          </button>
        ) : (
          <div className="space-y-2">
            <div className={`text-center text-[13px] ${isL2 ? "text-[#7d9b7a]" : "text-green-300"}`}>
              Вы на поле · игроков на поле: <span className="font-mono font-semibold">{players.length}</span>
            </div>
            <button type="button" disabled={busy} className={arenaGhostBtn()} onClick={handleLeaveField}>
              Покинуть поле
            </button>
          </div>
        )}
        <button type="button" className={`mt-2 ${arenaGhostBtn()}`} onClick={() => navigate("/pvp-stats")}>
          Статистика PvP арены
        </button>
        <button type="button" className={`mt-2 ${arenaGhostBtn()}`} onClick={() => navigate("/city")}>
          В город
        </button>
      </div>

      {onField && (
        <div className={`mx-2 mb-3 p-3 ${arenaPanel()}`}>
          <div
            className={
              isL2 ? "text-[12px] font-semibold text-[#c9a44c] mb-2" : "text-sm font-semibold text-amber-200 mb-2"
            }
          >
            Игроки на поле
          </div>
          {others.length === 0 ? (
            <div className={arenaSub()}>Пока никого кроме вас — подождите или позовите друзей.</div>
          ) : (
            <ul className="space-y-1.5 max-h-[min(50vh,28rem)] overflow-y-auto pr-1">
              {others.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleChallenge(p)}
                    className={
                      isL2
                        ? "w-full text-left rounded-md px-2.5 py-2 border border-[#5c4a32]/45 bg-black/25 hover:border-[#c7ad80]/40 hover:bg-black/35 transition-colors disabled:opacity-50"
                        : "w-full text-left rounded px-2 py-2 border border-amber-900/40 bg-black/20 hover:bg-amber-900/15 disabled:opacity-50"
                    }
                  >
                    <span className={isL2 ? "text-[#e8c56e] font-medium" : "text-amber-200 font-medium"}>{p.name}</span>
                    <span className={isL2 ? "text-[#8a7a60] text-[11px] ml-2" : "text-gray-500 text-xs ml-2"}>
                      {p.level} ур. · атаковать
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
