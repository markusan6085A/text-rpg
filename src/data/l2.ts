// src/data/l2.ts
export type Race =
  | "Human"
  | "Elf"
  | "Dark Elf"
  | "Orc"
  | "Dwarf"
  | "Kamael";

export type Klass =
  | "Human Fighter"
  | "Human Mage"
  | "Elven Fighter"
  | "Elven Mage"
  | "Dark Fighter"
  | "Dark Mage"
  | "Orc Fighter"
  | "Orc Shaman"
  | "Dwarven Fighter"
  | "Kamael Soldier (M)"
  | "Kamael Soldier (F)";

// Базові стартові класи як у Lineage II (перші профи)
export const CLASSES_BY_RACE: Record<Race, Klass[]> = {
  Human: ["Human Fighter", "Human Mage"],
  Elf: ["Elven Fighter", "Elven Mage"],
  "Dark Elf": ["Dark Fighter", "Dark Mage"],
  Orc: ["Orc Fighter", "Orc Shaman"],
  Dwarf: ["Dwarven Fighter"],
  Kamael: ["Kamael Soldier (M)", "Kamael Soldier (F)"],
};

export const RACES: Race[] = [
  "Human",
  "Elf",
  "Dark Elf",
  "Orc",
  "Dwarf",
  "Kamael",
];
