import { randomBytes } from "node:crypto";

type AdminSession = {
  adminLogin: string;
  createdAt: number;
  expiresAt: number;
};

const sessions = new Map<string, AdminSession>();

const TTL_MS = 1000 * 60 * 60 * 24; // 24h

export function createAdminSession(adminLogin: string): string {
  const sid = randomBytes(32).toString("hex");
  const now = Date.now();
  sessions.set(sid, {
    adminLogin,
    createdAt: now,
    expiresAt: now + TTL_MS,
  });
  return sid;
}

export function getAdminSession(sid: string | undefined): AdminSession | null {
  if (!sid) return null;
  const s = sessions.get(sid);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    sessions.delete(sid);
    return null;
  }
  return s;
}

export function deleteAdminSession(sid: string | undefined): void {
  if (!sid) return;
  sessions.delete(sid);
}
