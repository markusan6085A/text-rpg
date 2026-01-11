/**
 * Обчислює базові стати героя (STR, DEX, CON, INT, WIT, MEN)
 * на основі раси та класу
 */
import { getBaseStats } from "../../data/baseStatsTable";

// Маппінг англійських назв на російські для базових статів
function normalizeRaceAndClass(race: string, klass: string) {
  const raceMap: Record<string, string> = {
    "Human": "Человек",
    "Elf": "Эльф",
    "Dark Elf": "Темный Эльф",
    "Dwarf": "Гном",
    "Orc": "Орк",
  };
  
  const klassMap: Record<string, string> = {
    "Fighter": "Воин",
    "Mystic": "Маг",
  };
  
  const normalizedRace = raceMap[race] || race;
  let normalizedKlass = klassMap[klass] || klass;
  
  // Спеціальна обробка для Гнома
  if (normalizedRace === "Гном" && normalizedKlass === "Маг") {
    normalizedKlass = "Воин";
  }
  
  return { normalizedRace, normalizedKlass };
}

export function calcBaseStats(race: string, klass: string) {
  const { normalizedRace, normalizedKlass } = normalizeRaceAndClass(race, klass);
  return getBaseStats(normalizedRace, normalizedKlass) || { 
    STR: 10, DEX: 10, CON: 10, INT: 10, WIT: 10, MEN: 10 
  };
}

