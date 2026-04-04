import React, { useState, useEffect } from "react";
import { adminLogin, adminCheck, listCharacters } from "../utils/api";
import { useAuthStore } from "../state/authStore";
import { useAdminStore } from "../state/adminStore";
import { useCharacterStore } from "../state/characterStore";
import { useHeroStore } from "../state/heroStore";
import { loadHeroFromAPI } from "../state/heroStore/heroLoadAPI";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";
import { hardReloadOnceAfterAuth } from "../utils/hardReloadForNewAppBundle";

interface AdminLoginProps {
  navigate: (path: string) => void;
  navigateNoReload?: (path: string) => void;
}

export default function AdminLogin({ navigate, navigateNoReload }: AdminLoginProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const isL2 = isWarmCityUi(getCityUiVariant());
  const pageShell = isL2
    ? "min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(90,70,40,0.35)_0%,transparent_55%),linear-gradient(180deg,#12100c_0%,#0a0907_100%)]"
    : "min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4";
  const cardShell = isL2
    ? `${L2_WARM_OUTER_FRAME} w-full max-w-sm p-6`
    : "w-full max-w-sm rounded-lg border border-[#c7ad80]/40 bg-[#252525] p-6 shadow-lg";
  const titleClass = isL2
    ? "text-xl font-bold text-[#e8c56e] mb-4 text-center [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
    : "text-xl font-bold text-[#c7ad80] mb-4 text-center";
  const labelClass = isL2 ? "block text-sm text-[#8a7a60] mb-1" : "block text-sm text-[#c7ad80]/80 mb-1";
  const inputClass = isL2
    ? "w-full px-3 py-2 rounded-md bg-[#14110c] border border-[#5c4a32]/70 text-[#d4c4a8] placeholder-[#6b5c42] focus:outline-none focus:border-[#c7ad80]/55"
    : "w-full px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white placeholder-gray-500 focus:outline-none focus:border-[#c7ad80]";
  const submitClass = isL2
    ? "w-full py-2.5 rounded-md font-medium bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8c56e] hover:border-[#c7ad80]/50 hover:brightness-110 active:scale-[0.99] transition-[border-color,transform,filter] duration-150 disabled:opacity-50"
    : "w-full py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] font-medium hover:bg-[#c7ad80]/30 disabled:opacity-50";

  useEffect(() => {
    let mounted = true;
    adminCheck()
      .then((data) => {
        if (mounted && data?.ok && data?.admin) navigate("/admin");
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await adminLogin(login.trim(), password);
      if (data.accessToken) {
        useAuthStore.getState().setAccessToken(data.accessToken);
        await useAdminStore.getState().checkAdmin();
        const go = navigateNoReload ?? navigate;
        const chars = await listCharacters();
        if (chars.length === 0) {
          go("/register");
          return;
        }
        useCharacterStore.getState().setCharacterId(chars[0].id);
        const hero = await loadHeroFromAPI();
        if (hero) useHeroStore.getState().setHero(hero);
        if (hardReloadOnceAfterAuth("/city")) return;
        go("/city");
      } else {
        navigate("/admin");
      }
    } catch (err: any) {
      if (err?.status === 401) {
        setError("Невірний логін або пароль");
      } else {
        setError(err?.message || "Помилка входу");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className={pageShell}>
        <div className={isL2 ? "text-[#c9a44c] text-sm" : "text-[#c7ad80]"}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={pageShell}>
      <div className={cardShell}>
        <h1 className={titleClass}>Вхід в адмін-панель</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="admin-login">
              Логін
            </label>
            <input
              id="admin-login"
              name="admin-login"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className={inputClass}
              placeholder="Existence"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="admin-password">
              Пароль
            </label>
            <input
              id="admin-password"
              name="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className={submitClass}>
            {loading ? "Вхід..." : "Увійти"}
          </button>
        </form>
      </div>
    </div>
  );
}
