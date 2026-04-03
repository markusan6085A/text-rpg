import React, { useState } from "react";
import { adminFindPlayerByName, adminBan, adminUnban } from "../../utils/api";
import { showToast } from "../../state/toastStore";
import { isWarmCityUi, useCityUiVariant } from "../../utils/cityUiVariant";
const DURATIONS = [
  { label: "10 хв", min: 10 },
  { label: "1 год", min: 60 },
  { label: "24 год", min: 60 * 24 },
  { label: "7 днів", min: 60 * 24 * 7 },
];

function formatDuration(min: number): string {
  if (min < 60) return `${min} хв`;
  if (min < 60 * 24) return `${Math.floor(min / 60)} год`;
  return `${Math.floor(min / (60 * 24))} дн`;
}

export function AdminSectionBanUnban() {
  const cityUi = useCityUiVariant();
  const isL2 = isWarmCityUi(cityUi);
  const btnUnbanCl = isL2
    ? "text-sm py-1 px-2 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8dcc8] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 hover:brightness-110 transition-[border-color,filter] duration-150 disabled:opacity-50"
    : "text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50";
  const btnBanCl = isL2
    ? "text-sm py-1 px-2 rounded-md bg-gradient-to-b from-[#3d1515] to-[#1a0a0a] border border-[#7f3a3a]/70 text-red-200 shadow-[inset_0_1px_0_rgba(248,113,113,0.08)] hover:border-red-400/45 hover:brightness-110 transition-[border-color,filter] duration-150 disabled:opacity-50"
    : "text-sm py-1 px-2 rounded bg-red-900/40 text-red-300 hover:bg-red-900/60 disabled:opacity-50";
  const labelCl = isL2 ? "text-[#d4c4a8]" : "text-[#c7ad80]";

  const [nick, setNick] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [loading, setLoading] = useState(false);

  const handleBan = async (e: React.FormEvent) => {
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
      await adminBan(character.id, durationMin);
      showToast(`Гравець ${character.name} отримав бан на ${formatDuration(durationMin)}.`, "success", {
        title: "Бан застосовано",
      });
    } catch (err: any) {
      showToast(err?.message || "Помилка", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (e: React.FormEvent) => {
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
      await adminUnban(character.id);
      showToast(`Гравця ${character.name} розбанено.`, "success", { title: "Розбан" });
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
        Бан / Розбан
      </h2>
      <p className={isL2 ? "text-xs text-[#8a7a60] mb-2" : "text-xs text-gray-500 mb-2"}>
        Бан — нельзя писать в общий/торговый/клан чат. Разбан снимает ограничение.
      </p>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-2">
        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік" className={inputCl} />
        {DURATIONS.map(({ label, min }) => (
          <label key={min} className={`flex items-center gap-0.5 text-xs ${labelCl}`}>
            <input type="radio" checked={durationMin === min} onChange={() => setDurationMin(min)} className="w-3 h-3" />
            {label}
          </label>
        ))}
        <button type="button" onClick={handleBan} disabled={loading} className={btnBanCl}>
          Забанити
        </button>
        <button type="button" onClick={handleUnban} disabled={loading} className={btnUnbanCl}>
          Розбанити
        </button>
      </form>
    </section>
  );
}
