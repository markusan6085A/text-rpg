const bigintReplacer = (_: unknown, v: unknown) =>
  typeof v === "bigint" ? v.toString() : v;

/** Перетворює об'єкт у JSON-safe: BigInt → string. Працює завжди. */
export function toJsonSafe<T>(obj: T): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Buffer.isBuffer(obj) || typeof (obj as { pipe?: unknown }).pipe === "function") return obj;
  return JSON.parse(JSON.stringify(obj, bigintReplacer));
}

/** Безпечний JSON.stringify для логів/кешу — не падає на BigInt */
export function safeJsonStringify(obj: unknown, space?: number): string {
  return JSON.stringify(obj, bigintReplacer, space);
}

/** Діагностика: знайти шляхи до BigInt (для dev) */
export function findBigIntPaths(obj: unknown, path = "$", out: string[] = []): string[] {
  if (typeof obj === "bigint") {
    out.push(path);
    return out;
  }
  if (!obj || typeof obj !== "object") return out;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => findBigIntPaths(v, `${path}[${i}]`, out));
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    findBigIntPaths(v, `${path}.${k}`, out);
  }
  return out;
}
