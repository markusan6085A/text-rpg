import React, { useState } from "react";
import { useHeroStore } from "../../../state/heroStore";
import { type Clan } from "../../../utils/api";
import { depositClanWarehouseItem } from "../../../utils/api";
import { CATEGORIES } from "../../character/InventoryFilters";
import { itemsDB, itemsDBWithStarter } from "../../../data/items/itemsDB";
import { showToast } from "../../../state/toastStore";
import {
  clanModalBackdropClass,
  clanModalCancelLinkClass,
  clanModalChipClass,
  clanModalEnchantClass,
  clanModalInnerListClass,
  clanModalItemRowClass,
  clanModalMutedClass,
  clanModalPanelClass,
  clanModalTitleClass,
  clanModalIsL2,
} from "./clanModalL2";

interface DepositItemsModalProps {
  clan: Clan;
  onClose: () => void;
  onDepositSuccess: () => void;
}

export default function DepositItemsModal({
  clan,
  onClose,
  onDepositSuccess,
}: DepositItemsModalProps) {
  const hero = useHeroStore((s) => s.hero);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const isL2 = clanModalIsL2();
  const subLbl = isL2 ? "text-[12px] text-[#a89470] mb-2" : "text-[12px] text-[#c7ad80] mb-2";

  const applyServerCharacterSnapshot = (character: any) => {
    if (!character || typeof character !== "object") return;
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
      level: Number((character as any).level ?? 1),
      exp: Number((character as any).exp ?? 0),
      sp: Number((character as any).sp ?? 0),
      adena: Number((character as any).adena ?? 0),
      aa: Number.isFinite(aaFromServer) ? aaFromServer : 0,
      coinOfLuck: Number.isFinite(coinLuckFromServer) ? coinLuckFromServer : 0,
      inventory,
      activeDyes,
      heroJson,
    }, {
      level: Number((character as any).level ?? 1),
      exp: Number((character as any).exp ?? 0),
      sp: Number((character as any).sp ?? 0),
      adena: Number((character as any).adena ?? 0),
      coinLuck: Number.isFinite(coinLuckFromServer) ? coinLuckFromServer : 0,
      heroRevision: Number.isFinite(revision) ? revision : 0,
      updatedAt: Date.now(),
    });
  };

  const handleDeposit = async (item: any) => {
    if (!clan) return;
    try {
      const itemId = item.id || item.itemId;
      const expectedRevision = Number((hero as any)?.heroJson?.heroRevision ?? 0);
      const response = await depositClanWarehouseItem(
        clan.id,
        itemId,
        item.count || 1,
        { name: item.name, slot: item.slot, icon: item.icon, kind: item.kind, enchantLevel: item.enchantLevel ?? 0 },
        expectedRevision
      );
      if (response.ok) {
        applyServerCharacterSnapshot((response as any).character);
        onClose();
        onDepositSuccess();
      }
    } catch (err: any) {
      console.error("[DepositItemsModal] Failed to deposit item:", err);
      showToast(err.message || "Ошибка при пополнении склада", "error");
    }
  };

  const category = CATEGORIES.find((c) => c.key === selectedCategory) || CATEGORIES[0];
  const filteredItems =
    hero?.inventory?.filter(
      (item: any) =>
        item &&
        category.test(item) &&
        String(item.id || item.itemId || "") !== "seven_seals_medal"
    ) || [];
  const enchantCls = clanModalEnchantClass();

  return (
    <div className={clanModalBackdropClass()}>
      <div className={clanModalPanelClass("max-w-[360px] mx-auto max-h-[80vh] overflow-y-auto")}>
        <div className={clanModalTitleClass()}>Выберите категорию:</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={clanModalChipClass(selectedCategory === cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className={subLbl}>Выберите предмет:</div>
        <div className={`${clanModalInnerListClass()} mb-4`}>
          {filteredItems.length === 0 ? (
            <div className={`text-[11px] ${clanModalMutedClass()}`}>Нет предметов в этой категории</div>
          ) : (
            filteredItems.map((item: any, idx: number) => {
              const itemId = item.id || item.itemId;
              const itemDef = itemsDBWithStarter[itemId] || itemsDB[itemId];
              const iconPath = item.icon || itemDef?.icon || "/items/drops/Weapon_squires_sword_i00_0.jpg";
              const finalIconPath = iconPath.startsWith("/") ? iconPath : `/items/${iconPath}`;
              return (
                <div
                  key={`${itemId}-${idx}`}
                  className={clanModalItemRowClass()}
                  onClick={() => handleDeposit(item)}
                  onKeyDown={(e) => e.key === "Enter" && handleDeposit(item)}
                  role="button"
                  tabIndex={0}
                >
                  <img
                    src={finalIconPath}
                    alt={item.name || item.id}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                    }}
                  />
                  <span>
                    {item.name || item.id}
                    {(item.enchantLevel ?? 0) > 0 && (
                      <span className={enchantCls}> +{item.enchantLevel}</span>
                    )}{" "}
                    x{item.count || 1}
                  </span>
                </div>
              );
            })
          )}
        </div>
        <button type="button" onClick={onClose} className={clanModalCancelLinkClass()}>
          Отмена
        </button>
      </div>
    </div>
  );
}
