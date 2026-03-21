import React from "react";
import { EXP_TABLE, getExpToNext, MAX_LEVEL } from "../data/expTable";
import { getCityUiVariant } from "../utils/cityUiVariant";

type Navigate = (p: string) => void;

function formatNum(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + " млрд";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " млн";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + " тыс";
  return String(n);
}

export default function ExpTable({ navigate }: { navigate: Navigate }) {
  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const innerPanel = isL2
    ? "rounded-xl border border-[#5c4a32]/75 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-4"
    : "";

  const rows: { lvl: number; total: number; toNext: number }[] = [];
  for (let i = 0; i < MAX_LEVEL; i++) {
    const lvl = i + 1;
    const total = EXP_TABLE[i] ?? 0;
    const toNext = getExpToNext(lvl);
    rows.push({ lvl, total, toNext });
  }

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 text-[#d4c4a8]`
          : "w-full text-yellow-200 px-3 py-4"
      }
    >
      <div className={isL2 ? innerPanel : "contents"}>
        <div className="flex items-center justify-between mb-4">
          <h1
            className={
              isL2 ? "text-lg font-bold text-[#e8c56e]" : "text-lg font-bold text-amber-400"
            }
          >
            Таблица опыта
          </h1>
          <button
            onClick={() => navigate("/about")}
            className={
              isL2
                ? "text-xs text-[#9d8265] hover:text-[#c9a44c]"
                : "text-xs text-gray-400 hover:text-gray-300"
            }
          >
            ← Меню
          </button>
        </div>
        <p className={isL2 ? "text-xs text-[#8a7a60] mb-3" : "text-xs text-gray-400 mb-3"}>
          Сколько нужно опыта до каждого уровня. Всего — накопленный опыт, до сл. — до следующего уровня.
        </p>
        <div className="overflow-x-auto -mx-2 max-h-[65vh] overflow-y-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr
                className={
                  isL2 ? "border-b border-[#5c4a32]/55" : "border-b border-amber-700/60"
                }
              >
                <th
                  className={
                    isL2
                      ? "text-left py-1.5 px-2 text-[#e8c56e]"
                      : "text-left py-1.5 px-2 text-amber-500"
                  }
                >
                  Уровень
                </th>
                <th
                  className={
                    isL2
                      ? "text-right py-1.5 px-2 text-[#e8c56e]"
                      : "text-right py-1.5 px-2 text-amber-500"
                  }
                >
                  Всего
                </th>
                <th
                  className={
                    isL2
                      ? "text-right py-1.5 px-2 text-[#e8c56e]"
                      : "text-right py-1.5 px-2 text-amber-500"
                  }
                >
                  До сл.
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ lvl, total, toNext }) => (
                <tr
                  key={lvl}
                  className={
                    isL2
                      ? "border-b border-[#5c4a32]/30 hover:bg-black/20"
                      : "border-b border-white/10 hover:bg-white/5"
                  }
                >
                  <td className={isL2 ? "py-1 px-2 font-medium text-[#e8dcc8]" : "py-1 px-2 font-medium"}>
                    {lvl}
                  </td>
                  <td
                    className={
                      isL2 ? "py-1 px-2 text-right text-[#a89878]" : "py-1 px-2 text-right text-gray-300"
                    }
                  >
                    {formatNum(total)}
                  </td>
                  <td
                    className={
                      isL2
                        ? "py-1 px-2 text-right text-[#c9a44c]"
                        : "py-1 px-2 text-right text-amber-300/90"
                    }
                  >
                    {formatNum(toNext)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
