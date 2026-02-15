/**
 * Рекурсивно конвертує BigInt → Number для JSON-серіалізації.
 * Використовується глобально через preSerialization hook — жодна відповідь не втече з BigInt.
 */
export function sanitizeBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return Number(obj);
  if (typeof obj !== "object") return obj; // string, number, boolean
  if (obj instanceof Date) return obj;
  if (Buffer.isBuffer(obj)) return obj; // Buffer не перетворюємо
  if (typeof (obj as { pipe?: unknown }).pipe === "function") return obj; // Stream
  if (Array.isArray(obj)) return obj.map(sanitizeBigInt);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = sanitizeBigInt(v);
  return out;
}
