import React from "react";
import { useHeroStore } from "../../state/heroStore";
import { showToast } from "../../state/toastStore";
import {
  getDefaultProfessionForKlass,
  getProfessionDefinition,
  getSkillsForProfession,
  normalizeProfessionId,
  ProfessionId,
} from "../../data/skills";
import { L2_WARM_OUTER_FRAME } from "../../utils/l2WarmLayoutClassNames";
import { PROFESSION_CHAIN } from "../../data/skills/professionChain";
import { fixHeroProfession } from "../../utils/fixProfession";
import { getLearnSkillFailureReason, learnSkillLogic } from "../../state/heroStore/heroSkills";
import { ONBOARDING_GUILD_NEED_SP_KEY } from "../../state/gameSettings";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";
import {
  ELVEN_MYSTIC_FIRST_PROF_QUEST_ID,
  ELVEN_FIGHTER_FIRST_PROF_QUEST_ID,
  HUMAN_FIGHTER_FIRST_PROF_QUEST_ID,
  HUMAN_MYSTIC_FIRST_PROF_QUEST_ID,
  DARK_FIGHTER_FIRST_PROF_QUEST_ID,
  DARK_MYSTIC_FIRST_PROF_QUEST_ID,
  ORC_FIGHTER_FIRST_PROF_QUEST_ID,
  ORC_MYSTIC_FIRST_PROF_QUEST_ID,
  DWARVEN_FIGHTER_FIRST_PROF_QUEST_ID,
  isHeroElvenMysticBaseForFirstProfQuest,
  isHeroElvenFighterBaseForFirstProfQuest,
  isHeroHumanFighterBaseForFirstProfQuest,
  isHeroHumanMysticBaseForFirstProfQuest,
  isHeroDarkFighterBaseForFirstProfQuest,
  isHeroDarkMysticBaseForFirstProfQuest,
  isHeroOrcFighterBaseForFirstProfQuest,
  isHeroOrcMysticBaseForFirstProfQuest,
  isHeroDwarvenFighterBaseForFirstProfQuest,
} from "../../data/quests";

interface GuildScreenProps {
  navigate: (path: string) => void;
  title?: string;
  emptyMessage?: string;
  selectProfessionTitle?: string;
  learnLabel?: string;
  backLabel?: string;
}

type SkillRow = {
  skill: any;
  currentLevel: number;
  nextLevel: number;
  requiredLevel: number;
  spCost: number;
  power: number | null;
  canLearn: boolean;
};

const DEFAULT_TITLE = "Гильдия навыков — изучение и прокачка";
const DEFAULT_EMPTY = "Навыков пока нет.";

