import React, { useCallback, useEffect, useState } from "react";
import { getAdminSignalsAnalyze, type AdminSignalFinding } from "../../utils/api";

const style = { color: "#c7ad80" };

const severityClass = (s: string) => {
  if (s === "high") return "text-red-400";
  if (s === "medium") return "text-amber-400";
  return "text-gray-400";
};

export function AdminSectionSignals() {
  const [hours, setHours] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [findings, setFindings] = useState<AdminSignalFinding[]>([]);
  const [meta, setMeta] = useState<{
    logRowCount: number;
    logRowCap: number;
    emailConfigured: boolean;
    generatedAt: string;
    thresholds: Record<string, number>;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getAdminSignalsAnalyze(hours);
      setFindings(r.findings || []);
      setMeta({
        logRowCount: r.logRowCount,
        logRowCap: r.logRowCap,
        emailConfigured: r.emailConfigured,
        generatedAt: r.generatedAt,
        thresholds: r.thresholds,
      });
    } catch (e: any) {
      setError(e?.message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    load();
  }, [load]);

  const inputCl =
    "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500";

  return (
    <section className="border-t border-[#c7ad80]/30 pt-3 pb-3">
      <h2 className="text-sm font-semibold mb-2" style={style}>
        Сигнали (античит-евристики)
      </h2>
      <p className="text-xs text-gray-500 mb-2">
        Автоматичні підказки по <code className="text-gray-400">PlayerActivityLog</code>: дуже часті синки, великі Δadena/Δexp,
        стрибок рівня, «рівні» інтервали між синками з +mobsKilled. Це не вирок — лише для ручної перевірки. На пошту
        лист піде лише якщо налаштовано SMTP (див. змінні середовища сервера), з cooldown на кожен тип сигналу по персонажу.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <label className="text-xs text-gray-400 flex items-center gap-1">
          Вікно, год:
          <input
            type="number"
            min={1}
            max={168}
            value={hours}
            onChange={(e) => setHours(Math.min(168, Math.max(1, Number(e.target.value) || 6)))}
            className={`${inputCl} w-20`}
          />
        </label>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50"
        >
          {loading ? "…" : "Оновити"}
        </button>
      </div>

      {meta ? (
        <p className="text-[11px] text-gray-500 mb-2">
          Рядків у вибірці: {meta.logRowCount}
          {meta.logRowCount >= meta.logRowCap ? ` (ліміт ${meta.logRowCap})` : ""}. Email SMTP:{" "}
          {meta.emailConfigured ? (
            <span className="text-green-500/90">увімкнено</span>
          ) : (
            <span className="text-amber-500/90">не налаштовано</span>
          )}
          . Оновлено: {new Date(meta.generatedAt).toLocaleString()}
        </p>
      ) : null}

      {meta?.thresholds ? (
        <details className="text-[10px] text-gray-600 mb-2">
          <summary className="cursor-pointer text-[#c7ad80]/80">Пороги (env / дефолт)</summary>
          <pre className="mt-1 bg-black/30 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(meta.thresholds, null, 2)}
          </pre>
        </details>
      ) : null}

      {error ? <p className="text-xs text-red-400 mb-2">{error}</p> : null}

      <div className="space-y-2 max-h-[28rem] overflow-auto">
        {findings.length === 0 && !loading ? (
          <p className="text-xs text-gray-500">Сигналів за це вікно немає (або логів ще мало).</p>
        ) : null}
        {findings.map((f) => (
          <div
            key={f.characterId}
            className="rounded border border-[#c7ad80]/20 bg-black/20 p-2 text-xs"
          >
            <div className="font-medium text-gray-200">
              {f.characterName}{" "}
              <span className="text-gray-500 font-normal">({f.characterId})</span>
            </div>
            <div className="text-[10px] text-gray-500 mb-1">accountId: {f.accountId}</div>
            <ul className="list-disc pl-4 space-y-1">
              {f.signals.map((s, i) => (
                <li key={`${s.kind}-${i}`} className={severityClass(s.severity)}>
                  <span className="font-mono text-[10px]">{s.kind}</span> — {s.detail}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
