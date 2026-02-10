const mutedUntil = new Map<string, number>();

export function getMutedUntil(characterId: string): number | null {
  const until = mutedUntil.get(characterId);
  if (until == null) return null;
  if (Date.now() > until) {
    mutedUntil.delete(characterId);
    return null;
  }
  return until;
}

export function setMuted(characterId: string, durationMinutes: number): void {
  const until = Date.now() + durationMinutes * 60 * 1000;
  mutedUntil.set(characterId, until);
}
