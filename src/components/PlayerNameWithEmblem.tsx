import React from "react";
import { ClanEmblem } from "../utils/clanEmblem";
import { getNickColorStyle, isAdminNickName, ADMIN_NICK_CLASS } from "../utils/nickColor";
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
  size = 10,
  className = "",
  onClick,
}: PlayerNameWithEmblemProps) {
  const emblem = clan?.emblem || null;

  const style = getNickColorStyle(playerName, hero || null, nickColor || undefined);
  const adminClass = isAdminNickName(playerName) ? ` ${ADMIN_NICK_CLASS}` : "";

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} onClick={onClick}>
      {emblem && <ClanEmblem emblem={emblem} size={size} />}
      <span className={adminClass} style={style}>
        {playerName}
      </span>
    </span>
  );
}
