import * as common from "./common";
import * as Assasin from "./Assasin";
import * as PhantomRanger from "./PhantomRanger";
import * as GhostSentinel from "./GhostSentinel";
import * as PalusKnight from "./PalusKnight";
import * as ShillienKnight from "./ShillienKnight";
import * as ShillienTemplar from "./ShillienTemplar";
import * as Bladedancer from "./Bladedancer";
import * as SpectralDancer from "./SpectralDancer";
import type { SkillDefinition } from "../../types";

const pickSkillDefs = (module: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(module).filter(
      ([, v]) => v && typeof v === "object" && "id" in v && "levels" in v
    )
  ) as Record<string, SkillDefinition>;

// Базові скіли (до 20 лвл) - тільки common
export const DarkFighterSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(common),
};

// Окремі модулі для професій (тільки скіли цієї професії, без базових)
export const DarkFighterAssasinSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Assasin),
};

export const DarkFighterPhantomRangerSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(PhantomRanger),
};

export const DarkFighterGhostSentinelSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(GhostSentinel),
};

export const DarkFighterPalusKnightSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(PalusKnight),
};

export const DarkFighterShillienKnightSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(ShillienKnight),
};

export const DarkFighterShillienTemplarSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(ShillienTemplar),
};

export const DarkFighterBladedancerSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(Bladedancer),
};

export const DarkFighterSpectralDancerSkills: Record<string, SkillDefinition> = {
  ...pickSkillDefs(SpectralDancer),
};

