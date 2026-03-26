import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getCityUiVariant } from "../../utils/cityUiVariant";
import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import { TVT_DAILY_SLOTS, formatSlotSchedule, getNextSlotHint, getSlotStatus, type TvtPhase } from "./tvtSchedule";
import { splitTvtTeams, teamModeLabel } from "./tvtTeamSplit";
import { COIN_OF_LUCK_ICON, TVT_COIN_ICON, TVT_REWARD_COIN_OF_LUCK, TVT_REWARD_TVT_COINS } from "./tvtRewards";
import type { TvtParticipant } from "./tvtTypes";
import { TvtNickLink } from "./TvtNickLink";
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

function makeDemoParticipants(count: 2 | 4 | 5): TvtParticipant[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `demo-${count}-${i}`,
    name: `Игрок ${i + 1}`,
  }));
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
  const [exampleCount, setExampleCount] = useState<2 | 4 | 5>(5);

  const loadState = useCallback(async () => {
    if (!cid) return;
    try {
      const r = await getTvtState(cid);
      setTvtState(r);
      setTvtErr(null);
    } catch (e: any) {
      setTvtErr(e?.message || "Ошибка TvT");
    }
  }, [cid]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
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

  const nextHint = useMemo(() => getNextSlotHint(now), [now]);
  const slotStatuses = useMemo(() => TVT_DAILY_SLOTS.map((s) => getSlotStatus(now, s)), [now]);

  const demoSplit = useMemo(() => splitTvtTeams(makeDemoParticipants(exampleCount)), [exampleCount]);

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

      <div
        className={
          isL2
            ? "mx-2 mt-3 rounded-md border border-[#7d9b7a]/35 bg-black/25 px-3 py-2.5 text-[12px] text-[#d4c4a8] leading-snug"
            : "mx-2 mt-3 rounded border border-green-900/40 bg-green-950/20 px-3 py-2.5 text-sm text-gray-200"
        }
      >
        <span className="font-semibold text-[#7d9b7a]">Онлайн TvT:</span> запись на сервере по расписанию; в старт слота формируются команды и открывается бой (как арена). Победа — когда у соперников не осталось бойцов в очереди, либо по таймауту 15 минут (выигрывает команда с большей очередью).
      </div>

      <div className={isL2 ? "px-2 py-3 text-[12px] text-[#a89878] leading-snug space-y-2" : "text-gray-400 text-sm space-y-2"}>
        <p>
          Цель — уничтожить состав противника в серии дуэлей 1×1 (первый в команде A против первого в B, победитель остаётся / проигравший выбывает).
        </p>
        <p className={isL2 ? "text-[#d4c4a8]" : "text-gray-300"}>
          <span className="text-[#e8c56e] font-semibold">Клик по нику</span> в профиле противника — та же панель, что PvP/арена.
        </p>
      </div>

      <div className="mt-3 px-2 flex flex-wrap gap-2">
        <button type="button" className={rowBtn} onClick={() => navigate("/tvt-shop")}>
          <span className="text-[#e8c56e] font-semibold">TvT магазин</span>
          <span className="block text-[11px] text-[#8a7a60] mt-0.5">отдельная страница</span>
        </button>
      </div>

      <div className="mt-5 px-2">
        <div className={isL2 ? "text-[11px] uppercase tracking-[0.12em] text-[#c9a44c] mb-2" : "text-amber-300 text-sm mb-2"}>
          Расписание (1 раз в день)
        </div>
        <div className="space-y-2">
          {slotStatuses.map((st) => {
            const count = regs[st.slot.id]?.length ?? 0;
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
                    {myRegSlotId === st.slot.id ? "Вы записаны на этот слот" : myRegSlotId ? "Уже записаны на другой слот" : `Записаться на ${st.slot.label}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {nextHint ? (
          <div className="mt-3 text-[12px] text-[#c9a44c]">{nextHint.message}</div>
        ) : (
          <div className="mt-3 text-[12px] text-[#8a7a60]">Сегодня все старты прошли — следующие бои завтра.</div>
        )}
      </div>

      {tvtState?.myMatch && tvtState.myMatch.status === "active" && (
        <div
          className={
            isL2
              ? "mx-2 mt-4 rounded-md border border-[#c9a44c]/40 bg-[#1a1610]/80 px-3 py-2 text-[12px] text-[#e8dcc8]"
              : "mx-2 mt-4 rounded border border-amber-700/50 px-3 py-2 text-sm text-amber-100"
          }
        >
          <div className="font-semibold text-[#e8c56e] mb-1">Матч TvT идёт</div>
          <div className="text-[11px] text-[#a89878]">
            Очередь A: {tvtState.myMatch.queueALen}, B: {tvtState.myMatch.queueBLen}. Когда откроется бой — вас перенаправит в окно боя.
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
          Правила составов
        </div>
        <ul className={isL2 ? "text-[12px] text-[#d4c4a8] list-disc pl-5 space-y-1" : "text-sm text-gray-300 list-disc pl-5 space-y-1"}>
          <li>2 игрока — 1×1</li>
          <li>4 игрока — 2×2</li>
          <li>5 игроков — 2×3</li>
        </ul>
      </div>

      <div className="mt-6 px-2">
        <div className={isL2 ? "text-[11px] uppercase tracking-[0.12em] text-[#c9a44c] mb-2" : "text-amber-300 text-sm mb-2"}>
          Пример расстановки (демо)
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {([2, 4, 5] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setExampleCount(n)}
              className={
                exampleCount === n
                  ? isL2
                    ? "px-3 py-1 rounded text-[11px] border border-[#c7ad80]/50 bg-[#2a2418] text-[#e8c56e]"
                    : "px-3 py-1 rounded text-xs bg-amber-600 text-black"
                  : isL2
                    ? "px-3 py-1 rounded text-[11px] border border-[#5c4a32]/50 text-[#8a7a60] hover:text-[#c9a44c]"
                    : "px-3 py-1 rounded text-xs border border-gray-600 text-gray-400"
              }
            >
              {n} игроков
            </button>
          ))}
        </div>
        {demoSplit && (
          <div
            className={
              isL2
                ? "grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border border-[#5c4a32]/40 bg-black/15 p-3"
                : "grid grid-cols-1 sm:grid-cols-2 gap-3 rounded border border-gray-700 p-3"
            }
          >
            <div>
              <div className="text-[11px] text-[#7d9b7a] mb-1">Команда A · {teamModeLabel(demoSplit.mode)}</div>
              <ul className="space-y-1">
                {demoSplit.teamA.map((p) => (
                  <li key={p.id}>
                    <TvtNickLink id={p.id} name={p.name} navigate={navigate} isL2={isL2} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] text-[#d4786a] mb-1">Команда B</div>
              <ul className="space-y-1">
                {demoSplit.teamB.map((p) => (
                  <li key={p.id}>
                    <TvtNickLink id={p.id} name={p.name} navigate={navigate} isL2={isL2} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <p className="mt-2 text-[11px] text-[#8a7a60]">Серые ники в примере — демо.</p>
      </div>

      <div className="mt-6 px-2">
        <div className={isL2 ? "text-[11px] uppercase tracking-[0.12em] text-[#c9a44c] mb-2" : "text-amber-300 text-sm mb-2"}>
          Ваша запись (сервер)
        </div>
        {!hero || !cid ? (
          <p className="text-[#d4786a] text-[12px]">Войдите в игру.</p>
        ) : myRegSlotId ? (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[#7d9b7a] text-[12px]">
              Слот: {TVT_DAILY_SLOTS.find((s) => s.id === myRegSlotId)?.label ?? myRegSlotId}
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
          <p className="text-[11px] text-[#8a7a60]">Выберите слот во время фазы «регистрация» выше.</p>
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
