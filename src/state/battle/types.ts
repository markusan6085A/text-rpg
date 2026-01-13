import type { Mob } from "../../data/world/types";

export type BattleStatus = "idle" | "fighting" | "victory";

export type CooldownMap = Record<number, number>; // skillId -> timestamp ms

export type BattleBuff = {
  id?: number;
  name?: string;
  icon?: string;
  stackType?: string;
  buffGroup?: string; // Group for buff stacking logic (e.g., "WC_COMBAT", "WC_STATS", "WC_DEF", "WC_RESIST", "WC_SPECIAL")
  effects: any[];
  expiresAt: number;
  startedAt?: number;
  durationMs?: number;
  stacks?: number;
  source?: "buffer" | "skill" | "summon"; // Джерело бафа: "buffer" = від статуї, "skill" = від скілу, "summon" = від сумону
  // Toggle tick effects
  hpPerTick?: number; // HP споживання/відновлення на tick
  mpPerTick?: number; // MP споживання/відновлення на tick
  tickInterval?: number; // Інтервал tick в секундах
  lastTickAt?: number; // Timestamp останнього tick
};

export type BattleState = {
  heroName?: string; // Нік героя, якому належить цей battle state
  zoneId?: string;
  mob?: Mob;
  mobIndex?: number;
  mobHP: number;
  aggressiveMobs?: Array<{ mob: Mob; mobIndex: number; mobHP: number }>; // Агресивні моби з тієї ж групи на сторінці
  // ❗ Ресурси (HP/MP/CP) тепер ТІЛЬКИ в heroStore.hero - не дублюємо тут
  mobStunnedUntil?: number; // Timestamp до якого моб оглушений (stun ефект)
  heroStunnedUntil?: number; // Timestamp до якого герой оглушений (stun ефект від рейд-боса)
  heroBuffsBlockedUntil?: number; // Timestamp до якого бафи гравця заблоковані
  heroSkillsBlockedUntil?: number; // Timestamp до якого скіли гравця заблоковані
  mobNextAttackAt?: number;
  heroNextAttackAt?: number;
  status: BattleStatus;
  log: string[];
  regenTick: () => void;
  cooldowns: CooldownMap;
  loadoutSlots: (number | string | null)[]; // Підтримка расходників (string типу "consumable:...")
  lastReward?: { exp: number; adena: number; sp?: number; mob: string; spoiled?: boolean };
  heroBuffs: BattleBuff[];
  mobBuffs: BattleBuff[]; // Дебафи для мобів (debuff скіли)
  summonBuffs: BattleBuff[]; // Бафи для сумону
  baseSummonStats?: {
    // Базові стати сумону (без бафів) - зберігаються при створенні
    pAtk: number;
    pDef: number;
    mAtk: number;
    mDef: number;
    maxHp: number;
    maxMp: number;
    attackSpeed?: number;
    castSpeed?: number;
    runSpeed?: number;
    critRate?: number;
    critDamage?: number;
    accuracy?: number;
    evasion?: number;
    debuffResist?: number;
    vampirism?: number;
  };
  summon?: {
    id: number;
    name?: string;
    icon?: string;
    level?: number;
    hp: number;
    mp: number;
    maxHp: number;
    maxMp: number;
    pAtk?: number;
    pDef?: number;
    mAtk?: number;
    mDef?: number;
    expPenalty?: number; // Experience penalty (0.0 = 0%, 0.9 = 90%)
    // Additional stats for servitor buffs
    attackSpeed?: number;
    castSpeed?: number;
    runSpeed?: number;
    critRate?: number;
    critDamage?: number;
    accuracy?: number;
    evasion?: number;
    debuffResist?: number;
    vampirism?: number;
  } | null;
  summonLastAttackAt?: number; // Timestamp of last summon attack
  resurrection?: {
    ratio: number; // 0-1 of max HP/MP to restore
    sourceBuffId?: number;
  } | null;
  startBattle: (zoneId: string, mobIndex: number) => void;
  useSkill: (skillId: number | string) => void; // Підтримка расходників (string типу "consumable:...")
  setLoadoutSkill: (slotIndex: number, skillId: number | string | null) => void;
  processMobAttack: () => void;
  resurrect: () => void;
  reset: () => void;
};
