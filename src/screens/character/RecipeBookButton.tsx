import React from "react";
import { useHeroStore } from "../../state/heroStore";

interface RecipeBookButtonProps {
  navigate: (path: string) => void;
}

/**
 * Кнопка "Книга рецептов" - показується тільки для професій зі скілом "Create Item"
 * Скіл "Create Item" має ID 1320 (Dwarven Fighter) або 172 (Create Item)
 */
export default function RecipeBookButton({ navigate }: RecipeBookButtonProps) {
  const hero = useHeroStore((s) => s.hero);

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
      className="mt-2 text-left hover:text-yellow-400 transition-colors cursor-pointer border-b border-dotted border-[#654321] pb-1 w-full text-[#d3d3d3] flex items-center gap-2"
    >
      <img src="/icons/news.png" alt="Recipe Book" className="w-3 h-3 object-contain" />
      <span>Книга рецептов</span>
    </button>
  );
}

