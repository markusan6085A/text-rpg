import React from "react";
import { ClanEmblem } from "../utils/clanEmblem";
import type { Clan } from "../utils/api";

interface ClanNameWithEmblemProps {
  clan: Clan;
  size?: number;
  className?: string;
}

/**
 * Компонент для відображення назви клану з емблемою
 */
export function ClanNameWithEmblem({
  clan,
  size = 5,
  className = "",
}: ClanNameWithEmblemProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {clan.emblem && <ClanEmblem emblem={clan.emblem} size={size} />}
      <span>{clan.name}</span>
    </span>
  );
}
