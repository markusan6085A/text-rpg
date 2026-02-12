import React, { useState } from "react";
import { adminFindPlayerByName, adminMuteChatUser } from "../../utils/api";

const style = { color: "#c7ad80" };
const DURATIONS = [
  { label: "10 хв", min: 10 },
  { label: "1 год", min: 60 },
  { label: "24 год", min: 60 * 24 },
];

export function AdminSectionMute() {
  const [nick, setNick] = useState("");
  const [durationMin, setDurationMin] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!nick.trim()) {
      setMessage("Введіть нік гравця");
      return;
    }
    setLoading(true);
    try {
      const { character } = await adminFindPlayerByName(nick.trim());
      await adminMuteChatUser(character.id, durationMin);
      setMessage(`Мут на ${durationMin} хв застосовано`);
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-b border-[#c7ad80]/30 pb-4 mb-4">
      <h2 className="text-lg font-semibold mb-2" style={style}>Мут (10 хв / 1 год / 24 год)</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="Нік гравця"
          className="w-full px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white placeholder-gray-500"
        />
        <div className="flex gap-2 flex-wrap items-center">
          {DURATIONS.map(({ label, min }) => (
            <label key={min} className="flex items-center gap-1 text-sm" style={style}>
              <input type="radio" checked={durationMin === min} onChange={() => setDurationMin(min)} />
              {label}
            </label>
          ))}
        </div>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50">
          {loading ? "..." : "Замутити"}
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-gray-400">{message}</p>}
    </section>
  );
}
