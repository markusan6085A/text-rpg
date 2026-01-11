export type SkillStat =
  | "pAtk"
  | "pDef"
  | "mAtk"
  | "mDef"
  | "maxHp"
  | "maxMp"
  | "maxCp"
  | "critRate"
  | "critDamage"
  | "cooldownReduction"
  | "skillCritRate"
  | "skillCritPower"
  | "physSkillPower"
  | "magicSkillPower"
  | "healPower"
  | "attackRange"
  | "accuracy"
  | "evasion"
  | "attackSpeed"
  | "atkSpeed"
  | "castSpeed"
  | "runSpeed"
  | "hpRegen"
  | "mpRegen"
  | "regMp" // MP regeneration (alternative name)
  | "cpRegen"
  | "mpConsumeRate" // MP consumption rate multiplier
  | "shieldBlockRate"
  | "shieldBlockPower"
  | "shieldDef" // Shield defense percentage
  | "sDef" // Shield defense (alternative name)
  | "rShld" // Shield block rate (alternative name)
  | "arrowDef" // Arrow defense percentage
  | "vampirism"
  | "reflect"
  | "reflectSkillPhysic"
  | "reflectSkillMagic"
  | "fireAttack"
  | "waterAttack"
  | "windAttack"
  | "earthAttack"
  | "holyAttack"
  | "darkAttack"
  | "fireResist"
  | "waterResist"
  | "windResist"
  | "earthResist"
  | "holyResist"
  | "darkResist"
  | "stunResist"
  | "stunVuln" // Stun vulnerability (inverse of stunResist)
  | "fearResist"
  | "sleepResist"
  | "holdResist"
  | "rootResist" // Alternative name for holdResist (root = hold/immobilize)
  | "bleedResist"
  | "poisonResist"
  | "shockResist"
  | "paralyzeResist"
  | "mentalResist"
  | "derangementResist" // Alternative name for mentalResist
  | "debuffResist"
  | "fallResist" // Resistance to fall damage
  | "darkVuln" // Dark attack vulnerability
  | "invulnerable"
  | "salvation"
  | "cancel" // Reduces chance of casting interruption
  | "cancelResist" // Reduces vulnerability to buff removal
  | "immobile" // Makes hero unable to move
  | "taunt" // Provokes enemies to attack only this hero (for online mode)
  | "skillMastery" // Skill mastery - chance to reuse skills without delay or double duration
  | "str" // Strength stat
  | "con" // Constitution stat
  | "dex" // Dexterity stat
  | "int" // Intelligence stat
  | "wit" // Wisdom stat
  | "men" // Mental stat
  | "sleep" // Sleep status effect
  | "breathGauge" // Breath/lung capacity
  | "hold" // Hold/immobilize status effect
  | "poison" // Poison damage over time effect
  | "bleed" // Bleed damage over time effect
  | "maxLoad"; // Maximum weight/inventory capacity
