import React, { useState, useMemo } from "react";
import { useHeroStore } from "../../state/heroStore";
import { getInventoryMax } from "../../state/heroStore";
import Equipment from "./Equipment";
import InventoryFilters, { CATEGORIES } from "./InventoryFilters";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import InventoryItemList from "./InventoryItemList";
import InventoryItemModal from "./modals/InventoryItemModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import IncreaseInventoryModal from "./modals/IncreaseInventoryModal";
import TransferItemModal from "./modals/TransferItemModal";

const ITEMS_PER_PAGE = 25;
// Валюта — показується в балансі персонажа, не в інвентарі
const CURRENCY_IDS = new Set(["adena", "coin_of_luck", "coins_silver", "ancient_adena"]);

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
    return items;
  }, [hero, currentCategory, currentGrade]);

  // Пагінація
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Кількість зайнятих слотів
  const itemsUsed = hero?.inventory?.filter(Boolean).length ?? 0;
  const maxSlots = getInventoryMax(hero);

  // Обробники для модалок
  const handleItemClick = (item: any) => {
    setSelectedItem(item);
  };

  const handleTransfer = (item: any, amount: number) => {
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
  const confirmDelete = () => {
    if (!hero || !deleteConfirmItem) return;
    
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
    
    if (amount === 1) {
      // Видалення екіпіруємого предмета - видаляємо тільки один предмет за індексом
      const updatedInventory = [...hero.inventory];
      updatedInventory.splice(itemIndex, 1);
      updateHero({ inventory: updatedInventory });
    } else {
      // Видалення частини расходника
      const updatedInventory = [...hero.inventory];
      const currentItem = updatedInventory[itemIndex];
      const newCount = (currentItem.count ?? 1) - amount;
      if (newCount > 0) {
        updatedInventory[itemIndex] = { ...currentItem, count: newCount };
      } else {
        updatedInventory.splice(itemIndex, 1);
      }
      updateHero({ inventory: updatedInventory });
    }
    
    setSelectedItem(null);
    setDeleteConfirmItem(null);
  };

  if (!hero) {
    return (
      <div className="text-white text-center pt-20">Загрузка...</div>
    );
  }

  const adena = hero.adena || 0;

  return (
    <div className="w-full flex flex-col items-center px-4 py-2">
      <div className="w-full max-w-[360px]">
        {/* Equipment вікно зверху */}
        <Equipment compact={true} />

        {/* Інвентар нижче */}
        {/* Верхня частина: кількість слотів + кнопка збільшення */}
        <div className="flex justify-end items-center gap-2 mb-1" style={{ color: "#d9d9d9" }}>
          <div className="text-xs">{itemsUsed}/{maxSlots}</div>
          <button
            type="button"
            onClick={() => setShowIncreaseCapacityModal(true)}
            className="text-[11px] px-2 py-1 rounded border border-[#6b6b6b] bg-[#4a4a4a] text-[#c0c0c0] hover:bg-[#5a5a5a] hover:border-[#7a7a7a] transition-colors"
          >
            Увеличить вместимость инвентаря
          </button>
        </div>
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

        {/* Фільтри */}
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

        {/* Список предметів */}
        <InventoryItemList
          items={paginatedItems}
          hero={hero}
          onItemClick={handleItemClick}
          onEquipItem={equipItem}
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
            <div className="flex flex-wrap justify-center items-center gap-1 text-[10px]" style={{ color: "#d9d9d9" }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                style={{ color: "#d9d9d9" }}
                title="На першу"
              >
                &lt;&lt;
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                style={{ color: "#d9d9d9" }}
                title="Попередня"
              >
                &lt;
              </button>
              {pages.map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-0.5">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`px-1.5 py-0.5 shrink-0 ${
                      currentPage === p ? "bg-[#5a4424] text-[#f5d7a1] font-semibold" : ""
                    }`}
                    style={currentPage !== p ? { color: "#d9d9d9" } : {}}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                style={{ color: "#d9d9d9" }}
                title="Наступна"
              >
                &gt;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                style={{ color: "#d9d9d9" }}
                title="На останню"
              >
                &gt;&gt;
              </button>
            </div>
          );
        })()}
      </div>

      {/* Модалки залежно від типу предмета */}
      {selectedItem && hero && (
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
    </div>
  );
}
