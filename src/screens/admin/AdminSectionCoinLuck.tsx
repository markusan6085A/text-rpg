import React, { useState } from "react";
import { adminFindPlayerByName, adminCoinLuck } from "../../utils/api";

const style = { color: "#c7ad80" };

export function AdminSectionCoinLuck() {
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
        await adminCoinLuck(character.id, undefined, num);
        setMessage(`Coin of Luck встановлено: ${num}`);
      } else {
        const delta = mode === "give" ? num : -num;
        const res = await adminCoinLuck(character.id, delta);
        setMessage(`Готово. Coin of Luck: ${res.coinLuck ?? "—"}`);
      }
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-b border-[#c7ad80]/30 pb-4 mb-4">
      <h2 className="text-lg font-semibold mb-2" style={style}>Видати / Забрати Coin of Luck</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="Нік гравця"
          className="w-full px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white placeholder-gray-500"
        />
        <div className="flex gap-2 flex-wrap">
          {(["give", "take", "set"] as const).map((m) => (
            <label key={m} className="flex items-center gap-1 text-sm" style={style}>
              <input type="radio" checked={mode === m} onChange={() => setMode(m)} />
              {m === "give" ? "Видати" : m === "take" ? "Забрати" : "Встановити"}
            </label>
          ))}
        </div>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Кількість"
          className="w-full px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white"
        />
        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50">
          {loading ? "..." : "Виконати"}
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-gray-400">{message}</p>}
    </section>
  );
}
