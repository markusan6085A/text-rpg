import React, { useEffect, useRef, useState, useCallback } from "react";
import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import {
  joinArenaField,
  leaveArenaField,
  getArenaField,
  getArenaActiveSession,
  arenaChallenge,
  getArenaLeaderboard,
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
import { getNickColorStyle, isAdminNickName, ADMIN_NICK_CLASS } from "../../utils/nickColor";

interface ArenaLobbyProps {
  navigate: (path: string) => void;
}

const POLL_MS = 2500;
const ACTIVE_SESSION_POLL_MS = 2000;

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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeSessPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeArenaRef = useRef<string | null>(null);

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

  const stopActiveSessPoll = () => {
    if (activeSessPollRef.current) {
      clearInterval(activeSessPollRef.current);
      activeSessPollRef.current = null;
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
      stopActiveSessPoll();
      void leaveArenaField().catch(() => {});
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

  const goMatch = useCallback(
    (sessionId: string) => {
      stopPoll();
      stopActiveSessPoll();
      setOnField(false);
      navigate(`/arena/match?session=${encodeURIComponent(sessionId)}`);
    },
    [navigate]
  );

  /** Защитник: как только кто-то начал бой — сами переходим в матч (без кнопки «принять»). */
  useEffect(() => {
    if (!cid || !hero) {
      stopActiveSessPoll();
      activeArenaRef.current = null;
      return;
    }
    const tick = async () => {
      try {
        const r = await getArenaActiveSession(cid);
        const sid = r.sessionId?.trim();
        if (!sid) {
          activeArenaRef.current = null;
          return;
        }
        if (activeArenaRef.current === sid) return;
        activeArenaRef.current = sid;
        goMatch(sid);
      } catch {
        /* ignore */
      }
    };
    tick();
    stopActiveSessPoll();
    activeSessPollRef.current = setInterval(tick, ACTIVE_SESSION_POLL_MS);
    return () => stopActiveSessPoll();
  }, [cid, hero?.id, goMatch]);

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
          Поле боя: на нём могут быть десятки игроков. Войдите на поле — увидите остальных. Кнопка «атаковать» у ника —
          сразу начинается бой; второй игрок подключается сам. Ушли с арены или сбежали из боя — вас нельзя атаковать, у
          соперника в логе: «… сбежал». Разница уровней до 20.
        </p>
      </div>

      <div className={`mx-2 mb-2 p-2 ${arenaPanel()}`}>
        {err && (
          <div className={`mb-2 text-center text-[12px] ${isL2 ? "text-[#d4786a]" : "text-red-400"}`}>{err}</div>
        )}
        {!onField ? (
          <button type="button" disabled={busy || !cid} className={arenaPrimaryBtn()} onClick={handleEnterField}>
            {busy ? "…" : "Войти!"}
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
        <div className={`mx-2 mb-2 p-2 ${arenaPanel()}`}>
          <div
            className={
              isL2 ? "text-[11px] font-semibold text-[#c9a44c] mb-1.5" : "text-xs font-semibold text-amber-200 mb-1.5"
            }
          >
            Игроки на поле
          </div>
          {others.length === 0 ? (
            <div className={arenaSub()}>Пока никого кроме вас — подождите или позовите друзей.</div>
          ) : (
            <ul className="space-y-1 max-h-[min(50vh,28rem)] overflow-y-auto pr-0.5">
              {others.map((p) => (
                <li
                  key={p.id}
                  className={
                    isL2
                      ? "flex items-center gap-2 rounded-md px-2 py-1 border border-[#5c4a32]/40 bg-black/20"
                      : "flex items-center gap-2 rounded px-2 py-1 border border-amber-900/35 bg-black/15"
                  }
                >
                  <div className="min-w-0 flex-1 flex items-baseline gap-1.5 flex-wrap">
                    <span
                      className={`truncate text-[12px] font-medium ${isAdminNickName(p.name) ? ADMIN_NICK_CLASS : ""}`}
                      style={getNickColorStyle(p.name, hero, p.nickColor, p.sevenSealsRank ?? null)}
                    >
                      {p.name}
                    </span>
                    <span className={isL2 ? "text-[#8a7a60] text-[11px] shrink-0" : "text-gray-500 text-[11px] shrink-0"}>
                      {p.level} ур.
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleChallenge(p)}
                    className="shrink-0 px-2 py-0.5 rounded border border-[#7f1d1d] bg-[#b91c1c] text-[10px] font-bold text-white hover:bg-[#dc2626] active:bg-[#991b1b] disabled:opacity-45 disabled:pointer-events-none shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  >
                    атаковать
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className={`mx-2 mb-2 p-2 ${arenaPanel()}`}>
        <div className={isL2 ? "text-[11px] font-semibold text-[#c9a44c] mb-1.5" : "text-xs font-semibold text-amber-200 mb-1.5"}>
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
