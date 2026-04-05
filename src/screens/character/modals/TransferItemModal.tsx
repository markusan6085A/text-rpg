import React, { useState } from "react";
import { useHeroStore } from "../../../state/heroStore";
import { HeroInventoryItem } from "../../../types/Hero";
import { sendItemTransferLetter } from "../../../utils/api";
import { itemsDB } from "../../../data/items/itemsDB";
import { normalizeIconPath } from "../../../utils/itemIcon";
import { showToast } from "../../../state/toastStore";
import { isUnauthorizedError } from "../../../utils/isUnauthorizedError";
import { characterModalPanelClass, isCharacterModalL2 } from "../characterModalL2";

interface TransferItemModalProps {
  item: HeroInventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferItemModal({ item, onClose, onSuccess }: TransferItemModalProps) {
  const l2 = isCharacterModalL2();
  const currentHero = useHeroStore((s) => s.hero);
  
  const [recipientName, setRecipientName] = useState("");
  const initialQuantity = Math.max(1, Number((item as any).__initialQuantity) || 1);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isTransferring, setIsTransferring] = useState(false);

  if (!currentHero) return null;

  const itemDef = itemsDB[item.id];
  const itemKind = (item as any).kind || itemDef?.kind;
  const itemSlot = item.slot || itemDef?.slot;
  const isStackable =
    itemKind === "resource" ||
    itemKind === "consumable" ||
    itemKind === "quest" ||
    itemKind === "scroll" ||
    itemSlot === "resource" ||
    itemSlot === "consumable" ||
    itemSlot === "quest";
  const maxQuantity = Math.max(
    1,
    Number((item as any).__maxAvailableCount) || Number(item.count) || 1
  );

  // Визначаємо вартість (беремо з бази, якщо немає в самому предметі)
  const itemPrice = item.stats?.price || itemDef?.stats?.price || 100;
  const transferFeePerItem = Math.floor(itemPrice * 0.05);
  const transferFee = transferFeePerItem * quantity;

