import React, { useState, useEffect } from "react";
import { adminMe, adminStats, adminLogout } from "../utils/api";

interface AdminDashboardProps {
  navigate: (path: string) => void;
}

export default function AdminDashboard({ navigate }: AdminDashboardProps) {
  const [admin, setAdmin] = useState<{ login?: string } | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    adminMe()
      .then((data) => setAdmin(data?.admin ?? null))
      .catch((err) => {
        if (err?.status === 401) navigate("/admin/login");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = async () => {
    await adminLogout().catch(() => {});
    navigate("/admin/login");
  };

  const handleRefreshStats = async () => {
    setStatsLoading(true);
    try {
      const data = await adminStats();
      setStats(data as Record<string, unknown>);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-[#c7ad80]">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 border-b border-[#c7ad80]/40 pb-4">
          <h1 className="text-xl font-bold text-[#c7ad80]">
            Адмін-панель {admin?.login ? `(${admin.login})` : ""}
          </h1>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded bg-red-900/40 border border-red-500/60 text-red-300 hover:bg-red-900/60"
          >
            Вийти
          </button>
        </div>

        <section className="mb-6">
          <h2 className="text-lg text-[#c7ad80]/90 mb-2">Stats</h2>
          <button
            type="button"
            onClick={handleRefreshStats}
            disabled={statsLoading}
            className="px-4 py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/30 disabled:opacity-50 mb-3"
          >
            {statsLoading ? "Оновлення..." : "Оновити stats"}
          </button>
          {stats && (
            <pre className="p-4 rounded bg-black/40 border border-[#c7ad80]/30 text-sm text-gray-300 overflow-auto">
              {JSON.stringify(stats, null, 2)}
            </pre>
          )}
        </section>

        <section className="mb-6">
          <h2 className="text-lg text-[#c7ad80]/90 mb-2">Швидкі посилання</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/30"
            >
              В гру
            </button>
            <button
              type="button"
              onClick={() => navigate("/city")}
              className="px-4 py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/30"
            >
              Город (з кнопкою Адмін)
            </button>
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="px-4 py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/30"
            >
              Чат (модерація)
            </button>
            <button
              type="button"
              onClick={() => navigate("/news")}
              className="px-4 py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/30"
            >
              Новини
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
