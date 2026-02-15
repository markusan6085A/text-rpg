/**
 * Перетворює об'єкт у JSON-safe: BigInt → string. Працює завжди.
 * На фронті при потребі — Number().
 */
export function toJsonSafe<T>(obj: T): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Buffer.isBuffer(obj) || typeof (obj as { pipe?: unknown }).pipe === "function") return obj;
  return JSON.parse(
    JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}
