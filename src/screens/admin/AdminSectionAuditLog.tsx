import React, { useEffect, useMemo, useState } from "react";
import { adminCheck, getAdminActionLogs, type AdminActionLog } from "../../utils/api";
import { isWarmCityUi, useCityUiVariant } from "../../utils/cityUiVariant";

export function AdminSectionAuditLog() {
  const cityUi = useCityUiVariant();
  const isL2 = isWarmCityUi(cityUi);
  const btnCl = isL2
    ? "text-sm py-1 px-2 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8dcc8] shadow-[inset_0_1px_0_rgba(199,173,128,0.12)] hover:border-[#c7ad80]/50 hover:brightness-110 transition-[border-color,filter] duration-150 disabled:opacity-50"
    : "text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50";
  const tableWrapCl = isL2
    ? "max-h-72 overflow-auto rounded-md border border-[#5c4a32]/60 bg-black/20"
    : "max-h-72 overflow-auto border border-[#c7ad80]/20 rounded";
  const theadCl = isL2 ? "sticky top-0 bg-[#1a1610] border-b border-[#5c4a32]/45" : "sticky top-0 bg-[#1a1a1a]";
  const rowHoverCl = isL2 ? "border-t border-[#5c4a32]/25 cursor-pointer hover:bg-[#2a2418]/60" : "border-t border-[#c7ad80]/10 cursor-pointer hover:bg-white/5";

  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAdminLogin, setCurrentAdminLogin] = useState<string>("");
  const [action, setAction] = useState("");
  const [adminLogin, setAdminLogin] = useState("");
  const [target, setTarget] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const loadLogs = async (
    nextPage: number = page,
    filterOverride?: { action?: string; adminLogin?: string }
  ) => {
    const act = filterOverride?.action !== undefined ? filterOverride.action : action;
    const adm = filterOverride?.adminLogin !== undefined ? filterOverride.adminLogin : adminLogin;
    if (filterOverride?.action !== undefined) setAction(filterOverride.action);
    if (filterOverride?.adminLogin !== undefined) setAdminLogin(filterOverride.adminLogin);

    setLoading(true);
    setError(null);
    try {
      const res = await getAdminActionLogs({
        action: act.trim() || undefined,
        adminLogin: adm.trim() || undefined,
        target: target.trim() || undefined,
        status: status.trim() || undefined,
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate ? new Date(`${toDate}T23:59:59.999`).toISOString() : undefined,
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

  useEffect(() => {
    adminCheck()
      .then((res) => setCurrentAdminLogin(String(res?.admin?.login || "")))
      .catch(() => setCurrentAdminLogin(""));
  }, []);

  const actionLabelMap = useMemo<Record<string, string>>(
    () => ({
      "admin.find_player_by_name": "Поиск персонажа",
      "admin.give_item": "Выдать предмет",
      "admin.take_item": "Забрать предмет",
      "admin.set_level": "Изменить уровень",
      "admin.set_adena": "Изменить адену",
      "admin.set_coin_luck": "Изменить Coin of Luck",
      "admin.set_coins_silver": "Изменить Серебряные монеты",
      "admin.force_logout": "Принудительный выход",
      "admin.ban": "Бан",
      "admin.unban": "Разбан",
      "admin.block": "Блокировка",
      "admin.unblock": "Разблокировка",
      "admin.mute": "Мут",
      "admin.heal": "Лікування",
      "admin.resurrect": "Воскрешение",
      "admin.set_premium": "Выдача премиума",
      "admin.send_letter": "Системное письмо",
      "admin.disband_clan": "Роспуск клана",
      "admin.kick_from_clan": "Исключение из клана",
      "system.client_error": "Помилка клієнта (API / гра)",
    }),
    []
  );

  const statusLabel = (raw: string) => (raw === "success" ? "Успешно" : raw === "failed" ? "Ошибка" : raw || "-");
  const actionLabel = (raw: string) => actionLabelMap[raw] || raw;

  const safeJson = (value: unknown): string => {
    if (value == null) return "-";
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const applyTodayFilter = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    setFromDate(date);
    setToDate(date);
  };

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = [
      "Время",
      "Админ",
      "Действие",
      "Цель",
      "Статус",
      "Сообщение",
      "До",
      "После",
      "Метаданные",
    ];
    const rows = logs.map((log) => [
      new Date(log.createdAt).toLocaleString(),
      log.adminLogin,
      actionLabel(log.action),
      log.targetCharacterName || log.targetCharacterId || "",
      statusLabel(log.status),
      log.message || "",
      safeJson(log.before),
      safeJson(log.after),
      safeJson(log.metadata),
    ]);
    const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-page-${page}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const pages = Math.max(1, Math.ceil(total / limit));
  const inputCl =
    "text-sm py-1 px-2 rounded-md bg-black/40 border text-white placeholder-gray-500 " +
    (isL2 ? "border-[#5c4a32]/70 focus:border-[#c7ad80]/45 focus:outline-none" : "border-[#c7ad80]/30");

  return (
    <section className={isL2 ? "border-t border-[#5c4a32]/40 pt-3 pb-3" : "border-t border-[#c7ad80]/30 pt-3 pb-3"}>
      <h2
        className={
          isL2
            ? "text-sm font-semibold mb-2 text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]"
            : "text-sm font-semibold mb-2 text-[#c7ad80]"
        }
      >
        Журнал действий админов
      </h2>
      <p className={isL2 ? "text-xs text-[#8a7a60] mb-2" : "text-xs text-gray-500 mb-2"}>
        Лог админ-действий и системных ошибок клиента (409, 5xx на /characters — залогиненный игрок).
        Фильтр по «Логин админа»:{" "}
        <span className={isL2 ? "text-[#c9a44c]" : "text-[#c7ad80]/90"}>system</span> — только записи с игры.
      </p>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Код действия" className={`${inputCl} w-40`} />
        <input value={adminLogin} onChange={(e) => setAdminLogin(e.target.value)} placeholder="Логин админа" className={`${inputCl} w-36`} />
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Цель (ник/ID)" className={`${inputCl} w-36`} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCl} w-28`}>
          <option value="">Статус</option>
          <option value="success">Успешно</option>
          <option value="failed">Ошибка</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={`${inputCl} w-36`} title="Дата от" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={`${inputCl} w-36`} title="Дата до" />
        <button type="button" onClick={applyTodayFilter} className={btnCl}>
          Сегодня
        </button>
        <button type="button" onClick={() => setStatus("failed")} className={btnCl}>
          Только ошибки
        </button>
        <button type="button" onClick={() => setAdminLogin(currentAdminLogin)} className={btnCl} disabled={!currentAdminLogin}>
          Мои действия
        </button>
        <button
          type="button"
          onClick={() => void loadLogs(1, { adminLogin: "system", action: "system.client_error" })}
          className={btnCl}
        >
          Системні (гра)
        </button>
        <button type="button" onClick={() => loadLogs(1)} disabled={loading} className={btnCl}>
          {loading ? "..." : "Обновить"}
        </button>
        <button type="button" onClick={exportCsv} disabled={loading || logs.length === 0} className={btnCl}>
          Экспорт CSV
        </button>
      </div>

      {error ? <p className="text-xs text-red-400 mb-2">{error}</p> : null}

      <div className={tableWrapCl}>
        <table className="w-full text-xs text-left">
          <thead className={theadCl}>
            <tr className={isL2 ? "text-[#e8c56e]" : "text-[#c7ad80]"}>
              <th className="px-2 py-1">Время</th>
              <th className="px-2 py-1">Админ</th>
              <th className="px-2 py-1">Действие</th>
              <th className="px-2 py-1">Цель</th>
              <th className="px-2 py-1">Статус</th>
              <th className="px-2 py-1">Комментарий</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const expanded = expandedLogId === log.id;
              return (
                <React.Fragment key={log.id}>
                  <tr
                    className={rowHoverCl}
                    onClick={() => setExpandedLogId(expanded ? null : log.id)}
                    title="Нажмите для деталей"
                  >
                    <td className={isL2 ? "px-2 py-1 text-[#8a7a60]" : "px-2 py-1 text-gray-400"}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className={isL2 ? "px-2 py-1 text-[#d4c4a8]" : "px-2 py-1 text-gray-300"}>{log.adminLogin}</td>
                    <td className={isL2 ? "px-2 py-1 text-[#e8dcc8]" : "px-2 py-1 text-gray-200"}>
                      {actionLabel(log.action)}
                    </td>
                    <td className={isL2 ? "px-2 py-1 text-[#d4c4a8]" : "px-2 py-1 text-gray-300"}>
                      {log.targetCharacterName || log.targetCharacterId || "-"}
                    </td>
                    <td className={`px-2 py-1 ${log.status === "success" ? "text-green-400" : "text-red-400"}`}>
                      {statusLabel(log.status)}
                    </td>
                    <td className={isL2 ? "px-2 py-1 text-[#8a7a60]" : "px-2 py-1 text-gray-400"}>
                      {log.message || "-"}
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className={isL2 ? "border-t border-[#5c4a32]/30 bg-black/35" : "border-t border-[#c7ad80]/10 bg-black/20"}>
                      <td colSpan={6} className="px-2 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <div className={isL2 ? "text-[11px] text-[#c9a44c] mb-1" : "text-[11px] text-[#c7ad80] mb-1"}>
                              До изменения
                            </div>
                            <pre
                              className={
                                isL2
                                  ? "text-[10px] text-[#d4c4a8] bg-black/50 p-2 rounded-md border border-[#5c4a32]/40 overflow-auto max-h-40"
                                  : "text-[10px] text-gray-300 bg-black/40 p-2 rounded overflow-auto max-h-40"
                              }
                            >
                              {safeJson(log.before)}
                            </pre>
                          </div>
                          <div>
                            <div className={isL2 ? "text-[11px] text-[#c9a44c] mb-1" : "text-[11px] text-[#c7ad80] mb-1"}>
                              После изменения
                            </div>
                            <pre
                              className={
                                isL2
                                  ? "text-[10px] text-[#d4c4a8] bg-black/50 p-2 rounded-md border border-[#5c4a32]/40 overflow-auto max-h-40"
                                  : "text-[10px] text-gray-300 bg-black/40 p-2 rounded overflow-auto max-h-40"
                              }
                            >
                              {safeJson(log.after)}
                            </pre>
                          </div>
                          <div>
                            <div className={isL2 ? "text-[11px] text-[#c9a44c] mb-1" : "text-[11px] text-[#c7ad80] mb-1"}>
                              Метаданные
                            </div>
                            <pre
                              className={
                                isL2
                                  ? "text-[10px] text-[#d4c4a8] bg-black/50 p-2 rounded-md border border-[#5c4a32]/40 overflow-auto max-h-40"
                                  : "text-[10px] text-gray-300 bg-black/40 p-2 rounded overflow-auto max-h-40"
                              }
                            >
                              {safeJson(log.metadata)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
            {!loading && logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className={isL2 ? "px-2 py-3 text-center text-[#8a7a60]" : "px-2 py-3 text-center text-gray-500"}
                >
                  Записей нет
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-2 text-xs">
        <button type="button" onClick={() => loadLogs(Math.max(1, page - 1))} disabled={loading || page <= 1} className={btnCl}>
          Назад
        </button>
        <span className={isL2 ? "text-[#8a7a60]" : "text-gray-400"}>
          Страница {page} / {pages}
        </span>
        <button
          type="button"
          onClick={() => loadLogs(Math.min(pages, page + 1))}
          disabled={loading || page >= pages}
          className={btnCl}
        >
          Вперёд
        </button>
      </div>
    </section>
  );
}

