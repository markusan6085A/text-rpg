import React, { useState, useEffect, useMemo } from "react";
import { getPublicCharacter, getCharacterByName, type Character } from "../utils/api";
import { getSkillDef } from "../state/battle/loadout";
import { normalizeProfessionId, getProfessionDefinition } from "../data/skills";
import { useHeroStore } from "../state/heroStore";
import { getNickColorStyle } from "../utils/nickColor";
import { processSkillEffects } from "../state/battle/actions/useSkill/buffHelpers";

interface PlayerAdminActionsProps {
  navigate: (path: string) => void;
  playerId?: string;
  playerName?: string;
}

export default function PlayerAdminActions({ navigate, playerId, playerName }: PlayerAdminActionsProps) {
  const hero = useHeroStore((s) => s.hero);
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuffModal, setShowBuffModal] = useState(false);

  useEffect(() => {
    const loadPlayer = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let loadedCharacter: Character;
        if (playerId) {
          loadedCharacter = await getPublicCharacter(playerId);
        } else if (playerName) {
          loadedCharacter = await getCharacterByName(playerName);
        } else {
          throw new Error("playerId or playerName is required");
        }
        
        setCharacter(loadedCharacter);
      } catch (err: any) {
        setError(err?.message || "Помилка завантаження профілю гравця");
        console.error("[PlayerAdminActions] Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPlayer();
  }, [playerId, playerName]);

  // Конвертуємо Character в Hero формат
  const playerHero = useMemo(() => {
    if (!character) return null;

    const heroJson = character.heroJson || {};
    const professionRaw = heroJson.profession || character.classId || "";
    
    return {
      id: character.id,
      name: character.name,
      race: character.race,
      klass: character.classId,
      profession: professionRaw,
      level: character.level,
      skills: heroJson.skills || [],
      hp: heroJson.hp || heroJson.maxHp || 100,
      maxHp: heroJson.maxHp || 100,
      mp: heroJson.mp || heroJson.maxMp || 100,
      maxMp: heroJson.maxMp || 100,
    };
  }, [character]);

  // Отримуємо вивчені бафи гравця
  const playerBuffs = useMemo(() => {
    if (!playerHero || !playerHero.skills) {
      console.log('[PlayerAdminActions] No playerHero or skills:', { playerHero: !!playerHero, skills: playerHero?.skills });
      return [];
    }

    console.log('[PlayerAdminActions] Loading player buffs, skills count:', playerHero.skills.length);

    return playerHero.skills
      .map((learned: any) => {
        const skillDef = getSkillDef(learned.id);
        if (!skillDef || skillDef.category !== "buff") return null;

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
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [playerHero]);

  // Отримуємо мої buff скіли (для застосування)
  const myBuffSkills = useMemo(() => {
    if (!hero || !hero.skills) return [];

    return hero.skills
      .map((learned: any) => {
        const skillDef = getSkillDef(learned.id);
        if (!skillDef || skillDef.category !== "buff") return null;

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
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [hero]);

  // Отримуємо мої heal скіли
  const myHealSkills = useMemo(() => {
    if (!hero || !hero.skills) return [];

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
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [hero]);

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
      const result = await import("../utils/api").then(({ healPlayer }) => 
        healPlayer(character.id, healSkillId, healPower)
      );
      
      if (result.ok) {
        alert(`Игрок ${character.name} вылечен на ${result.healedHp || healPower} HP. Текущее HP: ${result.currentHp}`);
        // Перезавантажуємо профіль
        const loadPlayer = async () => {
          try {
            let loadedCharacter: Character;
            if (playerId) {
              loadedCharacter = await import("../utils/api").then(({ getPublicCharacter }) => getPublicCharacter(playerId));
            } else if (playerName) {
              loadedCharacter = await import("../utils/api").then(({ getCharacterByName }) => getCharacterByName(playerName));
            } else {
              return;
            }
            setCharacter(loadedCharacter);
          } catch (err: any) {
            console.error("[PlayerAdminActions] Error reloading:", err);
          }
        };
        loadPlayer();
      }
    } catch (err: any) {
      alert(`Ошибка лечения: ${err?.message || "Unknown error"}`);
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

      const result = await import("../utils/api").then(({ buffPlayer }) => 
        buffPlayer(character.id, buffSkillId, buffData)
      );
      
      if (result.ok) {
        // ❗ Не показуємо alert, не закриваємо модалку - просто перезавантажуємо дані
        // Перезавантажуємо профіль для оновлення бафів
        const loadPlayer = async () => {
          try {
            let loadedCharacter: Character;
            if (playerId) {
              loadedCharacter = await import("../utils/api").then(({ getPublicCharacter }) => getPublicCharacter(playerId));
            } else if (playerName) {
              loadedCharacter = await import("../utils/api").then(({ getCharacterByName }) => getCharacterByName(playerName));
            } else {
              return;
            }
            setCharacter(loadedCharacter);
          } catch (err: any) {
            console.error("[PlayerAdminActions] Error reloading:", err);
          }
        };
        loadPlayer();
        // Модалку не закриваємо - залишаємо відкритою для подальших бафів
      }
    } catch (err: any) {
      alert(`Ошибка применения бафа: ${err?.message || "Unknown error"}`);
      console.error("[PlayerAdminActions] Error buffing:", err);
    }
  };


  if (loading) {
    return (
      <div className="w-full flex items-center justify-center text-white text-sm py-10">
        Загрузка...
      </div>
    );
  }

  if (error || !character || !playerHero) {
    return (
      <div className="w-full flex flex-col items-center text-white text-sm py-10">
        <div className="text-red-400 mb-4">{error || "Профіль не знайдено"}</div>
        <button
          onClick={() => navigate(`/player/${character?.id || ""}`)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Назад
        </button>
      </div>
    );
  }

  const profession = playerHero.profession || character.classId || "";
  const profId = normalizeProfessionId(profession as any);
  const profDef = profId ? getProfessionDefinition(profId) : null;
  const professionLabel = profDef?.label || profession || "Нет";

  return (
    <div className="w-full flex flex-col items-center text-white">
      <div className="w-full max-w-[420px] mt-2 px-3">
        {/* Заголовок */}
        <div className="text-center text-[#dec28e] text-lg font-semibold mb-4">
          <div style={getNickColorStyle(character.name, hero)}>{character.name}</div>
          <div className="text-sm text-gray-400">{professionLabel} - {character.level} ур.</div>
        </div>

        {/* Кнопка бафу */}
        <div className="mb-4">
          <button
            onClick={() => setShowBuffModal(true)}
            className="w-full py-2 px-4 bg-green-900/50 border border-green-700 text-green-400 hover:bg-green-900/70 rounded text-sm"
          >
            Забафнуть игрока
          </button>
        </div>

        {/* Бафи гравця */}
        <div className="mb-4">
          <div className="text-[#dec28e] text-sm font-semibold mb-2 border-b border-gray-600 pb-1">
            Бафи
          </div>
          {playerBuffs.length === 0 ? (
            <div className="text-gray-500 text-xs py-2">Немає вивчених бафів</div>
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
                          (e.target as HTMLImageElement).src = "/skills/skill0000.gif";
                        }}
                      />
                      <div className="flex-1">
                        <div className="text-xs text-gray-400 leading-relaxed">
                          {russianDescription}
                        </div>
                        {formattedValues.length > 0 && (
                          <div className="text-xs text-[#228b22] mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                            {formattedValues.map((value, idx) => (
                              <span key={idx}>{value}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-px bg-gray-500 mt-2"></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Лікування */}
        {myHealSkills.length > 0 && (
          <div className="mb-4">
            <div className="text-[#dec28e] text-sm font-semibold mb-2 border-b border-gray-600 pb-1">
              Лікування
            </div>
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
                          (e.target as HTMLImageElement).src = "/skills/skill0000.gif";
                        }}
                      />
                      <div className="flex-1">
                        <div className="text-xs text-gray-400 leading-relaxed">
                          {russianDescription}
                        </div>
                        {healValues.length > 0 && (
                          <div className="text-xs text-[#228b22] mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                            {healValues.map((value, idx) => (
                              <span key={idx}>{value}</span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => handleHeal(heal.id, heal.power)}
                          className="mt-2 px-3 py-1 bg-green-900/50 border border-green-700 text-green-400 hover:bg-green-900/70 rounded text-[10px]"
                        >
                          Використати
                        </button>
                      </div>
                    </div>
                    <div className="w-full h-px bg-gray-500 mt-2"></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Модалка для застосування бафів */}
        {showBuffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowBuffModal(false)}>
            <div
              className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#dec28e]">Выберите баф для применения</h2>
                <button
                  className="text-gray-400 hover:text-white text-xl"
                  onClick={() => setShowBuffModal(false)}
                >
                  ×
                </button>
              </div>
              {myBuffSkills.length === 0 ? (
                <div className="text-gray-400 text-sm py-4">У вас нет изученных бафов</div>
              ) : (
                <div className="space-y-2">
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
                      <div key={buff.id} className="border-b border-gray-700 pb-2">
                        <div className="flex items-start gap-2">
                          <img
                            src={iconSrc}
                            alt={buff.name}
                            className="w-5 h-5 object-contain flex-shrink-0 mt-0.5"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/skills/skill0000.gif";
                            }}
                          />
                          <div className="flex-1">
                            <div className="text-xs text-gray-400 leading-relaxed">
                              {russianDescription}
                            </div>
                            {formattedValues.length > 0 && (
                              <div className="text-xs text-[#228b22] mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                                {formattedValues.map((value, idx) => (
                                  <span key={idx}>{value}</span>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={() => handleBuffPlayer(buff.id)}
                              className="mt-2 px-3 py-1 bg-green-900/50 border border-green-700 text-green-400 hover:bg-green-900/70 rounded text-[10px]"
                            >
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
          <button
            onClick={() => navigate(`/player/${character.id}`)}
            className="w-full py-2 px-4 bg-blue-900/50 border border-blue-700 text-blue-400 hover:bg-blue-900/70 rounded text-sm"
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
