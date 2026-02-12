import React, { useState } from "react";
import { adminFindPlayerByName, adminBan, adminUnban } from "../../utils/api";

const style = { color: "#c7ad80" };
const DURATIONS = [
  { label: "10 хв", min: 10 },
  { label: "1 год", min: 60 },
  { label: "24 год", min: 60 * 24 },
  { label: "7 днів", min: 60 * 24 * 7 },
];

export function AdminSectionBanUnban() {
  const [nick, setNick] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!nick.trim()) {
      setMessage("Введіть нік гравця");
      return;
    }
    setLoading(true);
    try {
      const { character } = await adminFindPlayerByName(nick.trim());
      await adminBan(character.id, durationMin);
      setMessage("Гравця забанено");
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!nick.trim()) {
      setMessage("Введіть нік гравця");
      return;
    }
    setLoading(true);
    try {
      const { character } = await adminFindPlayerByName(nick.trim());
      await adminUnban(character.id);
      setMessage("Гравця розбанено");
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const inputCl = "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500 w-28";
  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold mb-2" style={style}>Бан / Розбан</h2>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-2">
        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік" className={inputCl} />
        {DURATIONS.map(({ label, min }) => (
          <label key={min} className="flex items-center gap-0.5 text-xs" style={style}>
            <input type="radio" checked={durationMin === min} onChange={() => setDurationMin(min)} className="w-3 h-3" />
            {label}
          </label>
        ))}
        <button type="button" onClick={handleBan} disabled={loading} className="text-sm py-1 px-2 rounded bg-red-900/40 text-red-300 hover:bg-red-900/60 disabled:opacity-50">Забанити</button>
        <button type="button" onClick={handleUnban} disabled={loading} className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50">Розбанити</button>
      </form>
      {message && <p className="mt-1 text-xs text-gray-500">{message}</p>}
    </section>
  );
}
