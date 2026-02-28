import React, { useEffect, useState } from "react";
import { getAdminActionLogs, type AdminActionLog } from "../../utils/api";

const style = { color: "#c7ad80" };

export function AdminSectionAuditLog() {
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState("");
  const [adminLogin, setAdminLogin] = useState("");
  const [target, setTarget] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const loadLogs = async (nextPage: number = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminActionLogs({
        action: action.trim() || undefined,
        adminLogin: adminLogin.trim() || undefined,
        target: target.trim() || undefined,
        status: status.trim() || undefined,
        page: nextPage,
        limit,
      });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setPage(nextPage);
    } catch (err: any) {
      setError(err?.message || "Помилка завантаження журналу");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pages = Math.max(1, Math.ceil(total / limit));
  const inputCl = "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500";

  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3">
      <h2 className="text-sm font-semibold mb-2" style={style}>Audit Log</h2>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Action" className={`${inputCl} w-40`} />
        <input value={adminLogin} onChange={(e) => setAdminLogin(e.target.value)} placeholder="Admin login" className={`${inputCl} w-36`} />
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target" className={`${inputCl} w-36`} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCl} w-28`}>
          <option value="">Статус</option>
          <option value="success">success</option>
          <option value="failed">failed</option>
        </select>
        <button
          type="button"
          onClick={() => loadLogs(1)}
          disabled={loading}
          className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50"
        >
          {loading ? "..." : "Оновити"}
        </button>
      </div>

      {error ? <p className="text-xs text-red-400 mb-2">{error}</p> : null}

      <div className="max-h-72 overflow-auto border border-[#c7ad80]/20 rounded">
        <table className="w-full text-xs text-left">
          <thead className="sticky top-0 bg-[#1a1a1a]">
            <tr className="text-[#c7ad80]">
              <th className="px-2 py-1">Time</th>
              <th className="px-2 py-1">Admin</th>
              <th className="px-2 py-1">Action</th>
              <th className="px-2 py-1">Target</th>
              <th className="px-2 py-1">Status</th>
              <th className="px-2 py-1">Message</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-[#c7ad80]/10">
                <td className="px-2 py-1 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-2 py-1 text-gray-300">{log.adminLogin}</td>
                <td className="px-2 py-1 text-gray-200">{log.action}</td>
                <td className="px-2 py-1 text-gray-300">{log.targetCharacterName || log.targetCharacterId || "-"}</td>
                <td className={`px-2 py-1 ${log.status === "success" ? "text-green-400" : "text-red-400"}`}>{log.status}</td>
                <td className="px-2 py-1 text-gray-400">{log.message || "-"}</td>
              </tr>
            ))}
            {!loading && logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-3 text-center text-gray-500">Записів немає</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-2 text-xs">
        <button
          type="button"
          onClick={() => loadLogs(Math.max(1, page - 1))}
          disabled={loading || page <= 1}
          className="py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] disabled:opacity-50"
        >
          Назад
        </button>
        <span className="text-gray-400">{page} / {pages}</span>
        <button
          type="button"
          onClick={() => loadLogs(Math.min(pages, page + 1))}
          disabled={loading || page >= pages}
          className="py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] disabled:opacity-50"
        >
          Далі
        </button>
      </div>
    </section>
  );
}

