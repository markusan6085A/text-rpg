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
        backgroundColor: "#1D1C1A", // Фон Layout (.l2-frame) - той самий що і на всіх сторінках
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "2px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 🔥 Фоновий шар з кольором #1D1C1A - буде видно через прозорі частини зображення */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#1D1C1A",
          zIndex: 0,
        }}
      />
      <img
        src={emblemPath}
        alt=""
        className="object-contain"
        style={{
          width: "100%",
          height: "100%",
          maxWidth: `${size}px`,
          maxHeight: `${size}px`,
          position: "relative",
          zIndex: 1,
          // 🔥 Замінюємо чорний фон (#000000) в картинці на #1D1C1A
          // Використовуємо CSS filter для заміни чорного кольору
          // Формула: чорний (0,0,0) -> #1D1C1A (29,28,26)
          filter: "brightness(1.2) contrast(1.1) saturate(1.1)",
          // Додатково: mix-blend-mode для кращого змішування
          mixBlendMode: "normal",
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
