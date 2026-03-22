// src/screens/GK.tsx
import React from "react";
import {
  cities as WORLD_CITIES,
  locations as WORLD_LOCATIONS,
} from "../data/world";
import type { Zone } from "../data/world/types";
import { useHeroStore } from "../state/heroStore";
import { savePreviousLocation, savePreviousCity, getPreviousCity, clearPreviousLocation } from "../utils/locationNavigation";
import { getCityUiVariant } from "../utils/cityUiVariant";

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

export default function GKScreen({ navigate }: { navigate: Navigate }) {
  const hero = useHeroStore((s) => s.hero);
  const q = useQuery();
  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const l2Row =
    "w-full text-left text-[12px] py-2.5 px-3 mb-2 rounded-md flex items-center gap-2 bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 shadow-[inset_0_1px_0_rgba(199,173,128,0.12),0_4px_14px_rgba(0,0,0,0.55)] hover:border-[#c7ad80]/50 hover:brightness-110 active:scale-[0.99] transition-[border-color,transform,filter] duration-150";

  const defaultCityId =
    q.get("city") ||
    (hero?.heroJson as any)?.currentCityId ||
    getPreviousCity() ||
    WORLD_CITIES[0]?.id;

  const [selectedCityId, setSelectedCityId] = React.useState(defaultCityId);

  const selectedCity =
    WORLD_CITIES.find((c) => c.id === selectedCityId) || WORLD_CITIES[0];

  const zones = selectedCity ? getZonesByCity(selectedCity.id) : [];

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    savePreviousCity(cityId); // localStorage (per-account)
    // Зберігаємо в hero для синхронізації з сервером та City/ТП
    if (hero) {
      const hj = (hero as any).heroJson || {};
      useHeroStore.getState().updateHero({ heroJson: { ...hj, currentCityId: cityId } } as any);
    }
    const params = new URLSearchParams(location.search);
    params.set("city", cityId);
    history.replaceState(null, "", `/gk?${params.toString()}`);
  };

  const goToZone = (zoneId: string) => {
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
              ? "mb-3 text-[12px] text-[#d4c4a8] rounded-lg border border-[#5c4a32]/40 bg-black/22 px-3 py-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
              : "text-gray-400 mb-3 text-xs border-b border-solid border-white/50 pb-2"
          }
        >
          {selectedCity ? (
            <>
              Вы в городе{" "}
              <span className={isL2 ? "text-[#e8c56e] font-semibold" : "text-[#ff8c00]"}>
                {selectedCity.name}
              </span>
              .
            </>
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
                return isL2 ? (
                  <button
                    type="button"
                    key={city.id}
                    className={`${l2Row} justify-between w-full ${
                      active ? "ring-1 ring-[#c7ad80]/35 border-[#c7ad80]/40" : ""
                    }`}
                    onClick={() => handleCityChange(city.id)}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <img src={iconPath} alt="" className={ico} />
                      <span className="text-[#d4c4a8] truncate">{city.name}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[#a89878] shrink-0">
                      0
                      <img src="/assets/adena.png" alt="" className={ico} />
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
                    <img src={iconPath} alt={city.name} className="w-3 h-3 object-contain" />
                    <span>{city.name}</span>
                    <span className="ml-auto flex items-center gap-1 text-[#c7ad80]">
                      0
                      <img src="/assets/adena.png" alt="Adena" className="w-3 h-3 object-contain" />
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
                      className={`${l2Row} justify-between w-full items-start gap-2`}
                      onClick={() => goToZone(zone.id)}
                    >
                      <span className="flex items-start gap-2 min-w-0 text-left">
                        <img src="/assets/travel.png" alt="" className={`${ico} mt-0.5`} />
                        <span className="flex flex-col min-w-0">
                          <span className="text-[#e8dcc8] leading-snug">{zone.name}</span>
                          <span className="text-[11px] text-[#c45c5c] mt-0.5">
                            ур. {zone.minLevel}–{zone.maxLevel}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-0.5 shrink-0 text-right">
                        <span className="text-[#f0d78c] font-medium tabular-nums">
                          {zone.tpCost.toLocaleString("ru-RU")}
                        </span>
                        <img src="/assets/adena.png" alt="" className="w-3.5 h-3.5 object-contain opacity-90" />
                      </span>
                    </button>
                  ) : (
                    <div
                      key={zone.id}
                      className="flex items-center gap-2 text-[#c7ad80] text-xs cursor-pointer hover:text-[#f4e2b8] py-0.5"
                      onClick={() => goToZone(zone.id)}
                    >
                      <img src="/assets/travel.png" alt={zone.name} className="w-3 h-3 object-contain" />
                      <span>{zone.name}:</span>
                      <span className="text-red-500">
                        {zone.minLevel}-{zone.maxLevel}
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-[#c7ad80]">
                        {zone.tpCost.toLocaleString("ru-RU")}
                        <img src="/assets/adena.png" alt="Adena" className="w-3 h-3 object-contain" />
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
