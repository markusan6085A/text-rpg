// src/screens/character/PremiumAccount.tsx
import React, { useState, useEffect } from "react";
import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import { buyPremium, type PremiumPack } from "../../utils/api";
import { loadHeroFromAPI } from "../../state/heroStore/heroLoadAPI";

interface Navigate {
  (path: string): void;
}

interface PremiumOption {
  id: string;
  hours: number;
  price: number; // Coin of Luck
  label: string;
}

const PREMIUM_OPTIONS: PremiumOption[] = [
  { id: "3h", hours: 3, price: 3, label: "3 часа" },
  { id: "7h", hours: 7, price: 5, label: "7 часов" },
  { id: "12h", hours: 12, price: 8, label: "12 часов" },
  { id: "24h", hours: 24, price: 16, label: "24 часа" },
];

export default function PremiumAccount({ navigate }: { navigate: Navigate }) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const characterId = useCharacterStore((s) => s.characterId);
  const [selectedOption, setSelectedOption] = useState<PremiumOption | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [successModal, setSuccessModal] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  // Оновлюємо час, що залишився
  useEffect(() => {
    if (!hero?.premiumUntil) return;

    const updateTime = () => {
      const now = Date.now();
      const until = hero.premiumUntil || 0;
      const remaining = until - now;

      if (remaining <= 0) {
        // Преміум закінчився
        updateHero({ premiumUntil: undefined });
        setTimeRemaining("");
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [hero?.premiumUntil, updateHero]);

  if (!hero) {
    return (
      <div className="w-full flex items-center justify-center text-xs text-gray-400">
        Загрузка персонажа...
      </div>
    );
  }

  const isPremiumActive = hero.premiumUntil && hero.premiumUntil > Date.now();
  const coinOfLuck = hero.coinOfLuck || 0;

  const activatePremium = async (option: PremiumOption) => {
    if (!characterId) {
      alert("Персонаж не вибрано");
      return;
    }
    if (coinOfLuck < option.price) {
      alert(`Недостаточно Coin of Luck! Нужно: ${option.price}, у вас: ${coinOfLuck}`);
      return;
    }

    setIsBuying(true);
    try {
      const res = await buyPremium(
        characterId,
        option.id as PremiumPack,
        (hero as any)?.heroJson?.heroRevision
      );
      if (!res.ok || !res.character) {
        alert("Помилка покупки преміуму");
        return;
      }
      const { coinLuck, heroJson } = res.character;
      const newPremiumUntil = heroJson?.premiumUntil;
      const newRevision = heroJson?.heroRevision;
      // 🔥 КРИТИЧНО: оновлюємо serverState + heroRevision, щоб heroPersistence надсилав правильний expectedRevision
      useHeroStore.getState().updateServerState({ coinLuck, heroRevision: newRevision });
      updateHero({
        premiumUntil: newPremiumUntil,
        coinOfLuck: coinLuck,
        heroJson: { ...(hero as any)?.heroJson, premiumUntil: newPremiumUntil, heroRevision: newRevision },
        ...(newRevision != null && { heroRevision: newRevision }),
      } as any);
      setSelectedOption(null);
      setSuccessModal({ show: true, message: `Поздравляю! Вы купили премиум на ${option.label}!` });
    } catch (err: any) {
      const body = err?.body || {};
      if (err?.status === 404) {
        alert("Сервер оновлюється або ендпоінт недоступний (404). Спробуйте вийти і зайти знову, або пізніше.");
      } else if (err?.status === 400 && body.error === "not enough coinLuck") {
        alert(`Недостаточно Coin of Luck! У вас: ${body.coinLuck ?? coinOfLuck}`);
      } else if (err?.status === 409) {
        await loadHeroFromAPI();
        alert("Дані оновлено. Спробуйте ще раз.");
      } else if (err?.status === 401) {
        alert("Сесія закінчилась. Вийдіть і зайдіть знову.");
      } else {
        alert(body.error || err?.message || "Помилка покупки преміуму");
      }
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="w-full text-[#f4e2b8] px-1 py-2">
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => navigate("/character")}
          className="text-gray-400 text-xs hover:text-gray-300"
        >
          ← Назад
        </button>
        <div className="text-[#ffd700] text-xs border-b border-solid border-white/50 pb-2 font-semibold flex-1 flex items-center gap-2" style={{ textShadow: "0 0 8px rgba(255, 215, 0, 0.5)" }}>
          <img src="/icons/col (1).png" alt="Premium" className="w-4 h-4 object-contain" />
          Премиум аккаунт
        </div>
      </div>

      {/* Статус преміум аккаунту */}
      {isPremiumActive && (
        <div className="mb-2 p-3 bg-green-900/20 border border-green-500/50 rounded">
          <div className="text-green-400 text-xs font-semibold mb-1">
            ✓ Преміум аккаунт активний
          </div>
          <div className="text-gray-300 text-[10px]">
            Залишилось: <span className="text-yellow-400 font-semibold">{timeRemaining}</span>
          </div>
          <div className="text-gray-400 text-[10px] mt-2">
            Бонуси: x2 EXP, x2 SP, x2 Adena, x2 Ресурси та Спойл
          </div>
        </div>
      )}

      {/* Інформація про бонуси */}
      <div className="mb-2 p-3 bg-[#1a1a1a] border border-white/50 rounded">
        <div className="text-[#b8860b] text-xs font-semibold mb-2">Бонуси преміум аккаунту:</div>
        <div className="text-gray-300 text-[10px] space-y-1">
          <div>• Опыт (EXP): x2</div>
          <div>• SP: x2</div>
          <div>• Адена: x2</div>
          <div>• Ресурси (дроп): x2</div>
          <div>• Спойл (ресурси): x2</div>
        </div>
      </div>

      {/* Доступні опції */}
      <div className="mb-2">
        <div className="text-[#b8860b] text-xs font-semibold mb-2">
          Доступні опції:
        </div>
        <div className="text-gray-400 text-[10px] mb-2 flex items-center gap-2">
          <img src="/icons/col (1).png" alt="Coin of Luck" className="w-3 h-3 object-contain" />
          Coin of Luck: <span className="text-yellow-400">{coinOfLuck}</span>
        </div>
        <div className="space-y-2">
          {PREMIUM_OPTIONS.map((option) => {
            const canAfford = coinOfLuck >= option.price;
            return (
              <div
                key={option.id}
                className={`border border-solid border-white/50 p-2 rounded ${
                  selectedOption?.id === option.id ? "bg-yellow-900/20 border-yellow-500" : ""
                } ${!canAfford ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="premium"
                      id={option.id}
                      checked={selectedOption?.id === option.id}
                      onChange={() => setSelectedOption(option)}
                      disabled={!canAfford}
                      className="cursor-pointer"
                    />
                    <label
                      htmlFor={option.id}
                      className={`text-xs font-semibold cursor-pointer ${
                        canAfford ? "text-orange-400" : "text-gray-500"
                      }`}
                    >
                      {option.label}
                    </label>
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1">
                    <img src="/icons/col (1).png" alt="Coin of Luck" className="w-3 h-3 object-contain" />
                    {option.price} Coin of Luck
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Кнопка активації */}
      {selectedOption && (
        <div className="flex justify-center">
          <button
            onClick={() => activatePremium(selectedOption)}
            disabled={coinOfLuck < selectedOption.price || isBuying}
            className={`px-4 py-2 text-xs rounded-md ${
              coinOfLuck >= selectedOption.price
                ? "bg-green-700 text-white hover:bg-green-600"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            Активировать премиум аккаунт
          </button>
        </div>
      )}

      {/* Модалка успішної покупки */}
      {successModal.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setSuccessModal({ show: false, message: "" })}
        >
          <div
            className="bg-[#14110c] border border-green-500/50 rounded-lg p-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-green-400 text-lg font-semibold mb-2">✓ {successModal.message}</div>
              <button
                onClick={() => setSuccessModal({ show: false, message: "" })}
                className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 text-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

