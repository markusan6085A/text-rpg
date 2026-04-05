// src/screens/GK.tsx
import React from "react";
import {
  cities as WORLD_CITIES,
  locations as WORLD_LOCATIONS,
  DEFAULT_PLAYER_CITY_ID,
  getCityById,
} from "../data/world";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";
import type { Zone } from "../data/world/types";
import { useHeroStore } from "../state/heroStore";
import { showToast } from "../state/toastStore";
import { savePreviousLocation, savePreviousCity, getPreviousCity, clearPreviousLocation } from "../utils/locationNavigation";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { displayCityName, displayZoneName } from "../utils/worldDisplay";
import { useGameSettingsVersion } from "../hooks/useGameSettingsVersion";
import { getGameSettings } from "../state/gameSettings";
import {
  GK_FREE_TELEPORT_MAX_LEVEL,
  resolveGkTeleportAdenaCharge,
} from "../data/world/gkTeleportCostTable";
import { getAccessToken, postCharacterGkTeleport } from "../utils/api";

type Navigate = (path: string) => void;

// Маппінг міст до іконок (за ID міста)
const CITY_ICONS: Record<string, string> = {
  // Додайте тут міста та їх іконки
  // Приклад: "floran": "/assets/floran.png",
  // "gludin": "/assets/gludin.png",
};

// Маппінг міст до іконок (за назвою міста)
const CITY_ICONS_BY_NAME: Record<string, string> = {
  "Talking Island Village": "/assets/gk.jpg",
};

function useQuery() {
  return React.useMemo(() => new URLSearchParams(location.search), []);
}

function getZonesByCity(cityId: string): Zone[] {
  return WORLD_LOCATIONS.filter((z) => z.cityId === cityId);
}

/** Підказка по рівнях мобів у зонах міста: мінімум з усіх minLevel — максимум з усіх maxLevel */
function getCityMobLevelRangeLabel(cityId: string): string | null {
  const zones = WORLD_LOCATIONS.filter((z) => z.cityId === cityId);
  if (zones.length === 0) return null;
  const minLvl = Math.min(...zones.map((z) => z.minLevel));
  const maxLvl = Math.max(...zones.map((z) => z.maxLevel));
  if (!Number.isFinite(minLvl) || !Number.isFinite(maxLvl)) return null;
  return `${minLvl}–${maxLvl}`;
}

