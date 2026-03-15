// src/data/world/config.ts
// Флаги для інтеграції l2dop (города, локації, мобі, дроп, спойл)

/**
 * true = додати міста/локації/мобів з l2dop до світу.
 * false = використовувати тільки поточні дані (Floran, Gludin тощо).
 * Встановити false, щоб повністю відкотити інтеграцію l2dop.
 */
export const USE_L2DOP_WORLD = false;

/**
 * true = вимкнути дроп ресурсів та спойл у поточних зонах (Floran, Gludin тощо).
 * Адена, койни, fast adena залишаються.
 * false = залишити ресурси як є.
 */
export const DISABLE_OUR_RESOURCES = false;
