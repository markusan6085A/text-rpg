import { getGameSettings } from "../state/gameSettings";
import type { Language } from "../state/gameSettings";

type Translations = Record<string, { ru: string; uk: string }>;

const T: Translations = {
  settings_title: { ru: "Настройки", uk: "Налаштування" },
  settings_subtitle: { ru: "Параметры игры", uk: "Параметри гри" },
  back_menu: { ru: "← Меню", uk: "← Меню" },
  tutorial_section: { ru: "Обучалка", uk: "Обучалка" },
  tutorial_reset_btn: { ru: "Показать обучалку снова под барами", uk: "Показати обучалку знову під барами" },
  tutorial_ok: { ru: "Готово! Обучалка появится при следующем заходе на город.", uk: "Готово! Обучалка з'явиться при наступному заході в місто." },
  appearance_section: { ru: "Внешний вид", uk: "Зовнішній вигляд" },
  compact_mode: { ru: "Компактный режим", uk: "Компактний режим" },
  compact_hint: { ru: "Меньше отступов, больше контента на экране", uk: "Менше відступів, більше контенту на екрані" },
  large_font: { ru: "Крупный шрифт", uk: "Великий шрифт" },
  large_font_hint: { ru: "Увеличенный текст для удобства чтения", uk: "Збільшений текст для зручності читання" },
  lang_section: { ru: "Язык", uk: "Мова" },
  lang_ru: { ru: "Русский", uk: "Русский" },
  lang_uk: { ru: "Українська", uk: "Українська" },
  mobs_section: { ru: "Мобы на странице", uk: "Мобів на сторінці" },
  mobs_hint: { ru: "Количество мобов в списке локации", uk: "Кількість мобів у списку локації" },
  exp_section: { ru: "Опыт (EXP)", uk: "Досвід (EXP)" },
  exp_enabled: { ru: "Получать EXP", uk: "Отримувати EXP" },
  exp_hint: { ru: "Вкл — EXP с мобов, рыбалки и ежедневных заданий. Выкл — EXP не падает ни откуда.", uk: "Вкл — EXP з мобів, рибалки та щоденних завдань. Викл — EXP не падає нізвідки." },
  on: { ru: "Вкл", uk: "Вкл" },
  off: { ru: "Выкл", uk: "Викл" },
};

export function t(key: keyof typeof T, lang?: Language): string {
  const l = lang ?? getGameSettings().language ?? "ru";
  return T[key]?.[l] ?? T[key]?.ru ?? key;
}
