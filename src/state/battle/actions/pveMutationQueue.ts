/**
 * Серійні PvE CAS-мутації (один рядок revision).
 *
 * `tick` (POST pve-battle-tick) не повинен стояти в черзі перед ударами гравця — інакше
 * відчуваються великі затримки між кліком і відповіддю (особливо маг).
 * Тому: спочатку всі очікуючі user-мутації, потім один tick, у циклі, поки є робота.
 */
const userQ: Array<() => Promise<unknown>> = [];
const tickQ: Array<() => Promise<unknown>> = [];
let draining = false;

async function drainQueues(): Promise<void> {
  if (draining) return;
  draining = true;
  try {
    for (;;) {
      const run =
        userQ.length > 0 ? userQ.shift()! : tickQ.length > 0 ? tickQ.shift()! : null;
      if (!run) break;
      try {
        await run();
      } catch {
        /* відхилення вже передано в Promise з runSerializedPveMutation */
      }
    }
  } finally {
    draining = false;
    if (userQ.length > 0 || tickQ.length > 0) void drainQueues();
  }
}

export function runSerializedPveMutation<T>(
  fn: () => Promise<T>,
  lane: "user" | "tick" = "user"
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () =>
      (async () => {
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        }
      })();
    if (lane === "tick") tickQ.push(run);
    else userQ.push(run);
    void drainQueues();
  });
}
