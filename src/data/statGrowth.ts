/**
 * Таблиця рівнів, на яких базові стати отримують приріст
 * Кожні 3 рівні: 3, 6, 9, 12, 15, ... до 80
 */
export const STAT_GROWTH_LEVELS = Array.from({ length: 26 }, (_, i) => (i + 1) * 3);

/**
 * Ваги росту статів для різних архетипів
 * 1.0 = повний приріст, 0.5 = половина, 0 = без росту
 */
export const CLASS_GROWTH = {
  mage: {
    INT: 1.0,
    WIT: 1.0,
    MEN: 1.0,
    STR: 0,
    DEX: 0,
    CON: 0.5,
  },
  fighter: {
    STR: 1.0,
    DEX: 1.0,
    CON: 1.0,
    INT: 0,
    WIT: 0,
    MEN: 0.5,
  },
} as const;

export type Archetype = keyof typeof CLASS_GROWTH;

