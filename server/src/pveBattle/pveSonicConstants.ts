/** Узгоджено з client useSkill/helpers.ts */
export const SONIC_FOCUS_ID = 8; // stack consumer id for sonic skills
export const SONIC_CONSUMERS = new Set([5, 6, 7, 9, 261, 442]);
export const SONIC_COST: Record<number, number> = { 5: 1, 6: 1, 7: 1, 9: 1, 261: 1, 442: 4 };

export const FOCUSED_FORCE_ID = 50;
export const FOCUSED_FORCE_CONSUMERS = new Set([54, 443]);
export const FOCUSED_FORCE_COST: Record<number, number> = { 54: 1, 443: 4 };
