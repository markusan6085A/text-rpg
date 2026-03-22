/**
 * Після смерті зберігаємо «треба в місто» у localStorage — щоб F5 не піднімав HP
 * через стару логіку load (70% при isDead).
 */
import { getJSON, setJSON, removeItem } from "../state/persistence";

export type DeathGatePayload = {
  killerName: string;
  damage: number;
  at: number;
};

export function deathGateStorageKey(characterId: string | null | undefined, heroName: string | undefined): string {
  const id = characterId ? String(characterId).trim() : "";
  const name = heroName ? encodeURIComponent(heroName.trim()) : "";
  return `l2_pending_death_v1_${id || "x"}_${name || "x"}`;
}

export function readDeathGate(
  characterId: string | null | undefined,
  heroName: string | undefined
): DeathGatePayload | null {
  if (!heroName?.trim()) return null;
  return getJSON<DeathGatePayload | null>(deathGateStorageKey(characterId, heroName), null);
}

export function writeDeathGate(
  characterId: string | null | undefined,
  heroName: string | undefined,
  payload: DeathGatePayload
): void {
  if (!heroName?.trim()) return;
  setJSON(deathGateStorageKey(characterId, heroName), payload);
}

export function clearDeathGate(characterId: string | null | undefined, heroName: string | undefined): void {
  if (!heroName?.trim()) return;
  removeItem(deathGateStorageKey(characterId, heroName));
}
