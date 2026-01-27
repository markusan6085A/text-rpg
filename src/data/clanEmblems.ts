// Список емблем клану
export const CLAN_EMBLEMS: string[] = [];

export function getEmblemPath(emblem: string | null | undefined): string | null {
  if (!emblem) return null;
  return `/clans-emblems/${emblem}`;
}
