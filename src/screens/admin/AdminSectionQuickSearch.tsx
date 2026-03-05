import React, { useState } from "react";
import { adminFindPlayerByName } from "../../utils/api";

const style = { color: "#c7ad80" };
const inputCl = "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500";

interface AdminSectionQuickSearchProps {
  navigate: (path: string) => void;
}

/**
 * Швидкий пошук гравця — ввести нік і відкрити /player/:id/admin з усіма адмін-діями.
 */
export function AdminSectionQuickSearch({ navigate }: AdminSectionQuickSearchProps) {
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
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3">
      <h2 className="text-sm font-semibold mb-2" style={style}>Швидкий пошук гравця</h2>
      <p className="text-xs text-gray-500 mb-2">
        Введіть нік і відкрийте сторінку з усіма адмін-діями (бан, mute, хіл, зміна класу, бафи тощо).
      </p>
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
        <input
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="Нік гравця"
          className={`${inputCl} w-36`}
        />
        <button
          type="submit"
          disabled={loading}
          className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50"
        >
          {loading ? "..." : "Відкрити"}
        </button>
      </form>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </section>
  );
}
