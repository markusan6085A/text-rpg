import React from "react";
import type { Character, PkSessionState } from "../../utils/api";
import PkSkillLoadoutBar from "./PkSkillLoadoutBar";
import { useHeroStore } from "../../state/heroStore";
import { cleanupBuffs, computeBuffedMaxResources } from "../../state/battle/helpers";
import { loadBattle } from "../../state/battle/persist";
import { BattlePanel } from "../battle/BattlePanel";
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
  onUseSkill: (skillId: number) => void;
  /** Повернутися до профілю (без PK) */
  onBack?: () => void;
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
  onUseSkill,
  onBack,
}: PkProfileViewProps) {
  const myHero = useHeroStore((s) => s.hero);
  const nowTs = now || Date.now();
  const heroJson = ((myHero as any)?.heroJson || {}) as any;
  const savedBattle = myHero?.name ? loadBattle(myHero.name) : null;
  const savedBuffs = cleanupBuffs(savedBattle?.heroBuffs || [], nowTs);
  const heroJsonBuffs = cleanupBuffs(Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [], nowTs);
  const allBuffs = [...savedBuffs, ...heroJsonBuffs];
  const uniqueBuffs = allBuffs.filter((buff, idx, self) =>
    idx === self.findIndex((b) =>
      (b.id && buff.id && b.id === buff.id) ||
      (!b.id && !buff.id && b.name === buff.name)
    )
  ) as BattleBuff[];

  if (!pkSession) {
    return (
      <div className="w-full text-white py-2">
        <div className="text-center text-[14px] text-[#dec28e] font-semibold">{character.name}</div>
        <div className="text-center text-[10px] text-[#a69a82] lowercase mb-2">
          {String(professionLabel || "").toLowerCase()} · {character.level} lvl
        </div>
        <div className="text-center text-[11px] text-gray-400 py-4">
          {pkLoading ? "Создание PK сессии..." : pkError || "PK сессия недоступна"}
        </div>
      </div>
    );
  }

  const defender = pkSession.defender;
  const target = {
    name: defender.name,
    level: (defender as any).level ?? character.level ?? 1,
    currentHp: Math.max(0, defender.hp ?? 0),
    maxHp: Math.max(1, defender.maxHp ?? 1),
  };

  return (
    <div className="w-full text-white">
      <BattlePanel
        target={target}
        buffs={uniqueBuffs}
        now={nowTs}
        log={pkSession.log}
        backLabel="Назад к профилю"
        onBack={onBack}
        showBackButton={true}
      >
        <PkSkillLoadoutBar
          ownerId={character.id}
          skills={pkSession.attacker.skills}
          cooldowns={pkSession.cooldowns}
          currentMp={pkSession.attacker.mp}
          ended={pkSession.ended}
          acting={pkActing}
          now={now}
          onUseSkill={onUseSkill}
        />
      </BattlePanel>

      {pkSession.ended && (
        <div className="mt-2 text-center text-[12px] px-3">
          {pkSession.winnerId === pkSession.attackerId ? (
            <div className="text-green-400 font-semibold">Вы победили</div>
          ) : pkSession.winnerId === pkSession.defenderId ? (
            <div className="text-red-400 font-semibold">Вы проиграли</div>
          ) : pkSession.escapedByName ? (
            <div className="text-yellow-300">{pkSession.escapedByName} сбежал!</div>
          ) : (
            <div className="text-gray-300">Бой завершен</div>
          )}
        </div>
      )}
      {pkError && <div className="mt-1 text-center text-[11px] text-red-400 px-3">{pkError}</div>}
    </div>
  );
}
