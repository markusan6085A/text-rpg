/** Вигляд UI: класичний, теплий L2, або тестовий «холодний» профіль (l2test). Перемикач у Місті. */
import { useEffect, useState } from "react";

const STORAGE_KEY = "l2_city_ui_variant";

/** Подія для синхронного оновлення UI в тій самій вкладці після setCityUiVariant */
export const CITY_UI_VARIANT_CHANGE_EVENT = "l2-city-ui-variant-change";

export type CityUiVariant = "classic" | "l2" | "l2test";

export function getCityUiVariant(): CityUiVariant {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "l2" || v === "classic" || v === "l2test") return v;
  } catch {
    /* ignore */
  }
  return "l2";
}

/** Місто, бій, інвентар — тепла L2-оболонка для «l2» і «l2test» (odнакова база). */
export function isWarmCityUi(v: CityUiVariant): boolean {
  return v === "l2" || v === "l2test";
}

/** Окремий дизайн сторінки персонажа / смуг (експеримент). */
export function isProfileTestUi(v: CityUiVariant): boolean {
  return v === "l2test";
}

export function setCityUiVariant(v: CityUiVariant): void {
  try {
    localStorage.setItem(STORAGE_KEY, v);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CITY_UI_VARIANT_CHANGE_EVENT));
    }
  } catch {
    /* ignore */
  }
}

/** Реактивна версія для екранів (оновлюється після перемикача в Місті без F5). */
export function useCityUiVariant(): CityUiVariant {
  const [v, setV] = useState<CityUiVariant>(() => getCityUiVariant());

  useEffect(() => {
    const sync = () => setV(getCityUiVariant());
    window.addEventListener(CITY_UI_VARIANT_CHANGE_EVENT, sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CITY_UI_VARIANT_CHANGE_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return v;
}
