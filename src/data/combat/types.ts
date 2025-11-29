// Типи для бою, мобів і дропа

export type DropKind = "adena" | "resource" | "equipment" | "other";

export interface DropEntry {
  id: string;        // "adena" або ID ресурсу/шмотки
  kind: DropKind;
  chance: number;    // 0..1 (0.25 = 25%)
  min: number;       // мін. кількість
  max: number;       // макс. кількість
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
