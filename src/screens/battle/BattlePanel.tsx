import React from "react";
import { BattleTargetCard } from "./BattleTargetCard";
import { BuffBar } from "./BuffBar";
import { BattleLog } from "./BattleLog";
import type { BattleBuff } from "../../state/battle/types";

/** Спільні стилі панелі бою (моб, PK, олімпіада, ТВТ, арена) */
const lineGold = "border-t border-[#c7ad80]/80";
const lineGoldThick = "border-t-2 border-[#c7ad80]";
const lineGoldL2 = "border-t border-[#c7ad80]/25";
const pad = "px-3";
const dividerGold = <div className="border-t-2 border-[#c7ad80]/80 mt-2" />;
const dividerGoldL2 = <div className="border-t border-[#c7ad80]/20 mt-2" />;
const boxBlue =
  "rounded-lg border-2 border-[#4aa3ff]/70 bg-black/25 shadow-[inset_0_0_12px_rgba(74,163,255,0.18)] overflow-hidden";
const boxLogL2 =
  "rounded-lg border border-[#5c4a32]/70 bg-black/35 shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] overflow-hidden";
const l2Frame =
  "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

export interface BattlePanelTarget {
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  /** Патрульний моб — суфікс (агр) у картці цілі */
  isAggressivePatrol?: boolean;
}

export interface BattlePanelProps {
  /** Ціль (моб або гравець) */
  target: BattlePanelTarget;
  /** Бафи героя для BuffBar */
  buffs: BattleBuff[];
  /** Поточний час (мс) для таймерів бафів */
  now: number;
  /** Лог бою. Якщо не передано — BattleLog читає з useBattleStore */
  log?: string[];
  /** Вміст панелі навичок (SkillBar для мобів, PkSkillLoadoutBar для PK тощо). Не потрібно при victoryContent. */
  children?: React.ReactNode;
  /** Кнопка "назад": текст */
  backLabel?: string;
  /** Кнопка "назад": обробник */
  onBack?: () => void;
  /** Показувати кнопку назад (наприклад, при status === "idle") */
  showBackButton?: boolean;
  /** Опційний блок перемоги (нагороди + дії) — рендериться замість основної панелі */
  victoryContent?: React.ReactNode;
  /** Теплий L2-фрейм і лог без «синьої» рамки */
  isL2?: boolean;
}

/**
 * Універсальна панель бою: однаковий вигляд для бою з мобом, PK, олімпіади, ТВТ, арени.
 * Використовуйте цей компонент у Battle.tsx, PkProfileView, та майбутніх екранах олімпіади/арени.
 */
export function BattlePanel({
  target,
  buffs,
  now,
  log,
  children,
  backLabel = "Повернутися",
  onBack,
  showBackButton = false,
  victoryContent,
  isL2 = false,
}: BattlePanelProps) {
  const line = isL2 ? lineGoldL2 : lineGold;
  const logBox = isL2 ? boxLogL2 : boxBlue;
  const bottomDivider = isL2 ? dividerGoldL2 : dividerGold;
  const backBtn = isL2
    ? "px-5 py-2 rounded-md border border-[#5c4a32]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-xs text-[#d4c4a8] shadow-[inset_0_1px_0_rgba(199,173,128,0.1)] hover:border-[#c7ad80]/45 hover:text-[#f4e2b8] active:scale-[0.99] transition-[border-color,color,transform] duration-150"
    : "px-4 py-2 bg-yellow-600 rounded text-black text-sm";

  if (victoryContent) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#e8dcc8]`
            : "w-full text-white py-2"
        }
      >
        <div className={isL2 ? "w-full max-w-[400px] mx-auto" : "w-full max-w-[360px] mx-auto"}>
          {victoryContent}
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-2 text-[#e8dcc8]`
          : "w-full text-white pt-0 pb-2"
      }
    >
      <div className={isL2 ? "w-full max-w-[400px] mx-auto" : "w-full max-w-[360px] mx-auto"}>
        <div className={`${line} pt-2`}>
          <div className={pad}>
            <div className="flex justify-center -mt-1">
              <BattleTargetCard
                name={target.name}
                level={target.level}
                currentHp={target.currentHp}
                maxHp={target.maxHp}
                isAggressivePatrol={target.isAggressivePatrol}
                isL2={isL2}
              />
            </div>
          </div>
        </div>

        <div className={`${line} pt-3`}>
          <div className={pad}>
            <BuffBar buffs={buffs} now={now} />
          </div>
        </div>

        {children != null && (
          <div className={line}>
            <div className={pad}>{children}</div>
          </div>
        )}

        <div className="mt-3 px-3">
          <div
            className={
              isL2
                ? "text-[12px] text-[#e8c56e] font-semibold mb-2"
                : "text-[12px] text-[#c7ad80] font-semibold mb-2"
            }
          >
            Лог бою:
          </div>
          <div className={`${logBox} w-full`}>
            <div className="px-3 py-2 text-[11px] leading-4 text-[#d4c4a8]">
              <BattleLog noBorder lines={log} />
            </div>
          </div>
        </div>

        <div className="mt-4">
          {showBackButton && onBack && (
            <div className={`${pad} flex gap-2 justify-center`}>
              <button type="button" onClick={onBack} className={backBtn}>
                {backLabel}
              </button>
            </div>
          )}
          <div className={pad}>{bottomDivider}</div>
        </div>
      </div>
    </div>
  );
}
