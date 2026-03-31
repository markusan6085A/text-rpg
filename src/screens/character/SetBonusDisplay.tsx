import React from "react";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";

/** Рендерить текст бонусів сету з статами фіолетовим кольором */
export function SetBonusDisplay({ text, className = "" }: { text: string; className?: string }) {
  const isL2 = isWarmCityUi(getCityUiVariant());
  const lines = text.split("\n");
  return (
    <div className={`whitespace-pre-line ${isL2 ? "text-[#d4c4a8]" : ""} ${className}`}>
      {lines.map((line, i) => {
        const colonSpace = ": ";
        const idx = line.indexOf(colonSpace);
        if (idx >= 0 && (line.startsWith("Повний сет") || line.startsWith("Частковий сет"))) {
          const label = line.slice(0, idx + colonSpace.length);
          const bonuses = line.slice(idx + colonSpace.length).trim();
          if (bonuses) {
            return (
              <div key={i}>
                {label}<span className="text-purple-400">{bonuses}</span>
              </div>
            );
          }
        }
        return <div key={i}>{line}</div>;
      })}
    </div>
  );
}
