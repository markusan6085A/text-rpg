import React, { useState } from "react";
import { useHeroStore } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";
import { updateCharacter } from "../utils/api";

interface ColorizeNickProps {
  navigate: (path: string) => void;
}

const NICK_COLORS = [
  // Yellow variants
  { name: "Yellow", code: "#FFFF00" },
  { name: "Light Yellow", code: "#FFFF99" },
  { name: "Dark Yellow", code: "#CCCC00" },
  { name: "Gold", code: "#FFD700" },
  // Orange variants
  { name: "Orange", code: "#FFA500" },
  { name: "Light Orange", code: "#FFB84D" },
  { name: "Dark Orange", code: "#CC8400" },
  { name: "Coral", code: "#FF7F50" },
  // Red variants
  { name: "Red", code: "#FF0000" },
  { name: "Light Red", code: "#FF6666" },
  { name: "Dark Red", code: "#CC0000" },
  { name: "Crimson", code: "#DC143C" },
  // Pink variants
  { name: "Hot Pink", code: "#FF1493" },
  { name: "Pink", code: "#FFC0CB" },
  { name: "Deep Pink", code: "#FF1493" },
  { name: "Light Pink", code: "#FFB6C1" },
  // Magenta/Purple variants
  { name: "Magenta", code: "#FF00FF" },
  { name: "Purple", code: "#800080" },
  { name: "Light Purple", code: "#DA70D6" },
  { name: "Dark Purple", code: "#660066" },
  { name: "Violet", code: "#8A2BE2" },
  { name: "Indigo", code: "#4B0082" },
  // Blue variants
  { name: "Blue", code: "#0000FF" },
  { name: "Light Blue", code: "#87CEEB" },
  { name: "Dark Blue", code: "#00008B" },
  { name: "Navy", code: "#000080" },
  { name: "Sky Blue", code: "#87CEEB" },
  { name: "Royal Blue", code: "#4169E1" },
  // Cyan/Aqua variants
  { name: "Cyan", code: "#00FFFF" },
  { name: "Aqua", code: "#00CED1" },
  { name: "Turquoise", code: "#40E0D0" },
  { name: "Teal", code: "#008080" },
  // Green variants
  { name: "Green", code: "#00FF00" },
  { name: "Lime", code: "#ADFF2F" },
  { name: "Spring Green", code: "#00FF7F" },
  { name: "Light Green", code: "#90EE90" },
  { name: "Dark Green", code: "#006400" },
  { name: "Forest Green", code: "#228B22" },
  { name: "Sea Green", code: "#2E8B57" },
  // White/Gray variants
  { name: "White", code: "#FFFFFF" },
  { name: "Light Gray", code: "#D3D3D3" },
  { name: "Silver", code: "#C0C0C0" },
  { name: "Gray", code: "#808080" },
  { name: "Dark Gray", code: "#333333" },
  { name: "Charcoal", code: "#36454F" },
  // Brown variants
  { name: "Brown", code: "#8B4513" },
  { name: "Light Brown", code: "#CD853F" },
  { name: "Dark Brown", code: "#654321" },
  // Additional colors
  { name: "Lavender", code: "#E6E6FA" },
  { name: "Salmon", code: "#FA8072" },
];

export default function ColorizeNick({ navigate }: ColorizeNickProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const characterId = useCharacterStore((s) => s.characterId);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (!hero) {
    return <div className="text-white text-center mt-10">Загрузка...</div>;
  }

  const coins = hero.coinOfLuck || 0;
  const heroName = hero.name || "Player";
  const hasEnoughCoins = coins >= 50;

  return (
    <div className="w-full text-white px-3 py-4">
      <div className="max-w-[360px] mx-auto">
        {/* Colorize Nick Section */}
        <div>
          <div className="border-t border-gray-600 pt-2 pb-2">
            <div className="text-lg font-bold mb-2 text-orange-400">Установить цвет ника</div>
          </div>
          <div className="border-t border-gray-600 pt-2 pb-2">
            <div className="text-sm text-gray-300 mb-3">
              Вы можете сменить цвет ника своего персонажа на любой из ниже приведенных.
            </div>
          </div>

          <div className="border-t border-gray-600 pt-2 pb-2">
            <div className="text-yellow-400 text-xs font-semibold mb-3">
              Цена: 50 Coin of Luck
            </div>
          </div>

          {/* Color Grid - просто текст без рамок */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {NICK_COLORS.map((color, index) => (
              <button
                key={index}
                onClick={() => setSelectedColor(color.code)}
                className={`text-left text-sm font-bold transition-all hover:opacity-80 ${
                  selectedColor === color.code
                    ? "underline decoration-yellow-400 decoration-2"
                    : ""
                }`}
                style={{ color: color.code }}
                title={color.name}
              >
                {heroName}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400 text-center mb-3">
            * Нажмите на цвет, чтобы выбрать.
          </div>

          {/* Apply Button */}
          <div className="border-t border-gray-600 pt-2 pb-2">
            <button
              disabled={!selectedColor || !hasEnoughCoins || isApplying}
              className={`w-full text-sm font-semibold transition-opacity ${
                !selectedColor || !hasEnoughCoins || isApplying
                  ? "text-gray-500 cursor-not-allowed"
                  : "text-white hover:opacity-80"
              }`}
              onClick={async () => {
                if (!selectedColor || !characterId) return;

                if (!hasEnoughCoins) {
                  alert("Недостаточно Coin of Luck!");
                  return;
                }

                setIsApplying(true);
                try {
                  // Update character with new nick color and deduct coins
                  await updateCharacter(characterId, {
                    coinLuck: coins - 50,
                    heroJson: {
                      ...hero,
                      coinOfLuck: coins - 50,
                      nickColor: selectedColor,
                    },
                  });

                  // Update hero in store
                  updateHero({
                    coinOfLuck: coins - 50,
                    nickColor: selectedColor,
                  });

                  alert("Цвет ника изменен!");
                  navigate("/about");
                } catch (err: any) {
                  console.error('[ColorizeNick] Failed to change nick color:', err);
                  alert(err?.message || "Ошибка при изменении цвета ника");
                } finally {
                  setIsApplying(false);
                }
              }}
            >
              Применить цвет
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
