// src/data/items/itemsDB_quest_shop.ts
// Предмети квест-шопу (Тату, Пояс, Плащ) — мають бути в itemsDB для покупки та розрахунку статів/бафів

import type { ItemDefinition } from './itemsDB.types';

export const itemsDBQuestShop: Record<string, ItemDefinition> = {
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
};
