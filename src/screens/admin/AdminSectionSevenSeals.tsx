import React, { useState } from "react";
import { adminSevenSealsSendMail } from "../../utils/api";

const style = { color: "#c7ad80" };

/**
 * Seven Seals — Розсилка листів
 * Кнопка примусово запускає розсилку листів топ-3 гравцям Seven Seals.
 * Используется для тестирования или ручного триггера рассылки наград.
 */
export function AdminSectionSevenSeals() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSendMail = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const res = await adminSevenSealsSendMail();
      setMessage(`Готово. Відправлено: ${res.sent ?? 0}, пропущено: ${res.skipped ?? 0}`);
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold mb-2" style={style}>Seven Seals — Розсилка листів</h2>
      <p className="text-xs text-gray-500 mb-2">
        Примусова розсилка листів з нагородами топ-3 гравцям Seven Seals. Используется для теста или ручного запуска.
      </p>
      <button
        type="button"
        onClick={handleSendMail}
        disabled={loading}
        className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50"
      >
        {loading ? "..." : "Розіслати листи топ-3"}
      </button>
      {message && <p className="mt-1 text-xs text-gray-500">{message}</p>}
    </section>
  );
}
