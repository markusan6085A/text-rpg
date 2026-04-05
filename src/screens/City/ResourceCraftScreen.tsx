import React from "react";
import { useHeroStore, getInventoryMax } from "../../state/heroStore";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";
import { itemsDB } from "../../data/items/itemsDB";
import { getL2dopResourceIconPath, l2ItemIdToString } from "../../data/world/l2dop/droplistMapping";
import { handleResourceIconError } from "../../utils/itemIcon";
import { resourceLootDisplayName } from "../../utils/resourceLootDisplayName";
import {
  RESOURCE_CRAFT_LEVEL1_RECIPES,
  RESOURCE_CRAFT_LEVEL1_UNLOCK_LEVEL,
  type ResourceCraftRecipe,
} from "../../data/crafting/resourceCraftLevel1";
import { L2_WARM_OUTER_FRAME } from "../../utils/l2WarmLayoutClassNames";
import {
  RESOURCE_CRAFT_LEVEL2_RECIPES,
  RESOURCE_CRAFT_LEVEL2_UNLOCK_LEVEL,
} from "../../data/crafting/resourceCraftLevel2";
import {
  RESOURCE_CRAFT_LEVEL3_RECIPES,
  RESOURCE_CRAFT_LEVEL3_UNLOCK_LEVEL,
} from "../../data/crafting/resourceCraftLevel3";
import {
  RESOURCE_CRAFT_LEVEL4_RECIPES,
  RESOURCE_CRAFT_LEVEL4_UNLOCK_LEVEL,
} from "../../data/crafting/resourceCraftLevel4";
import { CRAFT_RESOURCE_ENGLISH_NAMES } from "../../data/crafting/craftResourceEnglishNames";
import type { StringIdCraftRecipe } from "../../data/crafting/resourceCraftTypes";
import {
  countResourceInInventory,
  tryApplyResourceCraft,
  tryApplyStringIdCraftRecipe,
  computeMaxCraftable,
} from "../../utils/crafting/applyResourceCraft";
import type { HeroInventoryItem } from "../../types/Hero";
import { showToast } from "../../state/toastStore";

type Navigate = (path: string) => void;

function craftRowIcon(id: string): string {
  const def = itemsDB[id];
  if (def?.icon) return def.icon.startsWith("/") ? def.icon : `/items/${def.icon}`;
  return getL2dopResourceIconPath(id) ?? "/items/default_item.png";
}

function displayCraftResourceName(id: string): string {
  return CRAFT_RESOURCE_ENGLISH_NAMES[id] ?? itemsDB[id]?.name ?? resourceLootDisplayName(id);
}

function resourceRecipeToStringRecipe(recipe: ResourceCraftRecipe): StringIdCraftRecipe | null {
  const outputId = l2ItemIdToString(recipe.outputL2ItemId);
  if (!outputId) return null;
  const ingredients: StringIdCraftRecipe["ingredients"] = [];
  for (const ing of recipe.ingredients) {
    const sid = l2ItemIdToString(ing.l2ItemId);
    if (!sid) return null;
    ingredients.push({ stringId: sid, count: ing.count });
  }
  return { outputId, ingredients };
}

interface ResourceCraftScreenProps {
  navigate: Navigate;
}

type IngRow = { stringId: string; count: number };

type CraftModalState =
  | { tier: 1; idx: number }
  | { tier: 2; idx: number }
  | { tier: 3; idx: number }
  | { tier: 4; idx: number };

