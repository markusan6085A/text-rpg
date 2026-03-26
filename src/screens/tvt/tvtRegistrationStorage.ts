import type { TvtParticipant } from "./tvtTypes";

const KEY = "tvt_registered_participants_v1";

function read(): TvtParticipant[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p: any) => p && typeof p.id === "string" && typeof p.name === "string");
  } catch {
    return [];
  }
}

function write(list: TvtParticipant[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getTvtRegisteredParticipants(): TvtParticipant[] {
  return read();
}

export function registerSelf(participant: TvtParticipant): TvtParticipant[] {
  const cur = read();
  if (cur.some((p) => p.id === participant.id)) return cur;
  const next = [...cur, participant];
  write(next);
  return next;
}

export function unregisterSelf(characterId: string): TvtParticipant[] {
  const next = read().filter((p) => p.id !== characterId);
  write(next);
  return next;
}

export function clearTvtRegistration() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
