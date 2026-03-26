export type TvtMatchPhase = "pick" | "fighting";

export type TvtMatchState = {
  id: string;
  dayKey: string;
  slotId: string;
  /** Початковий склад команд (для нагород і UI) */
  teamAIds: string[];
  teamBIds: string[];
  /** Живі бійці по командах */
  queueA: string[];
  queueB: string[];
  status: "active" | "done";
  winnerTeam: "A" | "B" | null;
  currentPkSessionId: string | null;
  createdAt: number;
  /** Unix ms: після цього часу матч завершується таймаутом (якщо ще active) */
  matchEndsAt: number;
  /** pick — можна почати новий бій; fighting — вже йде PK */
  phase: TvtMatchPhase;
  /** legacy (залишаємо для KV): не використовується — атакувати може будь-хто зі своєї команди */
  attackingTeam: "A" | "B";
  pendingAttackerId: string | null;
  pickedDefenderId: string | null;
  /** Остання активність фази вибору (AFK → авто-ціль) */
  lastPickActivityAt: number;
};

export type TvtParticipantLite = { id: string; name: string; level: number };
