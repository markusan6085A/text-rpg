import React from "react";
import { getString, setString } from "../state/persistence";
import {
  TUTORIAL_HINT_KEY,
  dismissTutorialHintId,
  getDismissedTutorialHintIds,
} from "../state/gameSettings";
import { getCityUiVariant } from "../utils/cityUiVariant";
import { pickContextualTutorialHint } from "../utils/tutorialHintEngine";

const TUTORIAL_HINT_SEEN_KEY = TUTORIAL_HINT_KEY;
const HELPER_ICON = "/icons/helper.jpg";

const TUTORIAL_PATHS = [
  "/",
  "/city",
  "/location",
  "/character",
  "/gk",
  "/stats",
  "/learned-skills",
  "/guild",
  "/mage-guild",
  "/inventory",
  "/battle",
  "/daily-quests",
  "/quests",
  "/shop",
  "/equipment",
  "/premium-account",
  "/warehouse",
  "/market",
  "/fishing",
  "/additional-skills",
  "/magic-statue",
  "/tattoo-artist",
  "/mail",
  "/about",
  "/achievements",
  "/leaderboard",
  "/clans",
];

function normalizeTutorialPath(pathname: string): string {
  const p = pathname.replace(/\?.*$/, "").replace(/\/+$/, "") || "/";
  return p;
}

interface TutorialHintProps {
  navigate?: (path: string) => void;
  showStatusBars?: boolean;
  pathname: string;
  hero: unknown;
}

