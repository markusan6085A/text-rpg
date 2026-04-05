import React from "react";
import { useBattleStore } from "../../state/battle/store";
import { useHeroStore } from "../../state/heroStore";
import { getSkillDef } from "../../state/battle/loadout";
import { useCityUiVariant } from "../../utils/cityUiVariant";
import { getLootIconPathForDisplayName } from "../../utils/lootIconPath";

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

/** PvE-бій: порядок правил важливий (специфічні шаблони перед загальними). */
export function getPveBattleLogColor(line: string): string {
  const t = String(line ?? "").trim();
  const lower = t.toLowerCase();

  if (lower.startsWith("перемога!")) return "#22c55e";
  if (lower.startsWith("знайдено:")) return "#FFFF00";
  if (lower.startsWith("отримано:") && lower.includes("exp") && lower.includes("sp")) return "#FFBA00";

  if (lower.includes("physical mirror") || (lower.includes("відбиває") && lower.includes("урону"))) {
    return "#60a5fa";
  }

  if (lower.includes("ви використовуєте")) return "#177245";

  if (lower.includes("накладає на вас")) return "#900020";

  if (lower.includes("ви ухилилися")) return "#A9A9A9";

  if (lower.includes("промахнувся")) return "#2F4F4F";

  if (lower.includes("ви наносите") && lower.includes("урону")) return "#CD00CD";

  if (lower.includes("ви отримуєте") && lower.includes("урону")) return "#B7410E";

  if (lower.includes("ваша аура [") && lower.includes("закінчилася")) return "#120A8F";

  return getColor(line);
}

