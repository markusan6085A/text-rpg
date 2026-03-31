/** Вигляд екрана «Місто»: класичний або теплий L2-стиль. Зберігається в localStorage — перемикач у Місті. */
import { useEffect, useState } from "react";

const STORAGE_KEY = "l2_city_ui_variant";

/** Подія для синхронного оновлення UI в тій самій вкладці після setCityUiVariant */
export const CITY_UI_VARIANT_CHANGE_EVENT = "l2-city-ui-variant-change";

export type CityUiVariant = "classic" | "l2";

export function getCityUiVariant(): CityUiVariant {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "l2" || v === "classic") return v;
  } catch {
    /* ignore */
  }
  return "l2";
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
