import React, { useState, useEffect, useMemo } from "react";
import { getPublicCharacter, getCharacterByName, getSevenSealsRank, type Character } from "../utils/api";
import { getProfessionDefinition, normalizeProfessionId } from "../data/skills";
import CharacterEquipmentFrame from "./character/CharacterEquipmentFrame";
import WriteLetterModal from "../components/WriteLetterModal";
import PlayerItemModal from "../components/PlayerItemModal";
import { useHeroStore } from "../state/heroStore";
import { getNickColorStyle } from "../utils/nickColor";
import { PlayerNameWithEmblem } from "../components/PlayerNameWithEmblem";
import { getMyClan } from "../utils/api";
import SevenSealsBonusModal from "../components/SevenSealsBonusModal";

interface PlayerProfileProps {
  navigate: (path: string) => void;
  playerId?: string;
  playerName?: string;
}

export default function PlayerProfile({ navigate, playerId, playerName }: PlayerProfileProps) {
  const hero = useHeroStore((s) => s.hero);
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ slot: string; itemId: string | null; enchantLevel?: number } | null>(null);
  const [playerClan, setPlayerClan] = useState<any>(null);
  const [sevenSealsRank, setSevenSealsRank] = useState<number | null>(null);
  const [showSevenSealsModal, setShowSevenSealsModal] = useState(false);
  // 🔥 Таймер — перерендер щосекунди, щоб бафи інших гравців зникали при простроченні
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadPlayerProfile = async () => {
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
      
      // Використовуємо клан з character, якщо він є
      if (loadedCharacter.clan) {
        setPlayerClan(loadedCharacter.clan);
      } else {
        setPlayerClan(null);
      }
    } catch (err: any) {
      setError(err?.message || "Помилка завантаження профілю гравця");
      console.error("[PlayerProfile] Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayerProfile();
  }, [playerId, playerName]);

  // Завантажуємо Seven Seals ранг для badge "Победитель 7 печатей"
  useEffect(() => {
    const load = async () => {
      if (!character?.id) return;
      try {
        const data = await getSevenSealsRank(character.id);
        if (data.rank && data.rank >= 1 && data.rank <= 3) {
          setSevenSealsRank(data.rank);
        } else {
          setSevenSealsRank(null);
        }
      } catch {
        setSevenSealsRank(null);
      }
    };
    load();
  }, [character?.id]);

  // ❗ Оновлюємо дані при поверненні на сторінку (коли сторінка стає видимою)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (playerId || playerName)) {
        // Перезавантажуємо дані при поверненні на сторінку
        loadPlayerProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Також оновлюємо при фокусі на вікно
    const handleFocus = () => {
      if (playerId || playerName) {
        loadPlayerProfile();
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [playerId, playerName]);

  // Конвертуємо Character в Hero формат для CharacterEquipmentFrame
  const heroData = useMemo(() => {
    if (!character) return null;

    const heroJson = character.heroJson || {};
    // 🔥 profession може бути в heroJson.profession або в character.classId
    // Приводимо до нижнього регістру для правильного визначення зображення
    const professionRaw = heroJson.profession || character.classId || "";
    const profession = professionRaw.toLowerCase();
    
    return {
      id: character.id,
      name: character.name,
      username: character.name,
      race: character.race,
      klass: character.classId,
      gender: character.sex,
      level: character.level,
      profession: professionRaw, // Зберігаємо оригінальний регістр для відображення
      status: heroJson.status || "",
      equipment: heroJson.equipment || {},
      inventory: heroJson.inventory || [],
      adena: character.adena,
      coinOfLuck: character.coinLuck,
      exp: character.exp,
      sp: character.sp,
      hp: heroJson.hp || heroJson.maxHp || 100,
      maxHp: heroJson.maxHp || 100,
      mp: heroJson.mp || heroJson.maxMp || 100,
      maxMp: heroJson.maxMp || 100,
      cp: heroJson.cp || heroJson.maxCp || 0,
      maxCp: heroJson.maxCp || 0,
      // 🔥 Додаємо location та mobsKilled для правильного відображення
      location: heroJson.location || heroJson.currentLocation || heroJson.zone || undefined,
      mobsKilled: heroJson.mobsKilled ?? heroJson.mobs_killed ?? heroJson.killedMobs ?? heroJson.totalKills ?? undefined,
      nickColor: heroJson.nickColor || undefined,
    };
  }, [character]);

  // Перевіряємо чи гравець онлайн (активний за останні 10 хвилин)
  const isOnline = useMemo(() => {
    if (!character?.lastActivityAt) return false;
    try {
      const lastActivity = new Date(character.lastActivityAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
      return diffMinutes < 10;
    } catch (e) {
      return false;
    }
  }, [character?.lastActivityAt]);

  // Форматуємо дату "Останній раз був"
  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return "Невідомо";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Невідомо";
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center text-white text-sm py-10">
        Загрузка профілю...
      </div>
    );
  }

  if (error || !character || !heroData) {
    return (
      <div className="w-full flex flex-col items-center text-white text-sm py-10">
        <div className="text-red-400 mb-4">{error || "Профіль не знайдено"}</div>
        <button
          onClick={() => navigate("/online-players")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Назад до списку онлайн
        </button>
      </div>
    );
  }

  const profession = heroData.profession || character.classId || "";
  const profId = normalizeProfessionId(profession as any);
  const profDef = profId ? getProfessionDefinition(profId) : null;
  const professionLabel = profDef?.label || profession || "Нет";

  // Статистика з heroJson (якщо є) - перевіряємо всі можливі варіанти назв полів
  const stats = (character.heroJson || {}) as any;
  
  const karma = stats.karma || 0;
  const pk = stats.pk || 0;
  // 🔥 mobsKilled може зберігатися в різних полях - перевіряємо всі варіанти
  // Виправлено: прибрав дублювання stats.mobsKilled
  const mobsKilled = stats.mobsKilled ?? stats.mobs_killed ?? stats.killedMobs ?? stats.totalKills ?? 0;
  const pvpWins = stats.pvpWins || stats.pvp_wins || 0;
  const pvpLosses = stats.pvpLosses || stats.pvp_losses || 0;
  // 🔥 location може зберігатися в різних місцях - перевіряємо всі варіанти
  // Виправлено: спочатку перевіряємо stats, потім heroData
  const location = stats.location || stats.currentLocation || stats.zone || heroData?.location || "Talking Island Village";
  
  // 🔥 Діагностика: виводимо знайдені значення (тільки в dev режимі)
  if (import.meta.env.DEV) {
    console.log('[PlayerProfile] mobsKilled:', mobsKilled, 'from fields:', {
      mobsKilled: stats.mobsKilled,
      mobs_killed: stats.mobs_killed,
      killedMobs: stats.killedMobs,
      totalKills: stats.totalKills,
    });
    console.log('[PlayerProfile] location:', location, 'from fields:', {
      'stats.location': stats.location,
      'stats.currentLocation': stats.currentLocation,
      'stats.zone': stats.zone,
      'heroData.location': heroData?.location,
    });
  }
  const premiumActive = stats.premiumActive || false;
  const premiumExpiresAt = stats.premiumExpiresAt || null;
  const giftsCount = stats.giftsCount || stats.gifts_count || 0;

  // Форматуємо час преміуму
  const formatPremiumTime = (dateString?: string | null) => {
    if (!dateString || !premiumActive) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      if (diff <= 0) return null;
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}д ${hours}ч`;
      if (hours > 0) return `${hours}ч ${minutes}м`;
      return `${minutes}м`;
    } catch (e) {
      return null;
    }
  };

  const premiumTime = formatPremiumTime(premiumExpiresAt);

  return (
    <div className="w-full flex flex-col items-center text-white">
      <div className="w-full max-w-[360px] mt-2 px-3">
        {/* Заголовок */}
        <div className="border-t border-dotted border-[#654321] pt-2 mb-2">
          <div className="text-center text-[14px] font-bold text-[#87ceeb]">
            Информация о игроке
          </div>
        </div>

        {/* Нік, профа, лвл */}
        <div className="border-t border-dotted border-[#654321] pt-2 mb-2">
          <div className="text-center text-[12px]">
            <div className="font-bold text-[14px]">
              <PlayerNameWithEmblem
                playerName={character.name}
                hero={hero}
                clan={playerClan}
                nickColor={heroData?.nickColor || undefined}
                size={10}
              />
            </div>
            <div className="border-b border-dotted border-[#654321] pb-2 mb-2">
              <div className="text-yellow-300">
                {professionLabel} - {character.level} ур.
              </div>
            </div>
          </div>
        </div>

        {/* Останній раз був / Онлайн */}
        {character.lastActivityAt && (
          <div className="border-t border-dotted border-[#654321] pt-2 mb-2">
            <div className="text-center text-[11px] border-b border-dotted border-[#654321] pb-2">
              {isOnline ? (
                <span className="text-green-400 font-semibold">Онлайн</span>
              ) : (
                <span className="text-gray-400">
                  Последний раз был(а): {formatLastSeen(character.lastActivityAt)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Статус */}
        <div className="border-t border-dotted border-[#654321] pt-2 mb-3">
          <div className="text-center text-[11px] text-gray-400 border-b border-dotted border-[#654321] pb-2">
            {heroData.status || "Нет статуса"}
          </div>
        </div>

        {/* Победитель 7 печатей — клікабельна кнопка */}
        {sevenSealsRank !== null && (
          <div className="mb-3">
            <button
              onClick={() => setShowSevenSealsModal(true)}
              className="w-full text-center text-xs py-2 border border-dotted border-[#654321] rounded cursor-pointer hover:bg-[#2a2015] transition-colors"
            >
              <span className={sevenSealsRank === 1 ? "text-yellow-400" : sevenSealsRank === 2 ? "text-gray-300" : "text-orange-400"}>
                Победитель 7 печатей ({sevenSealsRank} место)
              </span>
            </button>
          </div>
        )}

        {/* Картинка персонажа з екіпіровкою */}
        <div className="mb-4">
          <CharacterEquipmentFrame 
            allowUnequip={false} 
            marginTop="0"
            heroOverride={heroData}
            onItemClick={(slot, itemId, enchantLevel) => {
              setSelectedItem({ slot, itemId, enchantLevel });
            }}
          />
        </div>

        {/* Модалка характеристик предмета */}
        {selectedItem && (
          <PlayerItemModal
            itemId={selectedItem.itemId}
            slot={selectedItem.slot}
            enchantLevel={selectedItem.enchantLevel}
            onClose={() => setSelectedItem(null)}
          />
        )}

        {/* Кнопки - просто текст */}
        <div className="flex flex-col gap-1 mb-4">
          <div className="w-full border-t border-b border-dotted border-[#654321] py-1">
            <span 
              onClick={() => setShowWriteModal(true)}
              className="cursor-pointer hover:text-green-300 transition-colors text-[12px] text-green-400 text-center block"
            >
              Написать письмо
            </span>
          </div>
          <div className="w-full border-t border-b border-dotted border-[#654321] py-1">
            <span 
              onClick={() => navigate(`/player/${character.id}/admin`)}
              className="cursor-pointer hover:text-green-300 transition-colors text-[12px] text-green-400 text-center block"
            >
              Забафнуть игрока
            </span>
          </div>
        </div>

        {/* Активні бафи гравця */}
        {(() => {
          const heroJson = character.heroJson || {};
          const allBuffs = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];
          const activeBuffs = allBuffs.filter((b: any) => {
            if (!b.expiresAt) return false;
            return b.expiresAt > now; // now — з state, оновлюється щосекунди
          });

          // ❗ Додаємо логування для діагностики
          if (import.meta.env.DEV) {
            console.log('[PlayerProfile] Buffs check:', {
              allBuffsCount: allBuffs.length,
              activeBuffsCount: activeBuffs.length,
              allBuffs: allBuffs,
              activeBuffs: activeBuffs,
              heroJson: heroJson,
            });
          }

          // ❗ Показуємо секцію навіть якщо бафів немає, але є хоча б один баф в списку (для діагностики)
          if (activeBuffs.length === 0 && allBuffs.length === 0) return null;

          return (
            <div className="mb-4 border-t border-dotted border-[#654321] pt-3">
              <div className="text-[#dec28e] text-sm font-semibold mb-2 border-b border-dotted border-[#654321] pb-1">
                Активні бафи {activeBuffs.length > 0 && `(${activeBuffs.length})`}
              </div>
              {activeBuffs.length === 0 && allBuffs.length > 0 && (
                <div className="text-xs text-gray-500 py-2">
                  Всі бафи закінчились
                </div>
              )}
              {activeBuffs.length === 0 && allBuffs.length === 0 && (
                <div className="text-xs text-gray-500 py-2">
                  Немає активних бафів
                </div>
              )}
              {/* 🔥 Тільки іконки в ряд з переносом - зменшені в 1.5 рази */}
              <div className="flex flex-wrap gap-1.5">
                {activeBuffs.map((buff: any, idx: number) => {
                  let iconSrc = buff.icon?.startsWith("/") ? buff.icon : `/skills/${buff.icon || ""}`;
                  
                  return (
                    <img
                      key={idx}
                      src={iconSrc}
                      alt={buff.name || "Buff"}
                      className="w-5 h-5 object-contain"
                      title={buff.name || "Buff"} // Показуємо назву при hover
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/skills/skill0000.gif";
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Модалка бонусу 7 печатей */}
        {showSevenSealsModal && sevenSealsRank !== null && (
          <SevenSealsBonusModal
            rank={sevenSealsRank as 1 | 2 | 3}
            playerName={character.name}
            onClose={() => setShowSevenSealsModal(false)}
          />
        )}

        {/* Модалка написання листа */}
        {showWriteModal && (
          <WriteLetterModal
            toCharacterId={character?.id}
            toCharacterName={character?.name}
            onClose={() => setShowWriteModal(false)}
            onSent={() => {
              setShowWriteModal(false);
              // TODO: Можливо показати повідомлення про успішну відправку
            }}
          />
        )}

        {/* Інформація */}
        <div className="space-y-2 text-[11px] text-gray-300 border-t border-dotted border-[#654321] pt-3">
          {/* Профессия */}
          <div className="flex justify-between">
            <span>Профессия:</span>
            <span className="text-yellow-300">{professionLabel}</span>
          </div>

          {/* Преміум */}
          {premiumActive && premiumTime && (
            <div className="flex justify-between">
              <span>Будет активен ещ премиум:</span>
              <span className="text-green-300">{premiumTime}</span>
            </div>
          )}

          {/* Социальный статус */}
          <div className="border-t border-dotted border-[#654321] pt-2 mt-2">
            <div className="font-semibold mb-1">Социальный статус</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex justify-between">
                <span>Карма</span>
                <span className={karma >= 0 ? "text-green-400" : "text-red-400"}>{karma}</span>
              </div>
              <div className="flex justify-between">
                <span>Рек.</span>
                <span>0</span>
              </div>
              <div className="flex justify-between">
                <span>PK</span>
                <span className={pk === 0 ? "text-green-400" : "text-red-400"}>{pk}</span>
              </div>
              <div className="flex justify-between">
                <span>Убил мобов</span>
                <span>{mobsKilled}</span>
              </div>
            </div>
          </div>

          {/* PvP */}
          <div className="border-t border-dotted border-[#654321] pt-2">
            <div className="flex justify-between text-[10px]">
              <span>PvP побед/поражений</span>
              <span className={pvpWins > pvpLosses ? "text-green-400" : "text-gray-400"}>
                {pvpWins}/{pvpLosses}
              </span>
            </div>
          </div>

          {/* Подарки */}
          <div className="border-t border-dotted border-[#654321] pt-2">
            <div className="flex justify-between text-[10px]">
              <span>Подарки</span>
              <span>({giftsCount})</span>
            </div>
            {giftsCount === 0 && (
              <div className="text-gray-500 text-[10px] mt-1">Подарков нет...</div>
            )}
          </div>

          {/* Локація */}
          <div className="border-t border-dotted border-[#654321] pt-2">
            <div className="text-[10px] text-gray-400">
              В {location}
            </div>
          </div>

          {/* Дата реєстрації */}
          {character.createdAt && (
            <div className="border-t border-dotted border-[#654321] pt-2">
              <div className="text-[10px] text-gray-400">
                Рег-я: {formatLastSeen(character.createdAt)}
              </div>
            </div>
          )}
        </div>

        {/* Кнопка назад - просто текст */}
        <div className="mt-4">
          <div className="w-full border-t border-b border-dotted border-[#654321] py-1">
            <span 
              onClick={() => navigate("/online-players")}
              className="cursor-pointer hover:text-blue-300 transition-colors text-[12px] text-blue-400 text-center block"
            >
              Назад до списку онлайн
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
