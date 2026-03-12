import React, { useState } from "react";
import { adminFindPlayerByName, adminChangeClass } from "../../utils/api";
import { PROFESSION_OPTIONS } from "../../data/skills";

const style = { color: "#c7ad80" };

const SEX_OPTIONS = [
  { value: "", label: "— Стать —" },
  { value: "male", label: "Чоловіча" },
  { value: "female", label: "Жіноча" },
];

export function AdminSectionChangeClass() {
  const [nick, setNick] = useState("");
  const [newProfession, setNewProfession] = useState("");
  const [newSex, setNewSex] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!nick.trim()) return;
    setMessage(null);
    try {
      const data = await adminFindPlayerByName(nick.trim());
      if (data?.character) {
        const sex = (data.character as any).sex;
        if (sex === "male" || sex === "female") setNewSex(sex);
        setMessage(`Знайдено: ${data.character.name}`);
      } else {
        setMessage("Персонажа не знайдено");
      }
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!nick.trim()) {
      setMessage("Введіть нік гравця");
      return;
    }
    if (!newProfession) {
      setMessage("Оберіть професію");
      return;
    }
    if (!newSex) {
      setMessage("Оберіть стать");
      return;
    }
    setLoading(true);
    try {
      const data = await adminFindPlayerByName(nick.trim());
      if (!data?.character?.id) {
        setMessage("Персонажа не знайдено");
        return;
      }
      if (data.character.profession && String(data.character.profession).toLowerCase() === String(newProfession).toLowerCase()) {
        setMessage("Персонаж вже має цю професію. Оберіть іншу або натисніть «Знайти» щоб оновити дані.");
        return;
      }
      // Скіли не додаються автоматично — гравець сам вивчить у гільдії за SP. SP залишається.
      await adminChangeClass(data.character.id, newProfession, [], newSex);
      setMessage(`Професію змінено на ${PROFESSION_OPTIONS.find((p) => p.id === newProfession)?.label ?? newProfession}. Старі скіли скинуто. SP збережено — гравець вивчить скіли в гільдії. F5.`);
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const inputCl =
    "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500";
  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3">
      <h2 className="text-sm font-semibold mb-2" style={style}>
        Змінити клас
      </h2>
      <p className="text-xs text-gray-500 mb-2">
        Знайти гравця за ніком і встановити нову професію. Старі скіли скинуться, SP збережеться — гравець вивчить скіли в гільдії.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="Нік"
          className={`${inputCl} w-28`}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !nick.trim()}
          className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50"
        >
          Знайти
        </button>
        <select
          value={newProfession}
          onChange={(e) => setNewProfession(e.target.value)}
          className={`${inputCl} max-w-48`}
        >
          <option value="">— Оберіть професію —</option>
          {PROFESSION_OPTIONS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          value={newSex}
          onChange={(e) => setNewSex(e.target.value)}
          className={inputCl}
        >
          {SEX_OPTIONS.map((o) => (
            <option key={o.value || "empty"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50"
        >
          {loading ? "..." : "Змінити клас"}
        </button>
      </form>
      {message && <p className="mt-1 text-xs text-gray-500">{message}</p>}
    </section>
  );
}
