import React, { useState } from "react";
import { adminFindPlayerByName, adminSetLevel } from "../../utils/api";

const style = { color: "#c7ad80" };

export function AdminSectionLevelExp() {
  const [nick, setNick] = useState("");
  const [level, setLevel] = useState("1");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const lvl = Math.max(0, Math.min(80, Math.floor(Number(level))));
    if (!nick.trim()) {
      setMessage("Введіть нік гравця");
      return;
    }
    setLoading(true);
    try {
      const { character } = await adminFindPlayerByName(nick.trim());
      await adminSetLevel(character.id, lvl);
      setMessage(`Рівень встановлено: ${lvl}`);
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const inputCl = "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500 w-28";
  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold mb-2" style={style}>Змінити lvl/exp</h2>
      <div className="flex flex-wrap items-center gap-2">
        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік" className={inputCl} />
        <input type="number" min={0} max={80} value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Рівень 0–80" className={`${inputCl} w-20`} />
        <button type="button" onClick={handleSubmit} disabled={loading} className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50">
          {loading ? "..." : "Встановити рівень"}
        </button>
      </div>
      {message && <p className="mt-1 text-xs text-gray-500">{message}</p>}
    </section>
  );
}
