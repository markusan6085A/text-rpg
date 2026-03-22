import React, { useEffect } from "react";
import type { Character, PkSessionState } from "../../utils/api";
import type { Mob } from "../../data/world/types";
import { useHeroStore } from "../../state/heroStore";
import { useBattleStore } from "../../state/battle/store";
import { cleanupBuffs } from "../../state/battle/helpers";
import { loadBattle } from "../../state/battle/persist";
import { BattlePanel } from "../battle/BattlePanel";
import { getCityUiVariant } from "../../utils/cityUiVariant";
import { effectiveCharacterLevel } from "../../utils/effectiveCharacterLevel";
import { SkillBar } from "../battle/SkillBar";
import type { BattleBuff } from "../../state/battle/types";

interface PkProfileViewProps {
  character: Character;
  heroData: any;
  professionLabel: string;
  pkSession: PkSessionState | null;
  pkLoading: boolean;
  pkActing: boolean;
  pkError: string | null;
  now: number;
  serverTimeDrift?: number;
  onUseSkill: (skillId: number) => void;
  onAttack?: () => void;
  /** Повернутися до профілю (без PK) */
  onBack?: () => void;
  /** Текст кнопки під логом (після поразки — «В город» + воскресіння як у бою з мобами) */
  panelBackLabel?: string;
}

/** Мапимо defender (PK) у форму Mob для battle store — той самий вигляд і логіка відображення */
function defenderToMob(defender: PkSessionState["defender"], level: number): Mob {
  return {
    id: defender.id,
    name: defender.name,
    level,
    hp: Math.max(1, defender.maxHp ?? 1),
    mp: defender.maxMp ?? 0,
    pAtk: defender.pAtk ?? 0,
    mAtk: defender.mAtk ?? 0,
    pDef: defender.pDef ?? 0,
    mDef: defender.mDef ?? 0,
    exp: 0,
    adenaMin: 0,
    adenaMax: 0,
    dropChance: 0,
  };
}

