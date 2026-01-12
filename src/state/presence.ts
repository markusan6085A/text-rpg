// src/state/presence.ts
import { getJSON, setJSON } from "./persistence";

type PresenceMap = Record<string, number>; // nick -> lastPing ms

const PRESENCE_KEY = "rpg_presence_v1";
const USERS_KEY = "rpg_users_v1";
const HEARTBEAT_MS = 15_000;         // раз на 15 сек – пінг
const ONLINE_WINDOW_MS = 60_000;     // вважаємо онлайн, якщо бачили за останню хвилину

export function getRegisteredUsers(): string[] {
  return getJSON<string[]>(USERS_KEY, []);
}

export function addRegisteredUser(nick: string) {
  const users = getRegisteredUsers();
  if (!users.includes(nick)) {
    users.push(nick);
    setJSON(USERS_KEY, users);
  }
}

function loadPresence(): PresenceMap {
  return getJSON<PresenceMap>(PRESENCE_KEY, {});
}

function savePresence(p: PresenceMap) {
  setJSON(PRESENCE_KEY, p);
}

export function startHeartbeat(nick: string) {
  // одразу відмітимось
  const now = Date.now();
  const p = loadPresence();
  p[nick] = now;
  savePresence(p);

  // періодичний heartbeat
  const t = window.setInterval(() => {
    const now = Date.now();
    const p = loadPresence();
    p[nick] = now;
    // ще приберемо “мертві” сліди
    for (const k of Object.keys(p)) {
      if (now - p[k] > ONLINE_WINDOW_MS * 3) delete p[k];
    }
    savePresence(p);
  }, HEARTBEAT_MS);

  // повернемо зупинку
  return () => clearInterval(t);
}

export function getOnlineCount(): number {
  const now = Date.now();
  const p = loadPresence();
  return Object.values(p).filter(ts => now - ts <= ONLINE_WINDOW_MS).length;
}

export function getTotals() {
  return {
    onlineNow: getOnlineCount(),
    onlineTotal: getRegisteredUsers().length,
  };
}
