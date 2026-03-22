import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPlayerActivityLogs,
  getPlayerActivityRhythm,
  type PlayerActivityLogRow,
} from "../../utils/api";

const style = { color: "#c7ad80" };

const ACTION_OPTIONS = [
  { value: "", label: "Все действия" },
  { value: "character.sync", label: "Синхрон героя (прогресс)" },
  { value: "inventory.update", label: "Инвентарь" },
  { value: "market.list", label: "Рынок: выставил" },
  { value: "market.buy", label: "Рынок: купил" },
  { value: "market.cancel", label: "Рынок: снял лот" },
];

function safeJson(value: unknown): string {
  if (value == null) return "-";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function summarizeMetadata(action: string, m: Record<string, unknown>): string {
  if (action === "character.sync") {
    const parts: string[] = [];
    const mk = Number(m.mobsKilledDelta ?? 0);
    if (mk !== 0) parts.push(`мобы +${mk}`);
    const ad = Number(m.adenaDelta ?? 0);
    if (ad !== 0) parts.push(`адена ${ad > 0 ? "+" : ""}${ad}`);
    const ex = Number(m.expDelta ?? 0);
    if (ex !== 0) parts.push(`exp ${ex > 0 ? "+" : ""}${ex}`);
    const inv = Number(m.invDelta ?? 0);
    if (inv !== 0) parts.push(`инв ${inv > 0 ? "+" : ""}${inv}`);
    if (m.zoneId) parts.push(`зона ${m.zoneId}`);
    return parts.length ? parts.join(", ") : safeJson(m);
  }
  if (action === "market.buy") {
    return `${m.itemName || m.itemId} ×${m.qty} за ${m.pay} ${m.currency} (продавец: ${m.sellerName || m.sellerId})`;
  }
  if (action === "market.list") {
    return `${m.itemName || m.itemId} ×${m.listAmount} за ${m.price} ${m.currency}`;
  }
  if (action === "market.cancel") {
    return `лот ${m.listingId}`;
  }
  if (action === "inventory.update") {
    return `инв ${m.inventoryLen ?? "?"} (было ${m.prevInvLen ?? "?"})`;
  }
  return safeJson(m);
}

export function AdminSectionPlayerActivity() {
  const [logs, setLogs] = useState<PlayerActivityLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characterId, setCharacterId] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [action, setAction] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rhythmLoading, setRhythmLoading] = useState(false);
  const [rhythmError, setRhythmError] = useState<string | null>(null);
  const [rhythmText, setRhythmText] = useState<string | null>(null);
  const limit = 40;

  const loadLogs = useCallback(
    async (nextPage: number = page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getPlayerActivityLogs({
          characterId: characterId.trim() || undefined,
          characterName: characterName.trim() || undefined,
          action: action.trim() || undefined,
          from: fromDate ? new Date(fromDate).toISOString() : undefined,
          to: toDate ? new Date(`${toDate}T23:59:59.999`).toISOString() : undefined,
          page: nextPage,
          limit,
        });
        setLogs(res.logs || []);
        setTotal(res.total || 0);
        setPage(nextPage);
      } catch (err: any) {
        setError(err?.message || "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    },
    [action, characterId, characterName, fromDate, limit, page, toDate]
  );

  useEffect(() => {
    loadLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pages = Math.max(1, Math.ceil(total / limit));

  const loadRhythm = async () => {
    const id = characterId.trim();
    if (!id) {
      setRhythmError("Укажите ID персонажа (characterId)");
      return;
    }
    setRhythmLoading(true);
    setRhythmError(null);
    setRhythmText(null);
    try {
      const r = await getPlayerActivityRhythm(id, 200);
      if (!r.summary) {
        setRhythmText(
          `Событий с ростом mobsKilled между синхронами: ${r.syncEventsWithMobProgress}. Недостаточно пар для интервалов.`
        );
      } else {
        setRhythmText(
          `Пар синхронов с убийствами: ${r.summary.count}. Интервал между синхами (когда счётчик мобов вырос): мин ${r.summary.minLabel}, макс ${r.summary.maxLabel}, средн. ${r.summary.avgLabel}. (Точные интервалы между отдельными мобами = только если 1 моб за синк.)`
        );
      }
    } catch (e: any) {
      setRhythmError(e?.message || "Ошибка");
    } finally {
      setRhythmLoading(false);
    }
  };

  const inputCl = "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500";

  const actionLabel = useMemo(() => {
    const m = new Map(ACTION_OPTIONS.map((o) => [o.value, o.label]));
    return (a: string) => m.get(a) || a;
  }, []);

  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3">
      <h2 className="text-sm font-semibold mb-2" style={style}>
        Активность игроков
      </h2>
      <p className="text-xs text-gray-500 mb-2">
        Лог с сервера: синхрон героя (дельты мобов/адены/exp/инвентаря), обновление инвентаря, рынок. IP с прокси может
        быть неточным.
      </p>

      <div className="rounded border border-[#c7ad80]/20 bg-black/20 p-2 mb-3">
        <div className="text-[11px] text-[#c7ad80] mb-1">Ритм фарма (интервалы между синхами с +mobsKilled)</div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={characterId}
            onChange={(e) => setCharacterId(e.target.value)}
            placeholder="Character ID (cuid)"
            className={`${inputCl} flex-1 min-w-[200px]`}
          />
          <button
            type="button"
            onClick={loadRhythm}
            disabled={rhythmLoading}
            className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50"
          >
            {rhythmLoading ? "..." : "Считать ритм"}
          </button>
        </div>
        {rhythmError ? <p className="text-xs text-red-400 mt-1">{rhythmError}</p> : null}
        {rhythmText ? <p className="text-xs text-gray-400 mt-1">{rhythmText}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <input
          value={characterId}
          onChange={(e) => setCharacterId(e.target.value)}
          placeholder="ID персонажа"
          className={`${inputCl} w-44`}
        />
        <input
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          placeholder="Ник (частично)"
          className={`${inputCl} w-36`}
        />
        <select value={action} onChange={(e) => setAction(e.target.value)} className={`${inputCl} w-48`}>
          {ACTION_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={`${inputCl} w-36`} />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={`${inputCl} w-36`} />
        <button
          type="button"
          onClick={() => {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, "0");
            const d = String(now.getDate()).padStart(2, "0");
            const date = `${y}-${m}-${d}`;
            setFromDate(date);
            setToDate(date);
          }}
          className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30"
        >
          Сегодня
        </button>
        <button
          type="button"
          onClick={() => loadLogs(1)}
          disabled={loading}
          className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50"
        >
          {loading ? "..." : "Обновить"}
        </button>
      </div>

      {error ? <p className="text-xs text-red-400 mb-2">{error}</p> : null}

      <div className="max-h-96 overflow-auto border border-[#c7ad80]/20 rounded">
        <table className="w-full text-xs text-left">
          <thead className="sticky top-0 bg-[#1a1a1a]">
            <tr className="text-[#c7ad80]">
              <th className="px-2 py-1">Время</th>
              <th className="px-2 py-1">Персонаж</th>
              <th className="px-2 py-1">Действие</th>
              <th className="px-2 py-1">Кратко</th>
              <th className="px-2 py-1">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const exp = expandedId === log.id;
              const meta = (log.metadata || {}) as Record<string, unknown>;
              return (
                <React.Fragment key={log.id}>
                  <tr
                    className="border-t border-[#c7ad80]/10 cursor-pointer hover:bg-white/5"
                    onClick={() => setExpandedId(exp ? null : log.id)}
                    title="Нажмите для JSON"
                  >
                    <td className="px-2 py-1 text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-1 text-gray-200">
                      <div>{log.characterName}</div>
                      <div className="text-[10px] text-gray-500">{log.characterId}</div>
                    </td>
                    <td className="px-2 py-1 text-gray-200">{actionLabel(log.action)}</td>
                    <td className="px-2 py-1 text-gray-400 max-w-[240px] truncate">
                      {summarizeMetadata(log.action, meta)}
                    </td>
                    <td className="px-2 py-1 text-gray-500">{log.clientIp || "—"}</td>
                  </tr>
                  {exp ? (
                    <tr className="border-t border-[#c7ad80]/10 bg-black/25">
                      <td colSpan={5} className="px-2 py-2">
                        <pre className="text-[10px] text-gray-300 bg-black/40 p-2 rounded overflow-auto max-h-48">
                          {safeJson(meta)}
                        </pre>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
            {!loading && logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-3 text-center text-gray-500">
                  Записей нет
                </td>
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
        <span className="text-gray-400">
          Стр. {page} / {pages} (всего {total})
        </span>
        <button
          type="button"
          onClick={() => loadLogs(Math.min(pages, page + 1))}
          disabled={loading || page >= pages}
          className="py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] disabled:opacity-50"
        >
          Вперёд
        </button>
      </div>
    </section>
  );
}
