import React, { useEffect, useState } from "react";
import ItemRow from "../../components/ItemRow";
import { itemsDB } from "../../data/items/itemsDB";
import { useHeroStore } from "../../state/heroStore";

export default function Inventory() {
  const hero = useHeroStore((s) => s.hero);
  const loadHero = useHeroStore((s) => s.loadHero);
  const updateHero = useHeroStore((s) => s.updateHero);

  const [currentTab, setCurrentTab] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const MENU_MAIN = [
    { label: "Оружие", slot: "weapon" },
    { label: "Голова", slot: "head" },
    { label: "Доспехи", slot: "armor" },
    { label: "Штаны", slot: "legs" },
    { label: "Перчатки", slot: "gloves" },
    { label: "Ботинки", slot: "boots" },
    { label: "Щит", slot: "shield" },
    { label: "Ожерелье", slot: "necklace" },
    { label: "Серьги", slot: "earring" },
    { label: "Кольца", slot: "ring" },
    { label: "Украшения", slot: "jewelry" },
    { label: "Тату", slot: "tattoo" },
    { label: "Пояс", slot: "belt" },
    { label: "Плащ", slot: "cloak" },
  ];

  const MENU_OTHER = [
    { label: "Ресурсы", slot: "resource" },
    { label: "Расходные", slot: "consumable" },
    { label: "Рецепты", slot: "recipe" },
    { label: "Книги", slot: "book" },
    { label: "Квесты", slot: "quest" },
    { label: "Все", slot: "all" },
  ];

  // -------------------------------------
  //  ЗАГРУЗКА ГЕРОЯ ЧЕРЕЗ ЗУСТАНД
  // -------------------------------------
  useEffect(() => {
    loadHero();
  }, []);

  const filteredItems = () => {
    if (!hero || !hero.inventory) return [];
    if (currentTab === "all") return hero.inventory;
    return hero.inventory.filter((item: any) => item.slot === currentTab);
  };

  const handleEquip = () => {
    if (!hero || !selectedItem) return;

    const slot = selectedItem.slot;

    // запрещённые категории
    if (
      ["all", "consumable", "resource", "quest", "book", "recipe"].includes(
        slot
      )
    ) {
      alert("Этот предмет нельзя одеть");
      return;
    }

    const currentEquipped = hero.equipment[slot] || null;

    let newInventory = hero.inventory.filter(
      (i: any) => i.id !== selectedItem.id
    );

    // если есть предмет, который был в этом слоте
    if (currentEquipped) {
      const oldItem = itemsDB[currentEquipped];
      if (oldItem) {
        newInventory.push({
          id: oldItem.id,
          name: oldItem.name,
          slot: oldItem.slot,
          kind: oldItem.kind,
          icon: oldItem.icon,
          description: oldItem.description,
          stats: oldItem.stats,
          count: 1,
        });
      }
    }

    const newEquipment = {
      ...hero.equipment,
      [slot]: selectedItem.id,
    };

    updateHero({
      inventory: newInventory,
      equipment: newEquipment,
    });

    setSelectedItem(null);
  };

  const handleDeleteItem = () => {
    const updatedInventory = hero.inventory.filter(
      (item: any) => item.id !== selectedItem.id
    );

    updateHero({ inventory: updatedInventory });

    setConfirmDelete(false);
    setSelectedItem(null);
  };

  if (!hero)
    return (
      <div className="min-h-screen bg-black text-white text-center pt-20">
        Загрузка...
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-black flex justify-center items-start pt-4">
      <div
        className="rounded-xl border-2 p-3 flex flex-col items-center relative"
        style={{
          width: "90vw",
          backgroundColor: "rgba(20, 12, 6, 0.95)",
          borderColor: "#5b4726",
        }}
      >
        <button
          onClick={() => (window.location.href = "/character")}
          className="absolute top-2 right-2 bg-red-600 text-white text-[11px] px-3 py-[3px] rounded-md"
        >
          Назад
        </button>

        <div className="text-center font-bold text-yellow-400 mb-3 text-base">
          Инвентарь
        </div>

        {/* ------------------  МЕНЮ ГОЛОВНЕ ------------------ */}
        <div className="w-full text-[13px]">
          {MENU_MAIN.map((item, idx) => (
            <div key={idx}>
              <div
                className="py-2 cursor-pointer text-left pl-2"
                onClick={() => setCurrentTab(item.slot)}
                style={{
                  color: currentTab === item.slot ? "#f5d7a1" : "#fff",
                }}
              >
                {item.label}
              </div>
              <div className="w-full h-[1px] bg-[#5b4726]"></div>

              {currentTab === item.slot && (
                <div className="w-full mt-2 text-[13px]">
                  {filteredItems().length === 0 ? (
                    <div className="text-center text-gray-400 py-2">Пусто</div>
                  ) : (
                    filteredItems().map((invItem: any, invIdx: number) => (
                      <div
                        key={invIdx}
                        onClick={() => setSelectedItem(invItem)}
                      >
                        <ItemRow item={invItem} />
                        <div className="w-full h-[1px] bg-[#5b4726]"></div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ------------------  ДРУГОЕ ------------------ */}
        <div className="text-center font-bold text-yellow-400 mt-4 mb-2 text-base">
          Другое
        </div>

        <div className="w-full text-[13px] mb-1">
          {MENU_OTHER.map((item, idx) => (
            <div key={idx}>
              <div
                className="py-2 cursor-pointer text-left pl-2"
                onClick={() => setCurrentTab(item.slot)}
                style={{
                  color: currentTab === item.slot ? "#f5d7a1" : "#fff",
                }}
              >
                {item.label}
              </div>
              <div className="w-full h-[1px] bg-[#5b4726]"></div>

              {currentTab === item.slot && (
                <div className="w-full mt-2 text-[13px]">
                  {filteredItems().length === 0 ? (
                    <div className="text-center text-gray-400 py-2">Пусто</div>
                  ) : (
                    filteredItems().map((invItem: any, invIdx: number) => (
                      <div
                        key={invIdx}
                        onClick={() => setSelectedItem(invItem)}
                      >
                        <ItemRow item={invItem} />
                        <div className="w-full h-[1px] bg-[#5b4726]"></div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ------------------ МОДАЛКА ------------------ */}
      {selectedItem && !confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div
            className="bg-[#1a1208] border border-[#5b4726] rounded-lg p-4 text-center"
            style={{ width: "260px" }}
          >
            <img
              src={selectedItem.icon}
              alt={selectedItem.name}
              className="w-12 h-12 mx-auto mb-2"
            />

            <div className="text-yellow-400 font-bold text-sm mb-1">
              {selectedItem.name}
            </div>

            {selectedItem.stats && (
              <div className="text-white text-[11px] mb-2">
                {(Object.entries(selectedItem.stats) as [string, any][]).map(
                  ([key, value]) => (
                    <div key={key}>
                      {key}: {String(value)}
                    </div>
                  )
                )}
              </div>
            )}

            {selectedItem.count > 1 && (
              <div className="text-gray-300 text-[11px] mb-2">
                Количество: {selectedItem.count}
              </div>
            )}

            <div className="flex flex-col gap-1 mt-2">
              <button
                className="bg-green-700 text-white text-[11px] py-1 rounded"
                onClick={handleEquip}
              >
                Одеть
              </button>
              <button className="bg-blue-700 text-white text-[11px] py-1 rounded">
                Передать
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="bg-red-700 text-white text-[11px] py-1 rounded"
              >
                Удалить
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="bg-gray-600 text-white text-[11px] py-1 rounded"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ ПОДТВЕРЖДЕНИЕ ------------------ */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div
            className="bg-[#1a1208] border border-[#5b4726] rounded-lg p-4 text-center"
            style={{ width: "230px" }}
          >
            <div className="text-yellow-400 font-bold text-sm mb-3">
              Удалить предмет?
            </div>

            <div className="flex justify-center gap-2">
              <button
                className="bg-red-700 text-white text-[11px] py-1 px-3 rounded"
                onClick={handleDeleteItem}
              >
                Да
              </button>

              <button
                className="bg-gray-600 text-white text-[11px] py-1 px-3 rounded"
                onClick={() => setConfirmDelete(false)}
              >
                Нет
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
