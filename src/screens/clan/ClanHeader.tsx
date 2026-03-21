import React from "react";
import { type Clan } from "../../utils/api";
import { useHeroStore } from "../../state/heroStore";
import { ClanNameWithEmblem } from "../../components/ClanNameWithEmblem";
import { handleNumberInput } from "../../utils/numberInput";
import { getCityUiVariant } from "../../utils/cityUiVariant";

interface ClanHeaderProps {
  clan: Clan;
  depositAmount: string;
  withdrawAdenaAmount: string;
  coinLuckAmount: string;
  coinLuckAction: "deposit" | "withdraw";
  isLeader: boolean;
  onDepositAmountChange: (value: string) => void;
  onWithdrawAdenaAmountChange: (value: string) => void;
  onCoinLuckAmountChange: (value: string) => void;
  onCoinLuckActionChange: (action: "deposit" | "withdraw") => void;
  onDepositAdena: () => void;
  onWithdrawAdena: () => void;
  onCoinLuckAction: () => void;
}

export default function ClanHeader({
  clan,
  depositAmount,
  withdrawAdenaAmount,
  coinLuckAmount,
  coinLuckAction,
  isLeader,
  onDepositAmountChange,
  onWithdrawAdenaAmountChange,
  onCoinLuckAmountChange,
  onCoinLuckActionChange,
  onDepositAdena,
  onWithdrawAdena,
  onCoinLuckAction,
}: ClanHeaderProps) {
  const isL2 = getCityUiVariant() === "l2";
  const sepT = isL2 ? "border-t border-[#5c4a32]/45" : "border-t border-white/50";
  const sepB = isL2 ? "border-b border-[#5c4a32]/45" : "border-b border-white/50";
  const labelCls = isL2 ? "text-[#c9a44c]" : "text-[#c7ad80]";
  const valueCls = isL2 ? "text-[#e8dcc8]" : "text-white";
  const inputCls = isL2
    ? "flex-1 px-2 py-1 bg-[#0f0a06] border border-[#5c4a32]/50 text-[#e8dcc8] rounded"
    : "flex-1 px-2 py-1 bg-[#2a2a2a] border border-white/50 text-white rounded";

  return (
    <>
      {/* Риска вище назви клану */}
      <div className={sepT} />

      {/* Назва клану */}
      <div className={isL2 ? "text-center text-[16px] font-semibold text-[#e8c56e]" : "text-center text-[16px] font-semibold text-[#f4e2b8]"}>
        <ClanNameWithEmblem clan={clan} size={12} />
      </div>

      {/* Риска нижче назви клану */}
      <div className={sepB} />

      {/* Емблема клану (clanns.png) */}
      <div className="flex justify-center">
        <img
          src="/icons/clanns.png"
          alt="Клан"
          className="w-48 h-48 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/icons/clann.jpg";
          }}
        />
      </div>

      {/* Статистика клану */}
      <div className="space-y-1 text-[12px]">
        <div className="flex justify-between">
          <span className={labelCls}>Уровень:</span>
          <span className={valueCls}>{clan.level}</span>
        </div>
        <div className="flex justify-between">
          <span className={labelCls}>Лидер:</span>
          <span className={valueCls}>{clan.creator.name}</span>
        </div>
        <div className="flex justify-between">
          <span className={labelCls}>Репутация:</span>
          <span className={valueCls}>{clan.reputation}</span>
        </div>
        <div className="flex justify-between">
          <span className={labelCls}>Основан:</span>
          <span className={valueCls}>
            {new Date(clan.createdAt).toLocaleDateString("ru-RU")}
          </span>
        </div>
        {clan.announcement && clan.announcement.trim() && (
          <div
            className={
              isL2
                ? "p-2 bg-black/25 border border-[#5c4a32]/50 rounded text-[11px] text-[#c9a44c] whitespace-pre-wrap"
                : "p-2 bg-[#1a1a1a] border border-white/30 rounded text-[11px] text-[#c7ad80] whitespace-pre-wrap"
            }
          >
            {clan.announcement}
          </div>
        )}
        <div>
          <div className="flex justify-between">
            <span className={labelCls}>Адена:</span>
            <span className={valueCls}>{clan.adena.toLocaleString("ru-RU")}</span>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => onDepositAmountChange("0")}
              className="text-[10px] text-[#c7ad80] hover:text-white transition-colors"
            >
              положить
            </button>
            {isLeader && (
              <button
                onClick={() => onWithdrawAdenaAmountChange("0")}
                className="text-[10px] text-[#c7ad80] hover:text-white transition-colors"
              >
                забрать
              </button>
            )}
          </div>
        </div>
        {depositAmount !== "" && (
          <div className="flex gap-2 items-center text-[11px]">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => {
                const newValue = handleNumberInput(depositAmount, e.target.value);
                onDepositAmountChange(newValue);
              }}
              onFocus={(e) => e.target.select()}
              className={inputCls}
              placeholder="Сумма"
              autoFocus
            />
            <button
              onClick={onDepositAdena}
              className={
                isL2
                  ? "text-[11px] text-[#c9a44c] hover:text-[#e8c56e] transition-colors"
                  : "text-[11px] text-[#c7ad80] hover:text-white transition-colors"
              }
            >
              OK
            </button>
            <button
              onClick={() => onDepositAmountChange("")}
              className="text-[11px] text-red-600 hover:text-red-500 transition-colors"
            >
              Отмена
            </button>
          </div>
        )}
        {withdrawAdenaAmount !== "" && isLeader && (
          <div className="flex gap-2 items-center text-[11px]">
            <input
              type="number"
              value={withdrawAdenaAmount}
              onChange={(e) => {
                const newValue = handleNumberInput(withdrawAdenaAmount, e.target.value);
                onWithdrawAdenaAmountChange(newValue);
              }}
              onFocus={(e) => e.target.select()}
              className={inputCls}
              placeholder="Сумма для вывода"
              autoFocus
            />
            <button
              onClick={onWithdrawAdena}
              className={
                isL2
                  ? "text-[11px] text-[#c9a44c] hover:text-[#e8c56e] transition-colors"
                  : "text-[11px] text-[#c7ad80] hover:text-white transition-colors"
              }
            >
              OK
            </button>
            <button
              onClick={() => onWithdrawAdenaAmountChange("")}
              className="text-[11px] text-red-600 hover:text-red-500 transition-colors"
            >
              Отмена
            </button>
          </div>
        )}
        <div>
          <div className="flex justify-between">
            <span className={labelCls}>Coin of Luck:</span>
            <span className={valueCls}>{clan.coinLuck}</span>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                onCoinLuckActionChange("deposit");
                onCoinLuckAmountChange("0");
              }}
              className="text-[10px] text-[#9f8d73] hover:text-[#c7ad80] transition-colors"
            >
              положить
            </button>
            <button
              onClick={() => {
                onCoinLuckActionChange("withdraw");
                onCoinLuckAmountChange("0");
              }}
              className="text-[10px] text-[#9f8d73] hover:text-[#c7ad80] transition-colors"
            >
              забрать
            </button>
          </div>
        </div>
        {coinLuckAmount !== "" && (
          <div className="flex gap-2 items-center text-[11px]">
            <input
              type="number"
              value={coinLuckAmount}
              onChange={(e) => {
                const newValue = handleNumberInput(coinLuckAmount, e.target.value);
                onCoinLuckAmountChange(newValue);
              }}
              onFocus={(e) => e.target.select()}
              className={inputCls}
              placeholder={`Сумма для ${coinLuckAction === "deposit" ? "положения" : "вывода"}`}
              autoFocus
            />
            <button
              onClick={onCoinLuckAction}
              className={
                isL2
                  ? "text-[11px] text-[#c9a44c] hover:text-[#e8c56e] transition-colors"
                  : "text-[11px] text-[#c7ad80] hover:text-white transition-colors"
              }
            >
              OK
            </button>
            <button
              onClick={() => onCoinLuckAmountChange("")}
              className="text-[11px] text-red-600 hover:text-red-500 transition-colors"
            >
              Отмена
            </button>
          </div>
        )}
      </div>
    </>
  );
}
