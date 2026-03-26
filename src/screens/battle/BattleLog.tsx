import React from "react";
import { useBattleStore } from "../../state/battle/store";
import { useHeroStore } from "../../state/heroStore";
import { getSkillDef } from "../../state/battle/loadout";
import { getCityUiVariant } from "../../utils/cityUiVariant";

/** Замінює skill#N у рядку на назву скіла з skillsDB */
export function replaceSkillIdsWithNames(line: string): string {
  return line.replace(/skill#(\d+)/gi, (_, idStr) => {
    const id = parseInt(idStr, 10);
    const def = getSkillDef(id);
    return def?.name ?? `skill#${id}`;
  });
}

/** Колір рядка логу в PK: мій урон — зелений, урон по мені (противника) — червоний */
export function getColorForPkLine(line: string, myHeroName: string): string {
  const norm = (s: string) => String(s ?? "").trim().toLowerCase();
  const lower = norm(line);
  const myName = norm(myHeroName);

  // Банки (HP, MP, CP)
  if (lower.includes("восстанавливает")) {
    if (lower.includes("hp")) return "#FF6600";
    if (lower.includes("mp")) return "#000080";
    if (lower.includes("cp")) return "#FF9900";
  }

  // Промах
  if (lower.includes("промахивается")) return "#C0C0C0";

  // Крит
  if (lower.includes("критический удар!")) return "#C71585";

  // Проста атака
  if (lower.includes("простая атака")) return "#40826D";

  const isDamageLine = lower.includes("наносит") && lower.includes("урона");
  if (isDamageLine) {
    const m = lower.match(/^(\S+)\s+(использует|атакует)/);
    const actorName = m?.[1] ?? "";
    if (myName && actorName === myName) return "#22c55e"; // green — мій урон
    return "#ef4444"; // red — урон по мені (противник бʼє)
  }
  if (lower.includes("сбежал")) return "#9ca3af";
  return "#d9c4a3";
}

export const getColor = (line: string) => {
  const lower = String(line ?? "").toLowerCase();
  
  // "Добыча" обробляється окремо в parseDobychaLine, тому пропускаємо тут
  if (lower.includes("добыча:")) {
    return "#d9c4a3"; // бежевий (буде перезаписано в parseDobychaLine)
  }
  
  // Raid Boss повержен — теплий акцент (L2-стиль)
  if (lower.includes("raid boss") && lower.includes("повержен")) {
    return "#c9a44c";
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

export function BattleLog({ noBorder, lines: linesProp }: { noBorder?: boolean; lines?: string[] }) {
  const { log, pkSessionId } = useBattleStore();
  const heroName = useHeroStore((s) => s.hero?.name ?? "");
  const isPk = Boolean(pkSessionId);
  // Лог зберігається як [найновіше, ...старіші]. Показуємо перші 10 = 10 останніх повідомлень; нові з’являються, старі зникають.
  const fromStore = [...(Array.isArray(log) ? log : [])].slice(0, LOG_MAX_LINES);
  const lines = linesProp != null ? linesProp.slice(0, LOG_MAX_LINES) : fromStore;
  const content = (
    <div className="space-y-1 text-[12px] leading-[1.2]">
      {lines.map((line, idx) => {
        const lineStr = String(line ?? "");
        const dobychaLine = parseDobychaLine(lineStr);
        if (dobychaLine) {
          return <div key={idx}>{dobychaLine}</div>;
        }
        let displayLine = isPk ? replaceSkillIdsWithNames(lineStr) : lineStr;
        const color = isPk ? getColorForPkLine(displayLine, heroName ?? "") : getColor(lineStr);
        // Не використовувати includes("наносит") — підрядок входить у «наносите» (ваш урон), інакше «По вам:» з’являється на «Вы наносите…».
        const isIncoming =
          isPk &&
          (() => {
            const lower = lineStr.toLowerCase();
            if (
              lower.includes("вы наносите") ||
              lower.includes("вы нанесли") ||
              lower.includes("ви наносите") ||
              lower.includes("ви нанесли")
            ) {
              return false;
            }
            if (lower.includes("наносит вам")) return true;
            const m = lineStr.match(/^(\S+)\s+(использует|атакует)/i);
            const norm = (s: string) => String(s ?? "").trim().toLowerCase();
            const actorName = norm(m?.[1] ?? "");
            const myName = norm(heroName ?? "");
            if (!myName || !m) return false;
            return actorName !== myName;
          })();
        if (isIncoming) displayLine = "По вам: " + displayLine;
        return (
          <div key={idx} style={{ color }}>
            {displayLine}
          </div>
        );
      })}
    </div>
  );
  if (noBorder) return content;
  const isL2 = getCityUiVariant() === "l2";
  return (
    <div
      className={
        isL2
          ? "border rounded p-2 bg-black/35 border-[#5c4a32]/70 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)]"
          : "border-2 rounded p-2 bg-black/30"
      }
      style={isL2 ? undefined : { borderColor: "rgba(255,255,255,0.5)" }}
    >
      {content}
    </div>
  );
}