export default function GuildScreen({
  navigate,
  title = DEFAULT_TITLE,
  emptyMessage = DEFAULT_EMPTY,
  selectProfessionTitle = "Выбор профессии",
  learnLabel = "Выучить",
  backLabel = "В город",
}: GuildScreenProps) {
  const hero = useHeroStore((s) => s.hero);
  const handleLearnSkill = (skillId: number, reqLevel: number, spCost: number) => {
    try {
      const res = learnSkillLogic(hero, skillId);
      if (!res.success) {
        if (getLearnSkillFailureReason(hero, skillId) === "sp") {
          try {
            sessionStorage.setItem(ONBOARDING_GUILD_NEED_SP_KEY, "1");
          } catch {
            /* ignore */
          }
        }
        showToast("Не вдалося вивчити скіл. Можливо, не вистачає SP або рівня.", "error");
        return;
      }
      try {
        sessionStorage.removeItem(ONBOARDING_GUILD_NEED_SP_KEY);
      } catch {
        /* ignore */
      }
      if (res.updatedHero) {
        updateHero(res.updatedHero);
      }
    } catch (e: any) {
      if (e?.message && (e.message.includes('revision_conflict') || e.message.includes('Character was modified'))) {
          console.warn('Ігноруємо revision conflict при вивченні скіла');
      } else {
          console.error(e);
      }
    }
  };
  const updateHero = useHeroStore((s) => s.updateHero);
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const skillCardL2 =
    "rounded-md border border-[#5c4a32]/60 bg-gradient-to-b from-[#1a1610]/90 to-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-2.5 mb-2";
  const skillCardClassic = "rounded-md border border-[#c7ad80]/25 bg-black/25 p-2.5 mb-2";
  const statPanelL2 =
    "rounded-md border border-[#5c4a32]/55 bg-black/30 p-2.5 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]";
  const statPanelClassic = "rounded-md border border-white/20 bg-black/25 p-2.5";
  const professionBtnL2 =
    "w-full px-3 py-2.5 rounded-md text-left bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[12px] font-semibold text-[#e8dcc8] shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] hover:border-[#c7ad80]/50 hover:brightness-110 active:scale-[0.99] transition-[border-color,filter,transform] duration-150";
  const professionBtnClassic =
    "w-full px-3 py-2.5 rounded-md bg-gradient-to-r from-[#5c4020] to-[#8b6230] border border-[#c7ad80]/35 text-[12px] font-semibold text-[#f5e6c8]";

  if (!hero) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center py-12 text-[#8a7a60] text-sm gap-2`
            : "w-full text-white flex items-center justify-center"
        }
      >
        {isL2 && (
          <span className="w-4 h-4 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin shrink-0" />
        )}
        Загрузка...
      </div>
    );
  }

  const heroSp =
    typeof hero.sp === "number"
      ? hero.sp
      : typeof (hero as any).SP === "number"
      ? (hero as any).SP
      : 0;
  const heroLevel = hero.level ?? 1;
  const currentSkills = Array.isArray(hero.skills) ? hero.skills : [];

  // ВИПРАВЛЯЄМО ПРОФЕСІЮ ПЕРЕД ВИКОРИСТАННЯМ
  const fixedHero = fixHeroProfession(hero);
  if (fixedHero !== hero) {
    // Якщо професія була виправлена, оновлюємо героя
    updateHero({ profession: fixedHero.profession });
  }

  const defaultProfession = getDefaultProfessionForKlass(hero.klass, hero.race);
  if (!defaultProfession) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex justify-center px-3 py-4 text-[#d4c4a8]`
            : "min-h-screen bg-[#1a1814] text-white flex justify-center px-3 py-4"
        }
      >
        <div className="w-full max-w-[420px]">
          <div
            className={
              isL2
                ? "bg-black/20 border border-[#5c4a32]/70 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-6 space-y-3 rounded-xl text-center"
                : "bg-[#110c08] border border-white/40 shadow-[0_18px_50px_rgba(0,0,0,0.7)] p-6 space-y-3 rounded-[10px] text-center text-[#dec28e]"
            }
          >
            <div className={isL2 ? "text-lg font-semibold text-[#e8c56e]" : "text-lg font-semibold text-[#f0e2b0]"}>{title}</div>
            <p className={isL2 ? "text-sm text-[#d4c4a8]" : "text-sm text-[#f4e2b8]"}>{emptyMessage}</p>
            <button
              onClick={() => navigate("/city")}
              className={
                isL2
                  ? "px-4 py-2 bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32] rounded-md text-sm text-[#c9a44c] hover:border-[#c7ad80]/45"
                  : "px-4 py-2 bg-[#2c220f] border border-white/50 rounded-md text-sm"
              }
            >
              {backLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Використовуємо виправлену професію або поточну
  const currentProfession = fixedHero.profession || hero.profession;
  const heroProfessionId =
    normalizeProfessionId(currentProfession as ProfessionId | string | null) ?? defaultProfession;
  
  // ДОДАТКОВА ПЕРЕВІРКА: якщо професія не відповідає расі, використовуємо defaultProfession
  const race = (hero.race || "").toLowerCase();
  const isDarkElf = race.includes("dark") || race.includes("темный") || race.includes("темний");
  const isDwarf = race.includes("dwarf") || race.includes("гном") || race.includes("dwarven");
  const professionStr = (heroProfessionId || "").toLowerCase();
  const isHumanProfession = professionStr.includes("human_mystic") || professionStr.includes("human_fighter");
  
  // Якщо Dark Elf має human_mystic професію - використовуємо правильну
  // Якщо Dwarf має human_fighter професію - використовуємо правильну
  const chosenProfession = 
    (isDarkElf && professionStr.includes("human_mystic")) || 
    (isDwarf && professionStr.includes("human_fighter"))
      ? defaultProfession 
      : heroProfessionId;

  // ДОДАТКОВЕ ЛОГУВАННЯ ДЛЯ ДІАГНОСТИКИ
  console.log(`[GuildScreen] 📊 Діагностика професії:`, {
    race: hero.race,
    klass: hero.klass,
    heroProfession: hero.profession,
    heroProfessionId,
    defaultProfession,
    chosenProfession,
    isDarkElf,
    isHumanProfession,
    level: heroLevel,
  });

  const nextProfessions = PROFESSION_CHAIN[chosenProfession] || [];
  console.log(`[GuildScreen] 🔗 Наступні професії для "${chosenProfession}":`, {
    nextProfessions,
    heroLevel,
    professionChain: PROFESSION_CHAIN[chosenProfession],
  });
  const nextOptions = nextProfessions
    .map((pid) => {
      const def = getProfessionDefinition(pid);
      const canChoose = def && heroLevel >= (def?.minLevel ?? 1);
      console.log(`[GuildScreen] 📋 Професія "${pid}":`, {
        def: def ? { label: def.label, minLevel: def.minLevel } : null,
        heroLevel,
        canChoose,
      });
      return {
        id: pid,
        def,
        canChoose,
      };
    })
    .filter((p) => p.def && p.canChoose) as { id: ProfessionId; def: any }[];
  const completedQuestIds = hero.completedQuests ?? [];
  const elvenFirstProfQuestDone = completedQuestIds.includes(ELVEN_MYSTIC_FIRST_PROF_QUEST_ID);
  const elvenFighterFirstProfQuestDone = completedQuestIds.includes(ELVEN_FIGHTER_FIRST_PROF_QUEST_ID);
  const humanFighterFirstProfQuestDone = completedQuestIds.includes(HUMAN_FIGHTER_FIRST_PROF_QUEST_ID);
  const humanMysticFirstProfQuestDone = completedQuestIds.includes(HUMAN_MYSTIC_FIRST_PROF_QUEST_ID);
  const darkFighterFirstProfQuestDone = completedQuestIds.includes(DARK_FIGHTER_FIRST_PROF_QUEST_ID);
  const darkMysticFirstProfQuestDone = completedQuestIds.includes(DARK_MYSTIC_FIRST_PROF_QUEST_ID);
  const orcFighterFirstProfQuestDone = completedQuestIds.includes(ORC_FIGHTER_FIRST_PROF_QUEST_ID);
  const orcMysticFirstProfQuestDone = completedQuestIds.includes(ORC_MYSTIC_FIRST_PROF_QUEST_ID);
  const dwarvenFighterFirstProfQuestDone = completedQuestIds.includes(DWARVEN_FIGHTER_FIRST_PROF_QUEST_ID);
  const needsElvenFirstProfQuest =
    isHeroElvenMysticBaseForFirstProfQuest(hero) && !elvenFirstProfQuestDone;
  const needsElvenFighterFirstProfQuest =
    isHeroElvenFighterBaseForFirstProfQuest(hero) && !elvenFighterFirstProfQuestDone;
  const needsHumanFighterFirstProfQuest =
    isHeroHumanFighterBaseForFirstProfQuest(hero) && !humanFighterFirstProfQuestDone;
  const needsHumanMysticFirstProfQuest =
    isHeroHumanMysticBaseForFirstProfQuest(hero) && !humanMysticFirstProfQuestDone;
  const needsDarkFighterFirstProfQuest =
    isHeroDarkFighterBaseForFirstProfQuest(hero) && !darkFighterFirstProfQuestDone;
  const needsDarkMysticFirstProfQuest =
    isHeroDarkMysticBaseForFirstProfQuest(hero) && !darkMysticFirstProfQuestDone;
  const needsOrcFighterFirstProfQuest =
    isHeroOrcFighterBaseForFirstProfQuest(hero) && !orcFighterFirstProfQuestDone;
  const needsOrcMysticFirstProfQuest =
    isHeroOrcMysticBaseForFirstProfQuest(hero) && !orcMysticFirstProfQuestDone;
  const needsDwarvenFighterFirstProfQuest =
    isHeroDwarvenFighterBaseForFirstProfQuest(hero) && !dwarvenFighterFirstProfQuestDone;
  const canChooseProfession =
    nextOptions.length > 0 &&
    !needsElvenFirstProfQuest &&
    !needsElvenFighterFirstProfQuest &&
    !needsHumanFighterFirstProfQuest &&
    !needsHumanMysticFirstProfQuest &&
    !needsDarkFighterFirstProfQuest &&
    !needsDarkMysticFirstProfQuest &&
    !needsOrcFighterFirstProfQuest &&
    !needsOrcMysticFirstProfQuest &&
    !needsDwarvenFighterFirstProfQuest;
  console.log(`[GuildScreen] ✅ Доступні професії для вибору:`, {
    count: nextOptions.length,
    options: nextOptions.map(o => ({ id: o.id, label: o.def?.label, minLevel: o.def?.minLevel })),
    needsElvenFirstProfQuest,
  });

  const availableSkills = getSkillsForProfession(chosenProfession);
  console.log(`[GuildScreen] 📚 Скіли для професії "${chosenProfession}":`, {
    count: availableSkills.length,
    skillIds: availableSkills.map(s => s.id),
    skillNames: availableSkills.map(s => s.name).slice(0, 10), // Перші 10 назв
  });
  
  // ❗ Універсальна логіка: скіли зникають після досягнення рівня наступної професії, якщо вона не вибрана
  // Але скіли з requiredLevel < рівня наступної професії завжди відображаються (якщо не вивчені)
  // 🎯 Скіли відкриваються по рівню: показуємо тільки скіли з requiredLevel <= heroLevel
  const available: SkillRow[] = availableSkills
    .map((sk) => {
      const entry = currentSkills.find((hs: any) => hs.id === sk.id);
      const currentLevel = entry?.level ?? 0;
      const levels = [...sk.levels].sort((a, b) => a.level - b.level);
      const nextLevelDef = levels.find((lvl) => lvl.level > currentLevel);
      if (!nextLevelDef) return null;

      const requiredLevel = nextLevelDef.requiredLevel ?? 1;
      const spCost = nextLevelDef.spCost ?? 0;
      
      // 🎯 Скіл відкривається тільки якщо рівень гравця >= requiredLevel
      if (heroLevel < requiredLevel) {
        return null; // Не показуємо скіли, які ще не відкрилися
      }
      
      const canLearn = heroLevel >= requiredLevel && heroSp >= spCost;

      // Перевіряємо, чи потрібно приховати цей рівень скіла
      const nextProfs = PROFESSION_CHAIN[chosenProfession] || [];
      let shouldHide = false;
      
      for (const nextProfId of nextProfs) {
        const nextProfDef = getProfessionDefinition(nextProfId);
        if (!nextProfDef) continue;
        
        const nextProfMinLevel = nextProfDef.minLevel || 1;
        
        // Якщо рівень досяг рівня наступної професії, але професія не вибрана
        if (heroLevel >= nextProfMinLevel && chosenProfession !== nextProfId) {
          // Якщо requiredLevel наступного рівня >= рівня наступної професії
          if (requiredLevel >= nextProfMinLevel) {
            // Перевіряємо, чи скіл належить до наступної професії
            const nextProfSkills = getSkillsForProfession(nextProfId);
            const isInNextProf = nextProfSkills.some(s => s.id === sk.id);
            
            if (isInNextProf) {
              // Приховуємо скіли, які належать до наступної професії і мають requiredLevel >= рівня наступної професії
              shouldHide = true;
              break;
            }
          }
        }
      }
      
      // Якщо потрібно приховати - не показуємо цей рівень
      if (shouldHide) {
        return null;
      }

      return {
        skill: sk,
        currentLevel,
        nextLevel: nextLevelDef.level,
        requiredLevel,
        spCost,
        power: nextLevelDef.power ?? null,
        canLearn,
      };
    })
    .filter(Boolean) as SkillRow[];

  const chooseProfession = (id: ProfessionId) => updateHero({ profession: id });

  const buildSkillDesc = (skill: any, nextLevel: number) => {
    const normalizeBase = (text?: string) => {
      if (!text) return "Описание отсутствует.";
      
      // Розділяємо англійський та російський текст (якщо є подвійний перенос рядка)
      const parts = text.split(/\n\n|\r\n\r\n/);
      const russianPart = parts.length > 1 ? parts.slice(1).join("\n\n") : null;
      
      // Якщо є російський переклад, показуємо тільки його
      if (russianPart) {
        const rawRussian = russianPart.replace(/[^A-Za-z0-9А-Яа-яЁё:,.*_+\- \n\r]+/g, " ");
        const cleanedRussian = rawRussian.replace(/[ \t]+/g, " ").replace(/\n[ \t]*/g, "\n").trim();
        if (cleanedRussian) {
          return cleanedRussian;
        }
      }
      
      // Якщо немає російського перекладу, показуємо англійський (тимчасово)
      const englishPart = parts[0] || text;
      const rawEnglish = englishPart.replace(/[^A-Za-z0-9А-Яа-яЁё:,.*_+\- \n\r]+/g, " ");
      const cleanedEnglish = rawEnglish.replace(/[ \t]+/g, " ").replace(/\n[ \t]*/g, "\n").trim();
      return cleanedEnglish || "Описание отсутствует.";
    };
    const formatSeconds = (s?: number) => {
      if (!s || s <= 0) return "";
      if (s >= 60) return `${Math.round(s / 60)} мин.`;
      return `${s} сек.`;
    };
    const lvlDef = skill.levels.find((l: any) => l.level === nextLevel) ?? skill.levels[0];
    const effects =
      Array.isArray(skill.effects) && skill.effects.length
        ? skill.effects
            .map((eff: any) => {
              // Для multiplier режиму використовуємо eff.multiplier напряму
              let val: number;
              if (eff.mode === "multiplier") {
                val = typeof eff.multiplier === "number" ? eff.multiplier : 1;
              } else {
                // Для інших режимів використовуємо value або power
                const base =
                  typeof eff.value === "number"
                    ? eff.value
                    : typeof lvlDef?.power === "number"
                    ? lvlDef.power
                    : 0;
                val = base * (eff.multiplier ?? 1);
              }
              
              // Назви статів українською
              const statNames: Record<string, string> = {
                pAtk: "Физ. атака",
                pDef: "Физ. защита",
                mAtk: "Маг. атака",
                mDef: "Маг. защита",
                maxHp: "Макс. HP",
                maxMp: "Макс. MP",
                maxCp: "Макс. CP",
                critRate: "Шанс крита",
                critDamage: "Сила крита",
                accuracy: "Точность",
                evasion: "Уклонение",
                attackSpeed: "Скорость атаки",
                atkSpeed: "Скорость атаки",
                castSpeed: "Скорость каста",
                runSpeed: "Скорость бега",
                hpRegen: "Реген HP",
                mpRegen: "Реген MP",
                cpRegen: "Реген CP",
                attackRange: "Дальность",
                cooldownReduction: "Сокращение КД",
              };
              
              const statName = statNames[eff.stat] || eff.stat || "effect";
              const mode = eff.mode === "percent" ? "%" : eff.mode === "multiplier" ? "x" : "";
              return `${statName}: ${val}${mode}`;
            })
            .join(", ")
        : "";
    const detailParts: string[] = [];
    if (skill.powerType === "damage" && typeof lvlDef?.power === "number") detailParts.push(`Power ${lvlDef.power}`);
    if (skill.element) detailParts.push(`Элемент: ${skill.element}`);
    if (skill.duration) detailParts.push(`Длит.: ${formatSeconds(skill.duration)}`);
    if (skill.chance) detailParts.push(`Шанс: ${skill.chance}%`);
    if (skill.hpPerTick) detailParts.push(`HP тик: ${skill.hpPerTick}`);
    if (skill.mpPerTick) detailParts.push(`MP тик: ${skill.mpPerTick}`);
    if (effects) detailParts.push(effects);
    return [normalizeBase(skill.description), detailParts.filter(Boolean).join(" | ")].filter(Boolean).join(" | ");
  };

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#d4c4a8]`
          : "w-full text-white px-4 py-2"
      }
    >
      <div
        className={
          isL2
            ? "w-full max-w-[min(100%,28rem)] sm:max-w-xl mx-auto"
            : "w-full max-w-[min(100%,24rem)] mx-auto"
        }
      >
        <div className="space-y-3">
          <header
            className={
              isL2
                ? "text-center pb-3 border-b border-[#5c4a32]/45"
                : "text-center pb-3 border-b border-white/15"
            }
          >
            <h1
              className={
                isL2
                  ? "text-[14px] sm:text-[15px] font-semibold text-[#e8c56e] tracking-wide [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]"
                  : "text-[13px] font-semibold text-[#dec28e]"
              }
            >
              {title}
            </h1>
          </header>

          <div
            className={`flex items-center justify-between text-[12px] ${
              isL2 ? `${statPanelL2} text-[#8a7a60]` : `${statPanelClassic} text-gray-500`
            }`}
          >
            <div>
              Класс:{" "}
              <span className={isL2 ? "text-[#c9a44c] font-semibold" : "text-[#87ceeb] font-semibold"}>{hero.klass}</span>
              <div className={isL2 ? "text-[#8a7a60] text-[11px] mt-0.5" : "text-gray-500 text-[11px] mt-0.5"}>
                Профессия:{" "}
                <span className={isL2 ? "text-[#d4786a] font-semibold" : "text-red-500 font-semibold"}>
                  {getProfessionDefinition(chosenProfession)?.label || "—"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div>
                SP:{" "}
                <span className={isL2 ? "text-[#e8c56e] font-semibold" : "text-[#daa520] font-semibold"}>{heroSp}</span>
              </div>
              <div>
                Lv:{" "}
                <span className={isL2 ? "text-[#d4c4a8] font-semibold" : "text-[#e0e0e0] font-semibold"}>{heroLevel}</span>
              </div>
            </div>
          </div>

          {needsElvenFirstProfQuest && heroLevel >= 18 && (
            <div
              className={
                isL2
                  ? "p-3 space-y-2 rounded-lg border border-amber-900/40 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
                  : "p-3 space-y-2 rounded-lg border border-amber-700/30 bg-black/20"
              }
            >
              <div className="flex items-start gap-2">
                <img src="/nps/6.png" alt="" className="w-8 h-8 object-contain shrink-0 opacity-95 mt-0.5" />
                <div className="text-[11px] leading-snug space-y-2">
                  <div className={isL2 ? "text-[#e8c56e] font-semibold" : "text-amber-200 font-semibold"}>
                    Возьмите квест для профессии!
                  </div>
                  <p className={isL2 ? "text-[#c9b99a]" : "text-[#e8dcc8]"}>
                    Во вкладке «Квесты» примите «Путь мага Эльфов — отзвуки стихий»: квестовые эссенции с Lirein, Will-O-Wisp
                    и Undine в окрестностях Floran Village. После сдачи на 20 уровне здесь появится выбор профессии.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/quests")}
                    className={
                      isL2
                        ? "text-[11px] font-semibold text-[#c9a44c] hover:text-[#f0e0c0] underline underline-offset-2"
                        : "text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline"
                    }
                  >
                    Открыть «Квесты» →
                  </button>
                </div>
              </div>
            </div>
          )}

          {needsElvenFighterFirstProfQuest && heroLevel >= 18 && (
            <div
              className={
                isL2
                  ? "p-3 space-y-2 rounded-lg border border-amber-900/40 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
                  : "p-3 space-y-2 rounded-lg border border-amber-700/30 bg-black/20"
              }
            >
              <div className="flex items-start gap-2">
                <img src="/nps/6.png" alt="" className="w-8 h-8 object-contain shrink-0 opacity-95 mt-0.5" />
                <div className="text-[11px] leading-snug space-y-2">
                  <div className={isL2 ? "text-[#e8c56e] font-semibold" : "text-amber-200 font-semibold"}>
                    Возьмите квест для профессии!
                  </div>
                  <p className={isL2 ? "text-[#c9b99a]" : "text-[#e8dcc8]"}>
                    Во вкладке «Квесты» примите «Путь воина Эльфов — трофеи»: добудьте клыки с Venomous Spider, листья
                    с Lirein, кости с Tracker Skeleton Leader и жетоны с Boogle Ratman Leader в зонах Floran Village.
                    После сдачи на 20 уровне здесь появится выбор первой профессии.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/quests")}
                    className={
                      isL2
                        ? "text-[11px] font-semibold text-[#c9a44c] hover:text-[#f0e0c0] underline underline-offset-2"
                        : "text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline"
                    }
                  >
                    Открыть «Квесты» →
                  </button>
                </div>
              </div>
            </div>
          )}

          {needsHumanFighterFirstProfQuest && heroLevel >= 18 && (
            <div
              className={
                isL2
                  ? "p-3 space-y-2 rounded-lg border border-amber-900/40 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
                  : "p-3 space-y-2 rounded-lg border border-amber-700/30 bg-black/20"
              }
            >
              <div className="flex items-start gap-2">
                <img src="/nps/6.png" alt="" className="w-8 h-8 object-contain shrink-0 opacity-95 mt-0.5" />
                <div className="text-[11px] leading-snug space-y-2">
                  <div className={isL2 ? "text-[#e8c56e] font-semibold" : "text-amber-200 font-semibold"}>
                    Возьмите квест для профессии!
                  </div>
                  <p className={isL2 ? "text-[#c9b99a]" : "text-[#e8dcc8]"}>
                    Во вкладке «Квесты» примите «Путь человека-воина — реагенты для первой профессии»: добудьте реагенты с
                    Evil Eye Seer, Arachnid Tracker, Stink Zombie и Skeleton Scout в окрестностях Gludin Village (количество
                    и бонус к награде определяются при приёме). После сдачи на 20 уровне здесь появится выбор первой
                    профессии.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/quests")}
                    className={
                      isL2
                        ? "text-[11px] font-semibold text-[#c9a44c] hover:text-[#f0e0c0] underline underline-offset-2"
                        : "text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline"
                    }
                  >
                    Открыть «Квесты» →
                  </button>
                </div>
              </div>
            </div>
          )}

          {needsHumanMysticFirstProfQuest && heroLevel >= 18 && (
            <div
              className={
                isL2
                  ? "p-3 space-y-2 rounded-lg border border-amber-900/40 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
                  : "p-3 space-y-2 rounded-lg border border-amber-700/30 bg-black/20"
              }
            >
              <div className="flex items-start gap-2">
                <img src="/nps/6.png" alt="" className="w-8 h-8 object-contain shrink-0 opacity-95 mt-0.5" />
                <div className="text-[11px] leading-snug space-y-2">
                  <div className={isL2 ? "text-[#e8c56e] font-semibold" : "text-amber-200 font-semibold"}>
                    Возьмите квест для профессии!
                  </div>
                  <p className={isL2 ? "text-[#c9b99a]" : "text-[#e8dcc8]"}>
                    Во вкладке «Квесты» примите «Путь человека-мага — эссенции для первой профессии»: соберите эссенции с
                    Lirein Elder, Salamander Noble, Undine Noble и Undead Slave в Gludin Village. После сдачи на 20 уровне
                    откроется выбор Cleric / Wizard.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/quests")}
                    className={
                      isL2
                        ? "text-[11px] font-semibold text-[#c9a44c] hover:text-[#f0e0c0] underline underline-offset-2"
                        : "text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline"
                    }
                  >
                    Открыть «Квесты» →
                  </button>
                </div>
              </div>
            </div>
          )}

          {needsDarkFighterFirstProfQuest && heroLevel >= 18 && (
            <div
              className={
                isL2
                  ? "p-3 space-y-2 rounded-lg border border-amber-900/40 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
                  : "p-3 space-y-2 rounded-lg border border-amber-700/30 bg-black/20"
              }
            >
              <div className="flex items-start gap-2">
                <img src="/nps/6.png" alt="" className="w-8 h-8 object-contain shrink-0 opacity-95 mt-0.5" />
                <div className="text-[11px] leading-snug space-y-2">
                  <div className={isL2 ? "text-[#e8c56e] font-semibold" : "text-amber-200 font-semibold"}>
                    Возьмите квест для профессии!
                  </div>
                  <p className={isL2 ? "text-[#c9b99a]" : "text-[#e8dcc8]"}>
                    Во вкладке «Квесты» примите «Путь тёмного эльфа-воина — эффигии кошмара»: трофеи с Lesser Dark Horror,
                    Shade Horror, Crypt Horror и Oblivion Watcher в зонах Floran Village (объёмы и бонус — при приёме).
                    После сдачи на 20 уровне откроется выбор первой профессии.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/quests")}
                    className={
                      isL2
                        ? "text-[11px] font-semibold text-[#c9a44c] hover:text-[#f0e0c0] underline underline-offset-2"
                        : "text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline"
                    }
                  >
                    Открыть «Квесты» →
                  </button>
                </div>
              </div>
            </div>
          )}

          {needsDarkMysticFirstProfQuest && heroLevel >= 18 && (
            <div
              className={
                isL2
                  ? "p-3 space-y-2 rounded-lg border border-amber-900/40 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
                  : "p-3 space-y-2 rounded-lg border border-amber-700/30 bg-black/20"
              }
            >
              <div className="flex items-start gap-2">
                <img src="/nps/6.png" alt="" className="w-8 h-8 object-contain shrink-0 opacity-95 mt-0.5" />
                <div className="text-[11px] leading-snug space-y-2">
                  <div className={isL2 ? "text-[#e8c56e] font-semibold" : "text-amber-200 font-semibold"}>
                    Возьмите квест для профессии!
                  </div>
                  <p className={isL2 ? "text-[#c9b99a]" : "text-[#e8dcc8]"}>
                    Примите «Путь тёмного эльфа-мага — знаки стихий»: конденсаты с Will-O-Wisp, Mana Seeker, Scarlet
                    Salamander и Undine в Floran Village. Доп. награда показывается в активном квесте.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/quests")}
                    className={
                      isL2
                        ? "text-[11px] font-semibold text-[#c9a44c] hover:text-[#f0e0c0] underline underline-offset-2"
                        : "text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline"
                    }
                  >
                    Открыть «Квесты» →
                  </button>
                </div>
              </div>
            </div>
          )}

          {needsOrcFighterFirstProfQuest && heroLevel >= 18 && (
            <div
              className={
                isL2
                  ? "p-3 space-y-2 rounded-lg border border-amber-900/40 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
                  : "p-3 space-y-2 rounded-lg border border-amber-700/30 bg-black/20"
              }
            >
              <div className="flex items-start gap-2">
                <img src="/nps/6.png" alt="" className="w-8 h-8 object-contain shrink-0 opacity-95 mt-0.5" />
                <div className="text-[11px] leading-snug space-y-2">
                  <div className={isL2 ? "text-[#e8c56e] font-semibold" : "text-amber-200 font-semibold"}>
                    Возьмите квест для профессии!
                  </div>
                  <p className={isL2 ? "text-[#c9b99a]" : "text-[#e8dcc8]"}>
                    Во вкладке «Квесты» примите «Путь орка-воина — тотемы клана»: трофеи у Vuku Orc Fighter, Vuku Orc Archer,
                    Enku Orc Shaman и Enku Orc Champion в Gludin Village (объёмы и бонус — при приёме).
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/quests")}
                    className={
                      isL2
                        ? "text-[11px] font-semibold text-[#c9a44c] hover:text-[#f0e0c0] underline underline-offset-2"
                        : "text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline"
                    }
                  >
                    Открыть «Квесты» →
                  </button>
                </div>
              </div>
            </div>
          )}

          {needsOrcMysticFirstProfQuest && heroLevel >= 18 && (
            <div
              className={
                isL2
                  ? "p-3 space-y-2 rounded-lg border border-amber-900/40 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
                  : "p-3 space-y-2 rounded-lg border border-amber-700/30 bg-black/20"
              }
            >
              <div className="flex items-start gap-2">
                <img src="/nps/6.png" alt="" className="w-8 h-8 object-contain shrink-0 opacity-95 mt-0.5" />
                <div className="text-[11px] leading-snug space-y-2">
                  <div className={isL2 ? "text-[#e8c56e] font-semibold" : "text-amber-200 font-semibold"}>
                    Возьмите квест для профессии!
                  </div>
                  <p className={isL2 ? "text-[#c9b99a]" : "text-[#e8dcc8]"}>
                    Примите «Путь орка-шамана — обереги стихий»: материалы с Orc Shaman, Enku Orc Shaman, Mana Seeker и
                    Will-O-Wisp в Gludin Village.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/quests")}
                    className={
                      isL2
                        ? "text-[11px] font-semibold text-[#c9a44c] hover:text-[#f0e0c0] underline underline-offset-2"
                        : "text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline"
                    }
                  >
                    Открыть «Квесты» →
                  </button>
                </div>
              </div>
            </div>
          )}

          {needsDwarvenFighterFirstProfQuest && heroLevel >= 18 && (
            <div
              className={
                isL2
                  ? "p-3 space-y-2 rounded-lg border border-amber-900/40 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
                  : "p-3 space-y-2 rounded-lg border border-amber-700/30 bg-black/20"
              }
            >
              <div className="flex items-start gap-2">
                <img src="/nps/6.png" alt="" className="w-8 h-8 object-contain shrink-0 opacity-95 mt-0.5" />
                <div className="text-[11px] leading-snug space-y-2">
                  <div className={isL2 ? "text-[#e8c56e] font-semibold" : "text-amber-200 font-semibold"}>
                    Возьмите квест для профессии!
                  </div>
                  <p className={isL2 ? "text-[#c9b99a]" : "text-[#e8dcc8]"}>
                    Примите «Путь гнома — образцы руин и шахт»: компоненты с Pitchstone Golem, Dwarf Ghost, Ruin Imp и
                    Obsidian Golem в Gludin Village (объёмы и бонус — при приёме).
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/quests")}
                    className={
                      isL2
                        ? "text-[11px] font-semibold text-[#c9a44c] hover:text-[#f0e0c0] underline underline-offset-2"
                        : "text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline"
                    }
                  >
                    Открыть «Квесты» →
                  </button>
                </div>
              </div>
            </div>
          )}

          {canChooseProfession && (
            <div
              className={
                isL2
                  ? "p-3 space-y-2 rounded-lg border border-[#5c4a32]/50 bg-black/20 shadow-[inset_0_1px_0_rgba(199,173,128,0.05)]"
                  : "p-3 space-y-2 rounded-lg border border-[#c7ad80]/20 bg-black/15"
              }
            >
              <div
                className={
                  isL2
                    ? "text-[12px] text-[#e8c56e] font-semibold text-center [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
                    : "text-[12px] text-[#f4e2b8] font-semibold text-center"
                }
              >
                {selectProfessionTitle}
              </div>
              {nextOptions.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => chooseProfession(entry.id)}
                  className={isL2 ? professionBtnL2 : professionBtnClassic}
                >
                  {entry.def?.label}{" "}
                  <span className={isL2 ? "text-[#a89470] font-normal" : "text-black/70 font-normal"}>
                    (треб. лвл {entry.def?.minLevel ?? 1})
                  </span>
                </button>
              ))}
            </div>
          )}

          {available.length === 0 && (
            <div className={isL2 ? "text-center text-[#8a7a60] text-sm py-2" : "text-center text-[#9f8d73] text-sm py-2"}>
              {emptyMessage}
            </div>
          )}

          <div className="space-y-2">
            {available.map(({ skill, currentLevel, nextLevel, requiredLevel, spCost, power, canLearn }) => {
              const normalizeDescription = (text?: string) => {
                const raw = (text || "").replace(/[^A-Za-z0-9А-Яа-яЁё:,.*_+\- ]+/g, " ");
                const cleaned = raw.replace(/\s+/g, " ").trim();
                if (!cleaned) return "Описание отсутствует.";
                return cleaned;
              };
              const desc = buildSkillDesc(skill, nextLevel);
              // Спеціальна обробка для Light Armor Mastery (skill 227) для Rogue
              // Спеціальна обробка для Guts (skill 139) для OrcRaider
              let iconSrc = skill.icon || "/skills/attack.jpg";
              if (skill.id === 227 && (skill as any).code === "HF_0227") {
                iconSrc = "/skills/skill0233.gif";
                console.log(`[GuildScreen] 🔍 Skill 227 (${skill.name}) icon:`, {
                  skillIcon: skill.icon,
                  finalIcon: iconSrc,
                  skillId: skill.id,
                  skillCode: (skill as any).code
                });
              } else if (skill.id === 139 && (skill as any).code === "OR_0139") {
                iconSrc = "/skills/skill0139.gif";
                console.log(`[GuildScreen] 🔍 Skill 139 (Guts) icon:`, {
                  skillIcon: skill.icon,
                  finalIcon: iconSrc,
                  skillId: skill.id,
                  skillCode: (skill as any).code
                });
              }
              return (
                <div key={skill.id} className={isL2 ? skillCardL2 : skillCardClassic}>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={
                            isL2
                              ? "text-[13px] font-semibold text-[#e8dcc8] leading-tight flex items-center gap-2"
                              : "text-[13px] font-semibold text-[#d3d3d3] leading-tight flex items-center gap-2"
                          }
                        >
                          <span>{skill.name}</span>
                          <span className={isL2 ? "text-[#c9a44c]" : "text-[#d3d3d3]"}>Lv {nextLevel}</span>
                        </div>
                        <div className={isL2 ? "text-[11px] text-[#a89470] shrink-0" : "text-[11px] text-[#ff6b6b] shrink-0"}>
                          Текущий: {currentLevel}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <img
                          src={iconSrc}
                          alt={skill.name}
                          className={
                            isL2
                              ? "w-6 h-6 object-cover rounded-[3px] flex-shrink-0 mt-0.5 border border-[#5c4a32]/40"
                              : "w-6 h-6 object-cover rounded-[3px] flex-shrink-0 mt-0.5 border border-white/15"
                          }
                          onError={(e) => {
                            console.error(`[GuildScreen] ❌ Помилка завантаження іконки для skill ${skill.id}:`, iconSrc);
                            (e.target as HTMLImageElement).src = "/skills/attack.jpg";
                          }}
                        />
                        <div
                          className={
                            isL2
                              ? "text-[11px] text-[#8a7a60] leading-snug whitespace-pre-line flex-1"
                              : "text-[11px] text-gray-500 leading-snug whitespace-pre-line flex-1"
                          }
                        >
                          {desc}
                        </div>
                      </div>
                      <div
                        className={
                          isL2
                            ? "flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#7d9b7a]"
                            : "flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#228b22]"
                        }
                      >
                        <span>Эффект: {power ?? "—"}</span>
                        <span>Требуемый уровень: {requiredLevel}</span>
                        <span>SP: {spCost}</span>
                      </div>
                      <div
                        className={
                          isL2
                            ? "pt-1 border-t border-[#5c4a32]/30 mt-1.5"
                            : "pt-1 border-t border-white/10 mt-1.5"
                        }
                      >
                        {canLearn ? (
                          <button
                            type="button"
                            onClick={() => handleLearnSkill(skill.id, requiredLevel, spCost)}
                            className={
                              isL2
                                ? "text-[11px] text-[#c9a44c] cursor-pointer hover:text-[#e8c56e] underline-offset-2 hover:underline bg-transparent border-0 p-0 font-medium"
                                : "text-[11px] text-orange-500 cursor-pointer hover:text-orange-400 bg-transparent border-0 p-0"
                            }
                          >
                            {learnLabel}
                          </button>
                        ) : (
                          <span className={isL2 ? "text-[11px] text-[#6a5c48] cursor-not-allowed" : "text-[11px] text-gray-500 cursor-not-allowed"}>
                            Недоступно
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => navigate("/city")}
              className={
                isL2
                  ? "text-sm text-[#c9a44c] cursor-pointer hover:text-[#e8c56e] py-1.5 px-3 rounded-md border border-[#5c4a32]/60 bg-gradient-to-b from-[#2a2419]/80 to-transparent hover:border-[#c7ad80]/40"
                  : "text-sm text-red-600 cursor-pointer hover:text-red-500 bg-transparent border-0"
              }
            >
              {backLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
