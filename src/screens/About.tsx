import React, { useState, useEffect } from "react";
import { getOnlinePlayers, updateCharacter } from "../utils/api";
import { useHeroStore, getRateLimitRemainingMs } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";

type Navigate = (p: string) => void;

export default function About({ navigate }: { navigate: Navigate }) {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [showChangeNickModal, setShowChangeNickModal] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const characterId = useCharacterStore((s) => s.characterId);

  useEffect(() => {
    const loadOnlineCount = async () => {
      if (getRateLimitRemainingMs() > 0) return;
      try {
        const data = await getOnlinePlayers();
        const count = data.count ?? data.players?.length ?? 0;
        setOnlineCount(count);
      } catch (err: any) {
        // ❗ Ігноруємо 401 помилки (неавторизований) - це нормально
        if (err?.status === 401 || err?.unauthorized) {
          setOnlineCount(0);
          return;
        }
        console.error('[About] Failed to load online count:', err?.message || err);
        setOnlineCount(0);
      }
    };
    const startTimeout = setTimeout(loadOnlineCount, 15000); // Перший через 15 с
    const interval = setInterval(loadOnlineCount, 60000); // Далі кожні 60 с
    return () => {
      clearTimeout(startTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <div className="w-full text-yellow-200 min-h-[400px] px-3 py-4">
        <div className="mb-4">
          <div className="text-lg font-bold mb-2 text-blue-400">Меню сервера</div>
          <div className="text-sm text-orange-400">
            Здесь собраны основные разделы и сервисные функции.
          </div>
        </div>
        <div className="flex flex-col gap-0">
          <button
            onClick={() => navigate("/wip")}
            className="text-left text-gray-400 hover:text-gray-300 transition-colors text-[10px] py-2 border-b border-dotted border-[#654321] w-full"
          >
            {String.fromCharCode(1055, 1086, 1076, 1076, 1077, 1088, 1078, 1082, 1072)}
          </button>
          <button
            onClick={() => navigate("/online-players")}
            className="text-left text-green-400 hover:text-green-300 transition-colors text-[10px] py-2 border-b border-gray-600 w-full"
          >
            {String.fromCharCode(1054, 1085, 1083, 1072, 1081, 1085)} [{onlineCount}]
          </button>
          <button
            onClick={() => setShowChangeNickModal(true)}
            className="text-left text-purple-400 hover:text-purple-300 transition-colors text-[10px] py-2 border-b border-gray-600 w-full"
          >
            Изменить ник
          </button>
          <button
            onClick={() => navigate("/colorize-nick")}
            className="text-left text-white hover:text-gray-200 transition-colors text-[10px] py-2 border-b border-gray-600 w-full"
          >
            Покрасить ник
          </button>
        </div>
      </div>

      {/* Модалка зміни ніка */}
      {showChangeNickModal && hero && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setShowChangeNickModal(false)}
        >
          <div
            className="bg-[#14110c] border border-[#3b2614] rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#b8860b]">Изменить ник</h2>
              <button
                className="text-gray-400 hover:text-white text-xl"
                onClick={() => setShowChangeNickModal(false)}
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 mb-2">Новый ник:</label>
                <input
                  type="text"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0a06] border border-[#3e301c] rounded text-white text-sm"
                  placeholder="Введите новый ник"
                />
              </div>

              <div className="text-gray-300 text-xs">
                <div className="mb-2">Доступные символы:</div>
                <div className="font-mono bg-[#0f0a06] p-2 rounded border border-[#3e301c]">
                  A-Z, a-z, 0-9, _, -, пробел
                </div>
              </div>

              <div className="text-yellow-400 text-xs font-semibold pt-2 border-t border-gray-600">
                Цена: 50 Coin of Luck
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  disabled={!hero || (hero.coinOfLuck || 0) < 50 || !newNickname.trim() || isChanging}
                  className={`flex-1 text-sm font-semibold transition-colors ${
                    !hero || (hero.coinOfLuck || 0) < 50 || !newNickname.trim() || isChanging
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-green-400 hover:text-green-300"
                  }`}
                  onClick={async () => {
                    if (!hero || !characterId || !newNickname.trim()) return;
                    
                    const coins = hero.coinOfLuck || 0;
                    if (coins < 50) {
                      alert("Недостаточно Coin of Luck!");
                      return;
                    }

                    // Validate nickname format
                    const nicknameRegex = /^[A-Za-z0-9_\- ]+$/;
                    if (!nicknameRegex.test(newNickname.trim())) {
                      alert("Некорректный ник! Используйте только A-Z, a-z, 0-9, _, -, пробел");
                      return;
                    }

                    setIsChanging(true);
                    try {
                      // Update character name and deduct coins
                      await updateCharacter(characterId, {
                        coinLuck: coins - 50,
                        heroJson: {
                          ...hero,
                          name: newNickname.trim(),
                          coinOfLuck: coins - 50,
                        },
                      });

                      // Update hero in store
                      updateHero({
                        name: newNickname.trim(),
                        coinOfLuck: coins - 50,
                      });

                      setShowChangeNickModal(false);
                      setNewNickname("");
                      alert("Ник успешно изменен!");
                    } catch (err: any) {
                      console.error('[About] Failed to change nickname:', err);
                      alert(err?.message || "Ошибка при изменении ника");
                    } finally {
                      setIsChanging(false);
                    }
                  }}
                >
                  Изменить
                </button>
                <button
                  disabled={isChanging}
                  className="flex-1 text-sm text-red-400 hover:text-red-300 transition-colors disabled:text-gray-500 disabled:cursor-not-allowed"
                  onClick={() => {
                    setShowChangeNickModal(false);
                    setNewNickname("");
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
