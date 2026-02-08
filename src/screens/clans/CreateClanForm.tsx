import React from "react";

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
        <div className="p-3 bg-[#1a1a1a] border border-white/40 rounded-md space-y-2">
          <div className="text-[12px] text-[#f4e2b8]">Название клана:</div>
          <input
            type="text"
            value={clanName}
            onChange={(e) => onClanNameChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                onCreateClan();
              }
            }}
            className="w-full px-2 py-1 bg-[#2a2a2a] border border-white/50 text-[12px] text-white rounded"
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
