import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  useHeroStore,
  getInventoryMax,
  OVERFLOW_CHEST_ID,
  applyCharacterSnapshotFromApi,
  applyHeroJsonSnapshotFromApi,
} from "../../state/heroStore";
import { useAdminStore } from "../../state/adminStore";
import { useCharacterStore } from "../../state/characterStore";
import { clearInventoryAPI, deleteInventoryItemAPI } from "../../utils/api";
import Equipment from "./Equipment";
import InventoryFilters, { CATEGORIES } from "./InventoryFilters";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import InventoryItemList from "./InventoryItemList";
import InventoryItemModal from "./modals/InventoryItemModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import IncreaseInventoryModal from "./modals/IncreaseInventoryModal";
import TransferItemModal from "./modals/TransferItemModal";
import OverflowChestModal from "./modals/OverflowChestModal";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../../utils/l2WarmLayoutClassNames";
import { showToast } from "../../state/toastStore";
import type { HeroInventoryItem } from "../../types/Hero";
import {
  inventoryRowItemId,
  serverInventoryIndexFromFilteredSelection,
  applyAdminEnchantToHeroInventory,
  heroInventoryIndexFromFilteredIndex,
} from "../../utils/adminInventoryEnchant";
import { adminGetPlayerInventory, adminSetInventoryEnchant } from "../../utils/api/admin";
import { loadHeroFromAPI } from "../../state/heroStore/heroLoadAPI";
import { useAuthStore } from "../../state/authStore";
import { useBattleStore } from "../../state/battle/store";
import { commitEquipStateAPI } from "../../utils/api/equipAPI";

const ITEMS_PER_PAGE = 25;
// Валюта в полях героя — у списку інвентаря не дублюємо. Ancient Adena лише в інвентарі (стек) — показуємо.
const CURRENCY_IDS = new Set(["adena", "coin_of_luck", "coins_silver"]);

