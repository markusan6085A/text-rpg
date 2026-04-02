// Епічні / гранд-рейд боси з оф. XML (npc 29056, 29060, 29062, 29065, 29095, 29096 у tools/htmlскіли/моби!/29000-29999.xml).
// Шанси дропу — chance як chancePerMillion (як у L2 droplist). Стати HP/атака в коді — підігнані під економіку text-rpg (tier як Valakas/Zaken).

import type { RaidBoss } from "../../bosses/floran_overlord";
import type { DropEntry } from "../../combat/types";
import { l2ItemIdToString } from "./droplistMapping";

const EPIC_RESPAWN_SEC = 12 * 60 * 60;

function xmlDrop(itemid: number, min: number, max: number, chance: number): DropEntry {
  if (itemid === 57) {
    return {
      id: "adena",
      kind: "adena",
      chance: 0,
      min,
      max,
      chancePerMillion: chance,
    };
  }
  const sid = l2ItemIdToString(itemid);
  if (sid) {
    return {
      id: sid,
      kind: "resource",
      chance: 0,
      min,
      max,
      chancePerMillion: chance,
      l2ItemId: itemid,
    };
  }
  return {
    id: `l2item_${itemid}`,
    kind: "equipment",
    chance: 0,
    min,
    max,
    chancePerMillion: chance,
    l2ItemId: itemid,
  };
}

/** Ice Fairy Sirra — npc 29056 */
const SIRRA_DROPS: DropEntry[] = [
  xmlDrop(110, 1, 1, 35857),
  xmlDrop(2416, 1, 1, 25041),
  xmlDrop(2417, 1, 1, 25041),
  xmlDrop(4077, 40, 120, 85189),
  xmlDrop(4088, 9, 27, 318088),
  xmlDrop(4089, 14, 42, 204485),
  xmlDrop(171, 1, 1, 2082),
  xmlDrop(175, 1, 1, 2082),
  xmlDrop(210, 1, 1, 2082),
  xmlDrop(4116, 3, 9, 99303),
  xmlDrop(4117, 4, 10, 85117),
  xmlDrop(4118, 4, 12, 70562),
  xmlDrop(7893, 1, 1, 2082),
  xmlDrop(7901, 1, 1, 2082),
  xmlDrop(8340, 36, 108, 39453),
  xmlDrop(8348, 8, 22, 189375),
  xmlDrop(8180, 1, 1, 200000),
  xmlDrop(1343, 100, 200, 350689),
];

/** Captain of the Ice Queen's Royal Guard — npc 29060 */
const CAPTAIN_ICE_GUARD_DROPS: DropEntry[] = [
  xmlDrop(2391, 1, 1, 13946),
  xmlDrop(2392, 1, 1, 13946),
  xmlDrop(4082, 4, 12, 347671),
  xmlDrop(4083, 8, 22, 185424),
  xmlDrop(287, 1, 1, 11274),
  xmlDrop(4121, 3, 9, 536009),
  xmlDrop(4616, 1, 3, 220057),
  xmlDrop(4617, 2, 4, 146705),
  xmlDrop(4618, 1, 1, 440115),
];

/** Andreas Van Halter — npc 29062 */
const ANDREAS_VAN_HALTER_DROPS: DropEntry[] = [
  xmlDrop(6684, 1, 1, 17056),
  xmlDrop(6711, 12, 36, 306342),
  xmlDrop(7575, 1, 1, 10504),
  xmlDrop(7579, 12, 36, 233504),
  xmlDrop(959, 1, 1, 32009),
  xmlDrop(960, 1, 1, 320095),
  xmlDrop(6577, 1, 1, 5335),
  xmlDrop(8921, 1, 1, 320095),
];

/** Sailren — npc 29065 */
const SAILREN_DROPS: DropEntry[] = [
  xmlDrop(6680, 1, 1, 7303),
  xmlDrop(6707, 3, 9, 524645),
  xmlDrop(6367, 1, 1, 4497),
  xmlDrop(6691, 3, 9, 395312),
  xmlDrop(959, 1, 1, 18273),
  xmlDrop(960, 1, 1, 182734),
  xmlDrop(6577, 1, 1, 3046),
];

/** Gordon — npc 29095 */
const GORDON_DROPS: DropEntry[] = [
  xmlDrop(6371, 1, 1, 23810),
  xmlDrop(6684, 1, 1, 71428),
  xmlDrop(6711, 15, 29, 700000),
  xmlDrop(6695, 3, 9, 930000),
  xmlDrop(960, 1, 1, 450000),
];

/** Anais — npc 29096 (Lord of Splendor) */
const ANAIS_DROPS: DropEntry[] = [
  xmlDrop(6674, 1, 1, 8022),
  xmlDrop(6675, 1, 1, 12803),
  xmlDrop(6701, 8, 22, 203579),
  xmlDrop(6702, 4, 12, 491363),
  xmlDrop(6370, 1, 1, 8120),
  xmlDrop(6694, 3, 9, 726675),
  xmlDrop(959, 1, 1, 24745),
  xmlDrop(960, 1, 1, 247447),
  xmlDrop(6577, 1, 1, 4124),
  xmlDrop(8920, 1, 1, 247447),
];

