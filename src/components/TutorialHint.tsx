import React from "react";
import { getString, setString } from "../state/persistence";
import { TUTORIAL_HINT_KEY } from "../state/gameSettings";

const TUTORIAL_HINT_SEEN_KEY = TUTORIAL_HINT_KEY;

const TUTORIAL_PATHS = ["/city", "/location", "/character", "/gk"];

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

  const shouldShow =
    hero &&
    showStatusBars &&
    !dismissed &&
    !localSeen &&
    navigate &&
    TUTORIAL_PATHS.includes(pathname);

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

  return (
    <div className="w-full mt-[5px] px-2 py-1.5 flex items-center justify-between gap-2 bg-amber-900/40 border-b border-amber-700/50 text-amber-100 text-[11px]">
      <span>
        Обучалка: <span className="text-amber-400 font-medium">Меню → Помощь</span> — полная справка для новых игроков.
      </span>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={handleGo}
          className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-black text-[10px] font-semibold"
        >
          Перейти
        </button>
        <button
          onClick={handleClose}
          className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-amber-200 text-[10px]"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
