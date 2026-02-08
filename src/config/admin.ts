/**
 * Адмінка доступна тільки персонажу з ніком "Existence" (не логін admin).
 */
export const ADMIN_CHARACTER_NAME = "Existence";

export function isAdminCharacter(characterName: string | undefined | null): boolean {
  return characterName?.trim() === ADMIN_CHARACTER_NAME;
}
