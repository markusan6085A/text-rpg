import React, { useState, useEffect } from "react";
import { adminMe, adminStats, adminLogout } from "../utils/api";
import { AdminSectionItems } from "./admin/AdminSectionItems";
import { AdminSectionLevelExp } from "./admin/AdminSectionLevelExp";
import { AdminSectionAdena } from "./admin/AdminSectionAdena";
import { AdminSectionForceLogout } from "./admin/AdminSectionForceLogout";
import { AdminSectionBanUnban } from "./admin/AdminSectionBanUnban";
import { AdminSectionBlockUnblock } from "./admin/AdminSectionBlockUnblock";
import { AdminSectionMute } from "./admin/AdminSectionMute";
import { AdminSectionCoinLuck } from "./admin/AdminSectionCoinLuck";

interface AdminDashboardProps {
  navigate: (path: string) => void;
}

const style = { color: "#c7ad80" };

export default function AdminDashboard({ navigate }: AdminDashboardProps) {
  const [admin, setAdmin] = useState<{ login?: string } | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!loading) adminStats().then((d) => setStats(d as Record<string, unknown>)).catch(() => setStats(null));
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-[#c7ad80]">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#c7ad80] p-4 text-left">
      <div className="max-w-2xl">
        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-[#c7ad80]/30">
          <h1 className="text-base font-semibold" style={style}>
            Адмін-панель {admin?.login ? `(${admin.login})` : ""}
          </h1>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm py-1 px-2 rounded bg-red-900/40 text-red-300 hover:bg-red-900/60"
          >
            Вийти
          </button>
        </div>

        {stats && (
          <p className="text-xs text-gray-500 mb-3">
            Uptime: {String(stats.uptimeSec ?? 0)} сек · {String(stats.nodeEnv ?? "—")}
          </p>
        )}

        <div className="flex flex-col">
          <AdminSectionItems navigate={navigate} />
          <AdminSectionLevelExp />
          <AdminSectionAdena />
          <AdminSectionForceLogout />
          <AdminSectionBanUnban />
          <AdminSectionBlockUnblock />
          <AdminSectionMute />
          <AdminSectionCoinLuck />
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#c7ad80]/30">
          <button type="button" onClick={() => navigate("/city")} className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30">
            В гру (город)
          </button>
          <button type="button" onClick={() => navigate("/chat")} className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30">
            Чат
          </button>
          <button type="button" onClick={() => navigate("/news")} className="text-sm py-1 px-2 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30">
            Новини
          </button>
        </div>
      </div>
    </div>
  );
}
