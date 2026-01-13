// src/screens/TattooArtist.tsx
import React, { useState } from "react";
import { useHeroStore } from "../state/heroStore";
import { GM_SHOP_ITEMS, type DyeItem } from "./GMShop";
import { recalculateAllStats } from "../utils/stats/recalculateAllStats";

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

  if (!hero) {
    return <div className="text-white text-center mt-10">Загрузка...</div>;
  }

  // Отримуємо краски з інвентаря (потрібно 10 штук для нанесення)
  const dyesInInventory = (hero.inventory || []).filter(item => {
    const isDye = GM_SHOP_ITEMS.some(dye => dye.itemId === item.id);
    const hasEnough = (item.count || 1) >= 10;
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
  }).filter(item => item.dyeInfo && (item.count || 0) >= 10);

  // Обробка нанесення тату
  const handleApplyDye = (dyeItem: typeof dyesWithInfo[0]) => {
    if (!dyeItem.dyeInfo) return;

    // Перевірка максимальної кількості
    if (activeDyes.length >= MAX_DYES) {
      alert(`Максимум ${MAX_DYES} тату! Спочатку зніміть одне.`);
      return;
    }

    // Перевірка конфліктів (не можна нанести дві протилежні краски, але можна нанести одне і те саме 2 рази)
    const hasConflict = activeDyes.some(active => {
      // Перевіряємо тільки протилежні краски (STR+/CON- vs CON+/STR-)
      return (active.statPlus === dyeItem.dyeInfo.statMinus && active.statMinus === dyeItem.dyeInfo.statPlus);
    });

    if (hasConflict) {
      alert("Неможливо нанести конфліктуючі тату!");
      return;
    }
    
    // Перевірка: не можна нанести більше 2 однакових тату (тільки якщо намагаємося нанести той самий тип)
    const sameDyeCount = activeDyes.filter(active => 
      active.statPlus === dyeItem.dyeInfo.statPlus && active.statMinus === dyeItem.dyeInfo.statMinus
    ).length;
    
    // Перевіряємо тільки якщо намагаємося нанести той самий тип тату, який вже є 2 рази
    if (sameDyeCount >= 2) {
      alert("Можна нанести максимум 2 однакові тату!");
      return;
    }

    // Перевірка мінімального стату (використовуємо поточні базові стати з урахуванням вже нанесених тату)
    const recalculated = recalculateAllStats(hero, []);
    const currentBaseStats = recalculated.baseStats;
    const statMinusValue = currentBaseStats[dyeItem.dyeInfo.statMinus] || 0;
    
    if (statMinusValue - dyeItem.dyeInfo.effect < MIN_STAT) {
      alert(`Неможливо нанести! Стат ${dyeItem.dyeInfo.statMinus} буде нижче мінімуму (${MIN_STAT}).`);
      return;
    }

    // Видаляємо 10 красок з інвентаря
    const newInventory = [...(hero.inventory || [])];
    const itemIndex = newInventory.findIndex(item => item.id === dyeItem.id);
    if (itemIndex >= 0) {
      const existingItem = newInventory[itemIndex];
      const currentCount = existingItem.count || 1;
      const newCount = currentCount - 10;
      
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

    // Вартість зняття = 30% від ціни
    const removeCost = Math.round(dyeToRemove.price * 0.3);

    // Перевірка AA
    const ancientAdenaItem = hero.inventory?.find(item => item.id === "ancient_adena");
    const aaCount = ancientAdenaItem?.count || 0;

    if (aaCount < removeCost) {
      alert(`Недостатньо AA! Потрібно ${removeCost.toLocaleString()} AA для зняття.`);
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
    <div className="w-full max-w-[360px] mx-auto px-3 py-2">
      {/* Заголовок */}
      <div className="border-b border-black/70 px-4 py-2 text-center text-[11px] text-[#ff8c00] tracking-[0.12em] uppercase font-semibold">
        Татуировщик
      </div>

      {/* Опис */}
      <div className="px-4 py-3 border-b border-black/70">
        <div className="text-[12px] text-[#ff8c00] space-y-2">
          <p>
            Майстер татуювань допоможе змінити вашу долю.
          </p>
          <p>
            Накладайте татуювання, щоб посилити потрібні характеристики,
            але памʼятайте — за кожну силу є своя ціна.
          </p>
        </div>
      </div>

      {/* Поточна кількість тату */}
      <div className="px-4 py-2 border-b border-black/70 text-[12px] text-[#cfcfcc]">
        Активних тату: {activeDyes.length} / {MAX_DYES}
      </div>

      {/* Кнопки */}
      <div className="px-4 py-3 border-b border-black/70 space-y-2">
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
            className="bg-[#0a0603] border border-[#3d2f1a] rounded-lg p-4 max-w-[400px] w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center text-white text-lg font-bold mb-4 border-b border-[#5b4726] pb-2">
              Виберіть тату для нанесення
            </div>

            {dyesWithInfo.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                У вас немає достатньо красок в інвентарі (потрібно мінімум 10 штук одного типу)
              </div>
            ) : (
              <div className="space-y-2">
                {dyesWithInfo.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 border border-[#5b4726] rounded hover:bg-black/20 cursor-pointer"
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
                        Потрібно 10 штук для нанесення
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
                className="px-4 py-2 bg-[#1a1208] text-gray-400 border border-[#5b4726] rounded text-[12px] hover:text-gray-300"
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
            className="bg-[#0a0603] border border-[#3d2f1a] rounded-lg p-4 max-w-[400px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center text-white text-lg font-bold mb-4 border-b border-[#5b4726] pb-2">
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
                  const removeCost = Math.round(dye.price * 0.3);
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 border border-[#5b4726] rounded hover:bg-black/20"
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
                className="px-4 py-2 bg-[#1a1208] text-gray-400 border border-[#5b4726] rounded text-[12px] hover:text-gray-300"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
