import React, { useState } from "react";
import { adminFindPlayerByName, adminMuteChatUser } from "../../utils/api";
import { showToast } from "../../state/toastStore";
import { isWarmCityUi, useCityUiVariant } from "../../utils/cityUiVariant";
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
  const cityUi = useCityUiVariant();
  const isL2 = isWarmCityUi(cityUi);
  const btnMuteCl = isL2
    ? "text-sm py-1 px-2 rounded-md bg-gradient-to-b from-[#3d2a15] to-[#1a1208] border border-[#8b6914]/55 text-amber-100/95 shadow-[inset_0_1px_0_rgba(234,179,8,0.1)] hover:border-amber-400/35 hover:brightness-110 transition-[border-color,filter] duration-150 disabled:opacity-50"
    : "text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50";
  const labelCl = isL2 ? "text-[#d4c4a8]" : "text-[#c7ad80]";

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
        Мут
      </h2>
      <p className={isL2 ? "text-xs text-[#8a7a60] mb-2" : "text-xs text-gray-500 mb-2"}>
        Мут в чате — игрок не может писать сообщения на выбранное время.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік" className={inputCl} />
        {DURATIONS.map(({ label, min }) => (
          <label key={min} className={`flex items-center gap-0.5 text-xs ${labelCl}`}>
            <input type="radio" checked={durationMin === min} onChange={() => setDurationMin(min)} className="w-3 h-3" />
            {label}
          </label>
        ))}
        <button type="submit" disabled={loading} className={btnMuteCl}>
          {loading ? "..." : "Замутити"}
        </button>
      </form>
    </section>
  );
}
