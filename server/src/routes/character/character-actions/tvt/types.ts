export type TvtMatchState = {
  id: string;
  dayKey: string;
  slotId: string;
  /** Початковий склад команд (для нагород і UI) */
  teamAIds: string[];
  teamBIds: string[];
  /** Черги: переможець лишається, переможений вилітає з черги суперників */
  queueA: string[];
  queueB: string[];
  status: "active" | "done";
  winnerTeam: "A" | "B" | null;
  currentPkSessionId: string | null;
  createdAt: number;
};

export type TvtParticipantLite = { id: string; name: string; level: number };
