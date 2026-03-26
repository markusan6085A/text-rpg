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
  const btnPrimaryL2 =
    "w-full py-2.5 px-4 rounded-md text-[13px] font-semibold tracking-wide border transition-all shadow-[inset_0_1px_0_rgba(255,235,200,0.06)] " +
    "border-[#5c8a5c]/55 bg-gradient-to-b from-[#1e2a1c] to-[#0f140e] text-[#a8d4a8] hover:border-[#7abf7a]/55 hover:from-[#243224] hover:to-[#121a12] " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#5c8a5c]/55";
  const btnDangerL2 =
    "w-full py-2.5 px-4 rounded-md text-[13px] font-semibold tracking-wide border transition-all shadow-[inset_0_1px_0_rgba(255,200,200,0.05)] " +
    "border-[#8a4a4a]/55 bg-gradient-to-b from-[#2a1818] to-[#140c0c] text-[#e8a0a0] hover:border-[#c77a7a]/45 hover:from-[#321c1c] hover:to-[#1a0f0f] " +
    "disabled:opacity-40 disabled:cursor-not-allowed";
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
        Загрузка…
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
      showToast(`Максимум ${MAX_DYES} татуировок! Сначала снимите одну.`, "info");
      return;
    }

    // Перевірка конфліктів (не можна нанести дві протилежні краски, але можна нанести одне і те саме 2 рази)
    const hasConflict = activeDyes.some(active => {
      // Перевіряємо тільки протилежні краски (STR+/CON- vs CON+/STR-)
      return (active.statPlus === dyeItem.dyeInfo.statMinus && active.statMinus === dyeItem.dyeInfo.statPlus);
    });

    if (hasConflict) {
      showToast("Нельзя нанести конфликтующие татуировки!", "error");
      return;
    }
    
    // Перевірка: не можна нанести більше 2 однакових тату (тільки якщо намагаємося нанести той самий тип)
    const sameDyeCount = activeDyes.filter(active => 
      active.statPlus === dyeItem.dyeInfo.statPlus && active.statMinus === dyeItem.dyeInfo.statMinus
    ).length;
    
    // Перевіряємо тільки якщо намагаємося нанести той самий тип тату, який вже є 2 рази
    if (sameDyeCount >= 2) {
      showToast("Можно нанести не более 2 одинаковых татуировок!", "info");
      return;
    }

    // Перевірка мінімального стату (використовуємо поточні базові стати з урахуванням вже нанесених тату)
    const recalculated = recalculateAllStats(hero, []);
    const currentBaseStats = recalculated.baseStats;
    const statMinusValue = currentBaseStats[dyeItem.dyeInfo.statMinus] || 0;
    
    if (statMinusValue - dyeItem.dyeInfo.effect < MIN_STAT) {
      showToast(`Нельзя нанести! Стата ${dyeItem.dyeInfo.statMinus} станет ниже минимума (${MIN_STAT}).`, "error");
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
      showToast(`Недостаточно AA! Нужно ${removeCost.toLocaleString()} AA для снятия.`, "error");
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
      <div className={isL2 ? "max-w-[520px] mx-auto w-full" : ""}>
      {/* NPC + текст */}
      <div
        className={`flex flex-col sm:flex-row gap-4 sm:gap-5 px-3 sm:px-4 py-4 ${borderB} ${
          isL2 ? "items-stretch" : ""
        }`}
      >
        <div
          className={
            isL2
              ? "shrink-0 flex justify-center sm:justify-start w-full sm:w-[168px] md:w-[180px]"
              : "shrink-0 flex justify-center"
          }
        >
          <div
            className={
              isL2
                ? "relative rounded-lg border border-[#5c4a32]/50 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(199,173,128,0.12)_0%,transparent_55%),linear-gradient(180deg,#1a1510_0%,#0c0a08_100%)] p-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.08),0_8px_28px_rgba(0,0,0,0.55)]"
                : "p-1 rounded border border-white/20 bg-black/30"
            }
          >
            <img
              src="/nps/65.png"
              alt=""
              className="w-[140px] sm:w-full h-auto max-h-[280px] object-contain object-bottom mx-auto drop-shadow-[0_6px_16px_rgba(0,0,0,0.65)]"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div
            className={`text-center sm:text-left text-[11px] tracking-[0.14em] uppercase font-semibold ${
              isL2 ? "text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]" : "text-[#ff8c00]"
            }`}
          >
            Татуировщик
          </div>
          <div className={`space-y-2.5 ${isL2 ? "text-[13px] leading-relaxed text-[#d4c4a8]" : "text-sm text-gray-200"}`}>
            <p className={isL2 ? "text-[#c9b99a]" : ""}>
              Мастер татуировок поможет изменить вашу судьбу: на теле героя можно нанести до{" "}
              <span className="text-[#e8c56e] font-medium">{MAX_DYES}</span> символов силы.
            </p>
            <p className={isL2 ? "text-[#a89878]" : "text-gray-400"}>
              Наносите татуировки, чтобы усилить нужные характеристики, но помните — за каждую силу есть своя цена.
            </p>
          </div>

          <details className="group rounded-md border border-[#5c4a32]/35 bg-black/20 px-3 py-2">
            <summary
              className={`cursor-pointer list-none text-[12px] font-medium outline-none ${
                isL2 ? "text-[#c9a44c] hover:text-[#e8c56e]" : "text-amber-500"
              } [&::-webkit-details-marker]:hidden flex items-center gap-1.5`}
            >
              <span className="inline-block transition-transform group-open:rotate-90 text-[10px] opacity-80">▶</span>
              Что дают статы (+1)
            </summary>
            <div
              className={`text-[11px] mt-2 space-y-1 pl-4 border-l border-[#5c4a32]/40 ${
                isL2 ? "text-[#b8a890]" : "text-gray-400"
              }`}
            >
              <div>STR: ~+3% P.Atk</div>
              <div>DEX: ~+1% к скорости атаки, +0.8 к шансу крита</div>
              <div>CON: ~+3% к Max HP/CP</div>
              <div>INT: ~+4% M.Atk</div>
              <div>WIT: ~+5% к Casting Spd., шанс маг. крита</div>
              <div>MEN: ~+1% M.Def и Max MP</div>
            </div>
          </details>

          <div
            className={`rounded-md px-3 py-2 text-[12px] font-medium ${
              isL2
                ? "bg-[#1a1610]/80 border border-[#5c4a32]/40 text-[#e8dcc8]"
                : "bg-black/25 border border-white/10 text-gray-300"
            }`}
          >
            Активных татуировок:{" "}
            <span className="text-[#e8c56e] tabular-nums">
              {activeDyes.length} / {MAX_DYES}
            </span>
          </div>

          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowApplyModal(true)}
              disabled={dyesWithInfo.length === 0 || activeDyes.length >= MAX_DYES}
              className={
                isL2
                  ? btnPrimaryL2
                  : "w-full py-2 rounded bg-green-800/80 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-700"
              }
            >
              Нанести татуировку
            </button>
            <button
              type="button"
              onClick={() => setShowRemoveModal(true)}
              disabled={activeDyes.length === 0}
              className={
                isL2
                  ? btnDangerL2
                  : "w-full py-2 rounded bg-red-900/60 text-red-100 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-800/70"
              }
            >
              Снять татуировку
            </button>
          </div>
        </div>
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
              Выберите татуировку
            </div>

            {dyesWithInfo.length === 0 ? (
              <div className="text-gray-400 text-center py-4 text-[13px]">
                В инвентаре нет красок (для нанесения нужна 1 краска)
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
                        Требуется 1 краска
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
                Отмена
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
              Снятие татуировки
            </div>

            {activeDyes.length === 0 ? (
              <div className="text-gray-400 text-center py-4 text-[13px]">
                Нет активных татуировок
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
                          Стоимость снятия: {removeCost.toLocaleString()} AA
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDye(index)}
                        className="px-3 py-1 bg-red-900/30 text-red-400 border border-red-600 rounded text-[11px] hover:bg-red-900/50"
                      >
                        Снять
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
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
