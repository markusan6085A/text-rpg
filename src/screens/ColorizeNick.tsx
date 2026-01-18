import React, { useState } from "react";
import { useHeroStore } from "../state/heroStore";

interface ColorizeNickProps {
  navigate: (path: string) => void;
}

const NICK_COLORS = [
  { name: "Yellow", code: "#FFFF00" },
  { name: "Orange", code: "#FFA500" },
  { name: "Red", code: "#FF0000" },
  { name: "Hot Pink", code: "#FF1493" },
  { name: "Magenta", code: "#FF00FF" },
  { name: "Purple", code: "#800080" },
  { name: "Indigo", code: "#4B0082" },
  { name: "Cyan", code: "#00FFFF" },
  { name: "Aqua", code: "#00CED1" },
  { name: "Green", code: "#00FF00" },
  { name: "Lime", code: "#ADFF2F" },
  { name: "Spring Green", code: "#00FF7F" },
  { name: "White", code: "#FFFFFF" },
  { name: "Light Gray", code: "#D3D3D3" },
  { name: "Silver", code: "#C0C0C0" },
  { name: "Dark Gray", code: "#333333" },
  { name: "Blue", code: "#0000FF" },
  { name: "Navy", code: "#000080" },
  { name: "Dark Blue", code: "#00008B" },
  { name: "Brown", code: "#8B4513" },
  { name: "Gold", code: "#FFD700" },
  { name: "Coral", code: "#FF7F50" },
];

export default function ColorizeNick({ navigate }: ColorizeNickProps) {
  const hero = useHeroStore((s) => s.hero);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  if (!hero) {
    return <div className="text-white text-center mt-10">Загрузка...</div>;
  }

  const coins = hero.coinOfLuck || 0;

  return (
    <div className="w-full text-white px-3 py-4">
      <div className="max-w-[360px] mx-auto">
        {/* Colorize Nick Section */}
        <div>
          <div className="text-lg font-bold mb-2">Установить цвет ника</div>
          <div className="text-sm text-gray-300 mb-3">
            Вы можете сменить цвет ника своего персонажа на любой из ниже приведенных.
          </div>

          <div className="text-yellow-400 text-xs font-semibold mb-3">
            Цена: 50 Coin of Luck
          </div>

          {/* Color Grid - просто текст без рамок */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {NICK_COLORS.map((color, index) => (
              <button
                key={index}
                onClick={() => setSelectedColor(color.code)}
                className={`p-2 rounded transition-all ${
                  selectedColor === color.code
                    ? "ring-2 ring-yellow-400"
                    : "hover:opacity-80"
                }`}
                style={{ backgroundColor: color.code }}
                title={color.name}
              >
                <div className="text-black text-xs font-bold text-center">
                  DeadFear
                </div>
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400 text-center mb-3">
            * Нажмите на цвет, чтобы выбрать.
          </div>

          {/* Apply Button */}
          <button
            className="w-full px-4 py-2 bg-yellow-600 text-black rounded hover:bg-yellow-700 text-sm font-semibold"
            onClick={() => {
              if (selectedColor && coins >= 50) {
                // TODO: Implement color change
                alert("Цвет ника изменен!");
              } else if (coins < 50) {
                alert("Недостаточно Coin of Luck!");
              } else {
                alert("Выберите цвет!");
              }
            }}
          >
            Применить цвет
          </button>
        </div>
      </div>
    </div>
  );
}
