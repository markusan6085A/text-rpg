import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  getPublicCharacter,
  getCharacterByName,
  adminHeal,
  adminResurrect,
  adminBan,
  adminUnban,
  adminBlock,
  adminUnblock,
  adminMuteChatUser,
  type Character,
} from "../utils/api";
import { getSkillDef, getSkillDefForBattle } from "../state/battle/loadout";
import { normalizeProfessionId, getProfessionDefinition, getDefaultProfessionForKlass } from "../data/skills";
import { useHeroStore } from "../state/heroStore";
import { useAdminStore } from "../state/adminStore";
import { showToast } from "../state/toastStore";
import { getNickColorStyle } from "../utils/nickColor";
import { processSkillEffects } from "../state/battle/actions/useSkill/buffHelpers";
import { isWarmCityUi, useCityUiVariant } from "../utils/cityUiVariant";
import { characterModalPanelClass } from "./character/characterModalL2";
import { SKILL_ICON_ERROR_FALLBACK } from "../utils/skillIconUrls";

interface PlayerAdminActionsProps {
  navigate: (path: string) => void;
  playerId?: string;
  playerName?: string;
}

export default function PlayerAdminActions({ navigate, playerId, playerName }: PlayerAdminActionsProps) {
  const cityUi = useCityUiVariant();
  const isL2 = isWarmCityUi(cityUi);
  const hero = useHeroStore((s) => s.hero);
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuffModal, setShowBuffModal] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  const loadPlayer = useCallback(async () => {
    if (!playerId && !playerName) return;
    setLoading(true);
    setError(null);
    try {
      let loadedCharacter: Character;
      if (playerId) {
        loadedCharacter = await getPublicCharacter(playerId);
      } else {
        loadedCharacter = await getCharacterByName(playerName!);
      }
      if (!loadedCharacter?.id) {
        setError("Некоректна відповідь сервера");
        return;
      }
      setCharacter(loadedCharacter);
    } catch (err: any) {
      setError(err?.message || "Помилка завантаження профілю гравця");
      console.error("[PlayerAdminActions] Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  }, [playerId, playerName]);

  useEffect(() => {
    loadPlayer();
  }, [loadPlayer]);

  // Конвертуємо Character в Hero формат; profession нормалізуємо для всіх професій (бафи відображаються коректно)
  const playerHero = useMemo(() => {
    if (!character?.id) return null;
    try {
      const heroJson = character.heroJson && typeof character.heroJson === "object" ? character.heroJson : {};
      const professionRaw = heroJson.profession || character.classId || "";
      const normalized = normalizeProfessionId(professionRaw);
      const effectiveProfession =
        (normalized && getProfessionDefinition(normalized))
          ? normalized
          : (getDefaultProfessionForKlass(character.classId || "", character.race) || professionRaw || "");

      return {
        id: character.id,
        name: character.name,
        race: character.race,
        klass: character.classId,
        profession: effectiveProfession,
        level: character.level ?? 1,
        skills: Array.isArray(heroJson.skills) ? heroJson.skills : [],
        hp: heroJson.hp || heroJson.maxHp || 100,
        maxHp: heroJson.maxHp || 100,
        mp: heroJson.mp || heroJson.maxMp || 100,
        maxMp: heroJson.maxMp || 100,
      };
    } catch (e) {
      console.error("[PlayerAdminActions] playerHero useMemo error:", e);
      return null;
    }
  }, [character]);

  // Отримуємо вивчені бафи гравця
  const playerBuffs = useMemo(() => {
    if (!playerHero?.skills?.length) return [];
    try {
      return playerHero.skills
        .map((learned: any) => {
          const id = Number(learned?.id ?? learned);
          if (!Number.isFinite(id)) return null;
          const skillDef = getSkillDefForBattle(
            playerHero.profession ?? null,
            playerHero.klass,
            playerHero.race,
            id
          ) ?? getSkillDef(id);
          if (!skillDef || skillDef.category !== "buff") return null;

          const levelDef = skillDef.levels?.find((l: any) => l.level === learned.level) ?? skillDef.levels?.[0];
          return {
            id: learned.id,
            name: skillDef.name,
            description: skillDef.description,
            icon: skillDef.icon,
            level: learned.level,
            castTime: skillDef.castTime,
            cooldown: skillDef.cooldown,
            duration: skillDef.duration,
            mpCost: levelDef?.mpCost ?? 0,
            skillDef,
            levelDef,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (e) {
      console.error("[PlayerAdminActions] playerBuffs useMemo error:", e);
      return [];
    }
  }, [playerHero]);

  // Отримуємо buff скіли для застосування — завжди берём бафи поточного гравця (hero), щоб можна було бафати іншого гравця СВОЇМИ бафами.
  const myBuffSkills = useMemo(() => {
    const source = hero;
    if (!source?.skills?.length) return [];
    try {
      return source.skills
      .map((learned: any) => {
        const skillDef = getSkillDefForBattle(
          (source as any).profession ?? null,
          (source as any).klass,
          (source as any).race,
          learned.id
        ) ?? getSkillDef(learned.id);
        if (!skillDef || skillDef.category !== "buff") return null;
        const target = skillDef.target ?? "self";
        if (target !== "ally" && target !== "party") return null;

        const levelDef = skillDef.levels.find((l) => l.level === learned.level) ?? skillDef.levels[0];
        
        return {
          id: learned.id,
          name: skillDef.name,
          description: skillDef.description,
          icon: skillDef.icon,
          level: learned.level,
          castTime: skillDef.castTime,
          cooldown: skillDef.cooldown,
          duration: skillDef.duration,
          mpCost: levelDef?.mpCost ?? 0,
          skillDef,
          levelDef,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (e) {
      console.error("[PlayerAdminActions] myBuffSkills useMemo error:", e);
      return [];
    }
  }, [hero]);

  // Отримуємо мої heal скіли
  const myHealSkills = useMemo(() => {
    if (!hero?.skills?.length) return [];
    try {
      return hero.skills
      .map((learned: any) => {
        const skillDef = getSkillDef(learned.id);
        if (!skillDef || skillDef.category !== "heal") return null;

        const levelDef = skillDef.levels.find((l) => l.level === learned.level) ?? skillDef.levels[0];
        
        return {
          id: learned.id,
          name: skillDef.name,
          description: skillDef.description,
          icon: skillDef.icon,
          level: learned.level,
          power: levelDef?.power ?? 0,
          mpCost: levelDef?.mpCost ?? 0,
          castTime: skillDef.castTime,
          cooldown: skillDef.cooldown,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (e) {
      console.error("[PlayerAdminActions] myHealSkills useMemo error:", e);
      return [];
    }
  }, [hero]);

  const reloadCharacter = useCallback(async () => {
    if (!playerId && !playerName) return;
    try {
      const loaded =
        playerId
          ? await getPublicCharacter(playerId)
          : await getCharacterByName(playerName!);
      if (loaded?.id) setCharacter(loaded);
    } catch (err: any) {
      console.error("[PlayerAdminActions] Error reloading:", err);
    }
  }, [playerId, playerName]);

  // Функція для форматування значень бафа
  const formatBuffValues = (skillDef: any, levelDef: any) => {
    const parts: string[] = [];
    
    if (skillDef.effects && Array.isArray(skillDef.effects) && skillDef.effects.length > 0) {
      const effectParts = skillDef.effects.map((eff: any) => {
        let val: number;
        if (eff.mode === "multiplier") {
          val = typeof eff.multiplier === "number" ? eff.multiplier : 1;
        } else {
          const base = typeof eff.value === "number" 
            ? eff.value 
            : (typeof levelDef?.power === "number" ? levelDef.power : 0);
          val = base * (eff.multiplier ?? 1);
        }
        
        const statNames: Record<string, string> = {
          pAtk: "Физ. атака",
          pDef: "Физ. защита",
          mAtk: "Маг. атака",
          mDef: "Маг. защита",
          maxHp: "Макс. HP",
          maxMp: "Макс. MP",
          critRate: "Шанс крита",
          critDamage: "Сила крита",
        };
        
        const statName = statNames[eff.stat] || eff.stat;
        const mode = eff.mode === "percent" ? "%" : eff.mode === "multiplier" ? "x" : "";
        
        return `${statName}: ${val}${mode}`;
      });
      
      parts.push(...effectParts);
    }
    
    if (levelDef?.mpCost > 0) {
      parts.push(`MP: ${levelDef.mpCost}`);
    }
    if (skillDef.castTime) {
      parts.push(`Каст: ${skillDef.castTime}с`);
    }
    if (skillDef.cooldown) {
      parts.push(`КД: ${skillDef.cooldown}с`);
    }
    if (skillDef.duration) {
      const minutes = Math.floor(skillDef.duration / 60);
      const seconds = skillDef.duration % 60;
      if (minutes > 0) {
        parts.push(`Длит.: ${minutes}м ${seconds}с`);
      } else {
        parts.push(`Длит.: ${seconds}с`);
      }
    }
    
    return parts;
  };

  const handleHeal = async (healSkillId: number, healPower: number) => {
    if (!character || !hero) return;
    
    try {
      const expectedRevision = Number(
        (useHeroStore.getState() as any).serverState?.heroRevision ??
        (hero as any)?.heroJson?.heroRevision ??
        0
      );
      const result = await import("../utils/api").then(({ healPlayer }) => 
        healPlayer(character.id, healSkillId, healPower, expectedRevision)
      );
      
      if (result.ok) {
        showToast(`Игроку ${character.name} відновлено ${result.healedHp || healPower} HP.`, "success");
        reloadCharacter();
      }
    } catch (err: any) {
      showToast(`Ошибка лечения: ${err?.message || "Unknown error"}`, "error");
      console.error("[PlayerAdminActions] Error healing:", err);
    }
  };

  const handleBuffPlayer = async (buffSkillId: number) => {
    if (!character || !hero) return;
    
    try {
      const buffSkill = myBuffSkills.find(b => b.id === buffSkillId);
      if (!buffSkill) return;

      // Створюємо правильну структуру бафу
      const effects = processSkillEffects(buffSkill.skillDef, buffSkill.levelDef);
      const now = Date.now();
      const durationMs = (buffSkill.duration || 0) * 1000;
      
      const buffData = {
        name: buffSkill.name,
        icon: buffSkill.icon || "",
        effects: effects,
        duration: buffSkill.duration || 0,
        expiresAt: now + durationMs,
        buffGroup: buffSkill.skillDef.buffGroup,
        stackType: buffSkill.skillDef.stackType,
      };

      const expectedRevision = Number(
        (useHeroStore.getState() as any).serverState?.heroRevision ??
        (hero as any)?.heroJson?.heroRevision ??
        0
      );
      const result = await import("../utils/api").then(({ buffPlayer }) => 
        buffPlayer(character.id, buffSkillId, buffData, expectedRevision)
      );
      
      if (result.ok) {
        reloadCharacter();
      }
    } catch (err: any) {
      showToast(`Ошибка применения бафа: ${err?.message || "Unknown error"}`, "error");
      console.error("[PlayerAdminActions] Error buffing:", err);
    }
  };


  const loadTextCl = isL2 ? "text-[#d4c4a8]" : "text-white";
  const errTextCl = isL2 ? "text-[#c97a6a]" : "text-red-400";
  const btnSecondaryCl = isL2
    ? "px-4 py-2 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8dcc8] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 hover:brightness-110 transition-[border-color,filter] duration-150"
    : "px-4 py-2 bg-[#c7ad80]/30 hover:bg-[#c7ad80]/50 border border-[#c7ad80]/60 text-[#c7ad80] rounded";
  const btnProfileCl = isL2
    ? "px-4 py-2 rounded-md bg-gradient-to-b from-[#1c2430] to-[#0c1018] border border-[#4a5c7a]/55 text-[#c8d4e8] shadow-[inset_0_1px_0_rgba(120,140,180,0.12)] hover:border-[#6b7f9d]/55 hover:brightness-110 transition-[border-color,filter] duration-150"
    : "px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white";

  if (loading) {
    return (
      <div className={`w-full flex items-center justify-center text-sm py-10 ${loadTextCl}`}>Завантаження…</div>
    );
  }

  if (error || !character || !playerHero) {
    return (
      <div className={`w-full flex flex-col items-center text-sm py-10 px-4 ${loadTextCl}`}>
        <div className={`${errTextCl} mb-4`}>{error || "Профіль не знайдено"}</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {character?.id && (
            <button type="button" onClick={() => navigate(`/player/${character.id}`)} className={btnProfileCl}>
              Профіль
            </button>
          )}
          <button type="button" onClick={() => navigate("/admin")} className={btnSecondaryCl}>
            В адмінку
          </button>
        </div>
      </div>
    );
  }

  const profession = playerHero.profession || character.classId || "";
  const profId = normalizeProfessionId(profession as any);
  const profDef = profId ? getProfessionDefinition(profId) : null;
  const professionLabel = profDef?.label || profession || "Нет";

  const runAdminAction = async (fn: () => Promise<any>, successMsg: string) => {
    if (!character) return;
    setAdminMessage(null);
    setAdminActionLoading(true);
    try {
      await fn();
      setAdminMessage(successMsg);
      await reloadCharacter();
    } catch (err: any) {
      setAdminMessage(err?.message || "Помилка");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const shellOuterCl = isL2
    ? "w-full max-w-[420px] rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)] px-3 py-4 mt-2"
    : "w-full max-w-[420px] mt-2 px-3";
  const secTitleCl = isL2
    ? "text-[#e8c56e] text-sm font-semibold mb-2 pb-1 border-b border-[#5c4a32]/50 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
    : "text-[#dec28e] text-sm font-semibold mb-2 border-b border-solid border-white/50 pb-1";
  const subLineCl = isL2 ? "text-sm text-[#9a8a70]" : "text-sm text-gray-400";
  const descCl = isL2 ? "text-xs text-[#8a7a60] leading-relaxed" : "text-xs text-gray-400 leading-relaxed";
  const statGreenCl = isL2 ? "text-xs text-[#7ab87a] mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5" : "text-xs text-[#228b22] mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5";
  const rowDividerCl = isL2 ? "w-full mt-2 border-t border-[#5c4a32]/50" : "w-full h-px bg-gray-500 mt-2";
  const emptyBuffsCl = isL2 ? "text-xs py-2 text-[#8a7a60]" : "text-gray-500 text-xs py-2";
  const adminOkCl = isL2 ? "text-xs text-[#7ab87a] mb-2" : "text-xs text-green-400 mb-2";
  const titleNameCl = isL2 ? "text-lg font-semibold [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]" : "text-lg font-semibold text-[#dec28e]";
  const linkAdminCl = isL2
    ? "mt-2 text-[10px] text-[#c7ad80]/90 hover:text-[#e8c56e] underline decoration-[#5c4a32]/60"
    : "mt-2 text-[10px] text-[#c7ad80] hover:underline";

  const tinyBase =
    "px-2 py-1 text-[10px] rounded-md disabled:opacity-50 transition-[border-color,filter] duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";
  const adminBtnHealCl = isL2
    ? `${tinyBase} bg-gradient-to-b from-[#1a2818] to-[#0e120e] border border-[#3d5c42]/75 text-[#b8dcc0] hover:border-[#5a7a5a]/75 hover:brightness-110`
    : `${tinyBase} bg-green-900/40 text-green-300 hover:bg-green-900/60`;
  const adminBtnBanCl = isL2
    ? `${tinyBase} bg-gradient-to-b from-[#281818] to-[#120c0c] border border-[#6b3d3d]/75 text-[#e8b8b8] hover:border-[#8a5050]/75 hover:brightness-110`
    : `${tinyBase} bg-red-900/40 text-red-300 hover:bg-red-900/60`;
  const adminBtnNeutralCl = isL2
    ? `${tinyBase} bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8dcc8] hover:border-[#c7ad80]/50 hover:brightness-110`
    : `${tinyBase} bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30`;
  const adminBtnBlockCl = isL2
    ? `${tinyBase} bg-gradient-to-b from-[#282018] to-[#12100c] border border-[#7a5a32]/75 text-[#e8cfa8] hover:border-[#a07840]/55 hover:brightness-110`
    : `${tinyBase} bg-orange-900/40 text-orange-300 hover:bg-orange-900/60`;
  const adminBtnMuteCl = isL2
    ? `${tinyBase} bg-gradient-to-b from-[#282210] to-[#121008] border border-[#7a6a32]/75 text-[#e8daa0] hover:border-[#a09048]/55 hover:brightness-110`
    : `${tinyBase} bg-amber-900/40 text-amber-300 hover:bg-amber-900/60`;

  const btnBuffPrimaryCl = isL2
    ? "w-full py-2.5 px-4 rounded-md bg-gradient-to-b from-[#3a3020] to-[#1a1510] border border-[#c9a44c]/55 text-[#f5e6bc] text-sm shadow-[inset_0_1px_0_rgba(199,173,128,0.25)] hover:border-[#e8c56e]/65 hover:brightness-110 transition-[border-color,filter] duration-150"
    : "w-full py-2 px-4 bg-green-900/50 border border-green-700 text-green-400 hover:bg-green-900/70 rounded text-sm";
  const btnBackCl = isL2
    ? "w-full py-2 px-4 rounded-md bg-gradient-to-b from-[#2a2418] to-[#14110c] border border-[#5c4a32]/75 text-[#d4c4a8] text-sm shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 hover:brightness-110 transition-[border-color,filter] duration-150"
    : "w-full py-2 px-4 bg-blue-900/50 border border-blue-700 text-blue-400 hover:bg-blue-900/70 rounded text-sm";
  const btnHealSmallCl = isL2
    ? "mt-2 px-3 py-1 rounded-md text-[10px] bg-gradient-to-b from-[#1a2818] to-[#0e120e] border border-[#3d5c42]/75 text-[#b8dcc0] shadow-[inset_0_1px_0_rgba(180,200,180,0.08)] hover:border-[#5a7a5a]/75 hover:brightness-110 transition-[border-color,filter] duration-150"
    : "mt-2 px-3 py-1 bg-green-900/50 border border-green-700 text-green-400 hover:bg-green-900/70 rounded text-[10px]";
  const modalBuffApplyCl = btnHealSmallCl;

  const outerTextCl = isL2 ? "text-[#d4c4a8]" : "text-white";
  const modalTitleCl = isL2
    ? "text-lg font-semibold text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
    : "text-lg font-semibold text-[#dec28e]";
  const modalCloseCl = isL2
    ? "text-[#8a7a60] hover:text-[#e8c56e] text-xl leading-none"
    : "text-gray-400 hover:text-white text-xl";
  const modalEmptyCl = isL2 ? "text-sm py-4 text-[#8a7a60]" : "text-gray-400 text-sm py-4";
  const modalRowBorderCl = isL2 ? "border-b border-[#5c4a32]/50 pb-2" : "border-b border-solid border-white/50 pb-2";

  return (
    <div className={`w-full flex flex-col items-center ${outerTextCl}`}>
      <div className={shellOuterCl}>
        {/* Заголовок */}
        <div className="text-center mb-4">
          <div className={titleNameCl} style={getNickColorStyle(character.name, hero)}>
            {character.name}
          </div>
          <div className={subLineCl}>
            {professionLabel} - {character.level} ур.
          </div>
        </div>

        {/* Адмін-дії — тільки для адмінів */}
        {isAdmin && (
          <div className="mb-4">
            <div className={secTitleCl}>Адмін-дії</div>
            {adminMessage && <p className={adminOkCl}>{adminMessage}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => runAdminAction(() => adminHeal(character.id), "Лікування виконано")}
                disabled={adminActionLoading}
                className={adminBtnHealCl}
              >
                Heal
              </button>
              <button
                type="button"
                onClick={() => runAdminAction(() => adminResurrect(character.id), "Воскрешение виконано")}
                disabled={adminActionLoading}
                className={adminBtnHealCl}
              >
                Resurrect
              </button>
              <button
                type="button"
                onClick={() => runAdminAction(() => adminBan(character.id, 60), "Бан 1 год застосовано")}
                disabled={adminActionLoading}
                className={adminBtnBanCl}
              >
                Бан 1 год
              </button>
              <button
                type="button"
                onClick={() => runAdminAction(() => adminUnban(character.id), "Розбан виконано")}
                disabled={adminActionLoading}
                className={adminBtnNeutralCl}
              >
                Розбан
              </button>
              <button
                type="button"
                onClick={() => runAdminAction(() => adminBlock(character.id, 60), "Блок 1 год застосовано")}
                disabled={adminActionLoading}
                className={adminBtnBlockCl}
              >
                Блок 1 год
              </button>
              <button
                type="button"
                onClick={() => runAdminAction(() => adminUnblock(character.id), "Розблок виконано")}
                disabled={adminActionLoading}
                className={adminBtnNeutralCl}
              >
                Розблок
              </button>
              <button
                type="button"
                onClick={() => runAdminAction(() => adminMuteChatUser(character.id, 60), "Mute 1 год застосовано")}
                disabled={adminActionLoading}
                className={adminBtnMuteCl}
              >
                Mute 1 год
              </button>
            </div>
            <button type="button" onClick={() => navigate("/admin")} className={linkAdminCl}>
              В адмінку (предмети, зміна класу, преміум…)
            </button>
          </div>
        )}

        {/* Кнопка бафу */}
        <div className="mb-4">
          <button type="button" onClick={() => setShowBuffModal(true)} className={btnBuffPrimaryCl}>
            Забафнуть игрока
          </button>
        </div>

        {/* Бафи гравця */}
        <div className="mb-4">
          <div className={secTitleCl}>Бафи</div>
          {playerBuffs.length === 0 ? (
            <div className={emptyBuffsCl}>Немає вивчених бафів</div>
          ) : (
            <div className="space-y-2">
              {playerBuffs.map((buff) => {
                const formattedValues = formatBuffValues(buff.skillDef, buff.levelDef);
                // Розділяємо опис на англійську та російську частини (як у LearnedSkillsScreen)
                const descriptionParts = buff.description.split("\n\n");
                let russianDescription = "";
                if (descriptionParts.length > 1) {
                  russianDescription = descriptionParts.slice(1).join("\n\n");
                } else {
                  const text = descriptionParts[0] || "";
                  const hasCyrillic = /[А-Яа-яЁё]/.test(text);
                  russianDescription = hasCyrillic ? text : "Переклад відсутній";
                }
                
                let iconSrc = buff.icon?.startsWith("/") ? buff.icon : `/skills/${buff.icon || ""}`;
                
                return (
                  <div key={buff.id}>
                    <div className="flex items-start gap-2">
                      <img
                        src={iconSrc}
                        alt={buff.name}
                        className="w-5 h-5 object-contain flex-shrink-0 mt-0.5"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.onerror = null;
                          img.src = SKILL_ICON_ERROR_FALLBACK;
                        }}
                      />
                      <div className="flex-1">
                        <div className={descCl}>{russianDescription}</div>
                        {formattedValues.length > 0 && (
                          <div className={statGreenCl}>
                            {formattedValues.map((value, idx) => (
                              <span key={idx}>{value}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={rowDividerCl} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Лікування */}
        {myHealSkills.length > 0 && (
          <div className="mb-4">
            <div className={secTitleCl}>Лікування</div>
            <div className="space-y-2">
              {myHealSkills.map((heal) => {
                const descriptionParts = heal.description.split("\n\n");
                let russianDescription = "";
                if (descriptionParts.length > 1) {
                  russianDescription = descriptionParts.slice(1).join("\n\n");
                } else {
                  const text = descriptionParts[0] || "";
                  const hasCyrillic = /[А-Яа-яЁё]/.test(text);
                  russianDescription = hasCyrillic ? text : "Переклад відсутній";
                }
                
                let iconSrc = heal.icon?.startsWith("/") ? heal.icon : `/skills/${heal.icon || ""}`;
                const healValues = [
                  `Лікування: ${heal.power}`,
                  heal.mpCost > 0 ? `MP: ${heal.mpCost}` : null,
                  heal.castTime ? `Каст: ${heal.castTime}с` : null,
                  heal.cooldown ? `КД: ${heal.cooldown}с` : null,
                ].filter(Boolean) as string[];
                
                return (
                  <div key={heal.id}>
                    <div className="flex items-start gap-2">
                      <img
                        src={iconSrc}
                        alt={heal.name}
                        className="w-5 h-5 object-contain flex-shrink-0 mt-0.5"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.onerror = null;
                          img.src = SKILL_ICON_ERROR_FALLBACK;
                        }}
                      />
                      <div className="flex-1">
                        <div className={descCl}>{russianDescription}</div>
                        {healValues.length > 0 && (
                          <div className={statGreenCl}>
                            {healValues.map((value, idx) => (
                              <span key={idx}>{value}</span>
                            ))}
                          </div>
                        )}
                        <button type="button" onClick={() => handleHeal(heal.id, heal.power)} className={btnHealSmallCl}>
                          Використати
                        </button>
                      </div>
                    </div>
                    <div className={rowDividerCl} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Модалка для застосування бафів */}
        {showBuffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4" onClick={() => setShowBuffModal(false)}>
            <div
              className={characterModalPanelClass("max-w-md w-full max-h-[90vh] overflow-y-auto")}
              onClick={(e) => e.stopPropagation()}
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" }}
            >
              <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className={modalTitleCl}>Выберите баф для применения</h2>
                <button type="button" className={modalCloseCl} onClick={() => setShowBuffModal(false)} aria-label="Закрити">
                  ×
                </button>
              </div>
              {myBuffSkills.length === 0 ? (
                <div className={modalEmptyCl}>У вас нет изученных бафов</div>
              ) : (
                <div className="space-y-2 mb-8">
                  {myBuffSkills.map((buff) => {
                    const formattedValues = formatBuffValues(buff.skillDef, buff.levelDef);
                    const descriptionParts = buff.description.split("\n\n");
                    let russianDescription = "";
                    if (descriptionParts.length > 1) {
                      russianDescription = descriptionParts.slice(1).join("\n\n");
                    } else {
                      const text = descriptionParts[0] || "";
                      const hasCyrillic = /[А-Яа-яЁё]/.test(text);
                      russianDescription = hasCyrillic ? text : "Перевод отсутствует";
                    }
                    let iconSrc = buff.icon?.startsWith("/") ? buff.icon : `/skills/${buff.icon || ""}`;
                    return (
                      <div key={buff.id} className={modalRowBorderCl}>
                        <div className="flex items-start gap-2">
                          <img
                            src={iconSrc}
                            alt={buff.name}
                            className="w-5 h-5 object-contain flex-shrink-0 mt-0.5"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.onerror = null;
                              img.src = SKILL_ICON_ERROR_FALLBACK;
                            }}
                          />
                          <div className="flex-1">
                            <div className={descCl}>{russianDescription}</div>
                            {formattedValues.length > 0 && (
                              <div className={statGreenCl}>
                                {formattedValues.map((value, idx) => (
                                  <span key={idx}>{value}</span>
                                ))}
                              </div>
                            )}
                            <button type="button" onClick={() => handleBuffPlayer(buff.id)} className={modalBuffApplyCl}>
                              Применить
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Кнопка назад */}
        <div className="mt-4 mb-4">
          <button type="button" onClick={() => navigate(`/player/${character.id}`)} className={btnBackCl}>
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
