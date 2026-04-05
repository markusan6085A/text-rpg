import React, { useState } from "react";
import { useHeroStore } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";
import { colorizeNick } from "../utils/api";
import { showToast } from "../state/toastStore";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";

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
  const characterId = useCharacterStore((s) => s.characterId);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const innerPanel = isL2
    ? "max-w-[420px] mx-auto rounded-xl border border-[#5c4a32]/75 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-4"
    : "max-w-[360px] mx-auto";
  const sep = isL2 ? "border-t border-[#5c4a32]/45" : "border-t border-white/40";

  const applyServerCharacterSnapshot = (character: any, fallbackNickColor?: string) => {
    if (!character || typeof character !== "object") return;
    const store = useHeroStore.getState();
    const currentHero = store.hero;
    if (!currentHero) return;
    const heroJson =
      (character as any).heroJson && typeof (character as any).heroJson === "object"
        ? (character as any).heroJson
        : {};
    const inventory = Array.isArray(heroJson.inventory) ? heroJson.inventory : currentHero.inventory ?? [];
    const overflowChest = Array.isArray(heroJson.overflowChest)
      ? heroJson.overflowChest
      : currentHero.overflowChest ?? [];
    const activeDyes = Array.isArray(heroJson.activeDyes) ? heroJson.activeDyes : currentHero.activeDyes ?? [];
    const coinLuck = Number((character as any).coinLuck ?? currentHero.coinOfLuck ?? 0);
    const revision = Number(heroJson.heroRevision ?? (currentHero as any)?.heroJson?.heroRevision ?? 0);
    const level = Number((character as any).level ?? currentHero.level ?? 1);
    const exp = Number((character as any).exp ?? currentHero.exp ?? 0);
    const sp = Number((character as any).sp ?? currentHero.sp ?? 0);
    const adena = Number((character as any).adena ?? currentHero.adena ?? 0);
    const nextNickColor = String((character as any).nickColor ?? fallbackNickColor ?? currentHero.nickColor ?? "");
    store.applyServerSync(
      {
        level,
        exp,
        sp,
        adena,
        coinOfLuck: coinLuck,
        nickColor: nextNickColor || undefined,
        inventory,
        overflowChest,
        activeDyes,
        heroJson: { ...heroJson, nickColor: nextNickColor || undefined },
      } as any,
      {
        level,
        exp,
        sp,
        adena,
        coinLuck,
        heroRevision: Number.isFinite(revision) ? revision : 0,
        updatedAt: Date.now(),
      }
    );
  };

  if (!hero) {
    return (
      <div
        className={
          isL2 ? "text-[#8a7a60] text-center mt-10" : "text-white text-center mt-10"
        }
      >
        Загрузка...
      </div>
    );
  }

  const coins = hero.coinOfLuck || 0;
  const heroName = hero.name || "Player";
  const hasEnoughCoins = coins >= 50;

  return (
    <div
      className={
        isL2 ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 text-[#d4c4a8]` : "w-full text-white px-3 py-4"
      }
    >
      <div className={innerPanel}>
        {/* Colorize Nick Section */}
        <div>
          <div className={`${sep} pt-2 pb-2`}>
            <div
              className={
                isL2 ? "text-lg font-bold mb-2 text-[#e8c56e]" : "text-lg font-bold mb-2 text-orange-400"
              }
            >
              Установить цвет ника
            </div>
          </div>
          <div className={`${sep} pt-2 pb-2`}>
            <div className={isL2 ? "text-sm text-[#a89878] mb-3" : "text-sm text-gray-300 mb-3"}>
              Вы можете сменить цвет ника своего персонажа на любой из ниже приведенных.
            </div>
          </div>

          <div className={`${sep} pt-2 pb-2`}>
            <div
              className={
                isL2 ? "text-[#e8c56e] text-xs font-semibold mb-3" : "text-yellow-400 text-xs font-semibold mb-3"
              }
            >
              Цена: 50 Coin of Luck
            </div>
          </div>

          {/* Color Grid - просто текст без рамок, автоматичне розміщення в ряд */}
          <div className="flex flex-wrap gap-2 mb-3">
            {NICK_COLORS.map((color, index) => (
              <button
                key={index}
                onClick={() => setSelectedColor(color.code)}
                className={`text-xs font-bold transition-all hover:opacity-80 ${
                  selectedColor === color.code
                    ? isL2
                      ? "underline decoration-[#c9a44c] decoration-2"
                      : "underline decoration-yellow-400 decoration-2"
                    : ""
                }`}
                style={{ color: color.code }}
                title={color.name}
              >
                {heroName}
              </button>
            ))}
          </div>

          <div
            className={
              isL2 ? "text-xs text-[#8a7a60] text-center mb-3" : "text-xs text-gray-400 text-center mb-3"
            }
          >
            * Нажмите на цвет, чтобы выбрать.
          </div>

          {/* Apply Button */}
          <div className={`${sep} pt-2 pb-2`}>
            <button
              disabled={!selectedColor || !hasEnoughCoins || isApplying}
              className={`w-full text-sm font-semibold transition-opacity ${
                !selectedColor || !hasEnoughCoins || isApplying
                  ? "text-gray-500 cursor-not-allowed"
                  : isL2
                    ? "text-[#e8dcc8] hover:text-[#f0e4c8]"
                    : "text-white hover:opacity-80"
              }`}
              onClick={async () => {
                if (!selectedColor || !characterId) return;

                if (!hasEnoughCoins) {
                  showToast("Недостаточно Coin of Luck!", "error");
                  return;
                }

                setIsApplying(true);
                try {
                  const expectedRevision = Number(
                    useHeroStore.getState().serverState?.heroRevision ??
                    (hero as any)?.heroJson?.heroRevision ??
                    0
                  );
                  const res = await colorizeNick(
                    characterId,
                    selectedColor,
                    Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0
                  );
                  if (!res.ok || !res.character) {
                    showToast("Ошибка при изменении цвета ника", "error");
                    return;
                  }
                  applyServerCharacterSnapshot(res.character, selectedColor);

                  showToast("Поздравляю! Вы изменили цвет ника!", "success", {
                    onDismiss: () => navigate("/about"),
                  });
                } catch (err: any) {
                  const body = err?.body || {};
                  if (err?.status === 400 && body.error === "not enough coinLuck") {
                    showToast(`Недостаточно Coin of Luck! У вас: ${body.coinLuck ?? coins}`, "error");
                  } else if (err?.status === 409) {
                    showToast("Конфликт версий. Перезавантажте сторінку і спробуйте знову.", "error");
                  } else {
                    console.error('[ColorizeNick] Failed to change nick color:', err);
                    showToast(body.error || err?.message || "Ошибка при изменении цвета ника", "error");
                  }
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
