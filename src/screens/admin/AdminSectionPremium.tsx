import React, { useState } from "react";
import { adminFindPlayerByName, adminSetPremium } from "../../utils/api";
import { isWarmCityUi, useCityUiVariant } from "../../utils/cityUiVariant";

/**
 * Premium — Выдача премиума
 * Выдает игроку премиум на указанное количество дней.
 * premiumUntil в heroJson обновляется, игрок получает премиум-бонусы.
 */
export function AdminSectionPremium() {
  const cityUi = useCityUiVariant();
  const isL2 = isWarmCityUi(cityUi);
  const btnCl = isL2
    ? "text-sm py-1 px-2 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8dcc8] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 hover:brightness-110 transition-[border-color,filter] duration-150 disabled:opacity-50"
    : "text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50";
  const msgCl = isL2 ? "mt-1 text-xs text-[#8a7a60]" : "mt-1 text-xs text-gray-500";

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
        Premium — Видача премиума
      </h2>
      <p className={isL2 ? "text-xs text-[#8a7a60] mb-2" : "text-xs text-gray-500 mb-2"}>
        Выдает игроку премиум на N дней. Игрок получает бонусы премиума до указанной даты.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік" className={inputCl} />
        <input type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} placeholder="Дні" className={`${inputCl} w-16`} />
        <button type="submit" disabled={loading} className={btnCl}>
          {loading ? "..." : "Видати преміум"}
        </button>
      </form>
      {message && <p className={msgCl}>{message}</p>}
    </section>
  );
}
