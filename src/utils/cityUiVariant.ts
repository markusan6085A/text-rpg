/** Вигляд екрана «Місто»: класичний або експериментальний L2-стиль. Зберігається в localStorage — легко відкатити. */
const STORAGE_KEY = "l2_city_ui_variant";

export type CityUiVariant = "classic" | "l2";

export function getCityUiVariant(): CityUiVariant {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "l2" || v === "classic") return v;
  } catch {
    /* ignore */
  }
  return "classic";
}

export function setCityUiVariant(v: CityUiVariant): void {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {
    /* ignore */
  }
}
