import React, { useState, useEffect } from "react";
import { adminStats } from "../utils/api";

interface AdminActionsModalProps {
  onClose: () => void;
  navigate: (path: string) => void;
}

export function AdminActionsModal({ onClose, navigate }: AdminActionsModalProps) {
  const [stats, setStats] = useState<{ uptimeSec?: number; nodeEnv?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminStats()
      .then((d) => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg border border-[#c7ad80]/50 bg-[#1a1a1a] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 border-b border-[#c7ad80]/30 pb-2">
          <h2 className="text-lg font-bold text-[#c7ad80]">Admin actions</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Закрити"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <section>
            <h3 className="text-[#c7ad80]/90 mb-1">Online / Stats</h3>
            {loading ? (
              <p className="text-gray-500">Загрузка...</p>
            ) : stats ? (
              <p className="text-gray-300">
                Uptime: {stats.uptimeSec ?? 0} сек · {stats.nodeEnv ?? "—"}
              </p>
            ) : (
              <p className="text-gray-500">—</p>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/admin");
              }}
              className="mt-1 text-[#c7ad80] hover:underline"
            >
              Повний пульт →
            </button>
          </section>

          <section>
            <h3 className="text-[#c7ad80]/90 mb-1">Search user</h3>
            <p className="text-gray-500">(скоро)</p>
          </section>

          <section>
            <h3 className="text-[#c7ad80]/90 mb-1">News</h3>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/news");
              }}
              className="text-[#c7ad80] hover:underline"
            >
              Відкрити стрічку новин →
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
