import React, { useState } from "react";
import { adminFindPlayerByName, adminAdena } from "../../utils/api";

const style = { color: "#c7ad80" };

export function AdminSectionAdena() {
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
    setLoading(true);
    try {
      const { character } = await adminFindPlayerByName(nick.trim());
      if (mode === "set") {
        await adminAdena(character.id, undefined, num);
        setMessage(`Адену встановлено: ${num}`);
      } else {
        const delta = mode === "give" ? num : -num;
        const res = await adminAdena(character.id, delta);
        setMessage(`Готово. Адена: ${res.adena ?? "—"}`);
      }
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const inputCl = "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500 w-28";
  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold mb-2" style={style}>Адена</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік" className={inputCl} />
        {(["give", "take", "set"] as const).map((m) => (
          <label key={m} className="flex items-center gap-1 text-xs" style={style}>
            <input type="radio" checked={mode === m} onChange={() => setMode(m)} className="w-3 h-3" />
            {m === "give" ? "Видати" : m === "take" ? "Зняти" : "Вст."}
          </label>
        ))}
        <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="К-сть" className={`${inputCl} w-20`} />
        <button type="submit" disabled={loading} className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50">
          {loading ? "..." : "Виконати"}
        </button>
      </form>
      {message && <p className="mt-1 text-xs text-gray-500">{message}</p>}
    </section>
  );
}
