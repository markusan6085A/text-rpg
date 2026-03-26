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
  type TvtDailySlot,
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
      return "до регистрации";
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

/** Часове вікно «бой» без реального матчу на сервері — не показуємо «іде бій». */
function uiPhaseLabel(phase: TvtPhase, hasActiveMatch: boolean, myMatchActive: boolean): string {
  if (phase === "battle" && !hasActiveMatch && !myMatchActive) {
    return "нет матча";
  }
  return phaseLabelRu(phase);
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

  /** Тік 1 с — оновлення інтерполяції хвилини між serverNow і Date.now() (лише зміщення від знімка сервера). */
  const [clockTick, setClockTick] = useState(0);
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
    const t = setInterval(() => setClockTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void loadState();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loadState]);

  /** Свіжий знімок часу з сервера (хвилини/фази без довгого дрейфу). */
  useEffect(() => {
    const iv = setInterval(() => void loadState(), 30_000);
    return () => clearInterval(iv);
  }, [loadState]);

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

  /**
   * Хвилини доби тільки з сервера: GET /characters/tvt/state (serverMinutesSinceMidnight + зміщення по serverNow).
   * Без локального часу ПК — поки немає відповіді, null.
   */
  const gameMinutesNow = useMemo((): number | null => {
    const s = tvtState;
    if (
      s != null &&
      typeof s.serverMinutesSinceMidnight === "number" &&
      Number.isFinite(s.serverNow)
    ) {
      const elapsedMin = Math.floor((Date.now() - s.serverNow) / 60_000);
      const x = s.serverMinutesSinceMidnight + elapsedMin;
      return ((Math.floor(x) % 1440) + 1440) % 1440;
    }
    return null;
  }, [clockTick, tvtState?.serverMinutesSinceMidnight, tvtState?.serverNow]);

  /** Слоти з GET /tvt/state — той самий розклад, що перевіряє POST /register (не статичний бандл). */
  const slotsForUi = useMemo((): TvtDailySlot[] => {
    const s = tvtState?.slots;
    if (Array.isArray(s) && s.length > 0) {
      return s.map((x) => ({
        id: x.id,
        label: x.label,
        registrationOpen: x.registrationOpen,
        battleStart: x.battleStart,
      }));
    }
    return TVT_DAILY_SLOTS;
  }, [tvtState?.slots]);

  const slotStatuses = useMemo(
    () =>
      gameMinutesNow == null
        ? []
        : slotsForUi.map((s) => getSlotStatusFromMinutes(gameMinutesNow, s)),
    [gameMinutesNow, slotsForUi]
  );

  const handleRegister = useCallback(
    async (slotId: string) => {
      if (!cid) return;
      setBusy(true);
      try {
        await registerTvt(cid, slotId);
        await loadState();
      } catch (e: any) {
        const raw = String((e?.body as { error?: string } | undefined)?.error ?? e?.message ?? "");
        const s0 = slotsForUi[0];
        if (
          s0 &&
          (raw.toLowerCase().includes("registration is closed") || raw.toLowerCase().includes("closed for this slot"))
        ) {
          const clock =
            gameMinutesNow == null ? "—" : formatMinutesAsClock(gameMinutesNow);
          setTvtErr(
            `Регистрация закрыта: сейчас ${clock} (время с сервера). Окно записи — ${formatHM(s0.registrationOpen)}–${formatHM(s0.battleStart)}. Если окно в интерфейсе не совпадает с API — обновите страницу (слоты с сервера).`
          );
        } else if (raw.toLowerCase().includes("must be online")) {
          setTvtErr(
            "Нужна активность персонажа в игре (онлайн ~10 мин). Откройте игру тем же аккаунтом и подождите heartbeat — без этого запись TvT не проходит (и для админа тоже)."
          );
        } else {
          setTvtErr(raw.trim() || "Не удалось записаться");
        }
      } finally {
        setBusy(false);
      }
    },
    [cid, gameMinutesNow, loadState, slotsForUi]
  );

  const myRegSlotId = tvtState?.myRegistration?.slotId;
  const regs = tvtState?.registrationsBySlot ?? {};
  const dailyRegCount = typeof regs["daily"] === "number" ? regs["daily"] : 0;
  const hasActiveMatch = Boolean(tvtState?.hasActiveMatch);
  const myMatchActive = tvtState?.myMatch?.status === "active";
  const showRealBattle = hasActiveMatch || myMatchActive;

  const inBattleTimeWindow = useMemo(
    () => slotStatuses.some((s) => s.phase === "battle"),
    [slotStatuses]
  );

  useEffect(() => {
    const st0 = slotsForUi[0];
    if (!st0 || gameMinutesNow == null) return;
    const st = getSlotStatusFromMinutes(gameMinutesNow, st0);
    if (st.phase !== "battle" || showRealBattle || dailyRegCount < 2) return;
    const iv = setInterval(() => void loadState(), 5_000);
    return () => clearInterval(iv);
  }, [gameMinutesNow, showRealBattle, dailyRegCount, loadState, slotsForUi]);

  /** Перехід у бій лише якщо є реальний матч на сервері або ти вже в матчі. */
  useEffect(() => {
    if (!cid || !hero) return;
    const needArenaPoll = myMatchActive || (hasActiveMatch && inBattleTimeWindow);
    if (!needArenaPoll) return;
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
    const iv = setInterval(tick, 30_000);
    return () => clearInterval(iv);
  }, [cid, hero, navigate, tvtState?.myMatch?.status, hasActiveMatch, inBattleTimeWindow]);

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
        Две команды. Во время матча откройте «Поле боя»: список ников своей команды и противников — любой атакует любого врага. Побеждает команда, выбившая соперников (или по таймауту 15 мин).
      </p>

      <div className="mt-3 px-2 flex flex-wrap gap-2">
        <button type="button" className={rowBtn} onClick={() => navigate("/tvt-shop")}>
          <span className="text-[#e8c56e] font-semibold">TvT магазин</span>
        </button>
      </div>

      <div className="mt-5 px-2">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className={isL2 ? "text-[11px] uppercase tracking-[0.12em] text-[#c9a44c]" : "text-amber-300 text-sm"}>
            Расписание
          </div>
          <button
            type="button"
            onClick={() => void loadState()}
            disabled={busy}
            className={
              isL2
                ? "text-[11px] px-2 py-1 rounded border border-[#5c4a32]/60 text-[#c9a44c] hover:border-[#c7ad80]/40 disabled:opacity-40"
                : "text-xs px-2 py-1 rounded border border-gray-600 text-amber-300 disabled:opacity-40"
            }
          >
            Обновить
          </button>
        </div>
        <p className={isL2 ? "text-[11px] text-[#a89878] mb-2" : "text-xs text-gray-500 mb-2"}>
          Игровое время{" "}
          <span className="text-[#e8c56e] font-semibold">
            {gameMinutesNow == null ? "…" : formatMinutesAsClock(gameMinutesNow)}
          </span>
          <span className="text-[#6a5c48]"> (с сервера)</span>
          {slotsForUi[0] ? (
            <>
              {" · "}
              регистрация {formatHM(slotsForUi[0].registrationOpen)} — старт {formatHM(slotsForUi[0].battleStart)}
            </>
          ) : null}
        </p>
        {slotsForUi[0] ? (
          <p className={isL2 ? "text-[11px] text-[#8a7a60] mb-2 leading-snug" : "text-xs text-gray-500 mb-2"}>
            Запись только с {formatHM(slotsForUi[0].registrationOpen)} до {formatHM(slotsForUi[0].battleStart)} (5 минут в сутки, игровое время).
          </p>
        ) : null}
        {gameMinutesNow == null && !tvtErr ? (
          <p className={isL2 ? "text-[11px] text-[#8a7a60] mb-2" : "text-xs text-gray-500 mb-2"}>
            Загрузка времени с сервера…
          </p>
        ) : null}
        <div className="space-y-2">
          {slotStatuses.map((st) => {
            const raw = regs[st.slot.id] as number | string[] | undefined;
            const count = typeof raw === "number" ? raw : Array.isArray(raw) ? raw.length : 0;
            const phaseUi = uiPhaseLabel(st.phase, hasActiveMatch, myMatchActive);
            const fakeBattleUi = st.phase === "battle" && !showRealBattle;
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
                        : st.phase === "battle" && !fakeBattleUi
                          ? "text-[#d4786a] text-[11px]"
                          : "text-[#8a7a60] text-[11px]"
                    }
                  >
                    {phaseUi}
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
                {cid && st.phase === "idle" && st.minutesUntilRegistration != null && (
                  <button
                    type="button"
                    disabled
                    className={
                      isL2
                        ? "mt-2 w-full py-1.5 rounded border border-[#5c4a32]/40 text-[11px] text-[#8a7a60] opacity-80 cursor-not-allowed"
                        : "mt-2 w-full py-1.5 rounded bg-gray-800 text-xs text-gray-500 cursor-not-allowed"
                    }
                  >
                    Запись с {formatHM(st.slot.registrationOpen)} (ещё не время)
                  </button>
                )}
                {cid && st.phase === "battle" && !showRealBattle && (
                  <button
                    type="button"
                    disabled
                    className={
                      isL2
                        ? "mt-2 w-full py-1.5 rounded border border-[#5c4a32]/40 text-[11px] text-[#8a7a60] opacity-80 cursor-not-allowed"
                        : "mt-2 w-full py-1.5 rounded bg-gray-800 text-xs text-gray-500 cursor-not-allowed"
                    }
                  >
                    {count >= 2
                      ? "Ожидание старта на сервере — нажмите «Обновить» или подождите (обновление каждые 5 с)."
                      : "Матч не начался (мало участников или не записались)"}
                  </button>
                )}
                {cid && st.phase === "battle" && showRealBattle && (
                  <button
                    type="button"
                    disabled
                    className={
                      isL2
                        ? "mt-2 w-full py-1.5 rounded border border-[#5c4a32]/40 text-[11px] text-[#8a7a60] opacity-80 cursor-not-allowed"
                        : "mt-2 w-full py-1.5 rounded bg-gray-800 text-xs text-gray-500 cursor-not-allowed"
                    }
                  >
                    Регистрация закрыта (идёт бой)
                  </button>
                )}
                {cid && st.phase === "ended" && (
                  <button
                    type="button"
                    disabled
                    className={
                      isL2
                        ? "mt-2 w-full py-1.5 rounded border border-[#5c4a32]/40 text-[11px] text-[#8a7a60] opacity-80 cursor-not-allowed"
                        : "mt-2 w-full py-1.5 rounded bg-gray-800 text-xs text-gray-500 cursor-not-allowed"
                    }
                  >
                    Регистрация закрыта
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
            В очереди A: {tvtState.myMatch.queueALen}, B: {tvtState.myMatch.queueBLen}. Откройте поле боя — там ники команд и атака по нику противника.
          </div>
          <button
            type="button"
            onClick={() => navigate("/tvt-match")}
            className={
              isL2
                ? "mt-3 w-full py-2 rounded-md border border-[#c9a44c]/55 bg-[#2a2218]/90 text-[12px] text-[#f0d78c] font-semibold hover:brightness-110"
                : "mt-3 w-full py-2 rounded bg-amber-700/40 text-white text-sm font-semibold"
            }
          >
            Поле боя (ники команд)
          </button>
        </div>
      )}

      <div className="mt-6 px-2">
        <div className={isL2 ? "text-[11px] uppercase tracking-[0.12em] text-[#c9a44c] mb-2" : "text-amber-300 text-sm mb-2"}>
          Награда за победу команды (Coin of Luck — баланс персонажа; TvT монеты — в инвентаре)
        </div>
        <div
          className={
            isL2
              ? "flex flex-wrap items-center gap-2 rounded-md border border-[#5c4a32]/40 bg-black/20 px-2 py-2"
              : "flex flex-wrap gap-2 rounded border border-gray-700 px-2 py-2"
          }
        >
          <div className="flex items-center gap-1">
            <img src={COIN_OF_LUCK_ICON} alt="" className="w-4 h-4 object-contain" />
            <span className="text-[#f0d78c] font-semibold text-[10px]">×{TVT_REWARD_COIN_OF_LUCK}</span>
            <span className="text-[9px] text-[#8a7a60]">Coin of Luck</span>
          </div>
          <div className="flex items-center gap-1">
            <img src={TVT_COIN_ICON} alt="" className="w-4 h-4 object-contain" />
            <span className="text-[#e8c56e] font-semibold text-[10px]">×{TVT_REWARD_TVT_COINS}</span>
            <span className="text-[9px] text-[#8a7a60]">TvT монеты</span>
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
              {slotsForUi.find((s) => s.id === myRegSlotId)?.label ?? myRegSlotId}
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
