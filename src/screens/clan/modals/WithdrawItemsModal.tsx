import React from "react";
import { useHeroStore } from "../../../state/heroStore";
import { type Clan, type ClanWarehouseItem } from "../../../utils/api";
import { withdrawClanWarehouseItem } from "../../../utils/api";
import { itemsDB, itemsDBWithStarter } from "../../../data/items/itemsDB";
import { showToast } from "../../../state/toastStore";
import {
  clanModalBackdropClass,
  clanModalCancelLinkClass,
  clanModalEnchantClass,
  clanModalInnerListClass,
  clanModalItemRowClass,
  clanModalMutedClass,
  clanModalPanelClass,
  clanModalTitleClass,
} from "./clanModalL2";

interface WithdrawItemsModalProps {
  clan: Clan;
  items: ClanWarehouseItem[];
  onClose: () => void;
  onWithdrawSuccess: () => void;
}

export default function WithdrawItemsModal({
  clan,
  items,
  onClose,
  onWithdrawSuccess,
}: WithdrawItemsModalProps) {
  const heroStore = useHeroStore();
  const enchantCls = clanModalEnchantClass();

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

  const handleWithdraw = async (item: ClanWarehouseItem) => {
    if (!clan) return;
    try {
      const expectedRevision = Number((heroStore.hero as any)?.heroJson?.heroRevision ?? 0);
      const response = await withdrawClanWarehouseItem(clan.id, item.id, expectedRevision);
      if (response.ok) {
        applyServerCharacterSnapshot((response as any).character);
        onClose();
        onWithdrawSuccess();
      }
    } catch (err: any) {
      console.error("[WithdrawItemsModal] Failed to withdraw item:", err);
      showToast(err.message || "Ошибка при выводе предмета", "error");
    }
  };

  return (
    <div className={clanModalBackdropClass()}>
      <div className={clanModalPanelClass("max-w-[360px] mx-auto")}>
        <div className={clanModalTitleClass()}>Выберите предмет для вывода:</div>
        <div className={`${clanModalInnerListClass()} mb-4`}>
          {items.length === 0 ? (
            <div className={`text-[11px] ${clanModalMutedClass()}`}>Склад пуст</div>
          ) : (
            items.map((item) => {
              const itemDef = itemsDBWithStarter[item.itemId] || itemsDB[item.itemId];
              const itemName = item.meta?.name || itemDef?.name || item.itemId;
              const enchantLevel = (item.meta as any)?.enchantLevel ?? 0;
              const iconPath = item.meta?.icon || itemDef?.icon || "/items/drops/Weapon_squires_sword_i00_0.jpg";
              const finalIconPath = iconPath.startsWith("/") ? iconPath : `/items/${iconPath}`;
              return (
                <div
                  key={item.id}
                  className={clanModalItemRowClass()}
                  onClick={() => handleWithdraw(item)}
                  onKeyDown={(e) => e.key === "Enter" && handleWithdraw(item)}
                  role="button"
                  tabIndex={0}
                >
                  <img
                    src={finalIconPath}
                    alt={itemName}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/items/drops/Weapon_squires_sword_i00_0.jpg";
                    }}
                  />
                  <span>
                    {itemName}
                    {enchantLevel > 0 && (
                      <span className={enchantCls}> +{enchantLevel}</span>
                    )}{" "}
                    x{item.qty || 1}
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
