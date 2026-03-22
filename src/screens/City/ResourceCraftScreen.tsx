import React from "react";
import { useHeroStore, getInventoryMax } from "../../state/heroStore";
import { getCityUiVariant } from "../../utils/cityUiVariant";
import { itemsDB } from "../../data/items/itemsDB";
import { getL2dopResourceIconPath, l2ItemIdToString } from "../../data/world/l2dop/droplistMapping";
import { handleResourceIconError } from "../../utils/itemIcon";
import { resourceLootDisplayName } from "../../utils/resourceLootDisplayName";
import {
  RESOURCE_CRAFT_LEVEL1_RECIPES,
  RESOURCE_CRAFT_LEVEL1_UNLOCK_LEVEL,
} from "../../data/crafting/resourceCraftLevel1";
import {
  RESOURCE_CRAFT_LEVEL2_RECIPES,
  RESOURCE_CRAFT_LEVEL2_UNLOCK_LEVEL,
} from "../../data/crafting/resourceCraftLevel2";
import {
  RESOURCE_CRAFT_LEVEL3_RECIPES,
  RESOURCE_CRAFT_LEVEL3_UNLOCK_LEVEL,
} from "../../data/crafting/resourceCraftLevel3";
import type { StringIdCraftRecipe } from "../../data/crafting/resourceCraftTypes";
import {
  countResourceInInventory,
  tryApplyResourceCraft,
  tryApplyStringIdCraftRecipe,
} from "../../utils/crafting/applyResourceCraft";
import type { HeroInventoryItem } from "../../types/Hero";
import { showToast } from "../../state/toastStore";

type Navigate = (path: string) => void;

function craftRowIcon(id: string): string {
  const def = itemsDB[id];
  if (def?.icon) return def.icon.startsWith("/") ? def.icon : `/items/${def.icon}`;
  return getL2dopResourceIconPath(id) ?? "/items/default_item.png";
}

function displayNameForId(id: string): string {
  return itemsDB[id]?.name ?? resourceLootDisplayName(id);
}

interface ResourceCraftScreenProps {
  navigate: Navigate;
}

type IngRow = { stringId: string; count: number };

