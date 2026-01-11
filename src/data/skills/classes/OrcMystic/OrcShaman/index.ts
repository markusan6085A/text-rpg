import { skill_0100 } from "./skill_0100";
import { skill_0141 } from "./skill_0141";
import { skill_0146 } from "./skill_0146";
import { skill_0164 } from "./skill_0164";
import { skill_0212 } from "./skill_0212";
import { skill_0213 } from "./skill_0213";
import { skill_0228 } from "./skill_0228";
import { skill_0229 } from "./skill_0229";
import { skill_0231 } from "./skill_0231";
import { skill_0234 } from "./skill_0234";
import { skill_0236 } from "./skill_0236";
import { skill_1001 } from "./skill_1001";
import { skill_1002 } from "./skill_1002";
import { skill_1003 } from "./skill_1003";
import { skill_1005 } from "./skill_1005";
import { skill_1006 } from "./skill_1006";
import { skill_1007 } from "./skill_1007";
import { skill_1009 } from "./skill_1009";
import { skill_1010 } from "./skill_1010";
import { skill_1090 } from "./skill_1090";
import { skill_1092 } from "./skill_1092";
import { skill_1095 } from "./skill_1095";
import { skill_1096 } from "./skill_1096";
import { skill_1097 } from "./skill_1097";
import { skill_1099 } from "./skill_1099";
import { skill_1101 } from "./skill_1101";
import { skill_1102 } from "./skill_1102";
import { skill_1105 } from "./skill_1105";
import { skill_1107 } from "./skill_1107";
import { skill_1208 } from "./skill_1208";
import { skill_1209 } from "./skill_1209";
import type { SkillDefinition } from "../../../types";

export {
  skill_0100,
  skill_0141,
  skill_0146,
  skill_0164,
  skill_0212,
  skill_0213,
  skill_0228,
  skill_0229,
  skill_0231,
  skill_0234,
  skill_0236,
  skill_1001,
  skill_1002,
  skill_1003,
  skill_1005,
  skill_1006,
  skill_1007,
  skill_1009,
  skill_1010,
  skill_1090,
  skill_1092,
  skill_1095,
  skill_1096,
  skill_1097,
  skill_1099,
  skill_1101,
  skill_1102,
  skill_1105,
  skill_1107,
  skill_1208,
  skill_1209,
};

const pickSkillDefs = (module: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(module).filter(
      ([, v]) => v && typeof v === "object" && "id" in v && "levels" in v
    )
  ) as Record<string, SkillDefinition>;

export const OrcShamanSkills = pickSkillDefs({
  skill_0100,
  skill_0141,
  skill_0146,
  skill_0164,
  skill_0212,
  skill_0213,
  skill_0228,
  skill_0229,
  skill_0231,
  skill_0234,
  skill_0236,
  skill_1001,
  skill_1002,
  skill_1003,
  skill_1005,
  skill_1006,
  skill_1007,
  skill_1009,
  skill_1010,
  skill_1090,
  skill_1092,
  skill_1095,
  skill_1096,
  skill_1097,
  skill_1099,
  skill_1101,
  skill_1102,
  skill_1105,
  skill_1107,
  skill_1208,
  skill_1209,
});

