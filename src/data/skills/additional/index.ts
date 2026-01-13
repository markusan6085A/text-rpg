import type { SkillDefinition } from "../types";
import { skill_0130 } from "./skill_0130";
import { skill_0429 } from "./skill_0429";
import { skill_0401 } from "./skill_0401";
import { skill_0279 } from "./skill_0279"; // Added
import { skill_0481 } from "./skill_0481"; // Added
import { skill_0763 } from "./skill_0763"; // Added
import { skill_0794 } from "./skill_0794"; // Added
import { skill_6319 } from "./skill_6319"; // Added
import { skill_0820 } from "./skill_0820"; // Added
import { skill_9999 } from "./skill_9999"; // Added

// Додаткові скіли, доступні для всіх рас і класів за монети удачі
export const AdditionalSkills: Record<string, SkillDefinition> = {
  skill_0130, // Stone of Time
  skill_0429, // Stone Guardian
  skill_0401, // Rage of Battle
  skill_0279, // Crystal of Ice
  skill_0481, // Dark Resonance
  skill_0763, // Cry of Rage
  skill_0794, // Totem of Stone
  skill_6319, // Sacred Seal
  skill_0820, // Fist of Power
  skill_9999, // Holy Protection
};

// Експорт для зручності
export { skill_0130, skill_0429, skill_0401, skill_0279, skill_0481, skill_0763, skill_0794, skill_6319, skill_0820, skill_9999 };

