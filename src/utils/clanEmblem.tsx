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
    <span
      className={`inline-block ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        verticalAlign: "middle",
        backgroundColor: "#1D1C1A", // Фон зовнішньої рамки сторінки (.l2-frame)
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "2px",
      }}
    >
      <img
        src={emblemPath}
        alt=""
        className="object-contain"
        style={{
          width: "100%",
          height: "100%",
          maxWidth: `${size}px`,
          maxHeight: `${size}px`,
        }}
        onError={(e) => {
          console.error(`[ClanEmblem] Failed to load emblem: ${emblemPath}`);
          (e.target as HTMLImageElement).style.display = "none";
        }}
        onLoad={() => {
          // Діагностика: виводимо в консоль, коли зображення завантажилося
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ClanEmblem] Successfully loaded emblem: ${emblemPath}`);
          }
        }}
      />
    </span>
  );
}

/**
 * Утиліта для отримання емблеми клану гравця
 */
export function getPlayerClanEmblem(hero: any, myClan: any): string | null {
  if (!hero || !myClan) return null;
  return myClan.emblem || null;
}
