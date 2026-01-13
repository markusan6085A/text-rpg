import { skill_0211 } from "./skill_0211";
import { skill_0260 } from "./skill_0260";
import { skill_1004 } from "./skill_1004";
import { skill_1008 } from "./skill_1008";
import { skill_1104 } from "./skill_1104";
import { skill_1108 } from "./skill_1108";
import { skill_1210 } from "./skill_1210";
import { skill_1213 } from "./skill_1213";
import { skill_1245 } from "./skill_1245";
import { skill_1246 } from "./skill_1246";
import { skill_1247 } from "./skill_1247";
import { skill_1248 } from "./skill_1248";
import { skill_1249 } from "./skill_1249";
import { skill_1250 } from "./skill_1250";
import { skill_1256 } from "./skill_1256";
import { skill_1260 } from "./skill_1260";
import { skill_1261 } from "./skill_1261";
import { skill_1283 } from "./skill_1283";

// Import skills from common and OrcShaman that Overlord also uses (with additional levels)
// These will be inherited from parent professions
import { skill_0141 } from "./skill_0141";
import { skill_0146 } from "./skill_0146";
import { skill_0231 } from "../common/skill_0231";
import { skill_0234 } from "../common/skill_0234";
import { skill_0236 } from "../common/skill_0236";
import { skill_1001 } from "../common/skill_1001";
import { skill_1007 } from "../common/skill_1007";
import { skill_1010 } from "../common/skill_1010";
import { skill_1090 } from "../common/skill_1090";
import { skill_1092 } from "../common/skill_1092";
import { skill_1095 } from "../common/skill_1095";
import { skill_1097 } from "../common/skill_1097";
import { skill_1100 } from "../common/skill_1100";

import type { SkillDefinition } from "../../../types";

export {
  skill_0211,
  skill_0260,
  skill_1004,
  skill_1008,
  skill_1104,
  skill_1108,
  skill_1210,
  skill_1213,
  skill_1245,
  skill_1246,
  skill_1247,
  skill_1248,
  skill_1249,
  skill_1250,
  skill_1256,
  skill_1260,
  skill_1261,
  skill_1283,
  // Inherited from common
  skill_0141,
  skill_0146,
  skill_0231,
  skill_0234,
  skill_0236,
  skill_1001,
  skill_1007,
  skill_1010,
  skill_1090,
  skill_1092,
  skill_1095,
  skill_1097,
  skill_1100,
};

const pickSkillDefs = (module: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(module).filter(
      ([, v]) => v && typeof v === "object" && "id" in v && "levels" in v
    )
  ) as Record<string, SkillDefinition>;

export const OverlordSkills = pickSkillDefs({
  skill_0211,
  skill_0260,
  skill_1004,
  skill_1008,
  skill_1104,
  skill_1108,
  skill_1210,
  skill_1213,
  skill_1245,
  skill_1246,
  skill_1247,
  skill_1248,
  skill_1249,
  skill_1250,
  skill_1256,
  skill_1260,
  skill_1261,
  skill_1283,
  // Inherited from common
  skill_0141,
  skill_0146,
  skill_0231,
  skill_0234,
  skill_0236,
  skill_1001,
  skill_1007,
  skill_1010,
  skill_1090,
  skill_1092,
  skill_1095,
  skill_1097,
  skill_1100,
});

