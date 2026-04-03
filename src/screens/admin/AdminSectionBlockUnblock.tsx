import React, { useState } from "react";
import { adminFindPlayerByName, adminBlock, adminUnblock } from "../../utils/api";
import { isWarmCityUi, useCityUiVariant } from "../../utils/cityUiVariant";
const DURATIONS = [
  { label: "10 хв", min: 10 },
  { label: "1 год", min: 60 },
  { label: "24 год", min: 60 * 24 },
  { label: "7 днів", min: 60 * 24 * 7 },
];

export function AdminSectionBlockUnblock() {
  const cityUi = useCityUiVariant();
  const isL2 = isWarmCityUi(cityUi);
  const btnUnblockCl = isL2
    ? "text-sm py-1 px-2 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8dcc8] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 hover:brightness-110 transition-[border-color,filter] duration-150 disabled:opacity-50"
    : "text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50";
  const btnBlockCl = isL2
    ? "text-sm py-1 px-2 rounded-md bg-gradient-to-b from-[#3d1515] to-[#1a0a0a] border border-[#7f3a3a]/70 text-red-200 shadow-[inset_0_1px_0_rgba(248,113,113,0.08)] hover:border-red-400/45 hover:brightness-110 transition-[border-color,filter] duration-150 disabled:opacity-50"
    : "text-sm py-1 px-2 rounded bg-red-900/40 text-red-300 hover:bg-red-900/60 disabled:opacity-50";
  const labelCl = isL2 ? "text-[#d4c4a8]" : "text-[#c7ad80]";
  const msgCl = isL2 ? "mt-1 text-xs text-[#8a7a60]" : "mt-1 text-xs text-gray-500";

  const [nick, setNick] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!nick.trim()) {
      setMessage("Введіть нік гравця");
      return;
    }
    setLoading(true);
    try {
      const data = await adminFindPlayerByName(nick.trim());
      if (!data?.character?.id) {
        setMessage("Персонажа не знайдено");
        return;
      }
      await adminBlock(data.character.id, durationMin);
      setMessage("Гравця заблоковано (не зможе грати)");
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!nick.trim()) {
      setMessage("Введіть нік гравця");
      return;
    }
    setLoading(true);
    try {
      const data = await adminFindPlayerByName(nick.trim());
      if (!data?.character?.id) {
        setMessage("Персонажа не знайдено");
        return;
      }
      await adminUnblock(data.character.id);
      setMessage("Гравця розблоковано");
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
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
        Блок / Розблок
      </h2>
      <p className={isL2 ? "text-xs text-[#8a7a60] mb-2" : "text-xs text-gray-500 mb-2"}>
        Блок — игрок не может играть (экранируется). Разблок снимает ограничение.
      </p>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-2">
        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік" className={inputCl} />
        {DURATIONS.map(({ label, min }) => (
          <label key={min} className={`flex items-center gap-0.5 text-xs ${labelCl}`}>
            <input type="radio" checked={durationMin === min} onChange={() => setDurationMin(min)} className="w-3 h-3" />
            {label}
          </label>
        ))}
        <button type="button" onClick={handleBlock} disabled={loading} className={btnBlockCl}>
          Заблокувати
        </button>
        <button type="button" onClick={handleUnblock} disabled={loading} className={btnUnblockCl}>
          Розблокувати
        </button>
      </form>
      {message && <p className={msgCl}>{message}</p>}
    </section>
  );
}
