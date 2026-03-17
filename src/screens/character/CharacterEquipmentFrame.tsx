import React, { useState, useEffect, useMemo } from "react";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import { SLOT_ICONS } from "./constants";
import { useHeroStore } from "../../state/heroStore";
import { GM_SHOP_ITEMS } from "../GMShop";
// Маппінг profession -> зображення
const professionImageMap: Record<string, string> = {
  human_fighter: "Human-voin.jpg",
  human_mystic_base: "Human-mistsk.jpg",
  human_mystic_wizard: "Human-mistsk.jpg",
  elven_fighter: "Elf-voin.jpg",
  elven_mystic: "Elf-mag.jpg",
  dark_fighter: "Dark_Elf-voinn.jpg",
  dark_mystic_base: "Dark_Elf_mag.jpg",
  dwarven_fighter: "Dwarf_voin.jpg",
  orc_fighter: "Orc_voinn.jpg",
  orc_mystic_base: "Orc_mag.jpg",
  // Тут можна додати інші професії
  // і т.д.
};

// Fallback маппінг race+gender (для сумісності, якщо profession немає)
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


interface CharacterEquipmentFrameProps {
  /** Чи показувати кнопки знімання (onClick) на слотах */
  allowUnequip?: boolean;
  /** Додатковий marginTop для рамки */
  marginTop?: string;
  /** 🔥 Перевизначити hero дані (для перегляду профілю іншого гравця) */
  heroOverride?: any;
  /** 🔥 Callback для кліку на предмет (для показу характеристик іншого гравця) */
  onItemClick?: (slot: string, itemId: string | null, enchantLevel?: number) => void;
}