const spaNavigate = (path: string) => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export default function Inventory() {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const equipItem = useHeroStore((s) => s.equipItem);
  const unequipItem = useHeroStore((s) => s.unequipItem);

  console.log('[Inventory] Component rendered, hero:', hero ? 'exists' : 'null');

  const [currentCategory, setCurrentCategory] = useState("all");
  const [currentGrade, setCurrentGrade] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ item: any; amount: number } | null>(null);
  const [showIncreaseCapacityModal, setShowIncreaseCapacityModal] = useState(false);
  const [transferModalItem, setTransferModalItem] = useState<any | null>(null);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeLoading, setWipeLoading] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);
  const characterId = useCharacterStore((s) => s.characterId);
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const adminChecked = useAdminStore((s) => s.checked);
  const [adminEnchantDraft, setAdminEnchantDraft] = useState<Record<number, string>>({});

  useEffect(() => {
    void useAdminStore.getState().checkAdmin();
  }, []);

  // Один персонаж на всіх пристроях: при відкритті інвентаря — GET + merge. Під час бою не викликаємо setHero:
  // інакше до приходу PUT сервер може віддати старі стаки сосків і перезатерти локальну витрату.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!useAuthStore.getState().isAuthenticated || !characterId) return;
      if (useBattleStore.getState().status === "fighting") return;
      try {
        const h = await loadHeroFromAPI();
        if (alive && h) useHeroStore.getState().setHero(h);
      } catch {
        /* залишаємо поточного героя в store */
      }
    })();
    return () => {
      alive = false;
    };
  }, [characterId]);

  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const l2RowBase =
    "w-full text-[11px] py-2 px-2.5 mb-2 rounded-md flex items-center gap-2 bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 shadow-[inset_0_1px_0_rgba(199,173,128,0.12),0_4px_14px_rgba(0,0,0,0.55)]";
  const l2ToolbarBtnSecondary =
    "text-[10px] px-2 py-1 rounded-md border border-[#5c4a32]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-[#d4c4a8] shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] hover:border-[#c7ad80]/45 hover:brightness-110 active:scale-[0.99] transition-[border-color,transform,filter] duration-150";
  const l2ToolbarBtnDanger =
    "text-[10px] px-2 py-1 rounded-md border border-red-900/50 bg-gradient-to-b from-[#3a1818] to-[#1c0c0c] text-red-200/90 shadow-[inset_0_1px_0_rgba(255,120,120,0.08)] hover:border-red-600/60 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100";

  // Hero вже завантажений в App.tsx, не потрібно завантажувати тут

  // Фільтрація предметів
  const filteredItems = useMemo(() => {
    if (!hero || !hero.inventory) return [];
    const category = CATEGORIES.find((c) => c.key === currentCategory) || CATEGORIES[0];
    let items = hero.inventory.filter(
      (item: any) => item && !CURRENCY_IDS.has(item.id) && category.test(item)
    );
    if (currentGrade) {
      const gradeUpper = currentGrade.toUpperCase();
      items = items.filter((item: any) => {
        const def = itemsDB[item.id] || itemsDBWithStarter[item.id];
        return def?.grade?.toUpperCase() === gradeUpper;
      });
    }
    // Сундук переповнення — показуємо тільки в "Все", на початку списку
    const overflowChest = hero.overflowChest || [];
    if (overflowChest.length > 0) {
      const totalInChest = overflowChest.reduce((s: number, i: any) => s + (i.count ?? 1), 0);
      const chestItem = { id: OVERFLOW_CHEST_ID, name: "Сундук переповнення", slot: "quest", count: totalInChest, icon: "/items/drops/resources/collection_box.jpg" };
      items = [chestItem, ...items];
    }
    return items;
  }, [hero, currentCategory, currentGrade]);

  // Пагінація
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleAdminEnchantApply = useCallback(
    async (item: HeroInventoryItem, pageLocalIndex: number) => {
      if (!hero || !characterId) return;
      const filteredIndex = startIndex + pageLocalIndex;
      const raw =
        adminEnchantDraft[filteredIndex] ?? String(item.enchantLevel ?? 0);
      const want = Math.floor(Number(String(raw).trim().replace(",", ".")) || 0);
      try {
        const { inventory: serverInv } = await adminGetPlayerInventory(characterId);
        const ix = serverInventoryIndexFromFilteredSelection(
          serverInv,
          filteredItems,
          filteredIndex
        );
        if (ix < 0) {
          showToast("Рядок не знайдено на сервері — оновіть інвентар (F5)", "error");
          return;
        }
        const row = serverInv[ix];
        const expectedItemId = inventoryRowItemId(row);
        const expectedEnchant = Math.max(0, Math.floor(Number(row?.enchantLevel ?? 0)));
        const expectedCount = Math.max(1, Math.floor(Number(row?.count ?? 1)));
        const r = await adminSetInventoryEnchant(characterId, {
          index: ix,
          enchantLevel: want,
          expectedItemId,
          expectedEnchant,
          expectedCount,
        });
        // Оновлюємо live store одразу, щоб loadHeroFromAPI injection не перетер нову заточку
        const confirmedLevel = r.enchantLevel ?? want;
        const localIx = heroInventoryIndexFromFilteredIndex(hero, filteredItems, filteredIndex);
        if (localIx >= 0) {
          const { ok, inventory: patchedInv } = applyAdminEnchantToHeroInventory(
            hero, localIx, String(confirmedLevel)
          );
          if (ok && patchedInv) useHeroStore.getState().updateHero({ inventory: patchedInv });
        }
        const loaded = await loadHeroFromAPI();
        if (loaded) useHeroStore.getState().setHero(loaded);
        showToast(`Заточка (адмін, сервер): +${confirmedLevel}`, "success");
      } catch (e: any) {
        const msg =
          e?.status === 409
            ? "Інвентар змінився, оновіть і спробуйте ще"
            : e?.message || "Помилка";
        showToast(msg, "error");
      }
    },
    [hero, characterId, filteredItems, startIndex, adminEnchantDraft]
  );

  // Кількість зайнятих слотів (включаючи слот сундука переповнення)
  const invCount = (hero?.inventory || []).filter((i: any) => i && i.id !== OVERFLOW_CHEST_ID).length;
  const itemsUsed = invCount + (hero?.overflowChest?.length ? 1 : 0);
  const maxSlots = getInventoryMax(hero);

  // Обробники для модалок
  const handleItemClick = (item: any) => {
    setSelectedItem(item);
  };

  const handleTransfer = (item: any, amount: number) => {
    if (item?.id === OVERFLOW_CHEST_ID) return;
    const itemCount = Math.max(1, Number(amount) || 1);
    const maxCount = Number(item.count || 1);
    const preparedCount = Math.max(1, Math.min(maxCount, itemCount));
    setTransferModalItem({
      ...item,
      __initialQuantity: preparedCount,
      __maxAvailableCount: maxCount,
    });
  };

  const handleDeleteRequest = (item: any, amount: number) => {
    setDeleteConfirmItem({ item, amount });
  };

  // Функція підтвердження видалення
  const confirmDelete = async () => {
    if (!hero || !deleteConfirmItem) return;
    if (deleteConfirmItem.item?.id === OVERFLOW_CHEST_ID) {
      setDeleteConfirmItem(null);
      setSelectedItem(null);
      return;
    }
    const { item, amount } = deleteConfirmItem;
    
    // Знаходимо індекс предмета в hero.inventory
    // Спочатку намагаємося знайти за посиланням (якщо це той самий об'єкт)
    let itemIndex = hero.inventory.findIndex((i: any) => i === item);
    
    // Якщо не знайдено за посиланням, використовуємо індекс з filteredItems
    if (itemIndex === -1) {
      // Знаходимо індекс предмета в filteredItems
      const filteredIndex = filteredItems.findIndex((i: any) => i === item);
      
      if (filteredIndex !== -1) {
        // Знаходимо відповідний предмет в hero.inventory
        // Оскільки filteredItems - це відфільтрований список з hero.inventory,
        // ми можемо знайти предмет за тим самим індексом в оригінальному масиві
        // Але оскільки filteredItems може бути відфільтрованим, потрібно знайти
        // предмет за унікальними властивостями
        
        const filteredItem = filteredItems[filteredIndex];
        
        // Рахуємо, скільки предметів з таким id зустрічається до цього індексу в filteredItems
        let countBefore = 0;
        for (let i = 0; i < filteredIndex; i++) {
          const prevItem = filteredItems[i];
          if (prevItem.id === filteredItem.id && 
              (prevItem.enchantLevel ?? 0) === (filteredItem.enchantLevel ?? 0)) {
            countBefore++;
          }
        }
        
        // Знаходимо відповідний предмет в hero.inventory
        let foundCount = 0;
        itemIndex = hero.inventory.findIndex((i: any) => {
          if (i.id === filteredItem.id && 
              (i.enchantLevel ?? 0) === (filteredItem.enchantLevel ?? 0)) {
            if (foundCount === countBefore) {
              return true;
            }
            foundCount++;
          }
          return false;
        });
      }
      
      // Якщо все ще не знайдено, використовуємо простий пошук за id (останній варіант)
      if (itemIndex === -1) {
        itemIndex = hero.inventory.findIndex((i: any) => i.id === item.id);
      }
    }
    
    if (itemIndex === -1) {
      console.error("[Inventory] Item not found in inventory:", item);
      setSelectedItem(null);
      setDeleteConfirmItem(null);
      return;
    }

    if (!characterId) {
      showToast("Для видалення предмета потрібна онлайн-сесія персонажа.", "error");
      return;
    }

    try {
      const row = hero.inventory[itemIndex];
      const expectedItemId = inventoryRowItemId(row);
      if (!expectedItemId) {
        showToast("Не вдалося визначити предмет для видалення. Оновіть інвентар.", "error");
        return;
      }
      const expectedRevision = Number(
        (useHeroStore.getState() as any).serverState?.heroRevision ??
        (hero as any)?.heroJson?.heroRevision ??
        0
      );
      const res = await deleteInventoryItemAPI(characterId, {
        expectedRevision: Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0,
        inventoryIndex: itemIndex,
        amount: Math.max(1, Math.floor(Number(amount) || 1)),
        expectedItemId,
        expectedEnchantLevel: Math.max(0, Math.floor(Number((row as any)?.enchantLevel ?? 0))),
      });
      applyCharacterSnapshotFromApi((res as any).character);
      setSelectedItem(null);
      setDeleteConfirmItem(null);
    } catch (e: any) {
      const isNotFound = e?.status === 404 || String(e?.message || "").toLowerCase().includes("not found");
      if (isNotFound) {
        try {
          // Backward compatibility: older backend may not have /inventory/delete yet.
          // Reuse existing /equip-commit transaction with unchanged equipment and reduced inventory row.
          const live = useHeroStore.getState().hero;
          if (!live) throw new Error("hero not loaded");
          const inv = [...(live.inventory ?? [])];
          if (itemIndex < 0 || itemIndex >= inv.length) throw new Error("item not found in live inventory");
          const row = inv[itemIndex] as any;
          const rowCount = Math.max(1, Number(row?.count ?? 1));
          const delAmount = Math.max(1, Math.floor(Number(amount) || 1));
          if (delAmount >= rowCount) inv.splice(itemIndex, 1);
          else inv[itemIndex] = { ...row, count: rowCount - delAmount };
          const expectedRevision = Number(
            useHeroStore.getState().serverState?.heroRevision ??
            (live as any)?.heroJson?.heroRevision ??
            0
          );
          const legacyRes = await commitEquipStateAPI({
            equipment: (live as any).equipment ?? {},
            inventory: inv,
            equipmentEnchantLevels: (live as any).equipmentEnchantLevels ?? {},
            expectedRevision: Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0,
          });
          if ((legacyRes as any).character) applyCharacterSnapshotFromApi((legacyRes as any).character);
          else applyHeroJsonSnapshotFromApi((legacyRes as any).heroJson);
          setSelectedItem(null);
          setDeleteConfirmItem(null);
          return;
        } catch (legacyErr: any) {
          showToast(legacyErr?.message || "Сервер не підтримує видалення предмета в цій версії.", "error");
          return;
        }
      }
      if (e?.status === 409) {
        showToast("Інвентар змінився в іншій сесії. Оновіть стан і спробуйте ще.", "error");
        return;
      }
      showToast(e?.message || e?.error || "Помилка видалення на сервері", "error");
    }
  };

  if (!hero) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[#8a7a60]">
        <div className="w-5 h-5 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin" />
        <span className="text-xs">Загрузка...</span>
      </div>
    );
  }

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 flex flex-col items-center px-3 py-3 text-[#e8dcc8]`
          : "w-full flex flex-col items-center px-4 py-2 text-white"
      }
    >
      <div className={isL2 ? "w-full max-w-[420px] mx-auto" : "w-full max-w-[360px]"}>
        {isL2 && (
          <div className="text-[13px] font-semibold text-[#e8c56e] text-center mb-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_0_14px_rgba(184,134,11,0.3)]">
            Инвентарь
          </div>
        )}
        <div className={isL2 ? "w-full mb-3" : "w-full mb-2"}>
          <button
            type="button"
            onClick={() => spaNavigate("/quests")}
            className={
              isL2
                ? "w-full rounded-lg border border-[#c7ad80]/40 bg-[linear-gradient(180deg,rgba(55,44,28,0.55)_0%,rgba(18,14,10,0.95)_100%)] px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgba(212,175,108,0.12),0_6px_20px_rgba(0,0,0,0.4)] hover:border-[#e8c56e]/45 hover:brightness-110 active:scale-[0.99] transition-[border-color,transform,filter] duration-150"
                : "w-full rounded border border-[#c7ad80]/50 bg-[#2a241c] px-2 py-2 text-left hover:bg-[#3a3228]"
            }
          >
            <div className="flex items-center gap-2">
              <img src="/nps/6.png" alt="" className="w-8 h-8 object-contain shrink-0 opacity-95" />
              <div className="min-w-0 flex-1">
                <div className={isL2 ? "text-[12px] font-semibold text-[#e8c56e]" : "text-sm font-semibold text-[#ffd700]"}>
                  Квесты персонажа
                </div>
                <div className={isL2 ? "text-[10px] text-[#a89878] mt-0.5" : "text-[11px] text-gray-400 mt-0.5"}>
                  Сюжетные и региональные задания
                </div>
              </div>
              <span className={isL2 ? "text-[#8a7a60] text-lg shrink-0" : "text-gray-500"} aria-hidden>
                ›
              </span>
            </div>
          </button>
        </div>
        <Equipment compact={true} />

        <div
          className={
            isL2
              ? "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2 rounded-lg border border-[#5c4a32]/40 bg-black/20 px-2.5 py-2"
              : "flex justify-between items-center gap-2 mb-1"
          }
          style={isL2 ? undefined : { color: "#d9d9d9" }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <div className={isL2 ? "text-[11px] text-[#d4c4a8]" : "text-xs"}>
              {itemsUsed}/{maxSlots}
            </div>
            <button
              type="button"
              onClick={() => invCount > 0 && setShowWipeConfirm(true)}
              disabled={invCount === 0}
              className={
                isL2
                  ? l2ToolbarBtnDanger
                  : "text-[11px] px-2 py-1 rounded border border-red-800/60 bg-red-900/30 text-red-300 hover:bg-red-900/50 hover:border-red-700/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              }
            >
              Очистить инвентарь
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowIncreaseCapacityModal(true)}
            className={
              isL2
                ? l2ToolbarBtnSecondary
                : "text-[11px] px-2 py-1 rounded border border-[#6b6b6b] bg-[#4a4a4a] text-[#c0c0c0] hover:bg-[#5a5a5a] hover:border-[#7a7a7a] transition-colors"
            }
          >
            Увеличить вместимость инвентаря
          </button>
        </div>

        {isL2 ? (
          <div className="mb-2 space-y-0">
            <div className={`${l2RowBase} justify-between text-[#e8dcc8]`}>
              <span className="text-[#c7ad80]">Аден:</span>
              <span className="text-[#f0d78c]">{(hero?.adena ?? 0).toLocaleString("ru-RU")}</span>
            </div>
            <div className={`${l2RowBase} justify-between text-[#e8dcc8]`}>
              <span className="text-[#c7ad80]">Coin of Luck:</span>
              <span className="text-[#f0d78c]">{hero?.coinOfLuck ?? 0}</span>
            </div>
            <div className={`${l2RowBase} justify-between text-[#e8dcc8]`}>
              <span className="text-[#c7ad80]">Серебряные Монеты:</span>
              <span className="text-[#f0d78c]">{(hero as any)?.coins_silver ?? 0}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5 mb-2 text-left text-[11px]">
            <div className="flex justify-between">
              <span style={{ color: "#c7ad80" }}>Аден:</span>
              <span className="text-gray-400">{(hero?.adena ?? 0).toLocaleString("ru-RU")}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#c7ad80" }}>Coin of Luck:</span>
              <span className="text-gray-400">{hero?.coinOfLuck ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#c7ad80" }}>Серебряные Монеты:</span>
              <span className="text-gray-400">{(hero as any)?.coins_silver ?? 0}</span>
            </div>
          </div>
        )}

        <InventoryFilters
          currentCategory={currentCategory}
          currentGrade={currentGrade}
          onCategoryChange={(category) => {
            setCurrentCategory(category);
            setCurrentGrade("");
            setCurrentPage(1);
          }}
          onGradeChange={(grade) => {
            setCurrentGrade(grade);
            setCurrentPage(1);
          }}
        />

        <InventoryItemList
          items={paginatedItems}
          hero={hero}
          onItemClick={handleItemClick}
          onEquipItem={equipItem}
          showAdminEnchant={adminChecked && isAdmin}
          filteredBaseIndex={startIndex}
          adminEnchantDraft={adminEnchantDraft}
          onAdminEnchantDraftChange={(filteredIndex, value) =>
            setAdminEnchantDraft((p) => ({ ...p, [filteredIndex]: value }))
          }
          onAdminEnchantApply={handleAdminEnchantApply}
        />

        {/* Пагінація: << < [вікно сторінок] > >> — завжди можна перейти на 1-шу та останню */}
        {totalPages > 1 && (() => {
          const WINDOW = 5; // скільки номерів показувати
          const half = Math.floor(WINDOW / 2);
          let start = Math.max(1, currentPage - half);
          let end = Math.min(totalPages, start + WINDOW - 1);
          if (end - start + 1 < WINDOW) start = Math.max(1, end - WINDOW + 1);
          const pages: (number | "…")[] = [];
          if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push("…");
          }
          for (let p = start; p <= end; p++) pages.push(p);
          if (end < totalPages) {
            if (end < totalPages - 1) pages.push("…");
            pages.push(totalPages);
          }
          return (
            <div
              className={
                isL2
                  ? "flex flex-wrap justify-center items-center gap-1 text-[10px] mt-2 rounded-md border border-[#5c4a32]/45 bg-black/20 px-2 py-1.5 text-[#d4c4a8]"
                  : "flex flex-wrap justify-center items-center gap-1 text-[10px]"
              }
              style={isL2 ? undefined : { color: "#d9d9d9" }}
            >
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={
                  isL2
                    ? "px-1.5 py-0.5 rounded disabled:opacity-30 disabled:cursor-not-allowed shrink-0 text-[#d4c4a8] hover:text-[#f4e2b8]"
                    : "px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                }
                style={!isL2 ? { color: "#d9d9d9" } : undefined}
                title="На першу"
              >
                &lt;&lt;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={
                  isL2
                    ? "px-1.5 py-0.5 rounded disabled:opacity-30 disabled:cursor-not-allowed shrink-0 text-[#d4c4a8] hover:text-[#f4e2b8]"
                    : "px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                }
                style={!isL2 ? { color: "#d9d9d9" } : undefined}
                title="Попередня"
              >
                &lt;
              </button>
              {pages.map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-0.5 text-[#8a7a60]">
                    …
                  </span>
                ) : (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`px-1.5 py-0.5 shrink-0 rounded ${
                      currentPage === p
                        ? isL2
                          ? "bg-[#5a4424] text-[#f5d7a1] font-semibold ring-1 ring-[#c7ad80]/25"
                          : "bg-[#5a4424] text-[#f5d7a1] font-semibold"
                        : isL2
                          ? "text-[#d4c4a8] hover:text-[#f4e2b8]"
                          : ""
                    }`}
                    style={!isL2 && currentPage !== p ? { color: "#d9d9d9" } : undefined}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={
                  isL2
                    ? "px-1.5 py-0.5 rounded disabled:opacity-30 disabled:cursor-not-allowed shrink-0 text-[#d4c4a8] hover:text-[#f4e2b8]"
                    : "px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                }
                style={!isL2 ? { color: "#d9d9d9" } : undefined}
                title="Наступна"
              >
                &gt;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={
                  isL2
                    ? "px-1.5 py-0.5 rounded disabled:opacity-30 disabled:cursor-not-allowed shrink-0 text-[#d4c4a8] hover:text-[#f4e2b8]"
                    : "px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                }
                style={!isL2 ? { color: "#d9d9d9" } : undefined}
                title="На останню"
              >
                &gt;&gt;
              </button>
            </div>
          );
        })()}
      </div>

      {/* Модалки залежно від типу предмета */}
      {selectedItem?.id === OVERFLOW_CHEST_ID && hero && (
        <OverflowChestModal hero={hero} onClose={() => setSelectedItem(null)} />
      )}
      {selectedItem && selectedItem?.id !== OVERFLOW_CHEST_ID && hero && (
        <InventoryItemModal
          item={selectedItem}
          hero={hero}
          inventory={hero.inventory || []}
          onClose={() => setSelectedItem(null)}
          onDelete={confirmDelete}
          onTransfer={handleTransfer}
          onDeleteRequest={handleDeleteRequest}
          updateHero={updateHero}
        />
      )}

      {/* Модалка підтвердження видалення */}
      {deleteConfirmItem && (
        <DeleteConfirmModal
          item={deleteConfirmItem.item}
          amount={deleteConfirmItem.amount}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmItem(null)}
        />
      )}

      {/* Модалка збільшення інвентаря (1 Coin of Luck = +1 слот) */}
      {showIncreaseCapacityModal && (
        <IncreaseInventoryModal onClose={() => setShowIncreaseCapacityModal(false)} />
      )}

      {transferModalItem && (
        <TransferItemModal
          item={transferModalItem}
          onClose={() => setTransferModalItem(null)}
          onSuccess={() => {
            setTransferModalItem(null);
            setSelectedItem(null);
          }}
        />
      )}

      {/* Модалка підтвердження вайпу інвентаря */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4">
          <div
            className={
              isL2
                ? "rounded-xl border border-[#c7ad80]/35 p-6 max-w-md w-full shadow-[0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(120,90,45,0.22)_0%,transparent_55%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]"
                : "bg-[#14110c] border border-white/40 rounded-lg p-6 max-w-md w-full"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className={
                  isL2
                    ? "text-base font-semibold text-red-300 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
                    : "text-lg font-semibold text-red-400"
                }
              >
                Очистить инвентарь
              </h2>
              <button
                type="button"
                className={
                  isL2
                    ? "text-[#8a7a60] hover:text-[#d4c4a8] text-xl leading-none"
                    : "text-gray-400 hover:text-white text-xl"
                }
                onClick={() => setShowWipeConfirm(false)}
              >
                ×
              </button>
            </div>
            <p className={isL2 ? "text-[#d4c4a8] text-sm mb-6" : "text-gray-300 text-sm mb-6"}>
              Удалить все предметы из инвентаря? Экипировка не затронута. Действие нельзя отменить!
            </p>
            {wipeError && (
              <p className="text-red-400 text-xs mb-4">{wipeError}</p>
            )}
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowWipeConfirm(false);
                  setWipeError(null);
                }}
                disabled={wipeLoading}
                className={
                  isL2
                    ? "px-4 py-2 rounded-md bg-[#2a2620] border border-[#5c4a32]/70 text-xs text-[#d4c4a8] hover:border-[#c7ad80]/40 disabled:opacity-50"
                    : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-gray-300 hover:bg-[#3a3a3a] disabled:opacity-50"
                }
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!hero || !characterId) return;
                  setWipeError(null);
                  setWipeLoading(true);
                  try {
                    const expectedRevision = Number(
                      (useHeroStore.getState() as any).serverState?.heroRevision ??
                      (hero as any)?.heroJson?.heroRevision ??
                      0
                    );
                    const updated = await clearInventoryAPI(characterId, expectedRevision);
                    const store = useHeroStore.getState();
                    const liveHero = store.hero;
                    if (liveHero) {
                      const heroJson =
                        (updated as any)?.heroJson && typeof (updated as any).heroJson === "object"
                          ? (updated as any).heroJson
                          : {};
                      const overflowChest = Array.isArray(heroJson.overflowChest) ? heroJson.overflowChest : [];
                      const activeDyes = Array.isArray(heroJson.activeDyes)
                        ? heroJson.activeDyes
                        : liveHero.activeDyes ?? [];
                      const revision = Number(
                        heroJson.heroRevision ?? (liveHero as any)?.heroJson?.heroRevision ?? 0
                      );
                      const nextCoinLuck = Number((updated as any).coinLuck ?? liveHero.coinOfLuck ?? 0);
                      const nextLevel = Number((updated as any).level ?? liveHero.level ?? 1);
                      const nextExp = Number((updated as any).exp ?? liveHero.exp ?? 0);
                      const nextSp = Number((updated as any).sp ?? liveHero.sp ?? 0);
                      const nextAdena = Number((updated as any).adena ?? liveHero.adena ?? 0);
                      store.applyServerSync(
                        {
                          level: nextLevel,
                          exp: nextExp,
                          sp: nextSp,
                          adena: nextAdena,
                          coinOfLuck: nextCoinLuck,
                          inventory: [],
                          overflowChest,
                          activeDyes,
                          heroJson: { ...heroJson, inventory: [], overflowChest },
                        } as any,
                        {
                          level: nextLevel,
                          exp: nextExp,
                          sp: nextSp,
                          adena: nextAdena,
                          coinLuck: nextCoinLuck,
                          heroRevision: Number.isFinite(revision) ? revision : 0,
                          updatedAt: Date.now(),
                        }
                      );
                    }
                    setShowWipeConfirm(false);
                    setSelectedItem(null);
                    setDeleteConfirmItem(null);
                  } catch (e: any) {
                    setWipeError(e?.message || e?.error || "Ошибка сервера");
                  } finally {
                    setWipeLoading(false);
                  }
                }}
                disabled={wipeLoading}
                className="px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-600 text-xs font-semibold disabled:opacity-50 border border-red-900/40"
              >
                {wipeLoading ? "..." : "Удалить всё"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
