import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getCityUiVariant } from "../../utils/cityUiVariant";
import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import {
  TVT_DAILY_SLOTS,
  formatHM,
  formatMinutesAsClock,
  formatSlotSchedule,
  getSlotStatusFromMinutes,
  minutesSinceMidnightFromDate,
  type TvtPhase,
} from "./tvtSchedule";
import { COIN_OF_LUCK_ICON, TVT_COIN_ICON, TVT_REWARD_COIN_OF_LUCK, TVT_REWARD_TVT_COINS } from "./tvtRewards";
import { getTvtState, registerTvt, unregisterTvt, getArenaActiveSession, type TvtStateResponse } from "../../utils/api";

type Props = {
  navigate: (path: string) => void;
};

function phaseLabelRu(phase: TvtPhase): string {
  switch (phase) {
    case "idle":
      return "ожидание";
    case "registration":
      return "регистрация";
    case "battle":
      return "бой";
    case "ended":
      return "завершено";
    default:
      return phase;
  }
}

function formatTvtLoadError(e: unknown): string {
  const msg = e && typeof e === "object" && "message" in e ? String((e as { message?: string }).message) : "";
  const lower = msg.toLowerCase();
  if (!msg.trim()) return "Ошибка TvT";
  if (lower.includes("not found") || lower.includes("404")) {
    return "TvT недоступен: проверьте сервер и вход в аккаунт.";
  }
  return msg;
}

