import React from "react";
import { getEmblemPath } from "../data/clanEmblems";

interface ClanEmblemProps {
  emblem: string | null | undefined;
  size?: number;
  className?: string;
}

/**
 * Компонент для відображення емблеми клану
 */
export function ClanEmblem({ emblem, size = 10, className = "" }: ClanEmblemProps) {
  if (!emblem) return null;

  const emblemPath = getEmblemPath(emblem);
  if (!emblemPath) return null;

  return (
    <img
      src={emblemPath}
      alt=""
      className={`inline-block object-contain ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, verticalAlign: "middle" }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

/**
 * Утиліта для отримання емблеми клану гравця
 */
export function getPlayerClanEmblem(hero: any, myClan: any): string | null {
  if (!hero || !myClan) return null;
  return myClan.emblem || null;
}
