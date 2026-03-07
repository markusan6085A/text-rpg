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
import { fixHeroProfession } from "../../utils/fixProfession";
import { learnSkillLogic } from "../../state/heroStore/heroSkills";

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

const professionChain: Record<ProfessionId, ProfessionId[]> = {
  // Human Fighter chain
  human_fighter: ["human_fighter_warrior", "human_fighter_human_knight", "human_fighter_rogue"],
  human_fighter_warrior: ["human_fighter_gladiator", "human_fighter_warlord"],
  human_fighter_human_knight: ["human_fighter_paladin", "human_fighter_dark_avenger"],
  human_fighter_gladiator: ["human_fighter_duelist"],
  human_fighter_duelist: [],
  human_fighter_warlord: ["human_fighter_dreadnought"],
  human_fighter_dreadnought: [],
  human_fighter_paladin: ["human_fighter_phoenix_knight"],
  human_fighter_phoenix_knight: [],
  human_fighter_hell_knight: [],
  human_fighter_dark_avenger: ["human_fighter_hell_knight"],
  human_fighter_titan: [],
  human_fighter_rogue: ["human_fighter_hawkeye", "human_fighter_treasure_hunter"],
  human_fighter_hawkeye: ["human_fighter_sagittarius"],
  human_fighter_treasure_hunter: ["human_fighter_adventurer"],
  human_fighter_sagittarius: [],
  human_fighter_adventurer: [],
  human_mystic_base: ["human_mystic_cleric", "human_mystic_wizard"],
  human_mystic_cleric: ["human_mystic_bishop", "human_mystic_prophet"],
  human_mystic_wizard: ["human_mystic_sorcerer", "human_mystic_necromancer", "human_mystic_warlock"],
  human_mystic_bishop: ["human_mystic_cardinal"],
  human_mystic_prophet: ["human_mystic_hierophant"],
  human_mystic_hierophant: [],
  human_mystic_cardinal: [],
  human_mystic_warlock: ["human_mystic_arcana_lord"],
  human_mystic_sorcerer: ["human_mystic_archmage"],
  human_mystic_necromancer: ["human_mystic_soultaker"],
  human_mystic_archmage: [],
  human_mystic_soultaker: [],
  human_mystic_arcana_lord: [],
  dark_mystic_base: ["dark_mystic_oracle", "dark_mystic_dark_wizard"],
  dark_mystic_oracle: ["dark_mystic_shillien_elder"],
  dark_mystic_dark_wizard: ["dark_mystic_spellhowler", "dark_mystic_phantom_summoner"],
  dark_mystic_spellhowler: ["dark_mystic_storm_screamer"],
  dark_mystic_storm_screamer: [],
  dark_mystic_shillien_elder: ["dark_mystic_shillien_saint"],
  dark_mystic_shillien_saint: [],
  dark_mystic_phantom_summoner: ["dark_mystic_spectral_master"],
  dark_mystic_spectral_master: [],
  // Orc Fighter chain
  orc_fighter: ["orc_fighter_raider", "orc_fighter_monk"],
  orc_fighter_raider: ["orc_fighter_destroyer"],
  orc_fighter_destroyer: ["orc_fighter_titan"],
  orc_fighter_titan: [],
  orc_fighter_monk: ["orc_fighter_tyrant"],
  orc_fighter_tyrant: ["orc_fighter_grand_khavatari"],
  orc_fighter_grand_khavatari: [],
  // Orc Mystic chain
  orc_mystic_base: ["orc_mystic_shaman"],
  orc_mystic_shaman: ["orc_mystic_warcryer", "orc_mystic_overlord"],
  orc_mystic_warcryer: ["orc_mystic_doomcryer"],
  orc_mystic_doomcryer: [],
  orc_mystic_overlord: ["orc_mystic_dominator"],
  orc_mystic_dominator: [],
  // Dwarven Fighter chain
  dwarven_fighter: ["dwarven_fighter_scavenger", "dwarven_fighter_artisan"],
  dwarven_fighter_scavenger: ["dwarven_fighter_bounty_hunter"],
  dwarven_fighter_bounty_hunter: ["dwarven_fighter_fortune_seeker"],
  dwarven_fighter_fortune_seeker: [],
  dwarven_fighter_artisan: ["dwarven_fighter_warsmith"],
  dwarven_fighter_warsmith: ["dwarven_fighter_maestro"],
  dwarven_fighter_maestro: [],
  // Elven Fighter chain
  elven_fighter: ["elven_fighter_elven_knight", "elven_fighter_elven_scout"],
  elven_fighter_elven_knight: ["elven_fighter_swordsinger", "elven_fighter_temple_knight"],
  elven_fighter_swordsinger: ["elven_fighter_sword_muse"],
  elven_fighter_sword_muse: [],
  elven_fighter_temple_knight: ["elven_fighter_evas_templar"],
  elven_fighter_evas_templar: [],
  elven_fighter_elven_scout: ["elven_fighter_silver_ranger", "elven_fighter_plainswalker"],
  elven_fighter_silver_ranger: ["elven_fighter_moonlight_sentinel"],
  elven_fighter_moonlight_sentinel: [],
  elven_fighter_plainswalker: ["elven_fighter_wind_rider"],
  elven_fighter_wind_rider: [],
  // Elven Mystic chain
  elven_mystic: ["elven_mystic_oracle", "elven_mystic_elven_wizard"],
  elven_mystic_oracle: ["elven_mystic_elven_elder"],
  elven_mystic_elven_elder: ["elven_mystic_evas_saint"],
  elven_mystic_evas_saint: [],
  elven_mystic_elven_wizard: ["elven_mystic_elemental_summoner", "elven_mystic_spellsinger"],
  elven_mystic_elemental_summoner: ["elven_mystic_elemental_master"],
  elven_mystic_elemental_master: [],
  elven_mystic_spellsinger: ["elven_mystic_mystic_muse"],
  elven_mystic_mystic_muse: [],
  // Dark Fighter chain
  dark_fighter: ["dark_fighter_assassin", "dark_fighter_palus_knight"],
  dark_fighter_assassin: ["dark_fighter_phantom_ranger"],
  dark_fighter_phantom_ranger: ["dark_fighter_ghost_sentinel"],
  dark_fighter_ghost_sentinel: [],
  dark_fighter_palus_knight: ["dark_fighter_shillien_knight", "dark_fighter_bladedancer"],
  dark_fighter_shillien_knight: ["dark_fighter_shillien_templar"],
  dark_fighter_shillien_templar: [],
  dark_fighter_bladedancer: ["dark_fighter_spectral_dancer"],
  dark_fighter_spectral_dancer: [],
};

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
        showToast("Не вдалося вивчити скіл. Можливо, не вистачає SP або рівня.", "error");
        return;
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

  if (!hero) {
    return (
      <div className="w-full text-white flex items-center justify-center">
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
      <div className="min-h-screen bg-[#1a1814] text-white flex justify-center px-3 py-4">
        <div className="w-full max-w-[420px]">
          <div className="bg-[#110c08] border border-white/40 shadow-[0_18px_50px_rgba(0,0,0,0.7)] p-6 space-y-3 rounded-[10px] text-center text-[#dec28e]">
            <div className="text-lg font-semibold text-[#f0e2b0]">{title}</div>
            <p className="text-sm text-[#f4e2b8]">{emptyMessage}</p>
            <button
              onClick={() => navigate("/city")}
              className="px-4 py-2 bg-[#2c220f] border border-white/50 rounded-md text-sm"
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

  const nextProfessions = professionChain[chosenProfession] || [];
  console.log(`[GuildScreen] 🔗 Наступні професії для "${chosenProfession}":`, {
    nextProfessions,
    heroLevel,
    professionChain: professionChain[chosenProfession],
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
  const canChooseProfession = nextOptions.length > 0;
  console.log(`[GuildScreen] ✅ Доступні професії для вибору:`, {
    count: nextOptions.length,
    options: nextOptions.map(o => ({ id: o.id, label: o.def?.label, minLevel: o.def?.minLevel })),
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
      const nextProfs = professionChain[chosenProfession] || [];
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
    <div className="w-full text-white px-4 py-2">
      <div className="w-full max-w-[360px] mx-auto">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[12px] text-gray-500">
            <div>
              Класс: <span className="text-[#87ceeb] font-semibold">{hero.klass}</span>
              <div className="text-gray-500 text-[11px]">
                Профессия:{" "}
                <span className="text-red-500 font-semibold">
                  {getProfessionDefinition(chosenProfession)?.label || "—"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div>
                SP: <span className="text-[#daa520] font-semibold">{heroSp}</span>
              </div>
              <div>
                Lv: <span className="text-[#e0e0e0] font-semibold">{heroLevel}</span>
              </div>
            </div>
          </div>

          {canChooseProfession && (
            <div className="p-3 space-y-2 text-sm text-[#dec28e]">
              <div className="text-[12px] text-[#f4e2b8] font-semibold text-center">
                {selectProfessionTitle}
              </div>
              {nextOptions.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => chooseProfession(entry.id)}
                  className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-[#725024] to-[#c08c3c] text-[12px] font-semibold text-black"
                >
                  {entry.def?.label} (треб. лвл {entry.def?.minLevel ?? 1})
                </button>
              ))}
            </div>
          )}

          {available.length === 0 && (
            <div className="text-center text-[#9f8d73] text-sm">{emptyMessage}</div>
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
                <div key={skill.id} className="p-2">
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-[13px] font-semibold text-[#d3d3d3] leading-tight flex items-center gap-2">
                          <span>{skill.name}</span>
                          <span className="text-[#d3d3d3]">Lv {nextLevel}</span>
                        </div>
                        <div className="text-[11px] text-[#ff6b6b]">Текущий: {currentLevel}</div>
                      </div>
                      <div className="flex items-start gap-2">
                        <img
                          src={iconSrc}
                          alt={skill.name}
                          className="w-6 h-6 object-cover rounded-[3px] flex-shrink-0 mt-0.5"
                          onError={(e) => {
                            console.error(`[GuildScreen] ❌ Помилка завантаження іконки для skill ${skill.id}:`, iconSrc);
                            (e.target as HTMLImageElement).src = "/skills/attack.jpg";
                          }}
                        />
                        <div className="text-[11px] text-gray-500 leading-snug whitespace-pre-line flex-1">{desc}</div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-[11px] text-[#228b22]">
                        <span>Эффект: {power ?? "—"}</span>
                        <span>Требуемый уровень: {requiredLevel}</span>
                        <span>SP: {spCost}</span>
                      </div>
                      <div className="pt-1">
                        {canLearn ? (
                          <span
                            onClick={() => handleLearnSkill(skill.id, requiredLevel, spCost)}
                            className="text-[11px] text-orange-500 cursor-pointer hover:text-orange-400"
                          >
                            {learnLabel}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-500 cursor-not-allowed">
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
            <span
              onClick={() => navigate("/city")}
              className="text-sm text-red-600 cursor-pointer hover:text-red-500"
            >
              {backLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
