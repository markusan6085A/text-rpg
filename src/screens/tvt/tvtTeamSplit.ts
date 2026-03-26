import type { TvtParticipant, TvtSplitResult, TvtTeamMode } from "./tvtTypes";

/**
 * 2 гравці → 1v1, 4 → 2v2, 5 → 2+3.
 * Інші кількості — рівномірний поділ (перша половина / друга), режим узагальнено.
 */
export function splitTvtTeams(participants: TvtParticipant[]): TvtSplitResult | null {
  const n = participants.length;
  if (n < 2) return null;

  if (n === 2) {
    return {
      mode: "1v1",
      teamA: [participants[0]],
      teamB: [participants[1]],
    };
  }
  if (n === 4) {
    return {
      mode: "2v2",
      teamA: [participants[0], participants[1]],
      teamB: [participants[2], participants[3]],
    };
  }
  if (n === 5) {
    return {
      mode: "2v3",
      teamA: [participants[0], participants[1]],
      teamB: [participants[2], participants[3], participants[4]],
    };
  }

  const half = Math.ceil(n / 2);
  const mode: TvtTeamMode = n <= 3 ? "1v1" : n <= 6 ? "2v2" : "2v3";
  return {
    mode,
    teamA: participants.slice(0, half),
    teamB: participants.slice(half),
  };
}

export function teamModeLabel(mode: TvtTeamMode): string {
  switch (mode) {
    case "1v1":
      return "1×1";
    case "2v2":
      return "2×2";
    case "2v3":
      return "2×3";
    default:
      return mode;
  }
}
