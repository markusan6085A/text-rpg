export type PkSkill = {
  id: number;
  name?: string;
  level: number;
  mpCost: number;
  cooldownMs: number;
  powerBonus: number;
};

export type PkFighter = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  pAtk: number;
  pDef: number;
  mAtk: number;
  mDef: number;
  accuracy: number;
  evasion: number;
  crit: number;
  mCrit: number;
  critPower: number;
  prefersMagic: boolean;
  skills: PkSkill[];
};

export type PkSession = {
  id: string;
  attackerId: string;
  defenderId: string;
  /** pk — звичайний бій у зоні; arena — матчмейкінг, без перевірки локації */
  sessionKind?: "pk" | "arena";
  startLocation?: string;
  attacker: PkFighter;
  defender: PkFighter;
  attackerCooldowns: Record<number, number>;
  defenderCooldowns: Record<number, number>;
  log: string[];
  ended: boolean;
  winnerId?: string;
  attackerHasHit?: boolean;
  defenderHasHit?: boolean;
  lastHitDamage?: number;
  lastHitById?: string;
  lastHitByName?: string;
  escapedById?: string;
  escapedByName?: string;
  createdAt: number;
  updatedAt: number;
  saved: boolean;
};

export function isArenaSession(session: PkSession): boolean {
  return session.sessionKind === "arena";
}
