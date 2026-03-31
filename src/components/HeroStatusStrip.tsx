import React, { useMemo } from "react";
import { useHeroStore } from "../state/heroStore";
import { useBattleStore } from "../state/battle/store";
import { useCityUiVariant } from "../utils/cityUiVariant";
import { getHeroResourceValues } from "../utils/heroBuffedResources";
import { getExpToNext, MAX_LEVEL } from "../data/expTable";
import HeroResourceBars from "./HeroResourceBars";
import SummonStatus from "./SummonStatus";

type HeroStatusStripProps = {
  /** Не показувати під час екрана смерті / блокування */
  hidden?: boolean;
};

/**
 * Нік, рівень, CP/HP/MP — одна логіка з `getHeroResourceValues` на всіх екранах Layout.
 */
export default function HeroStatusStrip({ hidden = false }: HeroStatusStripProps) {
  const hero = useHeroStore((s) => s.hero);
  const battleStatus = useBattleStore((s) => s.status);
  const inBattle = battleStatus !== "idle";
  const cityUi = useCityUiVariant();
  const isGoldL2Hud = cityUi === "l2";
  const isTestProfileHud = cityUi === "l2test";

  const resBars = useMemo(
    () => (hero ? getHeroResourceValues(hero, inBattle) : null),
    [hero, inBattle, hero?.hp, hero?.mp, hero?.cp, hero?.maxHp, hero?.maxMp, hero?.maxCp],
  );

  const expForBar = useMemo(() => {
    if (!hero) return { cur: 0, max: 1 };
    const level = Number(hero.level ?? 1) || 1;
    const expCurrent = Math.max(0, Math.floor(Number(hero.exp ?? 0) || 0));
    const expNeedRaw = getExpToNext(level);
    const expMax = level >= MAX_LEVEL ? 1 : Math.max(1, expNeedRaw);
    const cur = level >= MAX_LEVEL ? 0 : expCurrent;
    return { cur, max: expMax };
  }, [hero, hero?.level, hero?.exp]);

  if (hidden || !hero || !resBars) return null;

  const nickname = hero.name || "";
  const level = hero.level ?? 1;
  const lowHp = resBars.maxHp > 0 && resBars.hp / resBars.maxHp < 0.3;

  if (isGoldL2Hud) {
    return (
      <div
        className="w-full max-w-[420px] mx-auto mb-2 rounded-lg border border-[#b59a72]/40 bg-gradient-to-b from-[#221c14] via-[#15120e] to-[#0c0a08] shadow-[inset_0_1px_0_rgba(212,175,108,0.14),0_10px_36px_rgba(0,0,0,0.5),0_0_24px_rgba(184,134,11,0.12)] p-3 text-[#e8dcc8]"
        aria-label="Ресурси персонажа"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <span className="text-[13px] font-bold text-[#f4ebd9] [text-shadow:0_2px_5px_rgba(0,0,0,0.92)] truncate max-w-[68%]">
            {nickname}
          </span>
          <span className="text-[12px] text-[#e8c56e] font-semibold tabular-nums whitespace-nowrap">
            {level} ур.
          </span>
        </div>
        <div className="mt-2.5">
          <HeroResourceBars
            hp={resBars.hp}
            maxHp={resBars.maxHp}
            mp={resBars.mp}
            maxMp={resBars.maxMp}
            cp={resBars.cp}
            maxCp={resBars.maxCp}
            expCurrent={expForBar.cur}
            expMax={expForBar.max}
            showExp
            expGray
            premiumShine
            lowHpPulse={lowHp}
          />
        </div>
        <SummonStatus />
      </div>
    );
  }

  if (isTestProfileHud) {
    return (
      <div
        className="w-full max-w-[420px] mx-auto mb-2 rounded-2xl border border-cyan-950/45 bg-[linear-gradient(180deg,#0a101a_0%,#030712_52%,#000000_100%)] p-3 text-slate-200 shadow-[inset_0_1px_0_rgba(94,234,212,0.1),inset_0_-8px_22px_rgba(0,0,0,0.5),0_10px_28px_rgba(0,0,0,0.82),0_0_0_1px_rgba(0,0,0,0.65)]"
        aria-label="Ресурси персонажа"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <span className="text-[13px] font-bold text-cyan-100/90 truncate max-w-[68%] drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
            {nickname}
          </span>
          <span className="text-[12px] text-violet-300/85 font-semibold tabular-nums whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
            {level} ур.
          </span>
        </div>
        <div className="mt-2.5">
          <HeroResourceBars
            hp={resBars.hp}
            maxHp={resBars.maxHp}
            mp={resBars.mp}
            maxMp={resBars.maxMp}
            cp={resBars.cp}
            maxCp={resBars.maxCp}
            expCurrent={expForBar.cur}
            expMax={expForBar.max}
            showExp
            expGray
            profileTest
            lowHpPulse={lowHp}
          />
        </div>
        <SummonStatus />
      </div>
    );
  }

  return (
    <div
      className="w-full mb-2 rounded-md border border-[#6b5b3f]/70 bg-[#1a1814]/90 px-2.5 py-2 text-[#d6c29a]"
      aria-label="Ресурси персонажа"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 mb-2">
        <span className="text-[12px] font-semibold text-orange-300 truncate max-w-[70%]">{nickname}</span>
        <span className="text-[11px] text-[#c7ad80] tabular-nums whitespace-nowrap">{level} ур.</span>
      </div>
      <HeroResourceBars
        hp={resBars.hp}
        maxHp={resBars.maxHp}
        mp={resBars.mp}
        maxMp={resBars.maxMp}
        cp={resBars.cp}
        maxCp={resBars.maxCp}
        expCurrent={expForBar.cur}
        expMax={expForBar.max}
        showExp
        expGray
        lowHpPulse={lowHp}
        compact
      />
      <SummonStatus />
    </div>
  );
}