export const getColor = (line: string) => {
  const lower = String(line ?? "").toLowerCase();
  
  // "Добыча" / «получил» / «Выпало» — окремі парсери з іконками
  if (lower.includes("добыча:")) {
    return "#d9c4a3"; // бежевий (буде перезаписано в parseDobychaLine)
  }
  if (/^выпало:/i.test(lower)) return "#e8dcc8";
  if (lower.includes("получил") && lower.includes(" exp ") && lower.includes(" и ")) return "#e8dcc8";
  
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

const ICON_EXP = "/victory/exp.png";
const ICON_SP = "/victory/sp.png";
const ICON_ADENA = "/assets/adena.png";

function inlineLootIcon(src: string) {
  return (
    <img
      src={src}
      alt=""
      className="inline-block w-3.5 h-3.5 opacity-95 align-[-0.15em] mx-0.5 shrink-0"
    />
  );
}

/** Частка союзника в пати: «Нік получил 612 EXP, 187 аден и 34 SP.» */
const parsePartyMemberShareLine = (line: string): React.ReactNode | null => {
  const m = line.match(
    /^(.+?)\s+получил\s+(.+?)\s+EXP,\s+(.+?)\s+аден\s+и\s+(.+?)\s+SP\.?$/i
  );
  if (!m) return null;
  const [, name, expNum, adenaNum, spNum] = m;
  return (
    <div className="text-[#e8dcc8]">
      <span className="text-[#c4b498] font-medium">{name.trim()}</span>
      <span> получил </span>
      <span className="inline-flex items-baseline gap-0 text-[#86efac] font-medium">
        {inlineLootIcon(ICON_EXP)}
        <span className="tabular-nums">{expNum.trim()}</span>
        <span> EXP, </span>
      </span>
      <span className="inline-flex items-baseline gap-0 text-[#facc15] font-medium">
        {inlineLootIcon(ICON_ADENA)}
        <span className="tabular-nums">{adenaNum.trim()}</span>
        <span> аден и </span>
      </span>
      <span className="inline-flex items-baseline gap-0 text-[#ca8a04] font-medium">
        {inlineLootIcon(ICON_SP)}
        <span className="tabular-nums">{spNum.trim()}</span>
        <span> SP.</span>
      </span>
    </div>
  );
};

const parsePoluchilLine = (line: string): React.ReactNode | null => {
  const m = line.match(/^(.+?)\s+получил\s+(.+?)\s+EXP\s+и\s+(.+?)\s+SP$/i);
  if (!m) return null;
  const [, hero, expNum, spNum] = m;
  return (
    <div className="text-[#e8dcc8]">
      <span>{hero} получил </span>
      <span className="inline-flex items-baseline gap-0 text-[#86efac] font-medium">
        {inlineLootIcon(ICON_EXP)}
        <span className="tabular-nums">{expNum}</span>
        <span> EXP</span>
      </span>
      <span> и </span>
      <span className="inline-flex items-baseline gap-0 text-[#ca8a04] font-medium">
        {inlineLootIcon(ICON_SP)}
        <span className="tabular-nums">{spNum}</span>
        <span> SP</span>
      </span>
    </div>
  );
};

const parseVypaloLine = (line: string): React.ReactNode | null => {
  const m = line.match(/^Выпало:\s*(.+)\s+адены?,\s*(.+)\s+EXP\s+и\s+(.+)\s+SP$/i);
  if (!m) return null;
  const [, adenaNum, expNum, spNum] = m;
  return (
    <div className="text-[#e8dcc8]">
      <span className="text-[#d9c4a3]">Выпало:</span>
      <span className="inline-flex items-baseline gap-0 text-[#facc15] font-medium ml-1">
        {inlineLootIcon(ICON_ADENA)}
        <span className="tabular-nums">{adenaNum.trim()}</span>
        <span> аден,</span>
      </span>
      <span> </span>
      <span className="inline-flex items-baseline gap-0 text-[#86efac] font-medium">
        {inlineLootIcon(ICON_EXP)}
        <span className="tabular-nums">{expNum.trim()}</span>
        <span> EXP и </span>
      </span>
      <span className="inline-flex items-baseline gap-0 text-[#ca8a04] font-medium">
        {inlineLootIcon(ICON_SP)}
        <span className="tabular-nums">{spNum.trim()}</span>
        <span> SP</span>
      </span>
    </div>
  );
};

/** «Бій розпочато: [Ім’я] (ур. N)» / «Бій відновлено: …» — ім’я моба акцентним кольором. */
const parseBattleStartLine = (line: string): React.ReactNode | null => {
  const m = line.match(/^Бій (розпочато|відновлено):\s*\[(.+?)\]\s*\(ур\.\s*(\d+)\)\s*$/);
  if (!m) return null;
  const [, verb, mobName, lvl] = m;
  return (
    <div style={{ color: "#d9c4a3" }}>
      Бій {verb}:{" "}
      <span style={{ color: "#5D8AA8", fontWeight: 600 }}>[{mobName}]</span>{" "}
      (ур. {lvl})
    </div>
  );
};

/** Книги гільдії магів: повідомлення з mysticSpellbookDrops (не префікс «Дроп:»). Без емодзі — одна іконка предмета. */
const parseSpellbookLootLine = (line: string): React.ReactNode | null => {
  const m = line.match(/^(?:📕\s*)?Книга заклинания:\s*(.+)$/i);
  if (!m) return null;
  const rawName = m[1].trim();
  const icon = getLootIconPathForDisplayName(rawName);
  return (
    <div style={{ color: "#ca8a04" }} className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
      {icon ? inlineLootIcon(icon) : null}
      <span>
        Книга заклинания: {rawName}
      </span>
    </div>
  );
};

const parseLootKindDropLine = (line: string): React.ReactNode | null => {
  const m = line.match(/^(Дроп|Спойл|Квест):\s*(.+)$/i);
  if (!m) return null;
  const kind = m[1];
  const rest = m[2];
  const m2 = rest.match(/^(.+?)\s+x(\d+)([\s\S]*)$/);
  if (!m2) return null;
  const rawName = m2[1].trim();
  const count = m2[2];
  const tail = m2[3] || "";
  const icon = getLootIconPathForDisplayName(rawName);
  const color = getColor(line);
  return (
    <div style={{ color }} className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
      {icon ? inlineLootIcon(icon) : null}
      <span>
        {kind}: {rawName} x{count}
        {tail}
      </span>
    </div>
  );
};

const LOG_MAX_LINES = 10;

export function BattleLog({
  noBorder,
  lines: linesProp,
  maxLines,
}: {
  noBorder?: boolean;
  lines?: string[];
  /** Якщо задано (наприклад екран перемоги) — більше рядків, щоб вмістити весь дроп. */
  maxLines?: number;
}) {
  const { log, pkSessionId } = useBattleStore();
  const heroName = useHeroStore((s) => s.hero?.name ?? "");
  const cityUi = useCityUiVariant();
  const isModern = cityUi !== "classic";
  const isBattleTest = cityUi === "l2test";
  const isPk = Boolean(pkSessionId);
  const cap = maxLines ?? LOG_MAX_LINES;
  // Лог зберігається як [найновіше, ...старіші]. Показуємо перші N = N останніх повідомлень; нові з’являються, старі зникають.
  const fromStore = [...(Array.isArray(log) ? log : [])].slice(0, cap);
  const lines = linesProp != null ? linesProp.slice(0, cap) : fromStore;
  const content = (
    <div className="space-y-1 text-[12px] leading-[1.35]">
      {lines.map((line, idx) => {
        const lineStr = String(line ?? "");
        const battleStart = parseBattleStartLine(lineStr);
        if (battleStart) {
          return <div key={idx}>{battleStart}</div>;
        }
        const dobychaLine = parseDobychaLine(lineStr);
        if (dobychaLine) {
          return <div key={idx}>{dobychaLine}</div>;
        }
        const partyShare = parsePartyMemberShareLine(lineStr);
        if (partyShare) {
          return <div key={idx}>{partyShare}</div>;
        }
        const poluchil = parsePoluchilLine(lineStr);
        if (poluchil) {
          return <div key={idx}>{poluchil}</div>;
        }
        const vypalo = parseVypaloLine(lineStr);
        if (vypalo) {
          return <div key={idx}>{vypalo}</div>;
        }
        const spellbookLine = parseSpellbookLootLine(lineStr);
        if (spellbookLine) {
          return <div key={idx}>{spellbookLine}</div>;
        }
        const lootDrop = parseLootKindDropLine(lineStr);
        if (lootDrop) {
          return <div key={idx}>{lootDrop}</div>;
        }
        let displayLine = replaceSkillIdsWithNames(lineStr);
        const color = isPk
          ? getColorForPkLine(displayLine, heroName ?? "")
          : getPveBattleLogColor(lineStr);
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
  return (
    <div
      className={
        isBattleTest
          ? "border rounded p-2 bg-black/40 border-cyan-950/55 shadow-[inset_0_3px_10px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(94,234,212,0.08)]"
          : isModern
            ? "border rounded p-2 bg-black/35 border-[#5c4a32]/70 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)]"
            : "border-2 rounded p-2 bg-black/30"
      }
      style={isModern ? undefined : { borderColor: "rgba(255,255,255,0.5)" }}
    >
      {content}
    </div>
  );
}
