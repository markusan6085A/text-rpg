import React, { useState } from "react";

interface LandingProps {
  navigate: (path: string) => void;
  onLogin: (hero: any) => void;
}

export default function Landing({ navigate, onLogin }: LandingProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // -----------------------------------------
  // ПРАВИЛЬНА ПЕРЕВІРКА ЛОГІНУ / ПАРОЛЯ
  // -----------------------------------------
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const nick = username.trim();
    const pass = password.trim();

    if (!nick || !pass) {
      alert("Введите логин и пароль");
      return;
    }

    // 1. Читаємо аккаунти
    const accounts = JSON.parse(localStorage.getItem("l2_accounts_v2") || "[]");

    // 2. Шукаємо користувача
    const acc = accounts.find((a: any) => a.username === nick);

    if (!acc) {
      alert("Аккаунт не найден");
      return;
    }

    // 3. Перевірка пароля
    if (acc.password !== pass) {
      alert("Неверный пароль");
      return;
    }

    // 4. Якщо все ок → передаємо героя у App.tsx
    if (!acc.hero) {
      alert("Ошибка: у аккаунта нет героя");
      return;
    }

    onLogin(acc.hero);
  };

  // -----------------------------------------

  return (
    <div className="min-h-screen bg-black flex justify-center p-4">
      <div className="w-full max-w-[380px] l2-frame space-y-4 text-center">

        {/* Картинка */}
        <img
          src="/landing-hero.jpg"
          className="w-full rounded"
          alt="Lineage 2"
        />

        <button className="l2-btn mt-2" onClick={() => navigate("/register")}>
          Начать игру
        </button>

        {/* Логин форма */}
        <form onSubmit={handleLogin} className="space-y-3 mt-2 text-center">

          <div className="text-sm text-white">Ник:</div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="l2-input"
          />

          <div className="text-sm text-white mt-1">Пароль:</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="l2-input"
          />

          <button type="submit" className="l2-btn mt-3">
            Войти в игру
          </button>
        </form>

        <button className="l2-btn mt-2" onClick={() => navigate("/register")}>
          Регистрация
        </button>

        <button className="l2-btn mt-2" onClick={() => navigate("/about")}>
          Об игре
        </button>

        <button className="l2-btn mt-2" onClick={() => alert("Недоступно")}>
          Забыли пароль?
        </button>
      </div>
    </div>
  );
}
