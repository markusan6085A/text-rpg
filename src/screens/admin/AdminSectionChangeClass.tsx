import React, { useMemo, useState } from "react";
import { adminFindPlayerByName, adminChangeClass } from "../../utils/api";
import { getAdminProfessionSelectGroups, normalizeProfessionId, type ProfessionId } from "../../data/skills";
import { getCityUiVariant } from "../../utils/cityUiVariant";

const SEX_OPTIONS = [
  { value: "", label: "— Стать —" },
  { value: "male", label: "Чоловіча" },
  { value: "female", label: "Жіноча" },
];

type FoundCharacter = { id: string; name: string; profession: string | null };

export function AdminSectionChangeClass() {
  const isL2 = getCityUiVariant() === "l2";
  const accentStyle = { color: isL2 ? "#e8c56e" : "#c7ad80" };
  const mutedClass = isL2 ? "text-[#8a7a60]" : "text-gray-500";
  const inputCl =
    "text-sm py-2 px-3 rounded-md bg-black/40 border text-white placeholder-gray-500 w-full " +
    (isL2 ? "border-[#5c4a32]/70 focus:border-[#c7ad80]/45" : "border-[#c7ad80]/30");

  const professionGroups = useMemo(() => getAdminProfessionSelectGroups(), []);

  const [nick, setNick] = useState("");
  const [found, setFound] = useState<FoundCharacter | null>(null);
  const [newProfession, setNewProfession] = useState("");
  const [newSex, setNewSex] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSearch = async () => {
    if (!nick.trim()) return;
    setMessage(null);
    setFound(null);
    try {
      const data = await adminFindPlayerByName(nick.trim());
      if (data?.character?.id) {
        const c = data.character as any;
        const sex = c.sex;
        if (sex === "male" || sex === "female") setNewSex(sex);
        setFound({
          id: c.id,
          name: c.name,
          profession: c.profession != null ? String(c.profession) : null,
        });
        setMessage(`Знайдено: ${c.name}`);
      } else {
        setMessage("Персонажа не знайдено");
      }
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    }
  };

  const openModal = () => {
    if (!found) {
      setMessage("Спочатку знайдіть персонажа за ніком.");
      return;
    }
    setNewProfession("");
    setMessage(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!loading) setModalOpen(false);
  };

  const handleConfirmChange = async () => {
    if (!found) return;
    setMessage(null);
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
      const curNorm = normalizeProfessionId(found.profession);
      const selNorm = normalizeProfessionId(newProfession as ProfessionId);
      if (curNorm && selNorm && curNorm === selNorm) {
        setMessage("Персонаж вже має цю професію.");
        setLoading(false);
        return;
      }
      await adminChangeClass(found.id, newProfession, [], newSex);
      const labelFromGroups =
        professionGroups.flatMap((g) => g.options).find((p) => p.id === newProfession)?.label ?? newProfession;
      setModalOpen(false);
      setMessage(
        `Професію змінено на «${labelFromGroups}» (${found.name}). Старі скіли зняті; нові — вчити в гільдії. Гравцю — F5.`
      );
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const modalShell = isL2
    ? "rounded-xl border border-[#c7ad80]/35 p-5 max-w-lg w-full shadow-[0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(120,90,45,0.22)_0%,transparent_55%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]"
    : "bg-[#14110c] border border-[#c7ad80]/40 rounded-lg p-5 max-w-lg w-full shadow-xl";

  const btnSecondary = isL2
    ? "px-4 py-2 rounded-md border border-[#5c4a32]/70 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-xs text-[#d4c4a8] hover:border-[#c7ad80]/40 disabled:opacity-50"
    : "px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-gray-300 hover:bg-[#3a3a3a] disabled:opacity-50";

  const btnPrimary = isL2
    ? "px-4 py-2 rounded-md border border-[#c7ad80]/40 bg-gradient-to-b from-[#4a3d28] to-[#2a2318] text-xs font-semibold text-[#e8dcc8] hover:border-[#e8c56e]/55 hover:brightness-110 disabled:opacity-50"
    : "px-4 py-2 rounded-md bg-[#c7ad80]/25 text-[#c7ad80] text-xs font-semibold hover:bg-[#c7ad80]/35 disabled:opacity-50";

  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3">
      <h2 className="text-sm font-semibold mb-2" style={accentStyle}>
        Змінити клас
      </h2>
      <p className={`text-xs mb-3 ${mutedClass}`}>
        Знайдіть гравця, потім оберіть професію. Старі скіли знімаються — нові гравець вчить сам у гільдії. SP не чіпаємо.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          placeholder="Нік"
          className={`${inputCl} max-w-[10rem]`}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !nick.trim()}
          className={btnPrimary}
        >
          Знайти
        </button>
        <button
          type="button"
          onClick={openModal}
          disabled={loading || !found}
          className={btnPrimary}
        >
          Зміна професії…
        </button>
      </div>
      {found && (
        <p className={`mt-2 text-xs ${isL2 ? "text-[#d4c4a8]" : "text-gray-400"}`}>
          Обрано: <span className="font-medium text-[#c9a44c]">{found.name}</span>
          {found.profession ? ` · зараз: ${found.profession}` : ""}
        </p>
      )}
      {message && <p className={`mt-2 text-xs ${mutedClass}`}>{message}</p>}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-3 py-6"
          onClick={closeModal}
          role="presentation"
        >
          <div className={modalShell} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h3 className={isL2 ? "text-base font-semibold text-[#e8c56e]" : "text-base font-semibold text-[#b8860b]"}>
                  Зміна професії
                </h3>
                {found && (
                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    Персонаж: <span className="text-[#d4c4a8]">{found.name}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                className={isL2 ? "text-[#8a7a60] hover:text-[#d4c4a8] text-2xl leading-none" : "text-gray-400 hover:text-white text-2xl leading-none"}
                onClick={closeModal}
                aria-label="Закрити"
              >
                ×
              </button>
            </div>

            <p className={`text-xs mb-4 ${isL2 ? "text-[#b5a080]" : "text-gray-400"}`}>
              Після зміни всі вивчені скіли знімаються; гравець зможе вивчити нові в гільдії за SP. Обовʼязково оберіть стать.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className={`block text-xs mb-1 ${mutedClass}`}>Професія</label>
                <select
                  value={newProfession}
                  onChange={(e) => setNewProfession(e.target.value)}
                  className={inputCl}
                >
                  <option value="">— Оберіть професію —</option>
                  {professionGroups.map((g) => (
                    <optgroup key={g.groupLabel} label={g.groupLabel}>
                      {g.options.map((p) => (
                        <option key={p.id} value={p.id}>
                          [lvl {p.minLevel}+] {p.label} · {p.guildLabel}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs mb-1 ${mutedClass}`}>Стать</label>
                <select value={newSex} onChange={(e) => setNewSex(e.target.value)} className={inputCl}>
                  {SEX_OPTIONS.map((o) => (
                    <option key={o.value || "empty"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={closeModal} disabled={loading} className={btnSecondary}>
                Скасувати
              </button>
              <button type="button" onClick={handleConfirmChange} disabled={loading} className={btnPrimary}>
                {loading ? "…" : "Підтвердити зміну"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
