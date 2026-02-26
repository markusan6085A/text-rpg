import React, { useState } from "react";
import { useHeroStore } from "../../../state/heroStore";
import { HeroInventoryItem } from "../../../types/Hero";
import { sendItemTransferLetter } from "../../../utils/api";
import { itemsDB } from "../../../data/items/itemsDB";

interface TransferItemModalProps {
  item: HeroInventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferItemModal({ item, onClose, onSuccess }: TransferItemModalProps) {
  const currentHero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  
  const [recipientName, setRecipientName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isTransferring, setIsTransferring] = useState(false);

  if (!currentHero) return null;

  const isStackable = item.kind === "resource" || item.kind === "consumable" || item.kind === "quest" || item.kind === "scroll";
  const maxQuantity = item.count || 1;

  // Визначаємо вартість (беремо з бази, якщо немає в самому предметі)
  const itemDef = itemsDB[item.id];
  const itemPrice = item.stats?.price || itemDef?.stats?.price || 100;
  const transferFee = Math.max(1, Math.floor((itemPrice * quantity) * 0.05));

  const handleTransfer = async () => {
    if (!recipientName.trim()) {
      alert("Введіть нікнейм отримувача");
      return;
    }

    if (recipientName.toLowerCase() === currentHero.name?.toLowerCase()) {
      alert("Не можна передати предмет самому собі");
      return;
    }

    if (quantity < 1 || quantity > maxQuantity) {
      alert("Некоректна кількість");
      return;
    }

    const currentAdena = Number(currentHero.adena || 0);
    if (currentAdena < transferFee) {
      alert(`Недостатньо Адени для оплати комісії (${transferFee} Аден)`);
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

      // 2. Відправляємо на сервер
      await sendItemTransferLetter({
        toCharacterName: recipientName.trim(),
        itemPayload: payload,
      });

      // 3. Знімаємо предмет та комісію у відправника
      const newAdena = currentAdena - transferFee;
      
      let itemRemoved = false;
      const newInventory = currentHero.inventory.flatMap((i) => {
        // Знаходимо саме цей предмет за id та рівнем заточки
        if (!itemRemoved && i.id === item.id && (i.enchantLevel || 0) === (item.enchantLevel || 0)) {
          itemRemoved = true;
          if (i.count && i.count > quantity) {
            return [{ ...i, count: i.count - quantity }];
          }
          return []; // Видаляємо повністю
        }
        return [i];
      });

      updateHero({
        adena: newAdena,
        inventory: newInventory,
      });

      alert(`Предмет успішно відправлено гравцю ${recipientName}!`);
      onSuccess();
    } catch (err: any) {
      console.error("Transfer error:", err);
      alert(err?.message || "Помилка передачі предмета. Можливо, такого гравця не існує.");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl leading-none"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-yellow-400 font-bold text-center mb-4">Передача предмета</h2>

        <div className="flex items-center gap-3 mb-4 bg-black/40 p-2 rounded border border-white/10">
          <img
            src={item.icon?.startsWith("/") ? item.icon : `/items/${item.icon}`}
            alt={item.name}
            className="w-10 h-10 object-contain border border-white/30"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm truncate">{item.name}</div>
            {item.enchantLevel ? (
              <div className="text-[#b8860b] text-xs">Заточка: +{item.enchantLevel}</div>
            ) : null}
            {isStackable && (
              <div className="text-gray-400 text-xs">В наявності: {maxQuantity}</div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-gray-400 text-xs mb-1">Нікнейм отримувача:</label>
            <input
              type="text"
              className="w-full bg-[#0b0806] border border-white/30 rounded px-2 py-1.5 text-white text-sm"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Введіть нік"
            />
          </div>

          {isStackable && maxQuantity > 1 && (
            <div>
              <label className="block text-gray-400 text-xs mb-1">Кількість:</label>
              <input
                type="number"
                className="w-full bg-[#0b0806] border border-white/30 rounded px-2 py-1.5 text-white text-sm"
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

          <div className="text-center text-xs mt-2 p-2 bg-[#2a0808]/50 border border-red-900/50 rounded">
            <div className="text-gray-300">Комісія за передачу (5%):</div>
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
