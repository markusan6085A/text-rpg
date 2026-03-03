import React, { useState } from "react";
import { adminFindPlayerByName, adminHeal, adminResurrect } from "../../utils/api";

const style = { color: "#c7ad80" };

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

  const inputCl = "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500 w-28";
  const btnCl = "text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50";
  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold mb-2" style={style}>Heal / Resurrect</h2>
      <p className="text-xs text-gray-500 mb-2">
        Heal — восстановить HP/MP/CP до максимума. Resurrect — воскресить (сбросить смерть, восстановить ресурсы).
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік" className={inputCl} />
        <button type="button" onClick={() => doAction("heal")} disabled={loading} className={btnCl}>
          {loading ? "..." : "Лікувати"}
        </button>
        <button type="button" onClick={() => doAction("resurrect")} disabled={loading} className={`${btnCl} bg-green-900/40 text-green-300 hover:bg-green-900/60`}>
          Воскресить
        </button>
      </div>
      {message && <p className="mt-1 text-xs text-gray-500">{message}</p>}
    </section>
  );
}
