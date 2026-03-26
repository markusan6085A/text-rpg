export type TvtMatchPhase = "pick" | "fighting";

export type TvtMatchState = {
  id: string;
  dayKey: string;
  slotId: string;
  /** Початковий склад команд (для нагород і UI) */
  teamAIds: string[];
  teamBIds: string[];
  /** Живі бійці по командах (порядок: хто перший атакує, коли черга команди) */
  queueA: string[];
  queueB: string[];
  status: "active" | "done";
  winnerTeam: "A" | "B" | null;
  currentPkSessionId: string | null;
  createdAt: number;
  /** Unix ms: після цього часу матч завершується таймаутом (якщо ще active) */
  matchEndsAt: number;
  /** pick — чекаємо вибір цілі атакуючим; fighting — активний PK */
  phase: TvtMatchPhase;
  /** Чия черга обирати противника */
  attackingTeam: "A" | "B";
  /** Хто має викликати pick-target (голова черги attackingTeam) */
  pendingAttackerId: string | null;
  pickedDefenderId: string | null;
  /** Остання активність фази вибору (AFK → авто-ціль) */
  lastPickActivityAt: number;
};

export type TvtParticipantLite = { id: string; name: string; level: number };
