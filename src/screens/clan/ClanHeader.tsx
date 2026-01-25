import React from "react";
import { type Clan } from "../../utils/api";
import { useHeroStore } from "../../state/heroStore";
import { ClanNameWithEmblem } from "../../components/ClanNameWithEmblem";
import { handleNumberInput } from "../../utils/numberInput";

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
  return (
    <>
      {/* Риска вище назви клану */}
      <div className="border-t border-gray-600"></div>

      {/* Назва клану */}
      <div className="text-center text-[16px] font-semibold text-[#f4e2b8]">
        <ClanNameWithEmblem clan={clan} size={18} />
      </div>

      {/* Риска нижче назви клану */}
      <div className="border-b border-gray-600"></div>

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
          <span className="text-[#c7ad80]">Уровень:</span>
          <span className="text-white">{clan.level}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#c7ad80]">Лидер:</span>
          <span className="text-white">{clan.creator.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#c7ad80]">Репутация:</span>
          <span className="text-white">{clan.reputation}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#c7ad80]">Основан:</span>
          <span className="text-white">
            {new Date(clan.createdAt).toLocaleDateString("ru-RU")}
          </span>
        </div>
        <div>
          <div className="flex justify-between">
            <span className="text-[#c7ad80]">Адена:</span>
            <span className="text-white">{clan.adena.toLocaleString("ru-RU")}</span>
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
              onFocus={(e) => {
                if (e.target.value === "0") {
                  e.target.select();
                }
              }}
              className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-[#5a4424] text-white rounded"
              placeholder="Сумма"
              autoFocus
            />
            <button
              onClick={onDepositAdena}
              className="text-[11px] text-[#c7ad80] hover:text-white transition-colors"
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
              onFocus={(e) => {
                if (e.target.value === "0") {
                  e.target.select();
                }
              }}
              className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-[#5a4424] text-white rounded"
              placeholder="Сумма для вывода"
              autoFocus
            />
            <button
              onClick={onWithdrawAdena}
              className="text-[11px] text-[#c7ad80] hover:text-white transition-colors"
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
            <span className="text-[#c7ad80]">Coin of Luck:</span>
            <span className="text-white">{clan.coinLuck}</span>
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
              onFocus={(e) => {
                if (e.target.value === "0") {
                  e.target.select();
                }
              }}
              className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-[#5a4424] text-white rounded"
              placeholder={`Сумма для ${coinLuckAction === "deposit" ? "положения" : "вывода"}`}
              autoFocus
            />
            <button
              onClick={onCoinLuckAction}
              className="text-[11px] text-[#c7ad80] hover:text-white transition-colors"
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
