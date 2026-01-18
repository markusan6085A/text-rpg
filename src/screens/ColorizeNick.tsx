import React, { useState } from "react";
import { useHeroStore } from "../state/heroStore";

interface ColorizeNickProps {
  navigate: (path: string) => void;
}

const NICK_COLORS = [
  { name: "Yellow", code: "#FFFF00", label: "DeadFear" },
  { name: "Orange", code: "#FFA500", label: "DeadFear" },
  { name: "Red", code: "#FF0000", label: "DeadFear" },
  { name: "Hot Pink", code: "#FF1493", label: "DeadFear" },
  { name: "Magenta", code: "#FF00FF", label: "DeadFear" },
  { name: "Purple", code: "#800080", label: "DeadFear" },
  { name: "Indigo", code: "#4B0082", label: "DeadFear" },
  { name: "Cyan", code: "#00FFFF", label: "DeadFear" },
  { name: "Green", code: "#00FF00", label: "DeadFear" },
  { name: "Lime", code: "#ADFF2F", label: "DeadFear" },
  { name: "White", code: "#FFFFFF", label: "DeadFear" },
  { name: "Dark Gray", code: "#333333", label: "DeadFear" },
];

export default function ColorizeNick({ navigate }: ColorizeNickProps) {
  const hero = useHeroStore((s) => s.hero);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  if (!hero) {
    return <div className="text-white text-center mt-10">Загрузка...</div>;
  }

  const hp = hero.hp || 273;
  const maxHp = hero.maxHp || 273;
  const mp = hero.mp || 168;
  const maxMp = hero.maxMp || 168;
  const cp = hero.cp || 138;
  const maxCp = hero.maxCp || 138;
  const exp = hero.exp || 0;
  const level = hero.level || 10;
  const expPercent = 0; // TODO: Calculate exp percent
  const vp = hero.vp || 240;
  const vpLevel = 4; // TODO: Calculate VP level
  const coins = hero.coinOfLuck || 0;

  return (
    <div className="w-full text-white px-3 py-4">
      <div className="max-w-[360px] mx-auto space-y-3">
        {/* Character Info */}
        <div className="text-center mb-3">
          <div className="text-lg font-bold">{hero.name || "DeadFear"}, {level} ур.</div>
        </div>

        {/* Stats */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>hp</span>
            <span>{hp} / {maxHp}</span>
          </div>
          <div className="flex justify-between">
            <span>ma</span>
            <span>{mp} / {maxMp}</span>
          </div>
          <div className="flex justify-between">
            <span>cp</span>
            <span>{cp} / {maxCp}</span>
          </div>
          <div className="flex justify-between">
            <span>xp</span>
            <span>{expPercent}%</span>
          </div>
          <div className="flex justify-between">
            <span>vp</span>
            <span>{vp} ({vpLevel} ур)</span>
          </div>
        </div>

        {/* Daily Bonus Button */}
        <div className="pt-2 border-t border-gray-600">
          <button className="text-green-400 hover:text-green-300 text-sm">
            Ежедневный бонус (+)
          </button>
        </div>

        {/* Achievement */}
        <div className="pt-2">
          <div className="text-yellow-400 text-sm">Новое достижение</div>
          <div className="text-gray-300 text-xs">Сохраните героя</div>
          <button className="mt-1 text-green-400 hover:text-green-300 text-xs">
            Забрать награду
          </button>
        </div>

        {/* Colorize Nick Section */}
        <div className="pt-4 border-t border-gray-600">
          <div className="text-lg font-bold mb-2">Установить цвет ника</div>
          <div className="text-sm text-gray-300 mb-3">
            Вы можете сменить цвет ника своего персонажа на любой из ниже приведенных.
          </div>

          <div className="text-yellow-400 text-xs font-semibold mb-3">
            Цена: 50 Coin of Luck
          </div>

          {/* Color Grid */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {NICK_COLORS.map((color, index) => (
              <button
                key={index}
                onClick={() => setSelectedColor(color.code)}
                className={`p-3 rounded border-2 transition-all ${
                  selectedColor === color.code
                    ? "border-yellow-400 ring-2 ring-yellow-400"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                style={{ backgroundColor: color.code }}
                title={color.name}
              >
                <div className="text-black text-xs font-bold text-center">
                  {color.label}
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
