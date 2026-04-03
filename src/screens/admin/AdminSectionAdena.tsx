import React, { useState } from "react";
import { adminFindPlayerByName, adminAdena } from "../../utils/api";
import { isWarmCityUi, useCityUiVariant } from "../../utils/cityUiVariant";

export function AdminSectionAdena() {
  const cityUi = useCityUiVariant();
  const isL2 = isWarmCityUi(cityUi);
  const btnCl = isL2
    ? "text-sm py-1 px-2 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8dcc8] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 hover:brightness-110 transition-[border-color,filter] duration-150 disabled:opacity-50"
    : "text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50";
  const labelCl = isL2 ? "text-[#d4c4a8]" : "text-[#c7ad80]";
  const msgCl = isL2 ? "mt-1 text-xs text-[#8a7a60]" : "mt-1 text-xs text-gray-500";

  const [nick, setNick] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"give" | "take" | "set">("give");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const num = Math.floor(Number(amount));
    if (!nick.trim() || !Number.isFinite(num) || num < 0) {
      setMessage("Введіть нік та коректну кількість");
      return;
    }
    if (mode !== "set" && num === 0) {
      setMessage("Для видачі/зняття введіть кількість > 0");
      return;
    }
    setLoading(true);
    try {
      const data = await adminFindPlayerByName(nick.trim());
      if (!data?.character?.id) {
        setMessage("Персонажа не знайдено");
        return;
      }
      const { character } = data;
      if (mode === "set") {
        await adminAdena(character.id, undefined, num);
        setMessage(`Адену встановлено: ${num} для [${character.name}] (id: ${character.id}). Гравцю потрібно F5.`);
      } else {
        const delta = mode === "give" ? num : -num;
        const res = await adminAdena(character.id, delta);
        setMessage(`Готово. [${character.name}] (id: ${character.id}) — адена: ${res.adena ?? "—"}. Гравцю потрібно F5.`);
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
        Адена
      </h2>
      <p className={isL2 ? "text-xs text-[#8a7a60] mb-2" : "text-xs text-gray-500 mb-2"}>
        Выдать, снять или установить точное количество адены. Гравцю потрібно F5, щоб побачити зміни.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік" className={inputCl} />
        {(["give", "take", "set"] as const).map((m) => (
          <label key={m} className={`flex items-center gap-1 text-xs ${labelCl}`}>
            <input type="radio" checked={mode === m} onChange={() => setMode(m)} className="w-3 h-3" />
            {m === "give" ? "Видати" : m === "take" ? "Зняти" : "Вст."}
          </label>
        ))}
        <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="К-сть" className={`${inputCl} w-20`} />
        <button type="submit" disabled={loading} className={btnCl}>
          {loading ? "..." : "Виконати"}
        </button>
      </form>
      {message && <p className={msgCl}>{message}</p>}
    </section>
  );
}
