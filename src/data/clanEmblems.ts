// Список емблем клану
export const CLAN_EMBLEMS = [
  "images__1_-removebg-preview.png",
  "images__2_-removebg-preview (1).png",
  "images__2_-removebg-preview.png",
  "images__3_-removebg-preview.png",
  "images__4_-removebg-preview.png",
  "images__5_-removebg-preview.png",
  "images__6_-removebg-preview.png",
  "images__7_-removebg-preview.png",
  "images__8_-removebg-preview.png",
  "images-removebg-preview (1).png",
  "images-removebg-preview.png",
];

export function getEmblemPath(emblem: string | null | undefined): string | null {
  if (!emblem) return null;
  return `/clans-emblems/${emblem}`;
}
