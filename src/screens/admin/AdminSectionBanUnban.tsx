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

  return (
    <section className="border-b border-[#c7ad80]/30 pb-4 mb-4">
      <h2 className="text-lg font-semibold mb-2" style={style}>Бан / Розбан</h2>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
        <input
          type="text"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="Нік гравця"
          className="w-full px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white placeholder-gray-500"
        />
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm" style={style}>Тривалість бана:</span>
          {DURATIONS.map(({ label, min }) => (
            <label key={min} className="flex items-center gap-1 text-sm" style={style}>
              <input type="radio" checked={durationMin === min} onChange={() => setDurationMin(min)} />
              {label}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleBan} disabled={loading} className="px-4 py-2 rounded bg-red-900/40 border border-red-500/60 text-red-300 hover:bg-red-900/60 disabled:opacity-50">
            Забанити
          </button>
          <button type="button" onClick={handleUnban} disabled={loading} className="px-4 py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50">
            Розбанити
          </button>
        </div>
      </form>
      {message && <p className="mt-2 text-sm text-gray-400">{message}</p>}
    </section>
  );
}
