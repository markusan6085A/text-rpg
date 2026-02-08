import React from "react";
import { useHeroStore } from "../state/heroStore";
import { isAdminCharacter } from "../config/admin";

type Navigate = (path: string) => void;

interface AdminProps {
  navigate: Navigate;
}

export default function Admin({ navigate }: AdminProps) {
  const hero = useHeroStore((s) => s.hero);
  const isAdmin = isAdminCharacter(hero?.name);

  if (!isAdmin) {
    return (
      <div className="w-full max-w-[360px] mx-auto text-white px-3 py-6 text-center">
        <div className="text-red-400 font-semibold mb-2">Доступ заборонено</div>
        <p className="text-sm text-gray-400 mb-4">Ця сторінка лише для Existence.</p>
        <button
          type="button"
          onClick={() => navigate("/character")}
          className="text-[#c7ad80] hover:underline text-sm"
        >
          ← Назад
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[360px] mx-auto text-white px-3 py-4">
      <div className="flex items-center justify-between border-b border-[#c7ad80]/70 pb-2 mb-4">
        <h1 className="text-base font-bold text-[#c7ad80]">Панель Existence</h1>
        <button
          type="button"
          onClick={() => navigate("/character")}
          className="text-xs text-gray-400 hover:text-gray-300"
        >
          ← Назад
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="text-gray-400 text-xs mb-2">Розділи (з 0, далі можна додати):</div>

        <button
          type="button"
          onClick={() => navigate("/online-players")}
          className="w-full text-left px-3 py-2 rounded border border-[#c7ad80]/50 text-[#c7ad80] hover:bg-[#2a2015] transition-colors"
        >
          Онлайн гравці
        </button>

        <button
          type="button"
          onClick={() => navigate("/news")}
          className="w-full text-left px-3 py-2 rounded border border-[#c7ad80]/50 text-[#c7ad80] hover:bg-[#2a2015] transition-colors"
        >
          Новини / оголошення
        </button>

        <div className="border-t border-[#c7ad80]/50 pt-3 mt-3 text-xs text-gray-500">
          Дії по гравцю (баф/хіл): профіль гравця → «Забафнуть игрока».
        </div>
      </div>
    </div>
  );
}
