import React from "react";
import { ClanEmblem } from "../utils/clanEmblem";
import { getNickColorStyle } from "../utils/nickColor";
import type { Hero } from "../types/Hero";
import type { Clan } from "../utils/api";

interface PlayerNameWithEmblemProps {
  playerName: string;
  hero?: Hero | null;
  clan?: Clan | null;
  nickColor?: string | null;
  size?: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Компонент для відображення ніка гравця з емблемою клану
 */
export function PlayerNameWithEmblem({
  playerName,
  hero,
  clan,
  nickColor,
  size = 5,
  className = "",
  onClick,
}: PlayerNameWithEmblemProps) {
  const emblem = clan?.emblem || null;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} onClick={onClick}>
      {emblem && <ClanEmblem emblem={emblem} size={size} />}
      <span style={getNickColorStyle(playerName, hero || null, nickColor || undefined)}>
        {playerName}
      </span>
    </span>
  );
}
