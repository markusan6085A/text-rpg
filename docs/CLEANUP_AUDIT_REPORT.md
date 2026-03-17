# Звіт аудиту: видалені ресурси, локації, бонуси сетів, рибалка, іконки

**Оновлено:** Виправлення застосовано.

## 1. Видалені ресурси — ВИПРАВЛЕНО ✓

### mobs.ts
- Усі drops/spoil зі старими ресурсами **видалені** (порожні масиви)
- makeChampion fallback — порожні масиви
- gludioRbDrops / adenRbDrops — повертають []

### itemIcon.ts
- `synthetic_cokes` → fallback `Etc_bead_green_i00_0` (файл Synthetic_Cokes видалений)

### Зони (всі gludin, floran, gludio)
- `resourceDrops` та `resourceSpoils` — порожні масиви
- `craftingResources` (gludio_territory) — порожній, generateCraftingDrops перевіряє length

---

## 2. Іконки — ВИПРАВЛЕНО ✓

| Файл | Статус |
|------|--------|
| GMShop.tsx | Краски C/B/A/S — правильні іконки (dye-con, int, men, wit, Etc_bead для dex) |
| itemsDB_s.ts, questShop.ts | bless-armor-s / bless-weapon-s — fallback Etc_bead |
| itemsDB_s.ts, sGradeShop.ts | Draconic_Leather_Armo.jpg → Draconic_Leather_Armor.jpg (typo) |

---

## 3. Локації з мобами та міста

- **world.ts**: `cities: []`, `locations: []` — світ порожній
- **USE_L2DOP_WORLD = false** — L2DOP не підключено
- Файли зон існують, але не входять у поточний світ

---

## 4. Бонуси сетів

**Бонуси сетів НЕ видалені** — використовуються в armorSets, Location, Shop, calcCombatStats тощо.

---

## 5. Рибалка — OK ✓

- `getAllResources()` повертає `[]` — ресурси з дропу риби прибрані

---

## 6. Іконки зброї/броні/бижутерії — OK ✓

- Draconic_Leather_Armo → Armor (typo виправлено)
