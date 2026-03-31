import React from "react";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";

interface CreateClanFormProps {
  clanName: string;
  showForm: boolean;
  onClanNameChange: (value: string) => void;
  onToggleForm: () => void;
  onCreateClan: () => void;
}

export default function CreateClanForm({
  clanName,
  showForm,
  onClanNameChange,
  onToggleForm,
  onCreateClan,
}: CreateClanFormProps) {
  const isL2 = isWarmCityUi(getCityUiVariant());
  return (
    <>
      <div className="flex justify-center">
        <button
          onClick={onToggleForm}
          className="text-[12px] font-semibold text-green-500 hover:text-green-400"
        >
          {showForm ? "Отмена" : "Создать клан"}
        </button>
      </div>

      {/* Форма створення клану */}
      {showForm && (
        <div
          className={
            isL2
              ? "p-3 bg-black/25 border border-[#5c4a32]/55 rounded-md space-y-2"
              : "p-3 bg-[#1a1a1a] border border-white/40 rounded-md space-y-2"
          }
        >
          <div className={isL2 ? "text-[12px] text-[#e8c56e]" : "text-[12px] text-[#f4e2b8]"}>
            Название клана:
          </div>
          <input
            type="text"
            value={clanName}
            onChange={(e) => onClanNameChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                onCreateClan();
              }
            }}
            className={
              isL2
                ? "w-full px-2 py-1 bg-[#0f0a06] border border-[#5c4a32]/50 text-[12px] text-[#e8dcc8] rounded placeholder-[#6a6048]"
                : "w-full px-2 py-1 bg-[#2a2a2a] border border-white/50 text-[12px] text-white rounded"
            }
            placeholder="Введите название (3-16 символов)"
            maxLength={16}
          />
          <button
            onClick={onCreateClan}
            className="w-full px-3 py-2 bg-gradient-to-r from-[#725024] to-[#c08c3c] text-[12px] font-semibold text-black rounded-md"
          >
            Создать
          </button>
        </div>
      )}
    </>
  );
}
