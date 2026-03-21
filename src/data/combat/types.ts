// Типи для бою, мобів і дропа

export type DropKind = "adena" | "resource" | "equipment" | "other";

export interface DropEntry {
  id: string;        // "adena" або ID ресурсу/шмотки
  kind: DropKind;
  /** 0..1; для UI, якщо немає chancePerMillion */
  chance: number;
  min: number;       // мін. кількість
  max: number;       // макс. кількість
  /**
   * Шанс як у L2 XML droplist: незалежний roll, успіх якщо R < chance (R у [0, 1_000_000)).
   * Якщо задано — використовується замість `chance` при розрахунку дропу.
   */
  chancePerMillion?: number;
  /** L2 item id (для іконки l2dop-by-itemid / дебагу) */
  l2ItemId?: number;
  /** Підпис у UI, якщо id синтетичний (l2item_*) */
  displayName?: string;
}

export interface Mob {
  id: string;
  name: string;
  level: number;

  hp: number;
  mp: number;

  pAtk: number;
  mAtk: number;
  pDef: number;
  mDef: number;

  exp: number;       // досвід за моба
  sp: number;        // SP, якщо захочеш рахувати

  drops: DropEntry[];
}

export interface Zone {
  id: string;          // унікальний ID зони (наприклад "giran_harbor")
  cityId: string;      // місто, до якого належить (наприклад "giran")
  name: string;        // назва зони
  minLevel: number;
  maxLevel: number;
  mobs: Mob[];
}
