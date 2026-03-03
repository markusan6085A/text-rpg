import React, { useState } from "react";
import { adminFindPlayerByName, adminSetPremium } from "../../utils/api";

const style = { color: "#c7ad80" };

/**
 * Premium — Выдача премиума
 * Выдает игроку премиум на указанное количество дней.
 * premiumUntil в heroJson обновляется, игрок получает премиум-бонусы.
 */
export function AdminSectionPremium() {
  const [nick, setNick] = useState("");
  const [days, setDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const num = Math.max(1, Math.min(365, Math.floor(Number(days))));
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
      await adminSetPremium(data.character.id, num);
      setMessage(`Преміум видано: ${data.character.name} на ${num} днів`);
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const inputCl = "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500 w-28";
  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold mb-2" style={style}>Premium — Видача премиума</h2>
      <p className="text-xs text-gray-500 mb-2">
        Выдает игроку премиум на N дней. Игрок получает бонусы премиума до указанной даты.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік" className={inputCl} />
        <input type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} placeholder="Дні" className={`${inputCl} w-16`} />
        <button type="submit" disabled={loading} className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50">
          {loading ? "..." : "Видати преміум"}
        </button>
      </form>
      {message && <p className="mt-1 text-xs text-gray-500">{message}</p>}
    </section>
  );
}
