import React from "react";
import { useHeroStore } from "../../state/heroStore";
import { getCityUiVariant } from "../../utils/cityUiVariant";

interface RecipeBookButtonProps {
  navigate: (path: string) => void;
  /** Якщо задано — замінює стандартні класи рядка (наприклад L2-картка з Character) */
  className?: string;
}

/**
 * Кнопка "Книга рецептов" - показується тільки для професій зі скілом "Create Item"
 * Скіл "Create Item" має ID 1320 (Dwarven Fighter) або 172 (Create Item)
 */
const defaultRowClass =
  "mt-2 text-left hover:text-yellow-400 transition-colors cursor-pointer border-b border-solid border-[#c7ad80]/60 pb-1 w-full text-[#c7ad80] flex items-center gap-2";

const l2RowClass =
  "mt-2 w-full text-left rounded-md py-2 px-2 flex items-center gap-2 cursor-pointer bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#c9a44c] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 hover:brightness-110 active:scale-[0.99] transition-[border-color,transform,filter] duration-150";

export default function RecipeBookButton({ navigate, className }: RecipeBookButtonProps) {
  const hero = useHeroStore((s) => s.hero);
  const isL2 = getCityUiVariant() === "l2";

  if (!hero) return null;

  // Перевірка, чи є у персонажа скіл "Create Item"
  const hasCreateItemSkill = hero.skills?.some(
    (skill) => skill.id === 1320 || skill.id === 172
  );

  // Перевірка професії (додаткова перевірка для безпеки)
  const profession = hero.profession || "";
  const hasCraftingProfession =
    profession === "dwarven_fighter" ||
    profession === "dwarven_fighter_artisan" ||
    profession === "dwarven_fighter_warsmith";

  // Показуємо кнопку тільки якщо є скіл "Create Item" або відповідна професія
  if (!hasCreateItemSkill && !hasCraftingProfession) {
    return null;
  }

  return (
    <button
      onClick={() => navigate("/recipe-book")}
      className={className ?? (isL2 ? l2RowClass : defaultRowClass)}
    >
      <img
        src="/icons/news.png"
        alt="Recipe Book"
        className={isL2 ? "w-4 h-4 object-contain" : "w-3 h-3 object-contain"}
      />
      <span>Книга рецептов</span>
    </button>
  );
}

