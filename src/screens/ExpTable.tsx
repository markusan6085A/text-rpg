import React from "react";
import { EXP_TABLE, getExpToNext, MAX_LEVEL } from "../data/expTable";

type Navigate = (p: string) => void;

function formatNum(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + " млрд";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " млн";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + " тыс";
  return String(n);
}

export default function ExpTable({ navigate }: { navigate: Navigate }) {
  const rows: { lvl: number; total: number; toNext: number }[] = [];
  for (let i = 0; i < MAX_LEVEL; i++) {
    const lvl = i + 1;
    const total = EXP_TABLE[i] ?? 0;
    const toNext = getExpToNext(lvl);
    rows.push({ lvl, total, toNext });
  }

  return (
    <div className="w-full text-yellow-200 px-3 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-amber-400">Таблица опыта</h1>
        <button
          onClick={() => navigate("/about")}
          className="text-xs text-gray-400 hover:text-gray-300"
        >
          ← Меню
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Сколько нужно опыта до каждого уровня. Всего — накопленный опыт, до сл. — до следующего уровня.
      </p>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-amber-700/60">
              <th className="text-left py-1.5 px-2 text-amber-500">Уровень</th>
              <th className="text-right py-1.5 px-2 text-amber-500">Всего</th>
              <th className="text-right py-1.5 px-2 text-amber-500">До сл.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ lvl, total, toNext }) => (
              <tr key={lvl} className="border-b border-white/10 hover:bg-white/5">
                <td className="py-1 px-2 font-medium">{lvl}</td>
                <td className="py-1 px-2 text-right text-gray-300">{formatNum(total)}</td>
                <td className="py-1 px-2 text-right text-amber-300/90">{formatNum(toNext)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
