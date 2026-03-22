import React, { useState, useEffect, useCallback, useMemo } from "react";
import { adminCheck, adminStats, adminLogout } from "../utils/api";
import { getCityUiVariant } from "../utils/cityUiVariant";
import { AdminSectionItems } from "./admin/AdminSectionItems";
import { AdminSectionLevelExp } from "./admin/AdminSectionLevelExp";
import { AdminSectionAdena } from "./admin/AdminSectionAdena";
import { AdminSectionForceLogout } from "./admin/AdminSectionForceLogout";
import { AdminSectionBanUnban } from "./admin/AdminSectionBanUnban";
import { AdminSectionBlockUnblock } from "./admin/AdminSectionBlockUnblock";
import { AdminSectionMute } from "./admin/AdminSectionMute";
import { AdminSectionCoinLuck } from "./admin/AdminSectionCoinLuck";
import { AdminSectionCoinsSilver } from "./admin/AdminSectionCoinsSilver";
import { AdminSectionSevenSeals } from "./admin/AdminSectionSevenSeals";
import { AdminSectionPremium } from "./admin/AdminSectionPremium";
import { AdminSectionHealResurrect } from "./admin/AdminSectionHealResurrect";
import { AdminSectionPlayers } from "./admin/AdminSectionPlayers";
import { AdminSectionOnline } from "./admin/AdminSectionOnline";
import { AdminSectionLetters } from "./admin/AdminSectionLetters";
import { AdminSectionClans } from "./admin/AdminSectionClans";
import { AdminSectionChangeClass } from "./admin/AdminSectionChangeClass";
import { AdminSectionAuditLog } from "./admin/AdminSectionAuditLog";
import { AdminSectionPlayerActivity } from "./admin/AdminSectionPlayerActivity";
import { AdminSectionSignals } from "./admin/AdminSectionSignals";
import { AdminSectionQuickSearch } from "./admin/AdminSectionQuickSearch";

interface AdminDashboardProps {
  navigate: (path: string) => void;
}

type AdminCategoryId =
  | "search"
  | "economy"
  | "character"
  | "moderation"
  | "community"
  | "activity"
  | "signals"
  | "audit";

const CATEGORIES: { id: AdminCategoryId; label: string; hint?: string }[] = [
  {
    id: "search",
    label: "Пошук і гравці",
    hint: "Нік, список персонажів, онлайн",
  },
  {
    id: "economy",
    label: "Предмети й валюта",
    hint: "Інвентар, адена, печатки, преміум, монети",
  },
  {
    id: "character",
    label: "Персонаж",
    hint: "Рівень, досвід, клас, хіл, воскресіння",
  },
  {
    id: "moderation",
    label: "Модерація",
    hint: "Бан, блок, кік, вигнати, мут чату",
  },
  {
    id: "community",
    label: "Листи та клани",
    hint: "Пошта, листи, клани",
  },
  {
    id: "activity",
    label: "Активність гравців",
    hint: "Синхрони, ринок, інтервали фарму",
  },
  {
    id: "signals",
    label: "Сигнали",
    hint: "Евристики по логах, email-сповіщення",
  },
  { id: "audit", label: "Журнал", hint: "Аудит дій адміна" },
];

type LayoutMode = "tabs" | "full";