function RecipeCard(props: {
  outputId: string;
  ingredients: IngRow[];
  inv: HeroInventoryItem[];
  maxSlots: number;
  unlocked: boolean;
  isL2ui: boolean;
  onCraft: () => void;
}) {
  const { outputId, ingredients, inv, maxSlots, unlocked, isL2ui, onCraft } = props;
  const recipe: StringIdCraftRecipe = { outputId, ingredients };
  const canDo = unlocked && tryApplyStringIdCraftRecipe(inv, recipe, maxSlots).ok;

  const cardClass = isL2ui
    ? "rounded-lg border border-[#5c4a32]/55 bg-black/28 px-3 py-3 flex flex-col gap-2.5 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)]"
    : "rounded-lg border border-white/15 bg-black/30 px-3 py-3 flex flex-col gap-2";

  return (
    <div className={cardClass}>
      <div className="text-[10px] uppercase tracking-[0.12em] text-[#8a7a60]">Результат ×1</div>
      <div className="flex items-center gap-3">
        <img
          src={craftRowIcon(outputId)}
          alt=""
          className="w-10 h-10 object-contain border border-[#5c4a32]/50 bg-black/40 shrink-0"
          onError={handleResourceIconError}
        />
        <span className={isL2ui ? "text-[#d4c4a8] text-sm font-medium" : "text-gray-200 text-sm font-medium"}>
          {displayNameForId(outputId)}
        </span>
      </div>

      <div className="border-t border-[#5c4a32]/35 pt-2 flex flex-col gap-1.5">
        <div className="text-[10px] uppercase tracking-[0.12em] text-[#8a7a60]">Матеріали</div>
        {ingredients.map((ing, j) => {
          const have = countResourceInInventory(inv, ing.stringId);
          const ok = have >= ing.count;
          return (
            <div key={`${ing.stringId}-${j}`} className="flex items-center gap-2 text-xs">
              <img
                src={craftRowIcon(ing.stringId)}
                alt=""
                className="w-7 h-7 object-contain border border-white/25 bg-black/40 shrink-0"
                onError={handleResourceIconError}
              />
              <div className={isL2ui ? "text-[#c9b99a] flex-1 min-w-0" : "text-gray-300 flex-1 min-w-0"}>
                {displayNameForId(ing.stringId)}{" "}
                <span className={ok ? "text-[#7fd67f]" : "text-red-400"}>
                  ({have}/{ing.count})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!canDo}
        onClick={onCraft}
        className={
          isL2ui
            ? `mt-1 w-full py-2 rounded-md text-[12px] font-medium border transition-colors ${
                canDo
                  ? "border-[#c7ad80]/45 bg-[#2a2418] text-[#e8c56e] hover:border-[#c7ad80]/70 hover:bg-[#352a1a]"
                  : "border-[#3a3228]/80 bg-black/20 text-[#5a5040] cursor-not-allowed"
              }`
            : `mt-1 w-full py-2 rounded text-sm ${
                canDo ? "bg-amber-700 text-white hover:bg-amber-600" : "bg-gray-700 text-gray-500 cursor-not-allowed"
              }`
        }
      >
        Скрафтити
      </button>
    </div>
  );
}

export default function ResourceCraftScreen({ navigate }: ResourceCraftScreenProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

  const inv = React.useMemo(
    () => [...(hero?.inventory ?? [])].filter(Boolean) as HeroInventoryItem[],
    [hero?.inventory]
  );

  const level = hero?.level ?? 1;
  const unlocked1 = level >= RESOURCE_CRAFT_LEVEL1_UNLOCK_LEVEL;
  const unlocked2 = level >= RESOURCE_CRAFT_LEVEL2_UNLOCK_LEVEL;
  const unlocked3 = level >= RESOURCE_CRAFT_LEVEL3_UNLOCK_LEVEL;
  const maxSlots = hero ? getInventoryMax(hero) : 100;

  const craftLevel1 = (idx: number) => {
    if (!hero || !unlocked1) return;
    const recipe = RESOURCE_CRAFT_LEVEL1_RECIPES[idx];
    if (!recipe) return;
    const result = tryApplyResourceCraft(hero.inventory, recipe, maxSlots);
    if (!result.ok) {
      showToast("Не вистачає ресурсів або немає вільного слоту в інвентарі.", "error");
      return;
    }
    const outputId = l2ItemIdToString(recipe.outputL2ItemId);
    updateHero({ inventory: result.inventory }, { persist: true });
    showToast(`Зкрафчено: ${outputId ? displayNameForId(outputId) : "предмет"} ×1`, "success");
  };

  const craftLevel2 = (idx: number) => {
    if (!hero || !unlocked2) return;
    const recipe = RESOURCE_CRAFT_LEVEL2_RECIPES[idx];
    if (!recipe) return;
    const result = tryApplyStringIdCraftRecipe(hero.inventory, recipe, maxSlots);
    if (!result.ok) {
      showToast("Не вистачає ресурсів або немає вільного слоту в інвентарі.", "error");
      return;
    }
    updateHero({ inventory: result.inventory }, { persist: true });
    showToast(`Зкрафчено: ${displayNameForId(recipe.outputId)} ×1`, "success");
  };

  const craftLevel3 = (idx: number) => {
    if (!hero || !unlocked3) return;
    const recipe = RESOURCE_CRAFT_LEVEL3_RECIPES[idx];
    if (!recipe) return;
    const result = tryApplyStringIdCraftRecipe(hero.inventory, recipe, maxSlots);
    if (!result.ok) {
      showToast("Не вистачає ресурсів або немає вільного слоту в інвентарі.", "error");
      return;
    }
    updateHero({ inventory: result.inventory }, { persist: true });
    showToast(`Зкрафчено: ${displayNameForId(recipe.outputId)} ×1`, "success");
  };

  if (!hero) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500 text-sm">…</div>
    );
  }

  const hintClass = isL2 ? "text-[11px] text-[#a89878] leading-relaxed" : "text-xs text-gray-400";
  const warnClass = "text-[11px] text-amber-400/95 mt-1";
  const sectionTitle = isL2
    ? "text-sm font-semibold text-[#d4b878] mt-6 mb-2 border-t border-[#5c4a32]/35 pt-4"
    : "text-sm font-semibold text-amber-600/90 mt-6 mb-2 border-t border-white/10 pt-4";

  return (
    <div className={isL2 ? `${l2Frame} w-full min-w-0 my-1 p-3 sm:p-4` : "w-full max-w-lg mx-auto p-3"}>
      <div className="flex flex-col gap-1 mb-2">
        <h1
          className={
            isL2
              ? "text-base font-semibold text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
              : "text-lg font-semibold text-[#b8860b]"
          }
        >
          Крафт ресурсів
        </h1>
        <p className={hintClass}>
          За один крафт знімаються матеріали, ви отримуєте 1 ресурс. Шанс успіху:{" "}
          <span className="text-[#7fd67f] font-medium">100%</span>.
        </p>
      </div>

      <div className={sectionTitle}>Рівень 1</div>
      <p className={hintClass + " mb-3"}>Відкривається з {RESOURCE_CRAFT_LEVEL1_UNLOCK_LEVEL} рівня.</p>
      {!unlocked1 && (
        <p className={warnClass + " mb-3"}>
          Ваш рівень: {level}. Потрібен {RESOURCE_CRAFT_LEVEL1_UNLOCK_LEVEL}+ — крафт рівня 1 недоступний.
        </p>
      )}
      <div className="flex flex-col gap-4">
        {RESOURCE_CRAFT_LEVEL1_RECIPES.map((recipe, idx) => {
          const outputId = l2ItemIdToString(recipe.outputL2ItemId);
          if (!outputId) return null;
          const ingredients: IngRow[] = recipe.ingredients
            .map((ing) => {
              const sid = l2ItemIdToString(ing.l2ItemId);
              return sid ? { stringId: sid, count: ing.count } : null;
            })
            .filter(Boolean) as IngRow[];
          return (
            <RecipeCard
              key={`l1-${recipe.outputL2ItemId}-${idx}`}
              outputId={outputId}
              ingredients={ingredients}
              inv={inv}
              maxSlots={maxSlots}
              unlocked={unlocked1}
              isL2ui={isL2}
              onCraft={() => craftLevel1(idx)}
            />
          );
        })}
      </div>

      <div className={sectionTitle}>Рівень 2</div>
      <p className={hintClass + " mb-3"}>Відкривається з {RESOURCE_CRAFT_LEVEL2_UNLOCK_LEVEL} рівня.</p>
      {!unlocked2 && (
        <p className={warnClass + " mb-3"}>
          Ваш рівень: {level}. Потрібен {RESOURCE_CRAFT_LEVEL2_UNLOCK_LEVEL}+ — крафт рівня 2 недоступний.
        </p>
      )}
      <div className="flex flex-col gap-4">
        {RESOURCE_CRAFT_LEVEL2_RECIPES.map((recipe, idx) => (
          <RecipeCard
            key={`l2-${recipe.outputId}-${idx}`}
            outputId={recipe.outputId}
            ingredients={recipe.ingredients}
            inv={inv}
            maxSlots={maxSlots}
            unlocked={unlocked2}
            isL2ui={isL2}
            onCraft={() => craftLevel2(idx)}
          />
        ))}
      </div>

      <div className={sectionTitle}>Рівень 3</div>
      <p className={hintClass + " mb-3"}>Відкривається з {RESOURCE_CRAFT_LEVEL3_UNLOCK_LEVEL} рівня.</p>
      {!unlocked3 && (
        <p className={warnClass + " mb-3"}>
          Ваш рівень: {level}. Потрібен {RESOURCE_CRAFT_LEVEL3_UNLOCK_LEVEL}+ — крафт рівня 3 недоступний.
        </p>
      )}
      <div className="flex flex-col gap-4">
        {RESOURCE_CRAFT_LEVEL3_RECIPES.map((recipe, idx) => (
          <RecipeCard
            key={`l3-${recipe.outputId}-${idx}`}
            outputId={recipe.outputId}
            ingredients={recipe.ingredients}
            inv={inv}
            maxSlots={maxSlots}
            unlocked={unlocked3}
            isL2ui={isL2}
            onCraft={() => craftLevel3(idx)}
          />
        ))}
      </div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() => {
            window.scrollTo(0, 0);
            navigate("/city");
          }}
          className={
            isL2
              ? "px-5 py-2 rounded-md border border-[#5c4a32]/60 text-[12px] text-[#c9a44c] hover:border-[#c7ad80]/45 hover:bg-black/25"
              : "px-4 py-2 rounded border border-gray-600 text-sm text-gray-300 hover:bg-gray-800"
          }
        >
          У місто
        </button>
      </div>
    </div>
  );
}
