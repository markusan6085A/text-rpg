import React, { useState } from "react";
import { adminSevenSealsSendMail } from "../../utils/api";

const style = { color: "#c7ad80" };

/**
 * Seven Seals — примусовий фінал тижня (ТОП-3, нагороди в БД, листи).
 */
export function AdminSectionSevenSeals() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSendMail = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const res = await adminSevenSealsSendMail();
      setMessage(
        `Готово. finalized=${String(res.finalized)}, weekKey=${res.weekKey ?? "—"}, top3=${res.top3 ?? "—"}, skipped=${res.skipped ?? "—"}`,
      );
    } catch (err: any) {
      setMessage(err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold mb-2" style={style}>Seven Seals — фінал тижня (тест)</h2>
      <p className="text-xs text-gray-500 mb-2">
        Примусово: підрахунок медалей за закритий тиждень, нарахування бонусів ТОП-3, листи від Existence (якщо є відправник).
      </p>
      <button
        type="button"
        onClick={handleSendMail}
        disabled={loading}
        className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50"
      >
        {loading ? "..." : "Запустити фінал Seven Seals"}
      </button>
      {message && <p className="mt-1 text-xs text-gray-500">{message}</p>}
    </section>
  );
}
