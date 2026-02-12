import React, { useState } from "react";
import { adminForceLogout } from "../../utils/api";

const style = { color: "#c7ad80" };

export function AdminSectionForceLogout() {
  const [nick, setNick] = useState("");
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
      await adminForceLogout(nick.trim());
      setMessage("Гравця викинуто з гри");
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-b border-[#c7ad80]/30 pb-4 mb-4">
      <h2 className="text-lg font-semibold mb-2" style={style}>Force logout (викинути з гри)</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="Нік гравця"
          className="w-full px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white placeholder-gray-500"
        />
        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50">
          {loading ? "..." : "Викинути з гри"}
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-gray-400">{message}</p>}
    </section>
  );
}
