import React, { useState } from "react";
import { adminFindPlayerByName, adminSendLetter, adminGetPlayerLetters } from "../../utils/api";

const style = { color: "#c7ad80" };

/**
 * Системные письма
 * Отправка письма от имени "[Система]" игроку.
 * Используется для предупреждений, объявлений, возврата предметов.
 *
 * Просмотр писем игрока
 * Показывает входящие и исходящие письма выбранного игрока (для разбора жалоб).
 */
export function AdminSectionLetters() {
  const [nick, setNick] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageResult, setMessageResult] = useState<string | null>(null);
  const [showInbox, setShowInbox] = useState(false);
  const [letters, setLetters] = useState<any[]>([]);
  const [lettersTotal, setLettersTotal] = useState(0);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessageResult(null);
    if (!nick.trim() || !message.trim()) {
      setMessageResult("Введіть нік та текст листа");
      return;
    }
    setLoading(true);
    try {
      await adminSendLetter({
        toCharacterName: nick.trim(),
        subject: subject.trim() || "[Система]",
        message: message.trim(),
      });
      setMessageResult(`Лист відправлено: ${nick}`);
      setMessage("");
    } catch (err: any) {
      setMessageResult(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const handleViewLetters = async () => {
    if (!nick.trim()) return;
    setLoading(true);
    setMessageResult(null);
    try {
      const data = await adminFindPlayerByName(nick.trim());
      if (!data?.character?.id) {
        setMessageResult("Персонажа не знайдено");
        return;
      }
      const res = await adminGetPlayerLetters(data.character.id, 1, 30);
      setLetters(res.letters || []);
      setLettersTotal(res.total || 0);
      setShowInbox(true);
    } catch (err: any) {
      setMessageResult(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  const inputCl = "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500";

  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3">
      <h2 className="text-sm font-semibold mb-2" style={style}>Системные письма / Просмотр писем</h2>
      <p className="text-xs text-gray-500 mb-2">
        Отправка письма от имени [Система]. Просмотр входящих и исходящих писем игрока.
      </p>
      <form onSubmit={handleSend} className="flex flex-col gap-2 mb-2">
        <div className="flex flex-wrap gap-2">
          <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Нік одержувача" className={`${inputCl} w-36`} />
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Тема (необовʼязково)" className={`${inputCl} w-44`} />
        </div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Текст листа" className={`${inputCl} w-full min-h-[60px]`} rows={2} />
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50">
            Відправити
          </button>
          <button type="button" onClick={handleViewLetters} disabled={loading} className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50">
            Показать письма игрока
          </button>
        </div>
      </form>
      {messageResult && <p className="text-xs text-gray-500 mb-2">{messageResult}</p>}
      {showInbox && (
        <div className="border border-[#c7ad80]/20 rounded p-2 max-h-48 overflow-auto">
          <div className="text-xs text-[#c7ad80] mb-1">Письма {nick} ({lettersTotal} всего)</div>
          {letters.length === 0 ? (
            <p className="text-xs text-gray-500">Нет писем</p>
          ) : (
            <div className="space-y-2 text-xs">
              {letters.map((l) => (
                <div key={l.id} className="bg-black/30 p-2 rounded border border-white/5">
                  <div className="text-gray-400">
                    {l.fromCharacter?.name} → {l.toCharacter?.name} · {l.createdAt ? new Date(l.createdAt).toLocaleString() : ""}
                  </div>
                  <div className="text-[#c7ad80] font-medium">{l.subject || "(без темы)"}</div>
                  <div className="text-gray-300 truncate max-w-full">{l.message}</div>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => setShowInbox(false)} className="mt-1 text-xs text-gray-500 hover:underline">Скрыть</button>
        </div>
      )}
    </section>
  );
}