export default function AdminDashboard({ navigate }: AdminDashboardProps) {
  const isL2 = getCityUiVariant() === "l2";
  const [admin, setAdmin] = useState<{ login?: string } | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("tabs");
  const [activeCategory, setActiveCategory] = useState<AdminCategoryId>("search");
  const [filter, setFilter] = useState("");

  const accentStyle = { color: isL2 ? "#e8c56e" : "#c7ad80" };
  const mutedClass = isL2 ? "text-[#8a7a60]" : "text-gray-500";

  const shellBg = isL2
    ? "min-h-screen bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(90,70,40,0.35)_0%,transparent_55%),linear-gradient(180deg,#12100c_0%,#0a0907_100%)] text-[#d4c4a8]"
    : "min-h-screen bg-[#1a1a1a] text-[#c7ad80]";

  const mainFrame = isL2
    ? "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.55)] bg-[radial-gradient(ellipse_100%_40%_at_50%_-10%,rgba(120,90,45,0.22)_0%,transparent_45%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]"
    : "rounded-lg border border-[#c7ad80]/30 bg-[#222]/90 shadow-lg";

  const innerPanel = isL2
    ? "rounded-lg border border-[#5c4a32]/70 bg-gradient-to-b from-[#231e15]/95 to-[#100e0a]/95 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)]"
    : "rounded-md border border-[#c7ad80]/25 bg-[#1e1e1e]/80";

  const tabBtn = useCallback(
    (active: boolean) => {
      const base =
        "text-left text-xs sm:text-sm px-3 py-2 rounded-md transition-[border,background,color,box-shadow] duration-150 border";
      if (active) {
        return isL2
          ? `${base} border-[#c7ad80]/50 bg-gradient-to-b from-[#3a3224] to-[#1c1810] text-[#e8c56e] shadow-[inset_0_1px_0_rgba(232,197,110,0.12)]`
          : `${base} border-[#c7ad80]/45 bg-[#c7ad80]/20 text-[#c7ad80]`;
      }
      return isL2
        ? `${base} border-transparent text-[#a89470] hover:border-[#5c4a32]/55 hover:text-[#d4c4a8]`
        : `${base} border-transparent text-[#c7ad80]/75 hover:bg-[#c7ad80]/10 hover:text-[#c7ad80]`;
    },
    [isL2],
  );

  const renderCategory = (id: AdminCategoryId) => {
    switch (id) {
      case "search":
        return (
          <>
            <AdminSectionQuickSearch navigate={navigate} />
            <AdminSectionPlayers navigate={navigate} />
            <AdminSectionOnline navigate={navigate} />
          </>
        );
      case "economy":
        return (
          <>
            <AdminSectionItems navigate={navigate} />
            <AdminSectionAdena />
            <AdminSectionSevenSeals />
            <AdminSectionPremium />
            <AdminSectionCoinLuck />
            <AdminSectionCoinsSilver />
          </>
        );
      case "character":
        return (
          <>
            <AdminSectionLevelExp />
            <AdminSectionChangeClass />
            <AdminSectionHealResurrect />
          </>
        );
      case "moderation":
        return (
          <>
            <AdminSectionForceLogout />
            <AdminSectionBanUnban />
            <AdminSectionBlockUnblock />
            <AdminSectionMute />
          </>
        );
      case "community":
        return (
          <>
            <AdminSectionLetters />
            <AdminSectionClans navigate={navigate} />
          </>
        );
      case "activity":
        return <AdminSectionPlayerActivity />;
      case "signals":
        return <AdminSectionSignals />;
      case "audit":
        return <AdminSectionAuditLog />;
      default:
        return null;
    }
  };

  const filterNorm = filter.trim().toLowerCase();
  const visibleCategories = useMemo(() => {
    return CATEGORIES.filter((c) => {
      if (!filterNorm) return true;
      const hay = `${c.label} ${c.hint ?? ""}`.toLowerCase();
      return hay.includes(filterNorm);
    });
  }, [filterNorm]);

  useEffect(() => {
    adminCheck()
      .then((data) => {
        if (data?.ok && data?.admin) setAdmin(data.admin);
        else navigate("/admin/login");
      })
      .catch(() => navigate("/admin/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = async () => {
    await adminLogout().catch(() => {});
    navigate("/admin/login");
  };

  useEffect(() => {
    if (!loading) adminStats().then((d) => setStats(d as Record<string, unknown>)).catch(() => setStats(null));
  }, [loading]);

  useEffect(() => {
    if (visibleCategories.length === 0) return;
    if (!visibleCategories.some((c) => c.id === activeCategory)) {
      setActiveCategory(visibleCategories[0].id);
    }
  }, [visibleCategories, activeCategory]);

  if (loading) {
    return (
      <div className={`${shellBg} flex items-center justify-center p-6`}>
        <div className="flex items-center gap-3">
          <div
            className={
              isL2
                ? "h-6 w-6 rounded-full border-2 border-[#5c4a32] border-t-[#e8c56e] animate-spin"
                : "h-6 w-6 rounded-full border-2 border-[#5c4a32] border-t-[#c7ad80] animate-spin"
            }
          />
          <span className="text-sm" style={accentStyle}>
            Завантаження…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${shellBg} p-3 sm:p-4 text-left`}>
      <div className="mx-auto max-w-5xl">
        <div className={`${mainFrame} p-4 sm:p-5`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#c7ad80]/25 pb-3 mb-4">
            <h1 className="text-base sm:text-lg font-semibold" style={accentStyle}>
              Адмін-панель{admin?.login ? ` · ${admin.login}` : ""}
            </h1>
            <button
              type="button"
              onClick={handleLogout}
              className="self-start sm:self-auto text-sm py-1.5 px-3 rounded-md bg-red-950/50 text-red-200 border border-red-800/50 hover:bg-red-900/40"
            >
              Вийти
            </button>
          </div>

          {stats && (
            <p className={`text-xs ${mutedClass} mb-4`}>
              Uptime: {String(stats.uptimeSec ?? 0)} с · {String(stats.nodeEnv ?? "—")}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <label className={`flex items-center gap-2 text-xs ${mutedClass}`}>
              <span className="shrink-0">Фільтр розділів</span>
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Напр. бан, предмет…"
                className={
                  isL2
                    ? "flex-1 min-w-0 text-sm py-1.5 px-2 rounded-md bg-black/35 border border-[#5c4a32]/60 text-[#e8dcc8] placeholder:text-[#6a5c48]"
                    : "flex-1 min-w-0 text-sm py-1.5 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500"
                }
              />
            </label>
            <button
              type="button"
              onClick={() => setLayoutMode((m) => (m === "tabs" ? "full" : "tabs"))}
              className={
                isL2
                  ? "text-xs sm:text-sm py-1.5 px-3 rounded-md border border-[#5c4a32]/60 text-[#c9a44c] hover:border-[#c7ad80]/45 hover:bg-[#2a2419]/80"
                  : "text-xs sm:text-sm py-1.5 px-3 rounded border border-[#c7ad80]/35 text-[#c7ad80] hover:bg-[#c7ad80]/15"
              }
            >
              {layoutMode === "tabs" ? "Усі розділи одним списком" : "Режим вкладок"}
            </button>
          </div>

          {layoutMode === "tabs" ? (
            <div className={`${innerPanel} p-3 sm:p-4`}>
              {visibleCategories.length === 0 ? (
                <p className={`text-sm ${mutedClass}`}>Нічого не знайдено за фільтром.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {visibleCategories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveCategory(c.id)}
                        className={tabBtn(activeCategory === c.id)}
                      >
                        <span className="block font-medium">{c.label}</span>
                        {c.hint ? <span className={`block text-[10px] sm:text-[11px] mt-0.5 ${mutedClass}`}>{c.hint}</span> : null}
                      </button>
                    ))}
                  </div>
                  <div className="min-h-[12rem]">{renderCategory(activeCategory)}</div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {visibleCategories.length === 0 ? (
                <p className={`text-sm ${mutedClass}`}>Нічого не знайдено за фільтром.</p>
              ) : (
                visibleCategories.map((c) => (
                  <div key={c.id} id={`admin-group-${c.id}`} className="scroll-mt-4">
                    <h2 className="text-sm font-semibold mb-2" style={accentStyle}>
                      {c.label}
                    </h2>
                    <div className={`${innerPanel} p-3 sm:p-4`}>{renderCategory(c.id)}</div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-[#c7ad80]/25">
            <button
              type="button"
              onClick={() => navigate("/city")}
              className={
                isL2
                  ? "text-sm py-1.5 px-3 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8c56e] hover:border-[#c7ad80]/50"
                  : "text-sm py-1.5 px-3 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30"
              }
            >
              В гру (місто)
            </button>
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className={
                isL2
                  ? "text-sm py-1.5 px-3 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#d4c4a8] hover:border-[#c7ad80]/50"
                  : "text-sm py-1.5 px-3 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30"
              }
            >
              Чат
            </button>
            <button
              type="button"
              onClick={() => navigate("/news")}
              className={
                isL2
                  ? "text-sm py-1.5 px-3 rounded-md bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#d4c4a8] hover:border-[#c7ad80]/50"
                  : "text-sm py-1.5 px-3 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30"
              }
            >
              Новини
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