export default function TvtManagerScreen({ navigate }: Props) {
  const isL2 = getCityUiVariant() === "l2";
  const hero = useHeroStore((s) => s.hero);
  const characterId = useCharacterStore((s) => s.characterId);
  const cid = (characterId || hero?.id || "").trim();

  const [now, setNow] = useState(() => new Date());
  const [tvtState, setTvtState] = useState<TvtStateResponse | null>(null);
  const [tvtErr, setTvtErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadState = useCallback(async () => {
    try {
      const r = await getTvtState(cid?.trim() ? cid.trim() : undefined);
      setTvtState(r);
      setTvtErr(null);
    } catch (e: unknown) {
      setTvtErr(formatTvtLoadError(e));
    }
  }, [cid]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    void loadState();
    const iv = setInterval(() => void loadState(), 4000);
    return () => clearInterval(iv);
  }, [loadState]);

  /** Авто-перехід у бій TvT (той самий екран, що арена). */
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
    const iv = setInterval(tick, 2500);
    return () => clearInterval(iv);
  }, [cid, hero, navigate]);

  const handleRegister = async (slotId: string) => {
    if (!cid) return;
    setBusy(true);
    try {
      await registerTvt(cid, slotId);
      await loadState();
    } catch (e: any) {
      setTvtErr(e?.message || "Не удалось записаться");
    } finally {
      setBusy(false);
    }
  };

  const handleUnregister = async () => {
    if (!cid) return;
    setBusy(true);
    try {
      await unregisterTvt(cid);
      await loadState();
    } catch (e: any) {
      setTvtErr(e?.message || "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const rowBtn =
    "w-full rounded-md border border-[#5c4a32]/75 bg-gradient-to-b from-[#2e2619] to-[#14110c] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] px-3 py-2.5 text-left text-[13px] text-[#d4c4a8] hover:border-[#c7ad80]/50 hover:brightness-110 transition-all";

  /** Той самий «ігровий» час, що на сервері для TvT (з урахуванням зміщення після serverNow). */
  const effectiveServerMinutes = useMemo(() => {
    if (
      typeof tvtState?.serverMinutesSinceMidnight === "number" &&
      typeof tvtState?.serverNow === "number"
    ) {
      const elapsedMin = (Date.now() - tvtState.serverNow) / 60000;
      const m = tvtState.serverMinutesSinceMidnight + elapsedMin;
      return ((m % 1440) + 1440) % 1440;
    }
    return minutesSinceMidnightFromDate(now);
  }, [tvtState?.serverMinutesSinceMidnight, tvtState?.serverNow, now]);

  const slotStatuses = useMemo(
    () => TVT_DAILY_SLOTS.map((s) => getSlotStatusFromMinutes(effectiveServerMinutes, s)),
    [effectiveServerMinutes]
  );

  const myRegSlotId = tvtState?.myRegistration?.slotId;
  const regs = tvtState?.registrationsBySlot ?? {};

  return (
    <div className={isL2 ? `${l2Frame} w-full min-w-0 my-1 p-2 sm:p-3` : "w-full px-3 py-4"}>
      <div
        className={
          isL2
            ? "border-b border-[#5c4a32]/45 px-2 py-2 text-center text-[11px] text-[#e8c56e] tracking-[0.12em] uppercase"
            : "border-b border-black/50 pb-2 mb-3 text-center text-[#f4e2b8]"
        }
      >
        TvT менеджер
      </div>

      <p className={isL2 ? "mx-2 mt-3 text-[12px] text-[#a89878] leading-snug" : "mx-2 mt-3 text-sm text-gray-400"}>
        Участники делятся на две команды (любое число игроков). Побеждает команда, которая выбьет соперников.
      </p>

      <div className="mt-3 px-2 flex flex-wrap gap-2">
        <button type="button" className={rowBtn} onClick={() => navigate("/tvt-shop")}>
          <span className="text-[#e8c56e] font-semibold">TvT магазин</span>
          <span className="block text-[11px] text-[#8a7a60] mt-0.5">отдельная страница</span>
        </button>
      </div>

      <div className="mt-5 px-2">
        <div className={isL2 ? "text-[11px] uppercase tracking-[0.12em] text-[#c9a44c] mb-2" : "text-amber-300 text-sm mb-2"}>
          Расписание
        </div>
        <p className={isL2 ? "text-[11px] text-[#a89878] mb-2" : "text-xs text-gray-500 mb-2"}>
          Игровое время (сервер):{" "}
          <span className="text-[#e8c56e] font-semibold">{formatMinutesAsClock(effectiveServerMinutes)}</span>
          {TVT_DAILY_SLOTS[0] ? (
            <>
              {" · "}
              регистрация {formatHM(TVT_DAILY_SLOTS[0].registrationOpen)} — старт {formatHM(TVT_DAILY_SLOTS[0].battleStart)}
            </>
          ) : null}
        </p>
        <div className="space-y-2">
          {slotStatuses.map((st) => {
            const raw = regs[st.slot.id] as number | string[] | undefined;
            const count = typeof raw === "number" ? raw : Array.isArray(raw) ? raw.length : 0;
            return (
              <div
                key={st.slot.id}
                className={
                  isL2
                    ? "rounded-md border border-[#5c4a32]/50 bg-black/20 px-3 py-2 text-[12px] text-[#d4c4a8]"
                    : "rounded border border-gray-700 px-3 py-2 text-sm text-gray-300"
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[#e8c56e] font-semibold">{st.slot.label}</span>
                  <span
                    className={
                      st.phase === "registration"
                        ? "text-[#7d9b7a] text-[11px]"
                        : st.phase === "battle"
                          ? "text-[#d4786a] text-[11px]"
                          : "text-[#8a7a60] text-[11px]"
                    }
                  >
                    {phaseLabelRu(st.phase)}
                  </span>
                </div>
                <div className="text-[11px] text-[#a89878] mt-1">{formatSlotSchedule(st.slot)}</div>
                <div className="text-[11px] text-[#8a7a60] mt-1">Записалось: {count}</div>
                {cid && st.phase === "registration" && (
                  <button
                    type="button"
                    disabled={busy || Boolean(myRegSlotId)}
                    onClick={() => handleRegister(st.slot.id)}
                    className={
                      isL2
                        ? "mt-2 w-full py-1.5 rounded border border-[#5c4a32]/60 text-[11px] text-[#c9a44c] disabled:opacity-40"
                        : "mt-2 w-full py-1.5 rounded bg-gray-700 text-xs disabled:opacity-40"
                    }
                  >
                    {myRegSlotId === st.slot.id ? "Вы записаны" : myRegSlotId ? "Уже записаны" : "Записаться"}
                  </button>
                )}
                {!cid && st.phase === "registration" && (
                  <p className="mt-2 text-[11px] text-[#8a7a60]">Войдите в игру, чтобы записаться.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {tvtState?.myMatch && tvtState.myMatch.status === "active" && (
        <div
          className={
            isL2
              ? "mx-2 mt-4 rounded-md border border-[#c9a44c]/40 bg-[#1a1610]/80 px-3 py-2 text-[12px] text-[#e8dcc8]"
              : "mx-2 mt-4 rounded border border-amber-700/50 px-3 py-2 text-sm text-amber-100"
          }
        >
          <div className="font-semibold text-[#e8c56e] mb-1">Матч TvT</div>
          <div className="text-[11px] text-[#a89878]">
            Очередь A: {tvtState.myMatch.queueALen}, B: {tvtState.myMatch.queueBLen}. Откроется бой — перенаправит в окно боя.
          </div>
        </div>
      )}

      <div className="mt-6 px-2">
        <div className={isL2 ? "text-[11px] uppercase tracking-[0.12em] text-[#c9a44c] mb-2" : "text-amber-300 text-sm mb-2"}>
          Награда за победу команды
        </div>
        <div
          className={
            isL2
              ? "flex flex-wrap items-center gap-4 rounded-md border border-[#5c4a32]/40 bg-black/20 px-3 py-3"
              : "flex flex-wrap gap-4 rounded border border-gray-700 px-3 py-3"
          }
        >
          <div className="flex items-center gap-2">
            <img src={COIN_OF_LUCK_ICON} alt="" className="w-8 h-8 object-contain" />
            <span className="text-[#f0d78c] font-semibold">×{TVT_REWARD_COIN_OF_LUCK}</span>
            <span className="text-[11px] text-[#8a7a60]">Coin of Luck</span>
          </div>
          <div className="flex items-center gap-2">
            <img src={TVT_COIN_ICON} alt="" className="w-8 h-8 object-contain" />
            <span className="text-[#e8c56e] font-semibold">×{TVT_REWARD_TVT_COINS}</span>
            <span className="text-[11px] text-[#8a7a60]">TvT монеты</span>
          </div>
        </div>
      </div>

      <div className="mt-6 px-2">
        <div className={isL2 ? "text-[11px] uppercase tracking-[0.12em] text-[#c9a44c] mb-2" : "text-amber-300 text-sm mb-2"}>
          Ваша запись
        </div>
        {!hero || !cid ? (
          <p className="text-[#d4786a] text-[12px]">Войдите в игру.</p>
        ) : myRegSlotId ? (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[#7d9b7a] text-[12px]">
              {TVT_DAILY_SLOTS.find((s) => s.id === myRegSlotId)?.label ?? myRegSlotId}
            </span>
            <button
              type="button"
              onClick={handleUnregister}
              disabled={busy}
              className={isL2 ? "text-[11px] text-[#c9a44c] underline disabled:opacity-40" : "text-xs text-amber-400 underline"}
            >
              Снять запись
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-[#8a7a60]">Запись во время «регистрация» в расписании.</p>
        )}
        {tvtErr && <p className="mt-2 text-[11px] text-[#d4786a]">{tvtErr}</p>}
      </div>

      <div className="mt-8 flex flex-wrap gap-2 justify-center px-2 pb-2">
        <button
          type="button"
          onClick={() => navigate("/city")}
          className={
            isL2
              ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-[#1a1610]/80 text-[12px] text-[#c9a44c] hover:border-[#c7ad80]/35"
              : "px-4 py-2 rounded bg-gray-700 text-white text-sm"
          }
        >
          В город
        </button>
      </div>
    </div>
  );
}