  const handleTransfer = async () => {
    if (!recipientName.trim()) {
      showToast("Введіть нікнейм отримувача", "error");
      return;
    }

    if (recipientName.toLowerCase() === currentHero.name?.toLowerCase()) {
      showToast("Не можна передати предмет самому собі", "error");
      return;
    }

    if (quantity < 1 || quantity > maxQuantity) {
      showToast("Некоректна кількість", "error");
      return;
    }

    const currentAdena = Number(currentHero.adena || 0);
    if (currentAdena < transferFee) {
      showToast(`Недостатньо Адени для оплати комісії (${transferFee} Аден)`, "error");
      return;
    }

    setIsTransferring(true);

    try {
      // 1. Формуємо payload
      // Забираємо зайві поля, які можуть заважати (але залишаємо count)
      const itemToTransfer = {
        ...item,
        count: quantity
      };
      
      const payload = JSON.stringify({
        item: itemToTransfer,
        sender: currentHero.name,
      });

      // 2. Сервер атомарно: списує item у відправника + створює лист
      const transferRes = await sendItemTransferLetter({
        toCharacterName: recipientName.trim(),
        itemPayload: payload,
        expectedRevision: Number((currentHero as any)?.heroJson?.heroRevision ?? 0),
      });

      // 3. Оновлюємо локального героя тільки з серверного snapshot
      const character = transferRes.character;
      if (character && typeof character === "object") {
        const heroJson = (character as any).heroJson && typeof (character as any).heroJson === "object"
          ? (character as any).heroJson
          : {};
        const inventory = Array.isArray(heroJson.inventory) ? heroJson.inventory : [];
        const activeDyes = Array.isArray(heroJson.activeDyes) ? heroJson.activeDyes : [];
        const aaFromServer = Number(
          (character as any).aa ??
          (character as any).ancientAdena ??
          (character as any).ancient_adena ??
          0
        );
        const coinLuckFromServer = Number(
          (character as any).coinLuck ??
          (character as any).coinOfLuck ??
          0
        );
        const revision = Number(heroJson.heroRevision ?? 0);
        useHeroStore.getState().applyServerSync({
          level: Number((character as any).level ?? currentHero.level ?? 1),
          exp: Number((character as any).exp ?? currentHero.exp ?? 0),
          sp: Number((character as any).sp ?? currentHero.sp ?? 0),
          adena: Number((character as any).adena ?? currentAdena - transferFee),
          aa: Number.isFinite(aaFromServer) ? aaFromServer : Number((currentHero as any).aa ?? 0),
          coinOfLuck: Number.isFinite(coinLuckFromServer) ? coinLuckFromServer : Number(currentHero.coinOfLuck ?? 0),
          inventory,
          activeDyes,
          heroJson,
        }, {
          level: Number((character as any).level ?? currentHero.level ?? 1),
          exp: Number((character as any).exp ?? currentHero.exp ?? 0),
          sp: Number((character as any).sp ?? currentHero.sp ?? 0),
          adena: Number((character as any).adena ?? currentAdena - transferFee),
          coinLuck: Number.isFinite(coinLuckFromServer) ? coinLuckFromServer : Number(currentHero.coinOfLuck ?? 0),
          heroRevision: Number.isFinite(revision)
            ? revision
            : Number((currentHero as any)?.heroJson?.heroRevision ?? 0),
          updatedAt: Date.now(),
        });
      }

      showToast(`Предмет успішно відправлено гравцю ${recipientName}!`, "success");
      onSuccess();
    } catch (err: any) {
      if (isUnauthorizedError(err)) {
        showToast("Сессия истекла. Войдите снова.", "error");
        window.location.href = "/";
        return;
      }
      console.error("Transfer error:", err);
      showToast(err?.message || "Помилка передачі предмета. Можливо, такого гравця не існує.", "error");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className={characterModalPanelClass("max-w-sm w-full relative")}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={
            l2
              ? "absolute top-2 right-2 text-[#8a7a60] hover:text-[#d4c4a8] text-xl leading-none"
              : "absolute top-2 right-2 text-gray-400 hover:text-white text-xl leading-none"
          }
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className={l2 ? "text-[#e8c56e] font-bold text-center mb-4" : "text-yellow-400 font-bold text-center mb-4"}>
          Передача предмета
        </h2>

        <div
          className={
            l2
              ? "flex items-center gap-3 mb-4 bg-black/30 p-2 rounded-md border border-[#5c4a32]/55 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
              : "flex items-center gap-3 mb-4 bg-black/40 p-2 rounded border border-white/10"
          }
        >
          <img
            src={normalizeIconPath(item.icon || itemDef?.icon) || "/items/drops/Weapon_squires_sword_i00_0.jpg"}
            alt={itemDef?.name || item.name || item.id}
            className={
              l2
                ? "w-10 h-10 object-contain border border-[#5c4a32]/50 rounded-sm"
                : "w-10 h-10 object-contain border border-white/30"
            }
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
            }}
          />
          <div className="flex-1 min-w-0">
            <div className={l2 ? "text-[#e8dcc8] text-sm truncate" : "text-white text-sm truncate"}>
              {itemDef?.name || item.name || item.id}
            </div>
            {item.enchantLevel ? (
              <div className="text-[#b8860b] text-xs">Заточка: +{item.enchantLevel}</div>
            ) : null}
            {isStackable && (
              <div className={l2 ? "text-[#8a7a60] text-xs" : "text-gray-400 text-xs"}>В наявності: {maxQuantity}</div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className={l2 ? "block text-[#8a7a60] text-xs mb-1" : "block text-gray-400 text-xs mb-1"}>
              Нікнейм отримувача:
            </label>
            <input
              type="text"
              className={
                l2
                  ? "w-full bg-[#0d0a06] border border-[#5c4a32]/60 rounded-md px-2 py-1.5 text-[#d4c4a8] text-sm"
                  : "w-full bg-[#0b0806] border border-white/30 rounded px-2 py-1.5 text-white text-sm"
              }
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Введіть нік"
            />
          </div>

          {isStackable && maxQuantity > 1 && (
            <div>
              <label className={l2 ? "block text-[#8a7a60] text-xs mb-1" : "block text-gray-400 text-xs mb-1"}>
                Кількість:
              </label>
              <input
                type="number"
                className={
                  l2
                    ? "w-full bg-[#0d0a06] border border-[#5c4a32]/60 rounded-md px-2 py-1.5 text-[#d4c4a8] text-sm"
                    : "w-full bg-[#0b0806] border border-white/30 rounded px-2 py-1.5 text-white text-sm"
                }
                value={quantity}
                min={1}
                max={maxQuantity}
                onChange={(e) => {
                  let val = parseInt(e.target.value) || 1;
                  if (val > maxQuantity) val = maxQuantity;
                  if (val < 1) val = 1;
                  setQuantity(val);
                }}
              />
            </div>
          )}

          <div className="text-center text-xs mt-2 p-2 bg-[#2a0808]/50 border border-red-900/50 rounded-md">
            <div className={l2 ? "text-[#d4c4a8]" : "text-gray-300"}>Комісія 5% за 1 предмет × кількість:</div>
            <div className={l2 ? "text-[#8a7a60]" : "text-gray-400"}>
              {transferFeePerItem.toLocaleString()} × {quantity}
            </div>
            <div className="text-yellow-400 font-bold">{transferFee.toLocaleString()} Аден</div>
          </div>

          <button
            className="w-full mt-4 bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded text-sm disabled:opacity-50 transition-colors"
            onClick={handleTransfer}
            disabled={isTransferring || !recipientName.trim()}
          >
            {isTransferring ? "Передача..." : "Передати"}
          </button>
        </div>
      </div>
    </div>
  );
}
