// src/state/presence.ts
type PresenceMap = Record<string, number>; // nick -> lastPing ms

const PRESENCE_KEY = "rpg_presence_v1";
const USERS_KEY = "rpg_users_v1";
const HEARTBEAT_MS = 15_000;         // раз на 15 сек – пінг
const ONLINE_WINDOW_MS = 60_000;     // вважаємо онлайн, якщо бачили за останню хвилину

export function getRegisteredUsers(): string[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addRegisteredUser(nick: string) {
  const users = getRegisteredUsers();
  if (!users.includes(nick)) {
    users.push(nick);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

function loadPresence(): PresenceMap {
  try {
    return JSON.parse(localStorage.getItem(PRESENCE_KEY) || "{}");
  } catch {
    return {};
  }
}
function savePresence(p: PresenceMap) {
  localStorage.setItem(PRESENCE_KEY, JSON.stringify(p));
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
