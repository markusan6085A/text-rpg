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

  // ===== LS — 1 на грейд, при вставці в зброю дає випадковий бонус =====
  crystal_ls_c: {
    id: "crystal_ls_c",
    name: "ЛС (C)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg",
    description: "При вставці в зброю дає випадковий бонус (крит, маг. крит, HP, фокус тощо).",
    grade: "C",
    stats: {},
  },
  crystal_ls_b: {
    id: "crystal_ls_b",
    name: "ЛС (B)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg",
    description: "При вставці в зброю дає випадковий бонус (крит, маг. крит, HP, фокус тощо).",
    grade: "B",
    stats: {},
  },
  crystal_ls_a: {
    id: "crystal_ls_a",
    name: "ЛС (A)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg",
    description: "При вставці в зброю дає випадковий бонус (крит, маг. крит, HP, фокус тощо).",
    grade: "A",
    stats: {},
  },
  crystal_ls_s: {
    id: "crystal_ls_s",
    name: "ЛС (S)",
    kind: "resource",
    slot: "resource",
    icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg",
    description: "При вставці в зброю дає випадковий бонус (крит, маг. крит, HP, фокус тощо).",
    grade: "S",
    stats: {},
  },

  // ===== MAGIC CRIT — шанс магічного крита (для зворотної сумісності зі старими збереженнями) =====
  crystal_magic_crit_c: { id: "crystal_magic_crit_c", name: "Кристал Маг. Крита (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Збільшує шанс магічного крита на 3%.", grade: "C", stats: { mCrit: 3 } },
  crystal_magic_crit_b: { id: "crystal_magic_crit_b", name: "Кристал Маг. Крита (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Збільшує шанс магічного крита на 5%.", grade: "B", stats: { mCrit: 5 } },
  crystal_magic_crit_a: { id: "crystal_magic_crit_a", name: "Кристал Маг. Крита (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Збільшує шанс магічного крита на 7%.", grade: "A", stats: { mCrit: 7 } },
  crystal_magic_crit_s: { id: "crystal_magic_crit_s", name: "Кристал Маг. Крита (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Збільшує шанс магічного крита на 10%.", grade: "S", stats: { mCrit: 10 } },

  // ===== MAX HP — бонус до макс. HP (%)
  crystal_max_hp_c: { id: "crystal_max_hp_c", name: "Кристал Макс. HP (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Збільшує максимальний HP на 15%.", grade: "C", stats: { maxHpPercent: 15 } },
  crystal_max_hp_b: { id: "crystal_max_hp_b", name: "Кристал Макс. HP (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Збільшує максимальний HP на 20%.", grade: "B", stats: { maxHpPercent: 20 } },
  crystal_max_hp_a: { id: "crystal_max_hp_a", name: "Кристал Макс. HP (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Збільшує максимальний HP на 30%.", grade: "A", stats: { maxHpPercent: 30 } },
  crystal_max_hp_s: { id: "crystal_max_hp_s", name: "Кристал Макс. HP (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Збільшує максимальний HP на 40%.", grade: "S", stats: { maxHpPercent: 40 } },

  // ===== 2. FOCUS — зменшення перезарядки скілів =====
  crystal_focus_c: { id: "crystal_focus_c", name: "Кристал Фокусу (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Зменшує перезарядку скілів на 3%.", grade: "C", stats: { focus: 3 } },
  crystal_focus_b: { id: "crystal_focus_b", name: "Кристал Фокусу (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Зменшує перезарядку скілів на 5%.", grade: "B", stats: { focus: 5 } },
  crystal_focus_a: { id: "crystal_focus_a", name: "Кристал Фокусу (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Зменшує перезарядку скілів на 7%.", grade: "A", stats: { focus: 7 } },
  crystal_focus_s: { id: "crystal_focus_s", name: "Кристал Фокусу (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Зменшує перезарядку скілів на 15%.", grade: "S", stats: { focus: 15 } },

  // ===== 3. HEALTH (Life Steal) — % відновлення HP від урону =====
  crystal_health_c: { id: "crystal_health_c", name: "Кристал Поглинання (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Відновлює 5% завданого урону як HP (Life Steal).", grade: "C", stats: { lifeSteal: 5 } },
  crystal_health_b: { id: "crystal_health_b", name: "Кристал Поглинання (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Відновлює 8% завданого урону як HP (Life Steal).", grade: "B", stats: { lifeSteal: 8 } },
  crystal_health_a: { id: "crystal_health_a", name: "Кристал Поглинання (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Відновлює 10% завданого урону як HP (Life Steal).", grade: "A", stats: { lifeSteal: 10 } },
  crystal_health_s: { id: "crystal_health_s", name: "Кристал Поглинання (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Відновлює 15% завданого урону як HP (Life Steal).", grade: "S", stats: { lifeSteal: 15 } },

  // ===== 4. GUIDANCE — зменшення MP скілів =====
  crystal_guidance_c: { id: "crystal_guidance_c", name: "Кристал Наведення (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Зменшує витрату MP скілів на 5%.", grade: "C", stats: { guidance: 5 } },
  crystal_guidance_b: { id: "crystal_guidance_b", name: "Кристал Наведення (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Зменшує витрату MP скілів на 8%.", grade: "B", stats: { guidance: 8 } },
  crystal_guidance_a: { id: "crystal_guidance_a", name: "Кристал Наведення (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Зменшує витрату MP скілів на 11%.", grade: "A", stats: { guidance: 11 } },
  crystal_guidance_s: { id: "crystal_guidance_s", name: "Кристал Наведення (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Зменшує витрату MP скілів на 16%.", grade: "S", stats: { guidance: 16 } },

  // ===== 5. EMPOWER — сила скілів =====
  crystal_empower_c: { id: "crystal_empower_c", name: "Кристал Потужності (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Збільшує урон скілів на 5%.", grade: "C", stats: { empower: 5 } },
  crystal_empower_b: { id: "crystal_empower_b", name: "Кристал Потужності (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Збільшує урон скілів на 10%.", grade: "B", stats: { empower: 10 } },
  crystal_empower_a: { id: "crystal_empower_a", name: "Кристал Потужності (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Збільшує урон скілів на 15%.", grade: "A", stats: { empower: 15 } },
  crystal_empower_s: { id: "crystal_empower_s", name: "Кристал Потужності (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Збільшує урон скілів на 20%.", grade: "S", stats: { empower: 20 } },

  // ===== 6. ACUMEN — швидкість касту =====
  crystal_acumen_c: { id: "crystal_acumen_c", name: "Кристал Спритності (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Збільшує швидкість касту на 6%.", grade: "C", stats: { acumen: 6 } },
  crystal_acumen_b: { id: "crystal_acumen_b", name: "Кристал Спритності (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Збільшує швидкість касту на 8%.", grade: "B", stats: { acumen: 8 } },
  crystal_acumen_a: { id: "crystal_acumen_a", name: "Кристал Спритності (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Збільшує швидкість касту на 12%.", grade: "A", stats: { acumen: 12 } },
  crystal_acumen_s: { id: "crystal_acumen_s", name: "Кристал Спритності (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Збільшує швидкість касту на 16%.", grade: "S", stats: { acumen: 16 } },

  // ===== 7. ANGER — сила криту =====
  crystal_anger_c: { id: "crystal_anger_c", name: "Кристал Гніву (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Збільшує силу крита на 4%.", grade: "C", stats: { anger: 4 } },
  crystal_anger_b: { id: "crystal_anger_b", name: "Кристал Гніву (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Збільшує силу крита на 6%.", grade: "B", stats: { anger: 6 } },
  crystal_anger_a: { id: "crystal_anger_a", name: "Кристал Гніву (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Збільшує силу крита на 9%.", grade: "A", stats: { anger: 9 } },
  crystal_anger_s: { id: "crystal_anger_s", name: "Кристал Гніву (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Збільшує силу крита на 15%.", grade: "S", stats: { anger: 15 } },

  // ===== 8. MAGIC PARRY — опір магії =====
  crystal_magic_parry_c: { id: "crystal_magic_parry_c", name: "Кристал Відбиття Магії (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Шанс 3% відбити магічну атаку.", grade: "C", stats: { magicParry: 3 } },
  crystal_magic_parry_b: { id: "crystal_magic_parry_b", name: "Кристал Відбиття Магії (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Шанс 5% відбити магічну атаку.", grade: "B", stats: { magicParry: 5 } },
  crystal_magic_parry_a: { id: "crystal_magic_parry_a", name: "Кристал Відбиття Магії (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Шанс 7% відбити магічну атаку.", grade: "A", stats: { magicParry: 7 } },
  crystal_magic_parry_s: { id: "crystal_magic_parry_s", name: "Кристал Відбиття Магії (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Шанс 10% відбити магічну атаку.", grade: "S", stats: { magicParry: 10 } },

  // ===== 9. RSK. FOCUS — шанс не витратити MP =====
  crystal_rsk_focus_c: { id: "crystal_rsk_focus_c", name: "Кристал Рск. Фокус (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Шанс 10% не витратити MP скілу.", grade: "C", stats: { rskFocus: 10 } },
  crystal_rsk_focus_b: { id: "crystal_rsk_focus_b", name: "Кристал Рск. Фокус (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Шанс 20% не витратити MP скілу.", grade: "B", stats: { rskFocus: 20 } },
  crystal_rsk_focus_a: { id: "crystal_rsk_focus_a", name: "Кристал Рск. Фокус (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Шанс 30% не витратити MP скілу.", grade: "A", stats: { rskFocus: 30 } },
  crystal_rsk_focus_s: { id: "crystal_rsk_focus_s", name: "Кристал Рск. Фокус (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Шанс 40% не витратити MP скілу.", grade: "S", stats: { rskFocus: 40 } },

  // ===== 10. RSK. EVASION — шанс уникнути =====
  crystal_rsk_evasion_c: { id: "crystal_rsk_evasion_c", name: "Кристал Рск. Уникнення (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Шанс 10% уникнути атаку.", grade: "C", stats: { rskEvasion: 10 } },
  crystal_rsk_evasion_b: { id: "crystal_rsk_evasion_b", name: "Кристал Рск. Уникнення (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Шанс 20% уникнути атаку.", grade: "B", stats: { rskEvasion: 20 } },
  crystal_rsk_evasion_a: { id: "crystal_rsk_evasion_a", name: "Кристал Рск. Уникнення (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Шанс 25% уникнути атаку.", grade: "A", stats: { rskEvasion: 25 } },
  crystal_rsk_evasion_s: { id: "crystal_rsk_evasion_s", name: "Кристал Рск. Уникнення (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Шанс 30% уникнути атаку.", grade: "S", stats: { rskEvasion: 30 } },

  // ===== 11. RSK. HASTE — миттєвий скіл =====
  crystal_rsk_haste_c: { id: "crystal_rsk_haste_c", name: "Кристал Рск. Швидкість (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Шанс 10% миттєво відновити скіл.", grade: "C", stats: { rskHaste: 10 } },
  crystal_rsk_haste_b: { id: "crystal_rsk_haste_b", name: "Кристал Рск. Швидкість (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Шанс 20% миттєво відновити скіл.", grade: "B", stats: { rskHaste: 20 } },
  crystal_rsk_haste_a: { id: "crystal_rsk_haste_a", name: "Кристал Рск. Швидкість (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Шанс 30% миттєво відновити скіл.", grade: "A", stats: { rskHaste: 30 } },
  crystal_rsk_haste_s: { id: "crystal_rsk_haste_s", name: "Кристал Рск. Швидкість (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Шанс 40% миттєво відновити скіл.", grade: "S", stats: { rskHaste: 40 } },

  // ===== 12. BACKBITING — урон у спину =====
  crystal_backbiting_c: { id: "crystal_backbiting_c", name: "Кристал Удару в Спину (C)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_general_i03_0.jpg", description: "Бонус 5% урону при ударі в спину.", grade: "C", stats: { backbiting: 5 } },
  crystal_backbiting_b: { id: "crystal_backbiting_b", name: "Кристал Удару в Спину (B)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_rare_i03_0.jpg", description: "Бонус 8% урону при ударі в спину.", grade: "B", stats: { backbiting: 8 } },
  crystal_backbiting_a: { id: "crystal_backbiting_a", name: "Кристал Удару в Спину (A)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_special_i03_0.jpg", description: "Бонус 12% урону при ударі в спину.", grade: "A", stats: { backbiting: 12 } },
  crystal_backbiting_s: { id: "crystal_backbiting_s", name: "Кристал Удару в Спину (S)", kind: "resource", slot: "resource", icon: "/items/drops/resources/Etc_mineral_unique_i03_0.jpg", description: "Бонус 18% урону при ударі в спину.", grade: "S", stats: { backbiting: 18 } },
};
