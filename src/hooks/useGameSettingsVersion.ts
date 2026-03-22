import { useEffect, useState } from "react";
import { GAME_SETTINGS_CHANGED_EVENT } from "../state/gameSettings";

/** Збільшує версію після зміни gameSettings (мова тощо), щоб перемалювати екран. */
export function useGameSettingsVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const h = () => setV((x) => x + 1);
    window.addEventListener(GAME_SETTINGS_CHANGED_EVENT, h);
    return () => window.removeEventListener(GAME_SETTINGS_CHANGED_EVENT, h);
  }, []);
  return v;
}
