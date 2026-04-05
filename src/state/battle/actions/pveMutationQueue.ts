/**
 * Одна серійна черга для усіх PvE CAS-мутацій (tick / attack / battle-start / self-buff / mob-debuff).
 * Поки попередній запит не завершився (включно з applyServerSync у caller), наступний не стартує —
 * усуває revision_conflict від паралельних tick+attack або кількох in-flight HTTP.
 */
let chain: Promise<unknown> = Promise.resolve();

export function runSerializedPveMutation<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(() => fn()) as Promise<T>;
  chain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}