export const XML_GRAND_RAID_BOSS_EPICS: RaidBoss[] = [
  {
    id: "rb_epic_l2_ice_fairy_sirra",
    name: "Raid Boss: Ice Fairy Sirra",
    lore:
      "Крижана фея Сірра з легенд Фреї (Freya) — вершина інстансу крижаної королеви за даними L2 XML (npc 29056). Володарка крижаного клану, що зустрічає загарбників морозом і нагороджує тих, хто виживає.",
    level: 60,
    hp: 450000,
    mp: 0,
    pAtk: 2000,
    mAtk: 900,
    pDef: 720,
    mDef: 500,
    exp: 300000,
    sp: 16000,
    adenaMin: 110000,
    adenaMax: 170000,
    dropChance: 1,
    drops: [...SIRRA_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    respawnTime: EPIC_RESPAWN_SEC,
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_schuttgart_02",
  },
  {
    id: "rb_epic_l2_captain_ice_queen_guard",
    name: "Raid Boss: Captain of the Ice Queen's Royal Guard",
    lore:
      "Капітан королівської варти Льодяної королеви (npc 29060) — другий стовп крижаного рейду в класичному L2.",
    level: 59,
    hp: 430000,
    mp: 0,
    pAtk: 1900,
    mAtk: 850,
    pDef: 700,
    mDef: 480,
    exp: 285000,
    sp: 15200,
    adenaMin: 105000,
    adenaMax: 162000,
    dropChance: 1,
    drops: [...CAPTAIN_ICE_GUARD_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    respawnTime: EPIC_RESPAWN_SEC,
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_schuttgart_02",
  },
  {
    id: "rb_epic_l2_andreas_van_halter",
    name: "Raid Boss: Andreas Van Halter",
    lore:
      "Андреас фон Гальтер (Seer of Pagan) — верховний ворог фанатиків Пагана в класичному світі Lineage II.",
    level: 87,
    hp: 1080000,
    mp: 0,
    pAtk: 4600,
    mAtk: 1900,
    pDef: 1280,
    mDef: 880,
    exp: 900000,
    sp: 50000,
    adenaMin: 490000,
    adenaMax: 760000,
    dropChance: 1,
    drops: [...ANDREAS_VAN_HALTER_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    respawnTime: EPIC_RESPAWN_SEC,
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_schuttgart_09",
  },
  {
    id: "rb_epic_l2_sailren",
    name: "Grand Boss: Sailren",
    lore:
      "Сайлрен (Sealed Evil Power) — гранд-бос класичного L2: розкрита зла сила в храмі Ельморедена.",
    level: 87,
    hp: 1020000,
    mp: 0,
    pAtk: 4500,
    mAtk: 2000,
    pDef: 1200,
    mDef: 880,
    exp: 880000,
    sp: 49000,
    adenaMin: 480000,
    adenaMax: 740000,
    dropChance: 1,
    drops: [...SAILREN_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    respawnTime: EPIC_RESPAWN_SEC,
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_schuttgart_10",
  },
  {
    id: "rb_epic_l2_gordon",
    name: "Raid Boss: Gordon",
    lore:
      "Гордон, лицар руйнування (Knight of Destruction), npc 29095 — рейд-бос з ритуальних земель Тріола за лором High Five.",
    level: 87,
    hp: 1050000,
    mp: 0,
    pAtk: 4800,
    mAtk: 2400,
    pDef: 1250,
    mDef: 880,
    exp: 910000,
    sp: 50500,
    adenaMin: 495000,
    adenaMax: 765000,
    dropChance: 1,
    drops: [...GORDON_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    respawnTime: EPIC_RESPAWN_SEC,
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_schuttgart_08",
  },
  {
    id: "rb_epic_l2_anais",
    name: "Raid Boss: Anais",
    lore:
      "Анаїс (Lord of Splendor), npc 29096 — володар сяйва, кінцевий ворог лінії Splendor/Solina у класичному L2; у XML type Monster, дроп рейдового рівня збережено.",
    level: 87,
    hp: 1000000,
    mp: 0,
    pAtk: 4700,
    mAtk: 2200,
    pDef: 1240,
    mDef: 880,
    exp: 895000,
    sp: 49800,
    adenaMin: 488000,
    adenaMax: 752000,
    dropChance: 1,
    drops: [...ANAIS_DROPS],
    isRaidBoss: true,
    isEpicRaidBoss: true,
    respawnTime: EPIC_RESPAWN_SEC,
    dropProfileId: "rb_l2dop_aden_drop",
    aiProfileId: "rb_floran_ai",
    zoneId: "l2dop_schuttgart_07",
  },
];
