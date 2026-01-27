import React, { useState, useEffect, useRef } from "react";
import { getEmblemPath } from "../data/clanEmblems";

interface ClanEmblemProps {
  emblem: string | null | undefined;
  size?: number;
  className?: string;
}

/**
 * Функція для заміни чорного фону в зображенні на #1D1C1A через Canvas
 */
function replaceBlackBackground(image: HTMLImageElement, targetColor: string): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return image.src;

  canvas.width = image.width;
  canvas.height = image.height;

  // Малюємо оригінальне зображення
  ctx.drawImage(image, 0, 0);

  // Отримуємо дані пікселів
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Конвертуємо targetColor (#1D1C1A) в RGB
  const targetR = parseInt(targetColor.slice(1, 3), 16);
  const targetG = parseInt(targetColor.slice(3, 5), 16);
  const targetB = parseInt(targetColor.slice(5, 7), 16);

  // Замінюємо чорні пікселі (близькі до #000000) на targetColor
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Перевіряємо, чи піксель чорний (або дуже темний)
    // Порог: якщо всі канали < 30, вважаємо чорним
    if (r < 30 && g < 30 && b < 30 && a > 0) {
      data[i] = targetR;     // R
      data[i + 1] = targetG; // G
      data[i + 2] = targetB; // B
      // a залишаємо без змін
    }
  }

  // Записуємо змінені дані назад
  ctx.putImageData(imageData, 0, 0);

  // Повертаємо data URL
  return canvas.toDataURL();
}

/**
 * Компонент для відображення емблеми клану
 */
export function ClanEmblem({ emblem, size = 10, className = "" }: ClanEmblemProps) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  if (!emblem) return null;

  const emblemPath = getEmblemPath(emblem);
  if (!emblemPath) return null;

  // Обробляємо зображення при завантаженні
  useEffect(() => {
    if (!imgRef.current) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const processed = replaceBlackBackground(img, "#1D1C1A");
        setProcessedSrc(processed);
      } catch (err) {
        console.error(`[ClanEmblem] Failed to process emblem: ${emblemPath}`, err);
        setProcessedSrc(emblemPath); // Fallback до оригіналу
      }
    };

    img.onerror = () => {
      setProcessedSrc(emblemPath); // Fallback до оригіналу
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
        backgroundColor: "#1D1C1A", // Фон Layout (.l2-frame) - той самий що і на всіх сторінках
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "2px",
      }}
    >
      <img
        ref={imgRef}
        src={processedSrc || emblemPath}
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
