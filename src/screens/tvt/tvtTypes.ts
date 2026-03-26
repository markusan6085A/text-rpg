/** TvT (Team vs Team) — типи для UI; серверна логіка підключиться пізніше. */

export type TvtParticipant = {
  id: string;
  name: string;
  level?: number;
};

export type TvtTeamMode = "1v1" | "2v2" | "2v3";

export type TvtSplitResult = {
  mode: TvtTeamMode;
  teamA: TvtParticipant[];
  teamB: TvtParticipant[];
};