export default function GKScreen({ navigate }: { navigate: Navigate }) {
  useGameSettingsVersion();
  const hero = useHeroStore((s) => s.hero);
  const updateAdena = useHeroStore((s) => s.updateAdena);
  const q = useQuery();
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const l2Row =
    "w-full text-left text-[12px] py-2.5 px-3 mb-2 rounded-md flex items-center gap-2 bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 shadow-[inset_0_1px_0_rgba(199,173,128,0.12),0_4px_14px_rgba(0,0,0,0.55)] hover:border-[#c7ad80]/50 hover:brightness-110 active:scale-[0.99] transition-[border-color,transform,filter] duration-150";
  const l2ZoneRow =
    "w-full text-left text-[11px] py-1.5 px-2 mb-1.5 rounded-md flex items-start gap-1.5 bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 shadow-[inset_0_1px_0_rgba(199,173,128,0.1),0_2px_10px_rgba(0,0,0,0.5)] hover:border-[#c7ad80]/50 hover:brightness-[1.03] active:scale-[0.995] transition-[border-color,transform,filter] duration-150";

  const defaultCityId =
    q.get("city") ||
    (hero?.heroJson as any)?.currentCityId ||
    getPreviousCity() ||
    DEFAULT_PLAYER_CITY_ID;

  const [selectedCityId, setSelectedCityId] = React.useState(defaultCityId);

  const selectedCity =
    WORLD_CITIES.find((c) => c.id === selectedCityId) || getCityById(DEFAULT_PLAYER_CITY_ID) || WORLD_CITIES[0];

  const zones = selectedCity ? getZonesByCity(selectedCity.id) : [];

  const applyServerCharacterSnapshot = (character: any) => {
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
    const coinLuckFromServer = Number((character as any).coinLuck ?? currentHero.coinOfLuck ?? 0);
    const revision = Number(heroJson.heroRevision ?? (currentHero as any)?.heroJson?.heroRevision ?? 0);
    const level = Number((character as any).level ?? currentHero.level ?? 1);
    const exp = Number((character as any).exp ?? currentHero.exp ?? 0);
    const sp = Number((character as any).sp ?? currentHero.sp ?? 0);
    const adena = Number((character as any).adena ?? currentHero.adena ?? 0);
    store.applyServerSync(
      {
        level,
        exp,
        sp,
        adena,
        coinOfLuck: coinLuckFromServer,
        inventory,
        overflowChest,
        activeDyes,
        heroJson,
      } as any,
      {
        level,
        exp,
        sp,
        adena,
        coinLuck: coinLuckFromServer,
        heroRevision: Number.isFinite(revision) ? revision : 0,
        updatedAt: Date.now(),
      }
    );
  };

  const heroLevel = Math.max(1, Math.floor(Number(hero?.level ?? 1)));
  const tpFreeThrough40 = heroLevel <= GK_FREE_TELEPORT_MAX_LEVEL;

  const handleCityChange = async (cityId: string) => {
    if (cityId === selectedCityId) return;

    if (!hero) {
      showToast("Персонаж не завантажений.", "error");
      return;
    }

    const preview = resolveGkTeleportAdenaCharge({
      heroLevel,
      kind: "city",
      targetId: cityId,
    });
    if (preview === null) {
      showToast("Невідоме місто для телепорту.", "error");
      return;
    }

    const token = getAccessToken();
    if (token) {
      try {
        const expectedRevision = Number(
          useHeroStore.getState().serverState?.heroRevision ??
          (hero as any)?.heroJson?.heroRevision ??
          0
        );
        const res = await postCharacterGkTeleport(hero.id, {
          kind: "city",
          targetId: cityId,
          expectedRevision: Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0,
        });
        applyServerCharacterSnapshot((res as any).character);
      } catch (e: unknown) {
        const msg = (e as Error)?.message || "";
        showToast(
          msg === "not enough adena"
            ? "Недостаточно адены для телепорта в этот город!"
            : msg || "Ошибка телепорта",
          "error",
        );
        return;
      }
    } else {
      if (preview > 0 && (hero.adena ?? 0) < preview) {
        showToast("Недостаточно адены для телепорта в этот город!", "error");
        return;
      }
      if (preview > 0) updateAdena(-preview);
      const hj = (hero as any).heroJson || {};
      useHeroStore.getState().updateHero({ heroJson: { ...hj, currentCityId: cityId } } as any);
    }

    setSelectedCityId(cityId);
    savePreviousCity(cityId); // localStorage (per-account)
    const params = new URLSearchParams(location.search);
    params.set("city", cityId);
    history.replaceState(null, "", `/gk?${params.toString()}`);
  };

  const goToZone = async (zoneId: string) => {
    if (!hero) {
      showToast("Персонаж не завантажений.", "error");
      return;
    }

    const preview = resolveGkTeleportAdenaCharge({
      heroLevel,
      kind: "zone",
      targetId: zoneId,
    });
    if (preview === null) {
      showToast("Невідома локація для телепорту.", "error");
      return;
    }

    const token = getAccessToken();
    if (token) {
      try {
        const expectedRevision = Number(
          useHeroStore.getState().serverState?.heroRevision ??
          (hero as any)?.heroJson?.heroRevision ??
          0
        );
        const res = await postCharacterGkTeleport(hero.id, {
          kind: "zone",
          targetId: zoneId,
          expectedRevision: Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0,
        });
        applyServerCharacterSnapshot((res as any).character);
      } catch (e: unknown) {
        const msg = (e as Error)?.message || "";
        showToast(
          msg === "not enough adena"
            ? "Недостаточно адены для телепорта на эту локацию!"
            : msg || "Ошибка телепорта",
          "error",
        );
        return;
      }
    } else {
      if (preview > 0 && (hero.adena ?? 0) < preview) {
        showToast("Недостаточно адены для телепорта на эту локацию!", "error");
        return;
      }
      if (preview > 0) updateAdena(-preview);
    }

    // 🔥 Зберігаємо поточне місто — щоб City та ТП пам'ятали останнє місто
    if (selectedCity) savePreviousCity(selectedCity.id);
    // 🔥 Скрол вгору при навігації - завжди показуємо верх сторінки з барами
    window.scrollTo(0, 0);
    // 🔥 Очищаємо попередню локацію при виході з міста через телепорт
    clearPreviousLocation();
    navigate(`/location?id=${zoneId}`);
  };

  const adena = hero?.adena || 0;
  const ico = isL2 ? "w-4 h-4 object-contain shrink-0" : "w-3 h-3 object-contain shrink-0";
  const icoZone = isL2 ? "w-3.5 h-3.5 object-contain shrink-0 mt-px" : "w-3 h-3 object-contain shrink-0";

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#e8dcc8]`
          : "w-full text-[#f4e2b8] px-1 pt-0 pb-2"
      }
    >
      <div className={isL2 ? "w-full max-w-[420px] mx-auto" : ""}>
        <div className="flex justify-center mb-2">
          <img
            src="/icons/teleport.jpg"
            alt="Телепорт"
            className={
              isL2
                ? "w-[85%] max-w-[280px] h-auto object-contain rounded-lg border border-[#5c4a32]/50 shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
                : "w-[85%] max-w-[280px] h-auto object-contain rounded"
            }
          />
        </div>

        <div
          className={
            isL2
              ? "mb-3 rounded-lg border border-[#5c4a32]/45 bg-black/22 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
              : "text-gray-400 mb-3 text-xs border-b border-solid border-white/50 pb-2"
          }
        >
          {selectedCity ? (
            isL2 ? (
              <>
                <div className="text-[10px] uppercase tracking-wider text-[#8a7a60]">
                  {getGameSettings().language === "uk" ? "Місто" : "Город"}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[#e8c56e] text-[15px] font-semibold leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
                  <img
                    src="/icons/teleport.jpg"
                    alt=""
                    className="w-4 h-4 object-contain shrink-0 opacity-90 rounded-sm"
                  />
                  <span>{displayCityName(selectedCity)}</span>
                </div>
              </>
            ) : (
              <>
                Вы в городе{" "}
                <span className="text-[#ff8c00]">{displayCityName(selectedCity)}</span>.
              </>
            )
          ) : (
            <>Немає міст. Світ очищено — будемо будувати з нуля.</>
          )}
        </div>

        <div
          className={
            isL2
              ? "mb-3 flex items-stretch gap-2 pb-2 border-b border-[#c7ad80]/15"
              : "mb-3 flex items-center gap-2 border-b border-solid border-white/50 pb-1.5"
          }
        >
          {isL2 ? (
            <>
              <button
                type="button"
                className={`${l2Row} flex-1 justify-center text-[#c9a44c] hover:text-[#f4e2b8] mb-0 min-h-[44px]`}
                onClick={() => navigate("/quests")}
              >
                <img src="/assets/quest.png" alt="" className={ico} />
                <span className="font-semibold">Квести</span>
              </button>
              <button
                type="button"
                className={`${l2Row} flex-1 justify-center text-[#d4b88a] hover:text-[#f4e8d4] mb-0 min-h-[44px]`}
                onClick={() => navigate("/quest-shop")}
              >
                <img src="/icons/col.png" alt="" className={ico} />
                <span>кв-шоп</span>
              </button>
            </>
          ) : (
            <>
              <div className="rounded-md border-2 border-[#cc6600] px-2 py-1">
                <button
                  type="button"
                  className="text-left text-[12px] py-1 hover:opacity-80 flex items-center gap-2"
                  onClick={() => navigate("/quests")}
                  style={{ color: "#ffd700", textShadow: "0 0 8px rgba(255, 215, 0, 0.5)" }}
                >
                  <img src="/assets/quest.png" alt="Квести" className="w-3 h-3 object-contain" />
                  <span className="font-semibold">Квести</span>
                </button>
              </div>
              <div className="rounded-md border-2 border-[#cc6600] px-2 py-1 ml-auto">
                <button
                  type="button"
                  className="text-[13px] text-[#ff8c00] py-1 hover:text-[#ffa500] flex items-center gap-1"
                  onClick={() => navigate("/quest-shop")}
                >
                  <img src="/icons/col.png" alt="кв-шоп" className="w-3 h-3 object-contain" />
                  <span>кв-шоп</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div
          className={
            isL2
              ? `${l2Row} cursor-default hover:brightness-100 hover:border-[#5c4a32]/75 active:scale-100 justify-between text-[#e8dcc8] mb-3`
              : "text-gray-400 mb-3 text-xs border-b border-solid border-white/50 pb-2 flex items-center gap-2"
          }
        >
          {isL2 ? (
            <>
              <span>
                <span className="text-[#c7ad80]">У вас </span>
                <span className="text-[#f0d78c] font-medium">
                  {adena.toLocaleString("ru-RU")}
                </span>
                <span className="text-[#d4c4a8]"> адены</span>
              </span>
              <img src="/assets/adena.png" alt="" className={ico} />
            </>
          ) : (
            <>
              У вас <span className="text-[#ffd700]">{adena.toLocaleString("ru-RU")}</span> адены
              <img src="/assets/adena.png" alt="Adena" className="w-3 h-3 object-contain" />
            </>
          )}
        </div>

        {hero && tpFreeThrough40 ? (
          <div
            className={
              isL2
                ? "mb-3 rounded-md border border-[#5c8a5c]/35 bg-black/20 px-2.5 py-2 text-[10px] leading-snug text-[#a8c9a4] text-center shadow-[inset_0_1px_0_rgba(125,155,122,0.12)]"
                : "mb-3 rounded border border-green-700/40 bg-black/30 px-2 py-1.5 text-[10px] leading-snug text-green-200/90 text-center"
            }
          >
            До 40 уровня включительно телепорты по городам и локациям —{" "}
            <span className="font-semibold text-[#c8e4c4]">бесплатно</span>.
          </div>
        ) : null}

        <div className="mb-3">
          <div
            className={
              isL2
                ? "text-[11px] font-semibold text-[#e8c56e] mb-2 tracking-wide uppercase"
                : "text-[#c7ad80] mb-1 text-xs"
            }
          >
            Города:
          </div>
          <div className={isL2 ? "space-y-0" : "space-y-0.5"}>
            {WORLD_CITIES.length === 0 ? (
              <div className="text-[#c7ad80]/60 text-xs">
                Немає міст. Світ очищено — будемо будувати з нуля.
              </div>
            ) : (
              WORLD_CITIES.map((city) => {
                const iconPath =
                  CITY_ICONS[city.id] || CITY_ICONS_BY_NAME[city.name] || "/icons/castle.png";
                const active = city.id === selectedCityId;
                const cityLvlRange = getCityMobLevelRangeLabel(city.id);
                return isL2 ? (
                  <button
                    type="button"
                    key={city.id}
                    className={`${l2ZoneRow} justify-between w-full items-start gap-2 ${
                      active ? "ring-1 ring-[#c7ad80]/35 border-[#c7ad80]/40" : ""
                    }`}
                    onClick={() => handleCityChange(city.id)}
                  >
                    <span className="flex items-start gap-1.5 min-w-0 text-left">
                      <img src={iconPath} alt="" className={icoZone} />
                      <span className="flex flex-col min-w-0">
                        <span className="text-[#e8dcc8] leading-tight text-[11px]">
                          {displayCityName(city)}
                        </span>
                        {cityLvlRange ? (
                          <span className="text-[10px] text-[#c45c5c] mt-px leading-none">
                            ур. {cityLvlRange}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-0 shrink-0 text-right">
                      {tpFreeThrough40 ? (
                        <span className="text-[#7d9b7a] font-semibold tabular-nums text-[10px] leading-none">
                          бесплатно
                        </span>
                      ) : (
                        <>
                          <span className="text-[#f0d78c] font-medium tabular-nums text-[10px] leading-none">
                            {(city.tpCost ?? 0).toLocaleString("ru-RU")}
                          </span>
                          <img
                            src="/assets/adena.png"
                            alt=""
                            className="w-3 h-3 object-contain opacity-90"
                          />
                        </>
                      )}
                    </span>
                  </button>
                ) : (
                  <div
                    key={city.id}
                    className="flex items-center gap-2 text-[#c7ad80] text-xs cursor-pointer hover:text-[#f4e2b8] py-0.5"
                    onClick={() => handleCityChange(city.id)}
                    onKeyDown={(e) => e.key === "Enter" && handleCityChange(city.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <img src={iconPath} alt={displayCityName(city)} className="w-3 h-3 object-contain" />
                    <span className="min-w-0">
                      {displayCityName(city)}
                      {cityLvlRange ? (
                        <span className="text-[#a89878]"> · ур. {cityLvlRange}</span>
                      ) : null}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-[#c7ad80] shrink-0">
                      {tpFreeThrough40 ? (
                        <span className="text-[#86b886]">бесплатно</span>
                      ) : (
                        <>
                          {(city.tpCost ?? 0).toLocaleString("ru-RU")}
                          <img src="/assets/adena.png" alt="Adena" className="w-3 h-3 object-contain" />
                        </>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {selectedCity && (
          <div className="mb-3">
            <div
              className={
                isL2
                  ? "text-[11px] font-semibold text-[#e8c56e] mb-2 tracking-wide uppercase"
                  : "text-[#c7ad80] mb-1 text-xs"
              }
            >
              Локации:
            </div>
            <div className={isL2 ? "space-y-0" : "space-y-0.5"}>
              {zones.length === 0 ? (
                <div className="text-[#c7ad80]/60 text-xs">
                  Для цього міста поки що немає зон.
                </div>
              ) : (
                zones.map((zone) =>
                  isL2 ? (
                    <button
                      type="button"
                      key={zone.id}
                      className={`${l2ZoneRow} justify-between w-full items-start gap-2`}
                      onClick={() => goToZone(zone.id)}
                    >
                      <span className="flex items-start gap-1.5 min-w-0 text-left">
                        <img src="/assets/travel.png" alt="" className={icoZone} />
                        <span className="flex flex-col min-w-0">
                          <span className="text-[#e8dcc8] leading-tight text-[11px]">{displayZoneName(zone)}</span>
                          <span className="text-[10px] text-[#c45c5c] mt-px leading-none">
                            ур. {zone.minLevel}–{zone.maxLevel}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-0 shrink-0 text-right">
                        {tpFreeThrough40 ? (
                          <span className="text-[#7d9b7a] font-semibold tabular-nums text-[10px] leading-none">
                            бесплатно
                          </span>
                        ) : (
                          <>
                            <span className="text-[#f0d78c] font-medium tabular-nums text-[10px] leading-none">
                              {zone.tpCost.toLocaleString("ru-RU")}
                            </span>
                            <img src="/assets/adena.png" alt="" className="w-3 h-3 object-contain opacity-90" />
                          </>
                        )}
                      </span>
                    </button>
                  ) : (
                    <div
                      key={zone.id}
                      className="flex items-center gap-2 text-[#c7ad80] text-xs cursor-pointer hover:text-[#f4e2b8] py-0.5"
                      onClick={() => goToZone(zone.id)}
                    >
                      <img src="/assets/travel.png" alt={displayZoneName(zone)} className="w-3 h-3 object-contain" />
                      <span>{displayZoneName(zone)}:</span>
                      <span className="text-red-500">
                        {zone.minLevel}-{zone.maxLevel}
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-[#c7ad80]">
                        {tpFreeThrough40 ? (
                          <span className="text-[#86b886]">бесплатно</span>
                        ) : (
                          <>
                            {zone.tpCost.toLocaleString("ru-RU")}
                            <img src="/assets/adena.png" alt="Adena" className="w-3 h-3 object-contain" />
                          </>
                        )}
                      </span>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
