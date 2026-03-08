// src/data/items/itemsDB_crystals.ts
// Кристали для зброї C–S грейду (купуються в GM-шопі)

import type { ItemDefinition } from "./itemsDB.types";

export const itemsDBCrystals: Record<string, ItemDefinition> = {
  // ===== КРИСТАЛИ (bead іконки) =====
  crystal_c: {
    id: "crystal_c",
    name: "Кристал (C)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_bead_green_i00_0.jpg",
    description: "Кристал душі C-грейду. Вставляється в зброю C-грейду.",
    grade: "C",
    stats: {},
  },
  crystal_b: {
    id: "crystal_b",
    name: "Кристал (B)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_bead_red_i00_0.jpg",
    description: "Кристал душі B-грейду. Вставляється в зброю B-грейду.",
    grade: "B",
    stats: {},
  },
  crystal_a: {
    id: "crystal_a",
    name: "Кристал (A)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_bead_silver_i00_0.jpg",
    description: "Кристал душі A-грейду. Вставляється в зброю A-грейду.",
    grade: "A",
    stats: {},
  },
  crystal_s: {
    id: "crystal_s",
    name: "Кристал (S)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_bead_white_i00_0.jpg",
    description: "Кристал душі S-грейду. Вставляється в зброю S-грейду.",
    grade: "S",
    stats: {},
  },

  // ===== LS (Lucky Strike) — mineral іконки =====
  crystal_lucky_strike_c: {
    id: "crystal_lucky_strike_c",
    name: "Кристал Удачі (C)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg",
    description: "Кристал душі C-грейду. Вставляється в зброю C-грейду. Збільшує шанс критичного удару на 2%.",
    grade: "C",
    stats: { luckyStrike: 2 },
  },

  // ===== B-GRADE LS КРИСТАЛИ =====
  crystal_lucky_strike_b: {
    id: "crystal_lucky_strike_b",
    name: "Кристал Удачі (B)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg",
    description: "Кристал душі B-грейду. Вставляється в зброю B-грейду. Збільшує шанс критичного удару на 3%.",
    grade: "B",
    stats: { luckyStrike: 3 },
  },

  // ===== A-GRADE LS КРИСТАЛИ =====
  crystal_lucky_strike_a: {
    id: "crystal_lucky_strike_a",
    name: "Кристал Удачі (A)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg",
    description: "Кристал душі A-грейду. Вставляється в зброю A-грейду. Збільшує шанс критичного удару на 4%.",
    grade: "A",
    stats: { luckyStrike: 4 },
  },

  crystal_lucky_strike_s: {
    id: "crystal_lucky_strike_s",
    name: "Кристал Удачі (S)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg",
    description: "Збільшує шанс криту на 5%.",
    grade: "S",
    stats: { luckyStrike: 5 },
  },

  // ===== 2. FOCUS — зменшення перезарядки скілів =====
  crystal_focus_c: { id: "crystal_focus_c", name: "Кристал Фокусу (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Зменшує перезарядку скілів на 2%.", grade: "C", stats: { focus: 2 } },
  crystal_focus_b: { id: "crystal_focus_b", name: "Кристал Фокусу (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Зменшує перезарядку скілів на 3%.", grade: "B", stats: { focus: 3 } },
  crystal_focus_a: { id: "crystal_focus_a", name: "Кристал Фокусу (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Зменшує перезарядку скілів на 4%.", grade: "A", stats: { focus: 4 } },
  crystal_focus_s: { id: "crystal_focus_s", name: "Кристал Фокусу (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Зменшує перезарядку скілів на 5%.", grade: "S", stats: { focus: 5 } },

  // ===== 3. HEALTH (Life Steal) — поглинання HP =====
  crystal_health_c: { id: "crystal_health_c", name: "Кристал Здоров'я (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Шанс 2% поглинути HP від урону.", grade: "C", stats: { lifeSteal: 2 } },
  crystal_health_b: { id: "crystal_health_b", name: "Кристал Здоров'я (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Шанс 3% поглинути HP від урону.", grade: "B", stats: { lifeSteal: 3 } },
  crystal_health_a: { id: "crystal_health_a", name: "Кристал Здоров'я (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Шанс 4% поглинути HP від урону.", grade: "A", stats: { lifeSteal: 4 } },
  crystal_health_s: { id: "crystal_health_s", name: "Кристал Здоров'я (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Шанс 5% поглинути HP від урону.", grade: "S", stats: { lifeSteal: 5 } },

  // ===== 4. GUIDANCE — зменшення MP скілів =====
  crystal_guidance_c: { id: "crystal_guidance_c", name: "Кристал Наведення (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Зменшує витрату MP скілів на 2%.", grade: "C", stats: { guidance: 2 } },
  crystal_guidance_b: { id: "crystal_guidance_b", name: "Кристал Наведення (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Зменшує витрату MP скілів на 3%.", grade: "B", stats: { guidance: 3 } },
  crystal_guidance_a: { id: "crystal_guidance_a", name: "Кристал Наведення (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Зменшує витрату MP скілів на 4%.", grade: "A", stats: { guidance: 4 } },
  crystal_guidance_s: { id: "crystal_guidance_s", name: "Кристал Наведення (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Зменшує витрату MP скілів на 5%.", grade: "S", stats: { guidance: 5 } },

  // ===== 5. EMPOWER — сила скілів =====
  crystal_empower_c: { id: "crystal_empower_c", name: "Кристал Потужності (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Збільшує урон скілів на 2%.", grade: "C", stats: { empower: 2 } },
  crystal_empower_b: { id: "crystal_empower_b", name: "Кристал Потужності (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Збільшує урон скілів на 3%.", grade: "B", stats: { empower: 3 } },
  crystal_empower_a: { id: "crystal_empower_a", name: "Кристал Потужності (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Збільшує урон скілів на 4%.", grade: "A", stats: { empower: 4 } },
  crystal_empower_s: { id: "crystal_empower_s", name: "Кристал Потужності (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Збільшує урон скілів на 5%.", grade: "S", stats: { empower: 5 } },

  // ===== 6. ACUMEN — швидкість касту =====
  crystal_acumen_c: { id: "crystal_acumen_c", name: "Кристал Спритності (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Збільшує швидкість касту на 2%.", grade: "C", stats: { acumen: 2 } },
  crystal_acumen_b: { id: "crystal_acumen_b", name: "Кристал Спритності (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Збільшує швидкість касту на 3%.", grade: "B", stats: { acumen: 3 } },
  crystal_acumen_a: { id: "crystal_acumen_a", name: "Кристал Спритності (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Збільшує швидкість касту на 4%.", grade: "A", stats: { acumen: 4 } },
  crystal_acumen_s: { id: "crystal_acumen_s", name: "Кристал Спритності (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Збільшує швидкість касту на 5%.", grade: "S", stats: { acumen: 5 } },

  // ===== 7. ANGER — сила криту =====
  crystal_anger_c: { id: "crystal_anger_c", name: "Кристал Гніву (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Збільшує урон криту на 10%.", grade: "C", stats: { anger: 10 } },
  crystal_anger_b: { id: "crystal_anger_b", name: "Кристал Гніву (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Збільшує урон криту на 15%.", grade: "B", stats: { anger: 15 } },
  crystal_anger_a: { id: "crystal_anger_a", name: "Кристал Гніву (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Збільшує урон криту на 20%.", grade: "A", stats: { anger: 20 } },
  crystal_anger_s: { id: "crystal_anger_s", name: "Кристал Гніву (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Збільшує урон криту на 25%.", grade: "S", stats: { anger: 25 } },

  // ===== 8. MAGIC PARRY — опір магії =====
  crystal_magic_parry_c: { id: "crystal_magic_parry_c", name: "Кристал Відбиття Магії (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Шанс 2% відбити магічну атаку.", grade: "C", stats: { magicParry: 2 } },
  crystal_magic_parry_b: { id: "crystal_magic_parry_b", name: "Кристал Відбиття Магії (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Шанс 3% відбити магічну атаку.", grade: "B", stats: { magicParry: 3 } },
  crystal_magic_parry_a: { id: "crystal_magic_parry_a", name: "Кристал Відбиття Магії (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Шанс 4% відбити магічну атаку.", grade: "A", stats: { magicParry: 4 } },
  crystal_magic_parry_s: { id: "crystal_magic_parry_s", name: "Кристал Відбиття Магії (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Шанс 5% відбити магічну атаку.", grade: "S", stats: { magicParry: 5 } },

  // ===== 9. RSK. FOCUS — шанс не витратити MP =====
  crystal_rsk_focus_c: { id: "crystal_rsk_focus_c", name: "Кристал Рск. Фокус (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Шанс 2% не витратити MP скілу.", grade: "C", stats: { rskFocus: 2 } },
  crystal_rsk_focus_b: { id: "crystal_rsk_focus_b", name: "Кристал Рск. Фокус (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Шанс 3% не витратити MP скілу.", grade: "B", stats: { rskFocus: 3 } },
  crystal_rsk_focus_a: { id: "crystal_rsk_focus_a", name: "Кристал Рск. Фокус (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Шанс 4% не витратити MP скілу.", grade: "A", stats: { rskFocus: 4 } },
  crystal_rsk_focus_s: { id: "crystal_rsk_focus_s", name: "Кристал Рск. Фокус (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Шанс 5% не витратити MP скілу.", grade: "S", stats: { rskFocus: 5 } },

  // ===== 10. RSK. EVASION — шанс уникнути =====
  crystal_rsk_evasion_c: { id: "crystal_rsk_evasion_c", name: "Кристал Рск. Уникнення (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Шанс 2% уникнути атаку.", grade: "C", stats: { rskEvasion: 2 } },
  crystal_rsk_evasion_b: { id: "crystal_rsk_evasion_b", name: "Кристал Рск. Уникнення (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Шанс 3% уникнути атаку.", grade: "B", stats: { rskEvasion: 3 } },
  crystal_rsk_evasion_a: { id: "crystal_rsk_evasion_a", name: "Кристал Рск. Уникнення (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Шанс 4% уникнути атаку.", grade: "A", stats: { rskEvasion: 4 } },
  crystal_rsk_evasion_s: { id: "crystal_rsk_evasion_s", name: "Кристал Рск. Уникнення (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Шанс 5% уникнути атаку.", grade: "S", stats: { rskEvasion: 5 } },

  // ===== 11. RSK. HASTE — миттєвий скіл =====
  crystal_rsk_haste_c: { id: "crystal_rsk_haste_c", name: "Кристал Рск. Швидкість (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Шанс 2% миттєво відновити скіл.", grade: "C", stats: { rskHaste: 2 } },
  crystal_rsk_haste_b: { id: "crystal_rsk_haste_b", name: "Кристал Рск. Швидкість (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Шанс 3% миттєво відновити скіл.", grade: "B", stats: { rskHaste: 3 } },
  crystal_rsk_haste_a: { id: "crystal_rsk_haste_a", name: "Кристал Рск. Швидкість (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Шанс 4% миттєво відновити скіл.", grade: "A", stats: { rskHaste: 4 } },
  crystal_rsk_haste_s: { id: "crystal_rsk_haste_s", name: "Кристал Рск. Швидкість (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Шанс 5% миттєво відновити скіл.", grade: "S", stats: { rskHaste: 5 } },

  // ===== 12. BACKBITING — урон у спину =====
  crystal_backbiting_c: { id: "crystal_backbiting_c", name: "Кристал Удару в Спину (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Бонус 10% урону при ударі в спину.", grade: "C", stats: { backbiting: 10 } },
  crystal_backbiting_b: { id: "crystal_backbiting_b", name: "Кристал Удару в Спину (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Бонус 15% урону при ударі в спину.", grade: "B", stats: { backbiting: 15 } },
  crystal_backbiting_a: { id: "crystal_backbiting_a", name: "Кристал Удару в Спину (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Бонус 20% урону при ударі в спину.", grade: "A", stats: { backbiting: 20 } },
  crystal_backbiting_s: { id: "crystal_backbiting_s", name: "Кристал Удару в Спину (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Бонус 25% урону при ударі в спину.", grade: "S", stats: { backbiting: 25 } },
};
