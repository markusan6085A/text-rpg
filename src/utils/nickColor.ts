// Utility for getting nickname color
// Returns the color for a nickname, with fallback to default color

import type { Hero } from "../types/Hero";

/**
 * Gets the color for a nickname
 * @param playerName - The name of the player
 * @param hero - Current hero (for own nickname)
 * @param nickColor - Optional nickColor from API/other source
 * @returns Hex color string or default color
 */
export function getNickColor(
  playerName: string,
  hero: Hero | null,
  nickColor?: string
): string {
  // If nickColor is provided (from API), use it
  if (nickColor) {
    return nickColor;
  }

  // If it's the current player's own nickname, use hero.nickColor
  if (hero && (playerName === hero.name || playerName === hero.username)) {
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
 * @returns Style object with color property
 */
export function getNickColorStyle(
  playerName: string,
  hero: Hero | null,
  nickColor?: string
): React.CSSProperties {
  return {
    color: getNickColor(playerName, hero, nickColor),
  };
}
