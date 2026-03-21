import React, { useState } from "react";
import { adminFindPlayerByName, adminMuteChatUser } from "../../utils/api";
import { showToast } from "../../state/toastStore";

const style = { color: "#c7ad80" };
const DURATIONS = [
  { label: "10 хв", min: 10 },
  { label: "1 год", min: 60 },
  { label: "24 год", min: 60 * 24 },
];

function formatDuration(min: number): string {
  if (min < 60) return `${min} хв`;
  if (min < 60 * 24) return `${Math.floor(min / 60)} год`;
  return `${Math.floor(min / (60 * 24))} дн`;
}

export function AdminSectionMute() {
  const [nick, setNick] = useState("");
  const [durationMin, setDurationMin] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nick.trim()) {
      showToast("Введіть нік гравця", "error");
      return;
    }
    setLoading(true);
    try {
      const data = await adminFindPlayerByName(nick.trim());
      if (!data?.character?.id) {
        showToast("Персонажа не знайдено", "error");
        return;
      }
      const character = data.character;
      await adminMuteChatUser(character.id, durationMin);
      showToast(`Гравець ${character.name} отримав мут на ${formatDuration(durationMin)}.`, "success", {
        title: "Мут застосовано",
      });
    } catch (err: any) {
      showToast(err?.message || "Помилка", "error");
    } finally {
      setLoading(false);
    }
  };

  const inputCl = "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500 w-28";
  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold mb-2" style={style}>Мут</h2>
      <p className="text-xs text-gray-500 mb-2">Мут в чате — игрок не может писать сообщения на выбранное время.</p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік" className={inputCl} />
        {DURATIONS.map(({ label, min }) => (
          <label key={min} className="flex items-center gap-0.5 text-xs" style={style}>
            <input type="radio" checked={durationMin === min} onChange={() => setDurationMin(min)} className="w-3 h-3" />
            {label}
          </label>
        ))}
        <button type="submit" disabled={loading} className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50">
          {loading ? "..." : "Замутити"}
        </button>
      </form>
    </section>
  );
}
