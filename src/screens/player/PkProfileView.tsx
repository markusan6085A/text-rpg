import React from "react";
import type { Character, PkSessionState } from "../../utils/api";
import CharacterEquipmentFrame from "../character/CharacterEquipmentFrame";
import PkSkillLoadoutBar from "./PkSkillLoadoutBar";
import { useHeroStore } from "../../state/heroStore";
import { getMaxResources } from "../../state/battle/helpers/getMaxResources";
import { cleanupBuffs, computeBuffedMaxResources } from "../../state/battle/helpers";
import { loadBattle } from "../../state/battle/persist";

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
}: PkProfileViewProps) {
  const boxBlue =
    "rounded-lg border-2 border-[#4aa3ff]/70 bg-black/25 shadow-[inset_0_0_12px_rgba(74,163,255,0.18)] overflow-hidden";
  const myHero = useHeroStore((s) => s.hero);
  const nowTs = Date.now();
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
  );
  const myBaseMax = myHero ? getMaxResources(myHero as any) : { maxHp: 1, maxMp: 1, maxCp: 0 };
  const myBuffedMax = computeBuffedMaxResources(myBaseMax as any, uniqueBuffs);
  const myHp = Math.max(0, Math.min(Number(myBuffedMax.maxHp ?? 1), Number(myHero?.hp ?? myBuffedMax.maxHp ?? 1)));
  const myMaxHp = Math.max(1, Number(myBuffedMax.maxHp ?? myHero?.maxHp ?? 1));
  const isSelfAttacker = !!myHero?.id && myHero.id === pkSession?.attackerId;
  const isSelfDefender = !!myHero?.id && myHero.id === pkSession?.defenderId;

  return (
    <div className="w-full text-[#c7ad80] text-[12px]">
      <div className="text-center text-[14px] text-[#dec28e] font-semibold">{character.name}</div>
      <div className="text-center text-[10px] text-[#a69a82] lowercase mb-2">
        {String(professionLabel || "").toLowerCase()} · {character.level} lvl
      </div>

      <div className="mb-3">
        <CharacterEquipmentFrame allowUnequip={false} marginTop="0" heroOverride={heroData} onItemClick={() => {}} />
      </div>

      {!pkSession ? (
        <div className="text-center text-[11px] text-gray-400 py-2">
          {pkLoading ? "Создание PK сессии..." : pkError || "PK сессия недоступна"}
        </div>
      ) : (
        <>
          <div className="space-y-2 text-[11px]">
            <div>
              <div className="flex justify-between text-[#c7ad80]">
                <span>{pkSession.attacker.name}</span>
                <span>{isSelfAttacker ? `${myHp}/${myMaxHp}` : `${pkSession.attacker.hp}/${pkSession.attacker.maxHp}`}</span>
              </div>
              <div className="h-2 bg-[#2a2a2a] rounded overflow-hidden border border-white/20">
                <div
                  className="h-full bg-red-600"
                  style={{
                    width: `${Math.max(0, Math.min(100, (isSelfAttacker ? (myHp / Math.max(1, myMaxHp)) : (pkSession.attacker.hp / Math.max(1, pkSession.attacker.maxHp))) * 100))}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[#c7ad80]">
                <span>{pkSession.defender.name}</span>
                <span>{isSelfDefender ? `${myHp}/${myMaxHp}` : `${pkSession.defender.hp}/${pkSession.defender.maxHp}`}</span>
              </div>
              <div className="h-2 bg-[#2a2a2a] rounded overflow-hidden border border-white/20">
                <div
                  className="h-full bg-red-700"
                  style={{
                    width: `${Math.max(0, Math.min(100, (isSelfDefender ? (myHp / Math.max(1, myMaxHp)) : (pkSession.defender.hp / Math.max(1, pkSession.defender.maxHp))) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>

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

          <div className="mt-3">
            <div className="text-[12px] text-[#c7ad80] font-semibold mb-1">Лог бою:</div>
            <div className={`${boxBlue} w-full`}>
              <div className="px-2 py-2 max-h-[140px] overflow-y-auto text-[11px] space-y-1">
                {pkSession.log.map((line, idx) => (
                  <div key={idx} className="text-[#d9c4a3]">{line}</div>
                ))}
              </div>
            </div>
          </div>

          {pkSession.ended && (
            <div className="mt-2 text-center text-[11px]">
              {pkSession.winnerId === pkSession.attackerId ? (
                <div className="text-green-400">Вы победили</div>
              ) : pkSession.winnerId === pkSession.defenderId ? (
                <div className="text-red-400">Вы проиграли</div>
              ) : pkSession.escapedByName ? (
                <div className="text-yellow-300">{pkSession.escapedByName} сбежал!</div>
              ) : (
                <div className="text-gray-300">Бой завершен</div>
              )}
            </div>
          )}
          {pkError && <div className="mt-1 text-center text-[11px] text-red-400">{pkError}</div>}
        </>
      )}
    </div>
  );
}
