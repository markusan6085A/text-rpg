import React, { useState } from "react";
import { adminFindPlayerByName } from "../../utils/api";
import { isWarmCityUi, useCityUiVariant } from "../../utils/cityUiVariant";

interface AdminSectionQuickSearchProps {
  navigate: (path: string) => void;
}

/**
 * Швидкий пошук гравця — ввести нік і відкрити /player/:id/admin з усіма адмін-діями.
 */
export function AdminSectionQuickSearch({ navigate }: AdminSectionQuickSearchProps) {
  const cityUi = useCityUiVariant();
  const isL2 = isWarmCityUi(cityUi);
  const btnCl = isL2
    ? "text-sm py-1 px-2 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8dcc8] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 hover:brightness-110 transition-[border-color,filter] duration-150 disabled:opacity-50"
    : "text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50";
  const inputCl =
    "text-sm py-1 px-2 rounded-md bg-black/40 border text-white placeholder-gray-500 " +
    (isL2 ? "border-[#5c4a32]/70 focus:border-[#c7ad80]/45 focus:outline-none" : "border-[#c7ad80]/30");

  const [nick, setNick] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nick.trim();
    if (!trimmed) {
      setError("Введіть нік");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await adminFindPlayerByName(trimmed);
      if (data?.character?.id) {
        navigate(`/player/${data.character.id}/admin`);
        setNick("");
      } else {
        setError("Персонажа не знайдено");
      }
    } catch (err: any) {
      setError(err?.message || "Помилка пошуку");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={isL2 ? "border-t border-[#5c4a32]/40 pt-3 pb-3" : "border-t border-[#c7ad80]/30 pt-3 pb-3"}>
      <h2
        className={
          isL2
            ? "text-sm font-semibold mb-2 text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
            : "text-sm font-semibold mb-2 text-[#c7ad80]"
        }
      >
        Швидкий пошук гравця
      </h2>
      <p className={isL2 ? "text-xs text-[#8a7a60] mb-2" : "text-xs text-gray-500 mb-2"}>
        Введіть нік і відкрийте сторінку з усіма адмін-діями (бан, mute, хіл, зміна класу, бафи тощо).
      </p>
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
        <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік гравця" className={`${inputCl} w-36`} />
        <button type="submit" disabled={loading} className={btnCl}>
          {loading ? "..." : "Відкрити"}
        </button>
      </form>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </section>
  );
}