export default function TutorialHint({
  navigate,
  showStatusBars = true,
  pathname,
  hero,
}: TutorialHintProps) {
  const [, rerender] = React.useReducer((n: number) => n + 1, 0);

  const pathNorm = normalizeTutorialPath(pathname);
  /** Читаємо з storage щоразу — після resetTutorialHint() (новий герой) не лишається старий useState */
  const welcomeDismissed = getString(TUTORIAL_HINT_SEEN_KEY, null) === "1";
  const dismissedIds = getDismissedTutorialHintIds();
  let contextual = pickContextualTutorialHint(hero, dismissedIds);
  if (
    contextual &&
    normalizeTutorialPath(contextual.ctaPath) === pathNorm
  ) {
    contextual = null;
  }

  const onPath = TUTORIAL_PATHS.includes(pathNorm);
  const hideOnHelp = pathNorm === "/help";

  const showContextual =
    hero &&
    showStatusBars &&
    navigate &&
    onPath &&
    !hideOnHelp &&
    contextual !== null;

  const showWelcome =
    hero &&
    showStatusBars &&
    navigate &&
    onPath &&
    !hideOnHelp &&
    !welcomeDismissed &&
    contextual === null;

  const shouldShow = showContextual || showWelcome;

  const dismissContextual = () => {
    if (contextual) dismissTutorialHintId(contextual.id);
    rerender();
  };

  const handleWelcomeGo = () => {
    setString(TUTORIAL_HINT_SEEN_KEY, "1");
    rerender();
    navigate!("/help");
  };

  const handleWelcomeClose = () => {
    setString(TUTORIAL_HINT_SEEN_KEY, "1");
    rerender();
  };

  const handleContextualGo = () => {
    if (!contextual || !navigate) return;
    dismissTutorialHintId(contextual.id);
    navigate(contextual.ctaPath);
    rerender();
  };

  if (!shouldShow) return null;

  const isL2 = getCityUiVariant() === "l2";

  const barInner = showContextual ? (
    <>
      <img
        src={HELPER_ICON}
        alt=""
        className="w-9 h-9 rounded-md border border-[#5c4a32]/70 object-cover shrink-0"
        width={36}
        height={36}
      />
      <span className="flex-1 min-w-0">
        <span className="text-[#e8c56e] font-semibold">Подсказка:</span>{" "}
        {contextual!.message}
      </span>
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={handleContextualGo}
          className="px-2.5 py-1 rounded-md border border-[#c7ad80]/50 bg-gradient-to-b from-[#4a3d28] to-[#2a2218] text-[#f5e6c8] text-[10px] font-semibold hover:border-[#e8c56e]/60 hover:brightness-110 active:scale-[0.99]"
        >
          {contextual!.ctaLabel}
        </button>
        <button
          type="button"
          onClick={dismissContextual}
          className="px-2.5 py-1 rounded-md border border-[#5c4a32]/70 bg-black/30 text-[#a89878] text-[10px] hover:bg-black/45 hover:text-[#d4c4a8]"
        >
          Закрыть
        </button>
      </div>
    </>
  ) : (
    <>
      <img
        src={HELPER_ICON}
        alt=""
        className="w-9 h-9 rounded-md border border-[#5c4a32]/70 object-cover shrink-0"
        width={36}
        height={36}
      />
      <span className="flex-1 min-w-0">
        <span className="text-[#e8c56e] font-semibold">Обучение:</span> откройте{" "}
        <span className="text-[#c9a44c] font-medium">Помощь</span> в меню — город,
        телепорт, гильдия навыков, квесты и инвентарь. Внизу есть ярлыки{" "}
        <span className="text-[#c9a44c] font-medium">Город</span> и{" "}
        <span className="text-[#c9a44c] font-medium">Телепорт</span>.
      </span>
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={handleWelcomeGo}
          className="px-2.5 py-1 rounded-md border border-[#c7ad80]/50 bg-gradient-to-b from-[#4a3d28] to-[#2a2218] text-[#f5e6c8] text-[10px] font-semibold hover:border-[#e8c56e]/60 hover:brightness-110 active:scale-[0.99]"
        >
          Открыть помощь
        </button>
        <button
          type="button"
          onClick={handleWelcomeClose}
          className="px-2.5 py-1 rounded-md border border-[#5c4a32]/70 bg-black/30 text-[#a89878] text-[10px] hover:bg-black/45 hover:text-[#d4c4a8]"
        >
          Закрыть
        </button>
      </div>
    </>
  );

  if (isL2) {
    return (
      <div
        className="relative z-[25] w-full shrink-0 mx-0 mt-1 mb-0.5 px-2.5 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-[#5c4a32]/80 bg-gradient-to-b from-[#2a2318]/95 to-[#14110c]/95 shadow-[inset_0_1px_0_rgba(199,173,128,0.12),0_4px_14px_rgba(0,0,0,0.45)] text-[#d4c4a8] text-[11px] leading-snug"
        role="status"
      >
        {barInner}
      </div>
    );
  }

  const classicInner = showContextual ? (
    <>
      <img
        src={HELPER_ICON}
        alt=""
        className="w-8 h-8 rounded object-cover shrink-0"
        width={32}
        height={32}
      />
      <span className="flex-1 min-w-0">
        <span className="text-amber-400 font-medium">Подсказка:</span>{" "}
        {contextual!.message}
      </span>
      <div className="flex gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={handleContextualGo}
          className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-black text-[10px] font-semibold"
        >
          {contextual!.ctaLabel}
        </button>
        <button
          type="button"
          onClick={dismissContextual}
          className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-amber-200 text-[10px]"
        >
          Закрыть
        </button>
      </div>
    </>
  ) : (
    <>
      <img
        src={HELPER_ICON}
        alt=""
        className="w-8 h-8 rounded object-cover shrink-0"
        width={32}
        height={32}
      />
      <span className="flex-1 min-w-0">
        Обучение: <span className="text-amber-400 font-medium">Меню → Помощь</span>{" "}
        — справка по городу, навыкам и квестам.
      </span>
      <div className="flex gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={handleWelcomeGo}
          className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-black text-[10px] font-semibold"
        >
          Перейти
        </button>
        <button
          type="button"
          onClick={handleWelcomeClose}
          className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-amber-200 text-[10px]"
        >
          Закрыть
        </button>
      </div>
    </>
  );

  return (
    <div className="relative z-[25] w-full shrink-0 mt-[5px] px-2 py-1.5 flex items-center justify-between gap-2 bg-amber-900/40 border-b border-amber-700/50 text-amber-100 text-[11px]">
      {classicInner}
    </div>
  );
}
