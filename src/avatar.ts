// src/avatar.ts
export type Race =
  | "human"
  | "elf"
  | "darkelf"
  | "orc"
  | "dwarf";

export type Gender = "male" | "female";

// Повертає шлях до картинки з папки public/characters
export function getAvatarSrc(race: Race, gender: Gender) {
  return `/characters/${race}_${gender}.png`;
}
