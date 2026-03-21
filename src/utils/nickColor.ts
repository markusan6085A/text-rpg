// Utility for getting nickname color
// Returns the color for a nickname, with fallback to default color

import type { Hero } from "../types/Hero";
import { ADMIN_CHARACTER_NAME } from "../config/admin";

/** Колір та ефект для ніка адміна (Existence): зелений світло + glow */
const ADMIN_NICK_COLOR = "#00ff88";
const ADMIN_NICK_GLOW = "0 0 6px #00ff88, 0 0 12px rgba(0, 255, 136, 0.8), 0 0 20px rgba(0, 255, 136, 0.4)";

/** Переможець 7 Печатей: невеликий жовтий світло */
const SEVEN_SEALS_COLOR = "#f0d030";
const SEVEN_SEALS_GLOW = "0 0 4px #f0d030, 0 0 8px rgba(240, 208, 48, 0.6)";

/** CSS-клас для анімації ніка Existence (пульсація світла) */
export const ADMIN_NICK_CLASS = "nick-existence-glow";

function isAdminNick(name: string | undefined): boolean {
  return name?.trim() === ADMIN_CHARACTER_NAME;
}

/**
 * Gets the color for a nickname
 * @param playerName - The name of the player
 * @param hero - Current hero (for own nickname)
 * @param nickColor - Optional nickColor from API/other source
 * @param sevenSealsWinnerRank - 1|2|3 if player is Seven Seals winner
 * @returns Hex color string or default color
 */
function normNick(s: string | undefined): string {
  return String(s ?? "").trim().toLowerCase();
}

export function getNickColor(
  playerName: string,
  hero: Hero | null,
  nickColor?: string,
  sevenSealsWinnerRank?: number | null
): string {
  if (isAdminNick(playerName)) return ADMIN_NICK_COLOR;
  if (sevenSealsWinnerRank != null && sevenSealsWinnerRank >= 1 && sevenSealsWinnerRank <= 3) return SEVEN_SEALS_COLOR;

  // If nickColor is provided (from API), use it
  if (nickColor) {
    return nickColor;
  }

  // If it's the current player's own nickname, use hero.nickColor (регістр як у чаті з сервера може відрізнятися)
  const pn = normNick(playerName);
  if (
    hero &&
    (pn === normNick(hero.name) || pn === normNick(hero.username))
  ) {
    return hero.nickColor || "#c7ad80"; // Основний колір ніка
  }

  // Default color for other players (if no color is provided)
  return "#c7ad80"; // Основний колір ніка
}

/**
 * Gets the color style object for a nickname
 * @param playerName - The name of the player
 * @param hero - Current hero (for own nickname)
 * @param nickColor - Optional nickColor from API/other source
 * @param sevenSealsWinnerRank - 1|2|3 if player is Seven Seals winner (small yellow glow)
 * @returns Style object with color property (for Existence adds glow)
 */
export function getNickColorStyle(
  playerName: string,
  hero: Hero | null,
  nickColor?: string,
  sevenSealsWinnerRank?: number | null
): React.CSSProperties {
  if (isAdminNick(playerName)) {
    return {
      color: ADMIN_NICK_COLOR,
      textShadow: ADMIN_NICK_GLOW,
      fontWeight: 600,
    };
  }
  if (sevenSealsWinnerRank != null && sevenSealsWinnerRank >= 1 && sevenSealsWinnerRank <= 3) {
    return {
      color: SEVEN_SEALS_COLOR,
      textShadow: SEVEN_SEALS_GLOW,
    };
  }
  return {
    color: getNickColor(playerName, hero, nickColor, sevenSealsWinnerRank),
  };
}

/** Чи це нік адміна (Existence) — для додавання класу з анімацією */
export function isAdminNickName(name: string | undefined): boolean {
  return isAdminNick(name);
}
