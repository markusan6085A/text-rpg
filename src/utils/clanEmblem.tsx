import React, { useState, useEffect, useRef } from "react";
import { getEmblemPath } from "../data/clanEmblems";

interface ClanEmblemProps {
  emblem: string | null | undefined;
  size?: number;
  className?: string;
}

/**
 * Замінює чорний фон у зображенні на прозорий — фон успадковується з батька, як скрізь в інтерфейсі
 */
function replaceBlackWithTransparent(image: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return image.src;

  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Чорні/дуже темні пікселі — робимо прозорими, щоб видно було фон
    if (r < 30 && g < 30 && b < 30) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

/**
 * Компонент для відображення емблеми клану
 */
export function ClanEmblem({ emblem, size = 10, className = "" }: ClanEmblemProps) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState(false);

  if (!emblem) return null;

  const emblemPath = getEmblemPath(emblem);
  if (!emblemPath) return null;

  // Обробляємо зображення при завантаженні
  useEffect(() => {
    const img = new Image();
    // Не встановлюємо crossOrigin для локальних файлів (з того ж домену)
    // img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        // Перевіряємо, чи зображення завантажилося
        if (img.width === 0 || img.height === 0) {
          setProcessingError(true);
          return;
        }
        const processed = replaceBlackWithTransparent(img);
        setProcessedSrc(processed);
      } catch (err) {
        console.error(`[ClanEmblem] Failed to process emblem: ${emblemPath}`, err);
        setProcessingError(true);
      }
    };

    img.onerror = () => {
      console.error(`[ClanEmblem] Failed to load emblem for processing: ${emblemPath}`);
      setProcessingError(true);
    };

    img.src = emblemPath;
  }, [emblemPath]);

  return (
    <span
      className={`inline-block ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        verticalAlign: "middle",
        backgroundColor: "transparent", // Успадковує фон батька — однаковий з усім інтерфейсом
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "2px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Фон прозорий — через прозорі частини зображення видно фон чату/сторінки */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "transparent",
          zIndex: 0,
        }}
      />
      <img
        src={processingError ? emblemPath : (processedSrc || emblemPath)}
        alt=""
        className="object-contain"
        style={{
          width: "100%",
          height: "100%",
          maxWidth: `${size}px`,
          maxHeight: `${size}px`,
          position: "relative",
          zIndex: 1,
          // 🔥 CSS filter для заміни чорного фону на #252422 (темніший варіант)
          // Якщо Canvas не спрацював - застосовуємо затемнюючий filter
          filter: processingError || !processedSrc 
            ? "brightness(0.55) contrast(1.0)" // Затемнюємо фон ще більше для кращого збігу з #252422
            : "none", // Якщо Canvas обробив - не застосовуємо filter
          // Не використовуємо mix-blend-mode, щоб не освітлювати зображення
          mixBlendMode: "normal",
        }}
        onError={(e) => {
          console.error(`[ClanEmblem] Failed to load emblem: ${emblemPath}`);
          (e.target as HTMLImageElement).style.display = "none";
        }}
        onLoad={() => {
          // Діагностика: виводимо в консоль, коли зображення завантажилося
          if (import.meta.env.DEV) {
            console.log(`[ClanEmblem] Successfully loaded emblem: ${emblemPath}`, {
              processed: !!processedSrc,
              error: processingError
            });
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
