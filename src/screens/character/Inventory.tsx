import React, { useState, useMemo } from "react";
import { useHeroStore } from "../../state/heroStore";
import { INVENTORY_MAX_ITEMS } from "../../state/heroStore";
import Equipment from "./Equipment";
import InventoryFilters, { CATEGORIES } from "./InventoryFilters";
import InventoryItemList from "./InventoryItemList";
import InventoryItemModal from "./modals/InventoryItemModal";
import DeleteConfirmModal from "./DeleteConfirmModal";

const ITEMS_PER_PAGE = 10;

export default function Inventory() {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const equipItem = useHeroStore((s) => s.equipItem);
  const unequipItem = useHeroStore((s) => s.unequipItem);

  console.log('[Inventory] Component rendered, hero:', hero ? 'exists' : 'null');

  const [currentCategory, setCurrentCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ item: any; amount: number } | null>(null);

  // Hero вже завантажений в App.tsx, не потрібно завантажувати тут

  // Фільтрація предметів
  const filteredItems = useMemo(() => {
    if (!hero || !hero.inventory) return [];
    const category = CATEGORIES.find((c) => c.key === currentCategory) || CATEGORIES[0];
    return hero.inventory.filter((item: any) => item && category.test(item));
  }, [hero, currentCategory]);

  // Пагінація
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Кількість зайнятих слотів
  const itemsUsed = hero?.inventory?.filter(Boolean).length ?? 0;

  // Обробники для модалок
  const handleItemClick = (item: any) => {
    setSelectedItem(item);
  };

  const handleTransfer = (item: any, amount: number) => {
    // TODO: Реалізувати передачу предметів
    alert(`Передача ${amount} ${item.name} (в розробці)`);
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
        {/* Верхня частина: кількість слотів */}
        <div className="flex justify-end items-center mb-2" style={{ color: "#d9d9d9" }}>
          <div className="text-xs">{itemsUsed}/{INVENTORY_MAX_ITEMS}</div>
        </div>

        {/* Фільтри */}
        <InventoryFilters
          currentCategory={currentCategory}
          onCategoryChange={(category) => {
            setCurrentCategory(category);
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

        {/* Пагінація */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 text-[10px]" style={{ color: "#d9d9d9" }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: "#d9d9d9" }}
            >
              &lt;&lt;
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: "#d9d9d9" }}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-1.5 py-0.5 ${
                  currentPage === page
                    ? "bg-[#5a4424] text-[#f5d7a1] font-semibold"
                    : ""
                }`}
                style={currentPage !== page ? { color: "#d9d9d9" } : {}}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: "#d9d9d9" }}
            >
              &gt;
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-1.5 py-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: "#d9d9d9" }}
            >
              &gt;&gt;
            </button>
          </div>
        )}
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
    </div>
  );
}
