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
  "rounded-lg border border-[#6b5a3e]/55 bg-[linear-gradient(180deg,rgba(18,14,10,0.92)_0%,rgba(6,5,4,0.96)_100%)] shadow-[inset_0_1px_0_rgba(199,173,128,0.14),inset_0_-8px_24px_rgba(0,0,0,0.35)] overflow-hidden";
const skillStripL2 =
  "rounded-lg border border-[#5c4a32]/45 bg-[radial-gradient(ellipse_95%_55%_at_50%_0%,rgba(199,173,128,0.1)_0%,transparent_58%),linear-gradient(180deg,#16120e_0%,#0a0907_100%)] px-2 py-2 shadow-[inset_0_1px_0_rgba(199,173,128,0.08),0_0_20px_rgba(0,0,0,0.45)]";
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
  /** Дебафи на цілі (PvE: useBattleStore.mobBuffs). Для PK/арени зазвичай порожньо. */
  targetDebuffs?: BattleBuff[];
  /** Бафи героя — один спільний BuffBar для мобів, PK і PvP-арени (див. JSDoc BattlePanel). */
  buffs: BattleBuff[];
  /** Поточний час (мс) для таймерів бафів */
  now: number;
  /** Лог бою. Якщо не передано — BattleLog читає з useBattleStore */
  log?: string[];
  /** Панель навичок: SkillBar; у PK/арені той самий компонент з onUseSkillOverride. Не потрібно при victoryContent. */
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
 * Два BuffBar: дебафи на цілі (targetDebuffs, PvE) та бафи героя (buffs); для PK targetDebuffs не передають.
 */
export function BattlePanel({
  target,
  targetDebuffs,
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
            <div className="flex flex-col items-center gap-2">
              <BuffBar buffs={targetDebuffs ?? []} now={now} />
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
        </div>

        <div className={`${line} pt-3 mt-[2cm]`}>
          <div className={pad}>
            <BuffBar buffs={buffs} now={now} />
          </div>
        </div>

        {children != null && (
          <div className={line}>
            <div className={pad}>
              {isL2 ? <div className={skillStripL2}>{children}</div> : children}
            </div>
          </div>
        )}

        <div className="mt-3 px-3">
          <div
            className={
              isL2
                ? "text-[11px] uppercase tracking-[0.12em] text-[#d4b878] font-semibold mb-2 flex items-center gap-2"
                : "text-[12px] text-[#c7ad80] font-semibold mb-2"
            }
          >
            {isL2 && <span className="h-px flex-1 max-w-[48px] bg-gradient-to-r from-[#c7ad80]/50 to-transparent" aria-hidden />}
            Лог бою
            {isL2 && <span className="h-px flex-1 bg-gradient-to-l from-[#c7ad80]/50 to-transparent" aria-hidden />}
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
