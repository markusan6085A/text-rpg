import React from "react";

/**
 * Лічильники MobTop (рейтинг mobtop.com). Лише production.
 * Головна `/` — 135144; інші маршрути — 135145 (вимога кабінету).
 */
const MOBTOP_MAIN = "135144";
const MOBTOP_INNER = "135145";

function clearMobTopSlots() {
  document.querySelectorAll("[data-mobtop-slot]").forEach((n) => n.remove());
}

function injectMobTop(counterId: string) {
  clearMobTopSlots();
  const wrap = document.createElement("div");
  wrap.setAttribute("data-mobtop-slot", counterId);
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;";

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = `//mobtop.com/c/${counterId}.js`;
  wrap.appendChild(script);

  const noscript = document.createElement("noscript");
  const a = document.createElement("a");
  a.href = `//mobtop.com/in/${counterId}`;
  const img = document.createElement("img");
  img.src = `//mobtop.com/${counterId}.gif`;
  img.alt = "MobTop - Рейтинг и статистика мобильных сайтов";
  a.appendChild(img);
  noscript.appendChild(a);
  wrap.appendChild(noscript);

  document.body.appendChild(wrap);
}

/**
 * Без пропсів: слухає SPA-навігацію (pushState/replaceState + popstate), бо App не використовує react-router.
 */
export function MobTopRatingScripts() {
  React.useEffect(() => {
    if (!import.meta.env.PROD) return;

    const sync = () => {
      const p = window.location.pathname.replace(/\/$/, "") || "/";
      const isHome = p === "/";
      injectMobTop(isHome ? MOBTOP_MAIN : MOBTOP_INNER);
    };

    sync();
    window.addEventListener("popstate", sync);
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = (...args: Parameters<History["pushState"]>) => {
      origPush(...args);
      sync();
    };
    history.replaceState = (...args: Parameters<History["replaceState"]>) => {
      origReplace(...args);
      sync();
    };

    return () => {
      window.removeEventListener("popstate", sync);
      history.pushState = origPush;
      history.replaceState = origReplace;
      clearMobTopSlots();
    };
  }, []);

  return null;
}
