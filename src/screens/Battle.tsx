// src/screens/Battle.tsx
import React from "react";
import { useBattleStore } from "../state/battle/store";
import { useCharacterStore } from "../state/characterStore";
import { useHeroStore, setResurrectInProgress } from "../state/heroStore";
import { isHeroDead } from "../state/heroStore/isHeroDead";
import { resurrectCharacter } from "../utils/api";
import { findZoneWithCity } from "./battle/battleUtils";
import { SkillBar } from "./battle/SkillBar";
import { BattleLog } from "./battle/BattleLog";
import { BattlePanel } from "./battle/BattlePanel";
import { isMobOnRespawn } from "../state/battle/mobRespawns";
import { getMobEffectiveMaxHp } from "../utils/mobs/mobEffectiveMaxHp";
import { getCityUiVariant } from "../utils/cityUiVariant";
import { displayMobName } from "../utils/worldDisplay";
import { useGameSettingsVersion } from "../hooks/useGameSettingsVersion";
import { clearDeathGate } from "../utils/deathGate";
import { formatLootIntEn } from "../state/battle/helpers/victoryLootLogLines";

type Navigate = (path: string) => void;

interface BattleProps {
  navigate: Navigate;
}

export default function Battle({ navigate }: BattleProps) {
  useGameSettingsVersion();
  // navigate() робить full reload — URL не змінюється під час сесії, тому читаємо один раз (без полінгу)
  const urlParams = React.useMemo(() => new URLSearchParams(typeof window !== "undefined" ? location.search : ""), []);
  
  const zoneId = urlParams.get("zone") || "";
  const mobIndexStr = urlParams.get("idx") || "";
  const mobIndex = Number.isFinite(Number(mobIndexStr)) ? Number(mobIndexStr) : -1;

  const {
    startBattle,
    processMobAttack,
    regenTick,
    status,
    mob,
    mobHP,
    zoneId: battleZoneId,
    mobIndex: battleMobIndex,
    heroBuffs,
    reset,
    lastReward,
    log,
    lastMobDamage,
  } = useBattleStore();

  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const characterId = useCharacterStore((s) => s.characterId);
  const dead = hero ? isHeroDead(hero) : false;
  const [resurrecting, setResurrecting] = React.useState(false);
  const [now, setNow] = React.useState(Date.now());
  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

  const handleResurrectToCity = async () => {
    if (!characterId || !hero || resurrecting) return;
    setResurrecting(true);
    setResurrectInProgress(true);
    try {
      const char = await resurrectCharacter(characterId, 0.7);
      const hj = (char as any)?.heroJson;
      if (hero?.name) clearDeathGate(characterId, hero.name);
      if (hj) {
        updateHero({
          hp: Number(hj.hp) || 1,
          mp: Number(hj.mp) ?? 0,
          cp: Number(hj.cp) ?? 0,
          heroJson: {
            ...(hero as any)?.heroJson,
            ...hj,
            isDead: false,
            deadAt: 0,
            killedByMobName: undefined,
            killedByMobDamage: undefined,
            heroBuffs: [],
          } as any,
        });
      }
      reset();
      navigate("/city");
    } catch (e) {
      console.warn("[Battle] resurrect to city failed", e);
    } finally {
      setResurrectInProgress(false);
      setResurrecting(false);
    }
  };
  const found = React.useMemo(() => (zoneId ? findZoneWithCity(zoneId) : undefined), [zoneId]);

  // Рибалка тепер окрема сторінка — редірект зі старого посилання
  React.useEffect(() => {
    if (zoneId === "fishing") navigate("/fishing");
  }, [zoneId, navigate]);

  const lineGold = "border-t border-[#c7ad80]/80";
  const lineGoldThick = "border-t-2 border-[#c7ad80]";
  const pad = "px-3";
  const dividerGold = <div className="border-t-2 border-[#c7ad80]/80 mt-2" />;
  const boxBlue =
    "rounded-lg border-2 border-[#4aa3ff]/70 bg-black/25 shadow-[inset_0_0_12px_rgba(74,163,255,0.18)] overflow-hidden";
  const boxLog = isL2
    ? "rounded-lg border border-[#5c4a32]/70 bg-black/35 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] overflow-hidden"
    : boxBlue;
  const vLine = isL2 ? "border-t border-[#c7ad80]/25" : lineGold;
  const vDivider = isL2 ? (
    <div className="border-t border-[#c7ad80]/20 mt-2" />
  ) : (
    dividerGold
  );
  const btnGold =
    "w-full text-center text-[12px] py-2 rounded-lg " +
    "border border-[#c7ad80]/80 text-[#c7ad80] " +
    "bg-[#151311]/40 shadow-[inset_0_0_10px_rgba(199,173,128,0.10)] " +
    "hover:bg-[#2a2015] transition-colors";
  const btnGreen =
    "w-full text-center text-[12px] py-2 rounded-lg border border-[#3bd16f]/70 " +
    "text-[#3bd16f] hover:bg-[#102314] transition-colors";

  // Ініціалізація бою (hero?.name — щоб не тригерити ефект на кожне оновлення hero)
  const heroName = hero?.name;
  React.useEffect(() => {
    if (zoneId && mobIndex >= 0 && found) {
      if (!heroName) return;

      const isSameBattle = battleZoneId === zoneId && battleMobIndex === mobIndex;
      const hasError = status === "idle" && !mob;

      if (isSameBattle && hasError && heroName) {
        startBattle(zoneId, mobIndex);
        return;
      }
      if (isSameBattle && hasError) return;

      if (!isSameBattle || status === undefined) {
        startBattle(zoneId, mobIndex);
      }
    }
  }, [zoneId, mobIndex, found, battleZoneId, battleMobIndex, startBattle, status, mob, heroName]);

  const processMobAttackRef = React.useRef(processMobAttack);
  const regenTickRef = React.useRef(regenTick);
  React.useEffect(() => {
    processMobAttackRef.current = processMobAttack;
    regenTickRef.current = regenTick;
  }, [processMobAttack, regenTick]);

  // Таймер: атаки/нагороди кожні 250мс, реген раз на 1000мс
  const BATTLE_TICK_MS = 250;
  const REGEN_TICK_MS = 1000;
  React.useEffect(() => {
    const battleInterval = setInterval(() => {
      setNow(Date.now());
      if (useBattleStore.getState().status === "fighting") processMobAttackRef.current();
    }, BATTLE_TICK_MS);
    const regenInterval = setInterval(() => {
      if (useBattleStore.getState().status === "fighting") regenTickRef.current();
    }, REGEN_TICK_MS);
    return () => {
      clearInterval(battleInterval);
      clearInterval(regenInterval);
    };
  }, []);

  // Якщо зона або моб не знайдені
  if (!found || mobIndex < 0) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center px-4 py-10 text-[#d4c4a8]`
            : "text-white flex items-center justify-center px-4 py-8"
        }
      >
        <div className="space-y-3 max-w-[380px] text-center">
          <h1 className={isL2 ? "text-lg font-bold text-[#e8c56e]" : "text-xl font-bold"}>Помилка</h1>
          <p className={isL2 ? "text-sm text-[#a89878]" : "text-sm text-gray-300"}>
            Зона або моб не знайдені.
          </p>
          <button
            type="button"
            onClick={() => navigate("/location")}
            className={
              isL2
                ? "mt-3 px-5 py-2 rounded-md border border-[#5c4a32]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-sm text-[#c9a44c] hover:border-[#c7ad80]/50"
                : "mt-3 px-4 py-2 bg-yellow-600 rounded text-black"
            }
          >
            Повернутися в локацію
          </button>
        </div>
      </div>
    );
  }

  const { zone, city } = found;

  // SkillBar потребує hero — якщо hero ще не завантажений, показуємо завантаження
  if (!hero && mob) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center px-4 py-10 text-[#d4c4a8]`
            : "text-white flex items-center justify-center px-4 py-8"
        }
      >
        <div className="space-y-3 max-w-[380px] text-center">
          <div
            className={
              isL2
                ? "mx-auto w-6 h-6 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin"
                : "hidden"
            }
          />
          <h1 className={isL2 ? "text-lg font-semibold text-[#e8c56e]" : "text-xl font-bold"}>Завантаження...</h1>
          <p className={isL2 ? "text-sm text-[#8a7a60]" : "text-sm text-gray-300"}>Підготовка бою...</p>
        </div>
      </div>
    );
  }

  // Якщо моб не завантажений (але не при перемозі - там модалка показує нагороду)
  if (!mob && status !== "victory") {
    // Якщо є помилка в лозі (наприклад, немає удочки/наживки або моб на респавні)
    const errorMessage = log && log.length > 0 ? log[0] : null;
    if (status === "idle" && errorMessage) {
      // Визначаємо, куди повертатися: якщо це fishing зона - на риболовлю, інакше - в окрестность
      const isRespawnError = errorMessage.includes("ще не респавнувся");
      const isFishingZone = zoneId === "fishing";
      const returnPath = isFishingZone ? "/fishing" : `/location?id=${zoneId}`;
      const returnButtonText = isFishingZone ? "Повернутися до риболовлі" : "Повернутися в окрестность";
      
      return (
        <div
          className={
            isL2
              ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center px-4 py-10 text-[#d4c4a8]`
              : "text-white flex items-center justify-center px-4 py-8"
          }
        >
          <div className="space-y-3 max-w-[380px] text-center">
            <h1 className={isL2 ? "text-lg font-bold text-red-400" : "text-xl font-bold text-red-500"}>Помилка</h1>
            <p className={isL2 ? "text-sm text-[#a89878]" : "text-sm text-gray-300"}>{errorMessage}</p>
            <button
              type="button"
              onClick={() => navigate(returnPath)}
              className={
                isL2
                  ? "mt-3 px-5 py-2 rounded-md border border-[#5c4a32]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-sm text-[#c9a44c] hover:border-[#c7ad80]/50"
                  : "mt-3 px-4 py-2 bg-yellow-600 rounded text-black hover:bg-yellow-700"
              }
            >
              {returnButtonText}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center px-4 py-10 text-[#d4c4a8]`
            : "text-white flex items-center justify-center px-4 py-8"
        }
      >
        <div className="space-y-3 max-w-[380px] text-center">
          <div
            className={
              isL2
                ? "mx-auto w-6 h-6 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin"
                : "hidden"
            }
          />
          <h1 className={isL2 ? "text-lg font-semibold text-[#e8c56e]" : "text-xl font-bold"}>Завантаження...</h1>
          <p className={isL2 ? "text-sm text-[#8a7a60]" : "text-sm text-gray-300"}>Завантаження бою...</p>
        </div>
      </div>
    );
  }

  // Екран перемоги
  if (status === "victory" && lastReward && mob) {
    const handleHitNextMob = () => {
      if (zone && battleMobIndex !== undefined && zoneId) {
        const heroName = useHeroStore.getState().hero?.name;

        let nextMobIndex = battleMobIndex + 1;
        let foundNext = false;
        const maxAttempts = zone.mobs.length;
        let attempts = 0;

        while (nextMobIndex < zone.mobs.length && attempts < maxAttempts) {
          const nextMob = zone.mobs[nextMobIndex];
          const isRaidBoss = (nextMob as any).isRaidBoss === true;
          const onRespawn = isMobOnRespawn(zoneId, nextMobIndex, heroName);

          if (!isRaidBoss && !onRespawn) {
            foundNext = true;
            break;
          }

          nextMobIndex++;
          attempts++;
        }

        if (foundNext) {
          navigate(`/battle?zone=${zoneId}&idx=${nextMobIndex}`);
          setTimeout(() => {
            startBattle(zoneId, nextMobIndex);
          }, 100);
        } else {
          reset();
          navigate(`/location?id=${zone.id}`);
        }
      }
    };

    const handleContinueToLocation = () => {
      reset();
      navigate(`/location?id=${zone.id}`);
    };

    const victoryBannerL2 =
      "rounded-lg border border-[#7a6348]/55 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(199,173,128,0.14)_0%,transparent_55%),linear-gradient(165deg,#2a2318_0%,#14110c_45%,#0a0907_100%)] shadow-[inset_0_1px_0_rgba(255,235,200,0.07),0_8px_28px_rgba(0,0,0,0.55)] ring-1 ring-[#c7ad80]/15 overflow-hidden";
    const victoryBtnFight =
      "w-full text-center text-[12px] py-2.5 rounded-md border border-[#2d6b45]/70 bg-gradient-to-b from-[#1a2e1f] to-[#0c1610] text-[#a8e8b8] shadow-[inset_0_1px_0_rgba(120,200,140,0.12),0_4px_14px_rgba(0,0,0,0.45)] hover:border-[#3bd16f]/55 hover:text-[#d4ffd8] active:scale-[0.99] transition-[border-color,color,transform] duration-150";

    const heroDisplayName = ((hero?.name ?? "Герой").trim() || "Герой");
    const cardExp = formatLootIntEn(lastReward.exp);
    const cardSp = formatLootIntEn(lastReward.sp ?? 0);
    const cardAdena = formatLootIntEn(lastReward.adena);

    const vLootIcon = (src: string) => (
      <img
        src={src}
        alt=""
        className="inline-block w-3.5 h-3.5 opacity-95 align-[-0.15em] mx-0.5 shrink-0"
      />
    );

    const victoryContent = (
      <>
        {isL2 ? (
          <div className={`${victoryBannerL2} mb-3`}>
            <div className="h-[3px] bg-gradient-to-r from-transparent via-[#c7ad80]/50 to-transparent opacity-90" />
            <div className={`${pad} pt-3 pb-3 text-center`}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#a89878] mb-1">повержений</p>
              <p className="text-base font-semibold text-[#e85c5c] drop-shadow-[0_0_12px_rgba(232,92,92,0.35)]">
                <span>{displayMobName(mob.name)}</span>
                {mob.aggressivePatrol ? <span className="text-[#8b2020]"> (агр)</span> : null}
              </p>
              <p className="text-[11px] text-[#c9a46a] mt-0.5 tabular-nums">
                ур. <span className="text-[#f0d78c] font-medium">{mob.level}</span>
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 px-1">
                <span className="text-[#b89858] text-base leading-none select-none shrink-0" aria-hidden>
                  ⚔
                </span>
                <span className="text-[13px] font-bold text-[#3bd16f] tracking-wide leading-tight text-left">
                  ВЫ ПОБЕДИЛИ МОНСТРА!
                </span>
              </div>
              <div className="mt-3 max-w-md mx-auto text-left text-[13px] leading-snug text-[#eaeaea] space-y-2 px-1">
                <p>
                  <span>{heroDisplayName} получил </span>
                  <span className="inline text-[#86efac] font-medium whitespace-normal">
                    {vLootIcon("/victory/exp.png")}
                    <span className="tabular-nums">{cardExp}</span>
                    <span> EXP и </span>
                  </span>
                  <span className="inline text-[#ca8a04] font-medium whitespace-normal">
                    {vLootIcon("/victory/sp.png")}
                    <span className="tabular-nums">{cardSp}</span>
                    <span> SP</span>
                  </span>
                </p>
                <p>
                  <span className="text-[#d0c4b0]">Выпало:</span>{" "}
                  <span className="inline text-[#facc15] font-medium whitespace-normal">
                    {vLootIcon("/assets/adena.png")}
                    <span className="tabular-nums">{cardAdena}</span>
                    <span> аден, </span>
                  </span>
                  <span className="inline text-[#86efac] font-medium whitespace-normal">
                    {vLootIcon("/victory/exp.png")}
                    <span className="tabular-nums">{cardExp}</span>
                    <span> EXP и </span>
                  </span>
                  <span className="inline text-[#ca8a04] font-medium whitespace-normal">
                    {vLootIcon("/victory/sp.png")}
                    <span className="tabular-nums">{cardSp}</span>
                    <span> SP</span>
                  </span>
                </p>
              </div>
            </div>
            <div className="h-[2px] bg-gradient-to-r from-[#5c0a0a]/0 via-[#8b2020]/55 to-[#5c0a0a]/0" />
          </div>
        ) : (
          <>
            <div className={`${vLine} pt-2`}>
              <div className={`${pad} text-center text-lg font-semibold text-red-500`}>
                <span>{displayMobName(mob.name)}</span>
                {mob.aggressivePatrol ? <span className="text-[#5c0a0a]"> (агр)</span> : null}
                <span>, {mob.level} ур.</span>
              </div>
            </div>
            <div className={`${pad} mt-2 text-center`}>
              <p className="text-sm font-bold text-[#3bd16f] tracking-wide">ВЫ ПОБЕДИЛИ МОНСТРА!</p>
              <div className="mt-2 text-left max-w-md mx-auto text-[13px] text-[#e8e8e8] space-y-2">
                <p>
                  <span>{heroDisplayName} получил </span>
                  <span className="text-[#86efac] font-medium">
                    {vLootIcon("/victory/exp.png")}
                    {cardExp} EXP и{" "}
                  </span>
                  <span className="text-[#ca8a04] font-medium">
                    {vLootIcon("/victory/sp.png")}
                    {cardSp} SP
                  </span>
                </p>
                <p>
                  <span className="text-[#cfcfcf]">Выпало:</span>{" "}
                  <span className="text-[#facc15] font-medium">
                    {vLootIcon("/assets/adena.png")}
                    {cardAdena} аден,{" "}
                  </span>
                  <span className="text-[#86efac] font-medium">
                    {vLootIcon("/victory/exp.png")}
                    {cardExp} EXP и{" "}
                  </span>
                  <span className="text-[#ca8a04] font-medium">
                    {vLootIcon("/victory/sp.png")}
                    {cardSp} SP
                  </span>
                </p>
              </div>
            </div>
          </>
        )}

        <div className="px-3 mt-3">{vDivider}</div>

        {isL2 ? (
          <div className="mt-3 px-3 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleContinueToLocation}
              className={
                "w-full text-center text-[12px] py-2.5 rounded-md border border-[#6b5940]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] " +
                "text-[#e8c56e] shadow-[inset_0_1px_0_rgba(199,173,128,0.12),0_4px_14px_rgba(0,0,0,0.45)] " +
                "hover:border-[#c7ad80]/45 hover:text-[#fff2d8] active:scale-[0.99] transition-[border-color,color,transform] duration-150"
              }
            >
              Продолжить
            </button>
            <button type="button" onClick={handleHitNextMob} className={victoryBtnFight}>
              Бить следующего!
            </button>
          </div>
        ) : (
          <div className="mt-2 px-3 text-center text-[12px] space-y-2">
            <button
              type="button"
              onClick={handleContinueToLocation}
              className="w-full py-2 rounded-lg border border-[#c7ad80]/60 text-[#e8c56e] bg-black/30 hover:bg-black/45 transition-colors"
            >
              Продолжить
            </button>
            <button
              type="button"
              onClick={handleHitNextMob}
              className="w-full py-2 rounded-lg border border-[#3bd16f]/70 text-[#3bd16f] bg-[#07140b]/50 hover:bg-[#0a1f14] transition-colors"
            >
              Бить следующего!
            </button>
          </div>
        )}

        <div className="mt-4 px-3">
          <div
            className={
              isL2
                ? "text-[11px] uppercase tracking-[0.12em] text-[#d4b878] font-semibold mb-2 flex items-center gap-2"
                : "text-[12px] text-[#c7ad80] font-semibold mb-2"
            }
          >
            {isL2 && <span className="h-px flex-1 max-w-[48px] bg-gradient-to-r from-[#c7ad80]/50 to-transparent" />}
            Лог бою
            {isL2 && <span className="h-px flex-1 bg-gradient-to-l from-[#c7ad80]/50 to-transparent" />}
          </div>
          <div className={`${boxLog} w-full`}>
            <div className="px-3 py-2 text-[12px] leading-[1.35] text-[#d4c4a8]">
              <BattleLog noBorder maxLines={18} />
            </div>
          </div>
        </div>
      </>
    );
    return (
      <BattlePanel
        target={{
          name: displayMobName(mob.name),
          level: mob.level,
          currentHp: 0,
          maxHp: getMobEffectiveMaxHp(mob),
          isAggressivePatrol: mob.aggressivePatrol === true,
        }}
        buffs={[]}
        now={now}
        victoryContent={victoryContent}
        isL2={isL2}
      />
    );
  }

  const mobMaxHp = mob ? getMobEffectiveMaxHp(mob) : 1;
  const battleTarget = mob
    ? {
        name: displayMobName(mob.name),
        level: mob.level,
        currentHp: Number.isFinite(mobHP) ? mobHP : mobMaxHp,
        maxHp: mobMaxHp,
        isAggressivePatrol: mob.aggressivePatrol === true,
      }
    : { name: "", level: 1, currentHp: 0, maxHp: 1 };

  return (
    <BattlePanel
      target={battleTarget}
      buffs={heroBuffs || []}
      now={now}
      backLabel={dead ? (resurrecting ? "..." : "Телепортироваться в город") : "Повернутися в локацію"}
      showBackButton={status === "idle"}
      onBack={dead ? handleResurrectToCity : () => { reset(); navigate(`/location?id=${zone.id}`); }}
      isL2={isL2}
    >
      <SkillBar />
    </BattlePanel>
  );
}
