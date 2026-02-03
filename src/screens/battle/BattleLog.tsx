import React from "react";
import { useBattleStore } from "../../state/battle/store";
import { sanitizeLine } from "../../state/battle/helpers";

export const getColor = (line: string) => {
  const lower = line.toLowerCase();
  
  // "Добыча" обробляється окремо в parseDobychaLine, тому пропускаємо тут
  if (lower.includes("добыча:")) {
    return "#d9c4a3"; // бежевий (буде перезаписано в parseDobychaLine)
  }
  
  // Raid Boss повержен - синій
  if (lower.includes("raid boss") && lower.includes("повержен")) {
    return "#3b82f6"; // blue-500
  }
  
  // Моб повержен - помаранчевий (перевіряємо перед квестовими дропами)
  if (lower.includes("повержен") && !lower.includes("raid boss")) {
    return "#ff8c00"; // orange (помаранчевий)
  }
  
  // Квестові дропи - золотистий
  if (lower.includes("квест:")) {
    return "#ffd700"; // gold (золотистий)
  }
  
  // Дроп - темно-жовтий
  if (lower.includes("дроп:") || lower.includes("drop:")) {
    return "#ca8a04"; // yellow-700 (темно-жовтий)
  }
  
  // Fight resumed - сірий
  if (lower.includes("fight resumed")) {
    return "#9ca3af"; // gray-400
  }
  
  // Physical Mirror відбиття урону - світло-синій
  if (lower.includes("physical mirror") || lower.includes("отразил") && lower.includes("обратно")) {
    return "#60a5fa"; // light-blue-400 (світло-синій)
  }
  
  // Використання зілля - синій (перевіряємо перед іншими повідомленнями)
  if ((lower.includes("використали") || lower.includes("использовали")) && 
      (lower.includes("зелье") || lower.includes("potion") || 
       (lower.includes("+") && (lower.includes("hp") || lower.includes("mp"))))) {
    return "#3b82f6"; // blue-500
  }
  
  // Отримання EXP/SP - синій (перевіряємо першим)
  if (lower.includes("получили") && (lower.includes("exp") || lower.includes("sp"))) {
    return "#3b82f6"; // blue-500
  }
  
  // Атака summon - темно-зелений (перевіряємо перед іншими атаками)
  // Summon атакує моба: "Nightshade атакует Swamp Crawler магией и наносит..."
  if (lower.includes("атакует") && (lower.includes("магией") || lower.includes("физической атакой")) && !lower.includes("наносит вам")) {
    return "#047857"; // green-700 (темно-зелений)
  }
  
  // Критичний удар - фіолетовий
  if (lower.includes("критический") || lower.includes("крит") || lower.includes("(крит!)")) {
    return "#a855f7"; // purple-500
  }
  
  // Блок щита - зелений (перевіряємо перед іншими блокуваннями)
  if (lower.includes("щит заблокував") || lower.includes("щит заблокировал")) {
    return "#10b981"; // green-500
  }
  
  // Промах або блокування - зелений (перевіряємо перед "нанес")
  if (lower.includes("промах") || lower.includes("блокируете") || lower.includes("блокируете")) {
    return "#10b981"; // green-500
  }
  
  // Моб б'є гравця - червоний (перевіряємо перед "наносите")
  // "Tainted Lizard Shaman наносит вам 89 урона." або "моб нанес урона"
  if (lower.includes("наносит вам") || (lower.includes("нанес") && (lower.includes("урона") || lower.includes("урон")) && !lower.includes("наносите"))) {
    return "#ef4444"; // red-500
  }
  
  // Удар гравця - сірий
  if (lower.includes("наносите") || (lower.includes("нанес") && lower.includes("урона") && !lower.match(/[а-яё]+ нанес/))) {
    return "#9ca3af"; // gray-400
  }
  
  // Використання скілу - зелений
  if (lower.includes("использовал") || lower.includes("использовали") || lower.includes("применил") || lower.includes("восстановил") || lower.includes("призвали") || lower.includes("применено")) {
    return "#10b981"; // green-500
  }
  
  // За замовчуванням - бежевий
  return "#d9c4a3";
};

// Парсить рядок "Добыча: +550 EXP, +0 SP, +320 адены" і повертає JSX з різними кольорами
const parseDobychaLine = (line: string) => {
  // Більш гнучкий regex, який знаходить всі частини
  const expMatch = line.match(/\+(\d+)\s*EXP/i);
  const spMatch = line.match(/\+(\d+)\s*SP/i);
  const adenaMatch = line.match(/\+(\d+)\s*адены/i);
  
  if (!expMatch && !spMatch && !adenaMatch) return null;

  const exp = expMatch?.[1];
  const sp = spMatch?.[1];
  const adena = adenaMatch?.[1];

  const parts: React.ReactNode[] = [];
  parts.push(<span key="label" style={{ color: "#d9c4a3" }}>Добыча:</span>);

  if (exp) {
    parts.push(<span key="exp-space" style={{ color: "#d9c4a3" }}> </span>);
    parts.push(<span key="exp" style={{ color: "#86efac" }}>+{exp} EXP</span>);
  }
  
  if (sp) {
    parts.push(<span key="sp-comma" style={{ color: "#d9c4a3" }}>, </span>);
    parts.push(<span key="sp" style={{ color: "#ca8a04" }}>+{sp} SP</span>);
  }
  
  if (adena) {
    parts.push(<span key="adena-comma" style={{ color: "#d9c4a3" }}>, </span>);
    parts.push(<span key="adena" style={{ color: "#facc15" }}>+{adena} адены</span>);
  }

  return <div>{parts}</div>;
};

const LOG_MAX_LINES = 10;

export function BattleLog() {
  const { log } = useBattleStore();
  const lines = [...log].slice(-LOG_MAX_LINES);
  return (
    <div
      className="border-2 rounded p-2 bg-black/30"
      style={{ borderColor: "#654321" }}
    >
      <div className="space-y-1 text-[12px] leading-[1.2]">
        {lines.map((line, idx) => {
        const dobychaLine = parseDobychaLine(line);
        if (dobychaLine) {
          return <div key={idx}>{dobychaLine}</div>;
        }
        
        const color = getColor(line);
        return (
          <div key={idx} style={{ color }}>
            {line}
          </div>
        );
      })}
      </div>
    </div>
  );
}
