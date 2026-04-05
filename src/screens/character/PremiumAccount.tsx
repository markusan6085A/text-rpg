// src/screens/character/PremiumAccount.tsx
import React, { useState, useEffect } from "react";
import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import { buyPremium, type PremiumPack } from "../../utils/api";
import { loadHeroFromAPI } from "../../state/heroStore/heroLoadAPI";
import { showToast } from "../../state/toastStore";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../../utils/l2WarmLayoutClassNames";

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

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;

  const applyServerCharacterSnapshot = (character: any) => {
    if (!character || typeof character !== "object") return;
    const store = useHeroStore.getState();
    const currentHero = store.hero;
    if (!currentHero) return;
    const heroJson =
      (character as any).heroJson && typeof (character as any).heroJson === "object"
        ? (character as any).heroJson
        : {};
    const inventory = Array.isArray(heroJson.inventory) ? heroJson.inventory : currentHero.inventory ?? [];
    const overflowChest = Array.isArray(heroJson.overflowChest)
      ? heroJson.overflowChest
      : currentHero.overflowChest ?? [];
    const activeDyes = Array.isArray(heroJson.activeDyes) ? heroJson.activeDyes : currentHero.activeDyes ?? [];
    const coinLuck = Number((character as any).coinLuck ?? currentHero.coinOfLuck ?? 0);
    const revision = Number(heroJson.heroRevision ?? (currentHero as any)?.heroJson?.heroRevision ?? 0);
    const level = Number((character as any).level ?? currentHero.level ?? 1);
    const exp = Number((character as any).exp ?? currentHero.exp ?? 0);
    const sp = Number((character as any).sp ?? currentHero.sp ?? 0);
    const adena = Number((character as any).adena ?? currentHero.adena ?? 0);
    store.applyServerSync(
      {
        level,
        exp,
        sp,
        adena,
        premiumUntil: Number((heroJson as any).premiumUntil ?? currentHero.premiumUntil ?? 0) || undefined,
        coinOfLuck: coinLuck,
        inventory,
        overflowChest,
        activeDyes,
        heroJson,
      } as any,
      {
        level,
        exp,
        sp,
        adena,
        coinLuck,
        heroRevision: Number.isFinite(revision) ? revision : 0,
        updatedAt: Date.now(),
      }
    );
  };

  useEffect(() => {
    if (!hero?.premiumUntil) {
      setTimeRemaining("");
      return;
    }

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
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center py-12 text-[#8a7a60] text-xs gap-2`
            : "w-full flex items-center justify-center text-xs text-gray-400"
        }
      >
        {isL2 && (
          <span className="w-4 h-4 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin shrink-0" />
        )}
        Загрузка персонажа...
      </div>
    );
  }

  const isPremiumActive = hero.premiumUntil && hero.premiumUntil > Date.now();
  const coinOfLuck = hero.coinOfLuck || 0;

  const activatePremium = async (option: PremiumOption) => {
    if (!characterId) {
      showToast("Персонаж не вибрано", "error");
      return;
    }
    if (coinOfLuck < option.price) {
      showToast(`Недостаточно Coin of Luck! Нужно: ${option.price}, у вас: ${coinOfLuck}`, "error");
      return;
    }

    setIsBuying(true);
    try {
      const expectedRevision = Number(
        useHeroStore.getState().serverState?.heroRevision ??
        (hero as any)?.heroJson?.heroRevision ??
        0
      );
      const res = await buyPremium(
        characterId,
        option.id as PremiumPack,
        Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0
      );
      if (!res.ok || !res.character) {
        showToast("Помилка покупки преміуму", "error");
        return;
      }
      applyServerCharacterSnapshot(res.character);
      setSelectedOption(null);
      showToast(`Поздравляю! Вы купили премиум на ${option.label}!`, "success");
    } catch (err: any) {
      const body = err?.body || {};
      if (err?.status === 404) {
        showToast("Сервер оновлюється або ендпоінт недоступний (404). Спробуйте вийти і зайти знову, або пізніше.", "error");
      } else if (err?.status === 400 && body.error === "not enough coinLuck") {
        showToast(`Недостаточно Coin of Luck! У вас: ${body.coinLuck ?? coinOfLuck}`, "error");
      } else if (err?.status === 409) {
        await loadHeroFromAPI();
        showToast("Дані оновлено. Спробуйте ще раз.", "info");
      } else if (err?.status === 401) {
        showToast("Сесія закінчилась. Вийдіть і зайдіть знову.", "error");
      } else {
        showToast(body.error || err?.message || "Помилка покупки преміуму", "error");
      }
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#e8dcc8]`
          : "w-full text-[#f4e2b8] px-1 py-2"
      }
    >
      <div className={isL2 ? "max-w-[420px] mx-auto w-full" : ""}>
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => navigate("/character")}
          className={
            isL2
              ? "text-[#9d8265] text-xs hover:text-[#c9a44c]"
              : "text-gray-400 text-xs hover:text-gray-300"
          }
        >
          ← Назад
        </button>
        <div
          className={
            isL2
              ? "text-[#e8c56e] text-xs border-b border-[#c7ad80]/25 pb-2 font-semibold flex-1 flex items-center gap-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
              : "text-[#ffd700] text-xs border-b border-solid border-white/50 pb-2 font-semibold flex-1 flex items-center gap-2"
          }
          style={isL2 ? undefined : { textShadow: "0 0 8px rgba(255, 215, 0, 0.5)" }}
        >
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
      <div
        className={
          isL2
            ? "mb-2 p-3 rounded-md border border-[#5c4a32]/70 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
            : "mb-2 p-3 bg-[#1a1a1a] border border-white/50 rounded"
        }
      >
        <div className={isL2 ? "text-[#e8c56e] text-xs font-semibold mb-2" : "text-[#b8860b] text-xs font-semibold mb-2"}>
          Бонуси преміум аккаунту:
        </div>
        <div className={isL2 ? "text-[#d4c4a8] text-[10px] space-y-1" : "text-gray-300 text-[10px] space-y-1"}>
          <div>• Опыт (EXP): x2</div>
          <div>• SP: x2</div>
          <div>• Адена: x2</div>
          <div>• Ресурси (дроп): x2</div>
          <div>• Спойл (ресурси): x2</div>
        </div>
      </div>

      {/* Доступні опції */}
      <div className="mb-2">
        <div className={isL2 ? "text-[#e8c56e] text-xs font-semibold mb-2" : "text-[#b8860b] text-xs font-semibold mb-2"}>
          Доступні опції:
        </div>
        <div className={isL2 ? "text-[#a89878] text-[10px] mb-2 flex items-center gap-2" : "text-gray-400 text-[10px] mb-2 flex items-center gap-2"}>
          <img src="/icons/col (1).png" alt="Coin of Luck" className="w-3 h-3 object-contain" />
          Coin of Luck: <span className="text-yellow-400">{coinOfLuck}</span>
        </div>
        <div className="space-y-2">
          {PREMIUM_OPTIONS.map((option) => {
            const canAfford = coinOfLuck >= option.price;
            return (
              <div
                key={option.id}
                className={`p-2 rounded ${
                  isL2
                    ? `border border-[#5c4a32]/70 ${selectedOption?.id === option.id ? "bg-[#2a2318]/90 border-[#c9a44c]/60" : ""}`
                    : `border border-solid border-white/50 ${selectedOption?.id === option.id ? "bg-yellow-900/20 border-yellow-500" : ""}`
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

      </div>
    </div>
  );
}

