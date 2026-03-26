import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getCityUiVariant } from "../../utils/cityUiVariant";
import { useHeroStore } from "../../state/heroStore";
import { TVT_DAILY_SLOTS, formatSlotSchedule, getNextSlotHint, getSlotStatus, type TvtPhase } from "./tvtSchedule";
import { splitTvtTeams, teamModeLabel } from "./tvtTeamSplit";
import { COIN_OF_LUCK_ICON, TVT_COIN_ICON, TVT_REWARD_COIN_OF_LUCK, TVT_REWARD_TVT_COINS } from "./tvtRewards";
import {
  getTvtRegisteredParticipants,
  registerSelf,
  unregisterSelf,
} from "./tvtRegistrationStorage";
import type { TvtParticipant } from "./tvtTypes";
import { TvtNickLink } from "./TvtNickLink";

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
  const [now, setNow] = useState(() => new Date());
  const [registered, setRegistered] = useState<TvtParticipant[]>(() => getTvtRegisteredParticipants());
  const [exampleCount, setExampleCount] = useState<2 | 4 | 5>(5);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const refreshRegistered = useCallback(() => {
    setRegistered(getTvtRegisteredParticipants());
  }, []);

  const handleRegister = () => {
    if (!hero?.id || !hero.name) return;
    registerSelf({ id: String(hero.id), name: String(hero.name), level: hero.level });
    refreshRegistered();
  };

  const handleUnregister = () => {
    if (!hero?.id) return;
    unregisterSelf(String(hero.id));
    refreshRegistered();
  };

  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const rowBtn =
    "w-full rounded-md border border-[#5c4a32]/75 bg-gradient-to-b from-[#2e2619] to-[#14110c] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] px-3 py-2.5 text-left text-[13px] text-[#d4c4a8] hover:border-[#c7ad80]/50 hover:brightness-110 transition-all";

  const nextHint = useMemo(() => getNextSlotHint(now), [now]);
  const slotStatuses = useMemo(() => TVT_DAILY_SLOTS.map((s) => getSlotStatus(now, s)), [now]);

  const demoSplit = useMemo(() => splitTvtTeams(makeDemoParticipants(exampleCount)), [exampleCount]);
  const realSplit = useMemo(() => splitTvtTeams(registered), [registered]);

  const selfRegistered = hero?.id && registered.some((p) => p.id === String(hero.id));

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
            ? "mx-2 mt-3 rounded-md border border-[#d4786a]/45 bg-[#1a0f0c]/80 px-3 py-2.5 text-[12px] text-[#e8c8c4] leading-snug"
            : "mx-2 mt-3 rounded border border-red-900/60 bg-red-950/40 px-3 py-2.5 text-sm text-red-100"
        }
      >
        <span className="font-semibold text-[#f0a090]">Важно:</span> бой сейчас{" "}
        <span className="text-[#f0d0c8]">не запускается</span> — нет серверного матчмейкинга и боя TvT. Запись по времени — только{" "}
        <span className="underline decoration-[#d4786a]/60">в этом браузере</span> (демо), не создаёт матч на сервере. Расписание и фаза «бой» —{" "}
        <span className="text-[#c9a44c]">индикатор времени</span>, без реального события в игре.
      </div>

      <div className={isL2 ? "px-2 py-3 text-[12px] text-[#a89878] leading-snug space-y-2" : "text-gray-400 text-sm space-y-2"}>
        <p>
          Командный бой: цель — победить команду противника. Когда подключат сервер — появятся реальные матчи; пока здесь расписание,
          правила и предпросмотр составов.
        </p>
        <p className={isL2 ? "text-[#d4c4a8]" : "text-gray-300"}>
          <span className="text-[#e8c56e] font-semibold">Клик по нику противника</span> открывает профиль игрока — та же панель взаимодействия, что и на арене / PvP.
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
          Расписание (3 раза в день)
        </div>
        <div className="space-y-2">
          {slotStatuses.map((st) => (
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
            </div>
          ))}
        </div>
        {nextHint ? (
          <div className="mt-3 text-[12px] text-[#c9a44c]">{nextHint.message}</div>
        ) : (
          <div className="mt-3 text-[12px] text-[#8a7a60]">Сегодня все старты прошли — следующие бои завтра.</div>
        )}
      </div>

      <div className="mt-6 px-2">
        <div className={isL2 ? "text-[11px] uppercase tracking-[0.12em] text-[#c9a44c] mb-2" : "text-amber-300 text-sm mb-2"}>
          Награда за победу
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
          <li>5 игроков — 2×3 (союзники / противники)</li>
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
        <p className="mt-2 text-[11px] text-[#8a7a60]">Серые ники в примере — демо, без перехода в профиль.</p>
      </div>

      <div className="mt-6 px-2">
        <div className={isL2 ? "text-[11px] uppercase tracking-[0.12em] text-[#c9a44c] mb-2" : "text-amber-300 text-sm mb-2"}>
          Локальный список (не сервер)
        </div>
        <p className="text-[11px] text-[#8a7a60] mb-2">
          Кнопка ниже не ставит вас в очередь на сервере и не начинает бой. Она только сохраняет ник в памяти этой вкладки для предпросмотра
          состава. После подключения матчмейкинга список будет общий для всех игроков.
        </p>
        {!hero ? (
          <p className="text-[#d4786a] text-[12px]">Войдите в игру, чтобы записаться.</p>
        ) : selfRegistered ? (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[#7d9b7a] text-[12px]">Вы в списке: {hero.name}</span>
            <button
              type="button"
              onClick={handleUnregister}
              className={isL2 ? "text-[11px] text-[#c9a44c] underline" : "text-xs text-amber-400 underline"}
            >
              Отменить
            </button>
          </div>
        ) : (
          <button type="button" onClick={handleRegister} className={rowBtn}>
            <span className="text-[#e8c56e] font-semibold">Добавить себя в локальный список</span>
            <span className="block text-[11px] text-[#8a7a60] mt-0.5 font-normal">не серверная очередь, бой не стартует</span>
          </button>
        )}

        {registered.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] text-[#8a7a60] mb-1">Кто записался ({registered.length})</div>
            <ul className="text-[12px] text-[#d4c4a8] space-y-0.5">
              {registered.map((p) => (
                <li key={p.id}>
                  <TvtNickLink id={p.id} name={p.name} navigate={navigate} isL2={isL2} />
                  {p.level != null ? <span className="text-[#8a7a60]"> · {p.level} ур.</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {realSplit && registered.length >= 2 && (
          <div className="mt-4">
            <div className="text-[11px] text-[#e8c56e] mb-2">Текущий состав по списку</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] text-[#7d9b7a] mb-1">Команда A · {teamModeLabel(realSplit.mode)}</div>
                <ul className="space-y-1">
                  {realSplit.teamA.map((p) => (
                    <li key={p.id}>
                      <TvtNickLink id={p.id} name={p.name} navigate={navigate} isL2={isL2} />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[11px] text-[#d4786a] mb-1">Команда B</div>
                <ul className="space-y-1">
                  {realSplit.teamB.map((p) => (
                    <li key={p.id}>
                      <TvtNickLink id={p.id} name={p.name} navigate={navigate} isL2={isL2} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
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
