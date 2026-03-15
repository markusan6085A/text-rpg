# lineage.sql — структура даних для extractL2dopWorld.mjs

Файл `lineage.sql` має бути в `l2dop/lineage.sql` (від кореня проєкту).  
Екстрактор читає таблиці MySQL dump.

---

## 1. Таблиця `npc`

Для рядків з `v[11] === "L2Monster"` екстрактор бере:

| Індекс | Поле    | Приклад | Опис              |
|--------|---------|---------|-------------------|
| 0      | id      | 20924   | ID моба           |
| 2      | name    | "Maille Lizardman Matriarch" | Назва |
| 9      | level   | 30      | Рівень            |
| 13     | hp      | 604     | HP                |
| 14     | mp      | 329     | MP                |
| 22     | exp     | 854     | Досвід за вбивство|
| 23     | sp      | 47      | SP за вбивство    |
| 24     | patk    | 93      | Фіз. атака        |
| 25     | pdef    | 118     | Фіз. захист       |
| 26     | matk    | 63      | Маг. атака        |
| 27     | mdef    | 79      | Маг. захист       |

---

## 2. Таблиця `droplist`

Формат `(eid, item_id, min, max, category, chance)`:

| Індекс | Поле     | Опис                                      |
|--------|----------|-------------------------------------------|
| 0      | eid      | NPC ID (той самий, що в npc)              |
| 1      | drop     | item_id (57 = adena)                      |
| 2      | min      | Мін. кількість                            |
| 3      | max      | Макс. кількість                           |
| 4      | category | 0 = drop, 1 = spoil                      |
| 5      | chance   | Шанс (напр. 700000 = 70% → ділиться на 1000000) |

**Adena:** item_id = 57, category = 0 — adenaMin/adenaMax з min/max.

---

## 3. Таблиця `spawnlist`

| Індекс | Поле     | Опис                    |
|--------|----------|-------------------------|
| 1      | npcid    | NPC ID                  |
| 7      | lvl      | Рівень спавну           |
| 8      | name     | Назва (опційно)         |
| 25     | location | Локація (напр. gludio23_1921_01) |

---

## Як отримати lineage.sql

1. Дамп з MySQL l2dop сервера: `mysqldump -u user -p lineage npc droplist spawnlist > lineage.sql`
2. Покласти файл у `l2dop/lineage.sql` (від кореня проєкту)
3. Запустити: `npm run extract:l2dop` (або `node tools/extractL2dopWorld.mjs`)

## Що генерує скрипт

- `cities.ts` — міста
- `zones.ts` — зони з мобами (до 5 зон на місто)
- `mobsFromLineage.ts` — усі унікальні мобі з характеристиками (hp, mp, exp, sp, adena) та дропом/спойлом з lineage.sql
2. Або експорт з існуючої бази l2dop, якщо є доступ.

Після створення файлу:

```bash
node tools/extractL2dopWorld.mjs
```

Скрипт згенерує `cities.ts` і `zones.ts` у `src/data/world/l2dop/`.  
**mobs.ts** — ручний, його екстрактор не оновлює (там fillZoneMobs + L2DOP_GLUDIO_POOL).