export default function CharacterEquipmentFrame({ 
  allowUnequip = false,
  marginTop = "20px",
  heroOverride = null,
  onItemClick,
}: CharacterEquipmentFrameProps) {
  const heroStore = useHeroStore((s) => s.hero);
  // 🔥 Якщо heroOverride передано, використовуємо його замість hero з store (для перегляду профілю іншого гравця)
  const hero = heroOverride || heroStore;
  const unequipItemStore = useHeroStore((s) => s.unequipItem);
  // 🔥 Якщо heroOverride передано, не дозволяємо знімати екіпіровку (це профіль іншого гравця)
  const unequipItem = heroOverride ? (() => {}) : unequipItemStore;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Визначаємо зображення: спочатку за profession, потім fallback на race+gender
  // Використовуємо useMemo, щоб не перераховувати при кожному render
  const characterImage = useMemo(() => {
    if (!hero) {
      console.log(`[CharacterEquipmentFrame] No hero, returning empty image`);
      return "";
    }
    const heroName = String(hero?.name ?? (hero as any)?.heroJson?.name ?? "").trim().toLowerCase();
    if (heroName === "existence") return "/characters/admin.png";

    const profession = hero.profession?.toLowerCase() || hero.klass?.toLowerCase() || "";
    const gender = hero.gender?.toLowerCase() || "male";
    const race = hero.race?.toLowerCase() || "human";
    
    console.log(`[CharacterEquipmentFrame] Determining image for:`, {
      profession,
      klass: hero.klass?.toLowerCase(),
      gender,
      race,
      heroData: {
        profession: hero.profession,
        klass: hero.klass,
        gender: hero.gender,
        race: hero.race,
      },
    });
    
    // Спеціальна обробка для human_fighter та всіх його підкласів з урахуванням статі
    // Всі human_fighter_* професії використовують базове зображення human_fighter
    if ((profession === "human_fighter" || profession.startsWith("human_fighter_")) && gender === "female") {
      return `/characters/Human-vvoin.jpg`;
    }
    else if ((profession === "human_fighter" || profession.startsWith("human_fighter_")) && gender === "male") {
      return `/characters/Human-voin.jpg`;
    } 
    // Спеціальна обробка для human_mystic_base та всіх human_mystic з урахуванням статі
    else if ((profession === "human_mystic_base" || profession.startsWith("human_mystic_")) && gender === "male") {
      return `/characters/Human-mistsk.jpg`;
    }
    else if ((profession === "human_mystic_base" || profession.startsWith("human_mystic_")) && gender === "female") {
      return `/characters/Human-misstsk.jpg`;
    }
    // Спеціальна обробка для elven_mystic з урахуванням статі
    else if ((profession === "elven_mystic" || profession.startsWith("elven_mystic_")) && gender === "male") {
      return `/characters/Elf-mag.jpg`;
    }
    else if ((profession === "elven_mystic" || profession.startsWith("elven_mystic_")) && gender === "female") {
      return `/characters/Elf-mistsk.jpg`;
    }
    // Спеціальна обробка для elven_fighter з урахуванням статі
    else if ((profession === "elven_fighter" || profession.startsWith("elven_fighter_")) && gender === "male") {
      return `/characters/Elf-voin.jpg`;
    }
    else if ((profession === "elven_fighter" || profession.startsWith("elven_fighter_")) && gender === "female") {
      return `/characters/Elf-voinn.jpg`;
    }
    // Спеціальна обробка для dark_fighter з урахуванням статі
    else if ((profession === "dark_fighter" || profession.startsWith("dark_fighter_")) && gender === "male") {
      return `/characters/Dark_Elf-voinn.jpg`;
    }
    else if ((profession === "dark_fighter" || profession.startsWith("dark_fighter_")) && gender === "female") {
      return `/characters/Dark_Elf_voin.jpg`;
    }
    // Спеціальна обробка для dark_mystic з урахуванням статі
    else if ((profession === "dark_mystic_base" || profession.startsWith("dark_mystic_")) && gender === "male") {
      return `/characters/Dark_Elf_mag.jpg`;
    }
    else if ((profession === "dark_mystic_base" || profession.startsWith("dark_mystic_")) && gender === "female") {
      return `/characters/Dark_Elf_mistsk.jpg`;
    }
    // Спеціальна обробка для dwarven_fighter з урахуванням статі
    else if ((profession === "dwarven_fighter" || profession.startsWith("dwarven_fighter_")) && gender === "male") {
      return `/characters/Dwarf_voin.jpg`;
    }
    else if ((profession === "dwarven_fighter" || profession.startsWith("dwarven_fighter_")) && gender === "female") {
      return `/characters/Dwarfvoiiin.jpg`;
    }
    // Спеціальна обробка для orc_fighter та всіх його підкласів (включаючи Titan) з урахуванням статі
    else if ((profession === "orc_fighter" || profession.startsWith("orc_fighter_")) && gender === "male") {
      return `/characters/Orc_voinn.jpg`;
    }
    else if ((profession === "orc_fighter" || profession.startsWith("orc_fighter_")) && gender === "female") {
      return `/characters/Orc_vjinnn.jpg`;
    }
    // Спеціальна обробка для orc_mystic з урахуванням статі
    else if ((profession === "orc_mystic_base" || profession.startsWith("orc_mystic_")) && gender === "male") {
      return `/characters/Orc_mag.jpg`;
    }
    else if ((profession === "orc_mystic_base" || profession.startsWith("orc_mystic_")) && gender === "female") {
      return `/characters/Orc_mistik.jpg`;
    }
    // Обробка для soultaker (human_mystic_soultaker) - мужська версія мистика
    else if (profession === "human_mystic_soultaker" || profession === "soultaker" || profession.includes("soultaker")) {
      // Використовуємо зображення для human_mystic male
      const imagePath = gender === "female" ? `/characters/Human-misstsk.jpg` : `/characters/Human-mistsk.jpg`;
      console.log(`[CharacterEquipmentFrame] Using soultaker image: ${imagePath}`);
      return imagePath;
    }
    else if (profession && professionImageMap[profession]) {
      // Використовуємо зображення з profession маппінгу
      const imagePath = `/characters/${professionImageMap[profession]}`;
      console.log(`[CharacterEquipmentFrame] Using professionImageMap: ${imagePath}`);
      return imagePath;
    } else {
      // Fallback на стару систему race+gender
      // Якщо немає зображення в characterMap, використовуємо базове зображення для раси
      const key = `${race}_${gender}`;
      let fallbackImage = `/characters/${characterMap[key] || ""}`;
      
      // Якщо файл не знайдено в characterMap, використовуємо базові зображення
      if (!characterMap[key]) {
        if (race === "human" && gender === "male") {
          fallbackImage = `/characters/Human-voin.jpg`; // human_fighter male
        } else if (race === "human" && gender === "female") {
          fallbackImage = `/characters/Human-vvoin.jpg`; // human_fighter female
        } else if (race === "elf" && gender === "male") {
          fallbackImage = `/characters/Elf-voin.jpg`; // elven_fighter male
        } else if (race === "elf" && gender === "female") {
          fallbackImage = `/characters/Elf-voinn.jpg`; // elven_fighter female
        } else if (race === "darkelf" || race === "dark elf") {
          fallbackImage = gender === "male" 
            ? `/characters/Dark_Elf-voinn.jpg` 
            : `/characters/Dark_Elf_voin.jpg`;
        } else if (race === "dwarf" || race === "dwarven") {
          fallbackImage = gender === "male" 
            ? `/characters/Dwarf_voin.jpg` 
            : `/characters/Dwarfvoiiin.jpg`;
        } else if (race === "orc") {
          fallbackImage = gender === "male" 
            ? `/characters/Orc_voinn.jpg` 
            : `/characters/Orc_vjinnn.jpg`;
        } else {
          // Останній fallback - human male fighter
          fallbackImage = `/characters/Human-voin.jpg`;
        }
      }
      
      console.log(`[CharacterEquipmentFrame] Using fallback (race+gender): ${fallbackImage}`, {
        race,
        gender,
        key,
        mappedImage: characterMap[key],
        profession,
      });
      return fallbackImage;
    }
  }, [hero?.name, hero?.profession, hero?.klass, hero?.gender, hero?.race]);

  if (!hero) return null;

  // Визначення дворучного оружия (списа, посохи, луки, глефи, сокири)
  const isTwoHandedWeapon = (itemId: string | undefined): boolean => {
    if (!itemId) return false;
    const def = itemsDBWithStarter[itemId] || itemsDB[itemId];
    if (!def || def.kind !== "weapon") return false;
    
    // Перевіряємо за назвою оружия
    const name = def.name?.toLowerCase() || "";
    const id = itemId.toLowerCase();
    
    // Дворучне оружие: списа, посохи, луки, глефи, сокири
    return (
      name.includes("spear") ||
      name.includes("спис") ||
      name.includes("staff") ||
      name.includes("посох") ||
      name.includes("bow") ||
      name.includes("лук") ||
      name.includes("glaive") ||
      name.includes("глефа") ||
      name.includes("poleaxe") ||
      name.includes("сокира") ||
      id.includes("spear") ||
      id.includes("staff") ||
      id.includes("bow") ||
      id.includes("glaive") ||
      id.includes("poleaxe")
    );
  };

  // Логіка отримання іконки слота
  const getSlotIcon = (slot: string) => {
    if (!hero || !hero.equipment) return SLOT_ICONS[slot];
    
    // Для слота щита: якщо надіто дворучне оружие (особливо удочка), показуємо іконку оружия
    if (slot === "shield") {
      const weaponId = hero.equipment["weapon"];
      if (weaponId && isTwoHandedWeapon(weaponId)) {
        const weaponDef = itemsDBWithStarter[weaponId] || itemsDB[weaponId];
        if (weaponDef) {
          // Перевіряємо, чи це удочка - якщо так, вона займає обидва слоти
          const isRod = weaponId?.toLowerCase().includes("rod") || weaponDef.name?.toLowerCase().includes("удочк");
          if (isRod) {
            // Для удочки перевіряємо, чи вона є в слоті shield (бо вона займає обидва)
            const shieldId = hero.equipment["shield"];
            if (shieldId === weaponId) {
              // Удочка в обох слотах - показуємо її іконку
              return weaponDef.icon.startsWith("/") ? weaponDef.icon : `/items/${weaponDef.icon}`;
            }
          }
          // Для іншої дворучної зброї показуємо її іконку
          return weaponDef.icon.startsWith("/") ? weaponDef.icon : `/items/${weaponDef.icon}`;
        }
      }
      // Якщо є щит, показуємо щит
      const shieldId = hero.equipment["shield"];
      if (shieldId) {
        const shieldDef = itemsDBWithStarter[shieldId] || itemsDB[shieldId];
        if (shieldDef) {
          return shieldDef.icon.startsWith("/") ? shieldDef.icon : `/items/${shieldDef.icon}`;
        }
      }
      return SLOT_ICONS[slot];
    }
    
    // Для слота оружия: якщо надіто дворучне оружие, показуємо іконку оружия
    if (slot === "weapon") {
      const weaponId = hero.equipment["weapon"];
      if (weaponId) {
        const weaponDef = itemsDBWithStarter[weaponId] || itemsDB[weaponId];
        if (weaponDef) {
          return weaponDef.icon.startsWith("/") ? weaponDef.icon : `/items/${weaponDef.icon}`;
        }
      }
      return SLOT_ICONS[slot];
    }
    
    // Для інших слотів
    const itemId = hero.equipment[slot];
    if (!itemId) return SLOT_ICONS[slot];
    
    // Перевірка: якщо щит показується в слоті head, виправляємо
    if (slot === "head") {
      const def = itemsDBWithStarter[itemId] || itemsDB[itemId];
      if (def && def.slot === "shield") {
        // Це щит, не показуємо його в слоті head
        return SLOT_ICONS[slot];
      }
    }
    
    const def = itemsDBWithStarter[itemId] || itemsDB[itemId];
    if (!def) return SLOT_ICONS[slot];
    return def.icon.startsWith("/") ? def.icon : `/items/${def.icon}`;
  };

  // Логіка знімання предмета
  const handleUnequip = (slot: string) => {
    // 🔥 Забороняємо знімати предмети, якщо це профіль іншого гравця
    if (heroOverride) {
      console.warn('[CharacterEquipmentFrame] Cannot unequip items in player profile view.');
      return;
    }
    if (!hero || !hero.equipment || !hero.equipment[slot]) return;
    unequipItem(slot);
  };

  // 🔥 Обробка кліку на предмет (для іншого гравця - показуємо характеристики)
  const handleItemClick = (slot: string) => {
    if (heroOverride && onItemClick) {
      const itemId = hero?.equipment?.[slot] || null;
      const enchantLevel = hero?.equipmentEnchantLevels?.[slot] ?? 0;
      onItemClick(slot, itemId, enchantLevel);
    } else if (allowUnequip) {
      handleUnequip(slot);
    }
  };

  // Preload зображення для швидшого відображення
  useEffect(() => {
    if (!characterImage) {
      setImageError(false);
      setImageLoaded(false);
      return;
    }
    
    // Скидаємо помилку при зміні зображення, щоб спробувати завантажити знову
    setImageError(false);
    setImageLoaded(false);
    
    const img = new Image();
    let cancelled = false;
    
    img.onload = () => {
      if (!cancelled) {
        setImageLoaded(true);
        setImageError(false);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        // Встановлюємо помилку, але fallback зображення все одно показується
        setImageError(true);
        setImageLoaded(false);
      }
    };
    img.src = characterImage;
    
    // Cleanup: скасовуємо завантаження, якщо компонент розмонтується або зображення змінилося
    return () => {
      cancelled = true;
    };
  }, [characterImage]);

  // Стилі для слотів (з cursor-pointer та onClick, якщо allowUnequip = true або heroOverride)
  const slotClassName = (allowUnequip || (heroOverride && onItemClick))
    ? "w-6 h-6 bg-black/50 cursor-pointer" 
    : "w-6 h-6 bg-black/50";

  return (
    <div
      className="relative flex justify-center overflow-hidden"
      style={{
        width: "300px",
        minHeight: "220px",
        /* BACKUP: border-2, borderColor: "#1a1a1a", rounded-xl, boxShadow - прибрано внутрішню рамку */
        paddingTop: "10px",
        paddingBottom: "28px",
        marginTop: marginTop,
        /* BACKUP: boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.6)" - прибрано тінь */
      }}
    >
      {/* Фото героя як фон (2D — 3D вимкнено через краш на деяких пристроях) */}
      <div className="absolute inset-0" style={{ backgroundColor: "transparent" }}>
        {characterImage ? (
          <>
            <img
              src={characterImage}
              alt="Character"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                opacity: imageError ? 0 : 1,
                transition: "opacity 0.3s ease-in-out",
                position: "absolute",
                top: 0,
                left: 0,
              }}
              onLoad={() => {
                setImageLoaded(true);
                setImageError(false);
              }}
              onError={() => setImageError(true)}
            />
            {imageError && (() => {
              const gender = hero?.gender?.toLowerCase() || "male";
              const race = hero?.race?.toLowerCase() || "human";
              let fallbackSrc = `/characters/Human-voin.jpg`;
              if (race === "human" && gender === "female") fallbackSrc = `/characters/Human-vvoin.jpg`;
              else if (race === "elf" && gender === "male") fallbackSrc = `/characters/Elf-voin.jpg`;
              else if (race === "elf" && gender === "female") fallbackSrc = `/characters/Elf-voinn.jpg`;
              else if ((race === "darkelf" || race === "dark elf") && gender === "male") fallbackSrc = `/characters/Dark_Elf-voinn.jpg`;
              else if ((race === "darkelf" || race === "dark elf") && gender === "female") fallbackSrc = `/characters/Dark_Elf_voin.jpg`;
              else if ((race === "dwarf" || race === "dwarven") && gender === "male") fallbackSrc = `/characters/Dwarf_voin.jpg`;
              else if ((race === "dwarf" || race === "dwarven") && gender === "female") fallbackSrc = `/characters/Dwarfvoiiin.jpg`;
              else if (race === "orc" && gender === "male") fallbackSrc = `/characters/Orc_voinn.jpg`;
              else if (race === "orc" && gender === "female") fallbackSrc = `/characters/Orc_vjinnn.jpg`;
              return (
                <img
                  src={fallbackSrc}
                  alt="Character Fallback"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                />
              );
            })()}
          </>
        ) : (
          <div className="text-gray-500 text-xs text-center p-4">
            Немає зображення персонажа
          </div>
        )}
      </div>
      {/* Левые слоты */}
      <div className="absolute left-2 top-2 flex flex-col gap-1 z-10">
        {(["head", "armor", "legs", "gloves", "boots", "belt"] as const).map((slot) => {
          const enchantLevel = hero.equipmentEnchantLevels?.[slot] ?? 0;
          return (
            <div key={slot} className="relative">
              <img 
                src={getSlotIcon(slot)} 
                className={slotClassName}
                onClick={heroOverride && onItemClick 
                  ? () => handleItemClick(slot)
                  : allowUnequip 
                    ? () => handleUnequip(slot) 
                    : undefined}
              />
              {enchantLevel > 0 && (
                <div 
                  className="absolute -bottom-0.5 -right-0.5 bg-[#b8860b] text-black text-[7px] font-bold px-0.5 rounded leading-none"
                  style={{ minWidth: "10px", textAlign: "center" }}
                >
                  +{enchantLevel}
                </div>
              )}
            </div>
          );
        })}

        <div className="flex gap-1 mt-1 items-center">
          {(["weapon", "shield"] as const).map((slot) => {
            const enchantLevel = hero.equipmentEnchantLevels?.[slot] ?? 0;
            const isDisabled = slot === "shield" && hero.equipment?.weapon && isTwoHandedWeapon(hero.equipment.weapon);
            return (
              <div key={slot} className="relative">
                <img 
                  src={getSlotIcon(slot)} 
                  className={`${slotClassName} ${
                    isDisabled ? "ring-2 ring-yellow-400 ring-opacity-75" : ""
                  }`}
                  onClick={heroOverride && onItemClick 
                    ? () => handleItemClick(slot)
                    : allowUnequip && !isDisabled 
                      ? () => handleUnequip(slot) 
                      : undefined}
                  title=""
                />
                {enchantLevel > 0 && (
                  <div 
                    className="absolute -bottom-0.5 -right-0.5 bg-[#b8860b] text-black text-[7px] font-bold px-0.5 rounded leading-none"
                    style={{ minWidth: "10px", textAlign: "center" }}
                  >
                    +{enchantLevel}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Активні тату біля зброї */}
          {hero.activeDyes && hero.activeDyes.length > 0 && (
            <div className="flex gap-0.5 ml-1">
              {hero.activeDyes.slice(0, 3).map((dye, idx) => {
                const dyeInfo = GM_SHOP_ITEMS.find(d => d.itemId === dye.id);
                return (
                  <div
                    key={idx}
                    className="relative"
                    title={dyeInfo?.description || `${dye.statPlus} +${dye.effect} / ${dye.statMinus} -${dye.effect}`}
                  >
                    <img
                      src={dyeInfo?.icon || "/items/drops/resourcesss/etc_ancient_adena_i00.png"}
                      alt={dyeInfo?.name || dye.id}
                      className="w-5 h-5 object-contain border border-[#c7ad80] rounded bg-black/70"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/items/drops/resourcesss/etc_ancient_adena_i00.png";
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Правые слоты */}
      <div className="absolute right-2 top-2 flex flex-col gap-1 items-end z-10">
        {(["jewelry", "necklace", "earring_left", "earring_right", "ring_left", "ring_right"] as const).map((slot) => {
          const enchantLevel = hero.equipmentEnchantLevels?.[slot] ?? 0;
          return (
            <div key={slot} className="relative">
              <img 
                src={getSlotIcon(slot)} 
                className={slotClassName}
                onClick={heroOverride && onItemClick 
                  ? () => handleItemClick(slot)
                  : allowUnequip 
                    ? () => handleUnequip(slot) 
                    : undefined}
              />
              {enchantLevel > 0 && (
                <div 
                  className="absolute -bottom-0.5 -right-0.5 bg-[#b8860b] text-black text-[7px] font-bold px-0.5 rounded leading-none"
                  style={{ minWidth: "10px", textAlign: "center" }}
                >
                  +{enchantLevel}
                </div>
              )}
            </div>
          );
        })}

        <div className="flex gap-1 mt-1">
          {(["tattoo", "cloak"] as const).map((slot) => {
            const enchantLevel = hero.equipmentEnchantLevels?.[slot] ?? 0;
            return (
              <div key={slot} className="relative">
                <img 
                  src={getSlotIcon(slot)} 
                  className={slotClassName}
                  onClick={heroOverride && onItemClick 
                    ? () => handleItemClick(slot)
                    : allowUnequip 
                      ? () => handleUnequip(slot) 
                      : undefined}
                />
                {enchantLevel > 0 && (
                  <div 
                    className="absolute -bottom-0.5 -right-0.5 bg-[#b8860b] text-black text-[7px] font-bold px-0.5 rounded leading-none"
                    style={{ minWidth: "10px", textAlign: "center" }}
                  >
                    +{enchantLevel}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

