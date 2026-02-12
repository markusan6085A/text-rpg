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

  return (
    <section className="border-b border-[#c7ad80]/30 pb-4 mb-4">
      <h2 className="text-lg font-semibold mb-2" style={style}>Змінити lvl/exp</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="Нік гравця"
          className="w-full px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white placeholder-gray-500"
        />
        <input
          type="number"
          min={0}
          max={80}
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          placeholder="Рівень (0–80)"
          className="w-full px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white"
        />
        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50">
          {loading ? "..." : "Встановити рівень"}
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-gray-400">{message}</p>}
    </section>
  );
}
