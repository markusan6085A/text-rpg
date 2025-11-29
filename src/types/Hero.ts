export type GenderRu = "Мужчина" | "Женщина";

export interface HeroBaseStats {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIT: number;
  MEN: number;
}

export interface HeroCore {
  id: string;
  name: string;
  race: string;
  klass: string;
  gender: GenderRu;

  level: number;
  exp: number;

  baseStats: HeroBaseStats;

  equipment: Record<string, string | null>;
  buffs: string[];

  adena: number;
  coinOfLuck: number;
  inventory: string[];
}

export interface HeroDerivedStats {
  maxHp: number;
  maxMp: number;

  pAtk: number;
  mAtk: number;

  pDef: number;
  mDef: number;

  atkSpeed: number;
  castSpeed: number;

  critRate: number;
  accuracy: number;
  evasion: number;

  moveSpeed: number;
}

export interface HeroFull extends HeroCore {
  stats: HeroDerivedStats;
}
