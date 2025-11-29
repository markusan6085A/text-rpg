import React, { useEffect } from "react";
import { itemsDB } from "../../data/items/itemsDB";
import { SLOT_ICONS } from "./constants";
import { useHeroStore } from "../../state/heroStore";

const characterMap: Record<string, string> = {
  darkelf_female: "darkelf_female.png",
  darkelf_male: "darkelf_male.png",
  dwarf_female: "dwarf_female.png",
  dwarf_male: "dwarf_male.png",
  elf_female: "elf_female.png",
  elf_male: "elf_male.png",
  human_female: "human_female.png",
  human_male: "human_male.png",
  orc_female: "orc_female.png",
  orc_male: "orc_male.png",
};

export default function Equipment() {
  const hero = useHeroStore((s) => s.hero);
  const loadHero = useHeroStore((s) => s.loadHero);
  const updateHero = useHeroStore((s) => s.updateHero);

  // -----------------------------------
  //   LOAD HERO FROM ZUSTAND
  // -----------------------------------
  useEffect(() => {
    loadHero();
  }, []);

  if (!hero) return <div className="text-white mt-6">Загрузка...</div>;

  const race = hero.race?.toLowerCase();
  const gender = hero.gender?.toLowerCase();
  const key = `${race}_${gender}`;
  const characterImage = `/characters/${characterMap[key] || "human_male.png"}`;

  // -----------------------------------
  //  ICON LOGIC
  // -----------------------------------
  const getSlotIcon = (slot: string) => {
    const itemId = hero.equipment?.[slot];
    if (!itemId) return SLOT_ICONS[slot];

    const def = itemsDB[itemId];
    if (!def) return SLOT_ICONS[slot];

    return def.icon.startsWith("/") ? def.icon : `/items/${def.icon}`;
  };

  // -----------------------------------
  //   UNEQUIP ITEM
  // -----------------------------------
  const handleUnequip = (slot: string) => {
    if (!hero.equipment || !hero.equipment[slot]) return;

    const itemId = hero.equipment[slot];
    const def = itemsDB[itemId];
    if (!def) return;

    const newInventory = [...hero.inventory];
    newInventory.push({
      id: def.id,
      name: def.name,
      slot: def.slot,
      kind: def.kind,
      icon: def.icon,
      description: def.description,
      stats: def.stats,
      count: 1,
    });

    const newEquipment = {
      ...hero.equipment,
      [slot]: null,
    };

    updateHero({
      equipment: newEquipment,
      inventory: newInventory,
    });
  };

  const btn =
    "w-20 py-1 text-[10px] bg-[#0f0a06] text-white border border-[#3e301c] rounded-md";

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center text-white">
      <div
        className="mt-4 rounded-xl border-2 flex flex-col items-center relative"
        style={{
          width: "360px",
          backgroundColor: "rgba(20, 12, 6, 0.9)",
          borderColor: "#3b2c1a",
          paddingTop: "12px",
          paddingBottom: "12px",
        }}
      >
        <button
          className="absolute top-2 right-2 bg-red-600 text-white text-[12px] px-3 py-[2px] rounded-md"
          onClick={() => (window.location.href = "/character")}
        >
          Назад
        </button>

        <div className="text-center text-yellow-400 font-bold text-xl mb-1">
          Снаряжение
        </div>

        <div
            className="rounded-xl border-2 relative flex justify-center"
            style={{
              width: "330px",
              backgroundImage: "url('/hero-bg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderColor: "#5b4726",
              paddingTop: "10px",
              paddingBottom: "10px",
            }}
          >
            {/* LEFT SLOTS */}
            <div className="absolute left-2 top-4 flex flex-col gap-1">
              <img src={getSlotIcon("head")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("head")} />
              <img src={getSlotIcon("armor")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("armor")} />
              <img src={getSlotIcon("legs")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("legs")} />
              <img src={getSlotIcon("gloves")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("gloves")} />
              <img src={getSlotIcon("boots")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("boots")} />
              <img src={getSlotIcon("belt")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("belt")} />

              <div className="flex gap-1 mt-1">
                <img src={getSlotIcon("weapon")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("weapon")} />
                <img src={getSlotIcon("shield")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("shield")} />
              </div>
            </div>

            {/* RIGHT SLOTS */}
            <div className="absolute right-2 top-4 flex flex-col gap-1 items-end">
              <img src={getSlotIcon("jewelry")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("jewelry")} />
              <img src={getSlotIcon("necklace")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("necklace")} />
              <img src={getSlotIcon("earring_left")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("earring_left")} />
              <img src={getSlotIcon("earring_right")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("earring_right")} />
              <img src={getSlotIcon("ring_left")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("ring_left")} />
              <img src={getSlotIcon("ring_right")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("ring_right")} />

              <div className="flex gap-1 mt-1">
                <img src={getSlotIcon("tattoo")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("tattoo")} />
                <img src={getSlotIcon("cloak")} className="w-7 h-7 border border-yellow-600 bg-black/50" onClick={() => handleUnequip("cloak")} />
              </div>
            </div>

            {/* MODEL */}
            <div className="mt-16 mb-[-6px] flex flex-col items-center">
              <img src={characterImage} alt="hero" className="w-24 drop-shadow-xl" />
              <div className="w-16 h-4 bg-black/70 rounded-full blur-md mt-[-4px]"></div>
            </div>
          </div>

        {/* buttons */}
        <div className="flex justify-center mt-3">
          <button className={`${btn} bg-yellow-600 text-black w-32`} onClick={() => (window.location.href = "/inventory")}>
            Инвентарь
          </button>
        </div>

        <div className="flex justify-center mt-2">
          <button className={`${btn} bg-yellow-600 text-black w-32`} onClick={() => (window.location.href = "/character")}>
            Персонаж
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 mb-1">
          <button className={btn} onClick={() => (window.location.href = "/city")}>
            Город
          </button>
          <button className={`${btn} bg-yellow-600 text-black`}>Персонаж</button>
          <button className={btn} onClick={() => (window.location.href = "/stats")}>
            Статы
          </button>
        </div>
      </div>
    </div>
  );
}
