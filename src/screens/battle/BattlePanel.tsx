import React from "react";
import { BattleTargetCard } from "./BattleTargetCard";
import { BuffBar } from "./BuffBar";
import { BattleLog } from "./BattleLog";
import type { BattleBuff } from "../../state/battle/types";

/** Спільні стилі панелі бою (моб, PK, олімпіада, ТВТ, арена) */
const lineGold = "border-t border-[#c7ad80]/80";
const lineGoldThick = "border-t-2 border-[#c7ad80]";
const pad = "px-3";
const dividerGold = <div className="border-t-2 border-[#c7ad80]/80 mt-2" />;
const boxBlue =
  "rounded-lg border-2 border-[#4aa3ff]/70 bg-black/25 shadow-[inset_0_0_12px_rgba(74,163,255,0.18)] overflow-hidden";

export interface BattlePanelTarget {
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
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
}: BattlePanelProps) {
  if (victoryContent) {
    return (
      <div className="w-full text-white py-2">
        <div className="w-full max-w-[360px] mx-auto">
          {victoryContent}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-white pt-0 pb-2">
      <div className="w-full max-w-[360px] mx-auto">
        {/* Картка цілі */}
        <div className={`${lineGold} pt-2`}>
          <div className={pad}>
            <div className="flex justify-center -mt-1">
              <BattleTargetCard
                name={target.name}
                level={target.level}
                currentHp={target.currentHp}
                maxHp={target.maxHp}
              />
            </div>
          </div>
        </div>

        {/* Бари бафів */}
        <div className={`${lineGold} pt-3`}>
          <div className={pad}>
            <BuffBar buffs={buffs} now={now} />
          </div>
        </div>

        {/* Панель навичок (передається ззовні) */}
        {children != null && (
          <div className={lineGold}>
            <div className={pad}>{children}</div>
          </div>
        )}

        {/* Лог бою */}
        <div className="mt-3 px-3">
          <div className="text-[12px] text-[#c7ad80] font-semibold mb-2">Лог бою:</div>
          <div className={`${boxBlue} w-full`}>
            <div className="px-3 py-2 text-[11px] leading-4">
              <BattleLog noBorder lines={log} />
            </div>
          </div>
        </div>

        {/* Нижній блок + кнопка назад */}
        <div className="mt-4">
          {showBackButton && onBack && (
            <div className={`${pad} flex gap-2 justify-center`}>
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 bg-yellow-600 rounded text-black text-sm"
              >
                {backLabel}
              </button>
            </div>
          )}
          <div className={pad}>{dividerGold}</div>
        </div>
      </div>
    </div>
  );
}
