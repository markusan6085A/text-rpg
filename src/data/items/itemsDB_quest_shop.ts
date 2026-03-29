// src/data/items/itemsDB_quest_shop.ts
// Предмети квест-шопу (Тату, Пояс, Плащ) та краски (Greater Dye) — мають бути в itemsDB

import type { ItemDefinition } from './itemsDB.types';

export const itemsDBQuestShop: Record<string, ItemDefinition> = {
  // Greater Dye (+4/-4) — купуються в GM-шопі за 1 AA, 1 краска для нанесення
  dye_str_con: { id: "dye_str_con", name: "Greater Dye (STR +4 CON -4)", kind: "consumable", slot: "consumable", icon: "/items/drops/resources/str.png", description: "Більше атаки, але менше HP/CP", grade: "S" },
  dye_str_dex: { id: "dye_str_dex", name: "Greater Dye (STR +4 DEX -4)", kind: "consumable", slot: "consumable", icon: "/items/drops/resources/str.png", description: "Більше атаки, але повільніші удари та біг", grade: "S" },
  dye_dex_str: { id: "dye_dex_str", name: "Greater Dye (DEX +4 STR -4)", kind: "consumable", slot: "consumable", icon: "/items/drops/resources/dye-dex.png", description: "Швидші удари/крити, але менша сила атаки", grade: "S" },
  dye_dex_con: { id: "dye_dex_con", name: "Greater Dye (DEX +4 CON -4)", kind: "consumable", slot: "consumable", icon: "/items/drops/resources/dye-dex.png", description: "Швидші удари/крити, але менше HP/CP", grade: "S" },
  dye_con_str: { id: "dye_con_str", name: "Greater Dye (CON +4 STR -4)", kind: "consumable", slot: "consumable", icon: "/items/drops/resources/dye-con.png", description: "Більше витривалості/HP, але менше атаки", grade: "S" },
  dye_con_dex: { id: "dye_con_dex", name: "Greater Dye (CON +4 DEX -4)", kind: "consumable", slot: "consumable", icon: "/items/drops/resources/dye-con.png", description: "Більше витривалості/HP, але менша швидкість", grade: "S" },
  dye_int_men: { id: "dye_int_men", name: "Greater Dye (INT +4 MEN -4)", kind: "consumable", slot: "consumable", icon: "/items/drops/resources/int.png", description: "Максимальна маг. атака, менше MP/M.Def", grade: "S" },
  dye_int_wit: { id: "dye_int_wit", name: "Greater Dye (INT +4 WIT -4)", kind: "consumable", slot: "consumable", icon: "/items/drops/resources/int.png", description: "Сильніша магія, але дуже повільний каст", grade: "S" },
  dye_wit_men: { id: "dye_wit_men", name: "Greater Dye (WIT +4 MEN -4)", kind: "consumable", slot: "consumable", icon: "/items/drops/resources/wit.png", description: "Швидкий каст, менше MP/M.Def", grade: "S" },
  dye_wit_int: { id: "dye_wit_int", name: "Greater Dye (WIT +4 INT -4)", kind: "consumable", slot: "consumable", icon: "/items/drops/resources/wit.png", description: "Швидкий каст, але слабша магія", grade: "S" },
  tattoo_magic: {
    id: "tattoo_magic",
    name: "Тату Магії",
    kind: "tattoo",
    slot: "tattoo",
    icon: "/items/drops/item/r85_talisman_ma_up_passive_0.jpg",
    description: "Магічне тату, що збільшує швидкість каста на 50 та магічний урон на 50.",
    grade: "D",
  },
  tattoo_physical: {
    id: "tattoo_physical",
    name: "Тату Фізики",
    kind: "tattoo",
    slot: "tattoo",
    icon: "/items/drops/item/r85_talisman_pa_up_active_0.jpg",
    description: "Фізичне тату, що збільшує швидкість атаки на 50 та фізичний урон на 50.",
    grade: "D",
  },
  tattoo_defense: {
    id: "tattoo_defense",
    name: "Тату Захисту",
    kind: "tattoo",
    slot: "tattoo",
    icon: "/items/drops/item/r85_talisman_pd_up_active_0.jpg",
    description: "Захисне тату, що збільшує фізичний та магічний захист на 50, а також максимальне HP на 150.",
    grade: "D",
  },
  tattoo_gludio_ruins_cr_passive: {
    id: "tattoo_gludio_ruins_cr_passive",
    name: "Тату стійкості руїн",
    kind: "tattoo",
    slot: "tattoo",
    icon: "/items/drops/item/R_talisman_cr_up_active_0.jpg",
    description:
      "Нагорода за квест у руїнах Глудіо (D-grade, з 20 рів.): +50 фіз. захисту, +50 маг. захисту, +300 HP, +100 MP.",
    grade: "D",
    stats: { pDef: 50, mDef: 50, maxHp: 300, maxMp: 100 },
    stackable: false,
  },
  quest_belt: {
    id: "quest_belt",
    name: "Пояс Захисту",
    kind: "armor",
    slot: "belt",
    icon: "/items/drops/item/armor_belt_i02_0.jpg",
    description: "Міцний пояс, що збільшує максимальне HP на 5%.",
    grade: "D",
    stats: { pDef: 25, mDef: 25, maxHpPercent: 5 },
  },
  quest_cloak: {
    id: "quest_cloak",
    name: "Плащ Добра",
    kind: "armor",
    slot: "cloak",
    icon: "/items/drops/item/Amor_goodness_cloak_0.jpg",
    description: "Плащ, що збільшує фізичний та магічний захист на 5%, а також максимальне HP на 100.",
    grade: "D",
    stats: { pDef: 30, mDef: 30, pDefPercent: 5, mDefPercent: 5 },
  },
  /** Ключ вора (Unlock / Treasure Hunter). L2 item id 1661 — у грі предмет за string id. */
  thief_key: {
    id: "thief_key",
    name: "Thief Key",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg",
    description: "Ключ вора. Витрачається при використанні навички Unlock.",
    grade: "D",
    stackable: true,
  },
  /** Епік-дроп Orfen (L2 item id 6661). Другий екземпляр у парі сережок не дає пасивні від equipment (див. calcCombatStats / calcResources). */
  earring_of_orfen: {
    id: "earring_of_orfen",
    name: "Earring of Orfen",
    kind: "earring",
    slot: "rear;lear",
    icon: "/items/drops/earring-orfen.png",
    description:
      "Трофей з Моря спор: насичено-блакитний камінь, ніби крапля застиглої отрути найчистішого шматку. За легендами Орфен випестувала його з роси грибів-паразитів. Дарує міцний магічний оберіг (M.Def +71, Max MP +31), стійкість до кровотечі та люті клинків (+20% до шансу накласти bleed на ціль від ваших скілів із bleed), відчуття, ніжніше відновлення життя (+6% до HP від зцілення і банок), і легку економію польоту мани (−5% витрат MP на активні скіли). Як у L2: дві такі сережки не подвоюють ці пасиви.",
    grade: "B",
    stackable: false,
    stats: {
      mDef: 71,
      maxMp: 31,
      bleedResist: 20,
      bleedChanceBonus: 20,
      healReceivedBonus: 6,
      mpSkillCostReduction: 5,
    },
  },
  /** Епік-дроп Queen Ant (L2 item id 6660). */
  ring_of_queen_ant: {
    id: "ring_of_queen_ant",
    name: "Ring of Queen Ant",
    kind: "ring",
    slot: "rfinger;lfinger",
    icon: "/items/drops/ring-of-queen-ant.png",
    description:
      "Легендарна печатка матері-рою: у центрі — крапля янтарної смоли, ніби застиглої крові солдатів-мурах, по ободу — ледь помітний візерунок лапок і корони. Носій відчуває холодок на шкірі, ніби зверху дивиться тисячі чорних очей. Трофей епік-рейду: міцний магічний оберіг (M.Def +40, Max MP +46), ріже повітря точніше (+2 Accuracy), крит б’є глибше (сила криту ~+15%), а отрута й окови ворога липнуть рідше, а ваші — проникають міцніше (+30% до стійкості та шансів отрути/утримання). Як у класичному L2: друге таке кільце не подвоює пасиви — плека лише одну Королеву.",
    grade: "B",
    stackable: false,
    stats: {
      mDef: 40,
      maxMp: 46,
      accuracy: 2,
      /** ~+15% до множника кріт-удару (див. getCritMultiplier: +450 ≈ +0.15 до множника) */
      critPower: 450,
      poisonResist: 30,
      holdResist: 30,
      poisonChanceBonus: 30,
      holdChanceBonus: 30,
    },
  },
};