function RecipeCard(props: {
  outputId: string;
  ingredients: IngRow[];
  inv: HeroInventoryItem[];
  unlocked: boolean;
  maxCraftable: number;
  isL2ui: boolean;
  onRequestCraft: () => void;
}) {
  const { outputId, ingredients, inv, unlocked, maxCraftable, isL2ui, onRequestCraft } = props;
  const canDo = unlocked && maxCraftable >= 1;

  const cardClass = isL2ui
    ? "rounded-lg border border-[#5c4a32]/55 bg-black/28 px-3 py-3 flex flex-col gap-2.5 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)]"
    : "rounded-lg border border-white/15 bg-black/30 px-3 py-3 flex flex-col gap-2";

  return (
    <div className={cardClass}>
      <div className="text-[10px] uppercase tracking-[0.12em] text-[#8a7a60]">Результат ×1</div>
      <div className="flex flex-row flex-nowrap items-center gap-3 min-w-0">
        <img
          src={craftRowIcon(outputId)}
          alt=""
          className="w-10 h-10 object-contain border border-[#5c4a32]/50 bg-black/40 shrink-0"
          onError={handleResourceIconError}
        />
        <span
          className={
            isL2ui
              ? "text-[#d4c4a8] text-sm font-medium min-w-0 text-left"
              : "text-gray-200 text-sm font-medium min-w-0 text-left"
          }
        >
          {displayCraftResourceName(outputId)}
        </span>
      </div>

      <div className="border-t border-[#5c4a32]/35 pt-2 flex flex-col gap-1.5">
        <div className="text-[10px] uppercase tracking-[0.12em] text-[#8a7a60]">Материалы</div>
        {ingredients.map((ing, j) => {
          const have = countResourceInInventory(inv, ing.stringId);
          const ok = have >= ing.count;
          return (
            <div key={`${ing.stringId}-${j}`} className="flex flex-row flex-nowrap items-center gap-2 text-xs min-w-0">
              <img
                src={craftRowIcon(ing.stringId)}
                alt=""
                className="w-7 h-7 object-contain border border-white/25 bg-black/40 shrink-0"
                onError={handleResourceIconError}
              />
              <div className={isL2ui ? "text-[#c9b99a] flex-1 min-w-0 text-left" : "text-gray-300 flex-1 min-w-0 text-left"}>
                {displayCraftResourceName(ing.stringId)}{" "}
                <span className={ok ? "text-[#7fd67f]" : "text-red-400"}>
                  ({have}/{ing.count})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {maxCraftable >= 1 && (
        <p className={isL2ui ? "text-[10px] text-[#8a7a60]" : "text-[10px] text-gray-500"}>
          Можно за раз: до {maxCraftable} шт.
        </p>
      )}

      <button
        type="button"
        disabled={!canDo}
        onClick={onRequestCraft}
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
        Крафт
      </button>
    </div>
  );
}

export default function ResourceCraftScreen({ navigate }: ResourceCraftScreenProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;

  const [craftModal, setCraftModal] = React.useState<CraftModalState | null>(null);
  const [craftQtyInput, setCraftQtyInput] = React.useState("1");

  const inv = React.useMemo(
    () => [...(hero?.inventory ?? [])].filter(Boolean) as HeroInventoryItem[],
    [hero?.inventory]
  );

  const level = hero?.level ?? 1;
  const unlocked1 = level >= RESOURCE_CRAFT_LEVEL1_UNLOCK_LEVEL;
  const unlocked2 = level >= RESOURCE_CRAFT_LEVEL2_UNLOCK_LEVEL;
  const unlocked3 = level >= RESOURCE_CRAFT_LEVEL3_UNLOCK_LEVEL;
  const unlocked4 = level >= RESOURCE_CRAFT_LEVEL4_UNLOCK_LEVEL;
  const maxSlots = hero ? getInventoryMax(hero) : 100;

  const resolveModalRecipe = React.useCallback(
    (m: CraftModalState): StringIdCraftRecipe | null => {
      if (m.tier === 1) {
        const r = RESOURCE_CRAFT_LEVEL1_RECIPES[m.idx];
        return r ? resourceRecipeToStringRecipe(r) : null;
      }
      if (m.tier === 2) return RESOURCE_CRAFT_LEVEL2_RECIPES[m.idx] ?? null;
      if (m.tier === 3) return RESOURCE_CRAFT_LEVEL3_RECIPES[m.idx] ?? null;
      return RESOURCE_CRAFT_LEVEL4_RECIPES[m.idx] ?? null;
    },
    []
  );

  const modalRecipe = craftModal ? resolveModalRecipe(craftModal) : null;
  const modalMaxCraft = React.useMemo(() => {
    if (!hero || !modalRecipe) return 0;
    return computeMaxCraftable(hero.inventory, modalRecipe, maxSlots);
  }, [hero, modalRecipe, maxSlots]);

  React.useEffect(() => {
    if (craftModal) setCraftQtyInput("1");
  }, [craftModal]);

  const commitModalCraft = React.useCallback(() => {
    if (!hero || !craftModal || !modalRecipe) return;
    showToast(
      "Крафт тимчасово вимкнено: йде перехід на серверний (online-authoritative) режим.",
      "error"
    );
    setCraftModal(null);
  }, [
    hero,
    craftModal,
    modalRecipe,
    setCraftModal,
  ]);

  const hintClass = isL2 ? "text-[11px] text-[#a89878] leading-relaxed" : "text-xs text-gray-400";
  const warnClass = "text-[11px] text-amber-400/95 mt-1";
  const sectionTitle = isL2
    ? "text-sm font-semibold text-[#d4b878] mt-6 mb-2 border-t border-[#5c4a32]/35 pt-4"
    : "text-sm font-semibold text-amber-600/90 mt-6 mb-2 border-t border-white/10 pt-4";

  const modalShell = isL2
    ? "rounded-lg border border-[#5c4a32]/70 bg-[#14110c] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.75)] max-w-sm w-[calc(100%-2rem)]"
    : "rounded-lg border border-gray-600 bg-[#1a1a1a] p-4 max-w-sm w-[calc(100%-2rem)]";

  if (!hero) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500 text-sm">Загрузка…</div>
    );
  }

  return (
    <div className={isL2 ? `${l2Frame} w-full min-w-0 my-1 p-3 sm:p-4` : "w-full max-w-lg mx-auto p-3"}>
      <div
        className={`flex flex-row gap-3 sm:gap-4 md:gap-6 items-start mb-5 pb-5 ${
          isL2 ? "border-b border-[#5c4a32]/40" : "border-b border-white/10"
        }`}
      >
        <div
          className={
            isL2
              ? "shrink-0 w-[88px] sm:w-[120px] md:w-[168px]"
              : "shrink-0 w-[80px] sm:w-[100px]"
          }
        >
          <div
            className={
              isL2
                ? "relative rounded-lg border border-[#5c4a32]/50 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(199,173,128,0.12)_0%,transparent_55%),linear-gradient(180deg,#1a1510_0%,#0c0a08_100%)] p-1.5 sm:p-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.08),0_8px_28px_rgba(0,0,0,0.55)]"
                : "p-1 rounded border border-white/20 bg-black/30"
            }
          >
            <img
              src="/nps/38.png"
              alt=""
              className="w-full h-auto max-h-[160px] sm:max-h-[220px] md:max-h-[280px] object-contain object-bottom drop-shadow-[0_6px_16px_rgba(0,0,0,0.65)]"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-2.5 text-left">
          <h1
            className={
              isL2
                ? "text-lg font-semibold text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.9)] tracking-wide"
                : "text-lg font-semibold text-[#b8860b]"
            }
          >
            Крафт ресурсов
          </h1>
          <p className={isL2 ? "text-[13px] leading-relaxed text-[#c9b99a]" : hintClass}>
            Мастер заготовок перерабатывает сырьё из вашего инвентаря: материалы списываются, готовый ресурс
            попадает в рюкзак. В окне крафта укажите нужное количество.{" "}
            <span className={isL2 ? "text-[#a89878]" : ""}>Шанс успеха —</span>{" "}
            <span className="text-[#7fd67f] font-semibold">100%</span>.
          </p>
          <p className={isL2 ? "text-[12px] text-[#8a7a60] italic border-l-2 border-[#c7ad80]/25 pl-3" : "text-xs text-gray-500"}>
            Выберите рецепт ниже — кнопка «Крафт» откроет окно, где можно задать число единиц за один заход.
          </p>
        </div>
      </div>

      <div className={sectionTitle}>Уровень 1</div>
      <p className={hintClass + " mb-3"}>
        Открывается с {RESOURCE_CRAFT_LEVEL1_UNLOCK_LEVEL} уровня персонажа.
      </p>
      {!unlocked1 && (
        <p className={warnClass + " mb-3"}>
          Ваш уровень: {level}. Для крафта уровня 1 нужен {RESOURCE_CRAFT_LEVEL1_UNLOCK_LEVEL}+ уровень.
        </p>
      )}
      {unlocked1 && (
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
            const strRec = resourceRecipeToStringRecipe(recipe);
            const maxC = strRec ? computeMaxCraftable(inv, strRec, maxSlots) : 0;
            return (
              <RecipeCard
                key={`l1-${recipe.outputL2ItemId}-${idx}`}
                outputId={outputId}
                ingredients={ingredients}
                inv={inv}
                unlocked={unlocked1}
                maxCraftable={maxC}
                isL2ui={isL2}
                onRequestCraft={() => setCraftModal({ tier: 1, idx })}
              />
            );
          })}
        </div>
      )}

      <div className={sectionTitle}>Уровень 2</div>
      {unlocked2 ? (
        <div className="flex flex-col gap-4 mt-2">
          {RESOURCE_CRAFT_LEVEL2_RECIPES.map((recipe, idx) => {
            const maxC = computeMaxCraftable(inv, recipe, maxSlots);
            return (
              <RecipeCard
                key={`l2-${recipe.outputId}-${idx}`}
                outputId={recipe.outputId}
                ingredients={recipe.ingredients}
                inv={inv}
                unlocked={unlocked2}
                maxCraftable={maxC}
                isL2ui={isL2}
                onRequestCraft={() => setCraftModal({ tier: 2, idx })}
              />
            );
          })}
        </div>
      ) : (
        <p className={hintClass + " mb-1"}>
          Доступен с {RESOURCE_CRAFT_LEVEL2_UNLOCK_LEVEL} уровня персонажа. При уровне {level} доступны только
          рецепты уровня 1 (если он открыт).
        </p>
      )}

      <div className={sectionTitle}>Уровень 3</div>
      {unlocked3 ? (
        <div className="flex flex-col gap-4 mt-2">
          {RESOURCE_CRAFT_LEVEL3_RECIPES.map((recipe, idx) => {
            const maxC = computeMaxCraftable(inv, recipe, maxSlots);
            return (
              <RecipeCard
                key={`l3-${recipe.outputId}-${idx}`}
                outputId={recipe.outputId}
                ingredients={recipe.ingredients}
                inv={inv}
                unlocked={unlocked3}
                maxCraftable={maxC}
                isL2ui={isL2}
                onRequestCraft={() => setCraftModal({ tier: 3, idx })}
              />
            );
          })}
        </div>
      ) : (
        <p className={hintClass + " mb-1"}>Доступен с {RESOURCE_CRAFT_LEVEL3_UNLOCK_LEVEL} уровня персонажа.</p>
      )}

      <div className={sectionTitle}>Уровень 4</div>
      {unlocked4 ? (
        <div className="flex flex-col gap-4 mt-2">
          {RESOURCE_CRAFT_LEVEL4_RECIPES.map((recipe, idx) => {
            const maxC = computeMaxCraftable(inv, recipe, maxSlots);
            return (
              <RecipeCard
                key={`l4-${recipe.outputId}-${idx}`}
                outputId={recipe.outputId}
                ingredients={recipe.ingredients}
                inv={inv}
                unlocked={unlocked4}
                maxCraftable={maxC}
                isL2ui={isL2}
                onRequestCraft={() => setCraftModal({ tier: 4, idx })}
              />
            );
          })}
        </div>
      ) : (
        <p className={hintClass + " mb-1"}>Доступен с {RESOURCE_CRAFT_LEVEL4_UNLOCK_LEVEL} уровня персонажа.</p>
      )}

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
          Вернуться в город
        </button>
      </div>

      {craftModal && modalRecipe && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-craft-qty-title"
          onClick={() => setCraftModal(null)}
        >
          <div className={modalShell} onClick={(e) => e.stopPropagation()}>
            <h2
              id="resource-craft-qty-title"
              className={isL2 ? "text-sm font-semibold text-[#e8c56e] mb-2" : "text-sm font-semibold text-amber-500 mb-2"}
            >
              Крафт: {displayCraftResourceName(modalRecipe.outputId)}
            </h2>
            <p className={isL2 ? "text-[11px] text-[#a89878] mb-3" : "text-xs text-gray-400 mb-3"}>
              Сколько единиц скрафтить? Сейчас максимум:{" "}
              <span className="text-[#7fd67f] font-medium">{modalMaxCraft}</span>
            </p>
            <div className="flex flex-col gap-2 mb-4">
              <input
                type="number"
                min={1}
                max={modalMaxCraft}
                value={craftQtyInput}
                onChange={(e) => setCraftQtyInput(e.target.value)}
                className={
                  isL2
                    ? "w-full rounded-md border border-[#5c4a32]/60 bg-black/40 px-2 py-2 text-sm text-[#d4c4a8]"
                    : "w-full rounded border border-gray-600 bg-black/30 px-2 py-2 text-sm text-gray-200"
                }
              />
              <button
                type="button"
                disabled={modalMaxCraft < 1}
                onClick={() => setCraftQtyInput(String(modalMaxCraft))}
                className={
                  isL2
                    ? "text-[11px] text-[#c9a44c] underline disabled:opacity-40 self-start"
                    : "text-xs text-amber-500 underline disabled:opacity-40 self-start"
                }
              >
                Поставить максимум
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setCraftModal(null)}
                className={
                  isL2
                    ? "px-3 py-1.5 rounded-md border border-[#5c4a32]/55 text-[12px] text-[#c9b99a]"
                    : "px-3 py-1.5 rounded border border-gray-600 text-xs text-gray-300"
                }
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={commitModalCraft}
                disabled={modalMaxCraft < 1}
                className={
                  isL2
                    ? "px-3 py-1.5 rounded-md border border-[#c7ad80]/45 bg-[#2a2418] text-[12px] text-[#e8c56e] disabled:opacity-40"
                    : "px-3 py-1.5 rounded bg-amber-700 text-xs text-white disabled:opacity-40"
                }
              >
                Скрафтить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