export default function PkProfileView({
  character,
  heroData,
  professionLabel,
  pkSession,
  pkLoading,
  pkActing,
  pkError,
  now,
  serverTimeDrift = 0,
  onUseSkill,
  onAttack,
  onBack,
  panelBackLabel,
}: PkProfileViewProps) {
  const isL2 = getCityUiVariant() === "l2";
  const myHero = useHeroStore((s) => s.hero);
  const pkActorBuffsFromStore = useBattleStore((s) => s.pkActorBuffs);
  const nowTs = now || Date.now();
  const heroJson = ((myHero as any)?.heroJson || {}) as any;
  const savedBattle = myHero?.name ? loadBattle(myHero.name) : null;
  const savedBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], nowTs);
  const heroJsonBuffs = cleanupBuffs(Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [], nowTs);
  const pkActorBuffs = cleanupBuffs(pkActorBuffsFromStore || [], nowTs);
  const allBuffs = [...savedBuffs, ...heroJsonBuffs, ...pkActorBuffs];
  const uniqueBuffs = allBuffs.filter((buff, idx, self) =>
    idx === self.findIndex((b) =>
      (b.id && buff.id && b.id === buff.id) ||
      (!b.id && !buff.id && b.name === buff.name)
    )
  ) as BattleBuff[];

  // Синхронізуємо PK-сесію з battle store — той самий store, що й при бою з мобом (лог, відкати, HP цілі)
  useEffect(() => {
    if (!pkSession || !myHero?.id) return;
    const isAttacker = myHero.id === pkSession.attackerId;
    const targetFighter = isAttacker ? pkSession.defender : pkSession.attacker;
    const level = effectiveCharacterLevel(character);
    const mob = defenderToMob(targetFighter, level);
    const rawCd = isAttacker
      ? (pkSession.attackerCooldowns ?? pkSession.cooldowns ?? {})
      : (pkSession.defenderCooldowns ?? {});
    const prev = useBattleStore.getState().cooldowns ?? {};
    const cooldowns: Record<number, number> = { ...prev };
    Object.entries(rawCd).forEach(([k, v]) => {
      const id = Number(k);
      const readyAt = Number(v) + serverTimeDrift;
      if (!Number.isNaN(id) && !Number.isNaN(readyAt)) cooldowns[id] = readyAt;
    });
    useBattleStore.setState({
      pkSessionId: pkSession.id,
      mob,
      mobHP: Math.round(Math.max(0, targetFighter.hp ?? 0)),
      log: pkSession.log ?? [],
      cooldowns,
      status: pkSession.ended ? "victory" : "fighting",
      heroBuffs: uniqueBuffs,
    });
  }, [pkSession, myHero?.id, character, uniqueBuffs, serverTimeDrift, pkActorBuffsFromStore]);

  const handleBack = () => {
    useBattleStore.getState().reset();
    onBack?.();
  };

  if (!pkSession) {
    return (
      <div className={isL2 ? "w-full text-[#d4c4a8] py-2 px-2" : "w-full text-white py-2"}>
        <div
          className={
            isL2
              ? "text-center text-[14px] text-[#e8c56e] font-semibold [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]"
              : "text-center text-[14px] text-[#dec28e] font-semibold"
          }
        >
          {character.name}
        </div>
        <div
          className={
            isL2
              ? "text-center text-[10px] text-[#8a7a60] lowercase mb-2"
              : "text-center text-[10px] text-[#a69a82] lowercase mb-2"
          }
        >
          {String(professionLabel || "").toLowerCase()} · {effectiveCharacterLevel(character)} lvl
        </div>
        <div
          className={
            isL2
              ? "text-center text-[11px] text-[#a89470] py-4 rounded-md border border-[#5c4a32]/40 bg-black/20"
              : "text-center text-[11px] text-gray-400 py-4"
          }
        >
          {pkLoading ? "Создание PK сессии..." : pkError || "PK сессия недоступна"}
        </div>
      </div>
    );
  }

  const isAttacker = myHero?.id === pkSession.attackerId;
  const targetFighter = isAttacker ? pkSession.defender : pkSession.attacker;
  const target = {
    name: targetFighter.name,
    level: effectiveCharacterLevel(character),
    currentHp: Math.round(Math.max(0, targetFighter.hp ?? 0)),
    maxHp: Math.round(Math.max(1, targetFighter.maxHp ?? 1)),
  };

  return (
    <div className={isL2 ? "w-full text-[#d4c4a8]" : "w-full text-white"}>
      <BattlePanel
        target={target}
        buffs={uniqueBuffs}
        now={nowTs}
        backLabel={panelBackLabel ?? "Назад в окрестность"}
        onBack={handleBack}
        showBackButton={true}
        isL2={isL2}
      >
        <SkillBar onUseSkillOverride={onUseSkill} onAttackOverride={onAttack} />
      </BattlePanel>

      {pkSession.ended && (
        <div className="mt-2 text-center text-[12px] px-3">
          {pkSession.escapedByName ? (
            <div className={isL2 ? "text-[#e8c56e]" : "text-yellow-300"}>{pkSession.escapedByName} сбежал!</div>
          ) : pkSession.winnerId && myHero?.id && pkSession.winnerId === myHero.id ? (
            <div className={isL2 ? "text-[#7d9b7a] font-semibold" : "text-green-400 font-semibold"}>
              Вы сразили игрока! Игрок мертв!
            </div>
          ) : pkSession.winnerId ? (
            <div className={isL2 ? "text-[#d4786a] font-semibold" : "text-red-400 font-semibold"}>Вы проиграли</div>
          ) : (
            <div className={isL2 ? "text-[#8a7a60]" : "text-gray-300"}>Бой завершен</div>
          )}
        </div>
      )}
      {pkError && (
        <div className={`mt-1 text-center text-[11px] px-3 ${isL2 ? "text-[#d4786a]" : "text-red-400"}`}>{pkError}</div>
      )}
    </div>
  );
}
