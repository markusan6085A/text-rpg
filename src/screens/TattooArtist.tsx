// src/screens/TattooArtist.tsx
import React, { useState } from "react";
import { useHeroStore } from "../state/heroStore";
import { GM_SHOP_ITEMS, type DyeItem } from "./GMShop";
import { recalculateAllStats } from "../utils/stats/recalculateAllStats";
import { showToast } from "../state/toastStore";
import { getCityUiVariant } from "../utils/cityUiVariant";

type Navigate = (path: string) => void;

interface TattooArtistProps {
  navigate: Navigate;
}

const MAX_DYES = 3;
const MIN_STAT = 3; // Мінімальне значення стату

export default function TattooArtist({ navigate }: TattooArtistProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const borderB = isL2 ? "border-b border-[#5c4a32]/45" : "border-b border-black/70";
  const modalPanel = isL2
    ? "bg-[#14110c] border border-[#5c4a32] rounded-lg p-4 w-full max-w-[400px] max-h-[80vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    : "bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-[400px] w-full max-h-[80vh] overflow-y-auto";

  if (!hero) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center py-16 text-[#8a7a60] text-sm gap-2`
            : "text-white text-center mt-10"
        }
      >
        {isL2 && (
          <span className="w-4 h-4 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin shrink-0" />
        )}
        Загрузка...
      </div>
    );
  }

  // Отримуємо краски з інвентаря (потрібно 1 краска для нанесення)
  const dyesInInventory = (hero.inventory || []).filter(item => {
    const isDye = GM_SHOP_ITEMS.some(dye => dye.itemId === item.id);
    const hasEnough = (item.count || 1) >= 1;
    return isDye && hasEnough;
  });

  // Отримуємо активні тату
  const activeDyes = hero.activeDyes || [];

  // Знаходимо повну інформацію про краски в інвентарі (тільки ті, де >= 10 штук)
  const dyesWithInfo = dyesInInventory.map(invItem => {
    const dyeInfo = GM_SHOP_ITEMS.find(dye => dye.itemId === invItem.id);
    return {
      ...invItem,
      dyeInfo,
    };
  }).filter(item => item.dyeInfo && (item.count || 0) >= 1);

  // Обробка нанесення тату
  const handleApplyDye = (dyeItem: typeof dyesWithInfo[0]) => {
    if (!dyeItem.dyeInfo) return;

    // Перевірка максимальної кількості
    if (activeDyes.length >= MAX_DYES) {
      showToast(`Максимум ${MAX_DYES} тату! Спочатку зніміть одне.`, "info");
      return;
    }

    // Перевірка конфліктів (не можна нанести дві протилежні краски, але можна нанести одне і те саме 2 рази)
    const hasConflict = activeDyes.some(active => {
      // Перевіряємо тільки протилежні краски (STR+/CON- vs CON+/STR-)
      return (active.statPlus === dyeItem.dyeInfo.statMinus && active.statMinus === dyeItem.dyeInfo.statPlus);
    });

    if (hasConflict) {
      showToast("Неможливо нанести конфліктуючі тату!", "error");
      return;
    }
    
    // Перевірка: не можна нанести більше 2 однакових тату (тільки якщо намагаємося нанести той самий тип)
    const sameDyeCount = activeDyes.filter(active => 
      active.statPlus === dyeItem.dyeInfo.statPlus && active.statMinus === dyeItem.dyeInfo.statMinus
    ).length;
    
    // Перевіряємо тільки якщо намагаємося нанести той самий тип тату, який вже є 2 рази
    if (sameDyeCount >= 2) {
      showToast("Можна нанести максимум 2 однакові тату!", "info");
      return;
    }

    // Перевірка мінімального стату (використовуємо поточні базові стати з урахуванням вже нанесених тату)
    const recalculated = recalculateAllStats(hero, []);
    const currentBaseStats = recalculated.baseStats;
    const statMinusValue = currentBaseStats[dyeItem.dyeInfo.statMinus] || 0;
    
    if (statMinusValue - dyeItem.dyeInfo.effect < MIN_STAT) {
      showToast(`Неможливо нанести! Стат ${dyeItem.dyeInfo.statMinus} буде нижче мінімуму (${MIN_STAT}).`, "error");
      return;
    }

    // Видаляємо 1 краску з інвентаря
    const newInventory = [...(hero.inventory || [])];
    const itemIndex = newInventory.findIndex(item => item.id === dyeItem.id);
    if (itemIndex >= 0) {
      const existingItem = newInventory[itemIndex];
      const currentCount = existingItem.count || 1;
      const newCount = currentCount - 1;
      
      if (newCount > 0) {
        newInventory[itemIndex] = { ...existingItem, count: newCount };
      } else {
        newInventory.splice(itemIndex, 1);
      }
    }

    // Додаємо тату до активних
    const newActiveDyes = [
      ...activeDyes,
      {
        id: dyeItem.dyeInfo.itemId,
        statPlus: dyeItem.dyeInfo.statPlus,
        statMinus: dyeItem.dyeInfo.statMinus,
        effect: dyeItem.dyeInfo.effect,
        grade: dyeItem.dyeInfo.grade,
        price: dyeItem.dyeInfo.price,
      },
    ];

    updateHero({
      inventory: newInventory,
      activeDyes: newActiveDyes,
    });

    setShowApplyModal(false);
  };

  // Обробка зняття тату
  const handleRemoveDye = (index: number) => {
    const dyeToRemove = activeDyes[index];
    if (!dyeToRemove) return;

    // Вартість зняття = 30% від ціни, мінімум 1 AA
    const removeCost = Math.max(1, Math.round(dyeToRemove.price * 0.3));

    // Перевірка AA
    const ancientAdenaItem = hero.inventory?.find(item => item.id === "ancient_adena");
    const aaCount = ancientAdenaItem?.count || 0;

    if (aaCount < removeCost) {
      showToast(`Недостатньо AA! Потрібно ${removeCost.toLocaleString()} AA для зняття.`, "error");
      return;
    }

    // Вираховуємо AA
    const newInventory = [...(hero.inventory || [])];
    const aaIndex = newInventory.findIndex(item => item.id === "ancient_adena");
    if (aaIndex >= 0) {
      const aaItem = newInventory[aaIndex];
      if (aaItem.count && aaItem.count >= removeCost) {
        if (aaItem.count > removeCost) {
          newInventory[aaIndex] = { ...aaItem, count: aaItem.count - removeCost };
        } else {
          newInventory.splice(aaIndex, 1);
        }
      }
    }

    // Видаляємо тату з активних за індексом (тільки одну)
    const newActiveDyes = activeDyes.filter((_, i) => i !== index);

    updateHero({
      inventory: newInventory,
      activeDyes: newActiveDyes,
    });

    setShowRemoveModal(false);
  };

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#d4c4a8]`
          : "w-full max-w-[360px] mx-auto px-3 py-2"
      }
    >
      <div className={isL2 ? "max-w-[420px] mx-auto w-full" : ""}>
      {/* Заголовок */}
      <div
        className={`${borderB} px-4 py-2 text-center text-[11px] tracking-[0.12em] uppercase font-semibold ${
          isL2 ? "text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]" : "text-[#ff8c00]"
        }`}
      >
        Татуировщик
      </div>

      {/* Опис */}
      <div className={`px-4 py-3 ${borderB}`}>
        <div className="text-[12px] text-[#ff8c00] space-y-2">
          <p>
            Майстер татуювань допоможе змінити вашу долю.
          </p>
          <p>
            Накладайте татуювання, щоб посилити потрібні характеристики,
            але памʼятайте — за кожну силу є своя ціна.
          </p>
        </div>
        <details className="mt-2">
          <summary className="text-[11px] text-[#cfcfcc] cursor-pointer hover:text-[#ff8c00]">
            Що дають стати (+1)
          </summary>
          <div className="text-[10px] text-[#cfcfcc] mt-1.5 space-y-0.5 pl-1">
            <div>STR: ~+3% P.Atk</div>
            <div>DEX: ~+1% швидкість атаки, +0.8 шанс криту</div>
            <div>CON: ~+3% Max HP/CP</div>
            <div>INT: ~+4% M.Atk</div>
            <div>WIT: ~+5% Casting Spd., +шанс маг. криту</div>
            <div>MEN: ~+1% M.Def та Max MP</div>
          </div>
        </details>
      </div>

      {/* Поточна кількість тату */}
      <div className={`px-4 py-2 ${borderB} text-[12px] ${isL2 ? "text-[#d4c4a8]" : "text-[#cfcfcc]"}`}>
        Активних тату: {activeDyes.length} / {MAX_DYES}
      </div>

      {/* Кнопки */}
      <div className={`px-4 py-3 ${borderB} space-y-2`}>
        <button
          onClick={() => setShowApplyModal(true)}
          disabled={dyesWithInfo.length === 0 || activeDyes.length >= MAX_DYES}
          className={`w-full py-2 px-4 text-[12px] ${
            dyesWithInfo.length === 0 || activeDyes.length >= MAX_DYES
              ? "text-gray-400 cursor-not-allowed"
              : "text-green-500 hover:text-green-400"
          }`}
        >
          Нанести тату
        </button>

        <button
          onClick={() => setShowRemoveModal(true)}
          disabled={activeDyes.length === 0}
          className={`w-full py-2 px-4 text-[12px] ${
            activeDyes.length === 0
              ? "text-gray-400 cursor-not-allowed"
              : "text-red-500 hover:text-red-400"
          }`}
        >
          Удалить тату
        </button>
      </div>

      {/* Модальне вікно нанесення */}
      {showApplyModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowApplyModal(false)}
        >
          <div
            className={modalPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`text-center text-lg font-bold mb-4 pb-2 border-b ${
                isL2 ? "text-[#e8c56e] border-[#5c4a32]/55" : "text-white border-white/50"
              }`}
            >
              Виберіть тату для нанесення
            </div>

            {dyesWithInfo.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                У вас немає красок в інвентарі (потрібно 1 краска для нанесення)
              </div>
            ) : (
              <div className="space-y-2">
                {dyesWithInfo.map((item) => (
                  <div
                    key={item.id}
                    className={
                      isL2
                        ? "flex items-center gap-3 p-2 border border-[#5c4a32]/70 rounded-md hover:border-[#c7ad80]/40 bg-black/15 cursor-pointer"
                        : "flex items-center gap-3 p-2 border border-white/50 rounded hover:bg-black/20 cursor-pointer"
                    }
                    onClick={() => handleApplyDye(item)}
                  >
                    <img
                      src={item.dyeInfo?.icon}
                      alt={item.dyeInfo?.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/items/drops/resources/etc_ancient_adena_i00.png";
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-white text-[12px] font-semibold">
                        {item.dyeInfo?.name}
                      </div>
                      <div className="text-gray-400 text-[11px]">
                        {item.dyeInfo?.description}
                      </div>
                      <div className="text-orange-400 text-[10px] mt-0.5">
                        Потрібно 1 краска для нанесення
                      </div>
                    </div>
                    {item.count && (
                      <div className="text-yellow-400 text-[12px]">
                        x{item.count}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 bg-[#1a1208] text-gray-400 border border-white/50 rounded text-[12px] hover:text-gray-300"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно зняття */}
      {showRemoveModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRemoveModal(false)}
        >
          <div
            className={isL2 ? `${modalPanel} max-h-none` : "bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-[400px] w-full"}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`text-center text-lg font-bold mb-4 pb-2 border-b ${
                isL2 ? "text-[#e8c56e] border-[#5c4a32]/55" : "text-white border-white/50"
              }`}
            >
              Виберіть тату для зняття
            </div>

            {activeDyes.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                У вас немає активних тату
              </div>
            ) : (
              <div className="space-y-2">
                {activeDyes.map((dye, index) => {
                  const dyeInfo = GM_SHOP_ITEMS.find(d => d.itemId === dye.id);
                  const removeCost = Math.max(1, Math.round(dye.price * 0.3));
                  
                  return (
                    <div
                      key={index}
                      className={
                        isL2
                          ? "flex items-center gap-3 p-2 border border-[#5c4a32]/70 rounded-md hover:border-[#c7ad80]/40 bg-black/15"
                          : "flex items-center gap-3 p-2 border border-white/50 rounded hover:bg-black/20"
                      }
                    >
                      <img
                        src={dyeInfo?.icon || "/items/drops/resources/etc_ancient_adena_i00.png"}
                        alt={dyeInfo?.name || dye.id}
                        className="w-10 h-10 object-contain"
                      />
                      <div className="flex-1">
                        <div className="text-white text-[12px] font-semibold">
                          {dyeInfo?.name || dye.id}
                        </div>
                        <div className="text-gray-400 text-[11px]">
                          {dyeInfo?.description || `${dye.statPlus} +${dye.effect} / ${dye.statMinus} -${dye.effect}`}
                        </div>
                        <div className="text-red-400 text-[11px] mt-1">
                          Вартість зняття: {removeCost.toLocaleString()} AA
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDye(index)}
                        className="px-3 py-1 bg-red-900/30 text-red-400 border border-red-600 rounded text-[11px] hover:bg-red-900/50"
                      >
                        Зняти
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-2 bg-[#1a1208] text-gray-400 border border-white/50 rounded text-[12px] hover:text-gray-300"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
