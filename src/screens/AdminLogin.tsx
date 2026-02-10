import React, { useState, useEffect } from "react";
import { adminLogin, adminMe } from "../utils/api";
import { useAuthStore } from "../state/authStore";

interface AdminLoginProps {
  navigate: (path: string) => void;
}

export default function AdminLogin({ navigate }: AdminLoginProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    adminMe()
      .then(() => navigate("/admin"))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await adminLogin(login.trim(), password);
      if (data.accessToken) {
        useAuthStore.getState().setAccessToken(data.accessToken);
        navigate("/");
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
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-[#c7ad80]">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-[#c7ad80]/40 bg-[#252525] p-6 shadow-lg">
        <h1 className="text-xl font-bold text-[#c7ad80] mb-4 text-center">Вхід в адмін-панель</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#c7ad80]/80 mb-1">Логін</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white placeholder-gray-500 focus:outline-none focus:border-[#c7ad80]"
              placeholder="Existence"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#c7ad80]/80 mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-black/40 border border-[#c7ad80]/40 text-white placeholder-gray-500 focus:outline-none focus:border-[#c7ad80]"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-[#c7ad80]/20 border border-[#c7ad80]/60 text-[#c7ad80] font-medium hover:bg-[#c7ad80]/30 disabled:opacity-50"
          >
            {loading ? "Вхід..." : "Увійти"}
          </button>
        </form>
      </div>
    </div>
  );
}
