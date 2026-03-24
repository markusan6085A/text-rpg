/**
 * Адмінка доступна тільки персонажу з ніком "Existence" (не логін admin).
 */
export const ADMIN_CHARACTER_NAME = "Existence";

export function isAdminCharacter(characterName: string | undefined | null): boolean {
  return characterName?.trim() === ADMIN_CHARACTER_NAME;
}

/** Голубий текст для полів вводу та власних повідомлень адміна (Existence) у чаті, форумі, клані тощо */
export const ADMIN_OWN_WRITE_TEXT_COLOR = "#7ec8e8";

/** Inline-стиль кольору тексту, якщо залогінений персонаж — адмін (Existence). */
export function adminOwnWriteTextStyle(heroName: string | undefined | null): { color: string } | undefined {
  return isAdminCharacter(heroName) ? { color: ADMIN_OWN_WRITE_TEXT_COLOR } : undefined;
}
