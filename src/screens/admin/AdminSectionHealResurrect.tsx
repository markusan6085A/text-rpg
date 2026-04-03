import React, { useState } from "react";
import { adminFindPlayerByName, adminHeal, adminResurrect } from "../../utils/api";
import { isWarmCityUi, useCityUiVariant } from "../../utils/cityUiVariant";

/**
 * Heal — Полное лечение
 * Восстанавливает HP, MP, CP персонажа до максимума.
 * Используется когда игрок застрял с низким HP или для тестирования.
 *
 * Resurrect — Воскрешение
 * Сбрасывает смерть (isDead, deadAt), восстанавливает HP/MP/CP на максимум, убирает бафы.
 * Используется когда игрок умер и нужно его поднять.
 */
export function AdminSectionHealResurrect() {
  const cityUi = useCityUiVariant();
  const isL2 = isWarmCityUi(cityUi);
  const btnHealCl = isL2
    ? "text-sm py-1 px-2 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8dcc8] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 hover:brightness-110 transition-[border-color,filter] duration-150 disabled:opacity-50"
    : "text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50";
  const btnResCl = isL2
    ? "text-sm py-1 px-2 rounded-md bg-gradient-to-b from-[#15261a] to-[#0a120c] border border-[#3d6b4f]/65 text-[#b8e8c8] shadow-[inset_0_1px_0_rgba(74,222,128,0.12)] hover:border-[#7d9b7a]/55 hover:brightness-110 transition-[border-color,filter] duration-150 disabled:opacity-50"
    : "text-sm py-1 px-2 rounded bg-green-900/40 text-green-300 hover:bg-green-900/60 disabled:opacity-50";
  const msgCl = isL2 ? "mt-1 text-xs text-[#8a7a60]" : "mt-1 text-xs text-gray-500";

  const [nick, setNick] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const doAction = async (action: "heal" | "resurrect") => {
    setMessage(null);
    if (!nick.trim()) {
      setMessage("Введіть нік гравця");
      return;
    }
    setLoading(true);
    try {
      const data = await adminFindPlayerByName(nick.trim());
      if (!data?.character?.id) {
        setMessage("Персонажа не знайдено");
        return;
      }
      if (action === "heal") {
        await adminHeal(data.character.id);
        setMessage(`Лікування виконано: ${data.character.name}`);
      } else {
        await adminResurrect(data.character.id);
        setMessage(`Воскрешение выполнено: ${data.character.name}`);
      }
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const inputCl =
    "text-sm py-1 px-2 rounded-md bg-black/40 border text-white placeholder-gray-500 w-28 " +
    (isL2 ? "border-[#5c4a32]/70 focus:border-[#c7ad80]/45 focus:outline-none" : "border-[#c7ad80]/30");
  return (
    <section
      className={
        isL2
          ? "border-t border-[#5c4a32]/40 pt-3 pb-3 first:border-t-0 first:pt-0"
          : "border-t border-[#c7ad80]/30 pt-3 pb-3 first:border-t-0 first:pt-0"
      }
    >
      <h2
        className={
          isL2
            ? "text-sm font-semibold mb-2 text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
            : "text-sm font-semibold mb-2 text-[#c7ad80]"
        }
      >
        Heal / Resurrect
      </h2>
      <p className={isL2 ? "text-xs text-[#8a7a60] mb-2" : "text-xs text-gray-500 mb-2"}>
        Heal — восстановить HP/MP/CP до максимума. Resurrect — воскресить (сбросить смерть, восстановить ресурсы).
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік" className={inputCl} />
        <button type="button" onClick={() => doAction("heal")} disabled={loading} className={btnHealCl}>
          {loading ? "..." : "Лікувати"}
        </button>
        <button type="button" onClick={() => doAction("resurrect")} disabled={loading} className={btnResCl}>
          Воскресить
        </button>
      </div>
      {message && <p className={msgCl}>{message}</p>}
    </section>
  );
}
