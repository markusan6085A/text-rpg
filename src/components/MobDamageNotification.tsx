import React, { useMemo } from "react";
import { useBattleStore } from "../state/battle/store";

interface MobDamageNotificationProps {
  navigate?: (path: string) => void;
}

export default function MobDamageNotification({ navigate }: MobDamageNotificationProps) {
  const { log, zoneId, mobIndex, status } = useBattleStore();

  // Знаходимо останнє повідомлення про урон від моба
  const lastDamageMessage = useMemo(() => {
    if (!log || log.length === 0) return null;
    
    // Шукаємо повідомлення типу "наносит вам ... урона" або "наносит ... урона"
    for (const line of log) {
      const lower = line.toLowerCase();
      if ((lower.includes("наносит вам") || lower.includes("наносит")) && lower.includes("урона")) {
        // Парсимо назву моба та урон
        const match = line.match(/^([^наносит]+?)\s+наносит\s+(?:вам\s+)?(\d+)\s+урона/);
        if (match) {
          const mobName = match[1].trim();
          const damage = match[2];
          return { mobName, damage, fullText: line };
        }
        // Якщо не знайшли точний match, використовуємо весь рядок
        return { mobName: line.split(" наносит")[0]?.trim() || "", damage: "", fullText: line };
      }
    }
    return null;
  }, [log]);

  // Якщо немає повідомлення або гравець вже в бою, не показуємо
  if (!lastDamageMessage || status === "fighting") {
    return null;
  }

  // Якщо немає zoneId або mobIndex, не можемо навігувати
  if (!zoneId || mobIndex === undefined || !navigate) {
    return null;
  }

  const handleMobNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/battle?zone=${zoneId}&idx=${mobIndex}`);
  };

  return (
    <div 
      className="absolute top-[120px] left-2 z-50 text-[9px] text-red-400"
      style={{
        pointerEvents: "auto",
        maxWidth: "200px",
      }}
    >
      <div className="flex items-center gap-1">
        <span 
          className="font-semibold cursor-pointer hover:underline hover:text-red-300 transition-colors"
          onClick={handleMobNameClick}
        >
          {lastDamageMessage.mobName}
        </span>
        {lastDamageMessage.damage && (
          <>
            <span>наносит</span>
            <span className="text-red-500 font-bold">{lastDamageMessage.damage}</span>
            <span>урона</span>
          </>
        )}
      </div>
    </div>
  );
}
