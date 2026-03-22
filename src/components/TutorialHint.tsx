import React from "react";
import { getString, setString } from "../state/persistence";
import { TUTORIAL_HINT_KEY } from "../state/gameSettings";
import { getCityUiVariant } from "../utils/cityUiVariant";

const TUTORIAL_HINT_SEEN_KEY = TUTORIAL_HINT_KEY;

const TUTORIAL_PATHS = ["/city", "/location", "/character", "/gk", "/stats", "/learned-skills"];

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
  const [dismissed, setDismissed] = React.useState(() => getString(TUTORIAL_HINT_SEEN_KEY, null) === "1");
  const [localSeen, setLocalSeen] = React.useState(false);

  const pathNorm = normalizeTutorialPath(pathname);
  const shouldShow =
    hero &&
    showStatusBars &&
    !dismissed &&
    !localSeen &&
    navigate &&
    TUTORIAL_PATHS.includes(pathNorm);

  const handleGo = () => {
    setString(TUTORIAL_HINT_SEEN_KEY, "1");
    setLocalSeen(true);
    setDismissed(true);
    navigate!("/help");
  };

  const handleClose = () => {
    setString(TUTORIAL_HINT_SEEN_KEY, "1");
    setLocalSeen(true);
    setDismissed(true);
  };

  if (!shouldShow) return null;

  const isL2 = getCityUiVariant() === "l2";

  if (isL2) {
    return (
      <div
        className="relative z-[25] w-full shrink-0 mx-0 mt-1 mb-0.5 px-2.5 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-[#5c4a32]/80 bg-gradient-to-b from-[#2a2318]/95 to-[#14110c]/95 shadow-[inset_0_1px_0_rgba(199,173,128,0.12),0_4px_14px_rgba(0,0,0,0.45)] text-[#d4c4a8] text-[11px] leading-snug"
        role="status"
      >
        <span>
          <span className="text-[#e8c56e] font-semibold">Обучалка:</span> загляни в{" "}
          <span className="text-[#c9a44c] font-medium">Помощь</span> — город, телепорт, скиллы, рынок, квесты. Ниже в меню есть{" "}
          <span className="text-[#c9a44c] font-medium">Город</span> и <span className="text-[#c9a44c] font-medium">Телепорт</span>.
        </span>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleGo}
            className="px-2.5 py-1 rounded-md border border-[#c7ad80]/50 bg-gradient-to-b from-[#4a3d28] to-[#2a2218] text-[#f5e6c8] text-[10px] font-semibold hover:border-[#e8c56e]/60 hover:brightness-110 active:scale-[0.99]"
          >
            Открыть помощь
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-2.5 py-1 rounded-md border border-[#5c4a32]/70 bg-black/30 text-[#a89878] text-[10px] hover:bg-black/45 hover:text-[#d4c4a8]"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-[25] w-full shrink-0 mt-[5px] px-2 py-1.5 flex items-center justify-between gap-2 bg-amber-900/40 border-b border-amber-700/50 text-amber-100 text-[11px]">
      <span>
        Обучалка: <span className="text-amber-400 font-medium">Меню → Помощь</span> — полная справка для новых игроков.
      </span>
      <div className="flex gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={handleGo}
          className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-black text-[10px] font-semibold"
        >
          Перейти
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-amber-200 text-[10px]"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
